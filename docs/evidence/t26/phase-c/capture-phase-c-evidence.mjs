import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const origin = process.argv[2] ?? 'http://127.0.0.1:4189';
const output = path.resolve('docs/evidence/t26/phase-c');
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
fs.mkdirSync(output, { recursive: true });

const leaderboard = {
  version: 8,
  marathon: [
    { version: 8, mode: 'marathon', outcome: 'top-out', lines: 31, score: 7620, pieces: 92, elapsedTicks: 7200, chain: 0, completedAt: '2026-08-01T12:00:00.000Z' },
    { version: 8, mode: 'marathon', outcome: 'top-out', lines: 18, score: 3920, pieces: 61, elapsedTicks: 5400, chain: 0, completedAt: '2026-07-30T12:00:00.000Z' },
  ],
  race: [
    { version: 8, mode: 'race', outcome: 'top-out', lines: 27, elapsedTicks: 5820, completedAt: '2026-08-01T12:00:00.000Z' },
    { version: 8, mode: 'race', outcome: 'top-out', lines: 19, elapsedTicks: 4380, completedAt: '2026-07-30T12:00:00.000Z' },
  ],
  sprint: [
    { version: 8, mode: 'sprint', outcome: 'top-out', lines: 25, score: 12940, pieces: 79, elapsedTicks: 6600, chain: 0, completedAt: '2026-08-01T12:00:00.000Z' },
    { version: 8, mode: 'sprint', outcome: 'top-out', lines: 17, score: 8460, pieces: 55, elapsedTicks: 4800, chain: 0, completedAt: '2026-07-30T12:00:00.000Z' },
  ],
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

const prepare = async ({ language = 'en', viewport = { width: 1440, height: 900 }, reducedMotion = 'reduce' } = {}) => {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion });
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

const enterLiveMode = async (mode) => {
  await page.getByTestId(`enter-${mode}`).click();
  await page.getByTestId('game-screen').waitFor({ state: 'visible' });
  await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
};

const enterPuzzle = async () => {
  await page.getByTestId('enter-puzzle').click();
  await page.getByTestId('puzzle-library').waitFor({ state: 'visible' });
  await page.getByTestId('start-selected-puzzle').click();
  await page.getByTestId('game-screen').waitFor({ state: 'visible' });
  await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
};

const forceNaturalTopOut = async () => {
  for (let piece = 0; piece < 110; piece += 1) {
    if (await page.locator('.run-result').isVisible().catch(() => false)) return piece;
    await page.keyboard.press('Space');
    await page.waitForTimeout(55);
  }
  await page.locator('.run-result').waitFor({ state: 'visible', timeout: 4_000 });
  return 110;
};

const capture = async (name) => {
  await page.waitForTimeout(180);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
};

