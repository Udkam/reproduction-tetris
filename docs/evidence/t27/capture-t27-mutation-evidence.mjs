import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const origin = process.argv[2] ?? 'http://127.0.0.1:5190';
const output = path.resolve('docs/evidence/t27');
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const scenarios = JSON.parse(fs.readFileSync(
  path.resolve('docs/evidence/t26/phase-d/mutation-scenarios.json'),
  'utf8',
));
const scenario = scenarios.freeze;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

await page.addInitScript(() => {
  const original = Crypto.prototype.getRandomValues;
  Crypto.prototype.getRandomValues = function deterministicQaSeed(array) {
    if (array instanceof Uint32Array && array.length === 1) {
      array[0] = Number(globalThis.localStorage?.getItem('tetramorph:qa-seed') ?? 49) >>> 0;
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

const capture = async (name) => {
  await page.waitForTimeout(120);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
};

const rect = (selector) => page.locator(selector).evaluate((element) => {
  const box = element.getBoundingClientRect();
  return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, width: box.width, height: box.height };
});

const home = await page.evaluate(() => {
  const sample = document.querySelector('[data-testid="enter-marathon"] strong');
  const style = sample ? getComputedStyle(sample) : null;
  return {
    taglineCount: document.querySelectorAll('.mode-home-tagline').length,
    taglineTextPresent: document.body.textContent?.includes('Transform the way blocks fall.') ?? false,
    fontFamily: style?.fontFamily ?? null,
    fontSize: style?.fontSize ?? null,
  };
});
await capture('home-en');

await page.getByTestId('enter-sprint').click();
await page.getByTestId('game-screen').waitFor({ state: 'visible' });
await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
await page.evaluate(() => window.__TETRAMORPH_QA__?.setFrozen(true));

const idle = await page.evaluate(() => {
  const status = document.querySelector('[data-testid="mutation-status"]');
  const stats = document.querySelector('.run-stats');
  const idleMarker = document.querySelector('[data-testid="mutation-status-idle"]');
  const statusStyle = status ? getComputedStyle(status) : null;
  const statsStyle = stats ? getComputedStyle(stats) : null;
  return {
    text: idleMarker?.textContent ?? null,
    statusBackground: statusStyle?.backgroundColor ?? null,
    statusBackgroundImage: statusStyle?.backgroundImage ?? null,
    statsBackground: statsStyle?.backgroundColor ?? null,
    statsBackgroundImage: statsStyle?.backgroundImage ?? null,
    statusBorder: statusStyle?.borderColor ?? null,
    statsBorder: statsStyle?.borderColor ?? null,
  };
});
const statusRect = await rect('[data-testid="mutation-status"]');
const statsRect = await rect('.run-stats');
await capture('mutation-idle-en');
await page.keyboard.press('KeyS');
await page.getByTestId('settings-sheet').waitFor({ state: 'visible' });
await page.getByTestId('settings-tab-controls').click();
await page.waitForTimeout(180);
const settings = await page.evaluate(() => {
  const sheet = document.querySelector('[data-testid="settings-sheet"]');
  const sample = sheet?.querySelector('[data-testid="keyboard-gameplay"] > span:not(.settings-console__key-group-label)');
  const style = sample ? getComputedStyle(sample) : null;
  return {
    client: sheet ? [sheet.clientWidth, sheet.clientHeight] : null,
    scroll: sheet ? [sheet.scrollWidth, sheet.scrollHeight] : null,
    fontFamily: style?.fontFamily ?? null,
    fontSize: style?.fontSize ?? null,
  };
});
await capture('settings-en');
await page.keyboard.press('Escape');

const qaActions = (actions) => page.evaluate((values) => {
  const qa = window.__TETRAMORPH_QA__;
  if (!qa) throw new Error('Missing DEV QA surface.');
  for (const action of values) qa.action(action);
}, actions);
const advanceToActive = () => page.evaluate(() => {
  const qa = window.__TETRAMORPH_QA__;
  if (!qa) throw new Error('Missing DEV QA surface.');
  for (let tick = 0; tick <= 120; tick += 1) {
    const state = qa.getState();
    if (state.active !== null && state.status === 'playing') return state;
    qa.advanceTicks(1);
  }
  throw new Error('The next active piece did not spawn.');
});

await qaActions(scenario.actions[0]);
await advanceToActive();
const preview = await page.evaluate(() => window.__TETRAMORPH_QA__?.getRendererSnapshot());
await capture('mutation-freeze-next-en');
await qaActions(scenario.actions[1]);
await advanceToActive();
await qaActions(scenario.actions[2].slice(0, -1));
const carrier = await page.evaluate(() => ({
  state: window.__TETRAMORPH_QA__?.getState().mutationActiveCarrier ?? null,
  renderer: window.__TETRAMORPH_QA__?.getRendererSnapshot() ?? null,
}));
await capture('mutation-freeze-carrier-en');

await page.evaluate((seed) => {
  localStorage.setItem('tetramorph:qa-seed', String(seed));
}, scenarios.multiplier.seed);
await page.reload({ waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.getByTestId('enter-sprint').click();
await page.getByTestId('game-screen').waitFor({ state: 'visible' });
await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
await page.evaluate(() => window.__TETRAMORPH_QA__?.setFrozen(true));
await qaActions(scenarios.multiplier.actions[0]);
await advanceToActive();
await qaActions(scenarios.multiplier.actions[1]);
await advanceToActive();
await qaActions(scenarios.multiplier.actions[2]);
await advanceToActive();
await page.waitForTimeout(1_100);
const multiplier = await page.evaluate(() => ({
  state: {
    ticks: window.__TETRAMORPH_QA__?.getState().mutationMultiplierTicks ?? 0,
    factor: window.__TETRAMORPH_QA__?.getState().mutationMultiplierFactor ?? 1,
  },
  status: document.querySelector('[data-testid="mutation-status"]')?.textContent?.trim() ?? '',
  renderer: window.__TETRAMORPH_QA__?.getRendererSnapshot() ?? null,
}));
await capture('mutation-multiplier-active-en');

await page.evaluate((seed) => {
  localStorage.setItem('tetramorph:qa-seed', String(seed));
}, scenarios.collapse.seed);
await page.reload({ waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.getByTestId('enter-sprint').click();
await page.getByTestId('game-screen').waitFor({ state: 'visible' });
await page.getByTestId('entry-countdown').waitFor({ state: 'detached', timeout: 12_000 });
await page.evaluate(() => window.__TETRAMORPH_QA__?.setFrozen(true));
await qaActions(scenarios.collapse.actions[0]);
await advanceToActive();
await qaActions(scenarios.collapse.actions[1]);
await advanceToActive();
await qaActions(scenarios.collapse.actions[2]);
await advanceToActive();
await page.waitForTimeout(700);
const supergravity = await page.evaluate(() => ({
  ticks: window.__TETRAMORPH_QA__?.getState().mutationCollapseTicks ?? 0,
  status: document.querySelector('[data-testid="mutation-status"]')?.textContent?.trim() ?? '',
  renderer: window.__TETRAMORPH_QA__?.getRendererSnapshot() ?? null,
}));
await capture('mutation-supergravity-active-en');

const audit = {
  sourceSha,
  capturedAt: new Date().toISOString(),
  browser: await browser.version(),
  canvasCount: await page.locator('canvas').count(),
  home,
  idle,
  settings,
  placement: { statusRect, statsRect },
  preview: { piece: preview?.previewPiece ?? null, item: preview?.previewMutationItem ?? null },
  carrier,
  multiplier,
  supergravity,
  errors,
};
fs.writeFileSync(path.join(output, 'mutation-audit.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
await browser.close();

const failures = [];
if (errors.length > 0) failures.push(...errors);
if (audit.canvasCount !== 1) failures.push(`expected one canvas, found ${audit.canvasCount}`);
if (home.taglineCount !== 0 || home.taglineTextPresent) failures.push(`Home tagline still visible: ${JSON.stringify(home)}`);
if (!home.fontFamily?.toLowerCase().includes('metal')) failures.push(`English UI font mismatch: ${JSON.stringify(home)}`);
if (Number.parseFloat(home.fontSize ?? '0') < 24) failures.push(`English Home label remains too small: ${JSON.stringify(home)}`);
if (idle.text !== '') failures.push(`idle status contains copy: ${JSON.stringify(idle)}`);
if (!idle.statusBackgroundImage?.includes('linear-gradient')) failures.push(`status shell has no tint gradient: ${JSON.stringify(idle)}`);
if (idle.statusBackgroundImage === idle.statsBackgroundImage) failures.push(`status/stat surface treatments match: ${JSON.stringify(idle)}`);
if (idle.statusBorder === idle.statsBorder) failures.push(`status/stat borders match: ${JSON.stringify(idle)}`);
if (!settings.client || !settings.scroll || settings.scroll[0] > settings.client[0] || settings.scroll[1] > settings.client[1]) failures.push(`Settings overflow: ${JSON.stringify(settings)}`);
if (!settings.fontFamily?.toLowerCase().includes('metal')) failures.push(`Settings font mismatch: ${JSON.stringify(settings)}`);
if (statusRect.bottom >= statsRect.top) failures.push(`status is not above stats: ${JSON.stringify({ statusRect, statsRect })}`);
if (preview?.previewMutationItem !== 'freeze') failures.push(`Next carrier mismatch: ${JSON.stringify(preview)}`);
if (carrier.state?.item !== 'freeze') failures.push(`active carrier mismatch: ${JSON.stringify(carrier.state)}`);
if (multiplier.state.ticks <= 0 || multiplier.state.factor !== 2) failures.push(`multiplier state mismatch: ${JSON.stringify(multiplier.state)}`);
if (!/Double/i.test(multiplier.status)) failures.push(`multiplier status mismatch: ${JSON.stringify(multiplier.status)}`);
if (supergravity.ticks <= 0) failures.push(`supergravity state mismatch: ${JSON.stringify(supergravity)}`);
if (!/Supergravity/i.test(supergravity.status)) failures.push(`supergravity status mismatch: ${JSON.stringify(supergravity.status)}`);
if (failures.length > 0) throw new Error(failures.join('\n'));
