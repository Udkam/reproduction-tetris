// @ts-expect-error Vitest runs this contract test in Node while the product tsconfig omits Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CANVAS_THEME_PALETTES,
  DEFAULT_VISUAL_THEME,
  VISUAL_THEMES,
  VISUAL_THEME_STORAGE_KEY,
  canvasThemePalette,
  parseVisualTheme,
} from './visualThemes';

const themeCss = readFileSync('src/styles/themes.css', 'utf8');

describe('visual theme contract', () => {
  it('ships exactly three named environments with a stable persisted default', () => {
    expect(VISUAL_THEMES).toEqual(['mineral-mist', 'deep-tide', 'sunstone']);
    expect(DEFAULT_VISUAL_THEME).toBe('deep-tide');
    expect(VISUAL_THEME_STORAGE_KEY).toBe('tetramorph:visual-theme:v1');
    expect(parseVisualTheme('deep-tide')).toBe('deep-tide');
    expect(parseVisualTheme('unknown')).toBe(DEFAULT_VISUAL_THEME);
    expect(parseVisualTheme(null)).toBe(DEFAULT_VISUAL_THEME);
  });

  it('gives each environment its own page, well, edge, and interaction palette', () => {
    const palettes = VISUAL_THEMES.map((theme) => canvasThemePalette(theme));
    expect(new Set(palettes.map(({ well }) => well)).size).toBe(3);
    expect(new Set(palettes.map(({ edge }) => edge)).size).toBe(3);
    expect(CANVAS_THEME_PALETTES.sunstone.well).not.toBe(CANVAS_THEME_PALETTES['deep-tide'].well);

    for (const theme of VISUAL_THEMES) {
      const start = themeCss.indexOf(`.app[data-theme="${theme}"] {`);
      expect(start, theme).toBeGreaterThanOrEqual(0);
      const block = themeCss.slice(start, themeCss.indexOf('\n}', start));
      for (const token of ['--page:', '--surface:', '--well:', '--ink:', '--line:', '--action:', '--wordmark-field:', '--theme-page-wash:']) {
        expect(block, `${theme} ${token}`).toContain(token);
      }
    }
  });

  it('renders a keyboard-sized three-option theme control with reduced-motion-safe transitions', () => {
    expect(themeCss).toMatch(/\.visual-theme-control > div\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/s);
    expect(themeCss).toMatch(/\.visual-theme-control__option\s*\{[^}]*min-height:\s*46px;[^}]*font-size:\s*13px;/s);
    expect(themeCss).toContain('.visual-theme-control__option[aria-pressed="true"]');
    expect(themeCss).toContain('.app:not([data-reduced-motion="true"])');
  });

  it('uses a solid themed wordmark field with restrained glow and theme-owned mode focus', () => {
    expect(themeCss).toMatch(/\.mode-chooser--workbench \.landing-intro\s*\{[^}]*background:\s*var\(--wordmark-field\);/s);
    const introStart = themeCss.indexOf('.app[data-theme] .mode-chooser--workbench .landing-intro');
    const introEnd = themeCss.indexOf('\n}', introStart);
    const intro = themeCss.slice(introStart, introEnd);
    expect(intro).not.toMatch(/gradient\(/);
    expect(themeCss).toMatch(/\.mode-home-wordmark[\s\S]*text-shadow:[\s\S]*var\(--classic\)/);
    expect(themeCss).toMatch(/\.mode-gate:is\(:hover, :focus-visible\)[\s\S]*var\(--gate-accent\)/);
    expect(themeCss).toMatch(/data-input-modality="pointer"\] \.mode-gate:focus:not\(:hover\)/);
  });

  it('keeps the DOM-anchored Next instrument frameless in the final theme layer', () => {
    expect(themeCss).toMatch(/\.game-left-rail :is\(\.preview-rail, \.next-slot, \.next-slot__segment\)\s*\{[^}]*background:\s*transparent !important;[^}]*border:\s*0 !important;[^}]*outline:\s*0 !important;[^}]*box-shadow:\s*none !important;/s);
    expect(themeCss).toMatch(/\.game-left-rail :is\(\.preview-rail, \.next-slot\)::before,[\s\S]*content:\s*none !important;/);
  });
});
