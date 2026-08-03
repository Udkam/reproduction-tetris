import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const origin = process.argv[2] ?? 'http://127.0.0.1:4193';
const output = path.resolve('docs/evidence/t27-r1');
fs.mkdirSync(output, { recursive: true });

const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const puzzleRoute = JSON.parse(fs.readFileSync(
  path.resolve('docs/workstreams/tetris-t15-puzzle/puzzle-levels-01-10.json'),
  'utf8',
)).levels[0].routes[0].commandStream;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const browserErrors = [];

page.on('console', (message) => {
  if (message.type() === 'error') browserErrors.push(message.text());
});
page.on('pageerror', (error) => browserErrors.push(error.message));

await page.addInitScript(() => {
  try {
    localStorage.setItem('tetramorph:language:v1', 'zh-CN');
    localStorage.setItem('tetramorph:visual-theme:v1', 'deep-tide');
    localStorage.setItem('tetramorph:reduced-motion:v1', 'off');
    localStorage.setItem(
      'tetramorph:mode-rule-intros:v1',
      JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']),
    );
  } catch {
    // about:blank has no origin; the same script runs again before the app boot.
  }
});

const capture = async (name) => {
  await page.waitForTimeout(160);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
};

const rect = (selector) => page.locator(selector).evaluate((element) => {
  const box = element.getBoundingClientRect();
  return {
    top: box.top,
    right: box.right,
    bottom: box.bottom,
    left: box.left,
    width: box.width,
    height: box.height,
    centerX: box.left + box.width / 2,
    centerY: box.top + box.height / 2,
  };
});

const parseRgb = (value) => {
  const match = value.match(/rgba?\((\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)/);
  return match ? match.slice(1, 4).map(Number) : null;
};

const luminance = (rgb) => rgb
  .map((channel) => channel / 255)
  .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
  .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);

const contrast = (foreground, background) => {
  const foregroundRgb = parseRgb(foreground);
  const backgroundRgb = parseRgb(background);
  if (!foregroundRgb || !backgroundRgb) return 0;
  const [lighter, darker] = [luminance(foregroundRgb), luminance(backgroundRgb)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
};

const readEntryCover = () => page.evaluate(() => {
  const board = document.querySelector('[data-testid="board-frame"]');
  const cover = document.querySelector('.entry-countdown');
  if (!board || !cover) return null;
  const boardRect = board.getBoundingClientRect();
  const coverRect = cover.getBoundingClientRect();
  const style = getComputedStyle(cover);
  const glowStyle = getComputedStyle(cover, '::before');
  return {
    coverageDelta: {
      top: Math.abs(boardRect.top - coverRect.top),
      right: Math.abs(boardRect.right - coverRect.right),
      bottom: Math.abs(boardRect.bottom - coverRect.bottom),
      left: Math.abs(boardRect.left - coverRect.left),
    },
    backgroundColor: style.backgroundColor,
    backgroundImage: style.backgroundImage,
    animationName: style.animationName,
    glowAnimationName: glowStyle.animationName,
    glowOpacity: glowStyle.opacity,
  };
});

const readMotionControl = async () => {
  await page.mouse.move(1, 1);
  return page.getByTestId('reduced-motion-toggle').evaluate((button) => {
    button.blur();
    const style = getComputedStyle(button);
    return {
      label: button.textContent?.trim() ?? '',
      mode: button.getAttribute('data-motion-mode'),
      pressed: button.getAttribute('aria-pressed'),
      color: style.color,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      borderRadius: style.borderRadius,
    };
  });
};

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

await page.goto(origin, { waitUntil: 'networkidle' });
await page.getByTestId('mode-home').waitFor({ state: 'visible' });
await page.evaluate(() => document.fonts.ready);

const home = await page.evaluate(() => {
  const app = document.querySelector('.app');
  const intro = document.querySelector('.landing-intro');
  const wordmark = document.querySelector('.mode-home-wordmark');
  const firstCard = document.querySelector('[data-testid="enter-marathon"]');
  const introRect = intro?.getBoundingClientRect();
  const wordmarkRect = wordmark?.getBoundingClientRect();
  const introStyle = intro ? getComputedStyle(intro) : null;
  const firstCardStyle = firstCard ? getComputedStyle(firstCard) : null;
  return {
    pathname: location.pathname,
    theme: app?.getAttribute('data-theme') ?? null,
    wordmarkCenterDelta: introRect && wordmarkRect
      ? Math.abs((introRect.left + introRect.width / 2) - (wordmarkRect.left + wordmarkRect.width / 2))
      : null,
    brandBackground: introStyle?.backgroundColor ?? null,
    brandBackgroundImage: introStyle?.backgroundImage ?? null,
    firstCardTopBorder: firstCardStyle?.borderTopWidth ?? null,
    activeCards: document.querySelectorAll('.mode-gate--active').length,
  };
});
await capture('home-deep-tide');

await page.getByTestId('enter-marathon').hover();
await page.mouse.move(2, 2);
await page.waitForTimeout(220);
const homePointerReset = await page.evaluate(() => ({
  activeCards: document.querySelectorAll('.mode-gate--active').length,
  selected: document.querySelector('[data-testid="mode-list"]')?.hasAttribute('data-selection') ?? true,
}));

await page.getByTestId('enter-sprint').click();
await page.waitForFunction(() => location.pathname === '/play/mutation');
const pushedMutationPath = new URL(page.url()).pathname;
await page.goBack();
await page.waitForFunction(() => location.pathname === '/');
const backPath = new URL(page.url()).pathname;
await page.goForward();
await page.waitForFunction(() => location.pathname === '/play/mutation');
await page.getByTestId('game-screen').waitFor({ state: 'visible' });
await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 9_000 });
await page.waitForTimeout(240);

