// @vitest-environment node

// @ts-expect-error Vitest reads this source contract in Node while product types omit Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const navigation = readFileSync('src/styles/navigation.css', 'utf8');
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
});
