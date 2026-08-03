import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'file:///C:/Users/Alex%20Chen/.codex/skills/develop-web-game/node_modules/playwright/index.mjs';

const origin = process.argv[2] ?? 'http://127.0.0.1:4191';
const output = path.resolve('docs/evidence/t26/phase-e');
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
fs.mkdirSync(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

await page.addInitScript(() => {
  const activeTimeouts = new Set();
  const activeIntervals = new Set();
  const activeFrames = new Set();
  const activeListeners = new Set();
  const listenerIds = new WeakMap();
  let nextListenerId = 1;
  let audioCreated = 0;
  let audioClosed = 0;

  const listenerId = (listener) => {
    if ((typeof listener !== 'object' || listener === null) && typeof listener !== 'function') return 0;
    const known = listenerIds.get(listener);
    if (known) return known;
    const created = nextListenerId;
    nextListenerId += 1;
    listenerIds.set(listener, created);
    return created;
  };
  const captureFlag = (options) => typeof options === 'boolean' ? options : Boolean(options?.capture);
  const listenerKey = (target, type, listener, options) => {
    const targetName = target === window ? 'window' : target === document ? 'document' : null;
    if (!targetName) return null;
    return `${targetName}:${type}:${captureFlag(options) ? 1 : 0}:${listenerId(listener)}`;
  };

  const originalAdd = EventTarget.prototype.addEventListener;
  const originalRemove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function trackedAdd(type, listener, options) {
    const key = listenerKey(this, type, listener, options);
    if (key && !(typeof options === 'object' && options?.once)) activeListeners.add(key);
    return originalAdd.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function trackedRemove(type, listener, options) {
    const key = listenerKey(this, type, listener, options);
    if (key) activeListeners.delete(key);
    return originalRemove.call(this, type, listener, options);
  };

  const originalSetTimeout = window.setTimeout.bind(window);
  const originalClearTimeout = window.clearTimeout.bind(window);
  window.setTimeout = (callback, delay, ...args) => {
    let handle = 0;
    const wrapped = (...callbackArgs) => {
      activeTimeouts.delete(handle);
      if (typeof callback === 'function') callback(...callbackArgs);
    };
    handle = originalSetTimeout(wrapped, delay, ...args);
    activeTimeouts.add(handle);
    return handle;
  };
  window.clearTimeout = (handle) => {
    activeTimeouts.delete(handle);
    return originalClearTimeout(handle);
  };

  const originalSetInterval = window.setInterval.bind(window);
  const originalClearInterval = window.clearInterval.bind(window);
  window.setInterval = (callback, delay, ...args) => {
    const handle = originalSetInterval(callback, delay, ...args);
    activeIntervals.add(handle);
    return handle;
  };
  window.clearInterval = (handle) => {
    activeIntervals.delete(handle);
    return originalClearInterval(handle);
  };

  const originalRequestFrame = window.requestAnimationFrame.bind(window);
  const originalCancelFrame = window.cancelAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) => {
    let handle = 0;
    handle = originalRequestFrame((time) => {
      activeFrames.delete(handle);
      callback(time);
    });
    activeFrames.add(handle);
    return handle;
  };
  window.cancelAnimationFrame = (handle) => {
    activeFrames.delete(handle);
    return originalCancelFrame(handle);
  };

  const NativeAudioContext = window.AudioContext;
  if (typeof NativeAudioContext === 'function') {
    window.AudioContext = new Proxy(NativeAudioContext, {
      construct(target, args, newTarget) {
        const context = Reflect.construct(target, args, newTarget);
        audioCreated += 1;
        const originalClose = context.close.bind(context);
        let counted = false;
        context.close = async () => {
          if (!counted) {
            counted = true;
            audioClosed += 1;
          }
          return originalClose();
        };
        return context;
      },
    });
  }

  window.__TETRAMORPH_PHASE_E__ = {
    snapshot: () => ({
      activeTimeouts: activeTimeouts.size,
      activeIntervals: activeIntervals.size,
      activeFrames: activeFrames.size,
      activeWindowDocumentListeners: activeListeners.size,
      audioCreated,
      audioClosed,
      canvasCount: document.querySelectorAll('canvas').length,
      domCellCount: document.querySelectorAll('[data-game-cell]').length,
      qaBridge: '__TETRAMORPH_QA__' in window,
    }),
  };
});

const snapshot = () => page.evaluate(() => window.__TETRAMORPH_PHASE_E__.snapshot());
const screenshot = (name) => page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });

