import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const origin = process.argv[2] ?? 'http://127.0.0.1:4192';
const output = path.resolve('docs/evidence/t26/phase-f');
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const scenarios = JSON.parse(fs.readFileSync(path.resolve('docs/evidence/t26/phase-d/mutation-scenarios.json'), 'utf8'));
fs.mkdirSync(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

await page.addInitScript(() => {
  if (typeof Crypto === 'undefined') return;
  const original = Crypto.prototype.getRandomValues;
  Crypto.prototype.getRandomValues = function deterministicQaSeed(array) {
    if (array instanceof Uint32Array && array.length === 1) {
      let seed = 1;
      try {
        seed = Number(globalThis.localStorage?.getItem('tetramorph:qa-seed') ?? 1) >>> 0;
      } catch {
        // about:blank has no local-storage origin.
      }
      array[0] = seed || 1;
      return array;
    }
    return original.call(this, array);
  };
});

const prepare = async ({ seed = 1, language = 'en' } = {}) => {
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(({ seedValue, languageValue }) => {
    localStorage.clear();
    localStorage.setItem('tetramorph:qa-seed', String(seedValue));
    localStorage.setItem('tetramorph:language:v1', languageValue);
    localStorage.setItem('tetramorph:reduced-motion:v1', 'off');
    localStorage.setItem('tetramorph:mode-rule-intros:v1', JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']));
  }, { seedValue: seed, languageValue: language });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
};

const enterLiveMode = async (mode) => {
  await page.getByTestId(`enter-${mode}`).click();
  await page.getByTestId('game-screen').waitFor({ state: 'visible' });
  await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
  await page.evaluate(() => window.__TETRAMORPH_QA__?.setFrozen(true));
};

const qaState = () => page.evaluate(() => window.__TETRAMORPH_QA__?.getState());
const rendererSnapshot = () => page.evaluate(() => window.__TETRAMORPH_QA__?.getRendererSnapshot());
const qaActions = (actions) => page.evaluate((values) => {
  const qa = window.__TETRAMORPH_QA__;
  if (!qa) throw new Error('Missing TetraMorph QA surface.');
  for (const action of values) qa.action(action);
}, actions);
const advanceTicks = (ticks) => page.evaluate((count) => {
  const qa = window.__TETRAMORPH_QA__;
  if (!qa) throw new Error('Missing TetraMorph QA surface.');
  qa.advanceTicks(count);
}, ticks);
const advanceUntil = (condition, argument, maxTicks = 120) => page.evaluate(({ conditionValue, argumentValue, maxTicksValue }) => {
  const qa = window.__TETRAMORPH_QA__;
  if (!qa) throw new Error('Missing TetraMorph QA surface.');
  for (let tick = 0; tick <= maxTicksValue; tick += 1) {
    const state = qa.getState();
    const matches = conditionValue === 'active'
      ? state.active !== null && state.status === 'playing'
      : conditionValue === 'last-item'
        ? state.mutationLastItem === argumentValue
        : conditionValue === 'lines'
          ? state.lines >= argumentValue
          : false;
    if (matches) return { state, ticks: tick };
    qa.advanceTicks(1);
  }
  throw new Error(`Condition ${conditionValue}:${argumentValue ?? ''} did not resolve.`);
}, { conditionValue: condition, argumentValue: argument, maxTicksValue: maxTicks });

const playAndSpawn = async (actions) => {
  await qaActions(actions);
  return advanceUntil('active', null, 120);
};

const visualAudit = () => page.evaluate(() => {
  const textSelector = 'h1,h2,h3,p,strong,span,button,kbd,time,output,li,b,small,em,label';
  const visible = [...document.querySelectorAll(textSelector)].filter((element) => {
    if (element.closest('.sr-only,[aria-hidden="true"]')) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== 'hidden'
      && style.display !== 'none'
      && Number.parseFloat(style.opacity) > 0
      && rect.width > 0
      && rect.height > 0
      && rect.bottom > 0
      && rect.top < innerHeight
      && (element.textContent?.trim().length ?? 0) > 0;
  });
  const clipped = visible.filter((element) => {
    const style = getComputedStyle(element);
    if (style.overflow === 'visible' && style.overflowX === 'visible' && style.overflowY === 'visible') return false;
    return element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
  }).map((element) => ({
    text: element.textContent?.trim().slice(0, 100),
    client: [element.clientWidth, element.clientHeight],
    scroll: [element.scrollWidth, element.scrollHeight],
  }));
  const dataElements = [...document.querySelectorAll('kbd,time,output,[data-stat-role] strong,[data-record-field],.entry-countdown__digit,.puzzle-gallery__best')]
    .filter((element) => element.getBoundingClientRect().width > 0);
  const wrongDataFace = dataElements.filter((element) => !/Geist Mono/i.test(getComputedStyle(element).fontFamily))
    .map((element) => ({ text: element.textContent?.trim(), font: getComputedStyle(element).fontFamily }));
  const englishUiLeaks = visible.filter((element) => {
    if (element.querySelector(textSelector)) return false;
    if (!/[A-Za-z]{2,}/.test(element.textContent ?? '')) return false;
    if (element.closest('[data-testid="brand"],.brand,.mode-home-wordmark')) return false;
    if (dataElements.includes(element)) return false;
    return !/Space Grotesk/i.test(getComputedStyle(element).fontFamily);
  }).map((element) => ({ text: element.textContent?.trim(), font: getComputedStyle(element).fontFamily }));
  const root = document.documentElement;
  const next = document.querySelector('[data-testid="next-slot"]');
  return {
    viewport: [innerWidth, innerHeight],
    document: [root.clientWidth, root.scrollWidth, root.clientHeight, root.scrollHeight],
    clipped,
    wrongDataFace,
    englishUiLeaks,
    canvasCount: document.querySelectorAll('canvas').length,
    domCellCount: document.querySelectorAll('[data-game-cell]').length,
    nextVisible: next ? Boolean(next.getBoundingClientRect().width && next.getBoundingClientRect().height) : null,
    wordmarkCount: document.querySelectorAll('.mode-home-wordmark').length,
    modeCardCount: document.querySelectorAll('[data-testid^="enter-"]').length,
    settingsPanelCount: document.querySelectorAll('[role="tabpanel"]:not([hidden])').length,
  };
});

const states = {};
const capture = async (name, extra = {}) => {
  await page.waitForTimeout(80);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
  states[name] = { ...await visualAudit(), ...extra };
};

await prepare({ seed: 11 });
await capture('home');

await enterLiveMode('marathon');
for (const actions of scenarios.multiplier.actions) {
  await qaActions(actions);
  if ((await qaState())?.active === null) await advanceUntil('active', null, 120).catch(() => null);
}
const classic = await advanceUntil('lines', 1, 120);
await capture('classic', { lines: classic.state.lines, score: classic.state.score });

await page.getByTestId('open-settings').click();
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
await capture('settings');

await prepare({ seed: 0x51a1f00d });
await enterLiveMode('race');
let survival = null;
for (let piece = 0; piece < 8; piece += 1) {
  const horizontal = piece % 3 === 0 ? ['left', 'left', 'left'] : piece % 3 === 1 ? ['right', 'right', 'right'] : [];
  await qaActions([...horizontal, 'hard-drop']);
  await advanceUntil('active', null, 120);
  const renderer = await rendererSnapshot();
  if (renderer.survivalDebrisWarningColumns.length > 0) {
    survival = { piece: piece + 1, renderer, state: await qaState() };
    break;
  }
}
if (!survival) throw new Error('Survival danger state was not reached.');
await capture('survival-danger', {
  warningColumns: survival.renderer.survivalDebrisWarningColumns,
  warningTicks: survival.state.survivalDebrisWarningTicks,
});

const bomb = scenarios.bomb;
await prepare({ seed: bomb.seed });
await enterLiveMode('sprint');
await playAndSpawn(bomb.actions[0]);
await playAndSpawn(bomb.actions[1]);
await qaActions(bomb.actions[2].slice(0, -1));
await qaActions(['hard-drop']);
const bombState = await advanceUntil('last-item', 'bomb', 120);
await page.waitForFunction(() => {
  const activation = window.__TETRAMORPH_QA__?.getRendererSnapshot().mutationActivation;
  return activation?.item === 'bomb'
    && activation.phases.some((phase) => phase.id === 'impact' && phase.active);
}, undefined, { timeout: 2_000 });
const bombRenderer = await rendererSnapshot();
await capture('mutation-bomb', {
  item: bombState.state.mutationLastItem,
  phase: bombRenderer.mutationActivation?.phases.find((phase) => phase.active)?.id ?? null,
  particles: bombRenderer.mutationActiveParticleCount,
});

await prepare({ seed: 1 });
await page.getByTestId('enter-puzzle').click();
await page.getByTestId('puzzle-library').waitFor({ state: 'visible' });
await capture('puzzle-campaign', {
  tabs: await page.getByRole('tab').allTextContents(),
  lesson: await page.getByTestId('puzzle-lesson').textContent(),
});

await page.goto(origin, { waitUntil: 'networkidle' });
const cleanup = await page.evaluate(() => ({
  canvasCount: document.querySelectorAll('canvas').length,
  domCellCount: document.querySelectorAll('[data-game-cell]').length,
  qaGlobals: ['__TETRAMORPH_QA__', '__TETRAMORPH_LAYOUT_QA__', 'render_game_to_text'].filter((key) => key in window),
}));

const failures = Object.entries(states).flatMap(([name, state]) => [
  ...state.clipped.map((item) => `${name}: clipped ${item.text}`),
  ...state.wrongDataFace.map((item) => `${name}: wrong data face ${item.text} (${item.font})`),
  ...state.englishUiLeaks.map((item) => `${name}: wrong English UI face ${item.text} (${item.font})`),
  ...(state.document[1] > state.document[0] ? [`${name}: horizontal overflow`] : []),
  ...(state.domCellCount > 0 ? [`${name}: DOM board cells found`] : []),
]);
if (states.home.wordmarkCount !== 1 || states.home.modeCardCount !== 4 || states.home.canvasCount !== 0) {
  failures.push(`home composition failed: ${JSON.stringify(states.home)}`);
}
for (const name of ['classic', 'survival-danger', 'mutation-bomb']) {
  if (states[name].canvasCount !== 1 || states[name].nextVisible !== true) {
    failures.push(`${name}: expected one Canvas and visible Next.`);
  }
}
if (states.classic.lines < 1 || states.classic.score <= 0) failures.push('Classic showcase did not include a real clear.');
if (states['survival-danger'].warningTicks !== 48 || states['survival-danger'].warningColumns.length !== 1) {
  failures.push('Survival showcase did not capture the deterministic danger lead.');
}
if (states['mutation-bomb'].item !== 'bomb' || states['mutation-bomb'].phase !== 'impact') {
  failures.push('Mutation showcase did not capture Bomb impact.');
}
if (states.settings.settingsPanelCount !== 1) failures.push('Settings did not expose exactly one active panel.');
if (states['puzzle-campaign'].tabs.length !== 3 || !states['puzzle-campaign'].lesson) failures.push('Puzzle campaign curriculum is incomplete.');
if (cleanup.canvasCount !== 0 || cleanup.domCellCount !== 0 || cleanup.qaGlobals.length > 0) {
  failures.push(`cleanup failed: ${JSON.stringify(cleanup)}`);
}
if (errors.length > 0) failures.push(...errors.map((error) => `console: ${error}`));

const result = {
  sourceSha,
  capturedAt: new Date().toISOString(),
  origin,
  browser: await browser.version(),
  states,
  cleanup,
  errors,
  failures,
};
fs.writeFileSync(path.join(output, 'audit.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');

await browser.close();
if (failures.length > 0) throw new Error(failures.join('\n'));