const audit = async () => page.evaluate(() => {
  const textSelector = 'h1,h2,h3,p,strong,span,button,kbd,time,output,li,b,small,em';
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
  const leaves = visible.filter((element) => !element.querySelector(textSelector));
  const clipped = visible.filter((element) => {
    const style = getComputedStyle(element);
    if (style.overflow === 'visible' && style.overflowX === 'visible' && style.overflowY === 'visible') return false;
    return element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
  }).map((element) => ({
    tag: element.tagName,
    className: String(element.className),
    text: element.textContent?.trim().slice(0, 100),
    client: [element.clientWidth, element.clientHeight],
    scroll: [element.scrollWidth, element.scrollHeight],
  }));

  const overlapRoot = document.querySelector('[data-testid="settings-sheet"], .run-result, [data-testid="side-rail"]');
  const overlapLeaves = overlapRoot ? leaves.filter((element) => overlapRoot.contains(element)) : [];
  const overlaps = [];
  const textRect = (element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect();
  };
  for (let index = 0; index < overlapLeaves.length; index += 1) {
    const left = overlapLeaves[index];
    const leftRect = textRect(left);
    for (let nextIndex = index + 1; nextIndex < overlapLeaves.length; nextIndex += 1) {
      const right = overlapLeaves[nextIndex];
      if (left.contains(right) || right.contains(left)) continue;
      const rightRect = textRect(right);
      const width = Math.min(leftRect.right, rightRect.right) - Math.max(leftRect.left, rightRect.left);
      const height = Math.min(leftRect.bottom, rightRect.bottom) - Math.max(leftRect.top, rightRect.top);
      if (width > 2 && height > 2) overlaps.push([left.textContent?.trim(), right.textContent?.trim()]);
    }
  }

  const legacyFaces = visible.filter((element) => /Barlow|Fira Code|IBM Plex Mono|JetBrains Mono|Caveat/i.test(getComputedStyle(element).fontFamily))
    .map((element) => ({ text: element.textContent?.trim().slice(0, 100), font: getComputedStyle(element).fontFamily }));
  const playwriteLeaks = leaves.filter((element) => {
    if (!/[A-Za-z]{2,}/.test(element.textContent ?? '')) return false;
    if (element.closest('[data-testid="brand"],.mode-home-wordmark')) return false;
    return /Playwrite/i.test(getComputedStyle(element).fontFamily);
  }).map((element) => element.textContent?.trim().slice(0, 100));
  const dataElements = [...document.querySelectorAll('kbd,time,output,[data-stat-role] strong,[data-record-field],.result-leaderboard li > b,.result-leaderboard__run strong,.run-result__metric strong,.entry-countdown__digit')]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    });
  const wrongDataFace = dataElements.filter((element) => !/Geist Mono/i.test(getComputedStyle(element).fontFamily))
    .map((element) => ({ text: element.textContent?.trim().slice(0, 100), font: getComputedStyle(element).fontFamily }));
  const root = document.documentElement;
  const settings = document.querySelector('[data-testid="settings-sheet"]');
  const next = document.querySelector('[data-testid="next-slot"]');
  return {
    viewport: [innerWidth, innerHeight],
    document: [root.clientWidth, root.scrollWidth, root.clientHeight, root.scrollHeight],
    settings: settings ? [settings.clientWidth, settings.scrollWidth, settings.clientHeight, settings.scrollHeight] : null,
    clipped,
    overlaps,
    legacyFaces,
    playwriteLeaks,
    wrongDataFace,
    fonts: [...new Set(visible.map((element) => getComputedStyle(element).fontFamily))],
    canvasCount: document.querySelectorAll('canvas').length,
    domCellCount: document.querySelectorAll('[data-game-cell]').length,
    nextVisible: next ? Boolean(next.getBoundingClientRect().width && next.getBoundingClientRect().height) : null,
    nextLabel: next?.getAttribute('aria-label') ?? null,
    reducedMotion: document.querySelector('.app')?.getAttribute('data-reduced-motion') ?? null,
  };
});

const states = {};
const saveState = async (name, { screenshot = false } = {}) => {
  if (screenshot) await capture(name);
  states[name] = await audit();
};

await prepare({ language: 'en', reducedMotion: 'reduce' });
await saveState('home-en', { screenshot: true });
await enterLiveMode('race');
await saveState('hud-en-survival', { screenshot: true });

await page.keyboard.press('KeyS');
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
const inheritedMotion = await page.evaluate(() => ({
  root: document.querySelector('.app')?.getAttribute('data-reduced-motion'),
  stored: localStorage.getItem('tetramorph:reduced-motion:v1'),
  pressed: document.querySelector('[data-testid="reduced-motion-toggle"]')?.getAttribute('aria-pressed'),
}));
await saveState('settings-en-settings', { screenshot: true });

await page.getByTestId('reduced-motion-toggle').click();
const explicitFullMotion = await page.evaluate(() => ({
  root: document.querySelector('.app')?.getAttribute('data-reduced-motion'),
  stored: localStorage.getItem('tetramorph:reduced-motion:v1'),
  animation: getComputedStyle(document.querySelector('.settings-console__panel')).animationName,
}));
await page.getByTestId('reduced-motion-toggle').click();
const explicitReducedMotion = await page.evaluate(() => ({
  root: document.querySelector('.app')?.getAttribute('data-reduced-motion'),
  stored: localStorage.getItem('tetramorph:reduced-motion:v1'),
  animation: getComputedStyle(document.querySelector('.settings-console__panel')).animationName,
}));