const stage = await page.evaluate(() => {
  const app = document.querySelector('.app');
  const nextSlot = document.querySelector('[data-testid="next-slot"]');
  const nextLabel = document.querySelector('.preview-rail .rail-label');
  const statusLabel = document.querySelector('.mutation-status__header strong');
  const statValue = document.querySelector('.run-stats__value');
  const nextStyle = nextSlot ? getComputedStyle(nextSlot) : null;
  const nextLabelStyle = nextLabel ? getComputedStyle(nextLabel) : null;
  const statusLabelStyle = statusLabel ? getComputedStyle(statusLabel) : null;
  const statValueStyle = statValue ? getComputedStyle(statValue) : null;
  const appStyle = app ? getComputedStyle(app) : null;
  return {
    theme: app?.getAttribute('data-theme') ?? null,
    canvasCount: document.querySelectorAll('canvas').length,
    next: {
      borderTopWidth: nextStyle?.borderTopWidth ?? null,
      borderTopStyle: nextStyle?.borderTopStyle ?? null,
      backgroundColor: nextStyle?.backgroundColor ?? null,
      boxShadow: nextStyle?.boxShadow ?? null,
      textAlign: nextLabelStyle?.textAlign ?? null,
    },
    mutationHeadingAlign: statusLabelStyle?.textAlign ?? null,
    statValue: {
      color: statValueStyle?.color ?? null,
      fontSize: statValueStyle?.fontSize ?? null,
    },
    pageBackground: appStyle?.backgroundColor ?? null,
  };
});

const [boardRect, nextRect, statsRect] = await Promise.all([
  rect('[data-testid="board-frame"]'),
  rect('[data-testid="next-slot"]'),
  rect('[data-testid="stats"]'),
]);
await capture('mutation-stage-deep-tide');

await page.keyboard.press('KeyR');
await page.getByTestId('restart-curtain').waitFor({ state: 'visible' });
const fullMotionCover = await readEntryCover();
await capture('restart-curtain-full-motion');
await page.keyboard.press('KeyR');
await page.getByTestId('restart-curtain').waitFor({ state: 'detached' });

await page.getByTestId('open-settings').click();
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
const fullMotionControl = await readMotionControl();
const audioControl = await page.getByTestId('audio-toggle').evaluate((button) => {
  const style = getComputedStyle(button);
  return {
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    borderRadius: style.borderRadius,
  };
});
await capture('settings-motion-full');
await page.getByTestId('reduced-motion-toggle').click();
const reducedMotionControl = await readMotionControl();
await capture('settings-motion-reduced');
await page.getByRole('button', { name: '继续游戏', exact: true }).click();
await page.getByTestId('settings-sheet').waitFor({ state: 'detached' });

await page.keyboard.press('KeyR');
await page.getByTestId('restart-curtain').waitFor({ state: 'visible' });
const reducedMotionCover = await readEntryCover();
await capture('restart-curtain-reduced-motion');
await page.keyboard.press('KeyR');
await page.getByTestId('restart-curtain').waitFor({ state: 'detached' });

