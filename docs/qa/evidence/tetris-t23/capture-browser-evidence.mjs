import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'file:///C:/Users/Alex%20Chen/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';

const origin = process.argv[2] ?? 'http://127.0.0.1:4178';
const output = path.resolve('docs/qa/evidence/tetris-t23/browser');
const fixedSeed = 0x7115;
fs.mkdirSync(output, { recursive: true });

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const autoplayerScript = String.raw`
(() => {
  const shapes = {
    I: [
      [[0,1],[1,1],[2,1],[3,1]], [[2,0],[2,1],[2,2],[2,3]],
      [[0,2],[1,2],[2,2],[3,2]], [[1,0],[1,1],[1,2],[1,3]],
    ],
    O: Array.from({ length: 4 }, () => [[0,0],[1,0],[0,1],[1,1]]),
    T: [
      [[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]],
      [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]],
    ],
    S: [
      [[1,0],[2,0],[0,1],[1,1]], [[1,0],[1,1],[2,1],[2,2]],
      [[1,1],[2,1],[0,2],[1,2]], [[0,0],[0,1],[1,1],[1,2]],
    ],
    Z: [
      [[0,0],[1,0],[1,1],[2,1]], [[2,0],[1,1],[2,1],[1,2]],
      [[0,1],[1,1],[1,2],[2,2]], [[1,0],[0,1],[1,1],[0,2]],
    ],
    J: [
      [[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]],
      [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]],
    ],
    L: [
      [[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]],
      [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]],
    ],
  };

  const cloneBoard = (board) => board.map((row) => [...row]);
  const canPlace = (board, cells, x, y) => cells.every(([dx, dy]) => {
    const px = x + dx;
    const py = y + dy;
    return px >= 0 && px < board[0].length && py >= 0 && py < board.length && board[py][px] === null;
  });
  const evaluateBoard = (board, completedLines) => {
    const width = board[0].length;
    const height = board.length;
    const heights = [];
    let holes = 0;
    for (let x = 0; x < width; x += 1) {
      let top = height;
      for (let y = 0; y < height; y += 1) {
        if (board[y][x] !== null) { top = y; break; }
      }
      heights.push(height - top);
      for (let y = top; y < height; y += 1) if (board[y][x] === null) holes += 1;
    }
    const aggregate = heights.reduce((sum, value) => sum + value, 0);
    const maximum = Math.max(...heights);
    const bumpiness = heights.slice(1).reduce((sum, value, index) => sum + Math.abs(value - heights[index]), 0);
    const wells = heights.reduce((sum, value, index) => {
      const left = index === 0 ? height : heights[index - 1];
      const right = index === width - 1 ? height : heights[index + 1];
      return sum + Math.max(0, Math.min(left, right) - value);
    }, 0);
    const danger = Math.max(0, maximum - 16);
    return aggregate * 0.55 + holes * 8 + bumpiness * 0.42 + wells * 0.12
      + maximum * 0.9 + danger * danger * 6 - completedLines * 12;
  };
  const candidateFor = (state, rotation, x) => {
    const board = cloneBoard(state.board);
    const cells = shapes[state.active.type][rotation];
    let y = state.active.y;
    if (!canPlace(board, cells, x, y)) return null;
    while (canPlace(board, cells, x, y + 1)) y += 1;
    for (const [dx, dy] of cells) board[y + dy][x + dx] = state.active.type;
    // Match Core row removal: permanent Survival bedrock is full but never clearable.
    const kept = board.filter((row) => !row.every((cell) => cell !== null && cell !== 'B'));
    const cleared = board.length - kept.length;
    while (kept.length < board.length) kept.unshift(Array(board[0].length).fill(null));
    return { rotation, x, y, score: evaluateBoard(kept, cleared), cleared };
  };

  window.__T23_AUTOPLAY_STEP__ = (hardDrop = true) => {
    const qa = window.__SIGNAL_FOUNDRY_QA__;
    let state = qa.getState();
    if (state.status !== 'playing') return { stopped: state.status };
    for (let tick = 0; tick < 20 && state.active === null; tick += 1) {
      qa.advanceTicks(1);
      state = qa.getState();
    }
    if (!state.active) return { stopped: state.status, phase: state.phase };

    const options = [];
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const cells = shapes[state.active.type][rotation];
      const minX = Math.min(...cells.map(([x]) => x));
      const maxX = Math.max(...cells.map(([x]) => x));
      for (let x = -minX; x < state.board[0].length - maxX; x += 1) {
        const option = candidateFor(state, rotation, x);
        if (option) options.push(option);
      }
    }
    options.sort((left, right) => left.score - right.score
      || right.cleared - left.cleared || left.x - right.x || left.rotation - right.rotation);
    const best = options[0];
    if (!best) return { stopped: 'no-placement' };

    for (let rotation = 0; rotation < best.rotation; rotation += 1) qa.action('rotate-cw');
    state = qa.getState();
    const direction = best.x < state.active.x ? 'left' : 'right';
    for (let step = 0; step < Math.abs(best.x - state.active.x); step += 1) qa.action(direction);
    if (!hardDrop) {
      state = qa.getState();
      return {
        status: state.status,
        phase: state.phase,
        pieceCount: state.pieceCount,
        positioned: true,
      };
    }
    qa.action('hard-drop');

    state = qa.getState();
    for (let tick = 0; tick < 20 && state.active === null && state.status === 'playing'; tick += 1) {
      qa.advanceTicks(1);
      state = qa.getState();
    }
    return {
      status: state.status,
      phase: state.phase,
      pieceCount: state.pieceCount,
      lines: state.lines,
      lastItem: state.mutationLastItem,
    };
  };
})();`;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await context.addInitScript((seed) => {
  Object.defineProperty(globalThis.crypto, 'getRandomValues', {
    configurable: true,
    value: (values) => {
      for (let index = 0; index < values.length; index += 1) values[index] = seed;
      return values;
    },
  });
}, fixedSeed);
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

