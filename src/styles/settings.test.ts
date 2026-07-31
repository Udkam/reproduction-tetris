// @vitest-environment node

// @ts-expect-error Vitest reads this source contract in Node while product types omit Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const settings = readFileSync('src/styles/settings.css', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');

describe('Phase 11 Settings authority', () => {
  it('loads one final Settings layer after the other page authorities', () => {
    const importPath = "./styles/settings.css";
    expect(main.match(new RegExp(importPath.replace('.', '\\.'), 'g'))).toHaveLength(1);
    expect(main.indexOf(importPath)).toBeGreaterThan(main.indexOf("./styles/result.css"));
  });

  it('uses one complete reading order without unequal card rows', () => {
    expect(settings).toMatch(/grid-template-areas:\s*"rules"\s*"controls"\s*"keyboard"\s*"record"/);
    expect(settings).toMatch(/\.settings-console > \.settings-console__controls[\s\S]*grid-template-areas:\s*"heading language sound actions"/);
    expect(settings).toMatch(/\.settings-console > \.settings-console__keyboard[\s\S]*grid-template-areas:\s*"heading gameplay shortcuts"/);
    expect(settings).not.toMatch(/align-content:\s*space-between|grid-auto-rows:\s*1fr/);
  });

  it('gives rules, controls, keyboard, and record independent section signals', () => {
    expect(settings).toContain('--section-accent: var(--classic)');
    expect(settings).toContain('--section-accent: #4e82b6');
    expect(settings).toContain('--section-accent: #3c948e');
    expect(settings).toContain('--section-accent: #a3697f');
    expect(settings).toContain('box-shadow: inset 0 3px 0');
  });
});
