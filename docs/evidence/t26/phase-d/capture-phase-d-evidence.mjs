import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'file:///C:/Users/Alex%20Chen/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';

const origin = process.argv[2] ?? 'http://127.0.0.1:4190';
const output = path.resolve('docs/evidence/t26/phase-d');
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const scenarios = JSON.parse(fs.readFileSync(path.join(output, 'mutation-scenarios.json'), 'utf8'));
fs.mkdirSync(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

await page.addInitScript(() => {
  if (typeof Crypto === 'undefined') return;
  const original = Crypto.prototype.getRandomValues;
  Crypto.prototype.getRandomValues = function deterministicQaSeed(array) {
    if (array instanceof Uint32Array && array.length === 1) {
      let seed = 1;
      try {
        seed = Number(globalThis.localStorage?.getItem('tetramorph:qa-seed') ?? 1) >>> 0;
      } catch {
        // about:blank has no local-storage origin; the first product navigation does.
      }
      array[0] = seed || 1;
      return array;
    }
    return original.call(this, array);
  };
});

const prepare = async ({ seed = 1, language = 'en', viewport = { width: 1440, height: 900 }, reducedMotion = 'off' } = {}) => {
  await page.setViewportSize(viewport);
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(({ seedValue, languageValue, motionValue }) => {
    localStorage.clear();
    localStorage.setItem('tetramorph:qa-seed', String(seedValue));
    localStorage.setItem('tetramorph:language:v1', languageValue);
    localStorage.setItem('tetramorph:reduced-motion:v1', motionValue);
    localStorage.setItem('tetramorph:mode-rule-intros:v1', JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']));
  }, { seedValue: seed, languageValue: language, motionValue: reducedMotion });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
};

const enterLiveMode = async (mode) => {
  await page.getByTestId(`enter-${mode}`).click();
  await page.getByTestId('game-screen').waitFor({ state: 'visible' });
  await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
  await page.evaluate(() => window.__TETRAMORPH_QA__?.setFrozen(true));
};

const qaState = () => page.evaluate(() => window.__TETRAMORPH_QA__?.getState());
const rendererSnapshot = () => page.evaluate(() => window.__TETRAMORPH_QA__?.getRendererSnapshot());
const qaActions = (actions) => page.evaluate((values) => {
  const qa = window.__TETRAMORPH_QA__;
  if (!qa) throw new Error('Missing DEV QA surface.');
  for (const action of values) qa.action(action);
}, actions);
const advanceTicks = (ticks) => page.evaluate((count) => {
  const qa = window.__TETRAMORPH_QA__;
  if (!qa) throw new Error('Missing DEV QA surface.');
  qa.advanceTicks(count);
}, ticks);
const advanceUntil = (condition, argument, maxTicks = 120) => page.evaluate(({ conditionValue, argumentValue, maxTicksValue }) => {
  const qa = window.__TETRAMORPH_QA__;
  if (!qa) throw new Error('Missing DEV QA surface.');
  for (let tick = 0; tick <= maxTicksValue; tick += 1) {
    const state = qa.getState();
    const matches = conditionValue === 'active'
      ? state.active !== null && state.status === 'playing'
      : conditionValue === 'last-item'
        ? state.mutationLastItem === argumentValue
        : conditionValue === 'lines'
          ? state.lines >= argumentValue
          : conditionValue === 'debris'
            ? state.survivalDebris.length > 0
            : false;
    if (matches) return { state, ticks: tick };
    qa.advanceTicks(1);
  }
  throw new Error(`Condition ${conditionValue}:${argumentValue ?? ''} did not resolve in ${maxTicksValue} ticks.`);
}, { conditionValue: condition, argumentValue: argument, maxTicksValue: maxTicks });

const playAndSpawn = async (actions) => {
  await qaActions(actions);
  return advanceUntil('active', null, 120);
};

const capture = async (name, delay = 100) => {
  await page.waitForTimeout(delay);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
};

const captureBoard = async (name) => {
  const result = await page.evaluate(() => window.__TETRAMORPH_QA__?.captureBoardPng());
  if (!result?.dataUrl) throw new Error(`Missing board capture for ${name}.`);
  const encoded = result.dataUrl.slice(result.dataUrl.indexOf(',') + 1);
  fs.writeFileSync(path.join(output, `${name}.png`), Buffer.from(encoded, 'base64'));
  return {
    frame: result.frame,
    resolution: result.resolution,
    outputPixels: result.outputPixels,
    pixelProbe: result.pixelProbe,
  };
};

const audit = async () => page.evaluate(() => {
  const textSelector = 'h1,h2,h3,p,strong,span,button,kbd,time,output,li,b,small,em,label';
  const visible = [...document.querySelectorAll(textSelector)].filter((element) => {
    if (element.closest('.sr-only,[aria-hidden="true"]')) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== 'hidden'
      && style.display !== 'none'
      && Number.parseFloat(style.opacity) > 0
      && rect.width > 0
      && rect.height > 0
      && rect.bottom > 0
      && rect.top < innerHeight
      && (element.textContent?.trim().length ?? 0) > 0;
  });
  const leaves = visible.filter((element) => !element.querySelector(textSelector));
  const clipped = visible.filter((element) => {
    const style = getComputedStyle(element);
    if (style.overflow === 'visible' && style.overflowX === 'visible' && style.overflowY === 'visible') return false;
    return element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
  }).map((element) => ({
    tag: element.tagName,
    className: String(element.className),
    text: element.textContent?.trim().slice(0, 100),
    client: [element.clientWidth, element.clientHeight],
    scroll: [element.scrollWidth, element.scrollHeight],
  }));

  const overlapRoot = document.querySelector('[data-testid="settings-sheet"], [role="dialog"], [data-testid="side-rail"], [data-testid="puzzle-library"]');
  const overlapLeaves = overlapRoot ? leaves.filter((element) => overlapRoot.contains(element)) : [];
  const overlaps = [];
  const textRect = (element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect();
  };
  for (let index = 0; index < overlapLeaves.length; index += 1) {
    const left = overlapLeaves[index];
    const leftRect = textRect(left);
    for (let nextIndex = index + 1; nextIndex < overlapLeaves.length; nextIndex += 1) {
      const right = overlapLeaves[nextIndex];
      if (left.contains(right) || right.contains(left)) continue;
      const rightRect = textRect(right);
      const width = Math.min(leftRect.right, rightRect.right) - Math.max(leftRect.left, rightRect.left);
      const height = Math.min(leftRect.bottom, rightRect.bottom) - Math.max(leftRect.top, rightRect.top);
      if (width > 2 && height > 2) overlaps.push([left.textContent?.trim(), right.textContent?.trim()]);
    }
  }

  const dataElements = [...document.querySelectorAll('kbd,time,output,[data-stat-role] strong,[data-record-field],.result-leaderboard li > b,.result-leaderboard__run strong,.run-result__metric strong,.entry-countdown__digit,.puzzle-gallery__best')]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    });
  const wrongDataFace = dataElements.filter((element) => !/Geist Mono/i.test(getComputedStyle(element).fontFamily))
    .map((element) => ({ text: element.textContent?.trim().slice(0, 100), font: getComputedStyle(element).fontFamily }));
  const englishUiLeaks = leaves.filter((element) => {
    if (!/[A-Za-z]{2,}/.test(element.textContent ?? '')) return false;
    if (element.closest('[data-testid="brand"],.brand,.mode-home-wordmark')) return false;
    if (dataElements.includes(element)) return false;
    return !/Space Grotesk/i.test(getComputedStyle(element).fontFamily);
  }).map((element) => ({ text: element.textContent?.trim().slice(0, 100), font: getComputedStyle(element).fontFamily }));
  const brandFaces = [...document.querySelectorAll('.brand strong,.brand h1,.mode-home-wordmark')]
    .filter((element) => element.getBoundingClientRect().width > 0)
    .map((element) => ({ text: element.textContent?.trim(), font: getComputedStyle(element).fontFamily, weight: getComputedStyle(element).fontWeight }));
  const legacyFaces = visible.filter((element) => /Barlow|Fira Code|IBM Plex Mono|JetBrains Mono|Caveat|Smiley Sans/i.test(getComputedStyle(element).fontFamily))
    .map((element) => ({ text: element.textContent?.trim().slice(0, 100), font: getComputedStyle(element).fontFamily }));
  const root = document.documentElement;
  const settings = document.querySelector('[data-testid="settings-sheet"]');
  const next = document.querySelector('[data-testid="next-slot"]');
  return {
    viewport: [innerWidth, innerHeight],
    document: [root.clientWidth, root.scrollWidth, root.clientHeight, root.scrollHeight],
    settings: settings ? [settings.clientWidth, settings.scrollWidth, settings.clientHeight, settings.scrollHeight] : null,
    clipped,
    overlaps,
    wrongDataFace,
    englishUiLeaks,
    brandFaces,
    legacyFaces,
    fonts: [...new Set(visible.map((element) => getComputedStyle(element).fontFamily))],
    fontFaces: [...document.fonts]
      .filter((face) => /Space Grotesk|Geist Mono|Noto Sans SC|Playwrite NZ Basic/i.test(face.family))
      .map((face) => ({ family: face.family, weight: face.weight, style: face.style, status: face.status })),
    canvasCount: document.querySelectorAll('canvas').length,
    domCellCount: document.querySelectorAll('[data-game-cell]').length,
    nextVisible: next ? Boolean(next.getBoundingClientRect().width && next.getBoundingClientRect().height) : null,
    nextLabel: next?.getAttribute('aria-label') ?? null,
  };
});

