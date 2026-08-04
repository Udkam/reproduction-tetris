import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('.');
const output = path.resolve('docs/evidence/t29');
const origin = 'http://127.0.0.1:4199';
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
fs.mkdirSync(output, { recursive: true });

const server = spawn(
  'npm.cmd',
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4199', '--strictPort'],
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
    localStorage.setItem('tetramorph:sfx-enabled:v1', 'on');
    localStorage.setItem('tetramorph:sfx-volume:v1', '1');
    localStorage.setItem(
      'tetramorph:mode-rule-intros:v1',
      JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']),
    );
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
};

const auditAudioGraph = async (page) => page.evaluate(async () => {
  const NativeAudioContext = window.AudioContext;
  const records = [];
  const contexts = [];
  let contextId = 0;

  window.AudioContext = new Proxy(NativeAudioContext, {
    construct(Target, args, NewTarget) {
      const context = Reflect.construct(Target, args, NewTarget);
      const id = ++contextId;
      const contextRecord = { id, closeCalls: 0, suspendCalls: 0 };
      contexts.push(contextRecord);
      let gainIndex = 0;
      const originalGain = context.createGain.bind(context);
      const originalOscillator = context.createOscillator.bind(context);
      const originalBufferSource = context.createBufferSource.bind(context);
      const originalFilter = context.createBiquadFilter.bind(context);
      const originalSuspend = context.suspend.bind(context);
      const originalClose = context.close.bind(context);
      context.suspend = () => {
        contextRecord.suspendCalls += 1;
        return originalSuspend();
      };
      context.close = () => {
        contextRecord.closeCalls += 1;
        return originalClose();
      };
      context.createGain = () => {
        const gain = originalGain();
        const record = { kind: 'gain', id, node: gain, gainIndex: ++gainIndex, targets: [], values: [] };
        const originalTarget = gain.gain.setTargetAtTime.bind(gain.gain);
        const originalSet = gain.gain.setValueAtTime.bind(gain.gain);
        gain.gain.setTargetAtTime = (value, time, constant) => {
          record.targets.push({ value, time, constant });
          return originalTarget(value, time, constant);
        };
        gain.gain.setValueAtTime = (value, time) => {
          record.values.push({ value, time });
          return originalSet(value, time);
        };
        records.push(record);
        return gain;
      };
      context.createOscillator = () => {
        const oscillator = originalOscillator();
        const record = { kind: 'oscillator', id, node: oscillator, frequency: null };
        const originalSet = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
        oscillator.frequency.setValueAtTime = (value, time) => {
          if (record.frequency === null) record.frequency = value;
          return originalSet(value, time);
        };
        records.push(record);
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
    ['started-silent', [{ type: 'started' }]],
    ['restarted-silent', [{ type: 'restarted' }]],
  ];

  const report = {};
  for (const [name, events] of cases) {
    const start = records.length;
    const contextStart = contexts.length;
    const engine = new AudioEngine();
    await engine.prime();
    engine.setVolume(1);
    engine.play(events);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const created = records.slice(start);
    engine.destroy();
    await new Promise((resolve) => setTimeout(resolve, 20));
    report[name] = {
      oscillators: created.filter((entry) => entry.kind === 'oscillator').length,
      buffers: created.filter((entry) => entry.kind === 'buffer').length,
      filters: created.filter((entry) => entry.kind === 'filter').length,
      oscillatorTypes: created.filter((entry) => entry.kind === 'oscillator').map((entry) => entry.node.type),
      frequencies: created.filter((entry) => entry.kind === 'oscillator').map((entry) => entry.frequency),
      contextClosed: contexts.slice(contextStart).every((entry) => entry.closeCalls === 1),
    };
  }

  const countdownEngine = new AudioEngine();
  await countdownEngine.prime();
  for (const digit of [3, 2, 1]) {
    const start = records.length;
    countdownEngine.playEntryCountdown(digit);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const created = records.slice(start);
    report[`countdown-${digit}`] = {
      oscillators: created.filter((entry) => entry.kind === 'oscillator').length,
      frequencies: created.filter((entry) => entry.kind === 'oscillator').map((entry) => entry.frequency),
    };
  }
  countdownEngine.destroy();
  await new Promise((resolve) => setTimeout(resolve, 20));

  const routingStart = records.length;
  const routingContextStart = contexts.length;
  const routingEngine = new AudioEngine();
  await routingEngine.prime();
  const routingContext = contexts.at(-1);
  const routingGains = records.slice(routingStart).filter((entry) => entry.kind === 'gain');
  routingEngine.setVolume(0.25);
  const masterGainAfterVolume = routingGains[0]?.targets.at(-1)?.value ?? null;
  routingEngine.setEnabled(false);
  const effectsGainAfterDisable = routingGains[1]?.targets.at(-1)?.value ?? null;
  const sourceCountBeforeDisabledPlay = records.filter((entry) => (
    entry.kind === 'oscillator' || entry.kind === 'buffer'
  )).length;
  routingEngine.play([{ type: 'hard-dropped', piece: 'T', distance: 12 }]);
  const sourceCountAfterDisabledPlay = records.filter((entry) => (
    entry.kind === 'oscillator' || entry.kind === 'buffer'
  )).length;
  routingEngine.setEnabled(true);
  const effectsGainAfterEnable = routingGains[1]?.targets.at(-1)?.value ?? null;
  routingEngine.play([{ type: 'hard-dropped', piece: 'T', distance: 12 }]);
  const sourceCountAfterEnabledPlay = records.filter((entry) => (
    entry.kind === 'oscillator' || entry.kind === 'buffer'
  )).length;
  routingEngine.suspend();
  await new Promise((resolve) => setTimeout(resolve, 20));
  routingEngine.destroy();
  await new Promise((resolve) => setTimeout(resolve, 20));
  const routing = {
    volume: routingEngine.getVolume(),
    enabledAfterRestore: routingEngine.isEnabled(),
    masterGainAfterVolume,
    effectsGainAfterDisable,
    effectsGainAfterEnable,
    voicesWhileDisabled: sourceCountAfterDisabledPlay - sourceCountBeforeDisabledPlay,
    voicesAfterEnable: sourceCountAfterEnabledPlay - sourceCountAfterDisabledPlay,
    suspendCalls: routingContext?.suspendCalls ?? 0,
    contextClosed: contexts.slice(routingContextStart).every((entry) => entry.closeCalls === 1),
  };

  const denseStart = records.length;
  const denseEngine = new AudioEngine();
  await denseEngine.prime();
  denseEngine.play([
    { type: 'mutation-activated', item: 'multiplier', durationTicks: 600, score: 0, rowsRemoved: 0, multiplierFactor: 4 },
    { type: 'mutation-activated', item: 'reshape', durationTicks: 0, score: 0, rowsRemoved: 0 },
    { type: 'mutation-activated', item: 'collapse', durationTicks: 300, score: 0, rowsRemoved: 0 },
    { type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0 },
    { type: 'mutation-activated', item: 'bomb', durationTicks: 0, score: 1200, rowsRemoved: 3 },
  ]);
  await new Promise((resolve) => setTimeout(resolve, 20));
  const dense = records.slice(denseStart);
  denseEngine.destroy();
  await new Promise((resolve) => setTimeout(resolve, 20));

  window.AudioContext = NativeAudioContext;
  return {
    report,
    denseMutationBatch: {
      oscillators: dense.filter((entry) => entry.kind === 'oscillator').length,
      buffers: dense.filter((entry) => entry.kind === 'buffer').length,
      totalVoices: dense.filter((entry) => entry.kind === 'oscillator' || entry.kind === 'buffer').length,
      frequencies: dense.filter((entry) => entry.kind === 'oscillator').map((entry) => entry.frequency),
    },
    routing,
    contextCount: contexts.length,
    everyContextClosed: contexts.every((entry) => entry.closeCalls === 1),
  };
});

const expectedVoices = {
  move: 1,
  'soft-drop': 1,
  rotate: 2,
  lock: 1,
  'hard-drop': 2,
  undo: 2,
  'clear-1': 2,
  'clear-2': 3,
  'clear-3': 4,
  'clear-4': 5,
  'bedrock-raised': 2,
  'bedrock-lowered': 2,
  'stone-warning': 2,
  'stone-spawn': 2,
  'stone-land': 2,
  'level-up': 4,
  finished: 5,
  'game-over': 4,
  pause: 2,
  resume: 2,
  freeze: 2,
  collapse: 2,
  bomb: 2,
  reshape: 3,
  double: 2,
  'super-double': 3,
  'started-silent': 0,
  'restarted-silent': 0,
  'countdown-3': 2,
  'countdown-2': 2,
  'countdown-1': 2,
};

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await setKnownPreferences(page);
  await page.getByTestId('enter-marathon').click();
  await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
  await page.waitForTimeout(180);
  const live = await page.evaluate(() => ({
    status: globalThis.__TETRAMORPH_QA__?.getState()?.status ?? null,
    canvasCount: document.querySelectorAll('canvas').length,
    domCellCount: document.querySelectorAll('[data-game-cell]').length,
    boardCapture: globalThis.__TETRAMORPH_QA__?.captureBoardPng() ?? null,
  }));
  await page.screenshot({ path: path.join(output, 'classic-audio-runtime.png'), fullPage: true });

  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.mouse.click(20, 20);
  const audio = await auditAudioGraph(page);
  const failures = [];
  if (errors.length > 0) failures.push(...errors.map((error) => `browser: ${error}`));
  if (live.status !== 'playing') failures.push(`Classic did not enter playing state: ${live.status}`);
  if (live.canvasCount !== 1 || live.domCellCount !== 0) failures.push(`Renderer topology mismatch: ${JSON.stringify(live)}`);
  if (!live.boardCapture || live.boardCapture.pixelProbe.distinctBuckets < 4) failures.push('Live board capture did not contain material pixels.');
  for (const [name, expected] of Object.entries(expectedVoices)) {
    const entry = audio.report[name];
    const actual = (entry?.oscillators ?? 0) + (entry?.buffers ?? 0);
    if (actual !== expected) failures.push(`${name} scheduled ${actual} voices, expected ${expected}`);
    if (entry && name !== 'countdown-3' && name !== 'countdown-2' && name !== 'countdown-1' && !entry.contextClosed) {
      failures.push(`${name} did not close its AudioContext exactly once`);
    }
  }
  if (audio.report.bomb?.buffers !== 1 || audio.report.bomb?.filters !== 1) failures.push('Bomb did not schedule its filtered material puff.');
  const clearCounts = [1, 2, 3, 4].map((count) => audio.report[`clear-${count}`]?.oscillators);
  if (clearCounts.join(',') !== '2,3,4,5') failures.push(`Clear hierarchy mismatch: ${clearCounts.join(',')}`);
  if (audio.denseMutationBatch.totalVoices !== 12 || audio.denseMutationBatch.totalVoices > 16) {
    failures.push(`Dense mutation batch used ${audio.denseMutationBatch.totalVoices} voices, expected 12 within ceiling 16.`);
  }
  if (audio.routing.volume !== 0.25 || audio.routing.enabledAfterRestore !== true) {
    failures.push(`SFX preference state did not round-trip: ${JSON.stringify(audio.routing)}`);
  }
  if (Math.abs((audio.routing.masterGainAfterVolume ?? -1) - 0.375) > 0.0001) {
    failures.push(`Master gain did not route 25% volume to 0.375: ${audio.routing.masterGainAfterVolume}`);
  }
  if (audio.routing.effectsGainAfterDisable !== 0 || audio.routing.voicesWhileDisabled !== 0) {
    failures.push(`Disabled SFX routing was not silent: ${JSON.stringify(audio.routing)}`);
  }
  if (audio.routing.effectsGainAfterEnable !== 1 || audio.routing.voicesAfterEnable !== 2) {
    failures.push(`Re-enabled SFX routing did not restore the hard-drop pair: ${JSON.stringify(audio.routing)}`);
  }
  if (audio.routing.suspendCalls !== 1 || !audio.routing.contextClosed) {
    failures.push(`SFX suspend/teardown ownership mismatch: ${JSON.stringify(audio.routing)}`);
  }
  if (!audio.everyContextClosed) failures.push('At least one audited AudioContext was not closed exactly once.');

  const audit = {
    sourceSha,
    capturedAt: new Date().toISOString(),
    browser: await browser.version(),
    live,
    audio,
    errors,
    failures,
  };
  fs.writeFileSync(path.join(output, 'audio-runtime-audit.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
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
