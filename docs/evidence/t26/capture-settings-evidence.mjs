import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const origin = process.argv[2] ?? 'http://127.0.0.1:4186';
const output = path.resolve('docs/evidence/t26');
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
fs.mkdirSync(output, { recursive: true });

const leaderboard = {
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

const prepare = async (language = 'en') => {
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(({ languageValue, records }) => {
    localStorage.clear();
    localStorage.setItem('tetramorph:language:v1', languageValue);
    localStorage.setItem('tetramorph:mode-rule-intros:v1', JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']));
    localStorage.setItem('tetramorph:leaderboard:v8', JSON.stringify(records));
  }, { languageValue: language, records: leaderboard });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
};

const enterMode = async (mode) => {
  await page.getByTestId(`enter-${mode}`).click();
  await page.getByTestId('game-screen').waitFor({ state: 'visible' });
  await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 8_000 });
};

const capture = async (name) => {
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
};

const audit = async () => page.evaluate(() => {
  const selector = 'h1,h2,h3,p,strong,span,button,kbd,time,output,li';
  const visible = [...document.querySelectorAll(selector)].filter((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== 'hidden'
      && style.display !== 'none'
      && rect.width > 0
      && rect.height > 0
      && (element.textContent?.trim().length ?? 0) > 0;
  });
  const clipped = visible.filter((element) => {
    const style = getComputedStyle(element);
    if (style.overflow === 'visible' && style.overflowX === 'visible' && style.overflowY === 'visible') return false;
    return element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
  }).map((element) => ({
    tag: element.tagName,
    className: element.className,
    text: element.textContent?.trim().slice(0, 100),
    client: [element.clientWidth, element.clientHeight],
    scroll: [element.scrollWidth, element.scrollHeight],
  }));
  const settings = document.querySelector('[data-testid="settings-sheet"]');
  const settingsText = settings
    ? visible.filter((element) => settings.contains(element) && !element.querySelector(selector))
    : [];
  const overlaps = [];
  const textRect = (element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect();
  };
  for (let index = 0; index < settingsText.length; index += 1) {
    const left = settingsText[index];
    const leftRect = textRect(left);
    for (let nextIndex = index + 1; nextIndex < settingsText.length; nextIndex += 1) {
      const right = settingsText[nextIndex];
      if (left.contains(right) || right.contains(left)) continue;
      const rightRect = textRect(right);
      const width = Math.min(leftRect.right, rightRect.right) - Math.max(leftRect.left, rightRect.left);
      const height = Math.min(leftRect.bottom, rightRect.bottom) - Math.max(leftRect.top, rightRect.top);
      if (width > 2 && height > 2) overlaps.push([left.textContent?.trim(), right.textContent?.trim()]);
    }
  }
  const wrongEnglishFace = visible.filter((element) => {
    if (!/[A-Za-z]{2,}/.test(element.textContent ?? '')) return false;
    if (element.closest('.brand, .mode-home-wordmark')) return false;
    return getComputedStyle(element).fontFamily.includes('Playwrite');
  }).map((element) => element.textContent?.trim().slice(0, 100));
  const dataElements = visible.filter((element) => element.matches('kbd,time,output,[data-stat-role] strong,[data-record-field]'));
  const wrongDataFace = dataElements.filter((element) => !getComputedStyle(element).fontFamily.includes('Geist Mono'))
    .map((element) => ({ text: element.textContent?.trim().slice(0, 100), font: getComputedStyle(element).fontFamily }));
  const root = document.documentElement;
  return {
    viewport: [innerWidth, innerHeight],
    document: [root.clientWidth, root.scrollWidth, root.clientHeight, root.scrollHeight],
    settings: settings ? [settings.clientWidth, settings.scrollWidth, settings.clientHeight, settings.scrollHeight] : null,
    clipped,
    overlaps,
    wrongEnglishFace,
    wrongDataFace,
    fonts: [...new Set(visible.map((element) => getComputedStyle(element).fontFamily))],
    canvasCount: document.querySelectorAll('canvas').length,
    domCellCount: document.querySelectorAll('[data-game-cell]').length,
  };
});

