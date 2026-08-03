// @vitest-environment node

// @ts-expect-error Vitest reads this source contract in Node while product types omit Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const navigation = readFileSync('src/styles/navigation.css', 'utf8');
const legacy = readFileSync('src/styles.css', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');
const app = readFileSync('src/App.tsx', 'utf8');

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
    expect(navigation).toMatch(
      /\.mode-gates--workbench \.mode-gate__body strong\s*\{[^}]*min-block-size:\s*1\.16em;[^}]*overflow:\s*visible;[^}]*line-height:\s*1\.16;[^}]*text-overflow:\s*clip;/s,
    );
    expect(navigation).toMatch(
      /\.mode-gates--workbench \.mode-gate__body strong\s*\{[^}]*font-family:\s*var\(--font-ui-en\);/s,
    );
  });

  it('centres the wordmark with a shrink-to-ink box instead of a legacy full-width offset', () => {
    expect(legacy).toMatch(/\.mode-chooser--workbench \.mode-home-wordmark\s*\{[^}]*width:\s*100%;[^}]*transform:\s*translateX/s);
    expect(navigation).toMatch(/\.mode-chooser--workbench \.landing-intro\s*\{[^}]*place-content:\s*center;[^}]*place-items:\s*center;/s);
    expect(navigation).toMatch(
      /\.mode-chooser--workbench \.mode-home-wordmark\s*\{[^}]*justify-self:\s*center;[^}]*width:\s*max-content;[^}]*transform:\s*none;/s,
    );
  });

  it('keeps pointer highlighting transient instead of persisting an active mode class', () => {
    expect(app).not.toContain('mode-gate--active');
    expect(app).not.toContain('data-selection={');
    expect(app).not.toContain('onPointerEnter={() => setFocusMode');
    expect(app).toContain('data-input-modality={inputModality}');
    expect(navigation).not.toContain('.mode-gate--active');
    expect(navigation).toMatch(/\.mode-gates--workbench \.mode-gate:hover,[\s\S]*data-input-modality="keyboard"/);
    expect(navigation).toContain('.mode-gate::before { display: none; }');
    expect(navigation).toContain('data-input-modality="pointer"');
    expect(navigation).toMatch(/\.mode-gates--workbench \.mode-gate:first-child[\s\S]*border-top:\s*1px solid/);
  });

  it('resets inherited card and action placement at every responsive breakpoint', () => {
    expect(legacy).toMatch(/\.mode-gate--marathon\s*\{[^}]*grid-column:\s*1;[^}]*grid-row:\s*1;/);
    expect(legacy).toMatch(/\.mode-gate__action\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/);
    expect(legacy).toMatch(/\.console-route \.console-node > button\s*\{[^}]*min-height:\s*48px;/);
    expect(navigation).toMatch(
      /\.mode-gates--workbench \.mode-gate,[\s\S]*?\.mode-gates--workbench \.mode-gate--puzzle\s*\{[^}]*grid-column:\s*auto;[^}]*grid-row:\s*auto;[^}]*justify-self:\s*stretch;/,
    );
    expect(navigation).toMatch(
      /\.mode-gates--workbench \.mode-gate__action\s*\{[^}]*grid-column:\s*3;[^}]*grid-row:\s*1;[^}]*justify-self:\s*end;/,
    );
  });

});
