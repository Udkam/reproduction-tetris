import type { PieceType } from '../core';

export interface PieceMaterial {
  fill: number;
  outline: number;
}

export const COLORS = {
  background: 0xf4fcfd,
  surface: 0xffffff,
  cyanSurface: 0xdff7f8,
  blueSurface: 0xe8f1ff,
  well: 0xeaf8fc,
  grid: 0xbcdee6,
  edge: 0x73b6c4,
  text: 0x102f3b,
  muted: 0x486775,
  cyan: 0x0b7385,
  blue: 0x2f65ae,
  focus: 0x005fcc,
  success: 0x176b54,
  danger: 0xa33a55,
  scrim: 0x0c3d4a,
} as const;

const SHARED_OUTLINE = 0x15566a;

export const PIECE_MATERIALS: Record<PieceType, PieceMaterial> = {
  I: { fill: 0x43c9d6, outline: SHARED_OUTLINE },
  O: { fill: 0x7bd7ee, outline: SHARED_OUTLINE },
  T: { fill: 0x7698e8, outline: SHARED_OUTLINE },
  S: { fill: 0x67c9ad, outline: SHARED_OUTLINE },
  Z: { fill: 0x8ba7c5, outline: SHARED_OUTLINE },
  J: { fill: 0x507fc8, outline: SHARED_OUTLINE },
  L: { fill: 0x9a8cdb, outline: SHARED_OUTLINE },
};
