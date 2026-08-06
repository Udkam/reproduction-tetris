import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('.');
const output = path.resolve('docs/evidence/t34');
const origin = 'http://127.0.0.1:4198';
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
fs.mkdirSync(output, { recursive: true });

const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4198', '--strictPort'],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
);
let serverLog = '';
server.stdout.on('data', (chunk) => { serverLog += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });

let browser;

const waitForServer = async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Preview exited before readiness.\n${serverLog}`);
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // The single owned preview server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  throw new Error(`Preview did not become ready.\n${serverLog}`);
};

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('tetramorph:language:v1', 'zh-CN');
    localStorage.setItem('tetramorph:visual-theme:v1', 'deep-tide');
    localStorage.setItem('tetramorph:reduced-motion:v1', 'off');
    localStorage.setItem('tetramorph:mode-rule-intros:v1', JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, 'home-deep-tide.png'), fullPage: true });

  await page.getByTestId('enter-marathon').click();
  await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
  await page.getByTestId('open-settings').click();
  await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });

  const audioToggle = page.getByTestId('audio-toggle');
  const audioVolume = page.getByTestId('audio-volume');
  const audioInitial = {
    pressed: await audioToggle.getAttribute('aria-pressed'),
    volume: await audioVolume.inputValue(),
  };

  await audioToggle.click();
  const mutedPressed = await audioToggle.getAttribute('aria-pressed');
  await audioToggle.click();
  await audioVolume.fill('64');
  const audioFinal = {
    pressed: await audioToggle.getAttribute('aria-pressed'),
    volume: await audioVolume.inputValue(),
  };

  const themes = {};
  for (const theme of ['mineral-mist', 'deep-tide', 'sunstone']) {
    await page.getByTestId(`theme-${theme}`).click();
    themes[theme] = await page.locator('.app').getAttribute('data-theme');
  }
  await page.getByTestId('theme-deep-tide').click();
  await page.screenshot({ path: path.join(output, 'classic-settings-audio-themes.png'), fullPage: true });

  const renderer = await page.evaluate(() => ({
    canvasCount: document.querySelectorAll('canvas').length,
    domCellCount: document.querySelectorAll('[data-game-cell]').length,
  }));

  const audit = {
    sourceSha,
    capturedAt: new Date().toISOString(),
    browser: await browser.version(),
    audioInitial,
    mutedPressed,
    audioFinal,
    themes,
    renderer,
    errors,
  };
  fs.writeFileSync(path.join(output, 'responsive-audio-audit.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8');

  const failures = [];
  if (audioInitial.pressed !== 'true' || audioInitial.volume !== '100') failures.push(`Initial audio mismatch: ${JSON.stringify(audioInitial)}`);
  if (mutedPressed !== 'false') failures.push(`Mute did not disable audio: ${mutedPressed}`);
  if (audioFinal.pressed !== 'true' || audioFinal.volume !== '64') failures.push(`Final audio mismatch: ${JSON.stringify(audioFinal)}`);
  if (Object.entries(themes).some(([expected, actual]) => expected !== actual)) failures.push(`Theme mismatch: ${JSON.stringify(themes)}`);
  if (renderer.canvasCount !== 1 || renderer.domCellCount !== 0) failures.push(`Renderer topology mismatch: ${JSON.stringify(renderer)}`);
  if (errors.length > 0) failures.push(...errors.map((error) => `console: ${error}`));
  if (failures.length > 0) throw new Error(failures.join('\n'));
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server.pid) {
    try {
      execFileSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      // The owned preview server may already have exited.
    }
  }
}
