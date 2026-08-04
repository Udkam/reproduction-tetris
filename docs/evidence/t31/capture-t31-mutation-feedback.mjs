import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('.');
const output = path.resolve('docs/evidence/t31');
const origin = 'http://127.0.0.1:4211';
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const scenarios = JSON.parse(fs.readFileSync(
  path.resolve('docs/evidence/t26/phase-d/mutation-scenarios.json'),
  'utf8',
));
fs.mkdirSync(output, { recursive: true });

const server = spawn(
  'npm.cmd',
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4211', '--strictPort'],
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

const writeDataUrl = (name, dataUrl) => {
  const separator = dataUrl.indexOf(',');
  if (separator < 0) throw new Error(`Malformed data URL for ${name}`);
  fs.writeFileSync(path.join(output, name), Buffer.from(dataUrl.slice(separator + 1), 'base64'));
};

const setKnownPreferences = async (page, seed) => {
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(({ deterministicSeed }) => {
    localStorage.clear();
    localStorage.setItem('tetramorph:qa-seed', String(deterministicSeed));
    localStorage.setItem('tetramorph:language:v1', 'en');
    localStorage.setItem('tetramorph:visual-theme:v1', 'deep-tide');
    localStorage.setItem('tetramorph:reduced-motion:v1', 'off');
    localStorage.setItem(
      'tetramorph:mode-rule-intros:v1',
      JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']),
    );
  }, { deterministicSeed: seed });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
};

const collectMutationStatus = (page) => page.evaluate(() => {
  const status = document.querySelector('[data-testid="mutation-status"]');
  const ledger = status?.querySelector('.mutation-status__ledger');
  const row = status?.querySelector('.mutation-status__effect');
  const rowStyle = row ? getComputedStyle(row) : null;
  const copy = row?.querySelector('.mutation-status__effect-copy');
  const copyStyle = copy ? getComputedStyle(copy) : null;
  const meter = row?.querySelector('.mutation-status__meter');
  const meterFill = meter?.querySelector('i');
  const meterBox = meter?.getBoundingClientRect();
  const meterFillBox = meterFill?.getBoundingClientRect();
  return {
    text: status?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
    idleMarkerCount: status?.querySelectorAll('[data-testid="mutation-status-idle"]').length ?? -1,
    ledgerChildren: ledger?.children.length ?? -1,
    rowCount: status?.querySelectorAll('.mutation-status__effect').length ?? -1,
    name: row?.querySelector('.mutation-status__effect-copy > b')?.textContent?.trim() ?? null,
    subcopy: row?.querySelector('.mutation-status__effect-copy > small')?.textContent?.trim() ?? null,
    seconds: row?.querySelector('em')?.textContent?.trim() ?? null,
    rowBorderWidths: rowStyle
      ? [rowStyle.borderTopWidth, rowStyle.borderRightWidth, rowStyle.borderBottomWidth, rowStyle.borderLeftWidth]
      : null,
    rowBackground: rowStyle?.backgroundColor ?? null,
    copyBorderWidths: copyStyle
      ? [copyStyle.borderTopWidth, copyStyle.borderRightWidth, copyStyle.borderBottomWidth, copyStyle.borderLeftWidth]
      : null,
    copyBackground: copyStyle?.backgroundColor ?? null,
    meterWidth: meterFillBox?.width ?? 0,
    meterTrackHeight: meterBox?.height ?? 0,
    meterFillHeight: meterFillBox?.height ?? 0,
  };
});

const qaActions = (page, actions) => page.evaluate((values) => {
  const qa = globalThis.__TETRAMORPH_QA__;
  if (!qa) throw new Error('Missing DEV QA surface.');
  for (const action of values) qa.action(action);
}, actions);

const advanceToActive = (page) => page.evaluate(() => {
  const qa = globalThis.__TETRAMORPH_QA__;
  if (!qa) throw new Error('Missing DEV QA surface.');
  for (let tick = 0; tick <= 120; tick += 1) {
    const state = qa.getState();
    if (state.active !== null && state.status === 'playing') return state;
    qa.advanceTicks(1);
  }
  throw new Error('The next active piece did not spawn.');
});

const findActivationSeed = (page, actionGroups, targetItem) => page.evaluate(async ({ groups, target }) => {
  const { createInitialState, dispatch } = await import('/src/game/core/engine.ts');
  const toCommand = (action) => {
    if (action === 'left') return { type: 'move', dx: -1 };
    if (action === 'right') return { type: 'move', dx: 1 };
    if (action === 'hard-drop') return { type: 'hard-drop' };
    throw new Error(`Unsupported evidence action: ${action}`);
  };

  for (let seed = 1; seed <= 4096; seed += 1) {
    let transition = dispatch(createInitialState(seed, 'sprint'), { type: 'start' });
    let state = transition.state;
    for (const group of groups) {
      for (const action of group) {
        transition = dispatch(state, toCommand(action));
        state = transition.state;
        if (transition.events.some((event) => event.type === 'mutation-activated' && event.item === target)) {
          return seed;
        }
      }
      for (let tick = 0; tick <= 120 && state.active === null && state.status === 'playing'; tick += 1) {
        transition = dispatch(state, { type: 'tick' });
        state = transition.state;
        if (transition.events.some((event) => event.type === 'mutation-activated' && event.item === target)) {
          return seed;
        }
      }
      if (state.status === 'game-over') break;
    }
  }
  return null;
}, { groups: actionGroups, target: targetItem });

const captureRendererFrame = async (page, file, scenario) => {
  const result = await page.evaluate(async (request) => {
    const [{ TetrisRenderer }, engine, constants] = await Promise.all([
      import('/src/game/render/TetrisRenderer.ts'),
      import('/src/game/core/engine.ts'),
      import('/src/game/core/constants.ts'),
    ]);
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.background = '#071724';
    const host = document.createElement('div');
    // Keep the isolated fallback preview beside the board so the board-only
    // entry captures prove the mouth transition without a synthetic HUD
    // preview overlapping the first visible row.
    host.style.width = '960px';
    host.style.height = '900px';
    host.style.margin = '0 auto';
    document.body.append(host);

    const renderer = new TetrisRenderer();
    await renderer.init(host);
    renderer.setOptions({ visualTheme: 'deep-tide', reducedMotion: false });
    const initial = engine.createInitialState(0x31a0, 'sprint');
    let state = {
      ...initial,
      status: 'playing',
      phase: 'active',
      active: { type: 'T', rotation: 0, x: 3, y: request.kind === 'spawn' ? 19 : 20 },
      pieceCount: 1,
    };
    let events = [];

    if (request.kind === 'activation') {
      state = {
        ...state,
        active: { type: 'T', rotation: 0, x: 3, y: 28 },
        mutationFreezeTicks: request.item === 'freeze' ? 600 : 0,
        mutationCollapseTicks: request.item === 'collapse' ? 300 : 0,
        mutationCollapseLandingLatched: request.item === 'collapse',
      };
      events = [{
        type: 'mutation-activated',
        item: request.item,
        durationTicks: request.item === 'collapse' ? 300 : 600,
        score: 0,
        rowsRemoved: 0,
        triggerCells: [
          { x: 3, y: constants.VISIBLE_START_ROW + 12 },
          { x: 6, y: constants.VISIBLE_START_ROW + 14 },
        ],
      }];
    } else if (request.kind === 'clear') {
      const board = initial.board.map((row) => [...row]);
      const row = constants.BOARD_HEIGHT - 1;
      board[row] = Array.from({ length: constants.BOARD_WIDTH }, () => 'I');
      state = {
        ...state,
        board,
        active: null,
        phase: 'line-clear',
        phaseTicks: 5,
        pendingClearRows: [row],
        mutationCarriers: [{ id: 1, item: request.item, cells: [{ x: 4, y: row }] }],
      };
    } else if (request.kind === 'trail') {
      state = {
        ...state,
        active: { type: 'T', rotation: 0, x: 3, y: 28 },
        mutationCollapseTicks: 300,
        mutationCollapseLandingLatched: true,
      };
    }

    renderer.render(state, events, 0);
    if (request.kind === 'spawn' && request.stage !== 'first-row') {
      state = {
        ...state,
        active: state.active ? { ...state.active, y: 20 } : null,
      };
      const frameCount = request.stage === 'crossing' ? 1 : 32;
      for (let frame = 0; frame < frameCount; frame += 1) {
        renderer.render(state, [], 16);
      }
    } else {
      renderer.render(state, [], request.elapsedMs);
    }
    const capture = renderer.captureBoardPng();
    const snapshot = renderer.getSnapshot();
    renderer.destroy();
    return {
      dataUrl: capture.dataUrl,
      frame: capture.frame,
      pixelProbe: capture.pixelProbe,
      snapshot,
      canvasCountAfterDestroy: document.querySelectorAll('canvas').length,
    };
  }, scenario);
  writeDataUrl(file, result.dataUrl);
  return { ...result, dataUrl: undefined };
};

const collectGhostLatchProjection = (page) => page.evaluate(async () => {
  const [engine, presentation, constants] = await Promise.all([
    import('/src/game/core/engine.ts'),
    import('/src/game/render/presentation.ts'),
    import('/src/game/core/constants.ts'),
  ]);
  const initial = engine.createInitialState(0x31b0, 'sprint');
  const board = initial.board.map((row) => [...row]);
  board[constants.BOARD_HEIGHT - 1][3] = 'I';
  board[constants.BOARD_HEIGHT - 2][3] = 'T';
  board[constants.BOARD_HEIGHT - 1][4] = 'L';
  const base = {
    ...initial,
    board,
    status: 'playing',
    phase: 'active',
    active: { type: 'O', rotation: 0, x: 3, y: 20 },
  };
  const ordinary = presentation.projectedLandingCells({
    ...base,
    mutationCollapseTicks: 0,
    mutationCollapseLandingLatched: false,
  });
  const active = presentation.projectedLandingCells({
    ...base,
    mutationCollapseTicks: 300,
    mutationCollapseLandingLatched: true,
  });
  const expiredButLatchedState = {
    ...base,
    mutationCollapseTicks: 0,
    mutationCollapseLandingLatched: true,
  };
  const expiredButLatched = presentation.projectedLandingCells(expiredButLatchedState);
  const timerEndpoint = engine.dispatch({
    ...base,
    mutationCollapseTicks: 1,
    mutationCollapseLandingLatched: false,
  }, { type: 'tick' }).state;
  const locked = engine.dispatch(timerEndpoint, { type: 'hard-drop' });
  const lockedEvent = locked.events.find((event) => event.type === 'piece-locked');
  return {
    ordinary,
    active,
    expiredButLatched,
    coreEndpoint: {
      ticksAfterExpiry: timerEndpoint.mutationCollapseTicks,
      landingLatchedAfterExpiry: timerEndpoint.mutationCollapseLandingLatched,
      ghostAfterExpiry: presentation.projectedLandingCells(timerEndpoint),
      lockedCells: lockedEvent?.cells ?? [],
      landingLatchedAfterLock: locked.state.mutationCollapseLandingLatched,
    },
  };
});

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];

  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const original = Crypto.prototype.getRandomValues;
    Crypto.prototype.getRandomValues = function deterministicQaSeed(array) {
      if (array instanceof Uint32Array && array.length === 1) {
        array[0] = Number(globalThis.localStorage?.getItem('tetramorph:qa-seed') ?? 308) >>> 0;
        return array;
      }
      return original.call(this, array);
    };
  });

  await page.goto(origin, { waitUntil: 'networkidle' });
  const liveSeed = await findActivationSeed(page, scenarios.collapse.actions, 'collapse');
  if (liveSeed === null) throw new Error('Unable to find a deterministic live Supergravity activation seed.');
  await setKnownPreferences(page, liveSeed);
  await page.getByTestId('enter-sprint').click();
  await page.getByTestId('game-screen').waitFor({ state: 'visible' });
  await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
  await page.evaluate(() => globalThis.__TETRAMORPH_QA__?.setFrozen(true));

  const idle = await collectMutationStatus(page);
  await page.screenshot({ path: path.join(output, 'mutation-idle-final.png'), fullPage: true });

  for (const actions of scenarios.collapse.actions) {
    await qaActions(page, actions);
    await advanceToActive(page);
  }
  await page.waitForTimeout(120);
  const activeStatus = await collectMutationStatus(page);
  const activeState = await page.evaluate(() => ({
    state: globalThis.__TETRAMORPH_QA__?.getState() ?? null,
    renderer: globalThis.__TETRAMORPH_QA__?.getRendererSnapshot() ?? null,
    canvasCount: document.querySelectorAll('canvas').length,
    domCellCount: document.querySelectorAll('[data-game-cell]').length,
  }));
  await page.screenshot({ path: path.join(output, 'supergravity-active-final.png'), fullPage: true });
  const ghostLatch = await collectGhostLatchProjection(page);

  const renderPage = await context.newPage();
  renderPage.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  renderPage.on('pageerror', (error) => errors.push(error.message));
  await renderPage.goto(origin, { waitUntil: 'networkidle' });

  const frames = {
    spawnEarly: await captureRendererFrame(renderPage, 'spawn-row-early.png', { kind: 'spawn', stage: 'first-row', elapsedMs: 0 }),
    spawnMiddle: await captureRendererFrame(renderPage, 'spawn-row-middle.png', { kind: 'spawn', stage: 'crossing', elapsedMs: 0 }),
    spawnComplete: await captureRendererFrame(renderPage, 'spawn-row-complete.png', { kind: 'spawn', stage: 'settled', elapsedMs: 0 }),
    iceActivationBloom: await captureRendererFrame(renderPage, 'ice-activation-bloom.png', { kind: 'activation', item: 'freeze', elapsedMs: 60 }),
    iceActivationFacet: await captureRendererFrame(renderPage, 'ice-activation-final.png', { kind: 'activation', item: 'freeze', elapsedMs: 160 }),
    supergravityActivationPressure: await captureRendererFrame(renderPage, 'supergravity-activation-final.png', { kind: 'activation', item: 'collapse', elapsedMs: 60 }),
    supergravityActivationRelease: await captureRendererFrame(renderPage, 'supergravity-activation-release.png', { kind: 'activation', item: 'collapse', elapsedMs: 160 }),
    iceClear: await captureRendererFrame(renderPage, 'ice-line-clear-final.png', { kind: 'clear', item: 'freeze', elapsedMs: 0 }),
    supergravityClear: await captureRendererFrame(renderPage, 'supergravity-line-clear-final.png', { kind: 'clear', item: 'collapse', elapsedMs: 0 }),
    supergravityTrail: await captureRendererFrame(renderPage, 'supergravity-trail-final.png', { kind: 'trail', elapsedMs: 220 }),
  };

  const failures = [];
  if (errors.length > 0) failures.push(...errors.map((error) => `browser: ${error}`));
  if (activeState.canvasCount !== 1 || activeState.domCellCount !== 0) {
    failures.push(`renderer topology mismatch: ${JSON.stringify(activeState)}`);
  }
  if (idle.idleMarkerCount !== 0 || idle.ledgerChildren !== 0 || idle.rowCount !== 0) {
    failures.push(`idle mutation ledger is not empty: ${JSON.stringify(idle)}`);
  }
  if (activeStatus.rowCount !== 1 || !/Supergravity/i.test(activeStatus.name ?? '')) {
    failures.push(`active mutation row mismatch: ${JSON.stringify(activeStatus)}`);
  }
  if (activeStatus.subcopy !== null || activeStatus.seconds !== null) {
    failures.push(`active mutation row restored forbidden subcopy or seconds: ${JSON.stringify(activeStatus)}`);
  }
  if (!activeStatus.rowBorderWidths?.every((width) => width === '0px')) {
    failures.push(`mutation row still has a card border: ${JSON.stringify(activeStatus)}`);
  }
  if (!['rgba(0, 0, 0, 0)', 'transparent'].includes(activeStatus.rowBackground ?? '')) {
    failures.push(`mutation row still has a card background: ${JSON.stringify(activeStatus)}`);
  }
  if (!activeStatus.copyBorderWidths?.every((width) => width === '0px')) {
    failures.push(`mutation copy still has a card border: ${JSON.stringify(activeStatus)}`);
  }
  if (!['rgba(0, 0, 0, 0)', 'transparent'].includes(activeStatus.copyBackground ?? '')) {
    failures.push(`mutation copy still has a card background: ${JSON.stringify(activeStatus)}`);
  }
  if (activeStatus.meterWidth <= 0) failures.push(`mutation meter is empty: ${JSON.stringify(activeStatus)}`);
  if (activeStatus.meterTrackHeight !== 1 || activeStatus.meterFillHeight !== 1) {
    failures.push(`mutation timer is not a one-pixel hairline: ${JSON.stringify(activeStatus)}`);
  }
  if ((activeState.state?.mutationCollapseTicks ?? 0) <= 0) {
    failures.push(`Supergravity was not activated: ${JSON.stringify(activeState.state)}`);
  }
  if (
    activeState.renderer?.previewLayerVisible !== true
    || !Array.isArray(activeState.renderer?.previewPieces)
    || activeState.renderer.previewPieces.length < 1
  ) {
    failures.push(`Next preview is not visible: ${JSON.stringify(activeState.renderer)}`);
  }
  if (JSON.stringify(ghostLatch.ordinary) === JSON.stringify(ghostLatch.active)) {
    failures.push(`ordinary and Supergravity ghosts are identical: ${JSON.stringify(ghostLatch)}`);
  }
  if (JSON.stringify(ghostLatch.active) !== JSON.stringify(ghostLatch.expiredButLatched)) {
    failures.push(`expired latched ghost changed: ${JSON.stringify(ghostLatch)}`);
  }
  if (
    ghostLatch.coreEndpoint.ticksAfterExpiry !== 0
    || ghostLatch.coreEndpoint.landingLatchedAfterExpiry !== true
    || ghostLatch.coreEndpoint.landingLatchedAfterLock !== false
    || JSON.stringify(ghostLatch.coreEndpoint.ghostAfterExpiry) !== JSON.stringify(ghostLatch.coreEndpoint.lockedCells)
  ) {
    failures.push(`Supergravity endpoint compensation is inconsistent: ${JSON.stringify(ghostLatch.coreEndpoint)}`);
  }

  if (
    frames.spawnEarly.snapshot.activeSpawnEntry?.pending !== true
    || frames.spawnEarly.snapshot.activeSpawnEntry?.visibleCellCount !== 3
    || frames.spawnEarly.snapshot.activeSpawnEntry?.hiddenCellCount !== 1
  ) {
    failures.push(`first spawn frame does not expose only the lower occupied row: ${JSON.stringify(frames.spawnEarly.snapshot)}`);
  }
  if (frames.spawnEarly.snapshot.ghostCells.length !== 4) {
    failures.push(`first spawn row does not expose the complete landing ghost: ${JSON.stringify(frames.spawnEarly.snapshot)}`);
  }
  if (
    frames.spawnMiddle.snapshot.activeSpawnEntry?.pending !== true
    || frames.spawnMiddle.snapshot.activeSpawnEntry?.visibleCellCount !== 4
    || frames.spawnMiddle.snapshot.activeSpawnEntry?.hiddenCellCount !== 0
    || !(frames.spawnMiddle.snapshot.presentation?.offsetY < -0.02)
  ) {
    failures.push(`second spawn row is not crossing the board mouth: ${JSON.stringify(frames.spawnMiddle.snapshot)}`);
  }
  if (
    frames.spawnComplete.snapshot.activeSpawnEntry?.pending !== false
    || Math.abs(frames.spawnComplete.snapshot.presentation?.offsetY ?? 1) >= 0.02
  ) {
    failures.push(`spatial spawn entry did not settle: ${JSON.stringify(frames.spawnComplete.snapshot)}`);
  }
  if (frames.iceActivationBloom.snapshot.mutationActivation?.item !== 'freeze') failures.push('Ice bloom frame is missing');
  if (frames.iceActivationFacet.snapshot.mutationActivation?.item !== 'freeze') failures.push('Ice facet frame is missing');
  if (frames.supergravityActivationPressure.snapshot.mutationActivation?.item !== 'collapse') failures.push('Supergravity pressure frame is missing');
  if (frames.supergravityActivationRelease.snapshot.mutationActivation?.item !== 'collapse') failures.push('Supergravity release frame is missing');
  for (const [name, frame] of Object.entries(frames)) {
    if (frame.canvasCountAfterDestroy !== 0) failures.push(`${name} leaked a canvas`);
    if (frame.pixelProbe.distinctBuckets < 3 || frame.pixelProbe.nonTransparentSamples === 0) {
      failures.push(`${name} frame is visually empty: ${JSON.stringify(frame.pixelProbe)}`);
    }
  }

  let reshapeSourceHits = '';
  try {
    reshapeSourceHits = execFileSync('git', ['grep', '-n', '-i', 'reshape', '--', 'src'], {
      cwd: root,
      encoding: 'utf8',
    }).trim();
  } catch (error) {
    if (error.status !== 1) throw error;
  }
  if (reshapeSourceHits) failures.push(`Reshape remains in production source:\n${reshapeSourceHits}`);

  const audit = {
    sourceSha,
    liveSeed,
    capturedAt: new Date().toISOString(),
    browser: await browser.version(),
    idle,
    activeStatus,
    activeState,
    ghostLatch,
    frames,
    reshapeSourceHits,
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