const states = {};
const saveState = async (name, { screenshot = true, delay = 100 } = {}) => {
  if (screenshot) await capture(name, delay);
  states[name] = await audit();
};

// Current-source Settings / typography / Pause regression batch for the active user report.
await prepare({ seed: 11, language: 'en' });
await enterLiveMode('marathon');
await page.getByTestId('open-settings').click();
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
await saveState('settings-en-settings');
await page.getByTestId('settings-tab-controls').click();
await saveState('settings-en-controls');
await page.getByTestId('settings-tab-rules').click();
await saveState('settings-en-rules');
const settingsPanels = await page.locator('[role="tabpanel"]:visible').count();
await page.setViewportSize({ width: 844, height: 390 });
await page.getByTestId('settings-tab-controls').click();
await saveState('settings-en-short-controls');
await page.setViewportSize({ width: 1440, height: 900 });
await page.keyboard.press('Escape');
await page.keyboard.press('KeyP');
await page.getByRole('dialog', { name: 'Paused' }).waitFor({ state: 'visible' });
const pauseEvidence = await page.evaluate(() => {
  const rect = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
  };
  const hit = (selector) => {
    const control = document.querySelector(selector);
    if (!control) return false;
    const box = control.getBoundingClientRect();
    const target = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return target === control || control.contains(target);
  };
  const overlap = (left, right) => left && right
    ? Math.min(left.right, right.right) - Math.max(left.left, right.left) > 1
      && Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 1
    : false;
  const sheet = rect('[data-testid="action-sheet-backdrop"] .action-sheet');
  const next = rect('[data-testid="next-slot"]');
  const renderer = window.__TETRAMORPH_QA__?.getRendererSnapshot();
  return {
    backHit: hit('[data-testid="exit-game"]'),
    settingsHit: hit('[data-testid="open-settings"]'),
    sheet,
    next,
    sheetOverlapsNext: overlap(sheet, next),
    previewLayerVisible: renderer?.previewLayerVisible ?? false,
    previewPiece: renderer?.previewPiece ?? null,
  };
});
await saveState('pause-en');
await page.getByTestId('open-settings').click();
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
const settingsOpenedFromPause = true;
await page.keyboard.press('Escape');
await page.keyboard.press('KeyP');
await page.getByRole('dialog', { name: 'Paused' }).waitFor({ state: 'visible' });
await page.getByTestId('exit-game').click();
await page.getByRole('dialog', { name: 'Leave this run?' }).waitFor({ state: 'visible' });
const backOpenedFromPause = true;
await saveState('leave-en');

