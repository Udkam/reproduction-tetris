// @ts-expect-error Vitest runs this contract test in Node while the product tsconfig omits Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const settingsCss = readFileSync('src/styles/settings.css', 'utf8');

describe('T24 Settings composition', () => {
  it('uses a balanced desktop console with section headings above their content', () => {
    expect(settingsCss).toMatch(/\.settings-console\s*\{[^}]*grid-template-columns:\s*minmax\(300px,\s*\.88fr\) minmax\(360px,\s*1\.12fr\);/s);
    expect(settingsCss).toMatch(/grid-template-areas:\s*"rules rules"\s*"controls keyboard"\s*"record record";/s);
    expect(settingsCss).toMatch(/\.settings-console > \.settings-console__controls\s*\{[^}]*grid-template-areas:\s*"heading"\s*"language"\s*"sound"\s*"actions";/s);
    expect(settingsCss).toMatch(/\.settings-console > \.settings-console__keyboard\s*\{[^}]*grid-template-areas:\s*"heading"\s*"gameplay"\s*"shortcuts";/s);
    expect(settingsCss).not.toMatch(/grid-template-columns:\s*(?:52|62|64)px/);
  });

  it('keeps prose in the UI face and reserves the data face for values and keycaps', () => {
    expect(settingsCss).toMatch(/\.settings-console > \.mode-rule-summary li\s*\{[^}]*font-family:\s*var\(--font-ui\)/s);
    expect(settingsCss).toMatch(/\.settings-console > \.mode-rule-summary li b\s*\{[^}]*font-family:\s*var\(--font-ui\)/s);
    expect(settingsCss).toMatch(/\.settings-console__key-group > span\s*\{[^}]*font-family:\s*var\(--font-ui\)/s);
    expect(settingsCss).toMatch(/\.settings-console__keyboard kbd\s*\{[^}]*font-family:\s*var\(--font-data\)/s);
  });
});
