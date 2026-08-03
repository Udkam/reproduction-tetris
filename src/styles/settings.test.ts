// @ts-expect-error Vitest runs this contract test in Node while the product tsconfig omits Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const settingsCss = readFileSync('src/styles/settings.css', 'utf8');

describe('RC1 Settings composition', () => {
  it('uses one three-tab console and renders each concern in its own compact panel', () => {
    expect(settingsCss).toMatch(/\.settings-console__tabs\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
    expect(settingsCss).toMatch(/\.settings-console__panel\s*\{[^}]*padding:\s*18px/s);
    expect(settingsCss).toMatch(/\.settings-console__controls\s*\{[^}]*grid-template-columns:\s*minmax\(220px,\s*\.9fr\) minmax\(300px,\s*1\.1fr\)/s);
    expect(settingsCss).toMatch(/\.settings-console__keyboard\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
    expect(settingsCss).not.toMatch(/grid-template-areas:\s*"rules rules"\s*"controls keyboard"\s*"record record"/s);
    expect(settingsCss).not.toMatch(/font-size:\s*(?:9|9\.5|10)px/);
  });

  it('keeps prose in the UI face and reserves the data face for values and keycaps', () => {
    expect(settingsCss).toMatch(/\.settings-console__panel--rules > \.mode-rule-summary li\s*\{[^}]*font-family:\s*var\(--font-ui\)/s);
    expect(settingsCss).toMatch(/\.settings-console__panel--rules > \.mode-rule-summary li b\s*\{[^}]*font-family:\s*var\(--font-ui\)/s);
    expect(settingsCss).toMatch(/\.settings-console__key-group > span\s*\{[^}]*font-family:\s*var\(--font-ui\)/s);
    expect(settingsCss).toMatch(/\.settings-console__keyboard kbd\s*\{[^}]*font-family:\s*var\(--font-data\)/s);
    expect(settingsCss).toMatch(/\.settings-console__controls \.audio-volume output\s*\{[^}]*font-family:\s*var\(--font-data\)/s);
  });

  it('collapses columns without shrinking English or Chinese copy below the readable floor', () => {
    expect(settingsCss).toMatch(/@media \(max-width:\s*680px\)[\s\S]*?\.settings-console__controls,[\s\S]*?\.settings-console__keyboard\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
    expect(settingsCss).toMatch(/@media \(max-height:\s*520px\)[\s\S]*?\.settings-console__key-group > span,[\s\S]*?font-size:\s*11\.5px/s);
  });
});
