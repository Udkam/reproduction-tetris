import { Application, Container, Graphics, Text, type Ticker } from 'pixi.js';
import {
  BOARD_WIDTH,
  LINE_CLEAR_DELAY_TICKS,
  NEXT_QUEUE_SIZE,
  PIECE_SHAPES,
  VISIBLE_HEIGHT,
  VISIBLE_START_ROW,
  cellsForPiece,
  dropDistance,
  type Cell,
  type GameEvent,
  type GameState,
  type PieceType,
} from '../core';
import { COLORS, PIECE_MATERIALS, PIECE_PATTERN_INDEX } from './theme';

interface RenderOptions {
  highContrast: boolean;
  reducedMotion: boolean;
}

interface BoardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  cell: number;
  compact: boolean;
}

interface MotionState {
  dx: number;
  dy: number;
  elapsed: number;
  duration: number;
}

interface TrailState {
  cells: Cell[];
  distance: number;
  elapsed: number;
  duration: number;
  piece: PieceType;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
}

export interface RendererSnapshot {
  canvas: { width: number; height: number; resolution: number };
  board: { x: number; y: number; width: number; height: number; cell: number };
  activeCells: Cell[];
  ghostCells: Cell[];
  visibleLockedCells: number;
}

const easeOutCubic = (value: number): number => 1 - Math.pow(1 - value, 3);

export class TetrisRenderer {
  private app: Application | null = null;
  private readonly world = new Container();
  private readonly boardGraphics = new Graphics();
  private readonly pieceGraphics = new Graphics();
  private readonly effectGraphics = new Graphics();
  private readonly labels = new Container();
  private readonly holdLabel = new Text({
    text: 'HOLD',
    style: { fontFamily: 'JetBrains Mono Variable', fontSize: 11, fill: COLORS.muted, letterSpacing: 2 },
  });
  private readonly nextLabel = new Text({
    text: 'NEXT',
    style: { fontFamily: 'JetBrains Mono Variable', fontSize: 11, fill: COLORS.muted, letterSpacing: 2 },
  });

  private frameCallback: ((deltaMs: number) => void) | null = null;
  private motion: MotionState | null = null;
  private trail: TrailState | null = null;
  private particles: Particle[] = [];
  private impact = 0;
  private rotationPulse = 0;
  private options: RenderOptions = { highContrast: false, reducedMotion: false };
  private snapshot: RendererSnapshot = {
    canvas: { width: 0, height: 0, resolution: 1 },
    board: { x: 0, y: 0, width: 0, height: 0, cell: 0 },
    activeCells: [],
    ghostCells: [],
    visibleLockedCells: 0,
  };

