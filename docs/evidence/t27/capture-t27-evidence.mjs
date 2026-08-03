import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const origin = process.argv[2] ?? 'http://127.0.0.1:5173';
const output = path.resolve('docs/evidence/t27');
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const puzzleRoute = JSON.parse(fs.readFileSync(
  path.resolve('docs/workstreams/tetris-t15-puzzle/puzzle-levels-01-10.json'),
  'utf8',
)).levels[0].routes[0].commandStream;
fs.mkdirSync(output, { recursive: true });

const leaderboard = {
  version: 8,
  marathon: [
    { version: 8, mode: 'marathon', outcome: 'top-out', lines: 34, score: 8240, pieces: 97, elapsedTicks: 7200, chain: 0, completedAt: '2026-08-03T12:00:00.000Z' },
    { version: 8, mode: 'marathon', outcome: 'top-out', lines: 13, score: 3280, pieces: 65, elapsedTicks: 4800, chain: 0, completedAt: '2026-08-02T12:00:00.000Z' },
    { version: 8, mode: 'marathon', outcome: 'top-out', lines: 10, score: 2460, pieces: 38, elapsedTicks: 3600, chain: 0, completedAt: '2026-08-01T12:00:00.000Z' },
  ],
  race: [],
  sprint: [],
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto(origin, { waitUntil: 'networkidle' });
await page.evaluate((records) => {
  localStorage.clear();
  localStorage.setItem('tetramorph:language:v1', 'zh-CN');
  localStorage.setItem('tetramorph:mode-rule-intros:v1', JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']));
  localStorage.setItem('tetramorph:leaderboard:v8', JSON.stringify(records));
}, leaderboard);
await page.reload({ waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);

const capture = async (name) => {
  await page.waitForTimeout(160);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
};

await page.getByTestId('enter-marathon').click();
await page.getByTestId('game-screen').waitFor({ state: 'visible' });
await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });

const hud = await page.evaluate(() => {
  const card = document.querySelector('[data-stat-role="fall-cadence"]');
  const label = card?.querySelector('.run-stats__label');
  const unit = card?.querySelector('.run-stats__unit');
  const value = card?.querySelector('strong');
  const rect = (element) => {
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
  };
  const statisticCards = [...document.querySelectorAll('.run-stats [data-stat-role]')].map(rect);
  const statisticStyles = [...document.querySelectorAll('.run-stats [data-stat-role]')].map((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      borderRadius: style.borderRadius,
      boxShadow: style.boxShadow,
    };
  });
  const statisticsElement = document.querySelector('.run-stats');
  const statisticsStyle = statisticsElement ? getComputedStyle(statisticsElement) : null;
  return {
    label: label?.textContent?.trim(),
    unit: unit?.textContent?.trim(),
    value: value?.textContent?.trim(),
    card: rect(card),
    labelBox: rect(label),
    valueBox: rect(value),
    statisticCards,
    statisticStyles,
    statistics: rect(document.querySelector('.run-stats')),
    statisticsStyle: statisticsStyle ? {
      background: statisticsStyle.backgroundColor,
      borderRadius: statisticsStyle.borderRadius,
      overflow: statisticsStyle.overflow,
    } : null,
    nextModule: rect(document.querySelector('.preview-rail')),
    nextWell: rect(document.querySelector('[data-testid="next-slot"]')),
  };
});
await capture('classic-hud-zh');

await page.keyboard.press('KeyS');
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
const rail = page.locator('.classic-speed-control__rail');
const railBox = await rail.boundingBox();
if (!railBox) throw new Error('Classic pace rail is not visible.');
await page.mouse.click(railBox.x + railBox.width * 0.48, railBox.y + railBox.height / 2);

const settings = await page.evaluate(() => {
  const sheet = document.querySelector('[data-testid="settings-sheet"]');
  const rail = document.querySelector('.classic-speed-control__rail');
  const inputs = [...document.querySelectorAll('.classic-speed-control__input')];
  const selected = inputs.find((input) => input.getAttribute('data-arrow-selected') === 'true') ?? document.activeElement;
  const values = [...document.querySelectorAll('.classic-speed-control__value')]
    .map((value) => value.textContent?.trim());
  return {
    sheet: sheet ? [sheet.clientWidth, sheet.scrollWidth, sheet.clientHeight, sheet.scrollHeight] : null,
    railCount: document.querySelectorAll('.classic-speed-control__rail').length,
    inputCount: inputs.length,
    values,
    unit: document.querySelector('.classic-speed-control__heading em')?.textContent?.trim(),
    selectedOutline: selected instanceof HTMLElement
      ? { style: getComputedStyle(selected).outlineStyle, width: getComputedStyle(selected).outlineWidth }
      : null,
    railOutline: rail ? { style: getComputedStyle(rail).outlineStyle, width: getComputedStyle(rail).outlineWidth } : null,
  };
});
await capture('classic-settings-pace-zh');

await page.keyboard.press('Escape');
for (let piece = 0; piece < 115; piece += 1) {
  if (await page.locator('.run-result').isVisible().catch(() => false)) break;
  await page.keyboard.press('Space');
  await page.waitForTimeout(48);
}
await page.locator('.run-result').waitFor({ state: 'visible', timeout: 5_000 });

