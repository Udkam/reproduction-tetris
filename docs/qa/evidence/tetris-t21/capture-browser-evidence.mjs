import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const origin = process.argv[2] ?? 'http://127.0.0.1:4178';
const output = path.resolve('docs/qa/evidence/tetris-t21/browser');
fs.mkdirSync(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

const renderState = async () => JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'));
const capturePage = async (name) => page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
const captureNext = async (name) => page.locator('[data-testid="next-slot"]').screenshot({ path: path.join(output, `${name}-next.png`) });

await page.goto(origin, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.setItem('tetramorph:language:v1', 'zh-CN');
  localStorage.setItem('tetris:mode-rule-intros:v1', JSON.stringify(['marathon', 'race', 'sprint', 'puzzle']));
});
await page.reload({ waitUntil: 'networkidle' });

const homeLanguageControls = await page.locator('.language-control--home').count();
const homeSettingsLanguageControls = await page.locator('.settings-console .language-control').count();
if (homeLanguageControls !== 1 || homeSettingsLanguageControls !== 0) {
  throw new Error(`Expected one home language control and none in Settings; got ${homeLanguageControls}/${homeSettingsLanguageControls}.`);
}
await page.getByTestId('language-en').click();
if ((await page.locator('html').getAttribute('lang')) !== 'en') throw new Error('Home language switch did not select English.');
await page.getByTestId('language-zh').click();
await capturePage('01-home-language');

await page.getByTestId('enter-race').click();
await page.waitForFunction(() => {
  const state = JSON.parse(window.render_game_to_text?.() ?? '{}');
  return state.screen === 'game' && state.status === 'playing' && state.countdown === null;
}, null, { timeout: 10_000 });
const baseState = await renderState();
if (baseState.stoneNextPieces !== 8 || baseState.stoneIntervalPieces !== 8) {
  throw new Error(`Unexpected initial rockfall cadence: ${baseState.stoneNextPieces}/${baseState.stoneIntervalPieces}.`);
}
await capturePage('02-survival-playing');
await captureNext('02-survival-playing');

const dialogChecks = [];
const checkDialog = async (name, open, close) => {
  await open();
  await page.getByRole('dialog').waitFor({ state: 'visible' });
  const state = await renderState();
  if (!state.next) throw new Error(`${name} lost the canonical Next piece.`);
  await capturePage(name);
  await captureNext(name);
  dialogChecks.push({ name, next: state.next, nextPreviews: state.nextPreviews });
  await close();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
};

await checkDialog(
  '03-pause',
  () => page.keyboard.press('KeyP'),
  () => page.keyboard.press('Enter'),
);
await checkDialog(
  '04-restart-confirm',
  () => page.keyboard.press('KeyR'),
  () => page.keyboard.press('Escape'),
);
await checkDialog(
  '05-leave-confirm',
  () => page.getByTestId('exit-game').click(),
  () => page.keyboard.press('Escape'),
);

for (let index = 0; index < 8; index += 1) {
  const before = (await renderState()).placedPieces;
  await page.keyboard.press('Space');
  await page.waitForFunction((pieceCount) => {
    const state = JSON.parse(window.render_game_to_text?.() ?? '{}');
    return state.placedPieces > pieceCount && state.active !== null;
  }, before, { timeout: 4_000 });
}
await page.waitForFunction(() => {
  const state = JSON.parse(window.render_game_to_text?.() ?? '{}');
  return state.fallingStones?.length > 0;
}, null, { timeout: 4_000 });
const rockfallState = await renderState();
if (rockfallState.fallingStones.some(({ y }) => y < 20)) {
  throw new Error(`Rockfall entered through the hidden buffer: ${JSON.stringify(rockfallState.fallingStones)}.`);
}
if (rockfallState.fallingStones.length < 1 || rockfallState.fallingStones.length > 2) {
  throw new Error(`Expected one or two visible rocks: ${JSON.stringify(rockfallState.fallingStones)}.`);
}
await capturePage('06-rockfall-visible');

const evidence = {
  origin,
  homeLanguageControls,
  settingsLanguageControls: homeSettingsLanguageControls,
  baseState,
  dialogChecks,
  rockfallState,
  consoleErrors,
};
fs.writeFileSync(path.join(output, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
await browser.close();

if (consoleErrors.length > 0) {
  throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);
}