try {
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('tetramorph:language:v1', 'en');
    localStorage.setItem('tetramorph:reduced-motion:v1', 'on');
    localStorage.setItem('tetramorph:mode-rule-intros:v1', JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const baseline = await snapshot();

  await page.getByTestId('enter-marathon').click();
  await page.getByTestId('game-screen').waitFor({ state: 'visible' });
  await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
  await page.waitForTimeout(250);
  const beforeRestart = await snapshot();

  await page.keyboard.press('KeyR');
  await page.getByRole('dialog', { name: 'Restart?' }).waitFor({ state: 'visible' });
  const restartNextVisible = await page.getByTestId('next-slot').isVisible();
  await screenshot('restart-next-visible');
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
  await page.waitForTimeout(250);
  const afterRestart = await snapshot();

  await page.keyboard.press('KeyP');
  await page.getByRole('dialog', { name: 'Paused' }).waitFor({ state: 'visible' });
  const pauseNextVisible = await page.getByTestId('next-slot').isVisible();
  await screenshot('pause-next-visible');
  await page.getByTestId('exit-game').click();
  await page.getByRole('dialog', { name: 'Leave this run?' }).waitFor({ state: 'visible' });
  await page.getByTestId('action-sheet-backdrop').getByRole('button', { name: 'Back to home', exact: true }).click();
  await page.getByTestId('enter-marathon').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
  const afterReturn = await snapshot();
  await screenshot('home-after-runtime-release');

  const audit = {
    sourceSha,
    capturedAt: new Date().toISOString(),
    origin,
    browser: await browser.version(),
    baseline,
    beforeRestart,
    afterRestart,
    afterReturn,
    restartNextVisible,
    pauseNextVisible,
    errors,
  };
  fs.writeFileSync(path.join(output, 'lifecycle-audit.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8');

  const failures = [];
  if (beforeRestart.canvasCount !== 1 || afterRestart.canvasCount !== 1) failures.push('Expected exactly one gameplay canvas before and after restart.');
  if (beforeRestart.domCellCount !== 0 || afterRestart.domCellCount !== 0) failures.push('Found a DOM board cell grid.');
  if (!beforeRestart.qaBridge || !afterRestart.qaBridge) failures.push('Runtime QA bridge was missing during the session.');
  if (!restartNextVisible || !pauseNextVisible) failures.push('Next was hidden by Restart or Pause.');
  if (afterRestart.activeWindowDocumentListeners !== beforeRestart.activeWindowDocumentListeners) failures.push('Restart changed the active window/document listener count.');
  if (afterRestart.audioCreated !== beforeRestart.audioCreated || afterRestart.audioClosed !== beforeRestart.audioClosed) failures.push('Restart created or closed an extra AudioContext.');
  if (afterReturn.canvasCount !== 0 || afterReturn.domCellCount !== 0 || afterReturn.qaBridge) failures.push('Runtime DOM or QA state survived return to Home.');
  if (afterReturn.activeWindowDocumentListeners !== baseline.activeWindowDocumentListeners) failures.push('Window/document listeners did not return to the Home baseline.');
  if (afterReturn.activeTimeouts !== baseline.activeTimeouts || afterReturn.activeIntervals !== baseline.activeIntervals || afterReturn.activeFrames !== baseline.activeFrames) failures.push('Timer/interval/RAF counts did not return to the Home baseline.');
  if (afterReturn.audioCreated < 1 || afterReturn.audioClosed !== afterReturn.audioCreated) failures.push('Owned AudioContext was not closed on runtime release.');
  if (errors.length > 0) failures.push(...errors.map((error) => `console: ${error}`));
  if (failures.length > 0) throw new Error(failures.join('\n'));
} finally {
  await browser.close();
}
