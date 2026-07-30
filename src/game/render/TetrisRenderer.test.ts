// @vitest-environment jsdom

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  BEDROCK_CELL,
  BOARD_HEIGHT,
  SURVIVAL_STONE_CELL,
  createBoard,
  createInitialState,
  createRandomizer,
  type Cell,
  type GameEvent,
  type GameState,
  type MutationItem,
  type PieceType,
  VISIBLE_START_ROW,
} from '../core';
import { BEDROCK_MATERIAL, COLORS, MUTATION_MATERIALS, SURVIVAL_STONE_MATERIAL, type PieceMaterial } from './theme';

let TetrisRendererClass: (typeof import('./TetrisRenderer'))['TetrisRenderer'];
let originalCanvasContext: PropertyDescriptor | undefined;

type DrawOperation = {
  kind: 'roundRect' | 'rect' | 'circle' | 'poly' | 'segment' | 'fill' | 'stroke';
  values: readonly number[];
  options?: unknown;
};

type RecorderGraphics = {
  clear: () => RecorderGraphics;
  roundRect: (...values: number[]) => RecorderGraphics;
  rect: (...values: number[]) => RecorderGraphics;
  circle: (...values: number[]) => RecorderGraphics;
  poly: (values: number[]) => RecorderGraphics;
  moveTo: (x: number, y: number) => RecorderGraphics;
  lineTo: (x: number, y: number) => RecorderGraphics;
  fill: (options: unknown) => RecorderGraphics;
  stroke: (options: unknown) => RecorderGraphics;
};

function createGraphicsRecorder(): { graphics: RecorderGraphics; operations: DrawOperation[] } {
  const operations: DrawOperation[] = [];
  let currentX = 0;
  let currentY = 0;
  const graphics = {} as RecorderGraphics;
  graphics.clear = () => graphics;
  graphics.roundRect = (...values) => {
    operations.push({ kind: 'roundRect', values });
    return graphics;
  };
  graphics.rect = (...values) => {
    operations.push({ kind: 'rect', values });
    return graphics;
  };
  graphics.circle = (...values) => {
    operations.push({ kind: 'circle', values });
    return graphics;
  };
  graphics.poly = (values) => {
    operations.push({ kind: 'poly', values });
    return graphics;
  };
  graphics.moveTo = (x, y) => {
    currentX = x;
    currentY = y;
    return graphics;
  };
  graphics.lineTo = (x, y) => {
    operations.push({ kind: 'segment', values: [currentX, currentY, x, y] });
    currentX = x;
    currentY = y;
    return graphics;
  };
  graphics.fill = (options) => {
    operations.push({ kind: 'fill', values: [], options });
    return graphics;
  };
  graphics.stroke = (options) => {
    operations.push({ kind: 'stroke', values: [], options });
    return graphics;
  };
  return { graphics, operations };
}

function geometrySignature(operations: readonly DrawOperation[]): string {
  return JSON.stringify(operations
    .filter((operation) => operation.kind !== 'fill' && operation.kind !== 'stroke')
    .map(({ kind, values }) => ({ kind, values })));
}

function hasBroadHorizontalGeometry(operations: readonly DrawOperation[], boardWidth: number): boolean {
  const threshold = boardWidth * .8;
  return operations.some((operation) => {
    if (operation.kind === 'roundRect' || operation.kind === 'rect') {
      return (operation.values[2] ?? 0) >= threshold;
    }
    if (operation.kind === 'segment') {
      return Math.abs((operation.values[2] ?? 0) - (operation.values[0] ?? 0)) >= threshold;
    }
    return false;
  });
}

