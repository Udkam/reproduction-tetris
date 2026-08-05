import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('.');
const output = path.resolve('docs/evidence/t32');
const origin = 'http://127.0.0.1:4213';
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const cases = [
  { category: 'intro', width: 1440, height: 900 },
  { category: 'easy', width: 1440, height: 900 },
  { category: 'hard', width: 1440, height: 900 },
  { category: 'intro', width: 1125, height: 1196 },
];

fs.mkdirSync(output, { recursive: true });
const server = spawn(
  'npm.cmd',
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4213', '--strictPort'],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: true },
);
let serverLog = '';
server.stdout.on('data', (chunk) => { serverLog += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });
let browser;

const waitForServer = async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite exited before readiness.\n${serverLog}`);
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // The owned Vite process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  throw new Error(`Vite did not become ready.\n${serverLog}`);
};

const capture = async ({ category, width, height }) => {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('tetramorph:qa-seed', '32001');
    localStorage.setItem('tetramorph:language:v1', 'zh-CN');
    localStorage.setItem('tetramorph:visual-theme:v1', 'deep-tide');
    localStorage.setItem('tetramorph:reduced-motion:v1', 'off');
    localStorage.setItem('tetramorph:mode-rule-intros:v1', JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.getByTestId('enter-puzzle').click();
  await page.getByTestId('puzzle-library').waitFor({ state: 'visible' });
  await page.locator(`#puzzle-page-tab-${category}`).click();
  await page.locator(`#puzzle-page-panel-${category}`).waitFor({ state: 'visible' });
  await page.waitForTimeout(350);

  const audit = await page.evaluate((activeCategory) => {
    const rect = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
        right: Math.round(box.right),
        bottom: Math.round(box.bottom),
      };
    };
    const levels = [...document.querySelectorAll('[data-testid="level-row"]')];
    const selected = document.querySelector('[data-testid="level-row"][aria-pressed="true"]');
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const shell = rect('[data-testid="puzzle-library"]');
    return {
      category: activeCategory,
      viewport,
      levelCount: levels.length,
      unlockedCount: levels.filter((node) => node.getAttribute('data-unlocked') === 'true').length,
      selectedLevelId: selected?.getAttribute('data-level-id') ?? null,
      canvasCount: document.querySelectorAll('canvas').length,
      horizontalOverflow: document.documentElement.scrollWidth > viewport.width,
      verticalOverflow: document.documentElement.scrollHeight > viewport.height,
      shell,
      hero: rect('.puzzle-gallery__hero'),
      catalog: rect('.puzzle-gallery__catalog'),
      grid: rect(`#puzzle-page-panel-${activeCategory}`),
      shellWithinViewport: shell !== null && shell.x >= 0 && shell.right <= viewport.width,
    };
  }, category);

  const suffix = `${category}-${width}x${height}`;
  await page.screenshot({ path: path.join(output, `puzzle-library-${suffix}.png`), fullPage: true });
  await context.close();
  return { ...audit, errors, screenshot: `puzzle-library-${suffix}.png` };
};

const captureGameplay = async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('tetramorph:qa-seed', '32001');
    localStorage.setItem('tetramorph:language:v1', 'zh-CN');
    localStorage.setItem('tetramorph:visual-theme:v1', 'deep-tide');
    localStorage.setItem('tetramorph:reduced-motion:v1', 'off');
    localStorage.setItem('tetramorph:mode-rule-intros:v1', JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.getByTestId('enter-puzzle').click();
  await page.getByTestId('start-selected-puzzle').click();
  await page.getByTestId('game-screen').waitFor({ state: 'visible' });
  await page.evaluate(() => globalThis.__TETRAMORPH_QA__?.setFrozen(true));
  await page.waitForTimeout(200);
  const audit = await page.evaluate(() => ({
    canvasCount: document.querySelectorAll('canvas').length,
    domBoardCellCount: document.querySelectorAll('[data-board-cell], .board-cell').length,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  }));
  const screenshot = 'puzzle-gameplay-intro-1440x900.png';
  await page.screenshot({ path: path.join(output, screenshot), fullPage: true });
  await context.close();
  return { ...audit, errors, screenshot };
};

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const captures = [];
  for (const testCase of cases) captures.push(await capture(testCase));
  const gameplay = await captureGameplay();
  const report = {
    sourceSha,
    capturedAt: new Date().toISOString(),
    captures,
    gameplay,
    passed: captures.every((item) => item.errors.length === 0
      && item.canvasCount === 0
      && item.levelCount === (item.category === 'intro' ? 10 : 20)
      && !item.horizontalOverflow
      && item.shellWithinViewport)
      && gameplay.errors.length === 0
      && gameplay.canvasCount === 1
      && gameplay.domBoardCellCount === 0
      && !gameplay.horizontalOverflow,
  };
  fs.writeFileSync(path.join(output, 'puzzle-library-audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(JSON.stringify({ passed: report.passed, captures: captures.length }));
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server.exitCode === null) {
    try {
      execFileSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      server.kill();
    }
  }
}
