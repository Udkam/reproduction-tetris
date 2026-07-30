// @ts-expect-error Vitest runs this test in Node while the product tsconfig intentionally omits Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BEDROCK_MATERIAL,
  CELL_STYLE,
  COLORS,
  MUTATION_MATERIALS,
  PIECE_MATERIALS,
  SURVIVAL_STONE_MATERIAL,
} from './theme';
import { MUTATION_VFX_TOKENS } from '../../design/mutationTokens';
import { COLOR_NUMBERS, COLOR_TOKENS } from '../../design/tokens/colors';

const styles = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');
const tokenStyles = readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8');

function relativeLuminance(color: number): number {
  const channels = [16, 8, 0].map((shift) => ((color >> shift) & 0xff) / 255);
  return channels.reduce((sum, channel, index) => {
    const linear = channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index]!;
  }, 0);
}

function contrastRatio(first: number, second: number): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

describe('T5 bright mineral matte material', () => {
  it('keeps the exact frozen four-value material for every piece', () => {
    expect(PIECE_MATERIALS).toEqual({
      I: { fillStart: 0xc85a72, fillEnd: 0xb14f65, edge: 0x713443, innerEdge: 0xe69aaa },
      O: { fillStart: 0x47aaa1, fillEnd: 0x3c918a, edge: 0x245b57, innerEdge: 0x91d4cf },
      T: { fillStart: 0xc58e4a, fillEnd: 0xad783d, edge: 0x694824, innerEdge: 0xe8bd83 },
      S: { fillStart: 0x647bc0, fillEnd: 0x576dae, edge: 0x354675, innerEdge: 0xa9b7e3 },
      Z: { fillStart: 0x83aa57, fillEnd: 0x6f914a, edge: 0x425a2b, innerEdge: 0xbcd79a },
      J: { fillStart: 0x9a65b1, fillEnd: 0x87579e, edge: 0x553663, innerEdge: 0xcfa9dc },
      L: { fillStart: 0x4d91ad, fillEnd: 0x407d99, edge: 0x295567, innerEdge: 0x95c8d9 },
    });
  });

  it('keeps bedrock and falling stones in one warm mineral family with distinct age', () => {
    expect(BEDROCK_MATERIAL).toEqual({
      fillStart: 0x8f7455,
      fillEnd: 0x786048,
      edge: 0x30251d,
      innerEdge: 0xc5a47b,
    });
    expect(SURVIVAL_STONE_MATERIAL).toEqual({
      fillStart: 0xb68a59,
      fillEnd: 0x7e5b39,
      edge: 0x432f20,
      innerEdge: 0xe0bd88,
    });
    expect(Object.values(PIECE_MATERIALS)).not.toContainEqual(BEDROCK_MATERIAL);
    expect(Object.values(PIECE_MATERIALS)).not.toContainEqual(SURVIVAL_STONE_MATERIAL);
    expect(SURVIVAL_STONE_MATERIAL).not.toEqual(BEDROCK_MATERIAL);
    expect(contrastRatio(BEDROCK_MATERIAL.fillStart, COLORS.well)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(BEDROCK_MATERIAL.fillEnd, COLORS.well)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(SURVIVAL_STONE_MATERIAL.fillStart, COLORS.well)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(SURVIVAL_STONE_MATERIAL.fillEnd, COLORS.well)).toBeGreaterThanOrEqual(3);
  });

  it('derives four high-contrast attached-signal materials from the VFX palette', () => {
    expect(MUTATION_MATERIALS).toEqual({
      freeze: {
        fillStart: MUTATION_VFX_TOKENS.freeze.palette.primary,
        fillEnd: MUTATION_VFX_TOKENS.freeze.palette.facet,
        edge: MUTATION_VFX_TOKENS.freeze.palette.deep,
        innerEdge: MUTATION_VFX_TOKENS.freeze.palette.highlight,
      },
      collapse: {
        fillStart: MUTATION_VFX_TOKENS.collapse.palette.primary,
        fillEnd: MUTATION_VFX_TOKENS.collapse.palette.facet,
        edge: MUTATION_VFX_TOKENS.collapse.palette.deep,
        innerEdge: MUTATION_VFX_TOKENS.collapse.palette.highlight,
      },
      bomb: {
        fillStart: MUTATION_VFX_TOKENS.bomb.palette.primary,
        fillEnd: MUTATION_VFX_TOKENS.bomb.palette.facet,
        edge: MUTATION_VFX_TOKENS.bomb.palette.deep,
        innerEdge: MUTATION_VFX_TOKENS.bomb.palette.highlight,
      },
      multiplier: {
        fillStart: MUTATION_VFX_TOKENS.multiplier.palette.primary,
        fillEnd: MUTATION_VFX_TOKENS.multiplier.palette.facet,
        edge: MUTATION_VFX_TOKENS.multiplier.palette.deep,
        innerEdge: MUTATION_VFX_TOKENS.multiplier.palette.highlight,
      },
    });
    const starts = Object.values(MUTATION_MATERIALS).map((material) => material.fillStart);
    expect(new Set(starts).size).toBe(4);
    for (const material of Object.values(MUTATION_MATERIALS)) {
      expect(contrastRatio(material.fillStart, COLORS.well)).toBeGreaterThanOrEqual(3);
      // The lower gradient endpoint is intentionally deep to keep the carrier
      // dimensional; the lit face and signal rim retain the strict 3:1 floor.
      expect(contrastRatio(material.fillEnd, COLORS.well)).toBeGreaterThanOrEqual(1.5);
      expect(contrastRatio(material.innerEdge, COLORS.well)).toBeGreaterThanOrEqual(3);
      // Signals remain material-coloured; no carrier is a white-glyph substitute.
      expect(material.innerEdge).not.toBe(0xffffff);
    }
  });

  it('bridges the complete renderer shell palette from Design System tokens', () => {
    expect(COLORS).toEqual({
      page: COLOR_NUMBERS.background,
      surface: COLOR_NUMBERS.surface,
      raised: COLOR_NUMBERS.surfaceSecondary,
      selected: COLOR_NUMBERS.surfaceSelected,
      well: COLOR_NUMBERS.board,
      text: COLOR_NUMBERS.textPrimary,
      muted: COLOR_NUMBERS.textSecondary,
      line: COLOR_NUMBERS.border,
      edge: COLOR_NUMBERS.borderStrong,
      classic: COLOR_NUMBERS.classic,
      race: COLOR_NUMBERS.survival,
      puzzle: COLOR_NUMBERS.puzzle,
      selection: COLOR_NUMBERS.selection,
      target: COLOR_NUMBERS.target,
      action: COLOR_NUMBERS.action,
      hover: COLOR_NUMBERS.actionHover,
      focus: COLOR_NUMBERS.focus,
      actionInk: COLOR_NUMBERS.actionInk,
      success: COLOR_NUMBERS.success,
      danger: COLOR_NUMBERS.danger,
      scrim: COLOR_NUMBERS.board,
    });
  });

  it('bridges the exact Design System CSS palette and retains action ink on blue action states', () => {
    const tokens = {
      '--page': COLOR_TOKENS.background,
      '--surface': COLOR_TOKENS.surface,
      '--raised': COLOR_TOKENS.surfaceSecondary,
      '--selected': COLOR_TOKENS.surfaceSelected,
      '--well': COLOR_TOKENS.board,
      '--ink': COLOR_TOKENS.textPrimary,
      '--muted': COLOR_TOKENS.textSecondary,
      '--line': COLOR_TOKENS.border,
      '--edge': COLOR_TOKENS.borderStrong,
      '--classic': COLOR_TOKENS.classic,
      '--race': COLOR_TOKENS.survival,
      '--sprint': COLOR_TOKENS.mutation,
      '--puzzle': COLOR_TOKENS.puzzle,
      '--selection': COLOR_TOKENS.selection,
      '--action': COLOR_TOKENS.action,
      '--hover': COLOR_TOKENS.actionHover,
      '--focus': COLOR_TOKENS.focus,
      '--action-ink': COLOR_TOKENS.actionInk,
      '--success': COLOR_TOKENS.success,
      '--danger': COLOR_TOKENS.danger,
    } as const;

    for (const [token, value] of Object.entries(tokens)) {
      expect(tokenStyles).toContain(`${token}: ${value};`);
    }
    expect(tokenStyles).toContain('--phase: linear-gradient(90deg, #31978D, #5878C4, #C77A35, #8A63B3);');
    expect(styles).toContain('color-scheme: light;');
    expect(styles).toContain('--shadow: 0 18px 44px rgba(31, 59, 86, .14);');
    const actionTextRules = [
      /\.skip-link\s*\{[^}]*color: var\(--action-ink\);[^}]*background: var\(--action\);/s,
      /\.mode-gate:hover \.mode-gate__action b,[^}]*color: var\(--action-ink\);[^}]*background: var\(--action\);/s,
      /\.primary-action\s*\{[^}]*color: var\(--action-ink\);[^}]*background: var\(--action\);/s,
      /\.topbar-action:last-child\s*\{[^}]*color: var\(--action-ink\);[^}]*background: var\(--action\);/s,
      /\.touch-key:hover,[^}]*color: var\(--action-ink\);[^}]*background: var\(--action\);/s,
    ];
    for (const rule of actionTextRules) expect(styles).toMatch(rule);
  });

  it('retains AA text and action contrast plus three-to-one material contrast', () => {
    expect(contrastRatio(COLORS.text, COLORS.surface)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(COLORS.muted, COLORS.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(COLORS.muted, COLORS.raised)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(COLORS.actionInk, COLORS.action)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(COLORS.actionInk, COLORS.hover)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(COLORS.focus, COLORS.surface)).toBeGreaterThanOrEqual(3);

    for (const material of Object.values(PIECE_MATERIALS)) {
      expect(contrastRatio(material.fillStart, COLORS.well)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(material.fillEnd, COLORS.well)).toBeGreaterThanOrEqual(3);
    }
  });

  it('freezes the matte plate, signal edge, zero-fill ghost, and lock response', () => {
    expect(CELL_STYLE).toEqual({
      gapFloor: 0.7,
      gapMin: 1.25,
      gapRatio: 0.055,
      radiusMin: 1.25,
      radiusMax: 1.75,
      radiusRatio: 0.065,
      edgeWidthMin: 1,
      edgeWidthMax: 1.6,
      edgeWidthRatio: 0.045,
      reliefSignalAlpha: 0.38,
      reliefDarkAlpha: 0.92,
      faceInsetMin: 0.55,
      faceInsetMax: 1.15,
      faceInsetRatio: 0.035,
      faceBevelWidthMin: 0.65,
      faceBevelWidthMax: 1.6,
      faceBevelWidthRatio: 0.052,
      faceSignalAlpha: 0.24,
      faceDarkAlpha: 0.46,
      seamGrooveWidthMin: 0.6,
      seamGrooveWidthMax: 1.2,
      seamGrooveWidthRatio: 0.038,
      seamGrooveAlpha: 0.72,
      seamLipWidthMin: 0.45,
      seamLipWidthMax: 0.8,
      seamLipWidthRatio: 0.025,
      seamLipAlpha: 0.3,
      seamLipOffsetRatio: 0.55,
      ghostInsetMin: 0.75,
      ghostInsetRatio: 0.045,
      ghostStrokeWidth: 1,
      ghostStrokeAlpha: 0.45,
      ghostSeamWidth: 0.75,
      ghostSeamAlpha: 0.28,
      landingImprintFillAlpha: 0.12,
      landingImprintDurationMs: 100,
    });
    expect(CELL_STYLE.radiusMax).toBeLessThanOrEqual(1.75);
    expect(CELL_STYLE.edgeWidthMax).toBeLessThanOrEqual(1.6);
    expect((CELL_STYLE.gapFloor * 2) / CELL_STYLE.seamGrooveWidthMin).toBeGreaterThanOrEqual(1.6);
    expect((CELL_STYLE.gapMin * 2) / CELL_STYLE.seamGrooveWidthMax).toBeGreaterThanOrEqual(1.6);
    expect(CELL_STYLE.ghostStrokeWidth).toBe(1);
    expect(CELL_STYLE.landingImprintFillAlpha).toBeLessThanOrEqual(0.12);
    expect(CELL_STYLE.landingImprintDurationMs).toBe(100);
  });
});