await page.getByTestId('settings-tab-controls').click();
const controlsOrder = await page.getByTestId('settings-shortcuts').evaluate((element) => ({
  gameplayTop: element.querySelector('[data-testid="keyboard-gameplay"]')?.getBoundingClientRect().top,
  shortcutsTop: element.querySelector('[data-testid="keyboard-shortcuts"]')?.getBoundingClientRect().top,
  touch: element.querySelector('[data-testid="touch-guidance"]')?.textContent?.trim(),
}));
await saveState('settings-en-controls', { screenshot: true });

await page.getByTestId('settings-tab-rules').click();
await saveState('settings-en-rules', { screenshot: true });
const englishLeaderboard = await page.getByTestId('settings-leaderboard').textContent();

await page.getByTestId('settings-tab-settings').click();
await page.getByTestId('language-zh').click();
await saveState('settings-zh-settings', { screenshot: true });
await page.getByTestId('settings-tab-controls').click();
await saveState('settings-zh-controls');
await page.getByTestId('settings-tab-rules').click();
await saveState('settings-zh-rules', { screenshot: true });

await page.getByTestId('settings-tab-settings').click();
await page.getByTestId('language-en').click();
await page.setViewportSize({ width: 390, height: 844 });
await page.getByTestId('settings-tab-controls').click();
await saveState('settings-en-portrait-controls', { screenshot: true });
await page.setViewportSize({ width: 844, height: 390 });
await page.getByTestId('settings-tab-rules').click();
await saveState('settings-en-short-rules', { screenshot: true });

await page.setViewportSize({ width: 1440, height: 900 });
await page.keyboard.press('Escape');
await page.keyboard.press('KeyP');
await page.getByRole('dialog', { name: 'Paused' }).waitFor({ state: 'visible' });
const pauseGeometry = await page.evaluate(() => {
  const rect = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
  };
  const hit = (selector) => {
    const control = document.querySelector(selector);
    if (!control) return false;
    const box = control.getBoundingClientRect();
    const target = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return target === control || control.contains(target);
  };
  const overlap = (left, right) => left && right
    ? Math.min(left.right, right.right) - Math.max(left.left, right.left) > 1
      && Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 1
    : false;
  const sheet = rect('[data-testid="action-sheet-backdrop"] .action-sheet');
  const next = rect('[data-testid="next-slot"]');
  return {
    backHit: hit('[data-testid="exit-game"]'),
    settingsHit: hit('[data-testid="open-settings"]'),
    sheet,
    next,
    sheetOverlapsNext: overlap(sheet, next),
  };
});
await saveState('pause-en', { screenshot: true });
await page.getByTestId('open-settings').click();
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
const settingsOpenedFromPause = true;
await page.keyboard.press('Escape');
await page.keyboard.press('KeyP');
await page.getByRole('dialog', { name: 'Paused' }).waitFor({ state: 'visible' });
await page.getByTestId('exit-game').click();
await page.getByRole('dialog', { name: 'Leave this run?' }).waitFor({ state: 'visible' });
const backOpenedFromPause = true;
await saveState('leave-en', { screenshot: true });

const matrix = [];
for (const language of ['en', 'zh-CN']) {
  for (const mode of ['marathon', 'race', 'sprint']) {
    await prepare({ language, reducedMotion: 'no-preference' });
    await enterLiveMode(mode);
    const hudName = `hud-${language === 'en' ? 'en' : 'zh'}-${mode}`;
    await saveState(hudName, { screenshot: (language === 'en' && mode === 'sprint') || (language === 'zh-CN' && mode === 'marathon') });
    await page.keyboard.press('KeyS');
    await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
    await page.getByTestId('settings-tab-rules').click();
    const rulesName = `rules-${language === 'en' ? 'en' : 'zh'}-${mode}`;
    await saveState(rulesName);
    await page.keyboard.press('Escape');
    const piecesToTopOut = await forceNaturalTopOut();
    const resultName = `result-${language === 'en' ? 'en' : 'zh'}-${mode}`;
    await saveState(resultName, { screenshot: (language === 'en' && mode === 'sprint') || (language === 'zh-CN' && mode === 'race') });
    matrix.push({ language, mode, piecesToTopOut });
  }
}

for (const language of ['en', 'zh-CN']) {
  await prepare({ language, reducedMotion: 'reduce' });
  await enterPuzzle();
  await saveState(`hud-${language === 'en' ? 'en' : 'zh'}-puzzle`, { screenshot: language === 'zh-CN' });
}

