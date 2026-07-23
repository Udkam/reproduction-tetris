// @vitest-environment jsdom

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { GameEvent, GameState, MutationItem } from '../core';
import { MUTATION_MATERIALS, type PieceMaterial } from './theme';

let TetrisRendererClass: (typeof import('./TetrisRenderer'))['TetrisRenderer'];
let originalCanvasContext: PropertyDescriptor | undefined;

type RendererInternals = {
  presentation: unknown;
  trail: unknown;
  lockPulse: unknown;
  impact: number;
  rotationPulse: number;
  boardShift: unknown;
  mutationFlash: unknown;
  mutationArrival: unknown;
  activeMutationCarrierId: number | null;
  consumeEvents: (events: readonly GameEvent[]) => void;
  advanceEffects: (deltaMs: number) => void;
  drawEffects: (state: GameState, layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean }) => void;
  mutationMaterial: (item: MutationItem) => PieceMaterial;
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

  it('maps each item to a full special material and clears bounded mutation effects', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    expect(internals.mutationMaterial('freeze')).toBe(MUTATION_MATERIALS.freeze);
    expect(internals.mutationMaterial('collapse')).toBe(MUTATION_MATERIALS.collapse);
    expect(internals.mutationMaterial('bomb')).toBe(MUTATION_MATERIALS.bomb);
    expect(internals.mutationMaterial('multiplier')).toBe(MUTATION_MATERIALS.multiplier);

    internals.consumeEvents([{ type: 'mutation-activated', item: 'bomb', durationTicks: 0, score: 300, rowsRemoved: 3 }]);
    expect(internals.mutationFlash).toMatchObject({ item: 'bomb', elapsed: 0, duration: 380 });
    internals.advanceEffects(380);
    expect(internals.mutationFlash).toBeNull();
  });

  it('renders one static item-coloured activation frame for reduced motion', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const fills: unknown[] = [];
    const graphics = {
      clear: () => graphics,
      roundRect: () => graphics,
      fill: (options: unknown) => {
        fills.push(options);
        return graphics;
      },
    };
    (internals as unknown as { effectGraphics: typeof graphics }).effectGraphics = graphics;

    renderer.setOptions({ reducedMotion: true });
    internals.consumeEvents([{ type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0 }]);
    internals.advanceEffects(16);

    expect(internals.mutationFlash).toMatchObject({ item: 'freeze', elapsed: 16, duration: 240 });
    internals.drawEffects(
      { phase: 'active', pendingClearRows: [] } as unknown as GameState,
      { x: 0, y: 0, width: 200, height: 400, cell: 20, compact: false },
    );
    expect(fills).toContainEqual({ color: MUTATION_MATERIALS.freeze.fillStart, alpha: 0.16 });

    internals.advanceEffects(224);
    expect(internals.mutationFlash).toBeNull();
  });
});
