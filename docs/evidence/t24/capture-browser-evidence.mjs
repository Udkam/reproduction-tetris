import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const origin = process.argv[2] ?? 'http://127.0.0.1:5178';
const output = path.resolve('docs/evidence/t24');
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
fs.mkdirSync(output, { recursive: true });

const populatedLeaderboard = {
  version: 8,
  marathon: [],
  race: [
    { version: 8, mode: 'race', outcome: 'top-out', lines: 27, elapsedTicks: 5820, completedAt: '2026-08-01T12:00:00.000Z' },
    { version: 8, mode: 'race', outcome: 'top-out', lines: 19, elapsedTicks: 4380, completedAt: '2026-07-30T12:00:00.000Z' },
  ],
  sprint: [],
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

const prepare = async ({ language = 'en', leaderboard = null } = {}) => {
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(({ languageValue, leaderboardValue }) => {
    localStorage.clear();
    localStorage.setItem('tetramorph:language:v1', languageValue);
    localStorage.setItem('tetris:mode-rule-intros:v1', JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']));
    if (leaderboardValue) localStorage.setItem('tetris:leaderboard:v8', JSON.stringify(leaderboardValue));
  }, { languageValue: language, leaderboardValue: leaderboard });
  await page.reload({ waitUntil: 'networkidle' });
};

const enterMode = async (mode) => {
  await page.getByTestId(`enter-${mode}`).click();
  await page.waitForFunction(() => {
    const text = window.render_game_to_text?.();
    if (!text) return false;
    const state = JSON.parse(text);
    return state.screen === 'game' && state.countdown === null;
  }, null, { timeout: 8_000 });
};

const capture = async (name) => {
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
};

const auditVisibleText = async () => page.evaluate(() => {
  const visible = [...document.querySelectorAll('h1,h2,h3,p,strong,span,button,kbd,time,output,li')]
    .filter((element) => {
      const node = element;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0 && (node.textContent?.trim().length ?? 0) > 0;
    });
  const clipped = visible.filter((element) => {
    const node = element;
    const style = getComputedStyle(node);
    if (style.overflow === 'visible' && style.overflowX === 'visible' && style.overflowY === 'visible') return false;
    return node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1;
  }).map((element) => ({
    tag: element.tagName,
    className: element.className,
    text: element.textContent?.trim().slice(0, 100),
    client: [element.clientWidth, element.clientHeight],
    scroll: [element.scrollWidth, element.scrollHeight],
  }));
  const fonts = [...new Set(visible.map((element) => getComputedStyle(element).fontFamily))];
  const proseInDataFace = visible.filter((element) => {
    const node = element;
    if (!getComputedStyle(node).fontFamily.includes('IBM Plex Mono')) return false;
    if (node.matches('kbd,time,output,[data-data-role],.mode-gate__index,[data-stat-role] strong,.result-leaderboard__rank')) return false;
    return /[A-Za-z]{4,}/.test(node.textContent ?? '');
  }).map((element) => ({ tag: element.tagName, className: element.className, text: element.textContent?.trim().slice(0, 100) }));
  const root = document.documentElement;
  const settings = document.querySelector('[data-testid="settings-sheet"]');
  return {
    viewport: { width: innerWidth, height: innerHeight },
    document: { clientWidth: root.clientWidth, clientHeight: root.clientHeight, scrollWidth: root.scrollWidth, scrollHeight: root.scrollHeight },
    settings: settings ? {
      clientWidth: settings.clientWidth,
      clientHeight: settings.clientHeight,
      scrollWidth: settings.scrollWidth,
      scrollHeight: settings.scrollHeight,
    } : null,
    clipped,
    fonts,
    proseInDataFace,
    canvasCount: document.querySelectorAll('canvas').length,
    domCellCount: document.querySelectorAll('[data-game-cell]').length,
  };
});

const states = {};

await prepare({ language: 'en' });
await capture('home-en');
states.homeEn = await auditVisibleText();
await page.getByTestId('enter-puzzle').click();
await page.getByTestId('puzzle-library').waitFor({ state: 'visible' });
await capture('puzzle-en');
states.puzzleEn = await auditVisibleText();

await prepare({ language: 'en', leaderboard: populatedLeaderboard });
await enterMode('race');
await page.keyboard.press('KeyS');
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
await capture('settings-en-desktop');
states.settingsEnDesktopPopulated = await auditVisibleText();
if (!(await page.getByTestId('settings-leaderboard').textContent()).includes('1m 37s')) {
  throw new Error('Populated Survival records were not rendered in English Settings.');
}
await page.getByTestId('language-zh').click();
await capture('settings-zh-desktop');
states.settingsZhDesktopPopulated = await auditVisibleText();

await page.getByTestId('language-en').click();
await page.setViewportSize({ width: 720, height: 960 });
await capture('settings-en-portrait');
states.settingsEnPortrait = await auditVisibleText();
await page.setViewportSize({ width: 1024, height: 500 });
await capture('settings-en-short');
states.settingsEnShort = await auditVisibleText();

await page.setViewportSize({ width: 1440, height: 900 });
await page.keyboard.press('Escape');
await page.keyboard.press('KeyP');
await page.getByRole('dialog', { name: 'Paused' }).waitFor({ state: 'visible' });
const keyboardPath = [];
keyboardPath.push(await page.evaluate(() => document.activeElement?.textContent?.trim() ?? ''));
await page.keyboard.press('Tab');
keyboardPath.push(await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? ''));
await page.keyboard.press('Tab');
keyboardPath.push(await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? ''));
await capture('pause-topbar-actions');
states.pause = await auditVisibleText();
await page.keyboard.press('Escape');
await page.getByRole('dialog', { name: 'Leave this run?' }).waitFor({ state: 'visible' });
const escapeOpenedLeave = true;
await page.keyboard.press('Escape');
await page.getByRole('dialog', { name: 'Paused' }).waitFor({ state: 'visible' });
await page.getByTestId('open-settings').click();
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
const settingsFromPause = true;
await page.keyboard.press('Escape');

