// @vitest-environment jsdom

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  BEDROCK_CELL,
  BOARD_HEIGHT,
  SURVIVAL_STONE_CELL,
  createBoard,
  type Cell,
  type GameEvent,
  type GameState,
  type MutationItem,
  VISIBLE_START_ROW,
} from '../core';
import { BEDROCK_MATERIAL, MUTATION_MATERIALS, SURVIVAL_STONE_MATERIAL, type PieceMaterial } from './theme';

let TetrisRendererClass: (typeof import('./TetrisRenderer'))['TetrisRenderer'];
let originalCanvasContext: PropertyDescriptor | undefined;

type RendererInternals = {
  presentation: unknown;
  trail: unknown;
  lockPulse: unknown;
  impact: number;
  rotationPulse: number;
  boardShift: unknown;
  mutationFlash: {
    item: MutationItem;
    elapsed: number;
    duration: number;
    triggerCells: readonly Cell[];
    multiplierFactor: 2 | 4;
    score: number;
  } | null;
  mutationFlashQueue: Array<{ item: MutationItem }>;
  mutationParticles: Array<{ active: boolean; item: MutationItem; rotation: number; rotationVelocity: number }>;
  mutationArrival: unknown;
  activeMutationCarrierId: number | null;
  collapseTrail: { paths: readonly { x: number; fromY: number; toY: number }[]; elapsed: number; duration: number } | null;
  consumeEvents: (events: readonly GameEvent[]) => void;
  advanceEffects: (deltaMs: number) => void;
  drawEffects: (state: GameState, layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean }) => void;
  mutationMaterial: (item: MutationItem) => PieceMaterial;
  materialFor: (material: typeof BEDROCK_CELL | typeof SURVIVAL_STONE_CELL) => PieceMaterial;
  drawMutationCarrierCore: (
    graphics: unknown,
    cells: readonly Cell[],
    item: MutationItem,
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
    offsetX?: number,
    offsetY?: number,
  ) => void;
  drawMutationCarrierEdgePulse: (
    graphics: unknown,
    cells: readonly Cell[],
    item: MutationItem | null,
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
    offsetX: number,
    offsetY: number,
  ) => void;
  queueCollapseSettlementTrail: (previousBoard: GameState['board'], cells: readonly Cell[]) => void;
  syncMutationFilters: (state: GameState, layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean }) => void;
  drawPreviewPieces: (graphics: unknown, pieces: readonly ('I' | 'O')[], x: number, y: number, width: number, height: number, labelInset?: number) => void;
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

  it('maps each item to an attached material treatment and queues bounded mutation effects', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    expect(internals.mutationMaterial('freeze')).toBe(MUTATION_MATERIALS.freeze);
    expect(internals.mutationMaterial('collapse')).toBe(MUTATION_MATERIALS.collapse);
    expect(internals.mutationMaterial('bomb')).toBe(MUTATION_MATERIALS.bomb);
    expect(internals.mutationMaterial('multiplier')).toBe(MUTATION_MATERIALS.multiplier);

    internals.consumeEvents([{ type: 'mutation-activated', item: 'bomb', durationTicks: 0, score: 300, rowsRemoved: 3 }]);
    expect(internals.mutationFlash).toMatchObject({ item: 'bomb', elapsed: 0, duration: 900, triggerCells: [], score: 300 });
    expect(internals.mutationParticles).toHaveLength(120);
    expect(internals.mutationParticles.filter((particle) => particle.active && particle.item === 'bomb')).toHaveLength(72);
    expect(internals.mutationParticles.some((particle) => particle.active && particle.item === 'bomb' && Math.abs(particle.rotationVelocity) > 0)).toBe(true);
    internals.consumeEvents([{ type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0 }]);
    expect(internals.mutationFlash).toMatchObject({ item: 'bomb' });
    expect(internals.mutationFlashQueue).toHaveLength(1);
    expect(internals.mutationFlashQueue[0]).toMatchObject({ item: 'freeze' });
    expect(internals.mutationParticles.filter((particle) => particle.active && particle.item === 'bomb')).toHaveLength(72);
    internals.advanceEffects(899);
    expect(internals.mutationFlash).toMatchObject({ item: 'bomb' });
    internals.advanceEffects(1);
    expect(internals.mutationFlash).toMatchObject({ item: 'freeze', elapsed: 0, duration: 500 });
    expect(internals.mutationParticles.filter((particle) => particle.active && particle.item === 'freeze')).toHaveLength(18);
    internals.advanceEffects(499);
    expect(internals.mutationFlash).not.toBeNull();
    internals.advanceEffects(1);
    expect(internals.mutationFlash).toBeNull();
  });

  it('routes Survival debris through a distinct stone material and gives its events a bounded impact cue', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    expect(internals.materialFor(BEDROCK_CELL)).toBe(BEDROCK_MATERIAL);
    expect(internals.materialFor(SURVIVAL_STONE_CELL)).toBe(SURVIVAL_STONE_MATERIAL);

    internals.consumeEvents([{ type: 'survival-stones-spawned', cells: [{ x: 2, y: 20 }], intervalSeconds: 20, nextIntervalSeconds: 19 }]);
    expect(internals.impact).toBeGreaterThan(0);
    internals.impact = 0;
    internals.consumeEvents([{ type: 'survival-stones-landed', cells: [{ x: 2, y: 39 }] }]);
    expect(internals.impact).toBeGreaterThan(0.4);
  });

  it('renders one static item-coloured activation frame for reduced motion', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const fills: unknown[] = [];
    const strokes: unknown[] = [];
    const graphics = {
      clear: () => graphics,
      roundRect: () => graphics,
      circle: () => graphics,
      rect: () => graphics,
      moveTo: () => graphics,
      lineTo: () => graphics,
      fill: (options: unknown) => {
        fills.push(options);
        return graphics;
      },
      stroke: (options: unknown) => {
        strokes.push(options);
        return graphics;
      },
    };
    (internals as unknown as { effectGraphics: typeof graphics; mutationGraphics: typeof graphics }).effectGraphics = graphics;
    (internals as unknown as { effectGraphics: typeof graphics; mutationGraphics: typeof graphics }).mutationGraphics = graphics;

    renderer.setOptions({ reducedMotion: true });
    internals.consumeEvents([{
      type: 'mutation-activated',
      item: 'freeze',
      durationTicks: 600,
      score: 0,
      rowsRemoved: 0,
      triggerCells: [{ x: 4, y: VISIBLE_START_ROW + 4 }],
    }]);
    internals.advanceEffects(16);

    expect(internals.mutationFlash).toMatchObject({ item: 'freeze', elapsed: 16, duration: 500 });
    internals.drawEffects(
      { phase: 'active', pendingClearRows: [] } as unknown as GameState,
      { x: 0, y: 0, width: 200, height: 400, cell: 20, compact: false },
    );
    expect(fills).toContainEqual({ color: MUTATION_MATERIALS.freeze.innerEdge, alpha: .34 });

    internals.advanceEffects(484);
    expect(internals.mutationFlash).toBeNull();
  });

  it('anchors multiplier feedback to Core trigger cells and preserves the 4× escalation cue', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const triggerCells = Object.freeze([{ x: 3, y: VISIBLE_START_ROW + 6 }]);

    internals.consumeEvents([{
      type: 'mutation-activated',
      item: 'multiplier',
      durationTicks: 1_200,
      score: 0,
      rowsRemoved: 0,
      triggerCells,
      multiplierFactor: 4,
    }]);

    expect(internals.mutationFlash).toMatchObject({
      item: 'multiplier',
      triggerCells,
      multiplierFactor: 4,
      duration: 520,
    });
  });

  it('keeps Freeze and Collapse as the only reusable active board filters', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const frost = { enabled: false, noise: 0, seed: 0 };
    const collapse = { enabled: false, scale: { x: 0, y: 0 } };
    const map = {
      position: { set: () => undefined },
      width: 0,
      height: 0,
    };
    const fields = new Map([
      ['freeze', { item: 'freeze' as const, stage: 'active' as const, elapsed: 0 }],
      ['collapse', { item: 'collapse' as const, stage: 'active' as const, elapsed: 0 }],
    ]);
    (internals as unknown as { frostFilter: typeof frost; collapseFilter: typeof collapse; collapseDisplacementMap: typeof map; mutationFields: typeof fields }).frostFilter = frost;
    (internals as unknown as { frostFilter: typeof frost; collapseFilter: typeof collapse; collapseDisplacementMap: typeof map; mutationFields: typeof fields }).collapseFilter = collapse;
    (internals as unknown as { frostFilter: typeof frost; collapseFilter: typeof collapse; collapseDisplacementMap: typeof map; mutationFields: typeof fields }).collapseDisplacementMap = map;
    (internals as unknown as { frostFilter: typeof frost; collapseFilter: typeof collapse; collapseDisplacementMap: typeof map; mutationFields: typeof fields }).mutationFields = fields;

    internals.syncMutationFilters(
      { mode: 'sprint' } as GameState,
      { x: 0, y: 0, width: 200, height: 400, cell: 20, compact: false },
    );

    expect(frost).toMatchObject({ enabled: true, noise: 0.035 });
    expect(collapse.enabled).toBe(true);
    expect(collapse.scale.x).toBe(3);
    expect(collapse.scale.y).toBeCloseTo(1.74);
  });

  it('uses one crystalline material core per connected freeze carrier without white glyphs', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const fills: Array<{ color?: number }> = [];
    const strokes: Array<{ color?: number }> = [];
    const graphics = {
      roundRect: () => graphics,
      moveTo: () => graphics,
      lineTo: () => graphics,
      fill: (options: { color?: number }) => {
        fills.push(options);
        return graphics;
      },
      stroke: (options: { color?: number }) => {
        strokes.push(options);
        return graphics;
      },
    };

    internals.drawMutationCarrierCore(
      graphics,
      [{ x: 3, y: 5 }, { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 5, y: 6 }],
      'freeze',
      { x: 0, y: 0, width: 200, height: 400, cell: 20, compact: false },
    );

    expect(fills).toHaveLength(2);
    expect(fills.map((entry) => entry.color)).toEqual([MUTATION_MATERIALS.freeze.edge, MUTATION_MATERIALS.freeze.innerEdge]);
    expect(strokes.every((entry) => entry.color !== 0xffffff)).toBe(true);
    expect(fills.every((entry) => entry.color !== 0xffffff)).toBe(true);
  });

  it('keeps every timed mutation state visibly present while the timer is active', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const fills: Array<{ color?: number }> = [];
    const graphics = {
      clear: () => graphics,
      roundRect: () => graphics,
      circle: () => graphics,
      rect: () => graphics,
      moveTo: () => graphics,
      lineTo: () => graphics,
      fill: (options: { color?: number }) => {
        fills.push(options);
        return graphics;
      },
      stroke: () => graphics,
    };
    (internals as unknown as { effectGraphics: typeof graphics; mutationGraphics: typeof graphics }).effectGraphics = graphics;
    (internals as unknown as { effectGraphics: typeof graphics; mutationGraphics: typeof graphics }).mutationGraphics = graphics;
    renderer.setOptions({ reducedMotion: true });

    const base = { mode: 'sprint', elapsedTicks: 0, phase: 'active', pendingClearRows: [] } as unknown as GameState;
    const layout = { x: 0, y: 0, width: 200, height: 400, cell: 20, compact: false };
    internals.drawEffects({ ...base, mutationFreezeTicks: 1 }, layout);
    expect(fills.some((entry) => entry.color === MUTATION_MATERIALS.freeze.innerEdge)).toBe(true);

    fills.length = 0;
    internals.drawEffects({ ...base, mutationCollapseTicks: 1 }, layout);
    expect(fills.some((entry) => entry.color === MUTATION_MATERIALS.collapse.edge)).toBe(true);

    fills.length = 0;
    internals.drawEffects({ ...base, mutationMultiplierTicks: 1 }, layout);
    expect(fills.some((entry) => entry.color === MUTATION_MATERIALS.multiplier.fillStart)).toBe(true);
  });

  it('shows collapse trails only when an independently settling lock actually moves', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const withGap = createBoard();
    withGap[BOARD_HEIGHT - 1]![0] = 'T';

    internals.queueCollapseSettlementTrail(withGap, [{ x: 0, y: BOARD_HEIGHT - 4 }]);
    expect(internals.collapseTrail).toMatchObject({
      duration: 120,
      paths: [{ x: 0, fromY: BOARD_HEIGHT - 4, toY: BOARD_HEIGHT - 2 }],
    });

    const alreadySettled = createBoard();
    alreadySettled[BOARD_HEIGHT - 1]![0] = 'T';
    internals.queueCollapseSettlementTrail(alreadySettled, [{ x: 0, y: BOARD_HEIGHT - 2 }]);
    expect(internals.collapseTrail).toBeNull();
  });

  it('tracks every just-locked cell through a compact column settlement without a per-lock sort', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const board = createBoard();
    board[BOARD_HEIGHT - 1]![0] = 'T';
    board[BOARD_HEIGHT - 3]![0] = 'S';

    internals.queueCollapseSettlementTrail(board, [
      { x: 0, y: BOARD_HEIGHT - 5 },
      { x: 0, y: BOARD_HEIGHT - 4 },
    ]);

    expect(internals.collapseTrail).toMatchObject({
      duration: 120,
      paths: [
        { x: 0, fromY: BOARD_HEIGHT - 4, toY: BOARD_HEIGHT - 3 },
        { x: 0, fromY: BOARD_HEIGHT - 5, toY: BOARD_HEIGHT - 4 },
      ],
    });
  });

  it('scales Next geometry to the slot instead of capping it at a tiny fixed unit', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const calls: Array<{ centerX: number; centerY: number; unit: number }> = [];
    (internals as unknown as {
      drawPreviewPiece: (_graphics: unknown, _piece: 'I' | 'O', centerX: number, centerY: number, unit: number) => void;
    }).drawPreviewPiece = (_graphics, _piece, centerX, centerY, unit) => calls.push({ centerX, centerY, unit });

    internals.drawPreviewPieces({}, ['I'], 0, 0, 220, 96);
    expect(calls).toEqual([{ centerX: 110, centerY: 48, unit: 28 }]);

    calls.length = 0;
    internals.drawPreviewPieces({}, ['I', 'O'], 0, 0, 220, 180);
    expect(calls).toEqual([
      { centerX: 110, centerY: 45, unit: 24 },
      { centerX: 110, centerY: 135, unit: 24 },
    ]);

    calls.length = 0;
    internals.drawPreviewPieces({}, ['O'], 0, 0, 120, 64, 18);
    expect(calls[0]?.centerY).toBe(41);
  });

});
