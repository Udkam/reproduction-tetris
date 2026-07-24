import { Application, Container, FillGradient, Graphics, type Ticker } from 'pixi.js';
import {
  BOARD_WIDTH,
  ANCHOR_CELL,
  BEDROCK_CELL,
  PIECE_SHAPES,
  VISIBLE_HEIGHT,
  VISIBLE_START_ROW,
  cellsForPiece,
  dropDistance,
  type Cell,
  type GameEvent,
  type GameState,
  type MutationItem,
  type BoardMaterial,
  type PieceType,
} from '../core';
import { ANCHOR_MATERIAL, BEDROCK_MATERIAL, CELL_STYLE, COLORS, MUTATION_MATERIALS, PIECE_MATERIALS, type PieceMaterial } from './theme';
import {
  activePresentationScaleFitsVisibleWell,
  approachPresentationPoint,
  boardShiftPresentationOffset,
  clampActivePresentationOffsetY,
  exposedCellEdges,
  internalCellSeams,
  lineClearPresentationProgress,
  nextPreviewPieces,
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

interface BoardShift {
  direction: BoardShiftDirection;
  elapsed: number;
  duration: number;
}

interface MutationFlash {
  item: MutationItem;
  elapsed: number;
  duration: number;
}

interface MutationArrival {
  carrierId: number;
  elapsed: number;
  duration: number;
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
  previewClearBounds: { x: number; y: number; width: number; height: number } | null;
  previewClearPiece: PieceType | null;
  scrim: { x: number; y: number; width: number; height: number } | null;
  activeCells: Cell[];
  ghostCells: Cell[];
  visibleLockedCells: number;
  presentation: { x: number; y: number; offsetX: number; offsetY: number } | null;
  boardShiftOffsetY: number;
}

const easeOutCubic = (value: number): number => 1 - Math.pow(1 - value, 3);

export class TetrisRenderer {
  private app: Application | null = null;
  private host: HTMLElement | null = null;
  private readonly world = new Container();
  private readonly boardGraphics = new Graphics();
  private readonly pieceGraphics = new Graphics();
  private readonly effectGraphics = new Graphics();
  private readonly cellGradients = new Map<BoardMaterial, FillGradient>();
  private readonly overrideGradients = new Map<PieceMaterial, FillGradient>();

  private frameCallback: ((deltaMs: number) => void) | null = null;
  private presentation: PiecePresentation | null = null;
  private trail: TrailState | null = null;
  private lockPulse: LockPulse | null = null;
  private impact = 0;
  private rotationPulse = 0;
  private boardShift: BoardShift | null = null;
  private mutationFlash: MutationFlash | null = null;
  private mutationArrival: MutationArrival | null = null;
  private activeMutationCarrierId: number | null = null;
  private options: RenderOptions = { reducedMotion: false, modeSwitch: false };
  private previewBounds: RendererSnapshot['preview'] = null;
  private previewLayerVisible = false;
  private previewPiece: PieceType | null = null;
  private previewPieces: PieceType[] = [];
  private lastPreviewBounds: RendererSnapshot['preview'] = null;
  private lastPreviewPiece: PieceType | null = null;
  private previewClearBounds: RendererSnapshot['previewClearBounds'] = null;
  private previewClearPiece: PieceType | null = null;
  private scrimBounds: RendererSnapshot['scrim'] = null;
  private snapshot: RendererSnapshot = {
    canvas: { width: 0, height: 0, resolution: 1 },
    board: { x: 0, y: 0, width: 0, height: 0, cell: 0 },
    preview: null,
    previewLayerVisible: false,
    previewPiece: null,
    previewPieces: [],
    previewClearBounds: null,
    previewClearPiece: null,
    scrim: null,
    activeCells: [],
    ghostCells: [],
    visibleLockedCells: 0,
    presentation: null,
    boardShiftOffsetY: 0,
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
    app.canvas.setAttribute('aria-label', 'Tetris 10 × 20 游戏棋盘');
    app.canvas.setAttribute('role', 'img');
    app.canvas.tabIndex = 0;
    host.appendChild(app.canvas);
    this.world.addChild(this.boardGraphics, this.pieceGraphics, this.effectGraphics);
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
      this.mutationFlash = null;
      this.mutationArrival = null;
      this.activeMutationCarrierId = null;
    }
  }

  render(state: GameState, events: readonly GameEvent[], deltaMs: number): void {
    const app = this.app;
    if (!app) return;
    this.consumeEvents(events);
    this.advanceEffects(deltaMs);
    this.advancePresentation(state, deltaMs);
    const layout = this.calculateLayout(app.screen.width, app.screen.height, state.status === 'ready');
    this.drawBoard(state, layout);
    this.drawPieces(state, layout);
    this.drawEffects(state, layout);
    this.drawPreviews(state, layout);
    this.updateSnapshot(state, layout, app);
  }

  getSnapshot(): RendererSnapshot {
    return structuredClone(this.snapshot);
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
    for (const gradient of this.cellGradients.values()) gradient.destroy();
    this.cellGradients.clear();
    for (const gradient of this.overrideGradients.values()) gradient.destroy();
    this.overrideGradients.clear();
    this.app.destroy({ removeView: true }, { children: true });
    this.app = null;
    this.host = null;
    this.presentation = null;
    this.lockPulse = null;
    this.mutationFlash = null;
    this.mutationArrival = null;
    this.activeMutationCarrierId = null;
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
    graphics
      .roundRect(layout.x, layout.y, layout.width, layout.height, radius)
      .fill({ color: COLORS.well, alpha: 1 })
      .stroke({ color: COLORS.edge, alpha: .86, width: Math.max(1, layout.cell * 0.035) });
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
    const activeMutationMaterial = state.mode === 'sprint' && state.mutationActiveCarrier
      ? this.mutationMaterial(state.mutationActiveCarrier.item)
      : undefined;
    if (state.active) {
      this.drawCellGroups(graphics, visibleGhostCells, state.active.type, 0.82, {
        originX: layout.x,
        originY: layout.y,
        unit: layout.cell,
        offsetX: ghostOffsetX,
        ghost: true,
        material: activeMutationMaterial,
      });
    }

    const offsetX = this.presentation && state.active && !this.options.reducedMotion
      ? (this.presentation.x - state.active.x) * layout.cell
      : 0;
    const rawOffsetY = this.presentation && state.active && !this.options.reducedMotion
      ? (this.presentation.y - state.active.y) * layout.cell
      : 0;
    const visibleActiveCells = activeCells
      .filter((cell) => cell.y >= VISIBLE_START_ROW && cell.y < VISIBLE_START_ROW + VISIBLE_HEIGHT)
      .map((cell) => ({ x: cell.x, y: cell.y - VISIBLE_START_ROW }));
    const offsetY = clampActivePresentationOffsetY(rawOffsetY, visibleActiveCells, layout.cell, VISIBLE_HEIGHT);
    const requestedRotationScale = this.options.reducedMotion ? 1 : 1 + this.rotationPulse * 0.035;
    const requestedCarrierScale = requestedRotationScale * this.mutationArrivalScale();
    const rotationScale = activePresentationScaleFitsVisibleWell(
      visibleActiveCells,
      offsetY,
      layout.cell,
      VISIBLE_HEIGHT,
      requestedCarrierScale,
    )
      ? requestedCarrierScale
      : 1;
    if (state.active) {
      this.drawMutationArrivalPulse(
        graphics,
        visibleActiveCells,
        state.mutationActiveCarrier?.item ?? null,
        layout,
        offsetX,
        offsetY,
      );
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
          material: activeMutationMaterial,
        },
      );
      this.drawActiveMutationCarrierMaterial(graphics, state, visibleActiveCells, layout, offsetX, offsetY);
    }

    this.snapshot.visibleLockedCells = visibleLockedCells;
    this.snapshot.boardShiftOffsetY = boardShiftOffsetY;
    this.pieceGraphics.alpha = this.options.modeSwitch ? 0.34 : 1;
    this.effectGraphics.alpha = this.options.modeSwitch ? 0.2 : 1;
  }

  private drawPuzzleTargetMarkers(graphics: Graphics, state: GameState, layout: BoardLayout, offsetY: number): void {
    if (state.mode !== 'puzzle' || state.puzzleTargetCells.length === 0) return;
    const inset = Math.max(2, layout.cell * 0.19);
    const bracket = Math.max(5, layout.cell * 0.36);
    const stroke = Math.max(1, layout.cell * 0.038);
    for (const cell of state.puzzleTargetCells) {
      if (cell.y < VISIBLE_START_ROW || cell.y >= VISIBLE_START_ROW + VISIBLE_HEIGHT) continue;
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

  private mutationColor(item: MutationItem): number {
    return this.mutationMaterial(item).fillStart;
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
      : { carrierId, elapsed: 0, duration: 440 };
  }

  private mutationArrivalScale(): number {
    if (!this.mutationArrival || this.options.reducedMotion) return 1;
    const progress = Math.min(1, this.mutationArrival.elapsed / this.mutationArrival.duration);
    return 1 + (1 - easeOutCubic(progress)) * 0.065;
  }

  private drawMutationArrivalPulse(
    graphics: Graphics,
    cells: readonly Cell[],
    item: MutationItem | null,
    layout: BoardLayout,
    offsetX: number,
    offsetY: number,
  ): void {
    if (!item || !this.mutationArrival || this.options.reducedMotion || cells.length === 0) return;
    const progress = Math.min(1, this.mutationArrival.elapsed / this.mutationArrival.duration);
    const alpha = Math.max(0, 0.18 * (1 - easeOutCubic(progress)));
    if (alpha === 0) return;
    this.drawCellGroups(graphics, cells, 'O', alpha, {
      originX: layout.x,
      originY: layout.y,
      unit: layout.cell,
      offsetX,
      offsetY,
      scale: 1.12 - progress * 0.08,
      faceColor: this.mutationColor(item),
      material: this.mutationMaterial(item),
    });
  }

  private drawMutationCarrierMaterials(graphics: Graphics, state: GameState, layout: BoardLayout, offsetY: number): void {
    if (state.mode !== 'sprint') return;
    for (const carrier of state.mutationCarriers) {
      const cells = carrier.cells
        .filter((cell) => cell.y >= VISIBLE_START_ROW && cell.y < VISIBLE_START_ROW + VISIBLE_HEIGHT)
        .map((cell) => ({ x: cell.x, y: cell.y - VISIBLE_START_ROW }));
      if (cells.length === 0) continue;
      this.drawCellGroups(graphics, cells, 'O', 1, {
        originX: layout.x,
        originY: layout.y,
        unit: layout.cell,
        offsetY,
        material: this.mutationMaterial(carrier.item),
      });
      this.drawMutationMaterialEmblems(graphics, cells, carrier.item, layout, 0, offsetY);
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
    this.drawMutationMaterialEmblems(graphics, cells, state.mutationActiveCarrier.item, layout, offsetX, offsetY);
  }

  private drawMutationMaterialEmblems(
    graphics: Graphics,
    cells: readonly Cell[],
    item: MutationItem,
    layout: BoardLayout,
    offsetX = 0,
    offsetY = 0,
  ): void {
    const material = this.mutationMaterial(item);
    const strokeWidth = Math.max(1, layout.cell * 0.052);
    for (const cell of cells) {
      if (cell.y < 0 || cell.y >= VISIBLE_HEIGHT) continue;
      const x = layout.x + cell.x * layout.cell + offsetX;
      const y = layout.y + cell.y * layout.cell + offsetY;
      const centerX = x + layout.cell * 0.5;
      const centerY = y + layout.cell * 0.5;
      const inset = layout.cell * 0.23;
      if (item === 'freeze') {
        graphics.roundRect(x + inset, y + inset, layout.cell - inset * 2, layout.cell - inset * 2, Math.max(1, layout.cell * 0.1))
          .fill({ color: material.innerEdge, alpha: 0.18 });
        this.strokeSegments(graphics, [
          [centerX, y + inset * .72, centerX, y + layout.cell - inset * .72],
          [x + inset * .72, centerY, x + layout.cell - inset * .72, centerY],
          [x + inset * 1.1, y + inset * 1.1, x + layout.cell - inset * 1.1, y + layout.cell - inset * 1.1],
        ], material.innerEdge, 0.78, strokeWidth);
      } else if (item === 'collapse') {
        this.strokeSegments(graphics, [
          [centerX, y + inset * .7, centerX, y + layout.cell - inset * 1.05],
          [centerX, y + layout.cell - inset * 1.05, centerX - layout.cell * .16, y + layout.cell - inset * 1.6],
          [centerX, y + layout.cell - inset * 1.05, centerX + layout.cell * .16, y + layout.cell - inset * 1.6],
          [x + inset, y + inset * .85, x + layout.cell - inset, y + inset * .85],
        ], material.innerEdge, 0.88, strokeWidth);
      } else if (item === 'bomb') {
        graphics.circle(centerX, centerY + layout.cell * .04, Math.max(2, layout.cell * .17)).fill({ color: 0x301d22, alpha: 0.9 });
        graphics.circle(centerX, centerY - layout.cell * .1, Math.max(1.5, layout.cell * .09)).fill({ color: material.innerEdge, alpha: 0.96 });
        this.strokeSegments(graphics, [
          [centerX, y + inset * .45, centerX + layout.cell * .1, y + inset * .05],
          [centerX + layout.cell * .1, y + inset * .05, centerX + layout.cell * .2, y + inset * .32],
        ], 0xffd18d, 0.95, strokeWidth);
      } else {
        graphics.circle(centerX, centerY, Math.max(2, layout.cell * .13)).fill({ color: material.innerEdge, alpha: 0.42 });
        this.strokeSegments(graphics, [
          [centerX, y + inset * .55, centerX, y + layout.cell - inset * .55],
          [x + inset * .55, centerY, x + layout.cell - inset * .55, centerY],
          [x + inset * 1.05, y + inset * 1.05, x + layout.cell - inset * 1.05, y + layout.cell - inset * 1.05],
          [x + layout.cell - inset * 1.05, y + inset * 1.05, x + inset * 1.05, y + layout.cell - inset * 1.05],
        ], material.innerEdge, 0.92, strokeWidth);
      }
    }
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
    return type === BEDROCK_CELL ? BEDROCK_MATERIAL : PIECE_MATERIALS[type];
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

  private drawEffects(state: GameState, layout: BoardLayout): void {
    const graphics = this.effectGraphics;
    graphics.clear();
    if (this.mutationFlash) {
      const progress = Math.min(1, this.mutationFlash.elapsed / this.mutationFlash.duration);
      this.drawMutationActivationEffect(graphics, this.mutationFlash.item, progress, layout);
    }
    if (state.phase === 'line-clear' && !this.options.reducedMotion) {
      const progress = lineClearPresentationProgress(state.phaseTicks, false);
      const width = layout.width * Math.sin(progress * Math.PI);
      for (const row of state.pendingClearRows) {
        if (row < VISIBLE_START_ROW) continue;
        const y = layout.y + (row - VISIBLE_START_ROW) * layout.cell;
        graphics
          .rect(layout.x + (layout.width - width) / 2, y + layout.cell * 0.12, width, layout.cell * 0.76)
          .fill({ color: COLORS.classic, alpha: 0.18 + progress * 0.4 });
      }
    }

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
    const hostBounds = this.host?.getBoundingClientRect();
    const slot = document.querySelector<HTMLElement>('[data-testid="next-slot"]')?.getBoundingClientRect();
    if (hostBounds && slot && slot.width > 0 && slot.height > 0) {
      const x = slot.left - hostBounds.left;
      const y = slot.top - hostBounds.top;
      // The slot is a DOM geometry anchor above the canvas. Its old opaque CSS
      // background hid the canvas-drawn Next tetromino, so the renderer owns both
      // the well and the piece on the same canvas layer.
      this.drawPreviewBackdrop(x, y, slot.width, slot.height);
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
      this.drawPreviewPieces(graphics, previews, x, y, slot.width, slot.height);
      this.previewBounds = { x, y, width: slot.width, height: slot.height };
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
      this.drawPreviewPieces(graphics, previews, this.previewBounds.x, this.previewBounds.y, this.previewBounds.width, this.previewBounds.height);
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
      this.drawPreviewPieces(graphics, previews, this.previewBounds.x, this.previewBounds.y, this.previewBounds.width, this.previewBounds.height);
      this.previewLayerVisible = previews.length > 0;
      this.previewPieces = [...previews];
      this.previewPiece = previews[0] ?? null;
      this.lastPreviewBounds = this.previewBounds;
      this.lastPreviewPiece = this.previewPiece;
    }
  }

  private drawPreviewBackdrop(x: number, y: number, width: number, height: number): void {
    const radius = Math.max(6, Math.min(8, Math.min(width, height) * 0.075));
    this.boardGraphics
      .roundRect(x, y, width, height, radius)
      .fill({ color: COLORS.well, alpha: 1 })
      .stroke({ color: COLORS.edge, alpha: 0.86, width: 1 });
  }

  private drawPreviewPiece(graphics: Graphics, type: PieceType, centerX: number, centerY: number, unit: number): void {
    const shape = PIECE_SHAPES[type][0];
    const minX = Math.min(...shape.map((cell) => cell.x));
    const maxX = Math.max(...shape.map((cell) => cell.x));
    const minY = Math.min(...shape.map((cell) => cell.y));
    const maxY = Math.max(...shape.map((cell) => cell.y));
    const width = (maxX - minX + 1) * unit;
    const height = (maxY - minY + 1) * unit;
    this.drawCellGroups(graphics, shape, type, 0.96, {
      originX: centerX - width / 2 - minX * unit,
      originY: centerY - height / 2 - minY * unit,
      unit,
    });
  }

  private drawPreviewPieces(
    graphics: Graphics,
    pieces: readonly PieceType[],
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    if (!pieces.length) return;
    const dualPreview = pieces.length > 1;
    const unit = dualPreview
      ? Math.max(4, Math.min(15, width / 5, height / 6.4))
      : Math.max(5, Math.min(15, width / 5, height / 3));
    for (const [index, piece] of pieces.entries()) {
      const centerY = y + height * ((index + 0.5) / pieces.length);
      this.drawPreviewPiece(graphics, piece, x + width / 2, centerY, unit);
    }
  }

  private drawMutationActivationEffect(graphics: Graphics, item: MutationItem, progress: number, layout: BoardLayout): void {
    const staticAlpha = this.options.reducedMotion ? 0.72 : Math.max(0, 1 - progress);
    const material = this.mutationMaterial(item);
    const strokeWidth = Math.max(1, layout.cell * 0.062);
    if (item === 'freeze') {
      const inset = Math.max(3, layout.cell * .22);
      graphics.roundRect(layout.x + inset, layout.y + inset, layout.width - inset * 2, layout.height - inset * 2, Math.max(8, layout.cell * .34))
        .stroke({ color: material.innerEdge, alpha: 0.42 * staticAlpha, width: strokeWidth });
      for (const offset of [0.2, 0.5, 0.8]) {
        const x = layout.x + layout.width * offset;
        graphics.circle(x, layout.y + inset, Math.max(1.5, layout.cell * .06)).fill({ color: material.innerEdge, alpha: 0.82 * staticAlpha });
      }
      return;
    }
    if (item === 'collapse') {
      const y = layout.y + layout.height * .34;
      const length = layout.cell * 1.25;
      const segments: Array<readonly [number, number, number, number]> = [];
      for (const offset of [0.24, 0.5, 0.76]) {
        const x = layout.x + layout.width * offset;
        segments.push([x, y, x, y + length], [x, y + length, x - layout.cell * .18, y + length - layout.cell * .25], [x, y + length, x + layout.cell * .18, y + length - layout.cell * .25]);
      }
      this.strokeSegments(graphics, segments, material.innerEdge, 0.64 * staticAlpha, strokeWidth);
      return;
    }
    if (item === 'bomb') {
      const rows = Math.min(3, VISIBLE_HEIGHT);
      const y = layout.y + layout.height - layout.cell * rows;
      graphics.roundRect(layout.x + layout.cell * .13, y + layout.cell * .13, layout.width - layout.cell * .26, layout.cell * rows - layout.cell * .26, Math.max(5, layout.cell * .24))
        .fill({ color: material.fillStart, alpha: 0.21 * staticAlpha })
        .stroke({ color: material.innerEdge, alpha: 0.72 * staticAlpha, width: strokeWidth });
      const centerX = layout.x + layout.width * .5;
      const centerY = y + layout.cell * 1.45;
      graphics.circle(centerX, centerY, Math.max(5, layout.cell * .42)).fill({ color: 0xffd08c, alpha: 0.56 * staticAlpha });
      return;
    }
    const centerX = layout.x + layout.width * .5;
    const centerY = layout.y + layout.height * .42;
    const radius = Math.max(4, layout.cell * .34);
    const segments: Array<readonly [number, number, number, number]> = [];
    for (const [xFactor, yFactor] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
      segments.push([centerX + xFactor * radius * .45, centerY + yFactor * radius * .45, centerX + xFactor * radius, centerY + yFactor * radius]);
    }
    graphics.circle(centerX, centerY, radius * .38).fill({ color: material.innerEdge, alpha: 0.52 * staticAlpha });
    this.strokeSegments(graphics, segments, material.innerEdge, 0.82 * staticAlpha, strokeWidth);
  }

  private consumeEvents(events: readonly GameEvent[]): void {
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
        this.mutationFlash = null;
        this.mutationArrival = null;
        this.activeMutationCarrierId = null;
      } else if (event.type === 'puzzle-undone') {
        // Undo restores a pre-lock Core snapshot. Any lock, trail, line-impact, or
        // interpolation residue belongs to the discarded timeline and must not
        // linger over the restored board for a frame.
        this.presentation = null;
        this.trail = null;
        this.lockPulse = null;
        this.impact = 0;
        this.rotationPulse = 0;
        this.boardShift = null;
        this.mutationFlash = null;
        this.mutationArrival = null;
        this.activeMutationCarrierId = null;
      } else if (event.type === 'piece-locked') {
        this.lockPulse = {
          cells: event.cells,
          elapsed: 0,
          duration: this.options.reducedMotion ? 1 : CELL_STYLE.lockFillDurationMs,
          piece: event.piece,
        };
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
      } else if (event.type === 'mutation-activated') {
        this.mutationFlash = {
          item: event.item,
          elapsed: 0,
          duration: this.options.reducedMotion ? 240 : event.item === 'bomb' ? 460 : 400,
        };
        this.impact = this.options.reducedMotion ? 0.3 : 1.05;
      } else if (event.type === 'level-up') {
        this.impact = this.options.reducedMotion ? 0.3 : 1.35;
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

  private advanceEffects(deltaMs: number): void {
    if (this.trail) {
      this.trail.elapsed += deltaMs;
      if (this.trail.elapsed >= this.trail.duration) this.trail = null;
    }
    if (this.lockPulse) {
      this.lockPulse.elapsed += deltaMs;
      if (this.lockPulse.elapsed >= this.lockPulse.duration) this.lockPulse = null;
    }
    if (this.boardShift) {
      this.boardShift.elapsed += deltaMs;
      if (this.boardShift.elapsed >= this.boardShift.duration) this.boardShift = null;
    }
    if (this.mutationFlash) {
      this.mutationFlash.elapsed += deltaMs;
      if (this.mutationFlash.elapsed >= this.mutationFlash.duration) this.mutationFlash = null;
    }
    if (this.mutationArrival) {
      this.mutationArrival.elapsed += deltaMs;
      if (this.mutationArrival.elapsed >= this.mutationArrival.duration) this.mutationArrival = null;
    }
    this.impact = Math.max(0, this.impact - deltaMs / 260);
    this.rotationPulse = Math.max(0, this.rotationPulse - deltaMs / 110);
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
    };
  }
}
