import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('.');
const output = path.resolve('docs/evidence/t31-r2');
const origin = 'http://127.0.0.1:4212';
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
fs.mkdirSync(output, { recursive: true });

const cases = Object.freeze([
  { mode: 'classic', entry: 'enter-marathon', width: 1440, height: 900 },
  { mode: 'classic', entry: 'enter-marathon', width: 1125, height: 1196 },
  { mode: 'mutation', entry: 'enter-sprint', width: 1440, height: 900 },
  { mode: 'mutation', entry: 'enter-sprint', width: 1125, height: 1196 },
]);

const server = spawn(
  'npm.cmd',
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4212', '--strictPort'],
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
      // The one owned Vite process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  throw new Error(`Vite did not become ready.\n${serverLog}`);
};

const captureCase = async (testCase) => {
  const context = await browser.newContext({
    viewport: { width: testCase.width, height: testCase.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('tetramorph:qa-seed', '31002');
    localStorage.setItem('tetramorph:language:v1', 'zh-CN');
    localStorage.setItem('tetramorph:visual-theme:v1', 'deep-tide');
    localStorage.setItem('tetramorph:reduced-motion:v1', 'off');
    localStorage.setItem(
      'tetramorph:mode-rule-intros:v1',
      JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']),
    );
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.getByTestId(testCase.entry).click();
  await page.getByTestId('game-screen').waitFor({ state: 'visible' });
  await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
  await page.evaluate(() => globalThis.__TETRAMORPH_QA__?.setFrozen(true));
  await page.waitForTimeout(150);

  const audit = await page.evaluate(() => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const bounds = element.getBoundingClientRect();
      return {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      };
    };
    const renderer = globalThis.__TETRAMORPH_QA__?.getRendererSnapshot() ?? null;
    return {
      viewport: { width: innerWidth, height: innerHeight },
      canvasCount: document.querySelectorAll('canvas').length,
      domCellCount: document.querySelectorAll('[data-game-cell]').length,
      arena: rect('[data-testid="game-cluster"]'),
      canvas: rect('[data-testid="game-cluster"] canvas'),
      nextSlot: rect('[data-testid="game-cluster"] [data-testid="next-slot"]'),
      nextLabel: document.querySelector('[data-testid="game-cluster"] [data-testid="next-slot"]')?.getAttribute('aria-label') ?? null,
      renderer,
    };
  });

  const screenshot = `${testCase.mode}-next-${testCase.width}x${testCase.height}.png`;
  await page.screenshot({ path: path.join(output, screenshot), fullPage: true });
  const failures = [];
  if (errors.length > 0) failures.push(...errors.map((error) => `browser: ${error}`));
  if (audit.canvasCount !== 1 || audit.domCellCount !== 0) {
    failures.push(`renderer topology mismatch: ${JSON.stringify(audit)}`);
  }
  if (!audit.nextSlot || audit.nextSlot.width <= 0 || audit.nextSlot.height <= 0) {
    failures.push(`Next DOM slot is absent: ${JSON.stringify(audit)}`);
  }
  if (
    audit.renderer?.previewLayerVisible !== true
    || !Array.isArray(audit.renderer?.previewPieces)
    || audit.renderer.previewPieces.length < 1
    || !audit.renderer?.preview
  ) {
    failures.push(`Next renderer pixels are absent: ${JSON.stringify(audit.renderer)}`);
  }

  await context.close();
  return { ...testCase, screenshot, audit, errors, failures };
};

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const captures = [];
  for (const testCase of cases) captures.push(await captureCase(testCase));
  const failures = captures.flatMap((capture) => capture.failures.map((failure) => `${capture.mode} ${capture.width}x${capture.height}: ${failure}`));
  const report = {
    sourceSha,
    capturedAt: new Date().toISOString(),
    browser: await browser.version(),
    captures,
    failures,
  };
  fs.writeFileSync(path.join(output, 'responsive-audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  if (failures.length > 0) throw new Error(failures.join('\n'));
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server.pid) {
    try {
      execFileSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      // The exact owned Vite tree may already have exited.
    }
  }
}