// Classic uses the same public three-piece line-clear route as a Mutation fixture.
await prepare({ seed: scenarios.multiplier.seed, language: 'en' });
await enterLiveMode('marathon');
for (const actions of scenarios.multiplier.actions) {
  await qaActions(actions);
  if ((await qaState())?.active === null) await advanceUntil('active', null, 120).catch(() => null);
}
const classicResolved = await advanceUntil('lines', 1, 120);
const classicRenderer = await rendererSnapshot();
const classicStats = await page.getByTestId('stats').textContent();
await saveState('classic-clear');

// Survival proves the exact 48-tick lead, a visible arrow, and the following spawn.
await prepare({ seed: 0x51a1f00d, language: 'en' });
await enterLiveMode('race');
let survivalWarning = null;
for (let piece = 0; piece < 8; piece += 1) {
  const horizontal = piece % 3 === 0 ? ['left', 'left', 'left'] : piece % 3 === 1 ? ['right', 'right', 'right'] : [];
  await qaActions([...horizontal, 'hard-drop']);
  await advanceUntil('active', null, 120);
  const renderer = await rendererSnapshot();
  const state = await qaState();
  if (renderer.survivalDebrisWarningColumns.length > 0) {
    survivalWarning = { piece: piece + 1, renderer, state };
    break;
  }
}
if (!survivalWarning) throw new Error('Survival warning did not appear within eight locks.');
await saveState('survival-warning');
await qaActions(['hard-drop']);
const warningImmediatelyAfterLock = await qaState();
await advanceTicks(47);
const warningAt47 = { state: await qaState(), renderer: await rendererSnapshot() };
await advanceTicks(1);
const survivalSpawn = await advanceUntil('debris', null, 4);
const survivalSpawnRenderer = await rendererSnapshot();
await saveState('survival-rockfall');

