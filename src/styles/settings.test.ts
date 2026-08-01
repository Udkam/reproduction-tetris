// @vitest-environment node

// @ts-expect-error Vitest reads this source contract in Node while product types omit Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const settings = readFileSync('src/styles/settings.css', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');

describe('Phase 12 Settings authority', () => {
  it('loads one final Settings layer after the other page authorities', () => {
    const importPath = "./styles/settings.css";
    expect(main.match(new RegExp(importPath.replace('.', '\\.'), 'g'))).toHaveLength(1);
    expect(main.indexOf(importPath)).toBeGreaterThan(main.indexOf("./styles/result.css"));
  });

  it('keeps the canonical rules, controls, keyboard, record reading order', () => {
    expect(settings).toMatch(/grid-template-areas:\s*"rules"\s*"controls"\s*"keyboard"\s*"record"/);
    expect(settings).toMatch(/\.settings-console > \.settings-console__controls[\s\S]*grid-template-areas:\s*"heading language sound actions"/);
    expect(settings).toMatch(/\.settings-console > \.settings-console__keyboard[\s\S]*grid-template-areas:\s*"heading gameplay shortcuts"/);
    expect(settings).not.toMatch(/align-content:\s*space-between|grid-auto-rows:\s*1fr/);
  });

  it('uses one enclosing surface and typography instead of four section cards', () => {
    expect(settings).toMatch(/\.settings-console\s*\{[\s\S]*background:[\s\S]*border:\s*1px[\s\S]*border-radius:\s*12px/);
    expect(settings).toMatch(/\.settings-console > \.mode-rule-summary,[\s\S]*background:\s*transparent\s*!important;[\s\S]*border:\s*0\s*!important;[\s\S]*border-radius:\s*0\s*!important;[\s\S]*box-shadow:\s*none\s*!important;/);
    expect(settings).toContain('--settings-rule-tone:');
    expect(settings).toContain('--settings-control-tone:');
    expect(settings).toContain('--settings-keyboard-tone:');
    expect(settings).toContain('--settings-record-tone:');
    expect(settings).not.toMatch(/--section-accent|inset\s+0\s+3px|\.settings-console\s*>\s*\*\s*\+\s*\*/);
  });

  it('preserves complete controls and compact bilingual fallbacks', () => {
    expect(settings).toMatch(/\.settings-console__actions > button\s*\{[\s\S]*white-space:\s*nowrap/);
    expect(settings).toMatch(/\.settings-console__controls \.language-control button,[\s\S]*min-height:\s*44px/);
    expect(settings).toMatch(/@media \(max-width:\s*460px\)[\s\S]*grid-template-areas:\s*"heading"\s*"language"\s*"sound"\s*"actions"/);
    expect(settings).toMatch(/@media \(max-height:\s*520px\) and \(min-width:\s*700px\)/);
    expect(settings).toMatch(/@media \(max-height:\s*520px\) and \(min-width:\s*700px\)[\s\S]*max-height:\s*calc\(100dvh - 51px\);[\s\S]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/);
  });
});
