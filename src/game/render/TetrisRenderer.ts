import {
  Application,
  Container,
  DisplacementFilter,
  FillGradient,
  Graphics,
  NoiseFilter,
  Rectangle,
  Sprite,
  Texture,
  type Ticker,
} from 'pixi.js';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  ANCHOR_CELL,
  BEDROCK_CELL,
  SURVIVAL_STONE_CELL,
  PIECE_SHAPES,
  VISIBLE_HEIGHT,
  VISIBLE_START_ROW,
  cellsForPiece,
  dropDistance,
  nextMutationPreviewItem,
  type Cell,
  type GameEvent,
  type GameState,
  type MutationItem,
  type BoardMaterial,
  type PieceType,
} from '../core';
import {
  ANCHOR_MATERIAL,
  BEDROCK_MATERIAL,
  CELL_STYLE,
  COLORS,
  MUTATION_MATERIALS,
  PIECE_MATERIALS,
  SURVIVAL_STONE_MATERIAL,
  type PieceMaterial,
} from './theme';
import {
  MUTATION_PARTICLE_LIMIT,
  MUTATION_VFX_BACKGROUND,
  MUTATION_VFX_TOKENS,
} from '../../design/mutationTokens';
import {
  createMutationActivationTimeline,
  mutationEase,
  type MutationTimeline,
  type TimelineSample,
} from '../../animation/mutationTimeline';
import {
  activeCellsInsideVisibleRows,
  activePresentationScaleFitsVisibleWell,
  approachPresentationPoint,
  boardShiftPresentationOffset,
  clampActivePresentationOffsetY,
  exposedCellEdges,
  internalCellSeams,
  lineClearCellProgress,
  nextPreviewPieces,
  ordinaryLineClearFrame,
  ordinaryLineClearStrength,
  orthogonalCellComponents,
  type CellEdge,
  type BoardShiftDirection,
} from './presentation';

interface RenderOptions {
  reducedMotion: boolean;
  modeSwitch: boolean;
}

interface BoardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  cell: number;
  compact: boolean;
}

interface PiecePresentation {
  type: PieceType;
  x: number;
  y: number;
  settleMs: number;
}

interface TrailState {
  cells: Cell[];
  distance: number;
  elapsed: number;
  duration: number;
  piece: PieceType;
}

interface LockPulse {
  cells: Cell[];
  elapsed: number;
  duration: number;
  piece: PieceType;
}

interface PreviewSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  /** In-well human labels reserve a calm strip above their matching tetromino. */
  labelInset: number;
}

interface BoardShift {
  direction: BoardShiftDirection;
  elapsed: number;
  duration: number;
}

interface SurvivalDebrisPresentation {
  x: number;
  y: number;
}

interface SurvivalStoneCue {
  kind: 'spawn' | 'land';
  cells: readonly Cell[];
  elapsed: number;
  duration: number;
}

interface OrdinaryClearCell extends Cell {
  material: BoardMaterial;
}

type ClassicFeedbackKind = 'landing' | 'combo' | 'speed-up' | 'top-out';

interface ClassicFeedbackCue {
  kind: ClassicFeedbackKind;
  elapsed: number;
  duration: number;
  cells: readonly Cell[];
  rows: readonly number[];
  combo: number;
  tier: number;
}

interface MutationFlash {
  item: MutationItem;
  elapsed: number;
  duration: number;
  timeline: MutationTimeline;
  /** Immutable Core geometry, before a line clear remaps the carrier. */
  triggerCells: readonly Cell[];
  /** The activation event is the source of truth for the 2× / 4× cue. */
  multiplierFactor: 2 | 4;
  /** Core-earned points are only displayed; the renderer never changes scoring. */
  score: number;
  /** Bomb fragments are armed at impact; every other family emits at activation. */
  particlesEmitted: boolean;
  /** Immutable board snapshot retained only until a deferred Bomb impact begins. */
  particlePreviousBoard: GameState['board'] | null;
  /** Stable board columns touched by the carrier that activated this item. */
  triggerColumns: readonly number[];
}

/** Renderer-only request retained until every same-tick item receives its own burst. */
interface MutationFlashRequest {
  item: MutationItem;
  triggerCells: readonly Cell[];
  multiplierFactor: 2 | 4;
  score: number;
  previousBoard: GameState['board'] | null;
}

interface MutationArrival {
  carrierId: number;
  elapsed: number;
  duration: number;
}

interface CollapseTrail {
  paths: readonly { x: number; fromY: number; toY: number }[];
  /** Sorted naturally by the fixed left-to-right compaction scan. */
  columns: readonly number[];
  maxDrop: number;
  elapsed: number;
  duration: number;
}

type MutationFieldStage = 'enter' | 'active' | 'exit';

interface MutationField {
  item: Exclude<MutationItem, 'bomb'>;
  stage: MutationFieldStage;
  elapsed: number;
}

/** One renderer-owned slot in the fixed VFX pool; never a Pixi display object. */
interface MutationParticle {
  active: boolean;
  item: MutationItem;
  u: number;
  v: number;
  velocityU: number;
  velocityV: number;
  elapsed: number;
  lifeMs: number;
  size: number;
  color: number;
  rotation: number;
  rotationVelocity: number;
}

interface GroupDrawOptions {
  originX: number;
  originY: number;
  unit: number;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  active?: boolean;
  ghost?: boolean;
  faceColor?: number;
  material?: PieceMaterial;
}

export interface RendererSnapshot {
  canvas: { width: number; height: number; resolution: number };
  board: { x: number; y: number; width: number; height: number; cell: number };
  preview: { x: number; y: number; width: number; height: number } | null;
  previewLayerVisible: boolean;
  previewPiece: PieceType | null;
  previewPieces: PieceType[];
  previewMutationItem: MutationItem | null;
  previewClearBounds: { x: number; y: number; width: number; height: number } | null;
  previewClearPiece: PieceType | null;
  scrim: { x: number; y: number; width: number; height: number } | null;
  activeCells: Cell[];
  ghostCells: Cell[];
  visibleLockedCells: number;
  presentation: { x: number; y: number; offsetX: number; offsetY: number } | null;
  boardShiftOffsetY: number;
  mutationFilters: { freeze: boolean; collapse: boolean; activeCount: number };
  /** Read-only DEV-QA observability for source-bound FIFO/VFX evidence. */
  mutationActivation: {
    item: MutationItem;
    elapsedMs: number;
    durationMs: number;
    phases: TimelineSample[];
    particlesEmitted: boolean;
    triggerColumns: number[];
  } | null;
  mutationActivationQueueItems: MutationItem[];
  mutationActiveParticleCount: number;
  mutationCollapseTrail: {
    columns: number[];
    maxDrop: number;
    elapsedMs: number;
    durationMs: number;
  } | null;
  survivalDebris: Array<{ id: number; x: number; y: number; presentationY: number }>;
  survivalDebrisWarningColumns: number[];
  survivalStoneCueCount: number;
  classicFeedback: Array<{
    kind: ClassicFeedbackKind;
    elapsedMs: number;
    durationMs: number;
    cells: Cell[];
    rows: number[];
    combo: number;
    tier: number;
  }>;
}

export interface RendererBoardCapture {
  dataUrl: string;
  frame: { x: number; y: number; width: number; height: number };
  resolution: number;
  outputPixels: { width: number; height: number };
  pixelProbe: {
    samples: number;
    nonTransparentSamples: number;
    distinctBuckets: number;
  };
}

const easeOutCubic = (value: number): number => 1 - Math.pow(1 - value, 3);
const CLASSIC_FEEDBACK_LIMIT = 6;

const SCORE_SEGMENT_COORDINATES = [
  [.12, 0, .88, 0],
  [.88, 0, .88, .5],
  [.88, .5, .88, 1],
  [.12, 1, .88, 1],
  [.12, .5, .12, 1],
  [.12, 0, .12, .5],
  [.12, .5, .88, .5],
] as const;

const SCORE_DIGIT_SEGMENTS: Readonly<Record<string, readonly number[]>> = {
  '0': [0, 1, 2, 3, 4, 5],
  '1': [1, 2],
  '2': [0, 1, 6, 4, 3],
  '3': [0, 1, 6, 2, 3],
  '4': [5, 6, 1, 2],
  '5': [0, 5, 6, 2, 3],
  '6': [0, 5, 6, 4, 2, 3],
  '7': [0, 1, 2],
  '8': [0, 1, 2, 3, 4, 5, 6],
  '9': [0, 1, 2, 3, 5, 6],
};

export class TetrisRenderer {
  private app: Application | null = null;
  private host: HTMLElement | null = null;
  private readonly world = new Container();
  private readonly boardGraphics = new Graphics();
  private readonly pieceGraphics = new Graphics();
  private readonly effectGraphics = new Graphics();
  /** Second and final visual-only effect plane, reserved for Mutation VFX. */
  private readonly mutationGraphics = new Graphics();
  /** Board-local clip: transient Mutation fragments must never obscure the HUD rail. */
  private readonly mutationMaskGraphics = new Graphics();
  /** Two renderer-lifetime Pixi filters; they are disabled instead of reallocated. */
  private frostFilter: NoiseFilter | null = null;
  private collapseFilter: DisplacementFilter | null = null;
  private collapseDisplacementMap: Sprite | null = null;
  private readonly mutationFilterState = { freeze: false, collapse: false };
  private readonly cellGradients = new Map<BoardMaterial, FillGradient>();
  private readonly overrideGradients = new Map<PieceMaterial, FillGradient>();

  private frameCallback: ((deltaMs: number) => void) | null = null;
  private presentation: PiecePresentation | null = null;
  private trail: TrailState | null = null;
  private lockPulse: LockPulse | null = null;
  private impact = 0;
  private rotationPulse = 0;
  private boardShift: BoardShift | null = null;
  private readonly classicFeedbackCues: ClassicFeedbackCue[] = [];
  private readonly survivalDebrisPresentation = new Map<number, SurvivalDebrisPresentation>();
  private readonly survivalStoneCues: SurvivalStoneCue[] = [];
  private mutationFlash: MutationFlash | null = null;
  private readonly mutationFlashQueue: MutationFlashRequest[] = [];
  private mutationArrival: MutationArrival | null = null;
  private activeMutationCarrierId: number | null = null;
  private collapseTrail: CollapseTrail | null = null;
  /**
   * Reused marker grid for Collapse settlement. A stamp avoids allocating Maps,
   * Sets, arrays, and sort work on a lock while still distinguishing the just-
   * locked cells from the immutable board snapshot.
   */
  private readonly collapseIncomingStamps = new Uint32Array(BOARD_WIDTH * BOARD_HEIGHT);
  private collapseIncomingStamp = 0;
  private readonly mutationFields = new Map<Exclude<MutationItem, 'bomb'>, MutationField>();
  private readonly mutationParticles: MutationParticle[] = Array.from(
    { length: MUTATION_PARTICLE_LIMIT },
    () => ({
      active: false,
      item: 'freeze',
      u: 0,
      v: 0,
      velocityU: 0,
      velocityV: 0,
      elapsed: 0,
      lifeMs: 1,
      size: 0,
      color: 0xffffff,
      rotation: 0,
      rotationVelocity: 0,
    }),
  );
  private particleCursor = 0;
  private particleSeed = 0x4d555441;
  private mutationClockMs = 0;
  private previousBoard: GameState['board'] | null = null;
  private collapseWasActive = false;
  private options: RenderOptions = { reducedMotion: false, modeSwitch: false };
  private previewBounds: RendererSnapshot['preview'] = null;
  private previewLayerVisible = false;
  private previewPiece: PieceType | null = null;
  private previewPieces: PieceType[] = [];
  private previewMutationItem: MutationItem | null = null;
  /** Avoid replaying the pure Core preview lookahead on every rendered frame. */
  private previewMutationQueueRef: GameState['queue'] | null = null;
  private previewMutationRandomizerRef: GameState['mutationRandomizer'] | null = null;
  private previewMutationPieceCount = -1;
  private previewMutationMode: GameState['mode'] | null = null;
  private previewMutationHasActive = false;
  private lastPreviewBounds: RendererSnapshot['preview'] = null;
  private lastPreviewPiece: PieceType | null = null;
  private previewClearBounds: RendererSnapshot['previewClearBounds'] = null;
  private previewClearPiece: PieceType | null = null;
  private scrimBounds: RendererSnapshot['scrim'] = null;
  private snapshot: Omit<
    RendererSnapshot,
    'classicFeedback'
    | 'mutationActivation'
    | 'mutationActivationQueueItems'
    | 'mutationActiveParticleCount'
    | 'mutationCollapseTrail'
  > = {
    canvas: { width: 0, height: 0, resolution: 1 },
    board: { x: 0, y: 0, width: 0, height: 0, cell: 0 },
    preview: null,
    previewLayerVisible: false,
    previewPiece: null,
    previewPieces: [],
    previewMutationItem: null,
    previewClearBounds: null,
    previewClearPiece: null,
    scrim: null,
    activeCells: [],
    ghostCells: [],
    visibleLockedCells: 0,
    presentation: null,
    boardShiftOffsetY: 0,
    mutationFilters: { freeze: false, collapse: false, activeCount: 0 },
    survivalDebris: [],
    survivalDebrisWarningColumns: [],
    survivalStoneCueCount: 0,
  };