const result = await page.evaluate(() => {
  const sheet = document.querySelector('.action-sheet--run-result');
  const hero = document.querySelector('.run-result__hero');
  const heroValue = hero?.querySelector('strong');
  const box = (element) => {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
  };
  return {
    title: sheet?.querySelector('h2')?.textContent?.trim(),
    heroValueText: heroValue?.textContent?.trim(),
    heroLabel: hero?.querySelector('span')?.textContent?.trim(),
    support: document.querySelector('.run-result__support')?.textContent?.trim(),
    sheet: box(sheet),
    hero: box(hero),
    heroValueBox: box(heroValue),
    heroValueStyle: heroValue ? {
      overflow: getComputedStyle(heroValue).overflow,
      fontWeight: getComputedStyle(heroValue).fontWeight,
      lineHeight: getComputedStyle(heroValue).lineHeight,
      textOverflow: getComputedStyle(heroValue).textOverflow,
    } : null,
    heroBorder: hero ? getComputedStyle(hero).borderStyle : null,
    leaderboardRows: document.querySelectorAll('.result-leaderboard--result li').length,
    metricCards: document.querySelectorAll('.run-result__metric').length,
  };
});
await capture('classic-result-zh');

await page.locator('.action-sheet--run-result .secondary-action').click();
await page.getByTestId('mode-home').waitFor({ state: 'visible' });
await page.getByTestId('enter-puzzle').click();
await page.getByTestId('puzzle-library').waitFor({ state: 'visible' });
await page.getByTestId('start-selected-puzzle').click();
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

const puzzle = await page.evaluate(() => {
  const sheet = document.querySelector('.action-sheet--puzzle-celebration');
  const celebration = document.querySelector('[data-testid="puzzle-celebration"]');
  const rect = (element) => {
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
  };
  return {
    title: sheet?.querySelector('h2')?.textContent?.trim(),
    outcome: celebration?.getAttribute('data-outcome'),
    best: celebration?.getAttribute('aria-label'),
    value: celebration?.querySelector('.puzzle-celebration__value strong')?.textContent?.trim(),
    unit: celebration?.querySelector('.puzzle-celebration__value small')?.textContent?.trim(),
    label: celebration?.querySelector('.puzzle-celebration__summary > span')?.textContent?.trim(),
    sheet: rect(sheet),
  };
});
await capture('puzzle-result-zh');

const audit = {
  sourceSha,
  capturedAt: new Date().toISOString(),
  browser: await browser.version(),
  viewport: await page.viewportSize(),
  canvasCount: await page.locator('canvas').count(),
  domCellCount: await page.locator('[data-game-cell]').count(),
  hud,
  settings,
  result,
  puzzle,
  errors,
};
fs.writeFileSync(path.join(output, 'audit.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
await browser.close();

const failures = [];
if (errors.length > 0) failures.push(...errors.map((error) => `console: ${error}`));
if (audit.canvasCount !== 1) failures.push(`expected one canvas, found ${audit.canvasCount}`);
if (audit.domCellCount !== 0) failures.push(`found ${audit.domCellCount} DOM board cells`);
if (settings.railCount !== 1 || settings.inputCount !== 2) failures.push(`pace control topology: ${JSON.stringify(settings)}`);
if (settings.selectedOutline?.style !== 'none' && settings.selectedOutline?.width !== '0px') failures.push(`selected rail outline: ${JSON.stringify(settings.selectedOutline)}`);
if (settings.sheet && (settings.sheet[1] > settings.sheet[0] || settings.sheet[3] > settings.sheet[2])) failures.push(`settings overflow: ${settings.sheet.join('x')}`);
if (hud.label !== '下落速度' || hud.value !== '0.8' || hud.unit !== '秒/格') failures.push(`cadence hierarchy: ${JSON.stringify(hud)}`);
if (hud.statisticCards.length !== 4) failures.push(`expected four statistic cards, found ${hud.statisticCards.length}`);
if (hud.statisticCards.some((card, index, cards) => card === null || (index > 0 && card.top <= cards[index - 1].top))) failures.push(`statistic cards are not a 4x1 column: ${JSON.stringify(hud.statisticCards)}`);
if (!hud.statisticsStyle || hud.statisticsStyle.overflow !== 'hidden' || hud.statisticsStyle.borderRadius === '0px') failures.push(`statistics surface: ${JSON.stringify(hud.statisticsStyle)}`);
if (hud.statisticStyles.some((style) => style.background !== 'rgba(0, 0, 0, 0)' || style.borderRadius !== '0px' || style.boxShadow !== 'none')) failures.push(`statistics rows are styled as independent cards: ${JSON.stringify(hud.statisticStyles)}`);
if (!hud.statistics || !hud.nextModule || hud.nextModule.top <= hud.statistics.bottom || Math.abs(hud.statistics.width - hud.nextModule.width) > 1) failures.push(`Next alignment: ${JSON.stringify(hud)}`);
if (result.metricCards !== 0 || result.heroBorder !== 'none') failures.push(`result hierarchy: ${JSON.stringify(result)}`);
if (result.title !== '消行' || result.heroLabel) failures.push(`result title hierarchy: ${JSON.stringify(result)}`);
if (!result.heroValueStyle || result.heroValueStyle.overflow !== 'visible' || result.heroValueStyle.fontWeight !== '700' || result.heroValueStyle.textOverflow !== 'clip') failures.push(`result glyph box: ${JSON.stringify(result.heroValueStyle)}`);
if (!result.sheet || result.sheet.width < 450 || result.sheet.width > 520) failures.push(`result width: ${JSON.stringify(result.sheet)}`);
if (puzzle.title !== '恭喜你破解谜题' || puzzle.outcome !== 'first' || puzzle.value !== '4' || puzzle.unit !== '步' || puzzle.label !== '当前最优步数') failures.push(`Puzzle result hierarchy: ${JSON.stringify(puzzle)}`);
if (!puzzle.sheet || puzzle.sheet.width < 450 || puzzle.sheet.width > 520) failures.push(`Puzzle result width: ${JSON.stringify(puzzle.sheet)}`);
if (failures.length > 0) throw new Error(failures.join('\n'));