// Every Mutation family is reached through its own deterministic public-command route.
const mutationEvidence = {};
for (const item of ['freeze', 'collapse', 'bomb', 'multiplier', 'reshape']) {
  const scenario = scenarios[item];
  await prepare({ seed: scenario.seed, language: 'en' });
  await enterLiveMode('sprint');

  await playAndSpawn(scenario.actions[0]);
  const previewState = await qaState();
  const previewRenderer = await rendererSnapshot();
  const previewLabel = await page.getByTestId('next-slot').getAttribute('aria-label');
  await saveState(`mutation-${item}-next`);

  await playAndSpawn(scenario.actions[1]);
  const carrierState = await qaState();
  await qaActions(scenario.actions[2].slice(0, -1));
  const positionedCarrierState = await qaState();
  await saveState(`mutation-${item}-carrier`);

  await qaActions(['hard-drop']);
  const activationResolved = await advanceUntil('last-item', item, 120);
  // Bomb deliberately stages warning -> pulse -> impact. Synchronize to the
  // renderer-owned impact phase rather than guessing from wall-clock time.
  if (item === 'bomb') {
    await page.waitForFunction(() => {
      const activation = window.__TETRAMORPH_QA__?.getRendererSnapshot().mutationActivation;
      return activation?.item === 'bomb'
        && activation.phases.some((phase) => phase.id === 'impact' && phase.active);
    }, undefined, { timeout: 2_000 });
  } else {
    await page.waitForTimeout(90);
  }
  const activationRenderer = await rendererSnapshot();
  const boardCapture = item === 'bomb' ? await captureBoard('mutation-bomb-impact-board') : null;
  const status = await page.locator('[data-testid="mutation-status"]').textContent().catch(() => null);
  await saveState(`mutation-${item}-effect`, { delay: item === 'bomb' ? 0 : 20 });

  mutationEvidence[item] = {
    seed: scenario.seed,
    pieces: scenario.pieces,
    preview: {
      body: previewRenderer.previewPiece,
      item: previewRenderer.previewMutationItem,
      label: previewLabel,
      pieceCount: previewState.pieceCount,
    },
    carrier: positionedCarrierState.mutationActiveCarrier,
    activation: {
      lastItem: activationResolved.state.mutationLastItem,
      freezeTicks: activationResolved.state.mutationFreezeTicks,
      collapseTicks: activationResolved.state.mutationCollapseTicks,
      multiplierTicks: activationResolved.state.mutationMultiplierTicks,
      score: activationResolved.state.score,
      rowsRemoved: scenario.activation.rowsRemoved,
      rendererItem: activationRenderer.mutationActivation?.item ?? null,
      rendererElapsedMs: activationRenderer.mutationActivation?.elapsedMs ?? null,
      rendererDurationMs: activationRenderer.mutationActivation?.durationMs ?? null,
      rendererPhases: activationRenderer.mutationActivation?.phases ?? [],
      queuedItems: activationRenderer.mutationActivationQueueItems,
      particles: activationRenderer.mutationActiveParticleCount,
      status,
      boardCapture,
    },
    activeCarrierAtSpawn: carrierState.mutationActiveCarrier,
  };
}