await prepare({ language: 'en' });
for (const mode of ['marathon', 'race', 'sprint']) {
  await prepare({ language: 'en' });
  await enterMode(mode);
  states[`${mode}Game`] = await auditVisibleText();
}

await prepare({ language: 'en' });
await enterMode('marathon');
await page.keyboard.press('KeyS');
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
states.settingsEnEmpty = await auditVisibleText();
if (!(await page.getByTestId('settings-leaderboard').textContent()).includes('No records yet')) {
  throw new Error('Empty English Settings record state was not rendered.');
}
await page.keyboard.press('Escape');
await page.getByTestId('exit-game').click();
await page.getByRole('dialog', { name: 'Leave this run?' }).getByRole('button', { name: 'Back to home' }).click();
await page.getByTestId('mode-home').waitFor({ state: 'visible' });
const cleanup = await page.evaluate(() => ({
  canvasCount: document.querySelectorAll('canvas').length,
  domCellCount: document.querySelectorAll('[data-game-cell]').length,
  hasTextHook: typeof window.render_game_to_text === 'function',
  hasQaHook: typeof window.__TETRIS_D4_QA__ === 'object',
}));

const audit = {
  sourceSha,
  capturedAt: new Date().toISOString(),
  origin,
  browser: await browser.version(),
  states,
  keyboard: { path: keyboardPath, expected: ['Continue', 'exit-game', 'open-settings'], escapeOpenedLeave, settingsFromPause },
  cleanup,
  errors,
};
fs.writeFileSync(path.join(output, 'audit.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
await browser.close();

const failures = Object.entries(states).flatMap(([name, state]) => [
  ...state.clipped.map((item) => `${name}: clipped ${item.text}`),
  ...state.proseInDataFace.map((item) => `${name}: prose in data face ${item.text}`),
  ...(state.canvasCount > 1 ? [`${name}: ${state.canvasCount} canvases`] : []),
  ...(state.domCellCount > 0 ? [`${name}: ${state.domCellCount} DOM board cells`] : []),
  ...(state.document.scrollWidth > state.document.clientWidth ? [`${name}: horizontal document overflow`] : []),
  ...(state.settings && state.settings.scrollWidth > state.settings.clientWidth ? [`${name}: horizontal settings overflow`] : []),
]);
if (keyboardPath.join('|') !== 'Continue|exit-game|open-settings') failures.push(`keyboard path: ${keyboardPath.join('|')}`);
if (cleanup.canvasCount !== 0 || cleanup.domCellCount !== 0 || cleanup.hasTextHook || cleanup.hasQaHook) failures.push(`cleanup: ${JSON.stringify(cleanup)}`);
if (errors.length > 0) failures.push(...errors.map((error) => `console: ${error}`));
if (failures.length > 0) throw new Error(failures.join('\n'));