await page.getByTestId('open-settings').click();
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
await page.getByTestId('reduced-motion-toggle').click();
await page.getByRole('button', { name: '继续游戏', exact: true }).click();
await page.getByTestId('settings-sheet').waitFor({ state: 'detached' });

await page.keyboard.press('KeyP');
await page.getByTestId('pause-curtain').waitFor({ state: 'visible' });
const pause = {
  nextVisible: await page.getByTestId('next-slot').isVisible(),
  backEnabled: await page.getByTestId('exit-game').isEnabled(),
  settingsEnabled: await page.getByTestId('open-settings').isEnabled(),
};
await capture('pause-curtain');

await page.keyboard.press('Escape');
await page.getByText('离开本局？', { exact: true }).waitFor({ state: 'visible' });
const pauseLeave = {
  nextVisible: await page.getByTestId('next-slot').isVisible(),
  pauseCurtainVisible: await page.getByTestId('pause-curtain').isVisible().catch(() => false),
};
await page.getByRole('button', { name: '留在本局', exact: true }).click();
await page.getByTestId('pause-curtain').waitFor({ state: 'visible' });
await page.keyboard.press('Enter');
await page.getByTestId('pause-curtain').waitFor({ state: 'detached' });

await page.keyboard.press('KeyR');
await page.getByTestId('restart-curtain').waitFor({ state: 'visible' });
await page.keyboard.press('KeyR');
await page.getByTestId('restart-curtain').waitFor({ state: 'detached' });
const restartR = {
  pauseCurtainVisible: await page.getByTestId('pause-curtain').isVisible().catch(() => false),
  nextVisible: await page.getByTestId('next-slot').isVisible(),
};

await page.keyboard.press('KeyR');
await page.getByTestId('restart-curtain').waitFor({ state: 'visible' });
const restartActions = {
  backEnabled: await page.getByTestId('exit-game').isEnabled(),
  settingsEnabled: await page.getByTestId('open-settings').isEnabled(),
};
await page.keyboard.press('Escape');
await page.getByText('离开本局？', { exact: true }).waitFor({ state: 'visible' });
const restartEscape = {
  restartCurtainVisible: await page.getByTestId('restart-curtain').isVisible().catch(() => false),
  nextVisible: await page.getByTestId('next-slot').isVisible(),
};
await capture('restart-escape-leave');
await page.getByRole('button', { name: '留在本局', exact: true }).click();

await page.getByTestId('open-settings').click();
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
const themeButtons = page.locator('[data-theme-option]');
const themeButtonCount = await themeButtons.count();
await page.getByTestId('theme-sunstone').click();
const switchedTheme = await page.locator('.app').getAttribute('data-theme');
await capture('settings-theme-switch');
await page.getByTestId('theme-deep-tide').click();
await page.getByRole('button', { name: '继续游戏', exact: true }).click();
await page.getByTestId('settings-sheet').waitFor({ state: 'detached' });

