import type { PieceType } from '../core';

export interface PieceMaterial {
  outer: number;
  inner: number;
  highlight: number;
}

export const COLORS = {
  background: 0x070a12,
  well: 0x0b101c,
  panel: 0x131b2d,
  edge: 0x2b3752,
  text: 0xf4f7ff,
  muted: 0x93a1bc,
  signal: 0xc6ff5e,
  danger: 0xff5b73,
} as const;

export const PIECE_MATERIALS: Record<PieceType, PieceMaterial> = {
  I: { outer: 0xff7180, inner: 0xff9ba5, highlight: 0xffd9dd },
  O: { outer: 0x3ad7b1, inner: 0x74e7cd, highlight: 0xd0fff2 },
  T: { outer: 0xffb85a, inner: 0xffcf88, highlight: 0xffeed4 },
  S: { outer: 0x7588ff, inner: 0x9ba8ff, highlight: 0xe1e5ff },
  Z: { outer: 0x9ddf58, inner: 0xbcec8a, highlight: 0xe9ffc9 },
  J: { outer: 0xb77bff, inner: 0xcda2ff, highlight: 0xf0deff },
  L: { outer: 0xf674c8, inner: 0xfa9bd9, highlight: 0xffdaf0 },
};

export const PIECE_PATTERN_INDEX: Record<PieceType, number> = {
  I: 0,
  O: 1,
  T: 2,
  S: 3,
  Z: 4,
  J: 5,
  L: 6,
};
