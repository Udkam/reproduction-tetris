// @vitest-environment node

// @ts-expect-error Vitest reads this source contract in Node while product types omit Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const navigation = readFileSync('src/styles/navigation.css', 'utf8');
const legacy = readFileSync('src/styles.css', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');

describe('Phase 9 navigation authority', () => {
  it('loads one dedicated navigation layer after tokens and the existing mode layers', () => {
    const importPath = "./styles/navigation.css";
    expect(main.match(new RegExp(importPath.replace('.', '\\.'), 'g'))).toHaveLength(1);
    const navigationIndex = main.indexOf(importPath);
    expect(navigationIndex).toBeGreaterThan(main.indexOf("./styles/tokens.css"));
    expect(navigationIndex).toBeGreaterThan(main.indexOf("./styles/mutation-vfx.css"));
    expect(navigationIndex).toBeGreaterThan(main.indexOf("./styles/hud.css"));
  });

  it('defines a stable two-by-two home with mode-owned CTA hues', () => {
    expect(navigation).toContain('T16 Phase 9 navigation authority');
    expect(navigation).toMatch(/\.mode-gates--workbench\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,/);
    expect(navigation).toMatch(/\.mode-gates--workbench\s*\{[\s\S]*grid-template-rows:\s*repeat\(2,/);
    expect(navigation).toMatch(/\.mode-gates--workbench \.mode-gate__action b,[\s\S]*background:\s*var\(--gate-accent\)/);
    expect(navigation).not.toContain('font-weight 170ms');
  });

  it('resets inherited card and action placement at every responsive breakpoint', () => {
    expect(legacy).toMatch(/\.mode-gate--marathon\s*\{[^}]*grid-column:\s*1;[^}]*grid-row:\s*1;/);
    expect(legacy).toMatch(/\.mode-gate__action\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/);
    expect(navigation).toMatch(
      /\.mode-gates--workbench \.mode-gate,[\s\S]*?\.mode-gates--workbench \.mode-gate--puzzle\s*\{[^}]*grid-column:\s*auto;[^}]*grid-row:\s*auto;[^}]*justify-self:\s*stretch;/,
    );
    expect(navigation).toMatch(
      /\.mode-gates--workbench \.mode-gate__action\s*\{[^}]*grid-column:\s*3;[^}]*grid-row:\s*1;[^}]*justify-self:\s*end;/,
    );
  });

  it('defines the complete ten-column, five-tier Puzzle bench without scroll ownership', () => {
    expect(navigation).toMatch(/\.console-workbench\s*\{[\s\S]*grid-template-rows:\s*clamp\(116px,\s*18vh,\s*160px\)\s+minmax\(0,\s*1fr\)/);
    expect(navigation).toMatch(/\.console-bands\s*\{[\s\S]*grid-template-rows:\s*repeat\(5,\s*minmax\(44px,/);
    expect(navigation).toMatch(/\.console-nodes\s*\{[\s\S]*grid-template-columns:\s*repeat\(10,\s*minmax\(44px,/);
    expect(navigation).toMatch(/\.console-node button\s*\{[\s\S]*min-width:\s*44px;[\s\S]*min-height:\s*44px;/);
    expect(navigation).not.toMatch(/overflow-(?:x|y):\s*(?:auto|scroll)/);
  });

  it('switches to five columns in portrait, preserves the short-landscape budget, and reduces motion', () => {
    expect(navigation).toMatch(/@media \(max-width:\s*719px\),\s*\(orientation:\s*portrait\)[\s\S]*grid-template-columns:\s*repeat\(5,\s*minmax\(44px,/);
    expect(navigation).toMatch(/@media \(min-width:\s*720px\) and \(max-height:\s*520px\)[\s\S]*grid-template-rows:\s*76px\s+minmax\(0,\s*1fr\)/);
    expect(navigation).toMatch(/@media \(min-width:\s*720px\) and \(max-height:\s*520px\)[\s\S]*\.console-bands\s*\{[^}]*grid-template-rows:\s*repeat\(5,\s*minmax\(44px,[^}]*gap:\s*3px;[^}]*padding-top:\s*0;/);
    expect(navigation).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*transition:\s*none !important/);
  });
});