await page.goto(`${origin}/puzzles`, { waitUntil: 'networkidle' });
await page.getByTestId('puzzle-library').waitFor({ state: 'visible' });
const puzzleLibrary = await page.evaluate(() => ({
  pathname: location.pathname,
  difficultyTabs: document.querySelectorAll('.puzzle-gallery__pages button').length,
  horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  theme: document.querySelector('.app')?.getAttribute('data-theme') ?? null,
}));
await capture('puzzle-library-deep-tide');
await page.getByTestId('start-selected-puzzle').click();
await page.waitForFunction(() => location.pathname.startsWith('/play/puzzle/'));
const puzzlePlayPath = new URL(page.url()).pathname;
await page.getByTestId('game-screen').waitFor({ state: 'visible' });
await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
await page.evaluate(() => window.__TETRAMORPH_QA__?.setFrozen(true));
await page.evaluate((stream) => {
  const qa = window.__TETRAMORPH_QA__;
  if (!qa) throw new Error('Missing TetraMorph QA surface.');
  const actions = { L: 'left', R: 'right', C: 'rotate-cw', H: 'hard-drop' };
  for (const token of stream.slice(1)) {
    if (token === 'T') qa.advanceTicks(1);
    else {
      const action = actions[token];
      if (!action) throw new Error(`Unsupported Puzzle route token: ${token}`);
      qa.action(action);
    }
  }
}, puzzleRoute);
await page.getByTestId('puzzle-celebration').waitFor({ state: 'visible', timeout: 5_000 });
const puzzleResult = await page.evaluate(() => {
  const celebration = document.querySelector('[data-testid="puzzle-celebration"]');
  return {
    title: document.querySelector('.action-sheet--puzzle-celebration > h2')?.textContent?.trim() ?? null,
    best: celebration?.getAttribute('aria-label') ?? null,
    value: celebration?.querySelector('.puzzle-celebration__value strong')?.textContent?.trim() ?? null,
    unit: celebration?.querySelector('.puzzle-celebration__value small')?.textContent?.trim() ?? null,
    label: celebration?.querySelector('.puzzle-celebration__summary > span')?.textContent?.trim() ?? null,
    constellationCount: celebration?.querySelectorAll('.puzzle-celebration__constellation').length ?? -1,
    prismCount: celebration?.querySelectorAll('.puzzle-celebration__prism').length ?? -1,
  };
});
await capture('puzzle-result-no-emblem');
await page.locator('.action-sheet--puzzle-celebration .secondary-action').click();
await page.getByTestId('puzzle-library').waitFor({ state: 'visible' });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(origin, { waitUntil: 'networkidle' });
await page.getByTestId('mode-home').waitFor({ state: 'visible' });
const compactHome = await page.evaluate(() => ({
  horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  modeCount: document.querySelectorAll('[data-testid^="enter-"]').length,
}));
await capture('home-compact-deep-tide');

const audit = {
  sourceSha,
  capturedAt: new Date().toISOString(),
  browser: await browser.version(),
  home,
  homePointerReset,
  routes: { pushedMutationPath, backPath, puzzlePlayPath },
  stage: {
    ...stage,
    geometry: { board: boardRect, next: nextRect, stats: statsRect },
    boardCenterDelta: Math.abs(boardRect.centerX - 720),
    statContrast: contrast(stage.statValue.color, stage.pageBackground),
  },
  motion: {
    referenceControl: audioControl,
    fullControl: fullMotionControl,
    reducedControl: reducedMotionControl,
    fullCover: fullMotionCover,
    reducedCover: reducedMotionCover,
  },
  interruption: { pause, pauseLeave, restartR, restartActions, restartEscape },
  themes: { buttonCount: themeButtonCount, switchedTheme },
  puzzleLibrary,
  puzzleResult,
  compactHome,
  browserErrors,
};

