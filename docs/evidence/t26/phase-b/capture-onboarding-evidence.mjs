import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'file:///C:/Users/Alex%20Chen/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';

const origin = process.argv[2] ?? 'http://127.0.0.1:4188';
const output = path.resolve('docs/evidence/t26/phase-b');
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const chromeCandidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));

if (!executablePath) throw new Error('No approved local Chromium executable is available.');
fs.mkdirSync(output, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath });
const errors = [];
const attachErrors = (page) => {
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
};

const prepare = async (page, language) => {
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate((languageValue) => {
    localStorage.clear();
    localStorage.setItem('tetramorph:language:v1', languageValue);
  }, language);
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
};

const audit = async (page, scope = 'body') => page.evaluate((scopeSelector) => {
  const root = document.querySelector(scopeSelector) ?? document.body;
  const selector = 'h1,h2,h3,p,strong,span,button,kbd,time,output,li';
  const visible = [...root.querySelectorAll(selector)].filter((element) => {
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
  return {
    viewport: [innerWidth, innerHeight],
    documentSize: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    clipped,
    canvasCount: document.querySelectorAll('canvas').length,
    domBoardCellCount: document.querySelectorAll('[data-board-cell], .board-cell').length,
  };
}, scope);

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
attachErrors(desktop);
await prepare(desktop, 'en');
await desktop.screenshot({ path: path.join(output, 'home-en.png'), fullPage: true });
const homeEn = await audit(desktop);
const homeTypography = await desktop.evaluate(() => ({
  wordmark: getComputedStyle(document.querySelector('.mode-home-wordmark')).fontFamily,
  modeName: getComputedStyle(document.querySelector('.mode-gate__body strong')).fontFamily,
  tagline: getComputedStyle(document.querySelector('.mode-home-tagline')).fontFamily,
}));

await desktop.getByTestId('enter-marathon').click();
await desktop.getByRole('dialog').waitFor();
await desktop.waitForTimeout(320);
await desktop.screenshot({ path: path.join(output, 'intro-en.png'), fullPage: true });
const introEn = await audit(desktop, '[role="dialog"]');
const introEnFacts = await desktop.locator('.mode-rule-summary--intro li').count();

const countdownStartedAt = Date.now();
await desktop.getByRole('button', { name: 'Got it' }).click();
await desktop.getByTestId('entry-countdown').waitFor({ state: 'visible' });
await desktop.screenshot({ path: path.join(output, 'countdown-en.png'), fullPage: true });
await desktop.locator('.entry-countdown__digit--start').waitFor({ state: 'visible', timeout: 5_000 });
const startCueElapsedMs = Date.now() - countdownStartedAt;
await desktop.screenshot({ path: path.join(output, 'start-en.png'), fullPage: true });
const startEn = await audit(desktop);
const startState = await desktop.evaluate(() => ({
  cue: document.querySelector('.entry-countdown__digit--start')?.textContent?.trim(),
  nextLabel: document.querySelector('[data-testid="next-slot"]')?.getAttribute('aria-label'),
}));

const narrow = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
attachErrors(narrow);
await prepare(narrow, 'zh-CN');
await narrow.screenshot({ path: path.join(output, 'home-zh-narrow.png'), fullPage: true });
const homeZhNarrow = await audit(narrow);
await narrow.getByTestId('enter-sprint').click();
await narrow.getByRole('dialog').waitFor();
await narrow.waitForTimeout(320);
await narrow.screenshot({ path: path.join(output, 'intro-zh-narrow.png'), fullPage: true });
const introZhNarrow = await audit(narrow, '[role="dialog"]');
const introZhCopy = await narrow.locator('.mode-rule-summary--intro li span').allTextContents();

const reducedContext = await browser.newContext({
  viewport: { width: 844, height: 390 },
  reducedMotion: 'reduce',
});
const reduced = await reducedContext.newPage();
attachErrors(reduced);
await prepare(reduced, 'en');
await reduced.getByTestId('enter-race').click();
await reduced.waitForTimeout(80);
const reducedMotion = await reduced.evaluate(() => ({
  sheetAnimation: getComputedStyle(document.querySelector('.action-sheet')).animationName,
  ruleFacts: document.querySelectorAll('.mode-rule-summary--intro li').length,
}));
await reduced.screenshot({ path: path.join(output, 'intro-en-reduced-short.png'), fullPage: true });
const introReduced = await audit(reduced, '[role="dialog"]');

await reducedContext.close();
await browser.close();

const report = {
  sourceSha,
  executablePath,
  errors,
  homeTypography,
  homeEn,
  introEn: { ...introEn, factCount: introEnFacts },
  startCueElapsedMs,
  startState,
  startEn,
  homeZhNarrow,
  introZhNarrow: {
    ...introZhNarrow,
    factCount: introZhCopy.length,
    chineseBodyCharacters: introZhCopy.join('').replace(/[\s，。；、：]/g, '').length,
  },
  reducedMotion,
  introReduced,
};

fs.writeFileSync(path.join(output, 'audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const failures = [
  ...errors,
  ...homeEn.clipped,
  ...introEn.clipped,
  ...startEn.clipped,
  ...homeZhNarrow.clipped,
  ...introZhNarrow.clipped,
  ...introReduced.clipped,
];
if (homeEn.horizontalOverflow || homeZhNarrow.horizontalOverflow || introReduced.horizontalOverflow) {
  failures.push('horizontal-overflow');
}
if (introEnFacts !== 3 || introZhCopy.length !== 3 || reducedMotion.ruleFacts !== 3) {
  failures.push('intro-fact-count');
}
if (report.introZhNarrow.chineseBodyCharacters >= 100) failures.push('intro-copy-too-long');
if (startState.cue !== 'Start' || !startState.nextLabel) failures.push('start-handoff');
if (failures.length) throw new Error(`Onboarding evidence failed: ${JSON.stringify(failures)}`);

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