  async init(host: HTMLElement): Promise<void> {
    this.host = host;
    const app = new Application();
    await app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preference: 'webgl',
    });
    app.canvas.dataset.testid = 'game-canvas';
    app.canvas.setAttribute('aria-label', 'TetraMorph 10 × 20 游戏棋盘');
    app.canvas.setAttribute('role', 'img');
    app.canvas.tabIndex = 0;
    host.appendChild(app.canvas);
    this.mutationGraphics.mask = this.mutationMaskGraphics;
    this.world.addChild(
      this.boardGraphics,
      this.pieceGraphics,
      this.effectGraphics,
      this.mutationGraphics,
      this.mutationMaskGraphics,
    );
    this.initializeMutationFilters();
    app.stage.addChild(this.world);
    app.ticker.add(this.onTick);
    this.app = app;
  }

  setFrameCallback(callback: (deltaMs: number) => void): void {
    this.frameCallback = callback;
  }

  setOptions(options: Partial<RenderOptions>): void {
    this.options = { ...this.options, ...options };
    if (this.options.reducedMotion) {
      this.presentation = null;
      this.trail = null;
      this.lockPulse = null;
      this.impact = 0;
      this.rotationPulse = 0;
      this.boardShift = null;
      this.mutationArrival = null;
      // Keep the authoritative Mutation FIFO, timed fields, Collapse endpoint,
      // previous board, and active carrier identity. A runtime preference switch
      // simplifies motion but must never discard an activation that Core emitted.
      this.clearMutationParticles();
      this.resetMutationFilters();
      this.setWorldOffset(0, 0);
    }
  }

  render(state: GameState, events: readonly GameEvent[], deltaMs: number): void {
    const app = this.app;
    if (!app) return;
    this.consumeEvents(events, state, this.previousBoard, this.collapseWasActive);
    this.syncMutationFields(state);
    this.advanceEffects(deltaMs);
    this.advanceSurvivalDebrisPresentation(state, deltaMs);
    this.advancePresentation(state, deltaMs);
    const layout = this.calculateLayout(app.screen.width, app.screen.height, state.status === 'ready');
    this.syncMutationFilters(state, layout);
    this.applyMutationCameraShake(layout);
    this.drawBoard(state, layout);
    this.drawPieces(state, layout);
    this.drawEffects(state, layout);
    this.drawPreviews(state, layout);
    this.updateSnapshot(state, layout, app);
    this.previousBoard = state.board;
    this.collapseWasActive = state.mode === 'sprint' && state.mutationCollapseTicks > 0;
  }

  getSnapshot(): RendererSnapshot {
    let activeParticleCount = 0;
    for (const particle of this.mutationParticles) {
      if (particle.active) activeParticleCount += 1;
    }
    return structuredClone({
      ...this.snapshot,
      classicFeedback: this.classicFeedbackCues.map((cue) => ({
        kind: cue.kind,
        elapsedMs: cue.elapsed,
        durationMs: cue.duration,
        cells: cue.cells.map((cell) => ({ ...cell })),
        rows: [...cue.rows],
        combo: cue.combo,
        tier: cue.tier,
      })),
      mutationActivation: this.mutationFlash
        ? {
            item: this.mutationFlash.item,
            elapsedMs: this.mutationFlash.elapsed,
            durationMs: this.mutationFlash.duration,
            phases: this.mutationFlash.timeline.samples(),
            particlesEmitted: this.mutationFlash.particlesEmitted,
            triggerColumns: [...this.mutationFlash.triggerColumns],
          }
        : null,
      mutationActivationQueueItems: this.mutationFlashQueue.map((request) => request.item),
      mutationActiveParticleCount: activeParticleCount,
      mutationCollapseTrail: this.collapseTrail
        ? {
            columns: [...this.collapseTrail.columns],
            maxDrop: this.collapseTrail.maxDrop,
            elapsedMs: this.collapseTrail.elapsed,
            durationMs: this.collapseTrail.duration,
          }
        : null,
    });
  }

  /**
   * DEV-QA evidence export. Pixi rerenders the current stage into an unmounted
   * Canvas because the presented WebGL back buffer is intentionally not retained.
   * No Core, ticker, timeline, display-tree, or DOM state is changed.
   */
  captureBoardPng(): RendererBoardCapture {
    const app = this.app;
    if (!app) throw new Error('Renderer board capture requires a mounted renderer.');
    const frame = this.snapshot.board;
    if (frame.width <= 0 || frame.height <= 0) {
      throw new Error('Renderer board capture requires non-empty board geometry.');
    }
    const extracted = app.renderer.extract.canvas({
      target: app.stage,
      frame: new Rectangle(frame.x, frame.y, frame.width, frame.height),
      resolution: app.renderer.resolution,
      clearColor: COLORS.well,
      antialias: true,
    });
    if (!('toDataURL' in extracted)) {
      throw new Error('Renderer board capture requires an HTML Canvas export.');
    }
    const canvas = extracted as HTMLCanvasElement;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Renderer board capture cannot read extracted pixels.');
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const pixelCount = canvas.width * canvas.height;
    const stride = Math.max(1, Math.floor(pixelCount / 8192));
    const buckets = new Set<string>();
    let samples = 0;
    let nonTransparentSamples = 0;
    for (let pixel = 0; pixel < pixelCount; pixel += stride) {
      const offset = pixel * 4;
      const alpha = pixels[offset + 3] ?? 0;
      samples += 1;
      if (alpha > 0) nonTransparentSamples += 1;
      buckets.add(
        `${(pixels[offset] ?? 0) >> 4}:${(pixels[offset + 1] ?? 0) >> 4}:`
        + `${(pixels[offset + 2] ?? 0) >> 4}:${alpha >> 4}`,
      );
    }
    return {
      dataUrl: canvas.toDataURL('image/png'),
      frame: {
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: frame.height,
      },
      resolution: app.renderer.resolution,
      outputPixels: { width: canvas.width, height: canvas.height },
      pixelProbe: {
        samples,
        nonTransparentSamples,
        distinctBuckets: buckets.size,
      },
    };
  }

  benchmark(state: GameState, iterations = 120): { meanMs: number; p95Ms: number; maxMs: number } {
    const samples: number[] = [];
    const count = Math.max(1, Math.min(500, Math.floor(iterations)));
    for (let index = 0; index < count; index += 1) {
      const start = performance.now();
      this.render(state, [], 0);
      samples.push(performance.now() - start);
    }
    samples.sort((left, right) => left - right);
    const meanMs = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    return {
      meanMs,
      p95Ms: samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))] ?? 0,
      maxMs: samples.at(-1) ?? 0,
    };
  }

  destroy(): void {
    if (!this.app) return;
    this.app.ticker.remove(this.onTick);
    this.frameCallback = null;
    this.destroyMutationFilters();
    for (const gradient of this.cellGradients.values()) gradient.destroy();
    this.cellGradients.clear();
    for (const gradient of this.overrideGradients.values()) gradient.destroy();
    this.overrideGradients.clear();
    this.app.destroy({ removeView: true }, { children: true });
    this.app = null;
    this.host = null;
    this.presentation = null;
    this.lockPulse = null;
    this.classicFeedbackCues.length = 0;
    this.mutationFlash = null;
    this.mutationArrival = null;
    this.activeMutationCarrierId = null;
    this.collapseTrail = null;
    this.clearSurvivalVisualState();
    this.clearMutationVisualState();
    this.previousBoard = null;
    this.collapseWasActive = false;
  }

  private readonly onTick = (ticker: Ticker): void => {
    this.frameCallback?.(Math.min(ticker.deltaMS, 100));
  };

  private calculateLayout(width: number, height: number, ready: boolean): BoardLayout {
    const hostBounds = this.host?.getBoundingClientRect();
    const boardElement = document.querySelector<HTMLElement>('[data-testid="board-frame"]');
    const requestedBounds = boardElement?.getBoundingClientRect();
    if (hostBounds && requestedBounds && requestedBounds.width > 0 && requestedBounds.height > 0) {
      const boardWidth = requestedBounds.width;
      return {
        x: requestedBounds.left - hostBounds.left,
        y: requestedBounds.top - hostBounds.top,
        width: boardWidth,
        height: requestedBounds.height,
        cell: boardWidth / BOARD_WIDTH,
        compact: requestedBounds.width <= 260,
      };
    }
    const compact = width < 620 && height > width * 1.05;
    const topBand = compact && !ready ? Math.min(96, height * 0.19) : 0;
    const horizontalAllowance = compact ? 18 : Math.min(260, width * 0.34);
    const cell = Math.max(8, Math.min((height - topBand - 24) / VISIBLE_HEIGHT, (width - horizontalAllowance) / BOARD_WIDTH));
    const boardWidth = cell * BOARD_WIDTH;
    const boardHeight = cell * VISIBLE_HEIGHT;
    return {
      x: compact
        ? (width - boardWidth) / 2
        : Math.max(0, (width - boardWidth) / 2 - Math.min(130, width * 0.14)),
      y: compact ? topBand + (height - topBand - boardHeight) / 2 : (height - boardHeight) / 2,
      width: boardWidth,
      height: boardHeight,
      cell,
      compact,
    };
  }

  private drawBoard(state: GameState, layout: BoardLayout): void {
    const graphics = this.boardGraphics;
    graphics.clear();
    const radius = Math.max(8, Math.min(12, layout.cell * 0.38));
    const mutationWell = state.mode === 'sprint';
    graphics
      .roundRect(layout.x, layout.y, layout.width, layout.height, radius)
      .fill({ color: mutationWell ? MUTATION_VFX_BACKGROUND.well : COLORS.well, alpha: 1 })
      .stroke({
        color: mutationWell ? MUTATION_VFX_BACKGROUND.support : COLORS.edge,
        alpha: .9,
        width: Math.max(1, layout.cell * 0.035),
      });
    if (mutationWell) {
      const inset = Math.max(3, layout.cell * 0.18);
      graphics
        .roundRect(
          layout.x + inset,
          layout.y + inset,
          layout.width - inset * 2,
          layout.height - inset * 2,
          Math.max(5, layout.cell * 0.2),
        )
        .stroke({ color: MUTATION_VFX_BACKGROUND.support, alpha: 0.28, width: Math.max(1, layout.cell * 0.026) });
    }
    this.scrimBounds = null;
    if (state.status === 'paused' || state.status === 'game-over' || state.status === 'finished' || this.options.modeSwitch) {
      const alpha = state.status === 'paused' ? 0.22 : this.options.modeSwitch ? 0.38 : 0.16;
      graphics.roundRect(layout.x, layout.y, layout.width, layout.height, radius).fill({ color: COLORS.scrim, alpha });
      this.scrimBounds = { x: layout.x, y: layout.y, width: layout.width, height: layout.height };
    }
  }

  private drawPieces(state: GameState, layout: BoardLayout): void {
    const graphics = this.pieceGraphics;
    graphics.clear();
    this.syncMutationArrival(state);
    let visibleLockedCells = 0;
    const lockedByMaterial = new Map<BoardMaterial, Cell[]>();
    const ordinaryClearCells: OrdinaryClearCell[] = [];
    const ordinaryClearRows = state.phase === 'line-clear'
      ? new Set(state.pendingClearRows)
      : null;
    const boardShiftOffsetY = this.boardShift && !this.options.reducedMotion
      ? boardShiftPresentationOffset(
          this.boardShift.direction,
          this.boardShift.elapsed,
          this.boardShift.duration,
          layout.cell,
        )
      : 0;

    state.board.forEach((row, boardY) => {
      if (boardY < VISIBLE_START_ROW) return;
      row.forEach((cell, x) => {
        if (!cell) return;
        visibleLockedCells += 1;
        if (ordinaryClearRows?.has(boardY)) {
          ordinaryClearCells.push({ x, y: boardY - VISIBLE_START_ROW, material: cell });
          return;
        }
        const cells = lockedByMaterial.get(cell) ?? [];
        cells.push({ x, y: boardY - VISIBLE_START_ROW });
        lockedByMaterial.set(cell, cells);
      });
    });
    for (const [type, cells] of lockedByMaterial) {
      this.drawCellGroups(graphics, cells, type, 1, {
        originX: layout.x,
        originY: layout.y,
        unit: layout.cell,
        offsetY: boardShiftOffsetY,
      });
    }
    this.drawOrdinaryLineClearCells(
      graphics,
      ordinaryClearCells,
      state,
      layout,
      boardShiftOffsetY,
    );
    if (state.mode === 'race') {
      for (const stone of state.survivalDebris) {
        const presented = this.survivalDebrisPresentation.get(stone.id) ?? stone;
        if (presented.y < VISIBLE_START_ROW - 1 || presented.y >= VISIBLE_START_ROW + VISIBLE_HEIGHT) continue;
        this.drawCellGroups(
          graphics,
          [{ x: stone.x, y: stone.y - VISIBLE_START_ROW }],
          SURVIVAL_STONE_CELL,
          1,
          {
            originX: layout.x,
            originY: layout.y,
            unit: layout.cell,
            offsetY: boardShiftOffsetY + (presented.y - stone.y) * layout.cell,
          },
        );
      }
    }
    this.drawPuzzleTargetMarkers(graphics, state, layout, boardShiftOffsetY);
    this.drawMutationCarrierMaterials(graphics, state, layout, boardShiftOffsetY);

    if (this.trail && !this.options.reducedMotion) {
      const progress = Math.min(1, this.trail.elapsed / this.trail.duration);
      const echoCount = Math.min(6, Math.max(1, this.trail.distance));
      for (let echo = 1; echo <= echoCount; echo += 1) {
        const alpha = (1 - progress) * (0.16 / echo);
        const cells = this.trail.cells
          .map((cell) => ({ x: cell.x, y: cell.y - VISIBLE_START_ROW }))
          .filter((cell) => cell.y >= 0);
        this.drawCellGroups(graphics, cells, this.trail.piece, alpha, {
          originX: layout.x,
          originY: layout.y,
          unit: layout.cell,
          offsetY: -echo * Math.max(1, Math.floor(this.trail.distance / echoCount)) * layout.cell,
        });
      }
    }

    const activeCells = state.status === 'ready' || !state.active ? [] : cellsForPiece(state.active);
    const ghostCells = state.active
      ? activeCells.map((cell) => ({ x: cell.x, y: cell.y + dropDistance(state) }))
      : [];
    if (state.status === 'ready' && state.active) {
      ghostCells.splice(0, ghostCells.length, ...cellsForPiece(state.active).map((cell) => ({ x: cell.x, y: cell.y + dropDistance(state) })));
    }

    const visibleGhostCells = ghostCells
      .filter((cell) => cell.y >= VISIBLE_START_ROW && cell.y < VISIBLE_START_ROW + VISIBLE_HEIGHT)
      .map((cell) => ({ x: cell.x, y: cell.y - VISIBLE_START_ROW }));
    const ghostOffsetX = this.presentation && state.active
      ? (this.presentation.x - state.active.x) * layout.cell
      : 0;
    if (state.active) {
      this.drawCellGroups(graphics, visibleGhostCells, state.active.type, 0.82, {
        originX: layout.x,
        originY: layout.y,
        unit: layout.cell,
        offsetX: ghostOffsetX,
        ghost: true,
      });
    }

    const offsetX = this.presentation && state.active && !this.options.reducedMotion
      ? (this.presentation.x - state.active.x) * layout.cell
      : 0;
    const rawOffsetY = this.presentation && state.active && !this.options.reducedMotion
      ? (this.presentation.y - state.active.y) * layout.cell
      : 0;
    const visibleActiveCells = activeCellsInsideVisibleRows(activeCells, VISIBLE_START_ROW, VISIBLE_HEIGHT)
      .map((cell) => ({ x: cell.x, y: cell.y - VISIBLE_START_ROW }));
    const offsetY = clampActivePresentationOffsetY(rawOffsetY, visibleActiveCells, layout.cell, VISIBLE_HEIGHT);
    const requestedRotationScale = this.options.reducedMotion ? 1 : 1 + this.rotationPulse * 0.035;
    const rotationScale = activePresentationScaleFitsVisibleWell(
      visibleActiveCells,
      offsetY,
      layout.cell,
      VISIBLE_HEIGHT,
      requestedRotationScale,
    )
      ? requestedRotationScale
      : 1;
    if (state.active) {
      this.drawCellGroups(
        graphics,
        visibleActiveCells,
        state.active.type,
        1,
        {
          originX: layout.x,
          originY: layout.y,
          unit: layout.cell,
          offsetX,
          offsetY,
          active: true,
          scale: rotationScale,
        },
      );
      this.drawActiveMutationCarrierMaterial(graphics, state, visibleActiveCells, layout, offsetX, offsetY);
      this.drawMutationCarrierEdgePulse(
        graphics,
        visibleActiveCells,
        state.mutationActiveCarrier?.item ?? null,
        layout,
        offsetX,
        offsetY,
      );
    }

    this.snapshot.visibleLockedCells = visibleLockedCells;
    this.snapshot.boardShiftOffsetY = boardShiftOffsetY;
    this.pieceGraphics.alpha = this.options.modeSwitch ? 0.34 : 1;
    this.effectGraphics.alpha = this.options.modeSwitch ? 0.2 : 1;
    this.mutationGraphics.alpha = this.options.modeSwitch ? 0.2 : 1;
  }

  private drawPuzzleTargetMarkers(graphics: Graphics, state: GameState, layout: BoardLayout, offsetY: number): void {
    if (state.mode !== 'puzzle' || state.puzzleTargetCells.length === 0) return;
    const inset = Math.max(2, layout.cell * 0.19);
    const bracket = Math.max(5, layout.cell * 0.36);
    const stroke = Math.max(1, layout.cell * 0.038);
    for (const cell of state.puzzleTargetCells) {
      if (cell.y < VISIBLE_START_ROW || cell.y >= VISIBLE_START_ROW + VISIBLE_HEIGHT) continue;
      if (state.phase === 'line-clear' && state.pendingClearRows.includes(cell.y)) continue;
      const material = state.board[cell.y]?.[cell.x];
      if (!material || material === ANCHOR_CELL || material === BEDROCK_CELL) continue;
      const x = layout.x + cell.x * layout.cell + inset;
      const y = layout.y + (cell.y - VISIBLE_START_ROW) * layout.cell + inset + offsetY;
      graphics.moveTo(x + bracket, y)
        .lineTo(x, y)
        .lineTo(x, y + bracket)
        .stroke({ color: COLORS.target, alpha: 0.76, width: stroke });
    }
  }

  private mutationMaterial(item: MutationItem): PieceMaterial {
    return MUTATION_MATERIALS[item];
  }

  private syncMutationArrival(state: GameState): void {
    const carrierId = state.mode === 'sprint' && state.active && state.mutationActiveCarrier
      ? state.mutationActiveCarrier.id
      : null;
    if (carrierId === this.activeMutationCarrierId) return;
    this.activeMutationCarrierId = carrierId;
    this.mutationArrival = carrierId === null || this.options.reducedMotion
      ? null
      : { carrierId, elapsed: 0, duration: 150 };
  }

  private drawMutationCarrierMaterials(graphics: Graphics, state: GameState, layout: BoardLayout, offsetY: number): void {
    if (state.mode !== 'sprint') return;
    for (const carrier of state.mutationCarriers) {
      const cells = carrier.cells
        .filter((cell) => (
          cell.y >= VISIBLE_START_ROW
          && cell.y < VISIBLE_START_ROW + VISIBLE_HEIGHT
          && !(state.phase === 'line-clear' && state.pendingClearRows.includes(cell.y))
        ))
        .map((cell) => ({ x: cell.x, y: cell.y - VISIBLE_START_ROW }));
      if (cells.length === 0) continue;
      this.drawMutationCarrierSurface(graphics, cells, carrier.item, layout, 0, offsetY);
      this.drawMutationCarrierCore(graphics, cells, carrier.item, layout, 0, offsetY);
    }
  }

  private drawOrdinaryLineClearCells(
    graphics: Graphics,
    cells: readonly OrdinaryClearCell[],
    state: GameState,
    layout: BoardLayout,
    offsetY: number,
  ): void {
    if (state.phase !== 'line-clear' || cells.length === 0) return;
    const frame = ordinaryLineClearFrame(state.phaseTicks, this.options.reducedMotion);
    const strength = ordinaryLineClearStrength(state.pendingClearRows.length);
    const rowCenter = BOARD_WIDTH / 2;

    for (const cell of cells) {
      const contraction = lineClearCellProgress(frame.contraction, cell.x, BOARD_WIDTH);
      const dissolve = lineClearCellProgress(frame.dissolve, cell.x, BOARD_WIDTH);
      const direction = Math.sign(rowCenter - (cell.x + 0.5));
      const offsetX = direction * strength.contractionCells * layout.cell * contraction;
      const scale = 1 - contraction * 0.31;
      const alpha = Math.max(0.12, 1 - dissolve * 0.88);
      this.drawCellGroups(graphics, [cell], cell.material, alpha, {
        originX: layout.x,
        originY: layout.y,
        unit: layout.cell,
        offsetX,
        offsetY,
        scale,
      });
    }
  }

  private drawActiveMutationCarrierMaterial(
    graphics: Graphics,
    state: GameState,
    cells: readonly Cell[],
    layout: BoardLayout,
    offsetX: number,
    offsetY: number,
  ): void {
    if (state.mode !== 'sprint' || !state.active || !state.mutationActiveCarrier) return;
    this.drawMutationCarrierSurface(graphics, cells, state.mutationActiveCarrier.item, layout, offsetX, offsetY);
    this.drawMutationCarrierCore(graphics, cells, state.mutationActiveCarrier.item, layout, offsetX, offsetY);
  }

  /** Fine material detail differentiates an item carrier even before it clears. */
  private drawMutationCarrierSurface(
    graphics: Graphics,
    cells: readonly Cell[],
    item: MutationItem,
    layout: BoardLayout,
    offsetX = 0,
    offsetY = 0,
  ): void {
    const token = MUTATION_VFX_TOKENS[item];
    const pulse = this.options.reducedMotion ? 1 : .72 + Math.sin(this.mutationClockMs / token.animation.pulseMs * Math.PI * 2) * .16;
    const inset = Math.max(1, layout.cell * .22);
    const mark = Math.max(1.5, layout.cell * .11);
    for (const cell of cells) {
      const x = layout.x + cell.x * layout.cell + offsetX;
      const y = layout.y + cell.y * layout.cell + offsetY;
      const centerX = x + layout.cell / 2;
      const centerY = y + layout.cell / 2;
      if (item === 'freeze') {
        graphics
          .moveTo(x + inset, y + inset)
          .lineTo(x + layout.cell - inset, y + inset)
          .lineTo(x + layout.cell - inset * 1.7, y + layout.cell - inset * 1.5)
          .lineTo(x + inset * 1.5, y + layout.cell - inset * .8)
          .lineTo(x + inset, y + inset)
          .fill({ color: token.palette.highlight, alpha: .16 * pulse });
        this.strokeSegments(graphics, [
          [x + inset, y + inset, x + layout.cell - inset * 1.35, y + layout.cell - inset * 1.35],
          [x + layout.cell - inset, y + inset * 1.4, x + inset * 1.4, y + layout.cell - inset],
        ], token.palette.highlight, .36 * pulse, Math.max(1, mark * .36));
      } else if (item === 'collapse') {
        graphics
          .roundRect(centerX - mark * .36, y + inset, mark * .72, layout.cell - inset * 2, mark * .32)
          .fill({ color: token.palette.deep, alpha: .38 })
          .roundRect(centerX - mark * .16, y + inset * 1.45, mark * .32, layout.cell - inset * 3, mark * .16)
          .fill({ color: token.palette.highlight, alpha: .46 * pulse });
      } else if (item === 'bomb') {
        graphics
          .circle(centerX, centerY, mark * .78)
          .fill({ color: token.palette.deep, alpha: .5 })
          .circle(centerX - mark * .18, centerY - mark * .18, mark * .26)
          .fill({ color: token.palette.highlight, alpha: .78 * pulse });
      } else {
        this.drawMutationDiamond(graphics, centerX, centerY, mark * .8, mark * .8, token.palette.highlight, .5 * pulse);
        this.strokeSegments(graphics, [
          [centerX - mark * 1.15, centerY, centerX + mark * 1.15, centerY],
          [centerX, centerY - mark * 1.15, centerX, centerY + mark * 1.15],
        ], token.palette.primary, .46 * pulse, Math.max(1, mark * .32));
      }
    }
  }

  /**
   * Mutation carriers get a single material core per contiguous carrier, not a
   * repeated snowflake, arrow, star, or other white glyph in every cell. The
   * surrounding saturated rim remains readable on a moving tetromino.
   */
  private drawMutationCarrierCore(
    graphics: Graphics,
    cells: readonly Cell[],
    item: MutationItem,
    layout: BoardLayout,
    offsetX = 0,
    offsetY = 0,
  ): void {
    if (cells.length === 0) return;
    const material = this.mutationMaterial(item);
    for (const component of orthogonalCellComponents(cells)) {
      const minX = Math.min(...component.map((cell) => cell.x));
      const maxX = Math.max(...component.map((cell) => cell.x));
      const minY = Math.min(...component.map((cell) => cell.y));
      const maxY = Math.max(...component.map((cell) => cell.y));
      const centerX = layout.x + ((minX + maxX + 1) * layout.cell) / 2 + offsetX;
      const centerY = layout.y + ((minY + maxY + 1) * layout.cell) / 2 + offsetY;
      const freezeBreath = item === 'freeze' && !this.options.reducedMotion
        ? 1 + .04 * (.5 - .5 * Math.cos(this.mutationClockMs / MUTATION_VFX_TOKENS.freeze.animation.pulseMs * Math.PI * 2))
        : 1;
      const radius = Math.max(3, layout.cell * 0.19) * freezeBreath;
      if (item === 'freeze') {
        this.drawMutationDiamond(graphics, centerX, centerY, radius * 1.18, radius * 1.54, material.edge, 0.92);
        this.drawMutationDiamond(graphics, centerX, centerY, radius * 0.7, radius, material.innerEdge, 0.94);
        this.strokeSegments(graphics, [
          [centerX - radius * 1.48, centerY, centerX + radius * 1.48, centerY],
          [centerX, centerY - radius * 1.36, centerX, centerY + radius * 1.36],
        ], material.fillStart, 0.9, Math.max(1, radius * 0.28));
      } else if (item === 'collapse') {
        const weightWidth = radius * 2.65;
        const weightHeight = radius * 0.62;
        graphics
          .roundRect(centerX - weightWidth / 2, centerY - radius * 1.2, weightWidth, weightHeight, radius * 0.22)
          .fill({ color: material.edge, alpha: 0.94 })
          .roundRect(centerX - weightWidth * 0.38, centerY - radius * 0.5, weightWidth * 0.76, weightHeight, radius * 0.22)
          .fill({ color: material.fillStart, alpha: 0.92 })
          .circle(centerX, centerY + radius * 0.7, radius * 0.54)
          .fill({ color: material.edge, alpha: 0.96 })
          .circle(centerX, centerY + radius * 0.7, radius * 0.26)
          .fill({ color: material.innerEdge, alpha: 0.9 });
        this.strokeSegments(graphics, [
          [centerX - radius * 1.3, centerY + radius * 1.36, centerX - radius * 0.78, centerY + radius * 2.02],
          [centerX, centerY + radius * 1.36, centerX, centerY + radius * 2.25],
          [centerX + radius * 1.3, centerY + radius * 1.36, centerX + radius * 0.78, centerY + radius * 2.02],
        ], material.innerEdge, 0.82, Math.max(1, radius * 0.2));
      } else if (item === 'bomb') {
        graphics
          .circle(centerX, centerY, radius * 1.28)
          .fill({ color: material.edge, alpha: 0.96 })
          .circle(centerX, centerY, radius * 0.89)
          .fill({ color: material.fillEnd, alpha: 0.98 })
          .circle(centerX, centerY, radius * 0.48)
          .fill({ color: material.fillStart, alpha: 0.96 })
          .circle(centerX - radius * 0.18, centerY - radius * 0.24, radius * 0.16)
          .fill({ color: material.innerEdge, alpha: 0.94 });
        this.strokeSegments(graphics, [
          [centerX, centerY - radius * 1.78, centerX + radius * 0.56, centerY - radius * 1.24],
          [centerX + radius * 1.46, centerY - radius * 0.4, centerX + radius * 1.92, centerY - radius * 0.66],
          [centerX - radius * 1.48, centerY + radius * 0.78, centerX - radius * 1.92, centerY + radius * 1.16],
        ], material.innerEdge, 0.92, Math.max(1, radius * 0.22));
      } else {
        graphics.circle(centerX, centerY, radius * 1.35).fill({ color: material.edge, alpha: 0.76 });
        this.drawMutationStar(graphics, centerX, centerY, radius * 1.25, radius * 0.52, material.innerEdge, 0.97);
        this.drawMutationStar(graphics, centerX, centerY, radius * 0.66, radius * 0.25, material.fillStart, 0.98);
      }
      this.drawMutationCarrierRim(graphics, component, item, layout, offsetX, offsetY, 0.64);
    }
  }

  private drawMutationDiamond(
    graphics: Graphics,
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number,
    color: number,
    alpha: number,
  ): void {
    graphics
      .moveTo(centerX, centerY - radiusY)
      .lineTo(centerX + radiusX, centerY)
      .lineTo(centerX, centerY + radiusY)
      .lineTo(centerX - radiusX, centerY)
      .lineTo(centerX, centerY - radiusY)
      .fill({ color, alpha });
  }

  private drawMutationStar(
    graphics: Graphics,
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number,
    color: number,
    alpha: number,
  ): void {
    const points = 8;
    for (let index = 0; index <= points; index += 1) {
      const angle = -Math.PI / 2 + index * Math.PI / 4;
      const radius = index % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      if (index === 0) graphics.moveTo(x, y);
      else graphics.lineTo(x, y);
    }
    graphics.fill({ color, alpha });
  }

  private drawMutationCarrierRim(
    graphics: Graphics,
    cells: readonly Cell[],
    item: MutationItem,
    layout: BoardLayout,
    offsetX = 0,
    offsetY = 0,
    alpha = 1,
    width = Math.max(1, layout.cell * 0.056),
  ): void {
    if (cells.length === 0 || alpha <= 0) return;
    const inset = Math.max(1, layout.cell * 0.12);
    const material = this.mutationMaterial(item);
    const segments: Array<readonly [number, number, number, number]> = [];
    const accents: Array<readonly [number, number, number, number]> = [];
    const marks: Array<readonly [number, number]> = [];
    const pushBroken = (x1: number, y1: number, x2: number, y2: number): void => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      segments.push(
        [x1, y1, x1 + dx * .38, y1 + dy * .38],
        [x1 + dx * .62, y1 + dy * .62, x2, y2],
      );
    };
    for (const { cell, exposed } of exposedCellEdges(cells)) {
      const x = layout.x + cell.x * layout.cell + offsetX;
      const y = layout.y + cell.y * layout.cell + offsetY;
      const right = x + layout.cell;
      const bottom = y + layout.cell;
      const top: readonly [number, number, number, number] = [x + inset, y + inset, right - inset, y + inset];
      const rightEdge: readonly [number, number, number, number] = [right - inset, y + inset, right - inset, bottom - inset];
      const bottomEdge: readonly [number, number, number, number] = [right - inset, bottom - inset, x + inset, bottom - inset];
      const left: readonly [number, number, number, number] = [x + inset, bottom - inset, x + inset, y + inset];
      if (item === 'freeze') {
        if (exposed.top) pushBroken(...top);
        if (exposed.right) pushBroken(...rightEdge);
        if (exposed.bottom) pushBroken(...bottomEdge);
        if (exposed.left) pushBroken(...left);
        if (exposed.top && exposed.left) {
          accents.push([x + inset, y + inset * 1.9, x + inset * 1.9, y + inset]);
        }
        if (exposed.bottom && exposed.right) {
          accents.push([right - inset * 1.9, bottom - inset, right - inset, bottom - inset * 1.9]);
        }
      } else {
        if (exposed.top) segments.push(top);
        if (exposed.right) segments.push(rightEdge);
        if (exposed.bottom) segments.push(bottomEdge);
        if (exposed.left) segments.push(left);
      }
      if (item === 'collapse' && exposed.bottom) {
        const centerX = x + layout.cell / 2;
        const baseline = bottom - inset * .72;
        accents.push(
          [x + inset * 1.25, baseline, right - inset * 1.25, baseline],
          [centerX - layout.cell * .18, baseline + inset * .22, centerX, baseline + inset * .72],
          [centerX, baseline + inset * .72, centerX + layout.cell * .18, baseline + inset * .22],
        );
      } else if (item === 'bomb') {
        if (exposed.top) marks.push([x + layout.cell / 2, y + inset]);
        if (exposed.right) marks.push([right - inset, y + layout.cell / 2]);
        if (exposed.bottom) marks.push([x + layout.cell / 2, bottom - inset]);
        if (exposed.left) marks.push([x + inset, y + layout.cell / 2]);
      } else if (item === 'multiplier') {
        if (exposed.top) marks.push([x + layout.cell / 2, y + inset]);
        if (exposed.bottom) marks.push([x + layout.cell / 2, bottom - inset]);
        if (exposed.left && exposed.top) marks.push([x + inset, y + inset]);
        if (exposed.right && exposed.bottom) marks.push([right - inset, bottom - inset]);
      }
    }
    this.strokeSegments(
      graphics,
      segments,
      item === 'collapse' ? material.edge : material.fillStart,
      alpha,
      item === 'collapse' ? width * 1.18 : width,
    );
    if (accents.length > 0) {
      this.strokeSegments(graphics, accents, material.innerEdge, Math.min(1, alpha * 1.08), Math.max(1, width * .78));
    }
    if (item === 'bomb') {
      const radius = Math.max(1.1, layout.cell * .035);
      for (const [x, y] of marks) {
        graphics
          .circle(x, y, radius * 1.55)
          .fill({ color: material.edge, alpha: alpha * .82 })
          .circle(x, y, radius)
          .fill({ color: material.innerEdge, alpha });
      }
    } else if (item === 'multiplier') {
      const radius = Math.max(1.8, layout.cell * .075);
      for (const [x, y] of marks) {
        this.drawMutationDiamond(graphics, x, y, radius, radius, material.innerEdge, alpha * .9);
      }
    }
  }

  private drawMutationCarrierEdgePulse(
    graphics: Graphics,
    cells: readonly Cell[],
    item: MutationItem | null,
    layout: BoardLayout,
    offsetX: number,
    offsetY: number,
  ): void {
    if (!item || !this.mutationArrival || this.options.reducedMotion || cells.length === 0) return;
    const progress = Math.min(1, this.mutationArrival.elapsed / this.mutationArrival.duration);
    const alpha = 0.86 * (1 - easeOutCubic(progress));
    this.drawMutationCarrierRim(
      graphics,
      cells,
      item,
      layout,
      offsetX,
      offsetY,
      alpha,
      Math.max(1, layout.cell * 0.082),
    );
  }

  private drawCellGroups(
    graphics: Graphics,
    cells: readonly Cell[],
    type: BoardMaterial,
    alpha: number,
    options: GroupDrawOptions,
  ): void {
    for (const component of orthogonalCellComponents(cells)) {
      this.drawCellComponent(graphics, component, type, alpha, options);
    }
  }

  private materialFor(type: BoardMaterial) {
    if (type === ANCHOR_CELL) return ANCHOR_MATERIAL;
    if (type === BEDROCK_CELL) return BEDROCK_MATERIAL;
    if (type === SURVIVAL_STONE_CELL) return SURVIVAL_STONE_MATERIAL;
    return PIECE_MATERIALS[type];
  }

  private gradientFor(type: BoardMaterial, materialOverride?: PieceMaterial): FillGradient {
    if (materialOverride) {
      const existingOverride = this.overrideGradients.get(materialOverride);
      if (existingOverride) return existingOverride;
      const gradient = this.createGradient(materialOverride);
      this.overrideGradients.set(materialOverride, gradient);
      return gradient;
    }
    const existing = this.cellGradients.get(type);
    if (existing) return existing;
    const gradient = this.createGradient(this.materialFor(type));
    this.cellGradients.set(type, gradient);
    return gradient;
  }

  private createGradient(material: PieceMaterial): FillGradient {
    const gradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
      textureSpace: 'local',
      colorStops: [
        { offset: 0, color: material.fillStart },
        { offset: 1, color: material.fillEnd },
      ],
    });
    return gradient;
  }

  private drawCellComponent(
    graphics: Graphics,
    cells: readonly Cell[],
    type: BoardMaterial,
    alpha: number,
    options: GroupDrawOptions,
  ): void {
    if (!cells.length) return;
    const scale = options.scale ?? 1;
    const offsetX = options.offsetX ?? 0;
    const offsetY = options.offsetY ?? 0;
    const minX = Math.min(...cells.map((cell) => cell.x));
    const maxX = Math.max(...cells.map((cell) => cell.x));
    const minY = Math.min(...cells.map((cell) => cell.y));
    const maxY = Math.max(...cells.map((cell) => cell.y));
    const centerX = options.originX + ((minX + maxX + 1) * options.unit) / 2;
    const centerY = options.originY + ((minY + maxY + 1) * options.unit) / 2;
    const scaledUnit = options.unit * scale;
    const baseGap = Math.max(CELL_STYLE.gapFloor, Math.min(CELL_STYLE.gapMin, options.unit * CELL_STYLE.gapRatio));
    const ghostInset = options.ghost
      ? Math.max(CELL_STYLE.ghostInsetMin, options.unit * CELL_STYLE.ghostInsetRatio)
      : 0;
    const gap = (baseGap + ghostInset) * scale;
    const size = scaledUnit - gap * 2;
    const material = options.material ?? this.materialFor(type);
    const radius = Math.max(CELL_STYLE.radiusMin, Math.min(CELL_STYLE.radiusMax, size * CELL_STYLE.radiusRatio));
    const borderWidth = Math.max(
      CELL_STYLE.edgeWidthMin,
      Math.min(CELL_STYLE.edgeWidthMax, size * CELL_STYLE.edgeWidthRatio),
    );
    const faceInset = Math.max(
      CELL_STYLE.faceInsetMin,
      Math.min(CELL_STYLE.faceInsetMax, size * CELL_STYLE.faceInsetRatio),
    );
    const faceBevelWidth = Math.max(
      CELL_STYLE.faceBevelWidthMin,
      Math.min(CELL_STYLE.faceBevelWidthMax, size * CELL_STYLE.faceBevelWidthRatio),
    );
    const seamGrooveWidth = Math.max(
      CELL_STYLE.seamGrooveWidthMin,
      Math.min(CELL_STYLE.seamGrooveWidthMax, size * CELL_STYLE.seamGrooveWidthRatio),
    );
    const seamLipWidth = Math.max(
      CELL_STYLE.seamLipWidthMin,
      Math.min(CELL_STYLE.seamLipWidthMax, size * CELL_STYLE.seamLipWidthRatio),
    );
    const occupied = new Set(cells.map((cell) => `${cell.x},${cell.y}`));
    const geometry = exposedCellEdges(cells).map(({ cell, exposed }) => {
      const baseX = options.originX + cell.x * options.unit;
      const baseY = options.originY + cell.y * options.unit;
      return {
        cell,
        exposed,
        x: centerX + (baseX - centerX) * scale + offsetX + gap,
        y: centerY + (baseY - centerY) * scale + offsetY + gap,
      };
    });

    if (!options.ghost) {
      for (const entry of geometry) graphics.roundRect(entry.x, entry.y, size, size, radius);
      for (const entry of geometry) {
        if (!entry.exposed.right) graphics.rect(entry.x + size, entry.y, gap * 2, size);
        if (!entry.exposed.bottom) graphics.rect(entry.x, entry.y + size, size, gap * 2);
        if (
          !entry.exposed.right
          && !entry.exposed.bottom
          && occupied.has(`${entry.cell.x + 1},${entry.cell.y + 1}`)
        ) {
          graphics.rect(entry.x + size, entry.y + size, gap * 2, gap * 2);
        }
      }
      if (options.faceColor === undefined) graphics.fill({ fill: this.gradientFor(type, options.material), alpha });
      else graphics.fill({ color: options.faceColor, alpha });
      if (options.faceColor !== undefined) return;

      const faceSignalSegments: Array<[number, number, number, number]> = [];
      const faceDarkSegments: Array<[number, number, number, number]> = [];
      for (const entry of geometry) {
        const left = entry.x + faceInset;
        const top = entry.y + faceInset;
        const right = entry.x + size - faceInset;
        const bottom = entry.y + size - faceInset;
        faceSignalSegments.push([left, top, right, top], [left, bottom, left, top]);
        faceDarkSegments.push([right, top, right, bottom], [right, bottom, left, bottom]);
      }
      this.strokeSegments(
        graphics,
        faceSignalSegments,
        material.innerEdge,
        Math.min(CELL_STYLE.faceSignalAlpha, alpha),
        faceBevelWidth,
      );
      this.strokeSegments(
        graphics,
        faceDarkSegments,
        material.edge,
        Math.min(CELL_STYLE.faceDarkAlpha, alpha),
        faceBevelWidth,
      );
      if (type === SURVIVAL_STONE_CELL) {
        this.drawStoneFacets(graphics, geometry, size, faceInset, material, alpha);
      }
    }

    const componentX = (x: number): number => (
      centerX + (options.originX + x * options.unit - centerX) * scale + offsetX
    );
    const componentY = (y: number): number => (
      centerY + (options.originY + y * options.unit - centerY) * scale + offsetY
    );
    const seamSegments = internalCellSeams(cells).map((seam) => {
      const startX = componentX(seam.start.x);
      const startY = componentY(seam.start.y);
      const endX = componentX(seam.end.x);
      const endY = componentY(seam.end.y);
      return seam.orientation === 'vertical'
        ? [startX, startY + gap, endX, endY - gap] as const
        : [startX + gap, startY, endX - gap, endY] as const;
    });
    const seamLipOffset = seamGrooveWidth * CELL_STYLE.seamLipOffsetRatio;

    const segments = new Map<CellEdge, Array<[number, number, number, number]>>([
      ['top', []], ['right', []], ['bottom', []], ['left', []],
    ]);
    for (const entry of geometry) {
      const left = entry.x;
      const top = entry.y;
      const right = entry.x + size;
      const bottom = entry.y + size;
      const corner = options.ghost ? 0 : radius * 0.55;
      if (entry.exposed.top) segments.get('top')!.push([
        left + (entry.exposed.left ? corner : -gap), top,
        right + (entry.exposed.right ? -corner : gap), top,
      ]);
      if (entry.exposed.right) segments.get('right')!.push([
        right, top + (entry.exposed.top ? corner : -gap),
        right, bottom + (entry.exposed.bottom ? -corner : gap),
      ]);
      if (entry.exposed.bottom) segments.get('bottom')!.push([
        right + (entry.exposed.right ? -corner : gap), bottom,
        left + (entry.exposed.left ? corner : -gap), bottom,
      ]);
      if (entry.exposed.left) segments.get('left')!.push([
        left, bottom + (entry.exposed.bottom ? -corner : gap),
        left, top + (entry.exposed.top ? corner : -gap),
      ]);
    }

    if (options.ghost) {
      this.strokeSegments(graphics, [...segments.values()].flat(), material.innerEdge,
        Math.min(CELL_STYLE.ghostStrokeAlpha, alpha), CELL_STYLE.ghostStrokeWidth);
      this.strokeSegments(
        graphics,
        seamSegments,
        material.innerEdge,
        Math.min(CELL_STYLE.ghostSeamAlpha, alpha),
        CELL_STYLE.ghostSeamWidth,
      );
    } else if (options.active) {
      this.strokeSegments(
        graphics,
        seamSegments,
        material.edge,
        Math.min(CELL_STYLE.seamGrooveAlpha, alpha),
        seamGrooveWidth,
      );
      this.strokeSegments(
        graphics,
        seamSegments.map(([startX, startY, endX, endY]) => (
          startX === endX
            ? [startX + seamLipOffset, startY, endX + seamLipOffset, endY] as const
            : [startX, startY + seamLipOffset, endX, endY + seamLipOffset] as const
        )),
        material.innerEdge,
        Math.min(CELL_STYLE.seamLipAlpha, alpha),
        seamLipWidth,
      );
      this.strokeSegments(graphics, [...segments.values()].flat(), material.innerEdge, Math.min(1, alpha), borderWidth);
    } else {
      this.strokeSegments(
        graphics,
        seamSegments,
        material.edge,
        Math.min(CELL_STYLE.seamGrooveAlpha, alpha),
        seamGrooveWidth,
      );
      this.strokeSegments(
        graphics,
        seamSegments.map(([startX, startY, endX, endY]) => (
          startX === endX
            ? [startX + seamLipOffset, startY, endX + seamLipOffset, endY] as const
            : [startX, startY + seamLipOffset, endX, endY + seamLipOffset] as const
        )),
        material.innerEdge,
        Math.min(CELL_STYLE.seamLipAlpha, alpha),
        seamLipWidth,
      );
      this.strokeSegments(graphics, [...segments.get('top')!, ...segments.get('left')!], material.innerEdge,
        Math.min(CELL_STYLE.reliefSignalAlpha, alpha), borderWidth);
      this.strokeSegments(graphics, [...segments.get('bottom')!, ...segments.get('right')!], material.edge,
        Math.min(CELL_STYLE.reliefDarkAlpha, alpha), borderWidth);
    }
  }

  /** Clearable falling debris stays simpler and lighter than permanent bedrock. */
  private drawStoneFacets(
    graphics: Graphics,
    cells: readonly { cell: Cell; x: number; y: number }[],
    size: number,
    inset: number,
    material: PieceMaterial,
    alpha: number,
  ): void {
    const crackWidth = Math.max(0.65, size * 0.042);
    const chip = Math.max(1.4, size * 0.16);
    for (const entry of cells) {
      const left = entry.x + inset * 1.5;
      const top = entry.y + inset * 1.5;
      const right = entry.x + size - inset * 1.5;
      const bottom = entry.y + size - inset * 1.5;
      const variant = Math.abs(entry.cell.x * 17 + entry.cell.y * 31) % 3;
      const middleX = left + (right - left) * (variant === 0 ? 0.44 : variant === 1 ? 0.58 : 0.5);
      const middleY = top + (bottom - top) * (variant === 0 ? 0.52 : variant === 1 ? 0.42 : 0.6);

      graphics
        .poly([
          right - chip, top,
          right, top,
          right, top + chip,
        ])
        .fill({ color: material.edge, alpha: Math.min(0.5, alpha * 0.64) });
      graphics
        .poly([
          left, bottom - chip,
          left + chip, bottom,
          left, bottom,
        ])
        .fill({ color: material.innerEdge, alpha: Math.min(0.22, alpha * 0.28) });
      this.strokeSegments(
        graphics,
        [
          [left, middleY, middleX, middleY + chip * 0.28],
          [middleX, middleY + chip * 0.28, right - chip * 0.48, bottom - chip * 0.56],
          [middleX, middleY + chip * 0.28, middleX - chip * 0.44, bottom - chip * 0.18],
        ],
        material.edge,
        Math.min(0.58, alpha * 0.7),
        crackWidth,
      );
    }
  }

  private strokeSegments(
    graphics: Graphics,
    segments: ReadonlyArray<readonly [number, number, number, number]>,
    color: number,
    alpha: number,
    width: number,
  ): void {
    if (!segments.length || alpha <= 0) return;
    for (const [startX, startY, endX, endY] of segments) {
      graphics.moveTo(startX, startY).lineTo(endX, endY);
    }
    graphics.stroke({ color, alpha, width });
  }

  private drawSurvivalPressureEffects(
    graphics: Graphics,
    state: GameState,
    layout: BoardLayout,
  ): void {
    if (state.mode !== 'race') return;

    const warningPulse = this.options.reducedMotion
      ? 1
      : 0.72 + Math.sin(this.mutationClockMs / 115) * 0.18;
    const warningColor = 0xe5b86a;
    for (const column of state.survivalDebrisWarningColumns) {
      const centerX = layout.x + (column + 0.5) * layout.cell;
      const top = layout.y + Math.max(2, layout.cell * 0.08);
      const markerWidth = layout.cell * 0.28;
      const markerBottom = top + layout.cell * 0.58;
      graphics
        .circle(centerX, top + layout.cell * 0.08, Math.max(2, layout.cell * 0.09))
        .fill({ color: warningColor, alpha: 0.18 * warningPulse });
      graphics
        .moveTo(centerX, top)
        .lineTo(centerX, markerBottom)
        .moveTo(centerX - markerWidth, markerBottom - markerWidth)
        .lineTo(centerX, markerBottom)
        .lineTo(centerX + markerWidth, markerBottom - markerWidth)
        .stroke({
          color: warningColor,
          alpha: 0.7 * warningPulse,
          width: Math.max(1.4, layout.cell * 0.065),
        });
    }

    for (const cue of this.survivalStoneCues) {
      const progress = Math.min(1, cue.elapsed / cue.duration);
      const eased = easeOutCubic(progress);
      const alpha = this.options.reducedMotion ? 0.58 : Math.max(0, 1 - eased);
      for (const cell of cue.cells) {
        const visibleY = cell.y - VISIBLE_START_ROW;
        if (visibleY < 0 || visibleY >= VISIBLE_HEIGHT) continue;
        const centerX = layout.x + (cell.x + 0.5) * layout.cell;
        const centerY = layout.y + (visibleY + 0.5) * layout.cell;
        if (cue.kind === 'spawn') {
          const radius = layout.cell * (this.options.reducedMotion ? 0.42 : 0.26 + eased * 0.34);
          graphics
            .circle(centerX, centerY, radius)
            .stroke({
              color: SURVIVAL_STONE_MATERIAL.innerEdge,
              alpha: alpha * 0.78,
              width: Math.max(1, layout.cell * 0.055),
            });
          if (!this.options.reducedMotion) {
            const streak = layout.cell * (0.28 + (1 - progress) * 0.28);
            graphics
              .moveTo(centerX - layout.cell * 0.2, centerY - streak)
              .lineTo(centerX - layout.cell * 0.2, centerY - layout.cell * 0.08)
              .moveTo(centerX + layout.cell * 0.2, centerY - streak * 0.82)
              .lineTo(centerX + layout.cell * 0.2, centerY - layout.cell * 0.08)
              .stroke({
                color: warningColor,
                alpha: alpha * 0.5,
                width: Math.max(1, layout.cell * 0.04),
              });
          }
        } else {
          const radius = layout.cell * (this.options.reducedMotion ? 0.44 : 0.2 + eased * 0.52);
          graphics
            .circle(centerX, centerY + layout.cell * 0.3, radius)
            .stroke({
              color: SURVIVAL_STONE_MATERIAL.edge,
              alpha: alpha * 0.72,
              width: Math.max(1.2, layout.cell * 0.065),
            });
          const dustOffset = layout.cell * (0.22 + eased * 0.26);
          graphics
            .circle(centerX - dustOffset, centerY + layout.cell * 0.34, Math.max(1.2, layout.cell * 0.07))
            .circle(centerX + dustOffset, centerY + layout.cell * 0.34, Math.max(1.2, layout.cell * 0.07))
            .fill({ color: SURVIVAL_STONE_MATERIAL.innerEdge, alpha: alpha * 0.36 });
        }
      }
    }
  }

  private drawEffects(state: GameState, layout: BoardLayout): void {
    const graphics = this.effectGraphics;
    const mutationGraphics = this.mutationGraphics;
    this.mutationMaskGraphics
      .clear()
      .rect(layout.x, layout.y, layout.width, layout.height)
      .fill({ color: 0xffffff, alpha: 1 });
    graphics.clear();
    mutationGraphics.clear();
    this.drawSurvivalPressureEffects(graphics, state, layout);
    this.drawActiveMutationAtmosphere(mutationGraphics, state, layout);
    if (this.mutationFlash) {
      this.drawMutationActivationEffect(mutationGraphics, this.mutationFlash, layout);
    }
    this.drawMutationParticles(mutationGraphics, layout);
    if (this.collapseTrail) {
      const progress = Math.min(1, this.collapseTrail.elapsed / this.collapseTrail.duration);
      this.drawCollapseSettlementTrail(mutationGraphics, this.collapseTrail, progress, layout);
    }
    this.drawOrdinaryLineClearEffects(graphics, state, layout);
    this.drawClassicFeedbackCues(graphics, state, layout);

    if (this.lockPulse && !this.options.reducedMotion) {
      const progress = Math.min(1, this.lockPulse.elapsed / this.lockPulse.duration);
      const material = PIECE_MATERIALS[this.lockPulse.piece];
      const alpha = (1 - easeOutCubic(progress)) * CELL_STYLE.lockFillAlpha;
      this.drawCellGroups(
        graphics,
        this.lockPulse.cells
          .filter((cell) => cell.y >= VISIBLE_START_ROW)
          .map((cell) => ({ x: cell.x, y: cell.y - VISIBLE_START_ROW })),
        this.lockPulse.piece,
        alpha,
        {
          originX: layout.x,
          originY: layout.y,
          unit: layout.cell,
          faceColor: material.innerEdge,
        },
      );
    }
  }

  private drawPreviews(state: GameState, layout: BoardLayout): void {
    const graphics = this.pieceGraphics;
    this.previewBounds = null;
    this.previewLayerVisible = false;
    this.previewPiece = null;
    this.previewPieces = [];
    this.previewMutationItem = this.resolvePreviewMutationItem(state);
    const hostBounds = this.host?.getBoundingClientRect();
    const slotElement = document.querySelector<HTMLElement>('[data-testid="next-slot"]');
    const slot = slotElement?.getBoundingClientRect();
    if (hostBounds && slot && slot.width > 0 && slot.height > 0) {
      const fallbackSlot: PreviewSlot = {
        x: slot.left - hostBounds.left,
        y: slot.top - hostBounds.top,
        width: slot.width,
        height: slot.height,
        labelInset: 0,
      };
      const segmentSlots = slotElement
        ? [...slotElement.querySelectorAll<HTMLElement>('[data-preview-segment]')]
          .map((segment): PreviewSlot | null => {
            const bounds = segment.getBoundingClientRect();
            if (bounds.width <= 0 || bounds.height <= 0) return null;
            return {
              x: bounds.left - hostBounds.left,
              y: bounds.top - hostBounds.top,
              width: bounds.width,
              height: bounds.height,
              labelInset: 0,
            };
          })
          .filter((segment): segment is PreviewSlot => segment !== null)
        : [];
      const previewSlots = segmentSlots.length ? segmentSlots : [fallbackSlot];
      // Puzzle has one ordinary Next well, divided into two numbered rows. The DOM
      // establishes those row bounds and uses the loaded JetBrains Mono numerals;
      // Pixi owns the shared well and pieces.
      const segmentedQueue = segmentSlots.length > 1;
      const segmentInset = segmentedQueue ? 0 : 1;
      if (segmentedQueue) {
        this.drawPreviewBackdrop(
          fallbackSlot.x + 1,
          fallbackSlot.y + 1,
          Math.max(8, fallbackSlot.width - 2),
          Math.max(8, fallbackSlot.height - 2),
          segmentSlots.length,
        );
      } else {
        for (const previewSlot of previewSlots) {
          this.drawPreviewBackdrop(
            previewSlot.x + segmentInset,
            previewSlot.y + segmentInset,
            Math.max(8, previewSlot.width - segmentInset * 2),
            Math.max(8, previewSlot.height - segmentInset * 2),
            1,
            previewSlot.labelInset,
          );
        }
      }
      if (state.status === 'ready' || state.status === 'finished' || state.status === 'game-over') {
        this.previewClearBounds = null;
        this.previewClearPiece = null;
        return;
      }
      if (this.options.modeSwitch) {
        // drawPieces clears its Graphics at the start of this same frame. Hiding the
        // preview and refusing fallback placement here prevents the old Pixi preview
        // from surviving after React removes the DOM slot for mode switching.
        this.previewClearBounds = this.lastPreviewBounds;
        this.previewClearPiece = this.lastPreviewPiece;
        return;
      }
      this.previewClearBounds = null;
      this.previewClearPiece = null;
      const previews = nextPreviewPieces(state);
      if (segmentSlots.length >= previews.length) {
        for (const [index, piece] of previews.entries()) {
          const previewSlot = segmentSlots[index];
          if (!previewSlot) continue;
          this.drawPreviewPieces(
            graphics,
            [piece],
            previewSlot.x + segmentInset,
            previewSlot.y + segmentInset,
            Math.max(8, previewSlot.width - segmentInset * 2),
            Math.max(8, previewSlot.height - segmentInset * 2),
            previewSlot.labelInset,
            index === 0 ? this.previewMutationItem : null,
          );
        }
      } else {
        this.drawPreviewPieces(
          graphics,
          previews,
          fallbackSlot.x,
          fallbackSlot.y,
          fallbackSlot.width,
          fallbackSlot.height,
          0,
          this.previewMutationItem,
        );
      }
      this.previewBounds = { x: fallbackSlot.x, y: fallbackSlot.y, width: fallbackSlot.width, height: fallbackSlot.height };
      this.previewLayerVisible = previews.length > 0;
      this.previewPieces = [...previews];
      this.previewPiece = previews[0] ?? null;
      this.lastPreviewBounds = this.previewBounds;
      this.lastPreviewPiece = this.previewPiece;
      return;
    }
    if (state.status === 'ready' || state.status === 'finished' || state.status === 'game-over') {
      this.previewClearBounds = null;
      this.previewClearPiece = null;
      return;
    }
    if (this.options.modeSwitch) {
      // drawPieces clears its Graphics at the start of this same frame. Hiding the
      // preview and refusing fallback placement here prevents the old Pixi preview
      // from surviving after React removes the DOM slot for mode switching.
      this.previewClearBounds = this.lastPreviewBounds;
      this.previewClearPiece = this.lastPreviewPiece;
      return;
    }
    this.previewClearBounds = null;
    this.previewClearPiece = null;
    const width = this.app?.screen.width ?? 0;
    if (layout.compact) {
      const topY = Math.max(7, layout.y - Math.min(92, layout.cell * 4.7));
      this.previewBounds = { x: layout.x, y: topY, width: layout.cell * 5, height: Math.max(42, layout.cell * 4) };
      const previews = nextPreviewPieces(state);
      this.drawPreviewPieces(
        graphics,
        previews,
        this.previewBounds.x,
        this.previewBounds.y,
        this.previewBounds.width,
        this.previewBounds.height,
        0,
        this.previewMutationItem,
      );
      this.previewLayerVisible = previews.length > 0;
      this.previewPieces = [...previews];
      this.previewPiece = previews[0] ?? null;
      this.lastPreviewBounds = this.previewBounds;
      this.lastPreviewPiece = this.previewPiece;
    } else {
      const sideWidth = Math.max(92, (width - layout.width) / 2 - 22);
      const leftX = Math.max(12, layout.x - sideWidth - 14);
      const cardWidth = Math.max(78, sideWidth);
      this.previewBounds = { x: leftX, y: layout.y, width: cardWidth, height: Math.max(52, layout.cell * 4) };
      const previews = nextPreviewPieces(state);
      this.drawPreviewPieces(
        graphics,
        previews,
        this.previewBounds.x,
        this.previewBounds.y,
        this.previewBounds.width,
        this.previewBounds.height,
        0,
        this.previewMutationItem,
      );
      this.previewLayerVisible = previews.length > 0;
      this.previewPieces = [...previews];
      this.previewPiece = previews[0] ?? null;
      this.lastPreviewBounds = this.previewBounds;
      this.lastPreviewPiece = this.previewPiece;
    }
  }

  private drawPreviewBackdrop(x: number, y: number, width: number, height: number, segments = 1, labelInset = 0): void {
    const captionInset = Math.min(labelInset, Math.max(0, height - 8));
    const contentY = y + captionInset;
    const contentHeight = Math.max(8, height - captionInset);
    const radius = Math.max(6, Math.min(8, Math.min(width, contentHeight) * 0.075));
    this.boardGraphics
      .roundRect(x, contentY, width, contentHeight, radius)
      .fill({ color: COLORS.well, alpha: 1 })
      .stroke({ color: COLORS.edge, alpha: 0.86, width: 1 });

    if (segments < 2) return;
    const dividerInset = Math.max(8, Math.min(14, width * 0.08));
    for (let index = 1; index < segments; index += 1) {
      const dividerY = contentY + contentHeight * index / segments;
      this.boardGraphics
        .moveTo(x + dividerInset, dividerY)
        .lineTo(x + width - dividerInset, dividerY)
        .stroke({ color: COLORS.edge, alpha: 0.42, width: 1 });
    }
  }

  private drawOrdinaryLineClearEffects(
    graphics: Graphics,
    state: GameState,
    layout: BoardLayout,
  ): void {
    if (state.phase !== 'line-clear' || state.pendingClearRows.length === 0) return;
    const frame = ordinaryLineClearFrame(state.phaseTicks, this.options.reducedMotion);
    const strength = ordinaryLineClearStrength(state.pendingClearRows.length);
    const color = state.mode === 'race'
      ? COLORS.race
      : state.mode === 'puzzle'
        ? COLORS.puzzle
        : state.mode === 'sprint'
          ? COLORS.selection
          : COLORS.classic;

    for (const row of state.pendingClearRows) {
      if (row < VISIBLE_START_ROW || row >= VISIBLE_START_ROW + VISIBLE_HEIGHT) continue;
      const centerY = layout.y + (row - VISIBLE_START_ROW + 0.5) * layout.cell;
      const lightWidth = layout.width * frame.confirmationSpan;
      const lightAlpha = Math.min(0.92, frame.confirmationAlpha * strength.alphaMultiplier);
      if (lightAlpha > 0) {
        graphics
          .rect(
            layout.x + (layout.width - lightWidth) / 2,
            centerY - layout.cell * 0.11,
            lightWidth,
            Math.max(1.5, layout.cell * 0.22),
          )
          .fill({ color, alpha: lightAlpha * 0.22 })
          .rect(
            layout.x + (layout.width - lightWidth) / 2,
            centerY - Math.max(0.75, layout.cell * 0.025),
            lightWidth,
            Math.max(1.5, layout.cell * 0.05),
          )
          .fill({ color, alpha: lightAlpha });
      }

      if (frame.afterglow <= 0 || this.options.reducedMotion) continue;
      const afterglowAlpha = Math.min(0.42, frame.afterglow * 0.34 * strength.alphaMultiplier);
      graphics
        .rect(
          layout.x + layout.width * 0.16,
          centerY - Math.max(0.5, layout.cell * 0.012),
          layout.width * 0.68,
          Math.max(1, layout.cell * 0.024),
        )
        .fill({ color, alpha: afterglowAlpha * 0.5 });

      for (let index = 0; index < strength.debrisPerRow; index += 1) {
        const lane = (index + 0.5) / strength.debrisPerRow;
        const x = layout.x + layout.width * (0.08 + lane * 0.84);
        const direction = index % 2 === 0 ? -1 : 1;
        const lift = layout.cell * (0.11 + (index % 3) * 0.035) * frame.afterglow;
        const size = Math.max(1.2, layout.cell * (0.027 + (index % 2) * 0.012));
        const y = centerY + direction * lift;
        graphics
          .circle(x, y, size)
          .fill({ color, alpha: afterglowAlpha * (index % 3 === 0 ? 0.92 : 0.66) });
        if (index % 2 === 0) {
          const shard = layout.cell * (0.07 + (index % 3) * 0.018);
          graphics
            .moveTo(x - shard, y + direction * shard * 0.28)
            .lineTo(x + shard, y - direction * shard * 0.28)
            .stroke({
              color,
              alpha: afterglowAlpha * 0.78,
              width: Math.max(1, layout.cell * 0.024),
            });
        }
      }
    }
  }

  private drawClassicFeedbackCues(
    graphics: Graphics,
    state: GameState,
    layout: BoardLayout,
  ): void {
    if (state.mode !== 'marathon' || this.classicFeedbackCues.length === 0) return;
    const stroke = Math.max(1.2, layout.cell * 0.055);

    for (const cue of this.classicFeedbackCues) {
      const progress = Math.min(1, Math.max(0, cue.elapsed / cue.duration));
      const eased = easeOutCubic(progress);
      const alpha = Math.max(0, 1 - eased);
      if (alpha <= 0) continue;

      if (cue.kind === 'landing') {
        const landingAlpha = Math.max(0, 1 - progress);
        const spread = layout.cell * (
          this.options.reducedMotion ? 0.3 : 0.2 + eased * 0.22
        );
        const gap = layout.cell * 0.08;
        for (const cell of cue.cells) {
          if (cue.cells.some((candidate) => candidate.x === cell.x && candidate.y === cell.y + 1)) continue;
          const visibleY = cell.y - VISIBLE_START_ROW;
          if (visibleY < 0 || visibleY >= VISIBLE_HEIGHT) continue;
          const centerX = layout.x + (cell.x + 0.5) * layout.cell;
          const rawY = layout.y + (visibleY + 1) * layout.cell - layout.cell * 0.14
            + (this.options.reducedMotion ? 0 : eased * layout.cell * 0.025);
          const y = Math.min(layout.y + layout.height - stroke, Math.max(layout.y + stroke, rawY));
          const kick = layout.cell * 0.11;
          if (!this.options.reducedMotion) {
            graphics
              .roundRect(
                centerX - spread,
                y - layout.cell * 0.055,
                spread * 2,
                layout.cell * 0.11,
                Math.max(1, layout.cell * 0.045),
              )
              .fill({ color: COLORS.actionInk, alpha: landingAlpha * 0.18 });
          }
          this.strokeSegments(graphics, [
            [centerX - spread, y, centerX - gap, y],
            [centerX + gap, y, centerX + spread, y],
            [centerX - spread, y, centerX - spread - kick * 0.46, y - kick],
            [centerX + spread, y, centerX + spread + kick * 0.46, y - kick],
          ], COLORS.classic, landingAlpha * 0.94, Math.max(1.4, stroke * 1.12));
          this.strokeSegments(graphics, [
            [centerX - spread * 0.72, y, centerX - gap, y],
            [centerX + gap, y, centerX + spread * 0.72, y],
          ], COLORS.actionInk, landingAlpha * 0.82, Math.max(1.3, stroke * 0.68));
        }
        continue;
      }

      if (cue.kind === 'combo') {
        const marks = Math.min(3, Math.max(1, cue.combo - 1));
        for (const row of cue.rows) {
          if (row < VISIBLE_START_ROW || row >= VISIBLE_START_ROW + VISIBLE_HEIGHT) continue;
          const centerY = layout.y + (row - VISIBLE_START_ROW + 0.5) * layout.cell;
          for (let mark = 0; mark < marks; mark += 1) {
            const inset = layout.cell * (
              0.24 + mark * 0.16 + (this.options.reducedMotion ? 0 : (1 - eased) * 0.16)
            );
            const arm = layout.cell * 0.16;
            const halfHeight = layout.cell * (0.17 + mark * 0.035);
            const leftX = layout.x + inset;
            const rightX = layout.x + layout.width - inset;
            this.strokeSegments(graphics, [
              [leftX + arm, centerY - halfHeight, leftX, centerY - halfHeight],
              [leftX, centerY - halfHeight, leftX, centerY + halfHeight],
              [leftX, centerY + halfHeight, leftX + arm, centerY + halfHeight],
              [rightX - arm, centerY - halfHeight, rightX, centerY - halfHeight],
              [rightX, centerY - halfHeight, rightX, centerY + halfHeight],
              [rightX, centerY + halfHeight, rightX - arm, centerY + halfHeight],
            ], COLORS.classic, alpha * (0.82 - mark * 0.14), Math.max(1, stroke * 0.82));
          }
        }
        continue;
      }

      if (cue.kind === 'speed-up') {
        const travel = this.options.reducedMotion ? 0 : eased * layout.cell * 2.8;
        const baseY = layout.y + layout.cell * 1.25 + travel;
        const leftX = layout.x + layout.cell * 0.42;
        const rightX = layout.x + layout.width - layout.cell * 0.42;
        const tickWidth = layout.cell * 0.16;
        const tickHeight = layout.cell * 0.22;
        const repetitions = this.options.reducedMotion ? 1 : 3;
        for (let tick = 0; tick < repetitions; tick += 1) {
          const y = Math.min(
            layout.y + layout.height - tickHeight - stroke,
            baseY + tick * layout.cell * 0.58,
          );
          this.strokeSegments(graphics, [
            [leftX - tickWidth, y - tickHeight, leftX, y],
            [leftX, y, leftX + tickWidth, y - tickHeight],
            [rightX - tickWidth, y - tickHeight, rightX, y],
            [rightX, y, rightX + tickWidth, y - tickHeight],
          ], COLORS.classic, alpha * (0.84 - tick * 0.14), stroke);
        }
        continue;
      }

      const travel = this.options.reducedMotion ? 0 : (1 - eased) * layout.cell * 0.5;
      const left = layout.x + layout.cell * 3 - travel;
      const right = layout.x + layout.cell * 7 + travel;
      const top = layout.y + layout.cell * 0.45;
      const bottom = layout.y + layout.cell * 3.15 + travel * 0.45;
      const arm = layout.cell * 0.46;
      this.strokeSegments(graphics, [
        [left, top + arm, left, top],
        [left, top, left + arm, top],
        [right - arm, top, right, top],
        [right, top, right, top + arm],
        [left, bottom - arm, left, bottom],
        [left, bottom, left + arm, bottom],
        [right - arm, bottom, right, bottom],
        [right, bottom, right, bottom - arm],
      ], COLORS.danger, alpha * 0.9, Math.max(1.4, stroke * 1.08));
    }
  }

  private resolvePreviewMutationItem(state: GameState): MutationItem | null {
    const hasActive = state.active !== null;
    const unchanged = this.previewMutationQueueRef === state.queue
      && this.previewMutationRandomizerRef === state.mutationRandomizer
      && this.previewMutationPieceCount === state.pieceCount
      && this.previewMutationMode === state.mode
      && this.previewMutationHasActive === hasActive;
    if (unchanged) return this.previewMutationItem;
    this.previewMutationQueueRef = state.queue;
    this.previewMutationRandomizerRef = state.mutationRandomizer;
    this.previewMutationPieceCount = state.pieceCount;
    this.previewMutationMode = state.mode;
    this.previewMutationHasActive = hasActive;
    return state.mode === 'sprint' ? nextMutationPreviewItem(state) : null;
  }

  /** Persistent, low-obstruction board treatment makes every ten-second state legible. */
  private drawActiveMutationAtmosphere(graphics: Graphics, state: GameState, layout: BoardLayout): void {
    if (state.mode !== 'sprint') return;
    const fallback: Array<Exclude<MutationItem, 'bomb'>> = [];
    if (state.mutationFreezeTicks > 0) fallback.push('freeze');
    if (state.mutationCollapseTicks > 0) fallback.push('collapse');
    if (state.mutationMultiplierTicks > 0) fallback.push('multiplier');

    const fields = this.mutationFields.size
      ? [...this.mutationFields.values()]
      : fallback.map((item) => ({ item, stage: 'active' as const, elapsed: 0 }));
    for (const field of fields) {
      const token = MUTATION_VFX_TOKENS[field.item];
      const alpha = this.mutationFieldOpacity(field);
      if (alpha <= 0) continue;
      const phase = this.options.reducedMotion ? 0 : (this.mutationClockMs % token.animation.pulseMs) / token.animation.pulseMs;
      if (field.item === 'freeze') this.drawFreezeAtmosphere(graphics, layout, phase, alpha);
      else if (field.item === 'collapse') this.drawCollapseAtmosphere(graphics, layout, phase, alpha);
      else this.drawMultiplierAtmosphere(
        graphics,
        layout,
        phase,
        alpha,
        state.mutationMultiplierFactor === 4 ? 4 : 2,
      );
    }
  }

  private mutationFieldOpacity(field: MutationField): number {
    const timing = MUTATION_VFX_TOKENS[field.item].animation;
    if (this.options.reducedMotion || field.stage === 'active') return 1;
    if (field.stage === 'enter') return mutationEase('cubicOut', field.elapsed / timing.enterMs);
    return 1 - mutationEase('cubicIn', field.elapsed / timing.exitMs);
  }

  private drawFreezeAtmosphere(graphics: Graphics, layout: BoardLayout, phase: number, opacity: number): void {
    const token = MUTATION_VFX_TOKENS.freeze;
    const frostProfile = token.shader.frost;
    const inset = Math.max(2, layout.cell * 0.13);
    const pulse = this.options.reducedMotion ? 1 : 0.76 + Math.sin(phase * Math.PI * 2) * 0.18;
    const radius = Math.max(5, layout.cell * 0.22);
    graphics
      .roundRect(layout.x + inset, layout.y + inset, layout.width - inset * 2, layout.height - inset * 2, radius)
      .fill({ color: token.palette.primary, alpha: token.shader.fieldAlpha * 0.55 * opacity })
      .stroke({
        color: token.palette.highlight,
        alpha: 0.82 * pulse * opacity,
        width: Math.max(1, layout.cell * 0.062 * (frostProfile?.edgeStrength ?? 1)),
      })
      .roundRect(layout.x + inset * 2.5, layout.y + inset * 2.5, layout.width - inset * 5, layout.height - inset * 5, Math.max(3, radius * .6))
      .stroke({ color: token.palette.primary, alpha: 0.42 * pulse * opacity, width: Math.max(1, layout.cell * 0.025) });
    const shardSize = Math.max(3, layout.cell * 0.19);
    for (const [xFactor, yFactor, scale] of [
      [.08, .05, .8], [.27, .04, .52], [.72, .05, .7], [.92, .08, .46], [.04, .29, .5], [.96, .67, .76], [.16, .87, .4], [.83, .9, .58],
    ] as const) {
      const drift = this.options.reducedMotion ? 0 : Math.sin((phase + xFactor) * Math.PI * 2) * layout.cell * .08;
      this.drawMutationDiamond(
        graphics,
        layout.x + layout.width * xFactor,
        layout.y + layout.height * yFactor + drift,
        shardSize * scale * .45,
        shardSize * scale,
        token.palette.highlight,
        0.82 * pulse * opacity,
      );
    }
  }

  private drawCollapseAtmosphere(graphics: Graphics, layout: BoardLayout, phase: number, opacity: number): void {
    const token = MUTATION_VFX_TOKENS.collapse;
    const centerX = layout.x + layout.width / 2;
    const centerY = layout.y + Math.min(layout.height * .28, layout.cell * 5.4);
    const pulse = this.options.reducedMotion ? 1 : .78 + Math.sin(phase * Math.PI * 2) * .16;
    const core = Math.max(5, layout.cell * .48);
    const stroke = Math.max(1, layout.cell * .055);
    // A compact gravity core communicates the timed global rule without inventing
    // fake moving columns. Real column motion is drawn only by CollapseTrail.
    graphics
      .circle(centerX, centerY, core * 1.8)
      .fill({ color: token.palette.deep, alpha: .18 * pulse * opacity })
      .circle(centerX, centerY, core)
      .stroke({ color: token.palette.highlight, alpha: .72 * pulse * opacity, width: stroke });
    this.drawMutationDiamond(
      graphics,
      centerX,
      centerY,
      core * .64,
      core * .9,
      token.palette.primary,
      .76 * pulse * opacity,
    );
    for (let index = 0; index < 3; index += 1) {
      const y = centerY + core * (1.55 + index * .72);
      const spread = core * (.84 - index * .12);
      this.strokeSegments(graphics, [
        [centerX - spread, y - core * .24, centerX, y + core * .22],
        [centerX, y + core * .22, centerX + spread, y - core * .24],
      ], token.palette.highlight, (.66 - index * .1) * pulse * opacity, stroke);
    }
    for (const [xOffset, yOffset, scale] of [
      [-1.55, -.82, .5], [1.48, -.48, .42], [-1.2, 1.36, .34], [1.28, 1.72, .3],
    ] as const) {
      const drift = this.options.reducedMotion ? 0 : ((phase + scale) % 1) * core * 1.6;
      graphics
        .circle(centerX + xOffset * core, centerY + yOffset * core + drift, Math.max(1, core * scale * .16))
        .fill({ color: token.palette.primary, alpha: .52 * pulse * opacity });
    }
  }

  private drawMultiplierAtmosphere(
    graphics: Graphics,
    layout: BoardLayout,
    phase: number,
    opacity: number,
    factor: 2 | 4,
  ): void {
    const token = MUTATION_VFX_TOKENS.multiplier;
    const centerX = layout.x + layout.width / 2;
    const centerY = layout.y + layout.height * .43;
    const pulse = this.options.reducedMotion ? 1 : 0.7 + Math.sin(phase * Math.PI * 2) * 0.22;
    const intensity = factor === 4 ? 1.24 : 1;
    const radius = Math.max(layout.cell * 1.65, layout.width * .12) * intensity;
    graphics.circle(centerX, centerY, radius).fill({ color: token.palette.primary, alpha: 0.11 * pulse * opacity });
    graphics.circle(centerX, centerY, radius * .62).fill({ color: token.palette.highlight, alpha: 0.1 * pulse * opacity });
    graphics.circle(centerX, centerY, radius * (factor === 4 ? 1.18 : .94))
      .stroke({
        color: factor === 4 ? token.palette.highlight : token.palette.primary,
        alpha: (factor === 4 ? .52 : .34) * pulse * opacity,
        width: Math.max(1, layout.cell * .045),
      });
    this.drawMutationStar(
      graphics,
      centerX,
      centerY,
      Math.max(layout.cell * .82, layout.width * .052) * intensity,
      Math.max(layout.cell * .22, layout.width * .014) * intensity,
      token.palette.highlight,
      0.58 * pulse * opacity,
    );
    const ray = radius * 1.12;
    this.strokeSegments(graphics, [
      [centerX - ray, centerY, centerX - radius * .68, centerY],
      [centerX + radius * .68, centerY, centerX + ray, centerY],
      [centerX, centerY - ray, centerX, centerY - radius * .68],
      [centerX, centerY + radius * .68, centerX, centerY + ray],
    ], token.palette.primary, 0.42 * pulse * opacity, Math.max(1, layout.cell * .042));
    if (factor === 4) {
      for (const angle of [-Math.PI * .25, Math.PI * .25, Math.PI * .75, Math.PI * 1.25]) {
        const x = centerX + Math.cos(angle) * radius * .92;
        const y = centerY + Math.sin(angle) * radius * .92;
        this.drawMutationStar(
          graphics,
          x,
          y,
          Math.max(2.5, layout.cell * .16),
          Math.max(1, layout.cell * .055),
          token.palette.highlight,
          .64 * pulse * opacity,
        );
      }
    }
    this.drawMutationMultiplierValue(
      graphics,
      centerX,
      centerY + radius * .54,
      Math.max(4, layout.cell * .25),
      factor,
      token.palette.highlight,
      .9 * pulse * opacity,
    );
  }

  private drawPreviewPiece(
    graphics: Graphics,
    type: PieceType,
    centerX: number,
    centerY: number,
    unit: number,
    carrierItem: MutationItem | null,
  ): void {
    const shape = PIECE_SHAPES[type][0];
    const minX = Math.min(...shape.map((cell) => cell.x));
    const maxX = Math.max(...shape.map((cell) => cell.x));
    const minY = Math.min(...shape.map((cell) => cell.y));
    const maxY = Math.max(...shape.map((cell) => cell.y));
    const width = (maxX - minX + 1) * unit;
    const height = (maxY - minY + 1) * unit;
    const originX = centerX - width / 2 - minX * unit;
    const originY = centerY - height / 2 - minY * unit;
    this.drawCellGroups(graphics, shape, type, 0.96, {
      originX,
      originY,
      unit,
    });
    if (carrierItem) {
      const previewLayout: BoardLayout = {
        x: originX,
        y: originY,
        width,
        height,
        cell: unit,
        compact: true,
      };
      this.drawMutationCarrierSurface(graphics, shape, carrierItem, previewLayout);
      this.drawMutationCarrierCore(graphics, shape, carrierItem, previewLayout);
    }
  }

  private drawPreviewPieces(
    graphics: Graphics,
    pieces: readonly PieceType[],
    x: number,
    y: number,
    width: number,
    height: number,
    labelInset = 0,
    carrierItem: MutationItem | null = null,
  ): void {
    if (!pieces.length) return;
    const dualPreview = pieces.length > 1;
    const contentY = y + Math.min(labelInset, Math.max(0, height - 8));
    const contentHeight = Math.max(8, height - (contentY - y));
    const slotHeight = contentHeight / pieces.length;
    for (const [index, piece] of pieces.entries()) {
      const unit = this.previewUnitFor(piece, width, slotHeight, dualPreview);
      const centerY = contentY + slotHeight * (index + 0.5);
      this.drawPreviewPiece(graphics, piece, x + width / 2, centerY, unit, index === 0 ? carrierItem : null);
    }
  }

  /**
   * Fit an actual tetromino silhouette instead of capping every preview at a
   * tiny fixed cell size. The compact rail now uses most of the available slot
   * while retaining a calm margin around a long I or tall rotated footprint.
   */
  private previewUnitFor(type: PieceType, width: number, height: number, dualPreview: boolean): number {
    const shape = PIECE_SHAPES[type][0];
    const spanX = Math.max(...shape.map((cell) => cell.x)) - Math.min(...shape.map((cell) => cell.x)) + 1;
    const spanY = Math.max(...shape.map((cell) => cell.y)) - Math.min(...shape.map((cell) => cell.y)) + 1;
    const horizontalAllowance = Math.max(0, width) * (dualPreview ? 0.7 : 0.74);
    const verticalAllowance = Math.max(0, height) * (dualPreview ? 0.72 : 0.7);
    const cap = dualPreview ? 24 : 28;
    return Math.max(5, Math.min(cap, horizontalAllowance / spanX, verticalAllowance / spanY));
  }

  private drawReducedMutationEndpoint(
    graphics: Graphics,
    item: MutationItem,
    centerX: number,
    centerY: number,
    size: number,
    factor: 2 | 4,
  ): void {
    const token = MUTATION_VFX_TOKENS[item];
    const stroke = Math.max(1, size * .1);
    if (item === 'freeze') {
      this.drawMutationDiamond(graphics, centerX, centerY, size * .58, size, token.palette.highlight, .44);
      this.drawMutationDiamond(graphics, centerX, centerY, size * .28, size * .52, token.palette.primary, .88);
      this.strokeSegments(graphics, [
        [centerX - size * .9, centerY, centerX + size * .9, centerY],
        [centerX, centerY - size * .9, centerX, centerY + size * .9],
      ], token.palette.highlight, .82, stroke);
      return;
    }
    if (item === 'collapse') {
      graphics
        .circle(centerX, centerY - size * .18, size * .66)
        .fill({ color: token.palette.deep, alpha: .42 })
        .circle(centerX, centerY - size * .18, size * .4)
        .stroke({ color: token.palette.highlight, alpha: .86, width: stroke });
      this.drawMutationDiamond(
        graphics,
        centerX,
        centerY - size * .18,
        size * .28,
        size * .4,
        token.palette.primary,
        .86,
      );
      for (let index = 0; index < 2; index += 1) {
        const y = centerY + size * (.68 + index * .48);
        const spread = size * (.54 - index * .08);
        this.strokeSegments(graphics, [
          [centerX - spread, y - size * .16, centerX, y + size * .16],
          [centerX, y + size * .16, centerX + spread, y - size * .16],
        ], token.palette.highlight, .78 - index * .16, stroke);
      }
      return;
    }
    if (item === 'bomb') {
      graphics
        .circle(centerX, centerY, size * .34)
        .fill({ color: token.palette.primary, alpha: .74 })
        .circle(centerX, centerY, size * .72)
        .stroke({ color: token.palette.highlight, alpha: .92, width: stroke * 1.22 })
        .circle(centerX, centerY, size)
        .stroke({ color: token.palette.primary, alpha: .56, width: stroke });
      this.strokeSegments(graphics, [
        [centerX - size * .94, centerY - size * .42, centerX - size * .58, centerY - size * .26],
        [centerX + size * .58, centerY + size * .28, centerX + size * .96, centerY + size * .48],
        [centerX + size * .18, centerY - size * .72, centerX + size * .42, centerY - size * 1.08],
      ], token.palette.highlight, .84, stroke);
      return;
    }
    graphics.circle(centerX, centerY, size * 1.08).fill({ color: token.palette.primary, alpha: factor === 4 ? .28 : .18 });
    this.drawMutationStar(
      graphics,
      centerX,
      centerY,
      size * (factor === 4 ? .92 : .76),
      size * .28,
      token.palette.highlight,
      .92,
    );
    this.drawMutationMultiplierValue(
      graphics,
      centerX,
      centerY + size * .82,
      size * .32,
      factor,
      token.palette.highlight,
      1,
    );
  }

  private drawMutationActivationEffect(
    graphics: Graphics,
    flash: MutationFlash,
    layout: BoardLayout,
  ): void {
    const token = MUTATION_VFX_TOKENS[flash.item];
    const cells = flash.triggerCells
      .filter((cell) => cell.y >= VISIBLE_START_ROW && cell.y < VISIBLE_START_ROW + VISIBLE_HEIGHT)
      .map((cell) => ({ x: cell.x, y: cell.y - VISIBLE_START_ROW }));
    const minX = cells.length ? Math.min(...cells.map((cell) => cell.x)) : BOARD_WIDTH / 2 - 0.5;
    const maxX = cells.length ? Math.max(...cells.map((cell) => cell.x)) : BOARD_WIDTH / 2 - 0.5;
    const minY = cells.length ? Math.min(...cells.map((cell) => cell.y)) : VISIBLE_HEIGHT * 0.42;
    const maxY = cells.length ? Math.max(...cells.map((cell) => cell.y)) : VISIBLE_HEIGHT * 0.42;
    const anchorX = layout.x + (minX + maxX + 1) * layout.cell / 2;
    const anchorY = layout.y + (minY + maxY + 1) * layout.cell / 2;
    const strokeWidth = Math.max(1, layout.cell * 0.06);

    if (this.options.reducedMotion) {
      if (cells.length) this.drawMutationCarrierRim(graphics, cells, flash.item, layout, 0, 0, 0.72, strokeWidth);
      this.drawReducedMutationEndpoint(
        graphics,
        flash.item,
        anchorX,
        anchorY,
        Math.max(layout.cell * .72, layout.width * .042),
        flash.multiplierFactor,
      );
      return;
    }

    if (flash.item === 'freeze') {
      const crystalise = flash.timeline.sample('crystalise');
      const snowBurst = flash.timeline.sample('snow-burst');
      if (!crystalise.active && !snowBurst.active) return;
      const alpha = Math.max(crystalise.active ? 1 - crystalise.progress * .26 : 0, snowBurst.active ? 1 - snowBurst.progress : 0);
      const shard = Math.max(3, layout.cell * 0.18);
      const distance = Math.max(layout.cell * 0.68, (maxX - minX + maxY - minY + 2) * layout.cell * 0.22);
      const ring = .42 + crystalise.value * .88;
      if (cells.length) this.drawMutationCarrierRim(graphics, cells, flash.item, layout, 0, 0, .92 * alpha, strokeWidth);
      graphics
        .circle(anchorX, anchorY, distance * ring)
        .fill({ color: token.palette.primary, alpha: 0.16 * alpha })
        .circle(anchorX, anchorY, distance * (ring + .18))
        .stroke({ color: token.palette.highlight, alpha: .88 * alpha, width: strokeWidth });
      for (const [xFactor, yFactor, scale] of [[-1, -.46, .85], [.82, -.72, 1], [.5, .82, .68], [-.68, .66, .58], [.12, -1.05, .56]] as const) {
        this.drawMutationDiamond(
          graphics,
          anchorX + xFactor * distance,
          anchorY + yFactor * distance,
          shard * scale * .45,
          shard * scale,
          token.palette.highlight,
          0.84 * alpha,
        );
      }
      return;
    }

    if (flash.item === 'collapse') {
      const pull = flash.timeline.sample('pull');
      const settle = flash.timeline.sample('settle');
      if (!pull.active && !settle.active) return;
      const alpha = pull.active ? 1 - pull.progress * .18 : 1 - settle.progress;
      const compression = pull.active ? pull.value : 1;
      if (cells.length) this.drawMutationCarrierRim(graphics, cells, flash.item, layout, 0, 0, .9 * alpha, strokeWidth);
      const coreRadius = Math.max(layout.cell * .58, 6);
      graphics
        .circle(anchorX, anchorY, coreRadius * (1.2 + compression * .42))
        .fill({ color: token.palette.deep, alpha: .3 * alpha })
        .circle(anchorX, anchorY, coreRadius * .72)
        .stroke({ color: token.palette.highlight, alpha: .9 * alpha, width: strokeWidth });
      this.drawMutationDiamond(
        graphics,
        anchorX,
        anchorY,
        coreRadius * .4,
        coreRadius * .62,
        token.palette.primary,
        .86 * alpha,
      );
      for (const column of flash.triggerColumns) {
        const x = layout.x + (column + .5) * layout.cell;
        let sourceY = anchorY;
        for (const cell of cells) {
          if (cell.x !== column) continue;
          sourceY = Math.min(sourceY, layout.y + (cell.y + .5) * layout.cell);
        }
        const available = Math.max(layout.cell * 1.4, layout.y + layout.height - sourceY - layout.cell * .4);
        const dropHeight = Math.min(available, layout.cell * (2.2 + compression * 2.4));
        const wellWidth = Math.max(2, layout.cell * .09);
        graphics
          .roundRect(x - wellWidth * 1.8, sourceY, wellWidth, dropHeight, wellWidth / 2)
          .fill({ color: token.palette.primary, alpha: .44 * alpha })
          .roundRect(x + wellWidth * .8, sourceY + layout.cell * .26, wellWidth, dropHeight * .82, wellWidth / 2)
          .fill({ color: token.palette.highlight, alpha: .26 * alpha });
        for (let mote = 0; mote < 3; mote += 1) {
          const progress = (compression * .58 + mote * .31) % 1;
          graphics
            .circle(x + (mote - 1) * wellWidth * 1.25, sourceY + dropHeight * progress, Math.max(1, wellWidth * .72))
            .fill({ color: token.palette.highlight, alpha: (.68 - mote * .1) * alpha });
        }
        const settleY = sourceY + dropHeight;
        const spread = layout.cell * .28;
        this.strokeSegments(graphics, [
          [x - spread, settleY - layout.cell * .12, x, settleY + layout.cell * .14],
          [x, settleY + layout.cell * .14, x + spread, settleY - layout.cell * .12],
        ], token.palette.highlight, .86 * alpha, strokeWidth);
        if (settle.active) {
          graphics
            .roundRect(
              x - layout.cell * .36,
              settleY + layout.cell * .22,
              layout.cell * .72,
              Math.max(2, layout.cell * .08),
              Math.max(1, layout.cell * .04),
            )
            .fill({ color: token.palette.primary, alpha: .52 * alpha });
        }
      }
      return;
    }

    if (flash.item === 'bomb') {
      const warning = flash.timeline.sample('warning');
      const pulse = flash.timeline.sample('pulse');
      const impact = flash.timeline.sample('impact');
      const shockwave = flash.timeline.sample('shockwave');
      const rows = Math.min(3, VISIBLE_HEIGHT);
      const y = layout.y + layout.height - layout.cell * rows;
      if (warning.active) {
        const alpha = .55 + Math.sin(warning.progress * Math.PI * 3) * .28;
        graphics
          .roundRect(layout.x + layout.cell * .12, y + layout.cell * .12, layout.width - layout.cell * .24, layout.cell * rows - layout.cell * .24, Math.max(4, layout.cell * .18))
          .fill({ color: token.palette.deep, alpha: .46 * alpha })
          .stroke({ color: token.palette.primary, alpha, width: strokeWidth });
      }
      if (pulse.active) {
        const alpha = Math.sin(pulse.progress * Math.PI);
        const radius = Math.max(layout.cell * 1.1, layout.width * (.06 + pulse.value * .12));
        graphics
          .circle(anchorX, anchorY, radius)
          .fill({ color: token.palette.primary, alpha: .24 * alpha })
          .circle(anchorX, anchorY, radius * 1.35)
          .stroke({ color: token.palette.highlight, alpha: .9 * alpha, width: strokeWidth });
      }
      if (impact.active) {
        const alpha = 1 - impact.progress;
        graphics
          .roundRect(layout.x, layout.y, layout.width, layout.height, Math.max(5, layout.cell * .2))
          .fill({ color: token.palette.highlight, alpha: .18 * alpha })
          .roundRect(layout.x + layout.cell * .08, y + layout.cell * .08, layout.width - layout.cell * .16, layout.cell * rows - layout.cell * .16, Math.max(4, layout.cell * .16))
          .fill({ color: token.palette.primary, alpha: .36 * alpha });
      }
      if (shockwave.active) {
        const alpha = 1 - shockwave.progress;
        const radius = Math.max(layout.cell * 1.4, layout.width * (.12 + shockwave.value * .42));
        graphics
          .circle(anchorX, anchorY, radius)
          .stroke({ color: token.palette.highlight, alpha: .96 * alpha, width: Math.max(strokeWidth, layout.cell * .09) })
          .circle(anchorX, anchorY, radius * .68)
          .stroke({ color: token.palette.primary, alpha: .5 * alpha, width: strokeWidth });
      }
      return;
    }

    const scorePop = flash.timeline.sample('score-pop');
    const sparkTail = flash.timeline.sample('spark-tail');
    if (!scorePop.active && !sparkTail.active) return;
    const alpha = Math.max(scorePop.active ? 1 - scorePop.progress * .2 : 0, sparkTail.active ? 1 - sparkTail.progress : 0);
    const intensity = flash.multiplierFactor === 4 ? 1.32 : 1;
    const starRadius = Math.max(layout.cell * .74, layout.width * .048) * intensity;
    if (cells.length) this.drawMutationCarrierRim(graphics, cells, flash.item, layout, 0, 0, .92 * alpha, strokeWidth);
    graphics.circle(anchorX, anchorY, starRadius * (2.1 + scorePop.value * .7)).fill({ color: token.palette.primary, alpha: 0.16 * alpha });
    this.drawMutationStar(graphics, anchorX, anchorY, starRadius * 1.72, starRadius * .46, token.palette.highlight, 0.96 * alpha);
    this.drawMutationStar(graphics, anchorX, anchorY, starRadius, starRadius * .28, token.palette.primary, alpha);
    this.strokeSegments(graphics, [
      [anchorX - starRadius * 2.55, anchorY, anchorX + starRadius * 2.55, anchorY],
      [anchorX, anchorY - starRadius * 2.55, anchorX, anchorY + starRadius * 2.55],
    ], token.palette.highlight, 0.76 * alpha, Math.max(1, layout.cell * .055));
    this.drawMutationMultiplierValue(
      graphics,
      anchorX,
      anchorY - starRadius * (1.58 + scorePop.value * .72),
      starRadius * .58,
      flash.multiplierFactor,
      token.palette.highlight,
      alpha,
    );
    this.drawMutationScoreValue(
      graphics,
      anchorX,
      anchorY - starRadius * (2.85 + scorePop.value * .88),
      starRadius * .34,
      flash.score,
      token.palette.highlight,
      alpha,
    );
  }

  /**
   * A small Pixi vector value instead of a DOM overlay: the immediate reward reads as
   * ×2 / ×4 beside the gold burst even when the Core event itself carries no direct score.
   */
  private drawMutationMultiplierValue(
    graphics: Graphics,
    centerX: number,
    centerY: number,
    unit: number,
    factor: 2 | 4,
    color: number,
    alpha: number,
  ): void {
    const width = unit * 2.48;
    const height = unit * 1.3;
    const left = centerX - width / 2;
    const top = centerY - height / 2;
    const stroke = Math.max(1, unit * .14);
    graphics
      .roundRect(left - unit * .3, top - unit * .24, width + unit * .6, height + unit * .48, Math.max(2, unit * .3))
      .fill({ color: MUTATION_VFX_TOKENS.multiplier.palette.deep, alpha: .22 * alpha })
      .stroke({ color, alpha: .62 * alpha, width: Math.max(1, stroke * .55) });
    const crossX = left + unit * .52;
    this.strokeSegments(graphics, [
      [crossX - unit * .24, centerY - unit * .24, crossX + unit * .24, centerY + unit * .24],
      [crossX + unit * .24, centerY - unit * .24, crossX - unit * .24, centerY + unit * .24],
    ], color, alpha, stroke);

    const digitLeft = left + unit * 1.12;
    const digitRight = digitLeft + unit * .78;
    const digitTop = top;
    const digitMiddle = centerY;
    const digitBottom = top + height;
    const segments: Array<readonly [number, number, number, number]> = factor === 2
      ? [
        [digitLeft, digitTop, digitRight, digitTop],
        [digitRight, digitTop, digitRight, digitMiddle],
        [digitLeft, digitMiddle, digitRight, digitMiddle],
        [digitLeft, digitMiddle, digitLeft, digitBottom],
        [digitLeft, digitBottom, digitRight, digitBottom],
      ]
      : [
        [digitLeft, digitTop, digitLeft, digitMiddle],
        [digitRight, digitTop, digitRight, digitBottom],
        [digitLeft, digitMiddle, digitRight, digitMiddle],
      ];
    this.strokeSegments(graphics, segments, color, alpha, stroke);
  }

  /** Vector score numerals remain legible without introducing a DOM overlay. */
  private drawMutationScoreValue(
    graphics: Graphics,
    centerX: number,
    centerY: number,
    unit: number,
    score: number,
    color: number,
    alpha: number,
  ): void {
    const value = Math.max(0, Math.round(score));
    if (value === 0 || alpha <= 0) return;
    const glyphs = `+${value}`;
    const glyphWidth = unit * .72;
    const gap = unit * .22;
    const totalWidth = glyphs.length * glyphWidth + (glyphs.length - 1) * gap;
    const left = centerX - totalWidth / 2;
    const top = centerY - unit / 2;
    const stroke = Math.max(1, unit * .16);
    for (let glyphIndex = 0; glyphIndex < glyphs.length; glyphIndex += 1) {
      const glyph = glyphs[glyphIndex]!;
      const glyphLeft = left + glyphIndex * (glyphWidth + gap);
      if (glyph === '+') {
        this.strokeSegments(graphics, [
          [glyphLeft + glyphWidth * .16, centerY, glyphLeft + glyphWidth * .84, centerY],
          [glyphLeft + glyphWidth * .5, centerY - unit * .34, glyphLeft + glyphWidth * .5, centerY + unit * .34],
        ], color, alpha, stroke);
        continue;
      }
      const activeSegments = SCORE_DIGIT_SEGMENTS[glyph];
      if (!activeSegments) continue;
      for (const segmentIndex of activeSegments) {
        const segment = SCORE_SEGMENT_COORDINATES[segmentIndex]!;
        graphics
          .moveTo(glyphLeft + glyphWidth * segment[0], top + unit * segment[1])
          .lineTo(glyphLeft + glyphWidth * segment[2], top + unit * segment[3])
          .stroke({ color, alpha, width: stroke });
      }
    }
  }

  /** Sync renderer-only field transitions from Core's authoritative timers. */
  private syncMutationFields(state: GameState): void {
    const timed: Array<{ item: Exclude<MutationItem, 'bomb'>; active: boolean }> = [
      { item: 'freeze', active: state.mode === 'sprint' && state.mutationFreezeTicks > 0 },
      { item: 'collapse', active: state.mode === 'sprint' && state.mutationCollapseTicks > 0 },
      { item: 'multiplier', active: state.mode === 'sprint' && state.mutationMultiplierTicks > 0 },
    ];
    for (const { item, active } of timed) {
      const field = this.mutationFields.get(item);
      if (active) {
        if (!field || field.stage === 'exit') this.mutationFields.set(item, { item, stage: 'enter', elapsed: 0 });
      } else if (field && field.stage !== 'exit') {
        field.stage = 'exit';
        field.elapsed = 0;
      }
    }
  }

  private advanceMutationFields(deltaMs: number): void {
    for (const [item, field] of this.mutationFields) {
      if (field.stage === 'active') continue;
      field.elapsed += Math.max(0, deltaMs);
      const timing = MUTATION_VFX_TOKENS[item].animation;
      if (field.stage === 'enter' && field.elapsed >= timing.enterMs) {
        field.stage = 'active';
        field.elapsed = 0;
      } else if (field.stage === 'exit' && field.elapsed >= timing.exitMs) {
        this.mutationFields.delete(item);
      }
    }
  }

  private clearMutationVisualState(): void {
    this.mutationFields.clear();
    this.mutationFlashQueue.length = 0;
    this.clearMutationParticles();
    this.resetMutationFilters();
    this.particleCursor = 0;
    this.particleSeed = 0x4d555441;
    this.mutationClockMs = 0;
    this.setWorldOffset(0, 0);
  }

  /** Foreground one new activation at a time; persistent timed fields still stack. */
  private clearMutationParticles(): void {
    for (const particle of this.mutationParticles) particle.active = false;
  }

  private enqueueMutationFlash(request: MutationFlashRequest): void {
    this.mutationFlashQueue.push(request);
    if (this.mutationFlash === null) this.startNextMutationFlash();
  }

  private mutationColumnsFor(cells: readonly Cell[]): readonly number[] {
    const seen = new Uint8Array(BOARD_WIDTH);
    const columns: number[] = [];
    for (const cell of cells) {
      if (cell.x < 0 || cell.x >= BOARD_WIDTH || seen[cell.x] !== 0) continue;
      seen[cell.x] = 1;
      columns.push(cell.x);
    }
    columns.sort((left, right) => left - right);
    return columns;
  }

  private startNextMutationFlash(): void {
    const request = this.mutationFlashQueue.shift();
    if (!request) {
      this.mutationFlash = null;
      return;
    }
    const timeline = createMutationActivationTimeline(request.item);
    this.mutationFlash = {
      item: request.item,
      elapsed: 0,
      // The renderer owns this visual timeline only; Core retains item
      // duration, scoring, clears, and the instant Bomb removal rule.
      duration: timeline.duration,
      timeline,
      triggerCells: request.triggerCells,
      multiplierFactor: request.multiplierFactor,
      score: request.score,
      particlesEmitted: this.options.reducedMotion || request.item !== 'bomb',
      particlePreviousBoard: request.previousBoard,
      triggerColumns: this.mutationColumnsFor(request.triggerCells),
    };
    // Bomb owns a warning and pulse before impact, so its fragments cannot exist
    // until the impact phase begins. Other item families emit immediately.
    if (request.item !== 'bomb' && !this.options.reducedMotion) {
      this.emitMutationParticles(request.item, request.triggerCells, request.previousBoard);
    }
    this.impact = this.options.reducedMotion ? 0.24 : request.item === 'bomb' ? 0 : 0.72;
  }

  private emitDeferredBombImpact(flash: MutationFlash): void {
    if (flash.item !== 'bomb' || flash.particlesEmitted) return;
    const impact = flash.timeline.sample('impact');
    if (!impact.active && !impact.complete) return;
    flash.particlesEmitted = true;
    if (this.options.reducedMotion) return;
    this.emitMutationParticles('bomb', flash.triggerCells, flash.particlePreviousBoard);
    this.impact = Math.max(this.impact, 1.05);
  }

  /** Pixi nulls display-object points during unmount; cleanup must stay safe. */
  private setWorldOffset(x: number, y: number): void {
    const position = (this.world as unknown as { position?: { set: (nextX: number, nextY: number) => void } | null }).position;
    position?.set(x, y);
  }

  /**
   * The only two GPU field effects are renderer-lifetime objects. A generated
   * displacement texture keeps the implementation original and avoids a second
   * visible canvas or a downloaded asset.
   */
  private initializeMutationFilters(): void {
    const frost = new NoiseFilter({ noise: 0, seed: 0 });
    frost.enabled = false;
    const map = this.createCollapseDisplacementMap();
    const collapse = map
      ? new DisplacementFilter({ sprite: map, scale: { x: 0, y: 0 } })
      : null;
    if (collapse) {
      collapse.enabled = false;
      // The displacement map participates in world transforms but never paints
      // into the one visible gameplay canvas as a normal sprite.
      map!.renderable = false;
      this.world.addChild(map!);
    }
    this.frostFilter = frost;
    this.collapseFilter = collapse;
    this.collapseDisplacementMap = map;
    this.world.filters = collapse ? [frost, collapse] : [frost];
  }

  private createCollapseDisplacementMap(): Sprite | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) return null;
    const pixels = context.createImageData(size, size);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const index = (y * size + x) * 4;
        const diagonalWave = Math.sin((x * 0.43) + (y * 0.21));
        const verticalWave = Math.cos((y * 0.51) - (x * 0.13));
        pixels.data[index] = 128 + Math.round(diagonalWave * 62);
        pixels.data[index + 1] = 128 + Math.round(verticalWave * 54);
        pixels.data[index + 2] = 255;
        pixels.data[index + 3] = 255;
      }
    }
    context.putImageData(pixels, 0, 0);
    return new Sprite(Texture.from(canvas, true));
  }

  private destroyMutationFilters(): void {
    this.world.filters = undefined;
    this.frostFilter?.destroy();
    this.collapseFilter?.destroy();
    const map = this.collapseDisplacementMap;
    if (map) {
      if (map.parent === this.world) this.world.removeChild(map);
      map.destroy({ texture: true, textureSource: true });
    }
    this.frostFilter = null;
    this.collapseFilter = null;
    this.collapseDisplacementMap = null;
    this.resetMutationFilters();
  }

  private resetMutationFilters(): void {
    this.mutationFilterState.freeze = false;
    this.mutationFilterState.collapse = false;
    if (this.frostFilter) {
      this.frostFilter.enabled = false;
      this.frostFilter.noise = 0;
    }
    if (this.collapseFilter) {
      this.collapseFilter.enabled = false;
      this.collapseFilter.scale.x = 0;
      this.collapseFilter.scale.y = 0;
    }
  }

  private mutationFieldOpacityFor(item: Exclude<MutationItem, 'bomb'>): number {
    const field = this.mutationFields.get(item);
    return field ? this.mutationFieldOpacity(field) : 0;
  }

  /** Maps Core timers to a bounded board filter without affecting Core state. */
  private syncMutationFilters(state: GameState, _layout: BoardLayout): void {
    if (this.options.reducedMotion || state.mode !== 'sprint') {
      this.resetMutationFilters();
      return;
    }

    const freezeOpacity = this.mutationFieldOpacityFor('freeze');
    const frostProfile = MUTATION_VFX_TOKENS.freeze.shader.frost;
    this.mutationFilterState.freeze = freezeOpacity > .001 && Boolean(frostProfile);
    // Collapse is intentionally vector-local. A world-wide displacement field
    // implies unaffected columns are moving and violates the actual-column contract.
    this.mutationFilterState.collapse = false;

    if (this.frostFilter && frostProfile) {
      this.frostFilter.enabled = this.mutationFilterState.freeze;
      this.frostFilter.noise = this.mutationFilterState.freeze
        ? frostProfile.noise * (.42 + freezeOpacity * .58)
        : 0;
      // A deterministic clock gives the glass grain a living surface without a
      // renderer random source or a per-frame allocation.
      this.frostFilter.seed = ((this.mutationClockMs * .00037) % 1) * frostProfile.noiseScale;
    }

    if (this.collapseFilter) {
      this.collapseFilter.enabled = false;
      this.collapseFilter.scale.x = 0;
      this.collapseFilter.scale.y = 0;
    }
  }

  /** Fixed-seed visual random sequence: cosmetic particles never affect Core. */
  private nextMutationRandom(): number {
    this.particleSeed = (Math.imul(this.particleSeed, 1664525) + 1013904223) >>> 0;
    return this.particleSeed / 0x1_0000_0000;
  }

  private emitMutationParticles(
    item: MutationItem,
    triggerCells: readonly Cell[],
    previousBoard: GameState['board'] | null,
  ): void {
    if (this.options.reducedMotion) return;
    const token = MUTATION_VFX_TOKENS[item];
    const sources: Cell[] = [];
    if (item === 'bomb' && previousBoard) {
      for (let y = Math.max(VISIBLE_START_ROW, BOARD_HEIGHT - 3); y < BOARD_HEIGHT; y += 1) {
        for (let x = 0; x < BOARD_WIDTH; x += 1) {
          if (previousBoard[y]?.[x]) sources.push({ x, y });
        }
      }
    }
    if (sources.length === 0) sources.push(...triggerCells);
    if (sources.length === 0) sources.push({ x: Math.floor(BOARD_WIDTH / 2), y: VISIBLE_START_ROW + Math.floor(VISIBLE_HEIGHT * .43) });
    const count = Math.min(MUTATION_PARTICLE_LIMIT, token.particles.burst);
    for (let index = 0; index < count; index += 1) {
      const source = sources[index % sources.length]!;
      const particle = this.mutationParticles[this.particleCursor % this.mutationParticles.length]!;
      this.particleCursor = (this.particleCursor + 1) % this.mutationParticles.length;
      const angle = this.nextMutationRandom() * Math.PI * 2;
      const variance = .58 + this.nextMutationRandom() * .72;
      const speed = token.particles.speed * .006 * variance;
      particle.active = true;
      particle.item = item;
      particle.u = (source.x + .5) / BOARD_WIDTH;
      particle.v = (source.y - VISIBLE_START_ROW + .5) / VISIBLE_HEIGHT;
      particle.velocityU = Math.cos(angle) * speed;
      particle.velocityV = Math.sin(angle) * speed;
      if (item === 'freeze') particle.velocityV = -Math.abs(particle.velocityV) * .72 - speed * .18;
      if (item === 'collapse') particle.velocityV = Math.abs(particle.velocityV) * 1.26 + speed * .18;
      if (item === 'bomb') particle.velocityV -= speed * .44;
      if (item === 'multiplier') particle.velocityV -= speed * .36;
      particle.elapsed = 0;
      particle.lifeMs = token.particles.lifeMs * (.72 + this.nextMutationRandom() * .38);
      particle.size = token.particles.size * (.72 + this.nextMutationRandom() * .62);
      particle.color = this.nextMutationRandom() > .43 ? token.palette.highlight : token.palette.primary;
      particle.rotation = this.nextMutationRandom() * Math.PI * 2;
      particle.rotationVelocity = (this.nextMutationRandom() - .5) * .009;
    }
  }

  private advanceMutationParticles(deltaMs: number): void {
    for (const particle of this.mutationParticles) {
      if (!particle.active) continue;
      particle.elapsed += Math.max(0, deltaMs);
      if (particle.elapsed >= particle.lifeMs) particle.active = false;
    }
  }

  private drawMutationParticles(graphics: Graphics, layout: BoardLayout): void {
    if (this.options.reducedMotion) return;
    for (const particle of this.mutationParticles) {
      if (!particle.active) continue;
      const progress = Math.min(1, particle.elapsed / particle.lifeMs);
      const alpha = Math.pow(1 - progress, particle.item === 'bomb' ? .58 : 1.16);
      if (alpha <= .01) continue;
      const x = layout.x + (particle.u + particle.velocityU * particle.elapsed) * layout.width;
      const gravity = particle.item === 'collapse' ? progress * progress * .13 : particle.item === 'bomb' ? progress * progress * .08 : 0;
      const y = layout.y + (particle.v + particle.velocityV * particle.elapsed + gravity) * layout.height;
      const size = Math.max(1.5, layout.cell * particle.size * (particle.item === 'bomb' ? 1 - progress * .32 : 1));
      if (particle.item === 'freeze') {
        this.drawMutationDiamond(graphics, x, y, size * .45, size, particle.color, .82 * alpha);
      } else if (particle.item === 'collapse') {
        graphics.roundRect(x - size * .18, y - size, size * .36, size * 2.1, size * .16).fill({ color: particle.color, alpha: .7 * alpha });
      } else if (particle.item === 'bomb') {
        this.drawMutationFragment(
          graphics,
          x,
          y,
          size * 1.44,
          size * .76,
          particle.rotation + particle.rotationVelocity * particle.elapsed,
          particle.color,
          .86 * alpha,
        );
      } else {
        this.drawMutationStar(graphics, x, y, size, size * .34, particle.color, .82 * alpha);
      }
    }
  }

  /** A rotating Bomb fragment, drawn without allocating a Pixi display object. */
  private drawMutationFragment(
    graphics: Graphics,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    rotation: number,
    color: number,
    alpha: number,
  ): void {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    const leftTopX = centerX - halfWidth * cosine + halfHeight * sine;
    const leftTopY = centerY - halfWidth * sine - halfHeight * cosine;
    const rightTopX = centerX + halfWidth * cosine + halfHeight * sine;
    const rightTopY = centerY + halfWidth * sine - halfHeight * cosine;
    const rightBottomX = centerX + halfWidth * cosine - halfHeight * sine;
    const rightBottomY = centerY + halfWidth * sine + halfHeight * cosine;
    const leftBottomX = centerX - halfWidth * cosine - halfHeight * sine;
    const leftBottomY = centerY - halfWidth * sine + halfHeight * cosine;
    graphics
      .moveTo(leftTopX, leftTopY)
      .lineTo(rightTopX, rightTopY)
      .lineTo(rightBottomX, rightBottomY)
      .lineTo(leftBottomX, leftBottomY)
      .lineTo(leftTopX, leftTopY)
      .fill({ color, alpha });
  }

  private applyMutationCameraShake(layout: BoardLayout): void {
    const flash = this.mutationFlash;
    if (this.options.reducedMotion || !flash || flash.item !== 'bomb') {
      this.setWorldOffset(0, 0);
      return;
    }
    const pulse = flash.timeline.sample('pulse');
    const impact = flash.timeline.sample('impact');
    const shockwave = flash.timeline.sample('shockwave');
    const envelope = Math.max(
      pulse.active ? Math.sin(pulse.progress * Math.PI) * .48 : 0,
      impact.active ? 1 - impact.progress * .28 : 0,
      shockwave.active ? (1 - shockwave.progress) * .38 : 0,
    );
    if (envelope <= 0) {
      this.setWorldOffset(0, 0);
      return;
    }
    const amplitude = Math.min(8, Math.max(2, layout.cell * .2)) * envelope;
    const phase = this.mutationClockMs / 29;
    this.setWorldOffset(Math.sin(phase * 1.7) * amplitude, Math.cos(phase * 2.3) * amplitude * .55);
  }

  private drawCollapseSettlementTrail(
    graphics: Graphics,
    trail: CollapseTrail,
    progress: number,
    layout: BoardLayout,
  ): void {
    const eased = this.options.reducedMotion ? 1 : easeOutCubic(progress);
    const depthWeight = .82 + Math.min(1, trail.maxDrop / 6) * .18;
    const alpha = this.options.reducedMotion ? .76 : .58 * (1 - progress * .72) * depthWeight;
    if (alpha <= 0) return;
    const material = this.mutationMaterial('collapse');
    const stroke = Math.max(1, layout.cell * .05);
    const columnWidth = Math.max(2, layout.cell * .08);
    for (const column of trail.columns) {
      let minFrom = BOARD_HEIGHT;
      let maxTo = 0;
      for (const path of trail.paths) {
        if (path.x !== column) continue;
        minFrom = Math.min(minFrom, path.fromY);
        maxTo = Math.max(maxTo, path.toY);
      }
      if (minFrom >= BOARD_HEIGHT || maxTo < VISIBLE_START_ROW) continue;
      const visibleFrom = Math.max(VISIBLE_START_ROW, minFrom);
      const visibleTo = Math.min(VISIBLE_START_ROW + VISIBLE_HEIGHT - 1, maxTo);
      const centerX = layout.x + (column + .5) * layout.cell;
      const top = layout.y + (visibleFrom - VISIBLE_START_ROW + .12) * layout.cell;
      const bottom = layout.y + (visibleTo - VISIBLE_START_ROW + .88) * layout.cell;
      const height = Math.max(layout.cell * .74, bottom - top);
      graphics
        .roundRect(centerX - columnWidth * 1.7, top, columnWidth, height, columnWidth / 2)
        .fill({ color: material.edge, alpha: alpha * .46 })
        .roundRect(centerX + columnWidth * .7, top + layout.cell * .18, columnWidth, height * .78, columnWidth / 2)
        .fill({ color: material.innerEdge, alpha: alpha * .26 });
      if (!this.options.reducedMotion) {
        const moteY = top + height * ((progress * 1.24 + column * .17) % 1);
        graphics
          .circle(centerX, moteY, Math.max(1, columnWidth * .86))
          .fill({ color: material.innerEdge, alpha: alpha * .82 });
      }
      const spread = layout.cell * .3;
      this.strokeSegments(graphics, [
        [centerX - spread, bottom - layout.cell * .12, centerX, bottom + layout.cell * .12],
        [centerX, bottom + layout.cell * .12, centerX + spread, bottom - layout.cell * .12],
      ], material.innerEdge, alpha, stroke);
      if (eased > .68) {
        graphics
          .roundRect(
            centerX - layout.cell * .37,
            bottom + layout.cell * .2,
            layout.cell * .74,
            Math.max(2, layout.cell * .07),
            Math.max(1, layout.cell * .035),
          )
          .fill({ color: material.fillStart, alpha: alpha * (eased - .68) / .32 });
      }
    }
    for (const path of trail.paths) {
      if (path.toY < VISIBLE_START_ROW || path.fromY >= VISIBLE_START_ROW + VISIBLE_HEIGHT) continue;
      const fromY = layout.y + (path.fromY - VISIBLE_START_ROW + .5) * layout.cell;
      const toY = layout.y + (path.toY - VISIBLE_START_ROW + .5) * layout.cell;
      const currentY = fromY + (toY - fromY) * eased;
      const size = layout.cell * .56;
      graphics
        .roundRect(
          layout.x + (path.x + .5) * layout.cell - size / 2,
          currentY - size / 2,
          size,
          size,
          Math.max(2, layout.cell * .1),
        )
        .fill({ color: material.edge, alpha: alpha * .22 })
        .stroke({ color: material.innerEdge, alpha: alpha * .74, width: stroke });
    }
  }

  private enqueueClassicFeedback(
    kind: ClassicFeedbackKind,
    details: Partial<Pick<ClassicFeedbackCue, 'cells' | 'rows' | 'combo' | 'tier'>> = {},
  ): void {
    const fullDuration = kind === 'landing'
      ? 220
      : kind === 'combo'
        ? 300
        : kind === 'speed-up'
          ? 360
          : 440;
    const reducedDuration = kind === 'landing'
      ? 120
      : kind === 'combo'
        ? 150
        : kind === 'speed-up'
          ? 170
          : 200;
    this.classicFeedbackCues.push({
      kind,
      elapsed: 0,
      duration: this.options.reducedMotion ? reducedDuration : fullDuration,
      cells: (details.cells ?? []).map((cell) => ({ ...cell })),
      rows: [...(details.rows ?? [])],
      combo: details.combo ?? 0,
      tier: details.tier ?? 0,
    });
    if (this.classicFeedbackCues.length > CLASSIC_FEEDBACK_LIMIT) {
      this.classicFeedbackCues.splice(
        0,
        this.classicFeedbackCues.length - CLASSIC_FEEDBACK_LIMIT,
      );
    }
  }

  private classicLandingSupportCells(
    cells: readonly Cell[],
    board: GameState['board'] | undefined,
  ): Cell[] {
    const pieceCells = new Set(cells.map((cell) => cell.y * BOARD_WIDTH + cell.x));
    return cells.filter((cell) => {
      const belowY = cell.y + 1;
      if (pieceCells.has(belowY * BOARD_WIDTH + cell.x)) return false;
      if (belowY >= BOARD_HEIGHT) return true;
      return board?.[belowY]?.[cell.x] != null;
    });
  }

  private consumeEvents(
    events: readonly GameEvent[],
    state?: GameState,
    previousBoard: GameState['board'] | null = null,
    collapseWasActive = false,
  ): void {
    const classic = state?.mode === 'marathon';
    const clearsOnLock = events.some((event) => event.type === 'clear-started');
    const endsOnLock = events.some((event) => event.type === 'game-over');
    for (const event of events) {
      if (event.type === 'piece-moved') {
        if (this.presentation) {
          const settleMs = event.cause === 'soft-drop' ? 26 : event.cause === 'gravity' ? 82 : 56;
          this.presentation.settleMs = Math.min(this.presentation.settleMs, settleMs);
        }
      } else if (event.type === 'piece-rotated') {
        this.rotationPulse = this.options.reducedMotion ? 0 : 1;
      } else if (event.type === 'restarted') {
        this.presentation = null;
        this.boardShift = null;
        this.classicFeedbackCues.length = 0;
        this.clearSurvivalVisualState();
        this.mutationFlash = null;
        this.mutationArrival = null;
        this.activeMutationCarrierId = null;
        this.collapseTrail = null;
        this.clearMutationVisualState();
        this.previousBoard = null;
        this.collapseWasActive = false;
      } else if (event.type === 'puzzle-undone') {
        // Undo restores a pre-lock Core snapshot. Any lock, trail, line-impact, or
        // interpolation residue belongs to the discarded timeline and must not
        // linger over the restored board for a frame.
        this.presentation = null;
        this.trail = null;
        this.lockPulse = null;
        this.classicFeedbackCues.length = 0;
        this.impact = 0;
        this.rotationPulse = 0;
        this.boardShift = null;
        this.clearSurvivalVisualState();
        this.mutationFlash = null;
        this.mutationArrival = null;
        this.activeMutationCarrierId = null;
        this.collapseTrail = null;
        this.clearMutationVisualState();
        this.previousBoard = null;
        this.collapseWasActive = false;
      } else if (event.type === 'piece-locked') {
        this.lockPulse = {
          cells: event.cells,
          elapsed: 0,
          duration: this.options.reducedMotion ? 1 : CELL_STYLE.lockFillDurationMs,
          piece: event.piece,
        };
        if (classic && !clearsOnLock && !endsOnLock) {
          this.enqueueClassicFeedback('landing', {
            cells: this.classicLandingSupportCells(event.cells, state?.board),
          });
        }
        if (state?.mode === 'sprint' && collapseWasActive) {
          this.queueCollapseSettlementTrail(previousBoard, event.cells);
        }
      } else if (event.type === 'hard-dropped') {
        this.impact = this.options.reducedMotion ? 0.25 : 1;
        const lock = events.find((candidate) => candidate.type === 'piece-locked');
        if (lock?.type === 'piece-locked') {
          this.trail = {
            cells: lock.cells,
            distance: event.distance,
            elapsed: 0,
            duration: this.options.reducedMotion ? 1 : 125,
            piece: event.piece,
          };
        }
      } else if (event.type === 'lines-cleared') {
        this.impact = this.options.reducedMotion ? 0.3 : Math.min(1.4, 0.55 + event.count * 0.2);
        if (classic) {
          if ((state?.combo ?? 0) > 1) {
            this.enqueueClassicFeedback('combo', {
              rows: event.rows,
              combo: state?.combo ?? 0,
            });
          }
          const previousLines = Math.max(0, (state?.lines ?? event.count) - event.count);
          const previousTier = Math.floor(previousLines / 10);
          const currentTier = Math.floor((state?.lines ?? previousLines) / 10);
          if (currentTier > previousTier) {
            this.enqueueClassicFeedback('speed-up', { tier: currentTier });
          }
        }
      } else if (event.type === 'survival-stones-spawned') {
        this.impact = Math.max(this.impact, this.options.reducedMotion ? 0.1 : 0.24);
        this.enqueueSurvivalStoneCue('spawn', event.cells);
      } else if (event.type === 'survival-stones-landed') {
        this.impact = Math.max(this.impact, this.options.reducedMotion ? 0.18 : 0.46);
        this.enqueueSurvivalStoneCue('land', event.cells);
      } else if (event.type === 'mutation-activated') {
        this.enqueueMutationFlash({
          item: event.item,
          triggerCells: event.triggerCells ?? [],
          multiplierFactor: event.multiplierFactor ?? 2,
          score: event.score,
          previousBoard,
        });
      } else if (event.type === 'level-up') {
        this.impact = this.options.reducedMotion ? 0.3 : 1.35;
      } else if (event.type === 'game-over' && classic) {
        this.enqueueClassicFeedback('top-out');
      } else if (event.type === 'bedrock-raised' || event.type === 'bedrock-lowered') {
        this.boardShift = this.options.reducedMotion
          ? null
          : {
              direction: event.type === 'bedrock-raised' ? 'up' : 'down',
              elapsed: 0,
              duration: 180,
            };
      }
    }
  }

  /**
   * Compute a trail only for a real independently-settled lock. Carrier
   * activation alone is not enough: the board must already have Collapse
   * active and the incoming cells must actually move farther down a column.
   */
  private queueCollapseSettlementTrail(previousBoard: GameState['board'] | null, cells: readonly Cell[]): void {
    if (!previousBoard || cells.length === 0) return;
    this.collapseIncomingStamp = (this.collapseIncomingStamp + 1) >>> 0;
    if (this.collapseIncomingStamp === 0) {
      this.collapseIncomingStamps.fill(0);
      this.collapseIncomingStamp = 1;
    }
    for (const cell of cells) {
      if (cell.x < 0 || cell.x >= BOARD_WIDTH || cell.y < 0 || cell.y >= BOARD_HEIGHT) continue;
      this.collapseIncomingStamps[cell.y * BOARD_WIDTH + cell.x] = this.collapseIncomingStamp;
    }

    const paths: Array<{ x: number; fromY: number; toY: number }> = [];
    const columns: number[] = [];
    let maxDrop = 0;
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      let destinationY = BOARD_HEIGHT - 1;
      let columnMoved = false;
      for (let y = BOARD_HEIGHT - 1; y >= 0; y -= 1) {
        const incoming = this.collapseIncomingStamps[y * BOARD_WIDTH + x] === this.collapseIncomingStamp;
        if (!incoming && !previousBoard[y]?.[x]) continue;
        if (destinationY > y) {
          paths.push({ x, fromY: y, toY: destinationY });
          columnMoved = true;
          maxDrop = Math.max(maxDrop, destinationY - y);
        }
        destinationY -= 1;
      }
      if (columnMoved) columns.push(x);
    }
    this.collapseTrail = paths.length > 0
      ? { paths, columns, maxDrop, elapsed: 0, duration: 260 }
      : null;
  }

  private advanceEffects(deltaMs: number): void {
    this.mutationClockMs += Math.max(0, deltaMs);
    this.advanceMutationFields(deltaMs);
    this.advanceMutationParticles(deltaMs);
    if (this.trail) {
      this.trail.elapsed += deltaMs;
      if (this.trail.elapsed >= this.trail.duration) this.trail = null;
    }
    if (this.lockPulse) {
      this.lockPulse.elapsed += deltaMs;
      if (this.lockPulse.elapsed >= this.lockPulse.duration) this.lockPulse = null;
    }
    for (let index = this.classicFeedbackCues.length - 1; index >= 0; index -= 1) {
      const cue = this.classicFeedbackCues[index]!;
      cue.elapsed += Math.max(0, deltaMs);
      if (cue.elapsed >= cue.duration) this.classicFeedbackCues.splice(index, 1);
    }
    if (this.boardShift) {
      this.boardShift.elapsed += deltaMs;
      if (this.boardShift.elapsed >= this.boardShift.duration) this.boardShift = null;
    }
    if (this.mutationFlash) {
      this.mutationFlash.timeline.advance(deltaMs);
      this.mutationFlash.elapsed = this.mutationFlash.timeline.elapsed;
      this.emitDeferredBombImpact(this.mutationFlash);
      if (this.mutationFlash.timeline.complete) this.startNextMutationFlash();
    }
    if (this.mutationArrival) {
      this.mutationArrival.elapsed += deltaMs;
      if (this.mutationArrival.elapsed >= this.mutationArrival.duration) this.mutationArrival = null;
    }
    if (this.collapseTrail) {
      this.collapseTrail.elapsed += deltaMs;
      if (this.collapseTrail.elapsed >= this.collapseTrail.duration) this.collapseTrail = null;
    }
    for (let index = this.survivalStoneCues.length - 1; index >= 0; index -= 1) {
      const cue = this.survivalStoneCues[index]!;
      cue.elapsed += Math.max(0, deltaMs);
      if (cue.elapsed >= cue.duration) this.survivalStoneCues.splice(index, 1);
    }
    this.impact = Math.max(0, this.impact - deltaMs / 260);
    this.rotationPulse = Math.max(0, this.rotationPulse - deltaMs / 110);
  }

  private enqueueSurvivalStoneCue(kind: SurvivalStoneCue['kind'], cells: readonly Cell[]): void {
    if (cells.length === 0) return;
    this.survivalStoneCues.push({
      kind,
      cells: cells.map((cell) => ({ ...cell })),
      elapsed: 0,
      duration: this.options.reducedMotion ? 90 : kind === 'spawn' ? 340 : 420,
    });
    if (this.survivalStoneCues.length > 8) {
      this.survivalStoneCues.splice(0, this.survivalStoneCues.length - 8);
    }
  }

  private clearSurvivalVisualState(): void {
    this.survivalDebrisPresentation.clear();
    this.survivalStoneCues.length = 0;
  }

  private advanceSurvivalDebrisPresentation(state: GameState, deltaMs: number): void {
    if (state.mode !== 'race') {
      this.clearSurvivalVisualState();
      return;
    }

    const visibleIds = new Set<number>();
    for (const stone of state.survivalDebris) {
      visibleIds.add(stone.id);
      const current = this.survivalDebrisPresentation.get(stone.id);
      if (
        !current
        || this.options.reducedMotion
        || Math.abs(current.x - stone.x) + Math.abs(current.y - stone.y) > 2.5
      ) {
        this.survivalDebrisPresentation.set(stone.id, { x: stone.x, y: stone.y });
        continue;
      }
      const next = approachPresentationPoint(current, stone, deltaMs, 112);
      current.x = next.x;
      current.y = next.y;
    }
    for (const id of this.survivalDebrisPresentation.keys()) {
      if (!visibleIds.has(id)) this.survivalDebrisPresentation.delete(id);
    }
  }

  private advancePresentation(state: GameState, deltaMs: number): void {
    const active = state.active;
    if (!active) {
      this.presentation = null;
      return;
    }
    if (
      !this.presentation
      || this.presentation.type !== active.type
      || Math.abs(this.presentation.x - active.x) + Math.abs(this.presentation.y - active.y) > 4
      || this.options.reducedMotion
    ) {
      this.presentation = { type: active.type, x: active.x, y: active.y, settleMs: 56 };
      return;
    }
    const next = approachPresentationPoint(
      this.presentation,
      active,
      deltaMs,
      this.presentation.settleMs,
    );
    this.presentation.x = next.x;
    this.presentation.y = next.y;
    this.presentation.settleMs += (64 - this.presentation.settleMs) * Math.min(1, deltaMs / 90);
  }

  private updateSnapshot(state: GameState, layout: BoardLayout, app: Application): void {
    const activeCells = state.active ? cellsForPiece(state.active) : [];
    const distance = dropDistance(state);
    const ghostCells = state.active ? activeCells.map((cell) => ({ x: cell.x, y: cell.y + distance })) : [];
    this.snapshot = {
      canvas: { width: app.screen.width, height: app.screen.height, resolution: app.renderer.resolution },
      board: { x: layout.x, y: layout.y, width: layout.width, height: layout.height, cell: layout.cell },
      preview: this.previewBounds,
      previewLayerVisible: this.previewLayerVisible,
      previewPiece: this.previewPiece,
      previewPieces: [...this.previewPieces],
      previewMutationItem: this.previewMutationItem,
      previewClearBounds: this.previewClearBounds,
      previewClearPiece: this.previewClearPiece,
      scrim: this.scrimBounds,
      activeCells,
      ghostCells,
      visibleLockedCells: this.snapshot.visibleLockedCells,
      presentation: state.active && this.presentation
        ? {
            x: this.presentation.x,
            y: this.presentation.y,
            offsetX: this.presentation.x - state.active.x,
            offsetY: this.presentation.y - state.active.y,
          }
        : null,
      boardShiftOffsetY: this.snapshot.boardShiftOffsetY,
      mutationFilters: {
        freeze: this.mutationFilterState.freeze,
        collapse: this.mutationFilterState.collapse,
        activeCount: Number(this.mutationFilterState.freeze) + Number(this.mutationFilterState.collapse),
      },
      survivalDebris: state.mode === 'race'
        ? state.survivalDebris.map((stone) => ({
            ...stone,
            presentationY: this.survivalDebrisPresentation.get(stone.id)?.y ?? stone.y,
          }))
        : [],
      survivalDebrisWarningColumns: state.mode === 'race' ? [...state.survivalDebrisWarningColumns] : [],
      survivalStoneCueCount: this.survivalStoneCues.length,
    };
  }
}