check(home.pathname === '/', `Home route mismatch: ${home.pathname}`);
check(home.theme === 'deep-tide', `Default theme mismatch: ${home.theme}`);
check((home.wordmarkCenterDelta ?? 999) <= 1, `Wordmark is off-center by ${home.wordmarkCenterDelta}px`);
check(home.firstCardTopBorder !== '0px', `Classic top border is missing: ${home.firstCardTopBorder}`);
check(home.activeCards === 0 && homePointerReset.activeCards === 0 && !homePointerReset.selected, `Pointer selection persisted: ${JSON.stringify(homePointerReset)}`);
check(pushedMutationPath === '/play/mutation' && backPath === '/', `History route mismatch: ${JSON.stringify({ pushedMutationPath, backPath })}`);
check(stage.canvasCount === 1, `Expected one canvas, found ${stage.canvasCount}`);
check(stage.next.borderTopWidth === '0px' && stage.next.borderTopStyle === 'none', `Next still has a border: ${JSON.stringify(stage.next)}`);
check(stage.next.backgroundColor === 'rgba(0, 0, 0, 0)', `Next still has a background: ${stage.next.backgroundColor}`);
check(stage.next.boxShadow === 'none', `Next still has a shadow: ${stage.next.boxShadow}`);
check(stage.next.textAlign === 'center' && stage.mutationHeadingAlign === 'center', `Rail headings are not centered: ${JSON.stringify(stage)}`);
check(Math.abs(boardRect.centerX - 720) <= 2, `Board is off-center by ${Math.abs(boardRect.centerX - 720)}px`);
check(nextRect.right < boardRect.left && statsRect.left > boardRect.right, `Rails do not flank the board: ${JSON.stringify({ boardRect, nextRect, statsRect })}`);
check(contrast(stage.statValue.color, stage.pageBackground) >= 4.5, `Right-side value contrast is too low: ${JSON.stringify(stage.statValue)}`);
check(fullMotionControl.mode === 'full' && fullMotionControl.pressed === 'false', `Full-motion control state mismatch: ${JSON.stringify(fullMotionControl)}`);
check(reducedMotionControl.mode === 'reduced' && reducedMotionControl.pressed === 'true', `Reduced-motion control state mismatch: ${JSON.stringify(reducedMotionControl)}`);
check(fullMotionControl.backgroundColor === reducedMotionControl.backgroundColor && fullMotionControl.borderColor === reducedMotionControl.borderColor, `Motion control changes construction between modes: ${JSON.stringify({ fullMotionControl, reducedMotionControl })}`);
check(fullMotionControl.backgroundColor === audioControl.backgroundColor && fullMotionControl.borderColor === audioControl.borderColor && fullMotionControl.borderRadius === audioControl.borderRadius, `Motion control does not match the settings action construction: ${JSON.stringify({ audioControl, fullMotionControl })}`);
check(fullMotionCover !== null && Object.values(fullMotionCover.coverageDelta).every((delta) => delta <= 1), `Full-motion cover does not fill the board: ${JSON.stringify(fullMotionCover)}`);
check(reducedMotionCover !== null && Object.values(reducedMotionCover.coverageDelta).every((delta) => delta <= 1), `Reduced-motion cover does not fill the board: ${JSON.stringify(reducedMotionCover)}`);
check(fullMotionCover?.backgroundImage.includes('linear-gradient') && !fullMotionCover.backgroundImage.includes('radial-gradient'), `Full-motion cover is not a continuous field: ${JSON.stringify(fullMotionCover)}`);
check(fullMotionCover?.glowAnimationName === 'entry-cover-breathe', `Full-motion cover has no soft breathing layer: ${JSON.stringify(fullMotionCover)}`);
check(reducedMotionCover?.animationName === 'none' && reducedMotionCover.glowAnimationName === 'none', `Reduced-motion cover still animates: ${JSON.stringify(reducedMotionCover)}`);
check(pause.nextVisible && pause.backEnabled && pause.settingsEnabled, `Pause interrupted global controls or Next: ${JSON.stringify(pause)}`);
check(pauseLeave.nextVisible && !pauseLeave.pauseCurtainVisible, `Pause Escape did not enter leave flow cleanly: ${JSON.stringify(pauseLeave)}`);
check(!restartR.pauseCurtainVisible && restartR.nextVisible, `R did not resume the interrupted run: ${JSON.stringify(restartR)}`);
check(restartActions.backEnabled && restartActions.settingsEnabled, `Restart disabled global controls: ${JSON.stringify(restartActions)}`);
check(!restartEscape.restartCurtainVisible && restartEscape.nextVisible, `Restart Escape did not enter leave flow: ${JSON.stringify(restartEscape)}`);
check(themeButtonCount === 3 && switchedTheme === 'sunstone', `Theme switch failed: ${JSON.stringify({ themeButtonCount, switchedTheme })}`);
check(puzzleLibrary.pathname === '/puzzles' && puzzleLibrary.difficultyTabs === 3 && puzzleLibrary.horizontalOverflow <= 0, `Puzzle library mismatch: ${JSON.stringify(puzzleLibrary)}`);
check(puzzlePlayPath.startsWith('/play/puzzle/'), `Puzzle deep link mismatch: ${puzzlePlayPath}`);
check(puzzleResult.title === '恭喜你破解谜题' && puzzleResult.value === '4' && puzzleResult.unit === '步' && puzzleResult.label === '当前最优步数', `Puzzle result hierarchy mismatch: ${JSON.stringify(puzzleResult)}`);
check(puzzleResult.constellationCount === 0 && puzzleResult.prismCount === 0, `Puzzle result still contains an emblem: ${JSON.stringify(puzzleResult)}`);
check(compactHome.horizontalOverflow <= 0 && compactHome.modeCount === 4, `Compact Home overflowed: ${JSON.stringify(compactHome)}`);
check(browserErrors.length === 0, `Browser errors: ${browserErrors.join(' | ')}`);

fs.writeFileSync(path.join(output, 'audit.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
await browser.close();

if (failures.length > 0) throw new Error(failures.join('\n'));
