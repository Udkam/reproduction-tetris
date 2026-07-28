// @ts-expect-error Vitest runs this contract test in Node while the product tsconfig omits Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import mainSource from '../main.tsx?raw';

const hudCss = readFileSync('src/styles/hud.css', 'utf8');

describe('Phase 3 HUD authority', () => {
  it('loads after the historical page and Mutation VFX layers', () => {
    const base = mainSource.indexOf("import './styles.css'");
    const mutation = mainSource.indexOf("import './styles/mutation-vfx.css'");
    const hud = mainSource.indexOf("import './styles/hud.css'");
    expect(base).toBeGreaterThanOrEqual(0);
    expect(mutation).toBeGreaterThan(base);
    expect(hud).toBeGreaterThan(mutation);
  });

  it('keeps the transparent board interaction surface above the single Pixi canvas', () => {
    expect(hudCss).toMatch(/\.board-frame\s*\{[^}]*z-index:\s*7;/s);
    expect(hudCss).toMatch(/\.board-frame\s*\{[^}]*pointer-events:\s*auto;/s);
    expect(hudCss).toMatch(/\.board-frame\s*\{[^}]*touch-action:\s*none;/s);
    expect(hudCss).toMatch(/\.board-frame--countdown\s*\{[^}]*z-index:\s*8;/s);
  });

  it('overrides every compact mode with one visible stats and Next topology', () => {
    const compact = hudCss.slice(hudCss.indexOf('@media (max-width: 599px)'), hudCss.indexOf('@media (min-width: 600px)'));
    expect(compact).toContain('display: grid !important');
    expect(compact).toContain('.game-side-panel--sprint .run-stats');
    expect(compact).toContain('.game-side-panel--sprint .preview-rail');
    expect(compact).toContain('grid-template-columns: minmax(92px, .82fr) minmax(108px, 1fr) minmax(124px, 1.08fr)');
    expect(compact).toContain('.game-side-panel--sprint .info-rail');
    expect(compact).toContain('display: contents !important');
    expect(compact).toContain('.game-arena:has(.preview-rail--puzzle)');
    expect(compact).toContain('.game-side-panel:has(.preview-rail--puzzle)');
    expect(compact).not.toContain('.keyboard-map');
  });

  it('retains one ordinary well and a legible two-row Puzzle forecast', () => {
    expect(hudCss).toMatch(/\.preview-rail--puzzle \.next-slot--dual[\s\S]*height:\s*124px;/);
    expect(hudCss).toMatch(/\.preview-rail--puzzle \.next-slot__segment-label b\s*\{[^}]*font-family:\s*var\(--font-mono\);/s);
    expect(hudCss).toMatch(/\.preview-rail--puzzle \.next-slot__segment-label b\s*\{[^}]*font-size:\s*16px;/s);
  });
});
