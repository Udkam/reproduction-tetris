import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const origin = process.argv[2] ?? 'http://127.0.0.1:5190';
const output = path.resolve('docs/evidence/t33');
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const scenario = {
  seed: 98,
  actions: [
    ['left', 'left', 'left', 'hard-drop'],
    ['left', 'left', 'left', 'right', 'right', 'right', 'hard-drop'],
    ['left', 'left', 'left', 'right', 'right', 'right', 'right', 'right', 'right', 'hard-drop'],
  ],
};
fs.mkdirSync(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const errors = [];
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
await page.evaluate((seed) => {
  localStorage.clear();
  localStorage.setItem('tetramorph:qa-seed', String(seed));
  localStorage.setItem('tetramorph:language:v1', 'en');
  localStorage.setItem('tetramorph:reduced-motion:v1', 'off');
  localStorage.setItem('tetramorph:mode-rule-intros:v1', JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']));
}, scenario.seed);
await page.reload({ waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.getByTestId('enter-sprint').click();
await page.getByTestId('game-screen').waitFor({ state: 'visible' });
await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
await page.evaluate(() => window.__TETRAMORPH_QA__?.setFrozen(true));

const applyActions = (actions) => page.evaluate((values) => {
  const qa = window.__TETRAMORPH_QA__;
  if (!qa) throw new Error('Missing DEV QA surface.');
  for (const action of values) qa.action(action);
}, actions);
const advanceToActive = () => page.evaluate(() => {
  const qa = window.__TETRAMORPH_QA__;
  if (!qa) throw new Error('Missing DEV QA surface.');
  for (let tick = 0; tick <= 120; tick += 1) {
    const state = qa.getState();
    if (state.active !== null && state.status === 'playing') return;
    qa.advanceTicks(1);
  }
  throw new Error('The next active piece did not spawn.');
});

for (const actions of scenario.actions) {
  await applyActions(actions);
  await advanceToActive();
}
await page.waitForTimeout(250);

const audit = await page.evaluate(() => {
  const state = window.__TETRAMORPH_QA__?.getState();
  return {
    remaining: state?.mutationCollapsePiecesRemaining ?? null,
    landingLatched: state?.mutationCollapseLandingLatched ?? null,
    status: document.querySelector('[data-testid="mutation-status"]')?.textContent?.trim() ?? '',
    canvasCount: document.querySelectorAll('canvas').length,
  };
});
await page.screenshot({ path: path.join(output, 'supergravity-five-pieces-en.png'), fullPage: true });

const failures = [];
if (audit.remaining !== 4) failures.push(`expected four future slots after first claim: ${audit.remaining}`);
if (audit.landingLatched !== true) failures.push('first covered piece was not latched');
if (!/Supergravity.*5 pieces left/i.test(audit.status)) failures.push(`status mismatch: ${audit.status}`);
if (audit.canvasCount !== 1) failures.push(`canvas count mismatch: ${audit.canvasCount}`);
failures.push(...errors.map((error) => `browser error: ${error}`));

fs.writeFileSync(path.join(output, 'supergravity-five-pieces-audit.json'), `${JSON.stringify({
  sourceSha,
  capturedAt: new Date().toISOString(),
  browser: await browser.version(),
  audit,
  failures,
}, null, 2)}\n`, 'utf8');
await browser.close();
if (failures.length) throw new Error(failures.join('\n'));
