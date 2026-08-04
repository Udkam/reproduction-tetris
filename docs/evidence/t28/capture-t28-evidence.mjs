import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('.');
const output = path.resolve('docs/evidence/t28');
const origin = 'http://127.0.0.1:4198';
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
fs.mkdirSync(output, { recursive: true });

const server = spawn(
  'npm.cmd',
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4198', '--strictPort'],
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

const writeDataUrl = (name, dataUrl) => {
  const separator = dataUrl.indexOf(',');
  if (separator < 0) throw new Error(`Malformed data URL for ${name}`);
  fs.writeFileSync(path.join(output, name), Buffer.from(dataUrl.slice(separator + 1), 'base64'));
};

const captureRendererFrame = async (page, spec) => {
  const result = await page.evaluate(async (frameSpec) => {
    const [{ TetrisRenderer }, engine, boardModule] = await Promise.all([
      import('/src/game/render/TetrisRenderer.ts'),
      import('/src/game/core/engine.ts'),
      import('/src/game/core/board.ts'),
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
    renderer.setOptions({
      visualTheme: 'deep-tide',
      reducedMotion: frameSpec.reducedMotion,
    });

    let board = boardModule.createBoard();
    const pendingRows = [];
    const firstPendingRow = 40 - frameSpec.clearCount;
    for (let y = firstPendingRow; y < 40; y += 1) {
      pendingRows.push(y);
      for (let x = 0; x < 10; x += 1) {
        const material = frameSpec.mode === 'race' && x === 8 ? 'R' : ['I', 'T', 'L', 'S'][y % 4];
        board = boardModule.setCell(board, x, y, material);
      }
    }
    if (frameSpec.mode === 'race') {
      for (let x = 0; x < 10; x += 1) board = boardModule.setCell(board, x, firstPendingRow - 1, 'B');
    }
    if (frameSpec.anchor) board = boardModule.setCell(board, 0, firstPendingRow - 2, 'A');

    const base = engine.createInitialState(0x28a0 + frameSpec.clearCount, frameSpec.mode);
    const mutationCarriers = frameSpec.mutationItem
      ? [{ id: 28, item: frameSpec.mutationItem, cells: [{ x: 4, y: pendingRows[0] }] }]
      : [];
    const state = {
      ...base,
      board,
      active: null,
      status: 'playing',
      phase: 'line-clear',
      phaseTicks: 5,
      pendingClearRows: pendingRows,
      mutationCarriers,
    };

    renderer.render(state, [], 100);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    renderer.render(state, [], 16.67);
    const capture = renderer.captureBoardPng();
    const snapshot = renderer.getSnapshot();
    renderer.destroy();
    const canvasCountAfterDestroy = document.querySelectorAll('canvas').length;
    return {
      dataUrl: capture.dataUrl,
      frame: capture.frame,
      pixelProbe: capture.pixelProbe,
      classicFeedback: snapshot.classicFeedback,
      canvasCountAfterDestroy,
    };
  }, spec);
  writeDataUrl(spec.file, result.dataUrl);
  return { ...result, dataUrl: undefined };
};

const auditAudioGraph = async (page) => page.evaluate(async () => {
  const NativeAudioContext = window.AudioContext;
  const records = [];
  let contextId = 0;
  window.AudioContext = new Proxy(NativeAudioContext, {
    construct(Target, args, NewTarget) {
      const context = Reflect.construct(Target, args, NewTarget);
      const id = ++contextId;
      const originalOscillator = context.createOscillator.bind(context);
      const originalBufferSource = context.createBufferSource.bind(context);
      const originalFilter = context.createBiquadFilter.bind(context);
      context.createOscillator = () => {
        const oscillator = originalOscillator();
        records.push({ kind: 'oscillator', id, node: oscillator });
        return oscillator;
      };
      context.createBufferSource = () => {
        const source = originalBufferSource();
        records.push({ kind: 'buffer', id, node: source });
        return source;
      };
      context.createBiquadFilter = () => {
        const filter = originalFilter();
        records.push({ kind: 'filter', id, node: filter });
        return filter;
      };
      return context;
    },
  });

  const { AudioEngine } = await import('/src/game/audio/AudioEngine.ts');
  const cases = [
    ['move', [{ type: 'piece-moved', piece: 'T', dx: 1, dy: 0, cause: 'move' }]],
    ['soft-drop', [{ type: 'piece-moved', piece: 'T', dx: 0, dy: 1, cause: 'soft-drop' }]],
    ['rotate', [{ type: 'piece-rotated', piece: 'T', direction: 1 }]],
    ['lock', [{ type: 'piece-locked', piece: 'T', cells: [] }]],
    ['hard-drop', [{ type: 'hard-dropped', piece: 'T', distance: 12 }]],
    ['undo', [{ type: 'puzzle-undone' }]],
    ['clear-1', [{ type: 'lines-cleared', rows: [39], count: 1, score: 100 }]],
    ['clear-2', [{ type: 'lines-cleared', rows: [38, 39], count: 2, score: 300 }]],
    ['clear-3', [{ type: 'lines-cleared', rows: [37, 38, 39], count: 3, score: 500 }]],
    ['clear-4', [{ type: 'lines-cleared', rows: [36, 37, 38, 39], count: 4, score: 800 }]],
    ['bedrock-raised', [{ type: 'bedrock-raised', count: 1, height: 3 }]],
    ['bedrock-lowered', [{ type: 'bedrock-lowered', count: 1, height: 2 }]],
    ['stone-warning', [{ type: 'survival-stones-warned', columns: [4], height: 2, leadPieces: 1 }]],
    ['stone-spawn', [{ type: 'survival-stones-spawned', cells: [{ x: 4, y: 20 }], intervalPieces: 8, nextIntervalPieces: 8 }]],
    ['stone-land', [{ type: 'survival-stones-landed', cells: [{ x: 4, y: 39 }] }]],
    ['level-up', [{ type: 'level-up', level: 2 }]],
    ['finished', [{ type: 'finished', completionTicks: 120 }]],
    ['game-over', [{ type: 'game-over', reason: 'block-out' }]],
    ['pause', [{ type: 'paused' }]],
    ['resume', [{ type: 'resumed' }]],
    ['freeze', [{ type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0 }]],
    ['collapse', [{ type: 'mutation-activated', item: 'collapse', durationTicks: 300, score: 0, rowsRemoved: 0 }]],
    ['bomb', [{ type: 'mutation-activated', item: 'bomb', durationTicks: 0, score: 1200, rowsRemoved: 3 }]],
    ['reshape', [{ type: 'mutation-activated', item: 'reshape', durationTicks: 0, score: 0, rowsRemoved: 0 }]],
    ['double', [{ type: 'mutation-activated', item: 'multiplier', durationTicks: 600, score: 0, rowsRemoved: 0, multiplierFactor: 2 }]],
    ['super-double', [{ type: 'mutation-activated', item: 'multiplier', durationTicks: 600, score: 0, rowsRemoved: 0, multiplierFactor: 4 }]],
  ];

  const report = {};
  for (const [name, events] of cases) {
    const start = records.length;
    const engine = new AudioEngine();
    await engine.prime();
    engine.setVolume(1);
    engine.play(events);
    await new Promise((resolve) => setTimeout(resolve, 25));
    const created = records.slice(start);
    report[name] = {
      oscillators: created.filter((entry) => entry.kind === 'oscillator').length,
      buffers: created.filter((entry) => entry.kind === 'buffer').length,
      filters: created.filter((entry) => entry.kind === 'filter').length,
      oscillatorTypes: created
        .filter((entry) => entry.kind === 'oscillator')
        .map((entry) => entry.node.type),
      frequencies: created
        .filter((entry) => entry.kind === 'oscillator')
        .map((entry) => Math.round(entry.node.frequency.value * 100) / 100),
    };
    engine.destroy();
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  const countdownEngine = new AudioEngine();
  await countdownEngine.prime();
  for (const digit of [3, 2, 1]) {
    const start = records.length;
    countdownEngine.playEntryCountdown(digit);
    await new Promise((resolve) => setTimeout(resolve, 10));
    report[`countdown-${digit}`] = {
      oscillators: records.slice(start).filter((entry) => entry.kind === 'oscillator').length,
      frequencies: records.slice(start)
        .filter((entry) => entry.kind === 'oscillator')
        .map((entry) => Math.round(entry.node.frequency.value * 100) / 100),
    };
  }
  countdownEngine.destroy();
  window.AudioContext = NativeAudioContext;
  return report;
});

const expectedOscillators = {
  move: 1,
  'soft-drop': 1,
  rotate: 2,
  lock: 1,
  'hard-drop': 2,
  undo: 1,
  'clear-1': 2,
  'clear-2': 3,
  'clear-3': 4,
  'clear-4': 5,
  'bedrock-raised': 2,
  'bedrock-lowered': 1,
  'stone-warning': 2,
  'stone-spawn': 1,
  'stone-land': 2,
  'level-up': 4,
  finished: 4,
  'game-over': 3,
  pause: 2,
  resume: 2,
  freeze: 1,
  collapse: 2,
  bomb: 1,
  reshape: 3,
  double: 4,
  'super-double': 6,
  'countdown-3': 2,
  'countdown-2': 2,
  'countdown-1': 2,
};

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  const attachErrorListeners = (page) => {
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
  };

  const livePage = await context.newPage();
  attachErrorListeners(livePage);
  await setKnownPreferences(livePage);
  await livePage.getByTestId('enter-marathon').click();
  await livePage.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
  await livePage.waitForTimeout(150);
  const live = await livePage.evaluate(() => ({
    status: globalThis.__TETRAMORPH_QA__?.getState()?.status ?? null,
    canvasCount: document.querySelectorAll('canvas').length,
    domCellCount: document.querySelectorAll('[data-game-cell]').length,
    rendererSnapshot: globalThis.__TETRAMORPH_QA__?.getRendererSnapshot() ?? null,
    boardCapture: globalThis.__TETRAMORPH_QA__?.captureBoardPng() ?? null,
  }));
  await livePage.screenshot({ path: path.join(output, 'classic-live.png'), fullPage: true });

  await livePage.goto(origin, { waitUntil: 'networkidle' });
  await livePage.mouse.click(20, 20);
  const audio = await auditAudioGraph(livePage);

  const renderPage = await context.newPage();
  attachErrorListeners(renderPage);
  await renderPage.goto(origin, { waitUntil: 'networkidle' });
  const frames = {};
  for (const reducedMotion of [false, true]) {
    for (const clearCount of [1, 2, 3, 4]) {
      const file = `${reducedMotion ? 'reduced' : 'full'}-clear-${clearCount}.png`;
      frames[file] = await captureRendererFrame(renderPage, {
        file,
        clearCount,
        reducedMotion,
        mode: 'marathon',
        anchor: clearCount === 1,
        mutationItem: null,
      });
    }
  }
  const conflictSpecs = [
    { file: 'survival-stone-clear.png', clearCount: 2, reducedMotion: false, mode: 'race', anchor: false, mutationItem: null },
    { file: 'mutation-activation-clear.png', clearCount: 3, reducedMotion: false, mode: 'sprint', anchor: false, mutationItem: 'freeze' },
    { file: 'bomb-priority-clear.png', clearCount: 3, reducedMotion: false, mode: 'sprint', anchor: false, mutationItem: 'bomb' },
    { file: 'puzzle-restrained-clear.png', clearCount: 2, reducedMotion: false, mode: 'puzzle', anchor: true, mutationItem: null },
  ];
  for (const spec of conflictSpecs) frames[spec.file] = await captureRendererFrame(renderPage, spec);

  const failures = [];
  if (errors.length > 0) failures.push(...errors.map((error) => `browser: ${error}`));
  if (live.status !== 'playing') failures.push(`Live Classic did not enter playing: ${live.status}`);
  if (live.canvasCount !== 1 || live.domCellCount !== 0) {
    failures.push(`Renderer topology mismatch: ${JSON.stringify(live)}`);
  }
  if (!live.boardCapture || live.boardCapture.pixelProbe.distinctBuckets < 4) {
    failures.push(`Live board capture probe is empty: ${JSON.stringify(live.boardCapture)}`);
  }
  for (const [name, expected] of Object.entries(expectedOscillators)) {
    if (audio[name]?.oscillators !== expected) {
      failures.push(`${name} scheduled ${audio[name]?.oscillators ?? 'missing'} oscillators, expected ${expected}`);
    }
  }
  if (audio.bomb?.buffers !== 1 || audio.bomb?.filters !== 1) {
    failures.push(`Bomb material graph mismatch: ${JSON.stringify(audio.bomb)}`);
  }
  for (const [file, frame] of Object.entries(frames)) {
    if (frame.canvasCountAfterDestroy !== 0) failures.push(`${file} leaked a Canvas after destroy`);
    if (frame.pixelProbe.distinctBuckets < 4 || frame.pixelProbe.nonTransparentSamples === 0) {
      failures.push(`${file} capture probe is empty: ${JSON.stringify(frame.pixelProbe)}`);
    }
  }

  const audit = {
    sourceSha,
    capturedAt: new Date().toISOString(),
    browser: await browser.version(),
    live,
    audio,
    frames,
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
