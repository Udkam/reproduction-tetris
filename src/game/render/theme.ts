import type { PieceType } from '../core';

export interface PieceMaterial {
  fillStart: number;
  fillEnd: number;
  edge: number;
  innerEdge: number;
}

export const CELL_STYLE = {
  gapMin: 1.25,
  gapRatio: 0.055,
  radiusMin: 1.25,
  radiusMax: 2.5,
  radiusRatio: 0.085,
  edgeWidthMin: 0.75,
  edgeWidthMax: 1.1,
  edgeWidthRatio: 0.032,
  activeAuraExpand: 1.25,
  activeAuraAlpha: 0.16,
  activeAuraBlurStrength: 2.2,
  activeAuraBlurQuality: 1,
  activeAuraBlurKernelSize: 5,
  ghostInsetMin: 0.75,
  ghostInsetRatio: 0.045,
  ghostFillAlpha: 0.03,
  ghostStrokeAlpha: 0.68,
} as const;

export const COLORS = {
  background: 0xf4fafd,
  surface: 0xffffff,
  cyanSurface: 0xe7f7fa,
  blueSurface: 0xebf2ff,
  well: 0xeff8fc,
  edge: 0x79b7c7,
  text: 0x071e2b,
  muted: 0x526d7a,
  cyan: 0x059aa8,
  blue: 0x2f67d8,
  focus: 0x0b5bd7,
  success: 0x176b54,
  danger: 0xa33a55,
  scrim: 0x071e2b,
} as const;

export const PIECE_MATERIALS: Record<PieceType, PieceMaterial> = {
  I: { fillStart: 0xff4f7b, fillEnd: 0xeb2f62, edge: 0x8a1838, innerEdge: 0xffb7c8 },
  O: { fillStart: 0x00c9b7, fillEnd: 0x00a99d, edge: 0x056067, innerEdge: 0x9af5ea },
  T: { fillStart: 0xffb020, fillEnd: 0xee8500, edge: 0x874500, innerEdge: 0xffe09a },
  S: { fillStart: 0x6375ff, fillEnd: 0x4357e8, edge: 0x25328e, innerEdge: 0xc0c7ff },
  Z: { fillStart: 0x8edb3f, fillEnd: 0x65b91e, edge: 0x376a12, innerEdge: 0xdbf7a0 },
  J: { fillStart: 0xd75bff, fillEnd: 0xb838e8, edge: 0x69208a, innerEdge: 0xf0b5ff },
  L: { fillStart: 0x24a8ff, fillEnd: 0x087edb, edge: 0x07518a, innerEdge: 0xa7ddff },
};
