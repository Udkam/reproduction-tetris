import type { MutationItem, PieceType } from '../core';
import { MUTATION_VFX_TOKENS } from '../../design/mutationTokens';
import { COLOR_NUMBERS } from '../../design/tokens/colors';

export interface PieceMaterial {
  fillStart: number;
  fillEnd: number;
  edge: number;
  innerEdge: number;
}

export const CELL_STYLE = {
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
} as const;

export const COLORS = {
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
} as const;

export const PIECE_MATERIALS: Record<PieceType, PieceMaterial> = {
  I: { fillStart: 0xc85a72, fillEnd: 0xb14f65, edge: 0x713443, innerEdge: 0xe69aaa },
  O: { fillStart: 0x47aaa1, fillEnd: 0x3c918a, edge: 0x245b57, innerEdge: 0x91d4cf },
  T: { fillStart: 0xc58e4a, fillEnd: 0xad783d, edge: 0x694824, innerEdge: 0xe8bd83 },
  S: { fillStart: 0x647bc0, fillEnd: 0x576dae, edge: 0x354675, innerEdge: 0xa9b7e3 },
  Z: { fillStart: 0x83aa57, fillEnd: 0x6f914a, edge: 0x425a2b, innerEdge: 0xbcd79a },
  J: { fillStart: 0x9a65b1, fillEnd: 0x87579e, edge: 0x553663, innerEdge: 0xcfa9dc },
  L: { fillStart: 0x4d91ad, fillEnd: 0x407d99, edge: 0x295567, innerEdge: 0x95c8d9 },
};

/**
 * Accent/core materials for a carrier attachment. The ordinary tetromino keeps its
 * own seven-bag material beneath this compact signal treatment, so item identity
 * never replaces shape identity.
 */
export const MUTATION_MATERIALS: Record<MutationItem, PieceMaterial> = {
  // Every attachment derives from the T14 VFX palette while retaining the
  // raised-cell material grammar of the ordinary tetromino beneath it.
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
};

export const BEDROCK_MATERIAL: PieceMaterial = {
  // Compacted cave shelf: dark, permanent, and visually heavier than clearable stone.
  fillStart: 0x64727a,
  fillEnd: 0x57646b,
  edge: 0x1c282e,
  innerEdge: 0x8da0a7,
};

/** Fresh, clearable fracture from the same cold-slate family as bedrock. */
export const SURVIVAL_STONE_MATERIAL: PieceMaterial = {
  fillStart: 0x8999a2,
  fillEnd: 0x61727c,
  edge: 0x2d3c44,
  innerEdge: 0xc2d1d6,
};

/** Puzzle-only immutable cells use a pale mineral core rather than a playable hue. */
export const ANCHOR_MATERIAL: PieceMaterial = {
  fillStart: 0xb7aa92,
  fillEnd: 0x8f826b,
  edge: 0x514735,
  innerEdge: 0xe0d4bc,
};
