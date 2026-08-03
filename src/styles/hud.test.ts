// @ts-expect-error Vitest runs this contract test in Node while the product tsconfig omits Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import mainSource from '../main.tsx?raw';

const hudCss = readFileSync('src/styles/hud.css', 'utf8');

describe('T27-R1 centered live stage', () => {
  it('loads the centered HUD after base and Mutation layers, then loads theme authority last', () => {
    const base = mainSource.indexOf("import './styles.css'");
    const mutation = mainSource.indexOf("import './styles/mutation-vfx.css'");
    const hud = mainSource.indexOf("import './styles/hud.css'");
    const themes = mainSource.indexOf("import './styles/themes.css'");
    expect(base).toBeGreaterThanOrEqual(0);
    expect(mutation).toBeGreaterThan(base);
    expect(hud).toBeGreaterThan(mutation);
    expect(themes).toBeGreaterThan(hud);
  });

  it('centers the only framed interaction surface between equal instrument rails', () => {
    expect(hudCss).toMatch(/\.game-arena,[\s\S]*grid-template-columns:\s*minmax\(218px, 1fr\) auto minmax\(218px, 1fr\)/);
    expect(hudCss).toMatch(/\.board-frame\s*\{[^}]*grid-column:\s*2;[^}]*justify-self:\s*center;[^}]*aspect-ratio:\s*1 \/ 2;/s);
    expect(hudCss).toMatch(/\.board-frame\s*\{[^}]*pointer-events:\s*auto;[^}]*touch-action:\s*none;/s);
    expect(hudCss).toMatch(/\.canvas-host\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*pointer-events:\s*none;/s);
  });

  it('keeps Next on the left, mode data on the right, and Mutation state below Next', () => {
    expect(hudCss).toMatch(/\.game-left-rail\s*\{[^}]*display:\s*grid;[^}]*grid-column:\s*1;[^}]*align-content:\s*start;/s);
    expect(hudCss).toMatch(/\.game-right-rail\s*\{[^}]*grid-column:\s*3;[^}]*align-content:\s*start;/s);
    expect(hudCss).toMatch(/\.game-left-rail\s*\{[^}]*gap:\s*26px;/s);
    expect(hudCss).toMatch(/\.game-left-rail,[\s\S]*align-self:\s*start;[\s\S]*margin-block-start:\s*clamp\(24px, 4vh, 42px\)/);
    expect(hudCss).toContain('.game-left-rail .mutation-status.mutation-status--vfx');
    expect(hudCss).toMatch(/\.game-left-rail \.mutation-status\.mutation-status--vfx\s*\{[^}]*position:\s*static !important;[^}]*background:\s*transparent !important;[^}]*border:\s*0 !important;/s);
    expect(hudCss).toMatch(/\.preview-rail \.rail-label\s*\{[^}]*margin:\s*0 0 2px;[^}]*text-align:\s*center;/s);
    expect(hudCss).toMatch(/\.game-left-rail \.mutation-status__header\s*\{[^}]*justify-content:\s*center;[^}]*text-align:\s*center;/s);
    expect(hudCss).toMatch(/\.preview-rail,[\s\S]*grid-template-rows:\s*auto 112px;/);
  });

  it('removes every live card shell outside the Pixi-owned board frame', () => {
    for (const selector of ['.play-surface', '.game-arena,', '.preview-rail,', '.run-stats,']) {
      const start = hudCss.indexOf(selector);
      expect(start, selector).toBeGreaterThanOrEqual(0);
      const block = hudCss.slice(start, hudCss.indexOf('\n}', start));
      expect(block).toContain('background: transparent');
      expect(block).toContain('border: 0');
      expect(block).toContain('box-shadow: none');
    }
    expect(hudCss).toMatch(/\.next-slot,[\s\S]*background:\s*transparent;[\s\S]*border:\s*0;[\s\S]*box-shadow:\s*none;/);
    expect(hudCss).toMatch(/\.run-stats \[data-stat-role\],[\s\S]*background:\s*transparent !important;[\s\S]*border:\s*0 !important;[\s\S]*box-shadow:\s*none !important;/);
  });

  it('keeps a legible two-row Puzzle queue without restoring a backdrop card', () => {
    expect(hudCss).toMatch(/\.preview-rail--puzzle,[\s\S]*grid-template-rows:\s*auto 196px;/);
    expect(hudCss).toMatch(/\.preview-rail--puzzle \.next-slot--dual,[\s\S]*grid-template-rows:\s*repeat\(2, minmax\(0, 1fr\)\);[\s\S]*height:\s*196px;/);
    expect(hudCss).toMatch(/\.next-slot__segment-label\s*\{[^}]*left:\s*0;[^}]*place-items:\s*center;/s);
    expect(hudCss).toMatch(/\.next-slot__segment-label b\s*\{[^}]*font-family:\s*var\(--font-data\);[^}]*font-size:\s*14px;/s);
  });

  it('centers gameplay sheets over the board while preserving the live canvas', () => {
    expect(hudCss).toMatch(/\.sheet-backdrop--gameplay\s*\{[^}]*top:\s*var\(--play-topbar-height\);[^}]*justify-content:\s*center;/s);
    expect(hudCss).toMatch(/\.play-shell:has\(\.sheet-backdrop--gameplay\) \.canvas-host\s*\{[^}]*filter:\s*none;/s);
    expect(hudCss).toMatch(/\.play-shell--interrupted \.play-topbar\s*\{[^}]*z-index:\s*110;[^}]*pointer-events:\s*auto;/s);
    expect(hudCss).toMatch(/\.entry-countdown\s*\{[^}]*radial-gradient\(ellipse 72% 30% at 50% 0%[^}]*radial-gradient\(ellipse 30% 72% at 100% 50%/s);
  });

  it('uses one semantic urgency signal and disables it under reduced motion', () => {
    expect(hudCss).toMatch(/\.run-stats--survival \[data-urgent="true"\] strong\s*\{[^}]*animation:\s*survival-urgent-value/s);
    expect(hudCss).toMatch(/\.app\[data-reduced-motion="true"\][\s\S]*\.run-stats--survival \[data-urgent="true"\] strong\s*\{[^}]*animation:\s*none/s);
  });

  it('keeps translated labels readable instead of solving the layout through tiny text', () => {
    expect(hudCss).toMatch(/\.play-identity > h1\s*\{[^}]*min-block-size:\s*1\.14em;[^}]*overflow:\s*visible;/s);
    expect(hudCss).not.toMatch(/font-size:\s*(?:[0-9](?:\.[0-9]+)?|1[01](?:\.[0-9]+)?)px/);
  });

  it('adapts the instrument rails above the centered board on narrow screens', () => {
    const compact = hudCss.slice(hudCss.indexOf('@media (max-width: 760px)'));
    expect(compact).toMatch(/\.game-arena,[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
    expect(compact).toMatch(/\.board-frame\s*\{[^}]*grid-column:\s*1 \/ -1;[^}]*grid-row:\s*2;/s);
    expect(compact).toMatch(/\.game-left-rail\s*\{[^}]*grid-column:\s*1;/s);
    expect(compact).toMatch(/\.game-right-rail\s*\{[^}]*grid-column:\s*2;/s);
  });

  it('does not bring retired live Puzzle diagnostics back into the rail', () => {
    expect(hudCss).not.toContain('.puzzle-guidance');
    expect(hudCss).not.toContain('.puzzle-guidance__metrics');
    expect(hudCss).not.toContain('.puzzle-guidance__route');
  });
});