// Puzzle remains an authored curriculum: capture existing lesson/gate copy only.
await prepare({ seed: 1, language: 'en', reducedMotion: 'on' });
await page.getByTestId('enter-puzzle').click();
await page.getByTestId('puzzle-library').waitFor({ state: 'visible' });
const puzzleEvidence = {
  lesson: await page.getByTestId('puzzle-lesson').textContent(),
  technique: await page.getByTestId('puzzle-lesson').getAttribute('data-puzzle-technique'),
  mastery: await page.getByTestId('puzzle-mastery-requirement').textContent().catch(() => null),
  tabs: await page.getByRole('tab').allTextContents(),
};
await saveState('puzzle-campaign');

await page.goto(origin, { waitUntil: 'networkidle' });
const cleanup = await page.evaluate(() => ({
  canvasCount: document.querySelectorAll('canvas').length,
  domCellCount: document.querySelectorAll('[data-game-cell]').length,
  qaGlobals: ['__TETRAMORPH_QA__', '__TETRAMORPH_LAYOUT_QA__', 'render_game_to_text']
    .filter((key) => key in window),
}));

const result = {
  sourceSha,
  capturedAt: new Date().toISOString(),
  origin,
  browser: await browser.version(),
  settingsPanels,
  pauseEvidence,
  settingsOpenedFromPause,
  backOpenedFromPause,
  classic: {
    state: classicResolved.state,
    renderer: classicRenderer,
    stats: classicStats,
  },
  survival: {
    warning: survivalWarning,
    immediatelyAfterLock: warningImmediatelyAfterLock,
    at47: warningAt47,
    spawn: survivalSpawn,
    spawnRenderer: survivalSpawnRenderer,
  },
  mutation: mutationEvidence,
  puzzle: puzzleEvidence,
  cleanup,
  states,
  errors,
};
fs.writeFileSync(path.join(output, 'audit.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const failures = Object.entries(states).flatMap(([name, state]) => [
  ...state.clipped.map((item) => `${name}: clipped ${item.text}`),
  ...state.overlaps.map((item) => `${name}: overlapping ${item.join(' / ')}`),
  ...state.wrongDataFace.map((item) => `${name}: wrong data face ${item.text} (${item.font})`),
  ...state.englishUiLeaks.map((item) => `${name}: wrong English UI face ${item.text} (${item.font})`),
  ...state.legacyFaces.map((item) => `${name}: legacy font ${item.text} (${item.font})`),
  ...(state.document[1] > state.document[0] ? [`${name}: horizontal document overflow`] : []),
  ...(state.settings && state.settings[1] > state.settings[0] ? [`${name}: horizontal settings overflow`] : []),
  ...(name.startsWith('mutation-') && state.nextVisible !== true ? [`${name}: Next is not visible`] : []),
  ...(name.startsWith('mutation-') && state.canvasCount !== 1 ? [`${name}: expected one canvas`] : []),
  ...(state.domCellCount > 0 ? [`${name}: found DOM board cells`] : []),
]);
if (settingsPanels !== 1) failures.push(`Settings rendered ${settingsPanels} active panels instead of one.`);
if (!pauseEvidence.backHit || !pauseEvidence.settingsHit || pauseEvidence.sheetOverlapsNext || !pauseEvidence.previewLayerVisible || !pauseEvidence.previewPiece) {
  failures.push(`Pause interaction/Next geometry failed: ${JSON.stringify(pauseEvidence)}`);
}
if (!settingsOpenedFromPause || !backOpenedFromPause) failures.push('Pause did not open Settings and Back.');
if (classicResolved.state.lines < 1 || classicResolved.state.score <= 0 || !/Score|Lines|Fall speed/.test(classicStats ?? '')) {
  failures.push(`Classic score/fall-speed evidence failed: ${classicStats}`);
}
if (survivalWarning.state.survivalDebrisWarningTicks !== 48 || survivalWarning.renderer.survivalDebrisWarningColumns.length !== 1) {
  failures.push(`Survival warning start failed: ${JSON.stringify(survivalWarning)}`);
}
if (warningImmediatelyAfterLock.survivalDebrisWarningTicks !== 48 || warningImmediatelyAfterLock.survivalDebris.length !== 0) {
  failures.push('Immediate Survival lock consumed or spawned the warning too early.');
}
if (warningAt47.state.survivalDebrisWarningTicks !== 1 || warningAt47.state.survivalDebris.length !== 0) {
  failures.push(`Survival 47-tick hold failed: ${JSON.stringify(warningAt47.state)}`);
}
if (survivalSpawn.ticks > 1 || survivalSpawn.state.survivalDebris.length === 0 || survivalSpawnRenderer.survivalDebris.length === 0) {
  failures.push(`Survival spawn boundary failed: ${JSON.stringify(survivalSpawn)}`);
}
for (const [item, evidence] of Object.entries(mutationEvidence)) {
  if (evidence.preview.item !== item || evidence.carrier?.item !== item || evidence.activation.lastItem !== item || evidence.activation.rendererItem !== item) {
    failures.push(`${item}: incomplete Next/carrier/activation chain ${JSON.stringify(evidence)}`);
  }
  if (['freeze', 'collapse', 'multiplier'].includes(item) && !evidence.activation.status) {
    failures.push(`${item}: persistent state ledger is not visible.`);
  }
}
if (!puzzleEvidence.lesson || !puzzleEvidence.technique || puzzleEvidence.tabs.length < 3) {
  failures.push(`Puzzle curriculum evidence failed: ${JSON.stringify(puzzleEvidence)}`);
}
if (cleanup.canvasCount !== 0 || cleanup.domCellCount !== 0 || cleanup.qaGlobals.length > 0) {
  failures.push(`cleanup: ${JSON.stringify(cleanup)}`);
}
if (errors.length > 0) failures.push(...errors.map((error) => `console: ${error}`));

await browser.close();
if (failures.length > 0) throw new Error(failures.join('\n'));