const artifacts = [];
const screenshot = async (name, options = {}) => {
  const file = path.join(output, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true, ...options });
  artifacts.push({ file: path.relative(process.cwd(), file).replaceAll('\\', '/'), sha256: sha256(file) });
};
const runtimeSnapshot = async () => page.evaluate(() => {
  const qa = window.__SIGNAL_FOUNDRY_QA__;
  if (!qa) return null;
  const state = qa.getState();
  const renderer = qa.getRendererSnapshot();
  const root = document.documentElement;
  return {
    mode: state.mode,
    status: state.status,
    phase: state.phase,
    seed: state.seed,
    pieceCount: state.pieceCount,
    lines: state.lines,
    survivalRiseCount: state.survivalRiseCount,
    survivalBedrockRows: state.survivalBedrockRows,
    mutationLastItem: state.mutationLastItem,
    mutationLastItemTicks: state.mutationLastItemTicks,
    mutationFreezeTicks: state.mutationFreezeTicks,
    mutationCollapseTicks: state.mutationCollapseTicks,
    mutationMultiplierTicks: state.mutationMultiplierTicks,
    mutationMultiplierFactor: state.mutationMultiplierFactor,
    mutationActiveCarrier: state.mutationActiveCarrier,
    renderer: {
      previewPiece: renderer.previewPiece,
      previewPieces: renderer.previewPieces,
      previewMutationItem: renderer.previewMutationItem,
      previewLayerVisible: renderer.previewLayerVisible,
      mutationActivation: renderer.mutationActivation,
      mutationActivationQueueItems: renderer.mutationActivationQueueItems,
      mutationFilters: renderer.mutationFilters,
    },
    canvasCount: document.querySelectorAll('canvas').length,
    domCellCount: document.querySelectorAll('.board-cell, [data-board-cell]').length,
    overflow: {
      horizontal: root.scrollWidth > root.clientWidth,
      vertical: root.scrollHeight > root.clientHeight,
    },
  };
});
const waitForPlaying = async () => {
  await page.waitForFunction(() => {
    const state = JSON.parse(window.render_game_to_text?.() ?? '{}');
    return state.screen === 'game' && state.status === 'playing' && state.countdown === null;
  }, null, { timeout: 12_000 });
};
const exitToHome = async () => {
  await page.getByTestId('exit-game').click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('.primary-action').click();
  await page.getByTestId('mode-home').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !window.__SIGNAL_FOUNDRY_QA__ && document.querySelectorAll('canvas').length === 0);
};

await page.goto(origin, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.setItem('tetramorph:language:v1', 'zh-CN');
  localStorage.setItem('tetris:mode-rule-intros:v1', JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']));
});
await page.reload({ waitUntil: 'networkidle' });

const homeModeLabels = await page.locator('.mode-gate__body strong').allTextContents();
if (JSON.stringify(homeModeLabels) !== JSON.stringify(['Classic', 'Survival', 'Mutation', 'Puzzle'])) {
  throw new Error(`Home mode labels are not fixed English labels: ${JSON.stringify(homeModeLabels)}`);
}
if (await page.locator('.language-control').count()) throw new Error('Home still contains a language selector.');
await screenshot('01-home-desktop');