type RendererInternals = {
  app: {
    stage: unknown;
    renderer: {
      resolution: number;
      extract: {
        canvas: (options: unknown) => HTMLCanvasElement;
      };
    };
  } | null;
  snapshot: {
    board: { x: number; y: number; width: number; height: number; cell: number };
  };
  presentation: unknown;
  trail: {
    cells: Cell[];
    distance: number;
    elapsed: number;
    duration: number;
    piece: PieceType;
  } | null;
  lockPulse: {
    cells: Cell[];
    elapsed: number;
    duration: number;
    piece: PieceType;
    strength: number;
  } | null;
  impact: number;
  rotationPulse: number;
  boardShift: unknown;
  classicFeedbackCues: Array<{
    kind: 'combo' | 'speed-up' | 'top-out';
    elapsed: number;
    duration: number;
    cells: readonly Cell[];
    rows: readonly number[];
    combo: number;
    tier: number;
  }>;
  survivalDebrisPresentation: Map<number, { x: number; y: number }>;
  survivalStoneCues: Array<{
    kind: 'spawn' | 'land';
    cells: readonly Cell[];
    elapsed: number;
    duration: number;
  }>;
  survivalBedrockCue: {
    direction: 'up' | 'down';
    height: number;
    elapsed: number;
    duration: number;
  } | null;
  survivalEntryBedrockRise: {
    rows: number;
    elapsed: number;
    duration: number;
  } | null;
  drawPieces: (
    state: GameState,
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
  ) => void;
  mutationFlash: {
    item: MutationItem;
    elapsed: number;
    duration: number;
    triggerCells: readonly Cell[];
    multiplierFactor: 2 | 4;
    score: number;
    particlesEmitted: boolean;
    triggerColumns: readonly number[];
  } | null;
  mutationFlashQueue: Array<{ item: MutationItem }>;
  mutationParticles: Array<{ active: boolean; item: MutationItem; rotation: number; rotationVelocity: number }>;
  mutationFields: Map<Exclude<MutationItem, 'bomb'>, { item: Exclude<MutationItem, 'bomb'>; stage: 'enter' | 'active' | 'exit'; elapsed: number }>;
  mutationArrival: unknown;
  activeMutationCarrierId: number | null;
  collapseTrail: {
    paths: readonly { x: number; fromY: number; toY: number }[];
    columns: readonly number[];
    maxDrop: number;
    elapsed: number;
    duration: number;
  } | null;
  consumeEvents: (
    events: readonly GameEvent[],
    state?: GameState,
    previousBoard?: GameState['board'] | null,
    collapseWasActive?: boolean,
  ) => void;
  advanceEffects: (deltaMs: number) => void;
  advanceSurvivalDebrisPresentation: (state: GameState, deltaMs: number) => void;
  drawEffects: (state: GameState, layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean }) => void;
  drawSurvivalPressureEffects: (
    graphics: unknown,
    state: GameState,
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
  ) => void;
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
  drawMutationCarrierSurface: (
    graphics: unknown,
    cells: readonly Cell[],
    item: MutationItem,
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
    offsetX?: number,
    offsetY?: number,
  ) => void;
  drawMutationCarrierMaterials: (
    graphics: unknown,
    state: GameState,
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
    offsetY: number,
  ) => void;
  drawActiveMutationCarrierMaterial: (
    graphics: unknown,
    state: GameState,
    cells: readonly Cell[],
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
    offsetX: number,
    offsetY: number,
  ) => void;
  drawMutationCarrierEdgePulse: (
    graphics: unknown,
    cells: readonly Cell[],
    item: MutationItem | null,
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
    offsetX: number,
    offsetY: number,
  ) => void;
  drawMutationCarrierRim: (
    graphics: unknown,
    cells: readonly Cell[],
    item: MutationItem,
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
  ) => void;
  drawReducedMutationEndpoint: (
    graphics: unknown,
    item: MutationItem,
    centerX: number,
    centerY: number,
    size: number,
    factor: 2 | 4,
  ) => void;
  drawMutationMultiplierValue: (
    graphics: unknown,
    centerX: number,
    centerY: number,
    unit: number,
    factor: 2 | 4,
    color: number,
    alpha: number,
  ) => void;
  drawPreviewPiece: (
    graphics: unknown,
    type: PieceType,
    centerX: number,
    centerY: number,
    unit: number,
    carrierItem: MutationItem | null,
  ) => void;
  drawCellGroups: (
    graphics: unknown,
    cells: readonly Cell[],
    type: unknown,
    alpha: number,
    options: unknown,
  ) => void;
  drawBedrockFacets: (
    graphics: unknown,
    cells: readonly { cell: Cell; x: number; y: number }[],
    size: number,
    inset: number,
    material: PieceMaterial,
    alpha: number,
  ) => void;
  drawStoneFacets: (
    graphics: unknown,
    cells: readonly { cell: Cell; x: number; y: number }[],
    size: number,
    inset: number,
    material: PieceMaterial,
    alpha: number,
  ) => void;
  drawHardDropTraces: (
    graphics: unknown,
    trail: NonNullable<RendererInternals['trail']>,
    progress: number,
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
    boardShiftOffsetY?: number,
  ) => void;
  drawLandingImprint: (
    graphics: unknown,
    imprint: NonNullable<RendererInternals['lockPulse']>,
    progress: number,
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
  ) => void;
  drawClassicFeedbackCues: (
    graphics: unknown,
    state: GameState,
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
  ) => void;
  drawMutationActivationEffect: (
    graphics: unknown,
    flash: NonNullable<RendererInternals['mutationFlash']>,
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
  ) => void;
  drawActiveMutationAtmosphere: (
    graphics: unknown,
    state: GameState,
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
  ) => void;
  drawCollapseSettlementTrail: (
    graphics: unknown,
    trail: NonNullable<RendererInternals['collapseTrail']>,
    progress: number,
    layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean },
  ) => void;
  queueCollapseSettlementTrail: (previousBoard: GameState['board'], cells: readonly Cell[]) => void;
  syncMutationFilters: (state: GameState, layout: { x: number; y: number; width: number; height: number; cell: number; compact: boolean }) => void;
  resolvePreviewMutationItem: (state: GameState) => MutationItem | null;
  previewMutationRandomizerRef: GameState['mutationRandomizer'] | null;
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
    internals.trail = { cells: [{ x: 4, y: 10 }], distance: 18, elapsed: 12, duration: 50, piece: 'I' };
    internals.lockPulse = {
      cells: [{ x: 4, y: 10 }],
      elapsed: 12,
      duration: 100,
      piece: 'I',
      strength: 1,
    };
    internals.classicFeedbackCues.push({
      kind: 'combo',
      elapsed: 12,
      duration: 300,
      cells: [],
      rows: [39],
      combo: 2,
      tier: 0,
    });
    internals.impact = 1.2;
    internals.rotationPulse = 1;
    internals.boardShift = { direction: 'up', elapsed: 12, duration: 180 };

    internals.consumeEvents([{ type: 'puzzle-undone' }]);

    expect(internals.presentation).toBeNull();
    expect(internals.trail).toBeNull();
    expect(internals.lockPulse).toBeNull();
    expect(internals.classicFeedbackCues).toHaveLength(0);
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
    expect(internals.mutationFlash).toMatchObject({
      item: 'bomb',
      elapsed: 0,
      duration: 900,
      triggerCells: [],
      score: 300,
      particlesEmitted: false,
    });
    expect(internals.mutationParticles).toHaveLength(120);
    expect(internals.mutationParticles.filter((particle) => particle.active && particle.item === 'bomb')).toHaveLength(0);
    internals.consumeEvents([{ type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0 }]);
    expect(internals.mutationFlash).toMatchObject({ item: 'bomb' });
    expect(internals.mutationFlashQueue).toHaveLength(1);
    expect(internals.mutationFlashQueue[0]).toMatchObject({ item: 'freeze' });
    internals.advanceEffects(399);
    expect(internals.mutationParticles.filter((particle) => particle.active && particle.item === 'bomb')).toHaveLength(0);
    internals.advanceEffects(1);
    expect(internals.mutationFlash).toMatchObject({ item: 'bomb', particlesEmitted: true });
    expect(internals.mutationParticles.filter((particle) => particle.active && particle.item === 'bomb')).toHaveLength(72);
    expect(internals.mutationParticles.some((particle) => particle.active && particle.item === 'bomb' && Math.abs(particle.rotationVelocity) > 0)).toBe(true);
    internals.advanceEffects(499);
    expect(internals.mutationFlash).toMatchObject({ item: 'bomb' });
    internals.advanceEffects(1);
    expect(internals.mutationFlash).toMatchObject({ item: 'freeze', elapsed: 0, duration: 500 });
    expect(internals.mutationParticles.filter((particle) => particle.active && particle.item === 'freeze')).toHaveLength(18);
    expect(internals.mutationParticles.filter((particle) => particle.active && particle.item === 'bomb').length).toBeGreaterThan(0);
    internals.advanceEffects(499);
    expect(internals.mutationFlash).not.toBeNull();
    internals.advanceEffects(1);
    expect(internals.mutationFlash).toBeNull();
  });

  it('preserves the current Mutation flash, FIFO, and timed fields when reduced motion changes', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    internals.consumeEvents([
      { type: 'mutation-activated', item: 'bomb', durationTicks: 0, score: 300, rowsRemoved: 3 },
      { type: 'mutation-activated', item: 'freeze', durationTicks: 600, score: 0, rowsRemoved: 0 },
    ]);
    internals.mutationFields.set('collapse', { item: 'collapse', stage: 'active', elapsed: 0 });

    renderer.setOptions({ reducedMotion: true });

    expect(internals.mutationFlash).toMatchObject({ item: 'bomb', particlesEmitted: false });
    expect(internals.mutationFlashQueue).toMatchObject([{ item: 'freeze' }]);
    expect(internals.mutationFields.get('collapse')).toMatchObject({ stage: 'active' });
    expect(internals.mutationParticles.every((particle) => !particle.active)).toBe(true);

    internals.advanceEffects(900);
    expect(internals.mutationFlash).toMatchObject({ item: 'freeze', elapsed: 0 });
    internals.advanceEffects(500);
    expect(internals.mutationFlash).toBeNull();
  });

  it('invalidates Mutation preview lookahead only when the item stream changes', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const initial = createInitialState(0x715, 'sprint');
    const state = {
      ...initial,
      status: 'playing' as const,
      active: { type: 'T' as const, rotation: 0 as const, x: 3, y: 20 },
      pieceCount: 1,
    };

    internals.resolvePreviewMutationItem(state);
    expect(internals.previewMutationRandomizerRef).toBe(state.mutationRandomizer);

    const changedItemStream = {
      ...state,
      mutationRandomizer: createRandomizer(0xdead_beef),
    };
    internals.resolvePreviewMutationItem(changedItemStream);
    expect(internals.previewMutationRandomizerRef).toBe(changedItemStream.mutationRandomizer);

    const changedOrdinaryStream = {
      ...changedItemStream,
      randomizer: createRandomizer(0x1234_5678),
    };
    internals.resolvePreviewMutationItem(changedOrdinaryStream);
    expect(internals.previewMutationRandomizerRef).toBe(changedItemStream.mutationRandomizer);
  });

  it('routes Survival debris through a distinct stone material without dropping simultaneous local cues', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    expect(internals.materialFor(BEDROCK_CELL)).toBe(BEDROCK_MATERIAL);
    expect(internals.materialFor(SURVIVAL_STONE_CELL)).toBe(SURVIVAL_STONE_MATERIAL);

    internals.consumeEvents([{
      type: 'survival-stones-spawned',
      cells: [{ x: 2, y: 19 }, { x: 2, y: 20 }],
      intervalSeconds: 20,
      nextIntervalSeconds: 19,
    }]);
    expect(internals.impact).toBeGreaterThan(0);
    internals.consumeEvents([{
      type: 'survival-stones-landed',
      cells: [{ x: 2, y: 38 }, { x: 2, y: 39 }],
    }]);
    expect(internals.impact).toBeGreaterThan(0.4);
    expect(internals.survivalStoneCues).toMatchObject([
      { kind: 'spawn', cells: [{ x: 2, y: 19 }, { x: 2, y: 20 }], elapsed: 0, duration: 140 },
      { kind: 'land', cells: [{ x: 2, y: 38 }, { x: 2, y: 39 }], elapsed: 0, duration: 150 },
    ]);

    internals.advanceEffects(140);
    expect(internals.survivalStoneCues).toMatchObject([
      { kind: 'land', elapsed: 140, duration: 150 },
    ]);
    internals.advanceEffects(10);
    expect(internals.survivalStoneCues).toHaveLength(0);
  });

  it('uses diagonal slate facets for bedrock and a distinct fresh fracture for the pair', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const cell = [{ cell: { x: 3, y: 17 }, x: 10, y: 20 }];
    const bedrock = createGraphicsRecorder();
    const falling = createGraphicsRecorder();

    internals.drawBedrockFacets(
      bedrock.graphics,
      cell,
      24,
      1,
      BEDROCK_MATERIAL,
      1,
    );
    internals.drawStoneFacets(
      falling.graphics,
      cell,
      24,
      1,
      SURVIVAL_STONE_MATERIAL,
      1,
    );

    const bedrockSegments = bedrock.operations.filter((operation) => operation.kind === 'segment');
    expect(bedrock.operations.filter((operation) => operation.kind === 'poly')).toHaveLength(2);
    expect(bedrock.operations.filter((operation) => operation.kind === 'circle')).toHaveLength(1);
    expect(bedrockSegments).toHaveLength(2);
    expect(bedrockSegments.every((operation) => {
      const [startX, startY, endX, endY] = operation.values;
      return Math.abs(endY! - startY!) > Math.abs(endX! - startX!) * 0.5;
    })).toBe(true);
    expect(falling.operations.some((operation) => operation.kind === 'poly')).toBe(true);
    expect(geometrySignature(bedrock.operations)).not.toBe(geometrySignature(falling.operations));
  });

  it('reveals and raises exactly one canonical bedrock row per Survival countdown digit', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const layout = { x: 40, y: 24, width: 200, height: 400, cell: 20, compact: false };
    const state = createInitialState(0x51a1f00d, 'race');
    const pieces = createGraphicsRecorder();
    const rising = createGraphicsRecorder();
    const mask = createGraphicsRecorder();
    Object.assign(internals as unknown as Record<string, unknown>, {
      pieceGraphics: pieces.graphics,
      survivalEntryGraphics: rising.graphics,
      survivalEntryMaskGraphics: mask.graphics,
    });

    renderer.setOptions({ survivalEntryBedrockRows: 1 });
    internals.drawPieces(state, layout);
    expect(renderer.getSnapshot().visibleLockedCells).toBe(10);
    expect(renderer.getSnapshot().survivalEntryBedrockRows).toBe(1);
    expect(renderer.getSnapshot().survivalEntryBedrockRise).toMatchObject({
      rows: 1,
      elapsedMs: 0,
      durationMs: 420,
      offsetY: 20,
    });
    const firstRowFaces = rising.operations.filter((operation) => operation.kind === 'roundRect');
    expect(firstRowFaces).toHaveLength(10);
    expect(Math.min(...firstRowFaces.map((operation) => operation.values[1]!)))
      .toBeGreaterThanOrEqual(layout.y + layout.height);

    internals.advanceEffects(210);
    const halfway = createGraphicsRecorder();
    Object.assign(internals as unknown as Record<string, unknown>, {
      survivalEntryGraphics: halfway.graphics,
    });
    internals.drawPieces(state, layout);
    const halfwayOffset = renderer.getSnapshot().survivalEntryBedrockRise?.offsetY ?? 0;
    expect(halfwayOffset).toBeGreaterThan(0);
    expect(halfwayOffset).toBeLessThan(layout.cell);

    renderer.setOptions({ survivalEntryBedrockRows: 2 });
    const secondRow = createGraphicsRecorder();
    Object.assign(internals as unknown as Record<string, unknown>, {
      survivalEntryGraphics: secondRow.graphics,
    });
    internals.drawPieces(state, layout);
    expect(renderer.getSnapshot().visibleLockedCells).toBe(20);
    expect(renderer.getSnapshot().survivalEntryBedrockRise).toMatchObject({ rows: 2, offsetY: 20 });

    renderer.setOptions({ reducedMotion: true, survivalEntryBedrockRows: 3 });
    const reduced = createGraphicsRecorder();
    Object.assign(internals as unknown as Record<string, unknown>, {
      pieceGraphics: reduced.graphics,
      survivalEntryGraphics: createGraphicsRecorder().graphics,
    });
    internals.drawPieces(state, layout);
    expect(renderer.getSnapshot().visibleLockedCells).toBe(30);
    expect(renderer.getSnapshot().survivalEntryBedrockRows).toBe(3);
    expect(renderer.getSnapshot().survivalEntryBedrockRise).toBeNull();
  });

  it('interpolates each Survival stone by id and snaps the reduced-motion endpoint', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const state = {
      mode: 'race',
      survivalDebris: [{ id: 7, x: 2, y: 20 }],
    } as unknown as GameState;

    internals.advanceSurvivalDebrisPresentation(state, 16);
    expect(internals.survivalDebrisPresentation.get(7)).toEqual({ x: 2, y: 20 });

    internals.advanceSurvivalDebrisPresentation({
      ...state,
      survivalDebris: [{ id: 7, x: 2, y: 21 }],
    }, 16);
    expect(internals.survivalDebrisPresentation.get(7)?.y).toBeGreaterThan(20);
    expect(internals.survivalDebrisPresentation.get(7)?.y).toBeLessThan(21);

    renderer.setOptions({ reducedMotion: true });
    internals.advanceSurvivalDebrisPresentation({
      ...state,
      survivalDebris: [{ id: 7, x: 2, y: 21 }],
    }, 16);
    expect(internals.survivalDebrisPresentation.get(7)).toEqual({ x: 2, y: 21 });

    internals.advanceSurvivalDebrisPresentation({ ...state, survivalDebris: [] }, 16);
    expect(internals.survivalDebrisPresentation.size).toBe(0);
  });

  it('draws one top fissure and rigid-pair silhouette for the warned Survival column', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const starts: Array<[number, number]> = [];
    const strokes: unknown[] = [];
    const graphics = {
      circle: () => graphics,
      fill: () => graphics,
      moveTo: (x: number, y: number) => {
        starts.push([x, y]);
        return graphics;
      },
      lineTo: () => graphics,
      stroke: (options: unknown) => {
        strokes.push(options);
        return graphics;
      },
    };

    internals.drawSurvivalPressureEffects(
      graphics,
      {
        mode: 'race',
        survivalDebrisWarningColumns: [2],
      } as unknown as GameState,
      { x: 0, y: 0, width: 200, height: 400, cell: 20, compact: false },
    );

    expect(starts.some(([x]) => x > 43 && x < 57)).toBe(true);
    expect(starts.some(([x]) => x > 140)).toBe(false);
    expect(strokes).toHaveLength(2);
  });

  it('keeps a local bedrock boundary cue even when reduced motion removes the shift', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;

    internals.consumeEvents([{ type: 'bedrock-raised', count: 1, height: 4 }]);
    expect(internals.boardShift).toMatchObject({ direction: 'up', elapsed: 0, duration: 180 });
    expect(internals.survivalBedrockCue).toEqual({
      direction: 'up',
      height: 4,
      elapsed: 0,
      duration: 180,
    });
    internals.advanceEffects(180);
    expect(internals.survivalBedrockCue).toBeNull();

    renderer.setOptions({ reducedMotion: true });
    internals.consumeEvents([{ type: 'bedrock-lowered', count: 1, height: 3 }]);
    expect(internals.boardShift).toBeNull();
    expect(internals.survivalBedrockCue).toEqual({
      direction: 'down',
      height: 3,
      elapsed: 0,
      duration: 80,
    });
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
    expect(fills).toContainEqual({ color: MUTATION_MATERIALS.freeze.innerEdge, alpha: .44 });

    internals.advanceEffects(484);
    expect(internals.mutationFlash).toBeNull();
  });

  it('exposes immutable renderer-owned FIFO, impact, particle, and Collapse trail evidence', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const previousBoard = createBoard();
    internals.consumeEvents([
      {
        type: 'mutation-activated',
        item: 'bomb',
        durationTicks: 0,
        score: 120,
        rowsRemoved: 3,
        triggerCells: [
          { x: 1, y: VISIBLE_START_ROW + 5 },
          { x: 7, y: VISIBLE_START_ROW + 5 },
        ],
      },
      {
        type: 'mutation-activated',
        item: 'freeze',
        durationTicks: 600,
        score: 0,
        rowsRemoved: 0,
        triggerCells: [{ x: 4, y: VISIBLE_START_ROW + 4 }],
      },
    ], undefined, previousBoard);

    const queued = renderer.getSnapshot();
    expect(queued.mutationActivation).toMatchObject({
      item: 'bomb',
      elapsedMs: 0,
      durationMs: 900,
      particlesEmitted: false,
      triggerColumns: [1, 7],
    });
    expect(queued.mutationActivation?.phases.find((phase) => phase.id === 'warning')).toMatchObject({
      active: true,
      complete: false,
    });
    expect(queued.mutationActivationQueueItems).toEqual(['freeze']);
    expect(queued.mutationActiveParticleCount).toBe(0);

    internals.advanceEffects(400);
    const impact = renderer.getSnapshot();
    expect(impact.mutationActivation).toMatchObject({
      item: 'bomb',
      elapsedMs: 400,
      particlesEmitted: true,
      triggerColumns: [1, 7],
    });
    expect(impact.mutationActivation?.phases.find((phase) => phase.id === 'impact')).toMatchObject({
      active: true,
      complete: false,
      progress: 0,
    });
    expect(impact.mutationActiveParticleCount).toBeGreaterThan(0);

    impact.mutationActivation!.triggerColumns.push(9);
    impact.mutationActivationQueueItems.push('bomb');
    expect(renderer.getSnapshot().mutationActivation?.triggerColumns).toEqual([1, 7]);
    expect(renderer.getSnapshot().mutationActivationQueueItems).toEqual(['freeze']);

    const withGap = createBoard();
    withGap[BOARD_HEIGHT - 1]![0] = 'T';
    internals.queueCollapseSettlementTrail(withGap, [{ x: 0, y: BOARD_HEIGHT - 4 }]);
    expect(renderer.getSnapshot().mutationCollapseTrail).toEqual({
      columns: [0],
      maxDrop: 2,
      elapsedMs: 0,
      durationMs: 260,
    });

    internals.advanceEffects(500);
    expect(renderer.getSnapshot()).toMatchObject({
      mutationActivation: {
        item: 'freeze',
        elapsedMs: 0,
      },
      mutationActivationQueueItems: [],
    });
  });

  it('gives all four reduced-motion activations distinct static silhouettes and preserves 2× / 4×', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const signatures = new Map<MutationItem, string>();
    for (const item of ['freeze', 'collapse', 'bomb', 'multiplier'] as const) {
      const recorder = createGraphicsRecorder();
      internals.drawReducedMutationEndpoint(
        recorder.graphics,
        item,
        100,
        120,
        20,
        item === 'multiplier' ? 4 : 2,
      );
      signatures.set(item, geometrySignature(recorder.operations));
    }

    expect(new Set(signatures.values()).size).toBe(4);
    const two = createGraphicsRecorder();
    const four = createGraphicsRecorder();
    internals.drawReducedMutationEndpoint(two.graphics, 'multiplier', 100, 120, 20, 2);
    internals.drawReducedMutationEndpoint(four.graphics, 'multiplier', 100, 120, 20, 4);
    expect(geometrySignature(two.operations)).not.toBe(geometrySignature(four.operations));
  });

  it('uses item-specific surface, core, and rim geometry instead of palette-only variants', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const layout = { x: 0, y: 0, width: 200, height: 400, cell: 20, compact: false };
    const cells = [{ x: 2, y: 4 }, { x: 3, y: 4 }, { x: 3, y: 5 }];
    const assertFourGeometries = (
      drawLayer: (graphics: unknown, cells: readonly Cell[], item: MutationItem) => void,
    ) => {
      const signatures = new Set<string>();
      for (const item of ['freeze', 'collapse', 'bomb', 'multiplier'] as const) {
        const recorder = createGraphicsRecorder();
        drawLayer(recorder.graphics, cells, item);
        signatures.add(geometrySignature(recorder.operations));
      }
      expect(signatures.size).toBe(4);
    };

    assertFourGeometries((graphics, layerCells, item) => {
      internals.drawMutationCarrierSurface(graphics, layerCells, item, layout);
    });
    const originalRim = internals.drawMutationCarrierRim;
    internals.drawMutationCarrierRim = () => undefined;
    assertFourGeometries((graphics, layerCells, item) => {
      internals.drawMutationCarrierCore(graphics, layerCells, item, layout);
    });
    internals.drawMutationCarrierRim = originalRim;
    assertFourGeometries((graphics, layerCells, item) => {
      internals.drawMutationCarrierRim(graphics, layerCells, item, layout);
    });
  });

  it('routes locked, active, and Next carriers through the same surface/core grammar', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const layout = { x: 0, y: 0, width: 200, height: 400, cell: 20, compact: false };
    const calls: Array<{ layer: 'surface' | 'core' | 'rim'; item: MutationItem }> = [];
    const originalCore = internals.drawMutationCarrierCore.bind(internals);
    internals.drawCellGroups = () => undefined;
    internals.drawMutationCarrierSurface = (_graphics, _cells, item) => {
      calls.push({ layer: 'surface', item });
    };
    internals.drawMutationCarrierRim = (_graphics, _cells, item) => {
      calls.push({ layer: 'rim', item });
    };
    internals.drawMutationCarrierCore = (graphics, cells, item, coreLayout, offsetX, offsetY) => {
      calls.push({ layer: 'core', item });
      originalCore(graphics, cells, item, coreLayout, offsetX, offsetY);
    };

    for (const item of ['freeze', 'collapse', 'bomb', 'multiplier'] as const) {
      const recorder = createGraphicsRecorder();
      const locked = {
        mode: 'sprint',
        mutationCarriers: [{ id: 1, item, cells: [{ x: 2, y: VISIBLE_START_ROW + 3 }] }],
      } as unknown as GameState;
      const active = {
        mode: 'sprint',
        active: { type: 'T' },
        mutationActiveCarrier: { id: 2, item, cells: [] },
      } as unknown as GameState;
      internals.drawMutationCarrierMaterials(recorder.graphics, locked, layout, 0);
      internals.drawActiveMutationCarrierMaterial(recorder.graphics, active, [{ x: 2, y: 3 }], layout, 0, 0);
      internals.drawPreviewPiece(recorder.graphics, 'T', 100, 100, 20, item);
    }

    for (const item of ['freeze', 'collapse', 'bomb', 'multiplier'] as const) {
      expect(calls.filter((call) => call.item === item && call.layer === 'surface')).toHaveLength(3);
      expect(calls.filter((call) => call.item === item && call.layer === 'core')).toHaveLength(3);
      expect(calls.filter((call) => call.item === item && call.layer === 'rim')).toHaveLength(3);
    }
  });

  it('binds Collapse activation wells only to the trigger columns with no board-wide bar', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const layout = { x: 0, y: 0, width: 200, height: 400, cell: 20, compact: false };
    internals.consumeEvents([{
      type: 'mutation-activated',
      item: 'collapse',
      durationTicks: 600,
      score: 0,
      rowsRemoved: 0,
      triggerCells: [
        { x: 1, y: VISIBLE_START_ROW + 4 },
        { x: 7, y: VISIBLE_START_ROW + 7 },
      ],
    }]);

    expect(internals.mutationFlash).toMatchObject({ triggerColumns: [1, 7] });
    const recorder = createGraphicsRecorder();
    internals.drawMutationActivationEffect(
      recorder.graphics,
      internals.mutationFlash!,
      layout,
    );
    const rectangles = recorder.operations.filter((operation) => operation.kind === 'roundRect');
    expect(rectangles.length).toBeGreaterThan(0);
    expect(rectangles.every((operation) => operation.values[2]! < layout.width * .2)).toBe(true);
    expect(hasBroadHorizontalGeometry(recorder.operations, layout.width)).toBe(false);
    expect(rectangles.every((operation) => {
      const center = operation.values[0]! + operation.values[2]! / 2;
      return [30, 150].some((expected) => Math.abs(expected - center) < layout.cell * .15);
    })).toBe(true);
  });

  it('uses a compact persistent Collapse gravity core without top or bottom bands', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const recorder = createGraphicsRecorder();
    internals.drawActiveMutationAtmosphere(
      recorder.graphics,
      {
        mode: 'sprint',
        mutationFreezeTicks: 0,
        mutationCollapseTicks: 60,
        mutationMultiplierTicks: 0,
        mutationMultiplierFactor: 2,
      } as unknown as GameState,
      { x: 0, y: 0, width: 200, height: 400, cell: 20, compact: false },
    );

    expect(recorder.operations.some((operation) => operation.kind === 'circle')).toBe(true);
    expect(recorder.operations.filter((operation) => operation.kind === 'roundRect')).toHaveLength(0);
    expect(hasBroadHorizontalGeometry(recorder.operations, 200)).toBe(false);
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

  it('keeps the persistent multiplier field explicit at both 2× and 4×', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const layout = { x: 0, y: 0, width: 200, height: 400, cell: 20, compact: false };
    const base = {
      mode: 'sprint',
      mutationFreezeTicks: 0,
      mutationCollapseTicks: 0,
      mutationMultiplierTicks: 60,
    } as unknown as GameState;

    const twoField = createGraphicsRecorder();
    const fourField = createGraphicsRecorder();
    internals.drawActiveMutationAtmosphere(
      twoField.graphics,
      { ...base, mutationMultiplierFactor: 2 },
      layout,
    );
    internals.drawActiveMutationAtmosphere(
      fourField.graphics,
      { ...base, mutationMultiplierFactor: 4 },
      layout,
    );
    expect(geometrySignature(twoField.operations)).not.toBe(geometrySignature(fourField.operations));

    const twoGlyph = createGraphicsRecorder();
    const fourGlyph = createGraphicsRecorder();
    internals.drawMutationMultiplierValue(twoGlyph.graphics, 100, 120, 10, 2, 0xffffff, 1);
    internals.drawMutationMultiplierValue(fourGlyph.graphics, 100, 120, 10, 4, 0xffffff, 1);
    expect(geometrySignature(twoGlyph.operations)).not.toBe(geometrySignature(fourGlyph.operations));
  });

  it('keeps Freeze reusable while Collapse stays vector-local instead of distorting the whole board', () => {
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
    expect(collapse.enabled).toBe(false);
    expect(collapse.scale.x).toBe(0);
    expect(collapse.scale.y).toBe(0);
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
      duration: 260,
      columns: [0],
      maxDrop: 2,
      paths: [{ x: 0, fromY: BOARD_HEIGHT - 4, toY: BOARD_HEIGHT - 2 }],
    });
    internals.advanceEffects(259);
    expect(internals.collapseTrail).not.toBeNull();
    internals.advanceEffects(1);
    expect(internals.collapseTrail).toBeNull();

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
      duration: 260,
      columns: [0],
      maxDrop: 1,
      paths: [
        { x: 0, fromY: BOARD_HEIGHT - 3, toY: BOARD_HEIGHT - 2 },
        { x: 0, fromY: BOARD_HEIGHT - 4, toY: BOARD_HEIGHT - 3 },
        { x: 0, fromY: BOARD_HEIGHT - 5, toY: BOARD_HEIGHT - 4 },
      ],
    });
  });

  it('tracks existing and incoming movement in only the columns that actually settle', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const board = createBoard();
    board[BOARD_HEIGHT - 1]![1] = 'T';
    board[BOARD_HEIGHT - 5]![1] = 'S';
    board[BOARD_HEIGHT - 1]![3] = 'J';
    board[BOARD_HEIGHT - 1]![7] = 'L';
    internals.queueCollapseSettlementTrail(board, [
      { x: 1, y: BOARD_HEIGHT - 6 },
      { x: 3, y: BOARD_HEIGHT - 2 },
      { x: 7, y: BOARD_HEIGHT - 3 },
    ]);

    expect(internals.collapseTrail).toMatchObject({
      columns: [1, 7],
      maxDrop: 3,
    });
    expect(internals.collapseTrail?.paths).toContainEqual({
      x: 1,
      fromY: BOARD_HEIGHT - 5,
      toY: BOARD_HEIGHT - 2,
    });
    expect(internals.collapseTrail?.paths.some((path) => path.x === 3)).toBe(false);

    const recorder = createGraphicsRecorder();
    internals.drawCollapseSettlementTrail(
      recorder.graphics,
      internals.collapseTrail!,
      .82,
      { x: 0, y: 0, width: 200, height: 400, cell: 20, compact: false },
    );
    const rectangles = recorder.operations.filter((operation) => operation.kind === 'roundRect');
    expect(rectangles.every((operation) => operation.values[2]! < 160)).toBe(true);
    expect(hasBroadHorizontalGeometry(recorder.operations, 200)).toBe(false);
    expect(rectangles.every((operation) => {
      const center = operation.values[0]! + operation.values[2]! / 2;
      return [30, 150].some((expected) => Math.abs(expected - center) < 5);
    })).toBe(true);
  });

  it('retains a Collapse settlement cue when the same lock also resolves a line', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const board = createBoard();
    board[BOARD_HEIGHT - 1]![0] = 'T';
    internals.consumeEvents(
      [
        { type: 'piece-locked', piece: 'I', cells: [{ x: 0, y: BOARD_HEIGHT - 4 }] },
        { type: 'clear-started', rows: [BOARD_HEIGHT - 1] },
      ],
      { mode: 'sprint' } as GameState,
      board,
      true,
    );

    expect(internals.collapseTrail).toMatchObject({ columns: [0], maxDrop: 2 });
  });

  it('renders fill-only per-cell face blooms and a stationary reduced-motion clear', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const layout = { x: 40, y: 24, width: 200, height: 400, cell: 20, compact: false };
    const board = createBoard();
    const pieces: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L', 'I', 'O', 'T'];
    for (let column = 0; column < pieces.length; column += 1) {
      board[BOARD_HEIGHT - 1]![column] = pieces[column]!;
    }
    const state = {
      ...createInitialState(0x1a16_3ff, 'marathon'),
      board,
      status: 'playing',
      phase: 'line-clear',
      phaseTicks: 4,
      pendingClearRows: [BOARD_HEIGHT - 1],
    } as GameState;
    const recorder = createGraphicsRecorder();
    (internals as unknown as { effectGraphics: RecorderGraphics }).effectGraphics = recorder.graphics;

    internals.drawEffects(state, layout);

    const faces = recorder.operations.filter((operation) => operation.kind === 'roundRect');
    expect(faces).toHaveLength(10);
    expect(faces.every((operation) => {
      const [x, y, width, height] = operation.values;
      return width === height
        && width! < layout.cell
        && x! >= layout.x
        && x! + width! <= layout.x + layout.width
        && y! >= layout.y
        && y! + height! <= layout.y + layout.height;
    })).toBe(true);
    expect(hasBroadHorizontalGeometry(recorder.operations, layout.width)).toBe(false);
    expect(recorder.operations.some((operation) => operation.kind === 'segment')).toBe(false);
    expect(recorder.operations.filter((operation) => operation.kind === 'fill')).toHaveLength(10);
    expect(recorder.operations.some((operation) => operation.kind === 'rect')).toBe(false);
    expect(recorder.operations.some((operation) => operation.kind === 'circle')).toBe(false);

    renderer.setOptions({ reducedMotion: true });
    const reducedStart = createGraphicsRecorder();
    (internals as unknown as { effectGraphics: RecorderGraphics }).effectGraphics = reducedStart.graphics;
    internals.drawEffects({ ...state, phaseTicks: 1 }, layout);
    expect(reducedStart.operations.filter((operation) => operation.kind === 'roundRect')).toHaveLength(10);
    expect(reducedStart.operations.some((operation) => operation.kind === 'segment')).toBe(false);
    const reducedLater = createGraphicsRecorder();
    (internals as unknown as { effectGraphics: RecorderGraphics }).effectGraphics = reducedLater.graphics;
    internals.drawEffects({ ...state, phaseTicks: 4 }, layout);
    expect(geometrySignature(reducedLater.operations)).toBe(geometrySignature(reducedStart.operations));
  });

  it('queues bounded coexisting Classic combo, speed, and top-out cues only', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const classic = {
      mode: 'marathon',
      lines: 10,
      combo: 2,
    } as unknown as GameState;

    internals.consumeEvents(
      [{ type: 'piece-locked', piece: 'O', cells: [{ x: 4, y: 38 }, { x: 5, y: 38 }, { x: 4, y: 39 }, { x: 5, y: 39 }] }],
      classic,
    );
    internals.consumeEvents(
      [{ type: 'lines-cleared', rows: [BOARD_HEIGHT - 1], count: 2, score: 150 }],
      classic,
    );
    internals.consumeEvents([{ type: 'game-over', reason: 'lock-out' }], classic);

    expect(internals.classicFeedbackCues.map((cue) => cue.kind)).toEqual([
      'combo',
      'speed-up',
      'top-out',
    ]);
    expect(internals.lockPulse).toMatchObject({
      cells: [{ x: 4, y: 39 }, { x: 5, y: 39 }],
      duration: 100,
      strength: 1,
    });
    expect(internals.classicFeedbackCues[0]).toMatchObject({
      rows: [BOARD_HEIGHT - 1],
      combo: 2,
    });
    expect(internals.classicFeedbackCues[1]).toMatchObject({ tier: 1 });

    const snapshot = renderer.getSnapshot();
    expect(snapshot.classicFeedback.map((cue) => cue.kind)).toEqual([
      'combo',
      'speed-up',
      'top-out',
    ]);
    snapshot.classicFeedback[0]!.rows.push(38);
    expect(internals.classicFeedbackCues[0]?.rows).toEqual([BOARD_HEIGHT - 1]);

    const otherMode = new TetrisRendererClass() as unknown as RendererInternals;
    otherMode.consumeEvents(
      [
        { type: 'piece-locked', piece: 'I', cells: [{ x: 3, y: 39 }] },
        { type: 'lines-cleared', rows: [39], count: 1, score: 40 },
        { type: 'game-over', reason: 'lock-out' },
      ],
      { mode: 'sprint', lines: 10, combo: 2 } as unknown as GameState,
    );
    expect(otherMode.classicFeedbackCues).toHaveLength(0);

    const clearingLock = new TetrisRendererClass() as unknown as RendererInternals;
    clearingLock.consumeEvents(
      [
        { type: 'piece-locked', piece: 'I', cells: [{ x: 3, y: 39 }] },
        { type: 'clear-started', rows: [39] },
      ],
      classic,
    );
    expect(clearingLock.classicFeedbackCues).toHaveLength(0);

    for (let index = 0; index < 10; index += 1) {
      internals.consumeEvents([{ type: 'game-over', reason: 'lock-out' }], classic);
    }
    expect(internals.classicFeedbackCues).toHaveLength(6);
    expect(internals.classicFeedbackCues.every((cue) => cue.kind === 'top-out')).toBe(true);
  });

  it('freezes the shared landing imprint to true support cells under a one-point overhang', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const board = createBoard();
    const cells = [
      { x: 3, y: BOARD_HEIGHT - 2 },
      { x: 4, y: BOARD_HEIGHT - 2 },
      { x: 5, y: BOARD_HEIGHT - 2 },
      { x: 6, y: BOARD_HEIGHT - 2 },
    ];
    for (const cell of cells) board[cell.y]![cell.x] = 'I';
    board[BOARD_HEIGHT - 1]![4] = 'T';

    internals.consumeEvents(
      [{ type: 'piece-locked', piece: 'I', cells }],
      { mode: 'race', board } as unknown as GameState,
    );

    expect(internals.classicFeedbackCues).toHaveLength(0);
    expect(internals.lockPulse?.cells).toEqual([
      { x: 4, y: BOARD_HEIGHT - 2 },
    ]);

    board[BOARD_HEIGHT - 1]![3] = 'T';
    expect(internals.lockPulse?.cells).toEqual([
      { x: 4, y: BOARD_HEIGHT - 2 },
    ]);
  });

  it('limits a hard drop to four short column traces and suppresses it under a clear', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const layout = { x: 40, y: 24, width: 200, height: 400, cell: 20, compact: false };
    const trail: NonNullable<RendererInternals['trail']> = {
      cells: [
        { x: 3, y: 39 },
        { x: 4, y: 39 },
        { x: 5, y: 39 },
        { x: 6, y: 39 },
      ],
      distance: 18,
      elapsed: 0,
      duration: 50,
      piece: 'I',
    };
    const recorder = createGraphicsRecorder();
    internals.drawHardDropTraces(recorder.graphics, trail, 0, layout);
    const segments = recorder.operations.filter((operation) => operation.kind === 'segment');
    expect(segments).toHaveLength(8);
    expect(new Set(segments.map((operation) => operation.values[0])).size).toBe(4);
    expect(segments.every((operation) => {
      const [startX, startY, endX, endY] = operation.values;
      return startX === endX && endY! - startY! <= layout.cell * 0.65;
    })).toBe(true);
    expect(recorder.operations.some((operation) => operation.kind === 'roundRect')).toBe(false);

    internals.consumeEvents(
      [
        { type: 'hard-dropped', piece: 'I', distance: 18 },
        { type: 'piece-locked', piece: 'I', cells: trail.cells },
        { type: 'clear-started', rows: [BOARD_HEIGHT - 1] },
      ],
      { mode: 'marathon', board: createBoard() } as unknown as GameState,
    );
    expect(internals.trail).toBeNull();
    expect(internals.lockPulse).toMatchObject({ strength: 0.55, duration: 100 });
  });

  it('keeps landing feedback as a bounded six-tick support imprint', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const layout = { x: 40, y: 24, width: 200, height: 400, cell: 20, compact: false };
    const imprint: NonNullable<RendererInternals['lockPulse']> = {
      cells: [{ x: 4, y: BOARD_HEIGHT - 1 }],
      elapsed: 0,
      duration: 100,
      piece: 'O',
      strength: 1,
    };
    const normal = createGraphicsRecorder();
    internals.drawLandingImprint(normal.graphics, imprint, 0, layout);
    expect(normal.operations.filter((operation) => operation.kind === 'roundRect')).toHaveLength(1);
    expect(normal.operations.filter((operation) => operation.kind === 'segment')).toHaveLength(2);
    const fill = normal.operations.find((operation) => operation.kind === 'fill');
    expect((fill?.options as { alpha?: number }).alpha).toBeLessThanOrEqual(0.12);
    expect(hasBroadHorizontalGeometry(normal.operations, layout.width)).toBe(false);

    renderer.setOptions({ reducedMotion: true });
    const reducedStart = createGraphicsRecorder();
    const reducedLater = createGraphicsRecorder();
    internals.drawLandingImprint(reducedStart.graphics, imprint, 0, layout);
    internals.drawLandingImprint(reducedLater.graphics, imprint, 0.5, layout);
    expect(geometrySignature(reducedLater.operations)).toBe(geometrySignature(reducedStart.operations));
  });

  it('keeps Classic feedback inside the well and uses stationary reduced-motion geometry', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const layout = { x: 40, y: 24, width: 200, height: 400, cell: 20, compact: false };
    const classic = { mode: 'marathon', lines: 10, combo: 4 } as unknown as GameState;
    internals.consumeEvents(
      [{ type: 'piece-locked', piece: 'O', cells: [{ x: 4, y: 38 }, { x: 5, y: 38 }, { x: 4, y: 39 }, { x: 5, y: 39 }] }],
      classic,
    );
    internals.consumeEvents(
      [{ type: 'lines-cleared', rows: [38, 39], count: 2, score: 150 }],
      classic,
    );
    internals.consumeEvents([{ type: 'game-over', reason: 'lock-out' }], classic);

    const initial = createGraphicsRecorder();
    internals.drawClassicFeedbackCues(initial.graphics, classic, layout);
    expect(initial.operations.some((operation) => operation.kind === 'segment')).toBe(true);
    expect(initial.operations.some((operation) => (
      operation.kind === 'stroke'
      && (operation.options as { color?: number }).color === COLORS.classic
    ))).toBe(true);
    expect(hasBroadHorizontalGeometry(initial.operations, layout.width)).toBe(false);
    expect(initial.operations
      .filter((operation) => operation.kind === 'segment')
      .every((operation) => {
        const [startX, startY, endX, endY] = operation.values;
        return startX! >= layout.x
          && startX! <= layout.x + layout.width
          && endX! >= layout.x
          && endX! <= layout.x + layout.width
          && startY! >= layout.y
          && startY! <= layout.y + layout.height
          && endY! >= layout.y
          && endY! <= layout.y + layout.height;
      })).toBe(true);
    const movingSignature = geometrySignature(initial.operations);
    internals.advanceEffects(60);
    const moved = createGraphicsRecorder();
    internals.drawClassicFeedbackCues(moved.graphics, classic, layout);
    expect(geometrySignature(moved.operations)).not.toBe(movingSignature);

    internals.consumeEvents([{ type: 'restarted' }], classic);
    renderer.setOptions({ reducedMotion: true });
    internals.consumeEvents(
      [{ type: 'piece-locked', piece: 'O', cells: [{ x: 4, y: 39 }, { x: 5, y: 39 }] }],
      classic,
    );
    internals.consumeEvents(
      [{ type: 'lines-cleared', rows: [39], count: 1, score: 90 }],
      classic,
    );
    internals.consumeEvents([{ type: 'game-over', reason: 'lock-out' }], classic);
    const reducedStart = createGraphicsRecorder();
    internals.drawClassicFeedbackCues(reducedStart.graphics, classic, layout);
    expect(reducedStart.operations.some((operation) => operation.kind === 'circle')).toBe(false);
    expect(reducedStart.operations.some((operation) => operation.kind === 'rect')).toBe(false);
    internals.advanceEffects(40);
    const reducedLater = createGraphicsRecorder();
    internals.drawClassicFeedbackCues(reducedLater.graphics, classic, layout);
    expect(geometrySignature(reducedLater.operations)).toBe(geometrySignature(reducedStart.operations));

    internals.advanceEffects(200);
    expect(internals.classicFeedbackCues).toHaveLength(0);
  });

  it('extracts the current Pixi board without retaining or mounting a second Canvas', () => {
    const renderer = new TetrisRendererClass();
    const internals = renderer as unknown as RendererInternals;
    const pixels = new Uint8ClampedArray([
      8, 24, 42, 255,
      200, 90, 114, 255,
      71, 170, 161, 255,
      154, 101, 177, 255,
    ]);
    const extracted = document.createElement('canvas');
    extracted.width = 2;
    extracted.height = 2;
    const context = {
      getImageData: () => ({ data: pixels }),
    };
    Object.defineProperty(extracted, 'getContext', {
      configurable: true,
      value: vi.fn(() => context),
    });
    Object.defineProperty(extracted, 'toDataURL', {
      configurable: true,
      value: vi.fn(() => 'data:image/png;base64,renderer-board'),
    });
    const extractCanvas = vi.fn<(options: unknown) => HTMLCanvasElement>(() => extracted);
    const stage = {};
    internals.app = {
      stage,
      renderer: {
        resolution: 2,
        extract: { canvas: extractCanvas },
      },
    };
    internals.snapshot.board = { x: 11, y: 13, width: 101, height: 202, cell: 10 };
    const beforeSnapshot = renderer.getSnapshot();
    const canvasCountBefore = document.querySelectorAll('canvas').length;

    const result = renderer.captureBoardPng();

    expect(result).toEqual({
      dataUrl: 'data:image/png;base64,renderer-board',
      frame: { x: 11, y: 13, width: 101, height: 202 },
      resolution: 2,
      outputPixels: { width: 2, height: 2 },
      pixelProbe: {
        samples: 4,
        nonTransparentSamples: 4,
        distinctBuckets: 4,
      },
    });
    expect(extractCanvas).toHaveBeenCalledOnce();
    expect(extractCanvas.mock.calls[0]?.[0]).toMatchObject({
      target: stage,
      resolution: 2,
      antialias: true,
    });
    expect(extractCanvas.mock.calls[0]?.[0]).toHaveProperty('frame');
    expect(renderer.getSnapshot()).toEqual(beforeSnapshot);
    expect(document.querySelectorAll('canvas')).toHaveLength(canvasCountBefore);
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
