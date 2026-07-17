import { describe, expect, it } from 'vitest';
import { CELL_STYLE, PIECE_MATERIALS } from './theme';

describe('T5 bright precision-slab piece palette', () => {
  it('keeps the exact frozen four-value material for every piece', () => {
    expect(PIECE_MATERIALS).toEqual({
      I: { fillStart: 0xff4f7b, fillEnd: 0xeb2f62, edge: 0x8a1838, innerEdge: 0xffb7c8 },
      O: { fillStart: 0x00c9b7, fillEnd: 0x00a99d, edge: 0x056067, innerEdge: 0x9af5ea },
      T: { fillStart: 0xffb020, fillEnd: 0xee8500, edge: 0x874500, innerEdge: 0xffe09a },
      S: { fillStart: 0x6375ff, fillEnd: 0x4357e8, edge: 0x25328e, innerEdge: 0xc0c7ff },
      Z: { fillStart: 0x8edb3f, fillEnd: 0x65b91e, edge: 0x376a12, innerEdge: 0xdbf7a0 },
      J: { fillStart: 0xd75bff, fillEnd: 0xb838e8, edge: 0x69208a, innerEdge: 0xf0b5ff },
      L: { fillStart: 0x24a8ff, fillEnd: 0x087edb, edge: 0x07518a, innerEdge: 0xa7ddff },
    });
  });

  it('freezes the restrained slab, active aura, and fine ghost limits', () => {
    expect(CELL_STYLE).toEqual({
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
    });
    expect(CELL_STYLE.edgeWidthMax).toBeLessThanOrEqual(1.1);
    expect(CELL_STYLE.ghostFillAlpha).toBeLessThanOrEqual(0.03);
  });
});