await page.setViewportSize({ width: 390, height: 844 });
const portraitOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
if (portraitOverflow) throw new Error('Home has horizontal overflow at 390x844.');
await screenshot('02-home-portrait');
await page.setViewportSize({ width: 1440, height: 900 });

await page.getByTestId('enter-race').click();
await waitForPlaying();
await page.evaluate(() => window.__SIGNAL_FOUNDRY_QA__.setFrozen(true));
await page.evaluate(autoplayerScript);
let survival = await runtimeSnapshot();
if (survival.canvasCount !== 1 || survival.domCellCount !== 0) throw new Error(`Invalid renderer topology: ${JSON.stringify(survival)}`);

await page.getByTestId('open-settings').click();
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
if (await page.locator('.settings-console .language-control').count() !== 1) throw new Error('Settings needs exactly one language selector.');
await page.getByTestId('language-en').click();
if (await page.locator('html').getAttribute('lang') !== 'en') throw new Error('Settings language switch did not select English.');
await screenshot('03-settings-language');
await page.getByTestId('language-zh').click();
await page.keyboard.press('Escape');
await page.getByTestId('settings-sheet').waitFor({ state: 'hidden' });

await page.keyboard.press('KeyP');
await page.getByRole('dialog').waitFor({ state: 'visible' });
const paused = await runtimeSnapshot();
if (!paused.renderer.previewLayerVisible || !paused.renderer.previewPiece) throw new Error('Pause dialog hid canonical Next.');
await screenshot('04-survival-pause-next');
await page.keyboard.press('Enter');
await page.getByRole('dialog').waitFor({ state: 'hidden' });

await page.keyboard.press('KeyR');
await page.getByRole('dialog').waitFor({ state: 'visible' });
const restartDialog = await runtimeSnapshot();
if (!restartDialog.renderer.previewLayerVisible || !restartDialog.renderer.previewPiece) throw new Error('Restart dialog hid canonical Next.');
await screenshot('05-survival-restart-next');
await page.keyboard.press('Escape');
await page.getByRole('dialog').waitFor({ state: 'hidden' });

await page.evaluate(() => {
  const qa = window.__SIGNAL_FOUNDRY_QA__;
  let guard = 0;
  let positionedPieceCount = -1;
  while (qa.getState().survivalRiseCount < 3 && qa.getState().status === 'playing' && guard < 5000) {
    const state = qa.getState();
    if (state.active && state.pieceCount !== positionedPieceCount) {
      window.__T23_AUTOPLAY_STEP__(false);
      positionedPieceCount = state.pieceCount;
    }
    qa.advanceTicks(1);
    guard += 1;
  }
});
survival = await runtimeSnapshot();
if (survival.status !== 'playing' || survival.survivalRiseCount !== 3) {
  throw new Error(`Could not reach the live Aftershock preview safely: ${JSON.stringify(survival)}`);
}
const aftershockLabel = await page.locator('[data-stat-role="survival-bedrock"] span').textContent();
if (!aftershockLabel?.includes('余震')) throw new Error(`Expected the Aftershock HUD label, got ${aftershockLabel}`);
await screenshot('06-survival-aftershock');
const aftershockWarning = survival;
await page.evaluate(() => {
  const qa = window.__SIGNAL_FOUNDRY_QA__;
  let guard = 0;
  let positionedPieceCount = qa.getState().pieceCount;
  while (qa.getState().survivalRiseCount < 4 && qa.getState().status === 'playing' && guard < 5000) {
    const state = qa.getState();
    if (state.active && state.pieceCount !== positionedPieceCount) {
      window.__T23_AUTOPLAY_STEP__(false);
      positionedPieceCount = state.pieceCount;
    }
    qa.advanceTicks(1);
    guard += 1;
  }
});
const aftershockResolved = await runtimeSnapshot();
if (aftershockResolved.status !== 'playing'
    || aftershockResolved.survivalRiseCount !== 4
    || aftershockResolved.survivalBedrockRows !== aftershockWarning.survivalBedrockRows + 2) {
  throw new Error(`Fourth pressure rise did not add exactly two rows: ${JSON.stringify({ aftershockWarning, aftershockResolved })}`);
}
await screenshot('06b-survival-aftershock-resolved');
survival = aftershockResolved;
await exitToHome();

await page.getByTestId('enter-sprint').click();
await waitForPlaying();
await page.evaluate(() => {
  window.__SIGNAL_FOUNDRY_QA__.setFrozen(true);
});

