import type { PieceType } from '../core';

export interface PieceMaterial {
  outer: number;
  inner: number;
  highlight: number;
}

export const COLORS = {
  background: 0x071013,
  well: 0x071013,
  panel: 0xf8fcfb,
  edge: 0x789492,
  text: 0x0e1e23,
  muted: 0x6c7e82,
  signal: 0x12ae9d,
  danger: 0xe26944,
} as const;

export const PIECE_MATERIALS: Record<PieceType, PieceMaterial> = {
  I: { outer: 0xe26944, inner: 0xf18a6b, highlight: 0xffd9cd },
  O: { outer: 0x12ae9d, inner: 0x4dc6b8, highlight: 0xd4f8f3 },
  T: { outer: 0xd59a38, inner: 0xe6b961, highlight: 0xffedd0 },
  S: { outer: 0x4e73b0, inner: 0x7793c3, highlight: 0xdde6f6 },
  Z: { outer: 0x75a65c, inner: 0x97bd84, highlight: 0xe4f3dd },
  J: { outer: 0x4e49b0, inner: 0x7772ca, highlight: 0xe2e0f8 },
  L: { outer: 0xb65f82, inner: 0xce86a2, highlight: 0xf5dae4 },
};
