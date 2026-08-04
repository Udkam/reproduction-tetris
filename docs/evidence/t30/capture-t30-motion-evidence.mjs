import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('.');
const output = path.resolve('docs/evidence/t30');
const origin = 'http://127.0.0.1:4210';
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
fs.mkdirSync(output, { recursive: true });

const server = spawn(
  'npm.cmd',
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4210', '--strictPort'],
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
      // The single owned Vite process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 125));
  }
  throw new Error(`Vite did not become ready.\n${serverLog}`);
};

const setKnownPreferences = async (page) => {
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
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
};

const collectRoute = (page) => page.evaluate(() => {
  const surface = document.querySelector('.app-route-surface');
  const style = surface ? getComputedStyle(surface) : null;
  return {
    path: location.pathname,
    transitionMode: document.querySelector('.app')?.getAttribute('data-route-transition') ?? null,
    surfaceCount: document.querySelectorAll('.app-route-surface').length,
    canvasCount: document.querySelectorAll('canvas').length,
    viewTransitionName: style?.viewTransitionName ?? null,
    nativeViewTransition: typeof document.startViewTransition === 'function',
  };
});

const collectSpawn = (page) => page.evaluate(() => {
  const snapshot = globalThis.__TETRAMORPH_QA__?.getRendererSnapshot() ?? null;
  return {
    status: globalThis.__TETRAMORPH_QA__?.getState()?.status ?? null,
    canvasCount: document.querySelectorAll('canvas').length,
    domCellCount: document.querySelectorAll('[data-game-cell]').length,
    activeCells: snapshot?.activeCells ?? [],
    ghostCells: snapshot?.ghostCells ?? [],
    activeSpawnReveal: snapshot?.activeSpawnReveal ?? null,
  };
});

const writeDataUrl = (name, dataUrl) => {
  const separator = dataUrl.indexOf(',');
  if (separator < 0) throw new Error(`Malformed data URL for ${name}`);
  fs.writeFileSync(path.join(output, name), Buffer.from(dataUrl.slice(separator + 1), 'base64'));
};