const states = {};
await prepare('en');
await capture('home-en');
states.homeEn = await audit();

await enterMode('race');
await page.keyboard.press('KeyS');
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
await capture('settings-en-settings');
states.settingsEnSettings = await audit();

await page.getByTestId('settings-tab-controls').click();
await capture('settings-en-controls');
states.settingsEnControls = await audit();

await page.getByTestId('settings-tab-rules').click();
await capture('settings-en-rules');
states.settingsEnRules = await audit();
if (!(await page.getByTestId('settings-leaderboard').textContent()).includes('1m 37s')) {
  throw new Error('English Survival records were not rendered on the Rules tab.');
}

await page.getByTestId('settings-tab-settings').click();
await page.getByTestId('language-zh').click();
await capture('settings-zh-settings');
states.settingsZhSettings = await audit();

await page.getByTestId('language-en').click();
await page.setViewportSize({ width: 720, height: 960 });
await page.getByTestId('settings-tab-controls').click();
await capture('settings-en-portrait-controls');
states.settingsEnPortraitControls = await audit();

await page.setViewportSize({ width: 1024, height: 500 });
await page.getByTestId('settings-tab-rules').click();
await capture('settings-en-short-rules');
states.settingsEnShortRules = await audit();

await page.setViewportSize({ width: 1440, height: 900 });
await page.keyboard.press('Escape');
await page.keyboard.press('KeyP');
await page.getByRole('dialog', { name: 'Paused' }).waitFor({ state: 'visible' });
const pauseHitTest = await page.evaluate(() => {
  const hit = (selector) => {
    const control = document.querySelector(selector);
    if (!control) return false;
    const rect = control.getBoundingClientRect();
    const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return target === control || control.contains(target);
  };
  return { back: hit('[data-testid="exit-game"]'), settings: hit('[data-testid="open-settings"]') };
});
await capture('pause-topbar-hit-targets');
states.pause = await audit();
await page.getByTestId('open-settings').click();
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
const settingsOpenedFromPause = true;
await page.keyboard.press('Escape');
await page.keyboard.press('KeyP');
await page.getByRole('dialog', { name: 'Paused' }).waitFor({ state: 'visible' });
await page.getByTestId('exit-game').click();
await page.getByRole('dialog', { name: 'Leave this run?' }).waitFor({ state: 'visible' });
const backOpenedFromPause = true;

await prepare('en');
await enterMode('sprint');
await capture('mutation-en-data');
states.mutationEnData = await audit();

const result = {
  sourceSha,
  capturedAt: new Date().toISOString(),
  origin,
  browser: await browser.version(),
  states,
  pauseHitTest,
  settingsOpenedFromPause,
  backOpenedFromPause,
  errors,
};
fs.writeFileSync(path.join(output, 'audit.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
await browser.close();

const failures = Object.entries(states).flatMap(([name, state]) => [
  ...state.clipped.map((item) => `${name}: clipped ${item.text}`),
  ...state.overlaps.map((item) => `${name}: overlapping ${item.join(' / ')}`),
  ...state.wrongEnglishFace.map((item) => `${name}: Playwrite leaked into UI ${item}`),
  ...state.wrongDataFace.map((item) => `${name}: wrong data face ${item.text} (${item.font})`),
  ...(state.canvasCount > 1 ? [`${name}: ${state.canvasCount} canvases`] : []),
  ...(state.domCellCount > 0 ? [`${name}: ${state.domCellCount} DOM board cells`] : []),
  ...(state.document[1] > state.document[0] ? [`${name}: horizontal document overflow`] : []),
  ...(state.settings && state.settings[1] > state.settings[0] ? [`${name}: horizontal settings overflow`] : []),
]);
if (!pauseHitTest.back || !pauseHitTest.settings || !settingsOpenedFromPause || !backOpenedFromPause) {
  failures.push(`pause hit test: ${JSON.stringify({ pauseHitTest, settingsOpenedFromPause, backOpenedFromPause })}`);
}
if (errors.length > 0) failures.push(...errors.map((error) => `console: ${error}`));
if (failures.length > 0) throw new Error(failures.join('\n'));