const mutationCaptures = {
  reshapePreview: null,
  reshapeNext: null,
  supergravity: null,
  multiplier: null,
};
for (let step = 1; step <= 240; step += 1) {
  let snapshot = await runtimeSnapshot();
  if (!mutationCaptures.reshapePreview && snapshot.renderer.previewMutationItem === 'reshape') {
    await screenshot('07-mutation-reshape-preview');
    mutationCaptures.reshapePreview = { step, snapshot };
  }

  const result = await page.evaluate(() => window.__T23_AUTOPLAY_STEP__());
  if (result.stopped) throw new Error(`Mutation autoplayer stopped at ${step}: ${JSON.stringify(result)}`);
  snapshot = await runtimeSnapshot();

  if (!mutationCaptures.reshapeNext
      && snapshot.mutationLastItem === 'reshape'
      && snapshot.mutationLastItemTicks > 0
      && snapshot.renderer.previewPiece === 'I') {
    await screenshot('08-mutation-reshape-next-i');
    mutationCaptures.reshapeNext = { step, snapshot };
  }
  if (!mutationCaptures.supergravity && snapshot.mutationCollapseTicks > 0) {
    await page.waitForFunction(() => {
      const renderer = window.__SIGNAL_FOUNDRY_QA__.getRendererSnapshot();
      return renderer.mutationActivation === null && renderer.mutationActivationQueueItems.length === 0;
    }, null, { timeout: 5_000 });
    snapshot = await runtimeSnapshot();
    if (snapshot.mutationCollapseTicks <= 0 || snapshot.renderer.mutationActivation !== null) {
      throw new Error(`Supergravity field was not captured in its persistent state: ${JSON.stringify(snapshot)}`);
    }
    await screenshot('09-mutation-supergravity-field');
    mutationCaptures.supergravity = { step, snapshot };
  }
  if (!mutationCaptures.multiplier && snapshot.mutationMultiplierTicks > 0) {
    await page.waitForFunction(() => {
      const renderer = window.__SIGNAL_FOUNDRY_QA__.getRendererSnapshot();
      return renderer.mutationActivation === null && renderer.mutationActivationQueueItems.length === 0;
    }, null, { timeout: 5_000 });
    snapshot = await runtimeSnapshot();
    if (snapshot.mutationMultiplierTicks <= 0 || snapshot.renderer.mutationActivation !== null) {
      throw new Error(`Multiplier field was not captured in its persistent state: ${JSON.stringify(snapshot)}`);
    }
    await screenshot('10-mutation-multiplier-field');
    mutationCaptures.multiplier = { step, snapshot };
  }
  if (Object.values(mutationCaptures).every(Boolean)) break;
}

if (Object.values(mutationCaptures).some((value) => !value)) {
  throw new Error(`Missing Mutation evidence: ${JSON.stringify(Object.fromEntries(Object.entries(mutationCaptures).map(([key, value]) => [key, Boolean(value)])))}`);
}
const finalMutation = await runtimeSnapshot();
if (finalMutation.canvasCount !== 1 || finalMutation.domCellCount !== 0) throw new Error('Mutation renderer topology changed.');

await exitToHome();
const cleanup = await page.evaluate(() => ({
  canvasCount: document.querySelectorAll('canvas').length,
  qaSurface: Boolean(window.__SIGNAL_FOUNDRY_QA__),
}));
if (cleanup.canvasCount !== 0 || cleanup.qaSurface) throw new Error(`Runtime cleanup failed: ${JSON.stringify(cleanup)}`);

const evidence = {
  taskId: 'T23',
  sourceSha: process.env.T23_SOURCE_SHA ?? null,
  capturedAt: new Date().toISOString(),
  origin,
  fixedSeed,
  homeModeLabels,
  portraitOverflow,
  paused,
  restartDialog,
  survival,
  aftershockWarning,
  aftershockResolved,
  aftershockLabel,
  mutationCaptures,
  finalMutation,
  cleanup,
  consoleErrors,
  artifacts,
};
fs.writeFileSync(path.join(output, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
await browser.close();

if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);
console.log(JSON.stringify({
  sourceSha: evidence.sourceSha,
  artifacts: artifacts.length,
  aftershock: {
    warningRise: aftershockWarning.survivalRiseCount,
    warningRows: aftershockWarning.survivalBedrockRows,
    resolvedRise: aftershockResolved.survivalRiseCount,
    resolvedRows: aftershockResolved.survivalBedrockRows,
  },
  mutation: Object.fromEntries(Object.entries(mutationCaptures).map(([key, value]) => [key, value.step])),
  cleanup,
  consoleErrors: consoleErrors.length,
}, null, 2));