  async init(host: HTMLElement): Promise<void> {
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
    app.canvas.setAttribute('aria-label', 'Signal Foundry falling-block game board');
    app.canvas.setAttribute('role', 'img');
    app.canvas.tabIndex = 0;
    host.appendChild(app.canvas);
    this.world.addChild(this.boardGraphics, this.pieceGraphics, this.effectGraphics, this.labels);
    this.labels.addChild(this.holdLabel, this.nextLabel);
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
      this.motion = null;
      this.trail = null;
      this.particles = [];
      this.impact = 0;
      this.rotationPulse = 0;
    }
  }

  render(state: GameState, events: readonly GameEvent[], deltaMs: number): void {
    const app = this.app;
    if (!app) return;
    this.consumeEvents(events);
    this.advanceEffects(deltaMs);
    const layout = this.calculateLayout(app.screen.width, app.screen.height);
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
    this.app.destroy({ removeView: true }, { children: true });
    this.app = null;
    this.particles = [];
  }

  private readonly onTick = (ticker: Ticker): void => {
    this.frameCallback?.(Math.min(ticker.deltaMS, 100));
  };

  private calculateLayout(width: number, height: number): BoardLayout {
    const compact = width < 620 && height > width * 1.05;
    const topBand = compact ? Math.min(82, height * 0.13) : 0;
    const horizontalAllowance = compact ? 18 : Math.min(260, width * 0.34);
    const cell = Math.max(8, Math.min((height - topBand - 24) / VISIBLE_HEIGHT, (width - horizontalAllowance) / BOARD_WIDTH));
    const boardWidth = cell * BOARD_WIDTH;
    const boardHeight = cell * VISIBLE_HEIGHT;
    return {
      x: (width - boardWidth) / 2,
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
    const pulse = this.options.reducedMotion ? 0 : this.impact;
    const railInset = 7 + pulse * 2;
    graphics
      .roundRect(layout.x + 6, layout.y + 10, layout.width, layout.height, Math.max(8, layout.cell * 0.22))
      .fill({ color: 0x000000, alpha: 0.42 });
    graphics
      .roundRect(layout.x - railInset, layout.y - railInset, layout.width + railInset * 2, layout.height + railInset * 2, Math.max(10, layout.cell * 0.28))
      .stroke({ color: COLORS.signal, alpha: 0.28 + pulse * 0.42, width: 1.5 + pulse * 1.5 });
    graphics
      .roundRect(layout.x - 3, layout.y - 3, layout.width + 6, layout.height + 6, Math.max(8, layout.cell * 0.2))
      .fill({ color: COLORS.panel, alpha: 0.98 })
      .stroke({ color: COLORS.edge, alpha: 0.95, width: 2 });
    graphics.rect(layout.x, layout.y, layout.width, layout.height).fill({ color: COLORS.well, alpha: 1 });

    for (let x = 1; x < BOARD_WIDTH; x += 1) {
      const px = layout.x + x * layout.cell;
      graphics.moveTo(px, layout.y).lineTo(px, layout.y + layout.height).stroke({ color: 0xb7c8ee, alpha: 0.045, width: 1 });
    }
    for (let y = 1; y < VISIBLE_HEIGHT; y += 1) {
      const py = layout.y + y * layout.cell;
      graphics.moveTo(layout.x, py).lineTo(layout.x + layout.width, py).stroke({ color: 0xb7c8ee, alpha: 0.045, width: 1 });
    }

    if (state.status === 'paused') {
      graphics.rect(layout.x, layout.y, layout.width, layout.height).fill({ color: COLORS.background, alpha: 0.38 });
    }
    if (state.status === 'game-over') {
      graphics.rect(layout.x, layout.y, layout.width, layout.height).fill({ color: COLORS.background, alpha: 0.52 });
    }
  }

  private drawPieces(state: GameState, layout: BoardLayout): void {
    const graphics = this.pieceGraphics;
    graphics.clear();
    let visibleLockedCells = 0;

    state.board.forEach((row, boardY) => {
      if (boardY < VISIBLE_START_ROW) return;
      row.forEach((cell, x) => {
        if (!cell) return;
        visibleLockedCells += 1;
        this.drawCell(graphics, layout, x, boardY - VISIBLE_START_ROW, cell, 1, false, 0, 0);
      });
    });

    if (this.trail && !this.options.reducedMotion) {
      const progress = Math.min(1, this.trail.elapsed / this.trail.duration);
      const echoCount = Math.min(6, Math.max(1, this.trail.distance));
      for (let echo = 1; echo <= echoCount; echo += 1) {
        const alpha = (1 - progress) * (0.16 / echo);
        for (const cell of this.trail.cells) {
          const y = cell.y - VISIBLE_START_ROW - echo * Math.max(1, Math.floor(this.trail.distance / echoCount));
          if (y >= 0) this.drawCell(graphics, layout, cell.x, y, this.trail.piece, alpha, false, 0, 0);
        }
      }
    }

    const activeCells = state.active ? cellsForPiece(state.active) : [];
    const ghostCells = state.active
      ? activeCells.map((cell) => ({ x: cell.x, y: cell.y + dropDistance(state) }))
      : [];

    for (const cell of ghostCells) {
      if (cell.y < VISIBLE_START_ROW) continue;
      this.drawCell(graphics, layout, cell.x, cell.y - VISIBLE_START_ROW, state.active!.type, 0.36, true, 0, 0);
    }

    const motionProgress = this.motion ? Math.min(1, this.motion.elapsed / this.motion.duration) : 1;
    const motionEase = easeOutCubic(motionProgress);
    const offsetX = this.motion && !this.options.reducedMotion ? -this.motion.dx * layout.cell * (1 - motionEase) : 0;
    const offsetY = this.motion && !this.options.reducedMotion ? -this.motion.dy * layout.cell * (1 - motionEase) : 0;
    const rotationScale = this.options.reducedMotion ? 1 : 1 + this.rotationPulse * 0.035;
    for (const cell of activeCells) {
      if (cell.y < VISIBLE_START_ROW) continue;
      this.drawCell(
        graphics,
        layout,
        cell.x,
        cell.y - VISIBLE_START_ROW,
        state.active!.type,
        1,
        false,
        offsetX,
        offsetY,
        rotationScale,
      );
    }

    this.snapshot.visibleLockedCells = visibleLockedCells;
  }

  private drawCell(
    graphics: Graphics,
    layout: BoardLayout,
    gridX: number,
    gridY: number,
    type: PieceType,
    alpha: number,
    ghost: boolean,
    offsetX: number,
    offsetY: number,
    scale = 1,
  ): void {
    const material = PIECE_MATERIALS[type];
    const gap = Math.max(1.25, layout.cell * 0.055);
    const size = (layout.cell - gap * 2) * scale;
    const scaleInset = (layout.cell - gap * 2 - size) / 2;
    const x = layout.x + gridX * layout.cell + gap + scaleInset + offsetX;
    const y = layout.y + gridY * layout.cell + gap + scaleInset + offsetY;
    const radius = Math.max(2.5, layout.cell * 0.11);

    if (ghost) {
      graphics
        .roundRect(x, y, size, size, radius)
        .fill({ color: material.outer, alpha: alpha * 0.08 })
        .stroke({ color: material.inner, alpha, width: Math.max(1, layout.cell * 0.045) });
      return;
    }

    graphics.roundRect(x + 1, y + 2, size, size, radius).fill({ color: 0x000000, alpha: alpha * 0.26 });
    graphics.roundRect(x, y, size, size, radius).fill({ color: material.outer, alpha });
    const inset = Math.max(2, layout.cell * 0.105);
    graphics
      .roundRect(x + inset, y + inset, size - inset * 2, size - inset * 2, Math.max(1.5, radius * 0.56))
      .fill({ color: material.inner, alpha: alpha * 0.82 });
    graphics
      .roundRect(x + inset, y + inset, size - inset * 2, Math.max(1, layout.cell * 0.055), radius * 0.4)
      .fill({ color: material.highlight, alpha: alpha * 0.58 });

    if (this.options.highContrast) this.drawPattern(graphics, type, x, y, size, alpha);
  }

  private drawPattern(graphics: Graphics, type: PieceType, x: number, y: number, size: number, alpha: number): void {
    const pattern = PIECE_PATTERN_INDEX[type];
    const color = 0x08101e;
    const lineWidth = Math.max(1, size * 0.045);
    if (pattern === 0 || pattern === 3) {
      const offset = pattern === 0 ? 0.35 : 0.65;
      graphics.moveTo(x + size * 0.18, y + size * offset).lineTo(x + size * 0.82, y + size * offset).stroke({ color, alpha: alpha * 0.62, width: lineWidth });
    } else if (pattern === 1 || pattern === 4) {
      const radius = size * (pattern === 1 ? 0.1 : 0.16);
      graphics.circle(x + size / 2, y + size / 2, radius).stroke({ color, alpha: alpha * 0.62, width: lineWidth });
    } else if (pattern === 2 || pattern === 5) {
      const reverse = pattern === 5;
      graphics
        .moveTo(x + size * 0.2, y + size * (reverse ? 0.25 : 0.75))
        .lineTo(x + size * 0.8, y + size * (reverse ? 0.75 : 0.25))
        .stroke({ color, alpha: alpha * 0.62, width: lineWidth });
    } else {
      graphics.roundRect(x + size * 0.27, y + size * 0.27, size * 0.46, size * 0.46, size * 0.08).stroke({ color, alpha: alpha * 0.62, width: lineWidth });
    }
  }

  private drawEffects(state: GameState, layout: BoardLayout): void {
    const graphics = this.effectGraphics;
    graphics.clear();
    if (state.phase === 'line-clear') {
      const progress = Math.min(1, state.phaseTicks / LINE_CLEAR_DELAY_TICKS);
      const width = layout.width * Math.sin(progress * Math.PI);
      for (const row of state.pendingClearRows) {
        if (row < VISIBLE_START_ROW) continue;
        const y = layout.y + (row - VISIBLE_START_ROW) * layout.cell;
        graphics
          .rect(layout.x + (layout.width - width) / 2, y + layout.cell * 0.12, width, layout.cell * 0.76)
          .fill({ color: COLORS.signal, alpha: this.options.reducedMotion ? 0.32 : 0.2 + progress * 0.42 });
      }
    }

    for (const particle of this.particles) {
      if (particle.life <= 0) continue;
      const alpha = particle.life / particle.maxLife;
      graphics.circle(layout.x + particle.x * layout.cell, layout.y + particle.y * layout.cell, Math.max(1, layout.cell * 0.055)).fill({ color: particle.color, alpha });
    }
  }

  private drawPreviews(state: GameState, layout: BoardLayout): void {
    const graphics = this.pieceGraphics;
    const width = this.app?.screen.width ?? 0;
    if (layout.compact) {
      const topY = Math.max(8, layout.y - Math.min(72, layout.cell * 2.2));
      const unit = Math.max(4, Math.min(8, layout.cell * 0.24));
      const holdCenterX = layout.x + layout.cell * 1.5;
      this.drawPreviewCard(graphics, holdCenterX, topY + 26, layout.cell * 2.8, 48);
      if (state.hold) this.drawPreviewPiece(graphics, state.hold, holdCenterX, topY + 30, unit);
      const queueStart = layout.x + layout.cell * 4.3;
      state.queue.slice(0, NEXT_QUEUE_SIZE).forEach((piece, index) => {
        const centerX = queueStart + index * layout.cell * 1.18;
        this.drawPreviewPiece(graphics, piece, centerX, topY + 30, unit * (index === 0 ? 1 : 0.78));
      });
      this.holdLabel.position.set(layout.x, topY - 4);
      this.nextLabel.position.set(queueStart - layout.cell, topY - 4);
    } else {
      const sideWidth = Math.max(92, (width - layout.width) / 2 - 22);
      const leftX = Math.max(12, layout.x - sideWidth - 14);
      const rightX = layout.x + layout.width + 14;
      const cardWidth = Math.max(78, sideWidth);
      this.drawPreviewCard(graphics, leftX + cardWidth / 2, layout.y + layout.cell * 2.15, cardWidth, layout.cell * 3.3);
      if (state.hold) this.drawPreviewPiece(graphics, state.hold, leftX + cardWidth / 2, layout.y + layout.cell * 2.2, Math.min(14, layout.cell * 0.48));
      state.queue.slice(0, NEXT_QUEUE_SIZE).forEach((piece, index) => {
        const centerY = layout.y + layout.cell * (1.6 + index * 3.55);
        const scale = index === 0 ? 0.48 : 0.38;
        this.drawPreviewCard(graphics, rightX + cardWidth / 2, centerY, cardWidth, layout.cell * 2.9);
        this.drawPreviewPiece(graphics, piece, rightX + cardWidth / 2, centerY, Math.min(14, layout.cell * scale));
      });
      this.holdLabel.position.set(leftX, layout.y);
      this.nextLabel.position.set(rightX, layout.y);
    }
  }

  private drawPreviewCard(graphics: Graphics, centerX: number, centerY: number, width: number, height: number): void {
    graphics
      .roundRect(centerX - width / 2, centerY - height / 2, width, height, 10)
      .fill({ color: COLORS.panel, alpha: 0.72 })
      .stroke({ color: COLORS.edge, alpha: 0.72, width: 1 });
  }

  private drawPreviewPiece(graphics: Graphics, type: PieceType, centerX: number, centerY: number, unit: number): void {
    const shape = PIECE_SHAPES[type][0];
    const minX = Math.min(...shape.map((cell) => cell.x));
    const maxX = Math.max(...shape.map((cell) => cell.x));
    const minY = Math.min(...shape.map((cell) => cell.y));
    const maxY = Math.max(...shape.map((cell) => cell.y));
    const width = (maxX - minX + 1) * unit;
    const height = (maxY - minY + 1) * unit;
    const material = PIECE_MATERIALS[type];
    for (const cell of shape) {
      const x = centerX - width / 2 + (cell.x - minX) * unit;
      const y = centerY - height / 2 + (cell.y - minY) * unit;
      graphics.roundRect(x + 0.7, y + 0.7, unit - 1.4, unit - 1.4, Math.max(1.5, unit * 0.16)).fill({ color: material.outer, alpha: 0.94 });
      graphics.roundRect(x + unit * 0.24, y + unit * 0.24, unit * 0.52, unit * 0.52, Math.max(1, unit * 0.08)).fill({ color: material.inner, alpha: 0.8 });
    }
  }

  private consumeEvents(events: readonly GameEvent[]): void {
    for (const event of events) {
      if (event.type === 'piece-moved') {
        this.motion = {
          dx: event.dx,
          dy: event.dy,
          elapsed: 0,
          duration: this.options.reducedMotion ? 1 : event.cause === 'soft-drop' ? 42 : 62,
        };
      } else if (event.type === 'piece-rotated') {
        this.rotationPulse = this.options.reducedMotion ? 0 : 1;
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
        if (!this.options.reducedMotion) this.spawnClearParticles(event.rows, event.count);
      } else if (event.type === 'level-up') {
        this.impact = this.options.reducedMotion ? 0.3 : 1.35;
      }
    }
  }

  private spawnClearParticles(rows: readonly number[], count: number): void {
    const color = count === 4 ? COLORS.signal : COLORS.text;
    rows.forEach((row, rowIndex) => {
      if (row < VISIBLE_START_ROW) return;
      for (let index = 0; index < 14; index += 1) {
        const direction = index % 2 === 0 ? -1 : 1;
        this.particles.push({
          x: 5 + direction * (index % 7) * 0.42,
          y: row - VISIBLE_START_ROW + 0.5,
          vx: direction * (1.3 + (index % 4) * 0.38),
          vy: -0.8 - rowIndex * 0.15 + (index % 3) * 0.32,
          life: 420,
          maxLife: 420,
          color,
        });
      }
    });
    if (this.particles.length > 180) this.particles = this.particles.slice(-180);
  }

  private advanceEffects(deltaMs: number): void {
    if (this.motion) {
      this.motion.elapsed += deltaMs;
      if (this.motion.elapsed >= this.motion.duration) this.motion = null;
    }
    if (this.trail) {
      this.trail.elapsed += deltaMs;
      if (this.trail.elapsed >= this.trail.duration) this.trail = null;
    }
    this.impact = Math.max(0, this.impact - deltaMs / 260);
    this.rotationPulse = Math.max(0, this.rotationPulse - deltaMs / 110);
    for (const particle of this.particles) {
      particle.life -= deltaMs;
      particle.x += particle.vx * (deltaMs / 1000);
      particle.y += particle.vy * (deltaMs / 1000);
      particle.vy += 3.4 * (deltaMs / 1000);
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  private updateSnapshot(state: GameState, layout: BoardLayout, app: Application): void {
    const activeCells = state.active ? cellsForPiece(state.active) : [];
    const distance = dropDistance(state);
    const ghostCells = state.active ? activeCells.map((cell) => ({ x: cell.x, y: cell.y + distance })) : [];
    this.snapshot = {
      canvas: { width: app.screen.width, height: app.screen.height, resolution: app.renderer.resolution },
      board: { x: layout.x, y: layout.y, width: layout.width, height: layout.height, cell: layout.cell },
      activeCells,
      ghostCells,
      visibleLockedCells: this.snapshot.visibleLockedCells,
    };
  }
}
