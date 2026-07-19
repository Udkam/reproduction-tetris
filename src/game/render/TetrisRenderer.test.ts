// @vitest-environment jsdom

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { GameEvent } from '../core';

let TetrisRendererClass: (typeof import('./TetrisRenderer'))['TetrisRenderer'];
let originalCanvasContext: PropertyDescriptor | undefined;

type RendererInternals = {
  presentation: unknown;
  trail: unknown;
  lockPulse: unknown;
  impact: number;
  rotationPulse: number;
  boardShift: unknown;
  consumeEvents: (events: readonly GameEvent[]) => void;
};

describe('Puzzle undo presentation reset', () => {
  beforeAll(async () => {
    originalCanvasContext = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext');
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: () => null,
    });
    ({ TetrisRenderer: TetrisRendererClass } = await import('./TetrisRenderer'));
  });

  afterAll(() => {
    if (originalCanvasContext) Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', originalCanvasContext);
  });

  it('removes every discarded lock, line-impact, and interpolation residue', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    internals.presentation = { type: 'I', x: 4, y: 10, settleMs: 26 };
    internals.trail = { cells: [{ x: 4, y: 10 }], distance: 18, elapsed: 12, duration: 125, piece: 'I' };
    internals.lockPulse = { cells: [{ x: 4, y: 10 }], elapsed: 12, duration: 140, piece: 'I' };
    internals.impact = 1.2;
    internals.rotationPulse = 1;
    internals.boardShift = { direction: 'up', elapsed: 12, duration: 180 };

    internals.consumeEvents([{ type: 'puzzle-undone' }]);

    expect(internals.presentation).toBeNull();
    expect(internals.trail).toBeNull();
    expect(internals.lockPulse).toBeNull();
    expect(internals.impact).toBe(0);
    expect(internals.rotationPulse).toBe(0);
    expect(internals.boardShift).toBeNull();
  });
});
