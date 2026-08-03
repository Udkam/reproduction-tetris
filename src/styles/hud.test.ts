// @ts-expect-error Vitest runs this contract test in Node while the product tsconfig omits Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import mainSource from '../main.tsx?raw';

const hudCss = readFileSync('src/styles/hud.css', 'utf8');
const mutationVfxCss = readFileSync('src/styles/mutation-vfx.css', 'utf8');

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
    expect(hudCss).toMatch(/\.game-side-panel,[\s\S]*z-index:\s*auto;/);
  });

  it('keeps the compact Mutation HUD two-column while idle and opens a status column only while active', () => {
    const compact = hudCss.slice(hudCss.indexOf('@media (max-width: 599px)'), hudCss.indexOf('@media (min-width: 600px)'));
    expect(compact).toContain('display: grid !important');
    expect(compact).toContain('.game-side-panel--sprint .run-stats');
    expect(compact).toContain('.game-side-panel--sprint .preview-rail');
    expect(compact).toContain('grid-template-columns: minmax(0, 1.18fr) minmax(124px, .82fr)');
    expect(compact).toContain('.game-side-panel.game-side-panel--sprint:has(.mutation-status)');
    expect(compact).toContain('grid-template-columns: minmax(92px, .84fr) minmax(80px, 1fr) minmax(110px, .94fr)');
    expect(compact).toContain('.game-side-panel--sprint:has(.mutation-status) .info-rail');
    expect(compact).toContain('display: contents !important');
    expect(compact).toContain('.game-side-panel--sprint:has(.mutation-status) .preview-rail');
    expect(compact).toContain('.game-arena:has(.preview-rail--puzzle)');
    expect(compact).toContain('.game-side-panel:has(.preview-rail--puzzle)');
    expect(compact).not.toContain('.keyboard-map');
  });

  it('sizes Mutation ledgers from the active effect count instead of reserving three empty tracks', () => {
    const compact = hudCss.slice(hudCss.indexOf('@media (max-width: 599px)'), hudCss.indexOf('@media (min-width: 600px)'));
    const short = hudCss.slice(hudCss.indexOf('@media (min-width: 600px) and (max-height: 520px)'));
    const legacyCompact = mutationVfxCss.slice(mutationVfxCss.indexOf('@media (max-width: 599px)'));
    expect(compact).toContain('grid-auto-rows: minmax(0, 1fr)');
    expect(short).toContain('grid-template-columns: repeat(auto-fit, minmax(82px, 1fr))');
    expect(legacyCompact).toContain('grid-auto-rows: minmax(0, 1fr)');
    expect(legacyCompact).not.toContain('height: 124px');
    expect(legacyCompact).not.toContain('display: none !important');
    expect(compact).not.toContain('repeat(3, minmax(0, 1fr))');
    expect(short).not.toContain('repeat(3, minmax(0, 1fr))');
    expect(legacyCompact).not.toContain('repeat(3, minmax(0, 1fr))');
  });

  it('retains one ordinary well and a legible two-row Puzzle forecast', () => {
    expect(hudCss).toMatch(/\.preview-rail--puzzle \.next-slot--dual[\s\S]*height:\s*124px;/);
    expect(hudCss).toMatch(/\.preview-rail--puzzle \.next-slot__segment-label b\s*\{[^}]*font-family:\s*var\(--font-mono\);/s);
    expect(hudCss).toMatch(/\.preview-rail--puzzle \.next-slot__segment-label b\s*\{[^}]*font-size:\s*16px;/s);
  });

  it('stacks the four desktop instruments above one aligned Next module', () => {
    const desktop = hudCss.slice(0, hudCss.indexOf('@media (max-width: 599px)'));
    expect(desktop).toMatch(/\.run-stats,[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\);/);
    expect(desktop).toMatch(/\.game-side-panel,[\s\S]*align-content:\s*center;[\s\S]*width:\s*224px;/);
    expect(desktop).toMatch(/\.preview-rail,[\s\S]*grid-template-rows:\s*auto 124px;[\s\S]*border-radius:\s*9px;/);
    expect(desktop).toMatch(/\.run-stats \[data-stat-role\],[\s\S]*border-radius:\s*9px;/);
  });

  it('gives both Survival countdowns one urgency treatment with a static reduced-motion state', () => {
    expect(hudCss).toMatch(/\.run-stats--survival \[data-urgent="true"\]\s*\{[^}]*animation:\s*survival-countdown-urgent/s);
    expect(hudCss).toMatch(/\.app\[data-reduced-motion="true"\][\s\S]*\.run-stats--survival \[data-urgent="true"\]\s*\{[^}]*animation:\s*none/s);
  });

  it('removes live Puzzle diagnostics and keeps the reclaimed rail structurally quiet', () => {
    expect(hudCss).not.toContain('.puzzle-guidance');
    expect(hudCss).not.toContain('.puzzle-guidance__metrics');
    expect(hudCss).not.toContain('.puzzle-guidance__route');
    expect(hudCss).toContain('.game-side-panel:has(.preview-rail--puzzle)');
    expect(hudCss).toContain('.preview-rail--puzzle');
  });

  it('keeps translated play-header labels outside the legacy one-em clipping box', () => {
    expect(hudCss).toMatch(
      /\.play-identity > h1\s*\{[^}]*min-block-size:\s*1\.14em;[^}]*overflow:\s*visible;[^}]*line-height:\s*1\.14;[^}]*text-overflow:\s*clip;/s,
    );
  });

  it('never solves the compact HUD by shrinking labels below twelve pixels', () => {
    expect(hudCss).not.toMatch(/font-size:\s*(?:[0-9](?:\.[0-9]+)?|1[01](?:\.[0-9]+)?)px/);
  });
});
