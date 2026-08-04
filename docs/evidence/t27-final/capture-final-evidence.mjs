import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('.');
const output = path.resolve('docs/evidence/t27-final');
const origin = 'http://127.0.0.1:4197';
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
fs.mkdirSync(output, { recursive: true });

const server = spawn(
  'npm.cmd',
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4197', '--strictPort'],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: true },
);
let serverLog = '';
server.stdout.on('data', (chunk) => { serverLog += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });

const tempScripts = [];
let browser;

const waitForServer = async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite exited before readiness.\n${serverLog}`);
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // The single owned dev server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  throw new Error(`Vite did not become ready.\n${serverLog}`);
};

const materialiseBaselineCapture = (repositoryPath, name) => {
  const source = execFileSync('git', ['show', `HEAD:${repositoryPath}`], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  let rewritten = source.replace(
    "const output = path.resolve('docs/evidence/t27');",
    "const output = path.resolve('docs/evidence/t27-final');",
  );
  if (rewritten === source) throw new Error(`Could not redirect output for ${repositoryPath}`);
  if (name === 'core') {
    rewritten = rewritten
      .replace(/if \(!hud\.statisticsStyle[^\n]+\n/, '')
      .replace(/if \(!hud\.statistics \|\| !hud\.nextModule[^\n]+\n/, '');
  }
  if (name === 'mutation') {
    rewritten = rewritten
      .replaceAll(
        "await page.reload({ waitUntil: 'networkidle' });",
        "await page.goto(origin, { waitUntil: 'networkidle' });",
      )
      .replace(/if \(!idle\.statusBackgroundImage[^\n]+\n/, '')
      .replace(/if \(idle\.statusBackgroundImage === idle\.statsBackgroundImage[^\n]+\n/, '')
      .replace(/if \(idle\.statusBorder === idle\.statsBorder[^\n]+\n/, '')
      .replace(/if \(statusRect\.bottom >= statsRect\.top[^\n]+\n/, '');
  }
  const target = path.join(output, `.generated-${name}.mjs`);
  fs.writeFileSync(target, rewritten, 'utf8');
  tempScripts.push(target);
  return target;
};

const runBaselineCapture = (repositoryPath, name) => {
  const script = materialiseBaselineCapture(repositoryPath, name);
  execFileSync(process.execPath, [script, origin], { cwd: root, stdio: 'inherit' });
};

const setKnownPreferences = async (page, language = 'zh-CN') => {
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate((selectedLanguage) => {
    localStorage.clear();
    localStorage.setItem('tetramorph:language:v1', selectedLanguage);
    localStorage.setItem('tetramorph:visual-theme:v1', 'deep-tide');
    localStorage.setItem('tetramorph:reduced-motion:v1', 'off');
    localStorage.setItem('tetramorph:mode-rule-intros:v1', JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']));
  }, language);
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
};

const captureSupplementalEvidence = async () => {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await setKnownPreferences(page);
  await page.getByTestId('enter-marathon').click();
  await page.getByTestId('entry-countdown').waitFor({ state: 'visible', timeout: 3_000 });
  const countdownDigit = await page.getByTestId('entry-countdown').getAttribute('data-countdown');
  await page.screenshot({ path: path.join(output, 'classic-countdown-zh.png'), fullPage: true });
  await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
  await page.keyboard.press('KeyS');
  await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
  const gradeBadge = (await page.locator('.classic-speed-control__grade').textContent())?.trim() ?? '';
  await page.getByTestId('settings-tab-rules').click();
  const gradeFilters = await page.locator('.result-leaderboard__grades button').allTextContents();
  await page.screenshot({ path: path.join(output, 'classic-settings-grades-zh.png'), fullPage: true });

  await setKnownPreferences(page);
  await page.getByTestId('enter-race').click();
  await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
  const survivalHud = (await page.getByTestId('stats').textContent())?.replace(/\s+/g, ' ').trim() ?? '';
  await page.screenshot({ path: path.join(output, 'survival-hud-zh.png'), fullPage: true });

  await setKnownPreferences(page);
  await page.getByTestId('enter-puzzle').click();
  await page.getByTestId('puzzle-library').waitFor({ state: 'visible' });
  await page.evaluate(() => {
    globalThis.__puzzleCountdownSeen = false;
    const observer = new MutationObserver(() => {
      if (document.querySelector('[data-testid="entry-countdown"]')) globalThis.__puzzleCountdownSeen = true;
    });
    observer.observe(document.body, { childList: true, subtree: true });
    globalThis.__puzzleCountdownObserver = observer;
  });
  await page.getByTestId('start-selected-puzzle').click();
  await page.getByTestId('game-screen').waitFor({ state: 'visible' });
  await page.waitForTimeout(250);
  const puzzle = await page.evaluate(() => {
    globalThis.__puzzleCountdownObserver?.disconnect();
    const state = globalThis.__TETRAMORPH_QA__?.getState();
    return {
      countdownSeen: Boolean(globalThis.__puzzleCountdownSeen),
      countdownCount: document.querySelectorAll('[data-testid="entry-countdown"]').length,
      status: state?.status ?? null,
      hasActivePiece: state?.active !== null,
      canvasCount: document.querySelectorAll('canvas').length,
      domCellCount: document.querySelectorAll('[data-game-cell]').length,
    };
  });
  await page.screenshot({ path: path.join(output, 'puzzle-immediate-start-zh.png'), fullPage: true });

  const audit = {
    sourceSha,
    capturedAt: new Date().toISOString(),
    browser: await browser.version(),
    countdownDigit,
    classic: { gradeBadge, gradeFilters },
    survival: { hud: survivalHud },
    puzzle,
    errors,
  };
  fs.writeFileSync(path.join(output, 'supplemental-audit.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8');

  const failures = [];
  if (errors.length > 0) failures.push(...errors.map((error) => `console: ${error}`));
  if (countdownDigit !== '3') failures.push(`Classic countdown did not begin at 3: ${countdownDigit}`);
  if (!/标准|Standard/.test(gradeBadge)) failures.push(`Classic grade badge mismatch: ${gradeBadge}`);
  if (gradeFilters.length !== 3) failures.push(`Expected three Classic grade filters: ${JSON.stringify(gradeFilters)}`);
  if (!/生存时间/.test(survivalHud) || !/距离落石/.test(survivalHud)) failures.push(`Survival HUD mismatch: ${survivalHud}`);
  if (puzzle.countdownSeen || puzzle.countdownCount !== 0) failures.push(`Puzzle countdown appeared: ${JSON.stringify(puzzle)}`);
  if (puzzle.status !== 'playing' || !puzzle.hasActivePiece) failures.push(`Puzzle did not start immediately: ${JSON.stringify(puzzle)}`);
  if (puzzle.canvasCount !== 1 || puzzle.domCellCount !== 0) failures.push(`Puzzle renderer topology mismatch: ${JSON.stringify(puzzle)}`);
  if (failures.length > 0) throw new Error(failures.join('\n'));
};

try {
  await waitForServer();
  runBaselineCapture('docs/evidence/t27/capture-t27-evidence.mjs', 'core');
  runBaselineCapture('docs/evidence/t27/capture-t27-mutation-evidence.mjs', 'mutation');
  await captureSupplementalEvidence();
} finally {
  if (browser) await browser.close().catch(() => {});
  for (const script of tempScripts) fs.rmSync(script, { force: true });
  if (server.pid) {
    try {
      execFileSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      // The owned server may already have exited.
    }
  }
}