const captureArrivalFrame = async (page, file, elapsedMs) => {
  const result = await page.evaluate(async ({ elapsedMs: elapsed }) => {
    const [{ TetrisRenderer }, engine] = await Promise.all([
      import('/src/game/render/TetrisRenderer.ts'),
      import('/src/game/core/engine.ts'),
    ]);
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.background = '#071724';
    const host = document.createElement('div');
    host.style.width = '560px';
    host.style.height = '900px';
    host.style.margin = '0 auto';
    document.body.append(host);

    const renderer = new TetrisRenderer();
    await renderer.init(host);
    renderer.setOptions({ visualTheme: 'deep-tide', reducedMotion: false });
    const initial = engine.createInitialState(0x30a0, 'marathon');
    const state = { ...initial, status: 'playing', phase: 'falling' };
    renderer.render(state, [], 0);
    renderer.render(state, [], elapsed);
    const capture = renderer.captureBoardPng();
    const snapshot = renderer.getSnapshot();
    renderer.destroy();
    return {
      dataUrl: capture.dataUrl,
      frame: capture.frame,
      pixelProbe: capture.pixelProbe,
      activeCells: snapshot.activeCells,
      activeSpawnReveal: snapshot.activeSpawnReveal,
      canvasCountAfterDestroy: document.querySelectorAll('canvas').length,
    };
  }, { elapsedMs });
  writeDataUrl(file, result.dataUrl);
  return { ...result, dataUrl: undefined };
};

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await setKnownPreferences(page);
  const home = await collectRoute(page);
  await page.screenshot({ path: path.join(output, 'home-final.png'), fullPage: true });

  await page.getByTestId('enter-puzzle').click();
  await page.getByTestId('puzzle-library').waitFor();
  const puzzle = await collectRoute(page);
  await page.screenshot({ path: path.join(output, 'puzzle-route-final.png'), fullPage: true });

  await page.goBack({ waitUntil: 'networkidle' });
  await page.getByTestId('mode-home').waitFor();
  const returnedHome = await collectRoute(page);

  await page.getByTestId('enter-marathon').click();
  await page.getByTestId('game-screen').waitFor();
  const gameRoute = await collectRoute(page);
  await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
  // The entry cover and first reveal intentionally overlap. Settle that first piece,
  // then hard-drop it so the next canonical spawn can be sampled from its first frame.
  await page.waitForTimeout(240);
  await page.evaluate(() => globalThis.__TETRAMORPH_QA__?.action('hard-drop'));
  await page.waitForFunction(
    () => globalThis.__TETRAMORPH_QA__?.getRendererSnapshot()?.activeSpawnReveal !== null,
    null,
    { timeout: 2_000, polling: 10 },
  );
  const arrivalEarly = await collectSpawn(page);
  await page.waitForFunction(
    () => globalThis.__TETRAMORPH_QA__?.getRendererSnapshot()?.activeSpawnReveal === null,
    null,
    { timeout: 2_000, polling: 10 },
  );
  const arrivalComplete = await collectSpawn(page);

  const renderPage = await context.newPage();
  renderPage.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  renderPage.on('pageerror', (error) => errors.push(error.message));
  await renderPage.goto(origin, { waitUntil: 'networkidle' });
  const arrivalFrames = {
    early: await captureArrivalFrame(renderPage, 'arrival-early.png', 48),
    middle: await captureArrivalFrame(renderPage, 'arrival-middle.png', 112),
    complete: await captureArrivalFrame(renderPage, 'arrival-complete.png', 220),
  };

  const failures = [];
  const routes = { home, puzzle, returnedHome, gameRoute };
  for (const [name, route] of Object.entries(routes)) {
    if (route.surfaceCount !== 1) failures.push(`${name} has ${route.surfaceCount} route surfaces`);
    if (route.viewTransitionName !== 'app-route') failures.push(`${name} route surface is unnamed`);
  }
  if (home.path !== '/' || puzzle.path !== '/puzzles' || returnedHome.path !== '/' || gameRoute.path !== '/play/classic') {
    failures.push(`route history mismatch: ${JSON.stringify(routes)}`);
  }
  if (arrivalComplete.canvasCount !== 1 || arrivalComplete.domCellCount !== 0) {
    failures.push(`renderer topology mismatch: ${JSON.stringify({ gameRoute, arrivalComplete })}`);
  }
  if (!arrivalEarly.activeSpawnReveal) failures.push('early arrival snapshot is missing');
  if (arrivalEarly.activeSpawnReveal) {
    const progress = arrivalEarly.activeSpawnReveal.cellProgress;
    if (!progress.some((value) => value > 0) || !progress.some((value) => value < 1)) {
      failures.push(`early arrival is not staged: ${JSON.stringify(progress)}`);
    }
    if (arrivalEarly.activeSpawnReveal.ghostProgress !== 0) {
      failures.push(`ghost appeared before the active piece: ${arrivalEarly.activeSpawnReveal.ghostProgress}`);
    }
  }
  if (arrivalComplete.activeSpawnReveal !== null) failures.push('arrival did not settle');
  for (const [name, frame] of Object.entries(arrivalFrames)) {
    if (frame.canvasCountAfterDestroy !== 0) failures.push(`${name} frame leaked a Canvas`);
    if (frame.pixelProbe.distinctBuckets < 3 || frame.pixelProbe.nonTransparentSamples === 0) {
      failures.push(`${name} frame capture is empty: ${JSON.stringify(frame.pixelProbe)}`);
    }
  }
  const earlyProgress = arrivalFrames.early.activeSpawnReveal?.cellProgress ?? [];
  const middleProgress = arrivalFrames.middle.activeSpawnReveal?.cellProgress ?? [];
  if (!earlyProgress.some((value) => value > 0) || !earlyProgress.some((value) => value === 0)) {
    failures.push(`early frame is not staged: ${JSON.stringify(earlyProgress)}`);
  }
  if (!middleProgress.every((value) => value > 0) || !middleProgress.some((value) => value < 1)) {
    failures.push(`middle frame is not progressive: ${JSON.stringify(middleProgress)}`);
  }
  if (arrivalFrames.complete.activeSpawnReveal !== null) failures.push('complete frame did not settle');
  if (errors.length > 0) failures.push(...errors.map((error) => `browser: ${error}`));

  const audit = {
    sourceSha,
    capturedAt: new Date().toISOString(),
    browser: await browser.version(),
    routes,
    arrival: { liveEarly: arrivalEarly, liveComplete: arrivalComplete, frames: arrivalFrames },
    errors,
    failures,
  };
  fs.writeFileSync(path.join(output, 'audit.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
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