await page.goto(origin, { waitUntil: 'networkidle' });
const cleanup = await page.evaluate(() => ({
  canvasCount: document.querySelectorAll('canvas').length,
  domCellCount: document.querySelectorAll('[data-game-cell]').length,
  qaGlobals: ['__TETRAMORPH_QA__', '__TETRAMORPH_LAYOUT_QA__', 'render_game_to_text']
    .filter((key) => key in window),
}));

const result = {
  sourceSha,
  capturedAt: new Date().toISOString(),
  origin,
  browser: await browser.version(),
  inheritedMotion,
  explicitFullMotion,
  explicitReducedMotion,
  controlsOrder,
  englishLeaderboard,
  pauseGeometry,
  settingsOpenedFromPause,
  backOpenedFromPause,
  matrix,
  cleanup,
  states,
  errors,
};
fs.writeFileSync(path.join(output, 'audit.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
await browser.close();

const failures = Object.entries(states).flatMap(([name, state]) => [
  ...state.clipped.map((item) => `${name}: clipped ${item.text}`),
  ...state.overlaps.map((item) => `${name}: overlapping ${item.join(' / ')}`),
  ...state.legacyFaces.map((item) => `${name}: legacy font ${item.text} (${item.font})`),
  ...state.playwriteLeaks.map((item) => `${name}: Playwrite leaked into UI ${item}`),
  ...state.wrongDataFace.map((item) => `${name}: wrong data face ${item.text} (${item.font})`),
  ...(state.canvasCount > 1 ? [`${name}: ${state.canvasCount} canvases`] : []),
  ...(state.domCellCount > 0 ? [`${name}: ${state.domCellCount} DOM board cells`] : []),
  ...(state.document[1] > state.document[0] ? [`${name}: horizontal document overflow`] : []),
  ...(state.settings && state.settings[1] > state.settings[0] ? [`${name}: horizontal settings overflow`] : []),
  ...(name.startsWith('hud-') && state.canvasCount !== 1 ? [`${name}: expected one canvas, got ${state.canvasCount}`] : []),
  ...(name.startsWith('hud-') && state.nextVisible !== true ? [`${name}: Next is not visible`] : []),
  ...((name === 'pause-en' || name === 'leave-en') && !state.nextLabel?.includes(':')
    ? [`${name}: Next queue label is missing (${state.nextLabel})`] : []),
]);
if (JSON.stringify(inheritedMotion) !== JSON.stringify({ root: 'true', stored: null, pressed: 'true' })) {
  failures.push(`OS motion inheritance: ${JSON.stringify(inheritedMotion)}`);
}
if (explicitFullMotion.root !== 'false' || explicitFullMotion.stored !== 'off' || explicitFullMotion.animation === 'none') {
  failures.push(`explicit full motion: ${JSON.stringify(explicitFullMotion)}`);
}
if (explicitReducedMotion.root !== 'true' || explicitReducedMotion.stored !== 'on' || explicitReducedMotion.animation !== 'none') {
  failures.push(`explicit reduced motion: ${JSON.stringify(explicitReducedMotion)}`);
}
if (!controlsOrder.touch || !controlsOrder.gameplayTop || !controlsOrder.shortcutsTop) {
  failures.push(`controls/touch contract: ${JSON.stringify(controlsOrder)}`);
}
if (!englishLeaderboard?.includes('1m 37s')) failures.push('English Survival leaderboard did not render its seeded record.');
if (!pauseGeometry.backHit || !pauseGeometry.settingsHit || pauseGeometry.sheetOverlapsNext) {
  failures.push(`pause geometry: ${JSON.stringify(pauseGeometry)}`);
}
if (!settingsOpenedFromPause || !backOpenedFromPause) failures.push('Pause did not route to Settings and Back successor sheets.');
if (cleanup.canvasCount !== 0 || cleanup.domCellCount !== 0 || cleanup.qaGlobals.length > 0) {
  failures.push(`cleanup: ${JSON.stringify(cleanup)}`);
}
if (errors.length > 0) failures.push(...errors.map((error) => `console: ${error}`));
if (failures.length > 0) throw new Error(failures.join('\n'));
