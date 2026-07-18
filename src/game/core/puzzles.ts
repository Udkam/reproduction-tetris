import { BOARD_WIDTH, VISIBLE_HEIGHT, VISIBLE_START_ROW } from './constants';
import { canPlace, createBoard, fullRows, mergePiece } from './board';
import { cellsForPiece, createSpawnPiece } from './pieces';
import { createRandomizer, drawPiece } from './random';
import { ANCHOR_CELL, PIECE_TYPES, type ActivePiece, type Board, type Cell, type PieceType, type PuzzleId, type Rotation } from './types';

export interface PuzzleCell {
  x: number;
  /** Visible-board coordinate, where 0 is the top and 19 is the floor. */
  y: number;
  type: PieceType;
}

export interface PuzzleDefinition {
  id: PuzzleId;
  name: string;
  /** Stable level-owned seed for the shared deterministic seven-bag. */
  seed: number;
  /** Separate legal zero-clear stacking history that authors the starting endgame. */
  setup: PuzzleSetup;
  /** Exactly twenty rows, each with the visible board width. */
  boardRows: readonly string[];
  /** Always empty for authored T5 levels; makes hidden-buffer validation explicit. */
  hiddenCells: readonly PuzzleCell[];
  /** Legacy endgames retain the original deep stack; trials teach the new anchor rule. */
  variant: 'legacy' | 'anchor-trial';
  /** Deterministically scattered, permanent visible single cells. */
  anchorCells: readonly Cell[];
}

export interface PuzzleSetupPlacement {
  type: PieceType;
  rotation: Rotation;
  x: number;
}

export interface PuzzleSetup {
  seed: number;
  placements: readonly PuzzleSetupPlacement[];
}

/**
 * Temporary type-only facade for the blocked frontend's old `level.difficulty` read.
 * Runtime definitions do not own this property; the frontend slice removes the read.
 */
type LegacyPuzzleDefinitionView = PuzzleDefinition & { readonly difficulty: number };

const EMPTY_ROW = '.'.repeat(BOARD_WIDTH);
const EMPTY_HIDDEN_CELLS: readonly PuzzleCell[] = Object.freeze([]);

function occupancyRow(row: string): string {
  return [...row].map((cell) => cell === '.' ? '.' : '#').join('');
}

function setup(seed: number, placements: readonly PuzzleSetupPlacement[]): PuzzleSetup {
  return Object.freeze({ seed, placements: Object.freeze(placements.map((placement) => Object.freeze({ ...placement }))) });
}

function replaySetup(authored: PuzzleSetup): { board: Board; owners: readonly { type: PieceType; cells: readonly Cell[] }[] } {
  let board = createBoard();
  let randomizer = createRandomizer(authored.seed);
  const owners: Array<{ type: PieceType; cells: readonly Cell[] }> = [];
  for (const [index, placement] of authored.placements.entries()) {
    const draw = drawPiece(randomizer);
    randomizer = draw.randomizer;
    if (draw.piece !== placement.type) throw new Error(`Puzzle setup piece ${index} does not match its seven-bag draw.`);
    if (![0, 1, 2, 3].includes(placement.rotation) || !Number.isInteger(placement.x)) {
      throw new Error(`Puzzle setup piece ${index} has an invalid placement.`);
    }
    let active: ActivePiece = { ...createSpawnPiece(placement.type), rotation: placement.rotation, x: placement.x };
    if (!canPlace(board, active)) throw new Error(`Puzzle setup piece ${index} cannot spawn at its authored column.`);
    while (canPlace(board, { ...active, y: active.y + 1 })) active = { ...active, y: active.y + 1 };
    const cells = cellsForPiece(active);
    if (cells.some(({ y }) => y < VISIBLE_START_ROW)) throw new Error(`Puzzle setup piece ${index} enters the hidden buffer.`);
    for (const { x, y } of cells) {
      const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]] as const;
      if (neighbors.some(([neighborX, neighborY]) => board[neighborY]?.[neighborX] === placement.type)) {
        throw new Error(`Puzzle setup piece ${index} touches an earlier piece of the same type.`);
      }
    }
    board = mergePiece(board, active);
    if (fullRows(board).length > 0) throw new Error(`Puzzle setup piece ${index} would clear a line.`);
    owners.push(Object.freeze({ type: placement.type, cells: Object.freeze(cells.map((cell) => Object.freeze({ ...cell }))) }));
  }
  return { board, owners: Object.freeze(owners) };
}

function setupBoardRows(authored: PuzzleSetup): readonly string[] {
  return Object.freeze(replaySetup(authored).board.slice(VISIBLE_START_ROW)
    .map((row) => row.map((cell) => cell ?? '.').join('')));
}

function definition(
  id: PuzzleId,
  name: string,
  seed: number,
  authoredSetup: PuzzleSetup,
): PuzzleDefinition {
  return Object.freeze({
    id,
    name,
    seed,
    setup: authoredSetup,
    boardRows: setupBoardRows(authoredSetup),
    hiddenCells: EMPTY_HIDDEN_CELLS,
    variant: 'legacy',
    anchorCells: EMPTY_HIDDEN_CELLS,
  });
}

function nextAnchorSeed(seed: number): number {
  let value = seed >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}

function seededAnchors(seed: number, count = 2): readonly Cell[] {
  const anchors: Cell[] = [];
  let value = seed >>> 0 || 0x6d2b79f5;
  while (anchors.length < count) {
    value = nextAnchorSeed(value);
    // Keep the teaching lane (column 9) clear for the seeded vertical I input.
    const candidate = { x: value % 6, y: 8 + ((value >>> 8) % 7) };
    if (!anchors.some((anchor) => anchor.x === candidate.x && anchor.y === candidate.y)) anchors.push(candidate);
  }
  return Object.freeze(anchors.map((anchor) => Object.freeze(anchor)));
}

function trialRows(colors: readonly [PieceType, PieceType, PieceType]): readonly string[] {
  const rows = Array.from({ length: VISIBLE_HEIGHT }, () => EMPTY_ROW);
  rows[16] = `${colors[0].repeat(9)}.`;
  rows[17] = `${colors[1].repeat(9)}.`;
  rows[18] = `${colors[2].repeat(9)}.`;
  rows[19] = `${colors[0].repeat(9)}.`;
  return Object.freeze(rows);
}

function anchorTrialDefinition(
  id: PuzzleId,
  name: string,
  seed: number,
  anchorSeed: number,
  colors: readonly [PieceType, PieceType, PieceType],
): PuzzleDefinition {
  return Object.freeze({
    id,
    name,
    seed,
    setup: setup(anchorSeed, []),
    boardRows: trialRows(colors),
    hiddenCells: EMPTY_HIDDEN_CELLS,
    variant: 'anchor-trial',
    anchorCells: seededAnchors(anchorSeed),
  });
}

/** Clean-room T5 endgames, each reconstructed from its own frozen legal setup history. */
const LEGACY_PUZZLE_LIBRARY: readonly PuzzleDefinition[] = [
  definition('t3r-shaft-01', '青脊回旋', 0x75c0b101, setup(0x86dcb145, [{ type: 'Z', rotation: 0, x: 1 }, { type: 'S', rotation: 1, x: 1 }, { type: 'L', rotation: 1, x: 3 }, { type: 'I', rotation: 0, x: 6 }, { type: 'J', rotation: 1, x: -1 }, { type: 'O', rotation: 2, x: 0 }, { type: 'T', rotation: 0, x: 6 }, { type: 'T', rotation: 0, x: 2 }, { type: 'J', rotation: 1, x: 4 }, { type: 'S', rotation: 0, x: 0 }, { type: 'Z', rotation: 2, x: 3 }, { type: 'O', rotation: 3, x: 8 }, { type: 'I', rotation: 0, x: 0 }, { type: 'L', rotation: 3, x: 5 }, { type: 'J', rotation: 0, x: 7 }, { type: 'L', rotation: 2, x: 0 }, { type: 'I', rotation: 1, x: 5 }, { type: 'T', rotation: 3, x: 8 }, { type: 'O', rotation: 2, x: 5 }, { type: 'Z', rotation: 1, x: 7 }])),
  definition('t3r-shaft-02', '深湾折返', 0x75c0b202, setup(0x24853895, [{ type: 'I', rotation: 2, x: 6 }, { type: 'L', rotation: 0, x: 3 }, { type: 'Z', rotation: 1, x: 3 }, { type: 'S', rotation: 0, x: 7 }, { type: 'T', rotation: 1, x: 5 }, { type: 'J', rotation: 2, x: 7 }, { type: 'O', rotation: 3, x: 1 }, { type: 'J', rotation: 1, x: 2 }, { type: 'T', rotation: 1, x: 1 }, { type: 'I', rotation: 0, x: 6 }, { type: 'S', rotation: 1, x: 3 }, { type: 'L', rotation: 0, x: 5 }, { type: 'Z', rotation: 1, x: -1 }, { type: 'O', rotation: 1, x: 0 }, { type: 'L', rotation: 1, x: 1 }, { type: 'Z', rotation: 1, x: 2 }, { type: 'S', rotation: 3, x: 5 }, { type: 'O', rotation: 2, x: 8 }, { type: 'I', rotation: 1, x: -2 }, { type: 'J', rotation: 1, x: 0 }])),
  definition('t3r-shaft-03', '双岸错层', 0x75c0b303, setup(0x12345678, [{ type: 'S', rotation: 2, x: 3 }, { type: 'T', rotation: 0, x: 0 }, { type: 'O', rotation: 3, x: 2 }, { type: 'I', rotation: 0, x: 6 }, { type: 'Z', rotation: 3, x: 1 }, { type: 'L', rotation: 1, x: 5 }, { type: 'J', rotation: 1, x: -1 }, { type: 'J', rotation: 0, x: 3 }, { type: 'I', rotation: 1, x: 5 }, { type: 'T', rotation: 1, x: 4 }, { type: 'L', rotation: 3, x: 3 }, { type: 'O', rotation: 0, x: 8 }, { type: 'S', rotation: 1, x: 0 }, { type: 'Z', rotation: 2, x: 2 }, { type: 'Z', rotation: 3, x: 8 }, { type: 'S', rotation: 2, x: 6 }, { type: 'I', rotation: 3, x: -1 }, { type: 'J', rotation: 1, x: 5 }, { type: 'L', rotation: 3, x: 8 }])),
  definition('t3r-shaft-04', '侧槽逆流', 0x75c0b404, setup(0xa1b2c3d7, [{ type: 'I', rotation: 0, x: 2 }, { type: 'L', rotation: 0, x: 2 }, { type: 'T', rotation: 0, x: 6 }, { type: 'Z', rotation: 1, x: 4 }, { type: 'O', rotation: 2, x: 0 }, { type: 'S', rotation: 2, x: 4 }, { type: 'J', rotation: 0, x: 0 }, { type: 'L', rotation: 0, x: 0 }, { type: 'T', rotation: 1, x: 2 }, { type: 'S', rotation: 3, x: 0 }, { type: 'Z', rotation: 0, x: 3 }, { type: 'O', rotation: 0, x: 8 }, { type: 'J', rotation: 0, x: 7 }, { type: 'I', rotation: 2, x: 6 }, { type: 'S', rotation: 0, x: 2 }, { type: 'T', rotation: 0, x: 5 }, { type: 'Z', rotation: 3, x: 1 }, { type: 'J', rotation: 2, x: 5 }, { type: 'I', rotation: 2, x: 3 }, { type: 'O', rotation: 3, x: 8 }])),
  definition('t3r-cascade-05', '潮线汇流', 0x75c0b505, setup(0xa1b2c3d9, [{ type: 'I', rotation: 0, x: 1 }, { type: 'T', rotation: 1, x: -1 }, { type: 'Z', rotation: 2, x: 0 }, { type: 'O', rotation: 0, x: 6 }, { type: 'J', rotation: 2, x: 3 }, { type: 'S', rotation: 3, x: 2 }, { type: 'L', rotation: 3, x: 7 }, { type: 'I', rotation: 0, x: 0 }, { type: 'Z', rotation: 0, x: 4 }, { type: 'L', rotation: 1, x: 3 }, { type: 'T', rotation: 1, x: 5 }, { type: 'O', rotation: 0, x: 5 }, { type: 'S', rotation: 1, x: 7 }, { type: 'J', rotation: 2, x: 7 }, { type: 'I', rotation: 1, x: 7 }, { type: 'Z', rotation: 3, x: 7 }, { type: 'L', rotation: 0, x: 0 }, { type: 'T', rotation: 2, x: 6 }, { type: 'S', rotation: 2, x: 0 }, { type: 'J', rotation: 1, x: 2 }])),
  definition('t3r-cascade-06', '远岸终局', 0x75c0b606, setup(0xa1b2c3da, [{ type: 'O', rotation: 2, x: 3 }, { type: 'S', rotation: 2, x: 6 }, { type: 'T', rotation: 1, x: 5 }, { type: 'I', rotation: 1, x: 3 }, { type: 'L', rotation: 3, x: 8 }, { type: 'Z', rotation: 2, x: 7 }, { type: 'J', rotation: 0, x: 0 }, { type: 'I', rotation: 2, x: 0 }, { type: 'S', rotation: 2, x: 5 }, { type: 'T', rotation: 3, x: 8 }, { type: 'O', rotation: 0, x: 3 }, { type: 'Z', rotation: 2, x: 3 }, { type: 'L', rotation: 2, x: 6 }, { type: 'J', rotation: 0, x: 3 }, { type: 'L', rotation: 0, x: 0 }, { type: 'T', rotation: 2, x: 0 }, { type: 'Z', rotation: 0, x: 4 }, { type: 'J', rotation: 0, x: 7 }, { type: 'I', rotation: 3, x: -1 }, { type: 'O', rotation: 2, x: 1 }, { type: 'S', rotation: 2, x: 1 }])),
  definition('t5r-delta-07', '折光浅湾', 0x91e2b43d, setup(0xdeadbeef, [{ type: 'J', rotation: 3, x: 5 }, { type: 'L', rotation: 0, x: 2 }, { type: 'O', rotation: 0, x: 8 }, { type: 'S', rotation: 3, x: 4 }, { type: 'I', rotation: 1, x: 5 }, { type: 'Z', rotation: 3, x: 8 }, { type: 'T', rotation: 1, x: 4 }, { type: 'T', rotation: 3, x: 0 }, { type: 'Z', rotation: 3, x: 2 }, { type: 'S', rotation: 3, x: 6 }, { type: 'O', rotation: 1, x: 8 }, { type: 'I', rotation: 0, x: 1 }, { type: 'J', rotation: 3, x: 2 }, { type: 'L', rotation: 2, x: 4 }, { type: 'Z', rotation: 1, x: 6 }, { type: 'T', rotation: 1, x: -1 }, { type: 'L', rotation: 1, x: 0 }, { type: 'O', rotation: 0, x: 2 }, { type: 'I', rotation: 0, x: 4 }, { type: 'J', rotation: 1, x: -1 }])),
  definition('t5r-drift-08', '微澜错屿', 0xc37a58e1, setup(0xa1b2c3dc, [{ type: 'S', rotation: 0, x: 6 }, { type: 'I', rotation: 0, x: 0 }, { type: 'O', rotation: 2, x: 1 }, { type: 'J', rotation: 1, x: -1 }, { type: 'Z', rotation: 2, x: 3 }, { type: 'T', rotation: 3, x: 2 }, { type: 'L', rotation: 3, x: 8 }, { type: 'T', rotation: 2, x: 0 }, { type: 'L', rotation: 3, x: 4 }, { type: 'O', rotation: 3, x: 6 }, { type: 'Z', rotation: 3, x: 4 }, { type: 'S', rotation: 0, x: 3 }, { type: 'I', rotation: 0, x: 6 }, { type: 'J', rotation: 3, x: 8 }, { type: 'S', rotation: 2, x: 6 }, { type: 'T', rotation: 2, x: 7 }, { type: 'I', rotation: 1, x: 4 }, { type: 'J', rotation: 1, x: -1 }, { type: 'Z', rotation: 1, x: 1 }, { type: 'L', rotation: 0, x: 7 }, { type: 'O', rotation: 1, x: 0 }, { type: 'O', rotation: 1, x: 4 }])),
  definition('t5r-lattice-09', '蓝桥叠汐', 0xa5c91367, setup(0xfeedface, [{ type: 'T', rotation: 0, x: 2 }, { type: 'S', rotation: 2, x: 0 }, { type: 'Z', rotation: 2, x: 4 }, { type: 'L', rotation: 0, x: 2 }, { type: 'J', rotation: 0, x: 1 }, { type: 'I', rotation: 3, x: -1 }, { type: 'O', rotation: 0, x: 7 }, { type: 'T', rotation: 0, x: 5 }, { type: 'O', rotation: 2, x: 5 }, { type: 'I', rotation: 2, x: 1 }, { type: 'J', rotation: 0, x: 0 }, { type: 'S', rotation: 1, x: 7 }, { type: 'L', rotation: 2, x: 7 }, { type: 'Z', rotation: 2, x: 3 }, { type: 'S', rotation: 3, x: 5 }, { type: 'Z', rotation: 3, x: 7 }, { type: 'J', rotation: 0, x: 6 }, { type: 'O', rotation: 3, x: 1 }, { type: 'L', rotation: 2, x: 0 }, { type: 'I', rotation: 1, x: 7 }])),
  definition('t5r-rift-10', '薄雾回廊', 0xd1596af5, setup(0xa1b2c3de, [{ type: 'L', rotation: 0, x: 4 }, { type: 'Z', rotation: 3, x: 5 }, { type: 'O', rotation: 0, x: 2 }, { type: 'I', rotation: 1, x: 7 }, { type: 'J', rotation: 3, x: 7 }, { type: 'T', rotation: 1, x: 6 }, { type: 'S', rotation: 1, x: 2 }, { type: 'S', rotation: 1, x: 3 }, { type: 'L', rotation: 2, x: 6 }, { type: 'J', rotation: 2, x: 7 }, { type: 'I', rotation: 0, x: 6 }, { type: 'Z', rotation: 3, x: 0 }, { type: 'T', rotation: 1, x: 1 }, { type: 'O', rotation: 3, x: 0 }, { type: 'I', rotation: 0, x: 1 }, { type: 'Z', rotation: 1, x: 1 }, { type: 'O', rotation: 3, x: 8 }, { type: 'S', rotation: 1, x: 3 }, { type: 'T', rotation: 3, x: 4 }, { type: 'J', rotation: 1, x: -1 }, { type: 'L', rotation: 1, x: 5 }])),
  definition('t5r-prism-11', '棱湾交错', 0x73bc20e9, setup(0x13579bdf, [{ type: 'I', rotation: 1, x: 7 }, { type: 'L', rotation: 0, x: 3 }, { type: 'J', rotation: 0, x: 6 }, { type: 'T', rotation: 2, x: 6 }, { type: 'S', rotation: 0, x: 7 }, { type: 'O', rotation: 0, x: 3 }, { type: 'Z', rotation: 0, x: 3 }, { type: 'S', rotation: 0, x: 5 }, { type: 'I', rotation: 3, x: 1 }, { type: 'T', rotation: 0, x: 3 }, { type: 'L', rotation: 3, x: 0 }, { type: 'J', rotation: 0, x: 5 }, { type: 'O', rotation: 0, x: 1 }, { type: 'Z', rotation: 1, x: 7 }, { type: 'S', rotation: 2, x: 6 }, { type: 'O', rotation: 3, x: 5 }, { type: 'J', rotation: 1, x: 2 }, { type: 'Z', rotation: 1, x: 0 }, { type: 'I', rotation: 1, x: -2 }, { type: 'T', rotation: 3, x: 8 }, { type: 'L', rotation: 2, x: 4 }])),
  definition('t5r-current-12', '双潮折线', 0xb47d8e23, setup(0xa1b2c3e0, [{ type: 'O', rotation: 2, x: 4 }, { type: 'S', rotation: 2, x: 7 }, { type: 'Z', rotation: 1, x: 5 }, { type: 'T', rotation: 3, x: 8 }, { type: 'I', rotation: 0, x: 0 }, { type: 'J', rotation: 2, x: 0 }, { type: 'L', rotation: 3, x: 2 }, { type: 'I', rotation: 1, x: 2 }, { type: 'L', rotation: 1, x: 4 }, { type: 'S', rotation: 3, x: 6 }, { type: 'J', rotation: 1, x: 7 }, { type: 'T', rotation: 0, x: 5 }, { type: 'Z', rotation: 3, x: 2 }, { type: 'O', rotation: 2, x: 0 }, { type: 'L', rotation: 0, x: 3 }, { type: 'J', rotation: 3, x: 0 }, { type: 'O', rotation: 3, x: 1 }, { type: 'I', rotation: 1, x: -2 }, { type: 'Z', rotation: 2, x: 6 }])),
  definition('t5r-arc-13', '静弧深槽', 0x5c29f6a1, setup(0x55667788, [{ type: 'Z', rotation: 0, x: 6 }, { type: 'T', rotation: 0, x: 2 }, { type: 'L', rotation: 3, x: 4 }, { type: 'I', rotation: 1, x: 7 }, { type: 'J', rotation: 0, x: 6 }, { type: 'O', rotation: 0, x: 7 }, { type: 'S', rotation: 0, x: 2 }, { type: 'O', rotation: 1, x: 0 }, { type: 'S', rotation: 1, x: 7 }, { type: 'Z', rotation: 2, x: 3 }, { type: 'T', rotation: 2, x: 5 }, { type: 'I', rotation: 0, x: 3 }, { type: 'J', rotation: 2, x: 7 }, { type: 'L', rotation: 0, x: 0 }, { type: 'I', rotation: 0, x: 6 }, { type: 'S', rotation: 2, x: 0 }])),
  definition('t5r-pulse-14', '脉光群岛', 0xf2a7634b, setup(0xa1b2c3e2, [{ type: 'L', rotation: 1, x: 0 }, { type: 'O', rotation: 1, x: 3 }, { type: 'T', rotation: 0, x: 5 }, { type: 'I', rotation: 1, x: -2 }, { type: 'J', rotation: 2, x: 3 }, { type: 'S', rotation: 1, x: 0 }, { type: 'Z', rotation: 0, x: 3 }, { type: 'S', rotation: 1, x: 4 }, { type: 'I', rotation: 1, x: 5 }, { type: 'J', rotation: 2, x: 0 }, { type: 'L', rotation: 2, x: 3 }, { type: 'Z', rotation: 3, x: 8 }, { type: 'T', rotation: 1, x: 5 }, { type: 'O', rotation: 2, x: 8 }, { type: 'O', rotation: 3, x: 5 }, { type: 'Z', rotation: 2, x: 7 }, { type: 'J', rotation: 2, x: 7 }, { type: 'T', rotation: 2, x: 1 }, { type: 'S', rotation: 3, x: 3 }, { type: 'I', rotation: 1, x: -2 }, { type: 'L', rotation: 0, x: 7 }, { type: 'I', rotation: 2, x: 5 }])),
  definition('t5r-horizon-15', '远蓝合流', 0x8ea45d17, setup(0xa1b2c3e3, [{ type: 'Z', rotation: 3, x: 8 }, { type: 'L', rotation: 0, x: 5 }, { type: 'O', rotation: 3, x: 0 }, { type: 'S', rotation: 0, x: 7 }, { type: 'J', rotation: 0, x: 2 }, { type: 'I', rotation: 1, x: 4 }, { type: 'T', rotation: 3, x: 3 }, { type: 'L', rotation: 3, x: 4 }, { type: 'S', rotation: 1, x: 5 }, { type: 'J', rotation: 3, x: 0 }, { type: 'O', rotation: 3, x: 2 }, { type: 'Z', rotation: 2, x: 7 }, { type: 'T', rotation: 3, x: 4 }, { type: 'I', rotation: 0, x: 0 }, { type: 'J', rotation: 2, x: 5 }, { type: 'I', rotation: 1, x: 7 }, { type: 'O', rotation: 2, x: 1 }, { type: 'L', rotation: 3, x: 7 }, { type: 'Z', rotation: 3, x: 3 }, { type: 'T', rotation: 1, x: -1 }])),
] as const;

/** The final three entries are deliberately light-touch introductions to T10 rules. */
const PUZZLE_LIBRARY: readonly PuzzleDefinition[] = Object.freeze(LEGACY_PUZZLE_LIBRARY.map((candidate) => {
  if (candidate.id === 't5r-arc-13') return anchorTrialDefinition(candidate.id, candidate.name, 26, 0x5c29f6a1, ['T', 'L', 'J']);
  if (candidate.id === 't5r-pulse-14') return anchorTrialDefinition(candidate.id, candidate.name, 112, 0xf2a7634b, ['S', 'Z', 'I']);
  if (candidate.id === 't5r-horizon-15') return anchorTrialDefinition(candidate.id, candidate.name, 137, 0x8ea45d17, ['O', 'J', 'T']);
  return candidate;
}));

// See LegacyPuzzleDefinitionView above. No runtime object contains a numeric difficulty.
export const PUZZLE_DEFINITIONS = PUZZLE_LIBRARY as readonly LegacyPuzzleDefinitionView[];

const PIECE_TYPE_SET = new Set<string>(PIECE_TYPES);
const PUZZLE_ID_SET = new Set<string>(PUZZLE_LIBRARY.map((candidate) => candidate.id));
const PUZZLE_SEED_SET = new Set<number>(PUZZLE_LIBRARY.map((candidate) => candidate.seed));
const PUZZLE_SETUP_SEED_SET = new Set<number>(PUZZLE_LIBRARY.map((candidate) => candidate.setup.seed));
const CAMPAIGN_COLOR_SET = new Set(PUZZLE_LIBRARY.filter((candidate) => candidate.variant === 'legacy').flatMap((candidate) => (
  candidate.boardRows.flatMap((row) => [...row].filter((cell): cell is PieceType => PIECE_TYPE_SET.has(cell)))
)));

if (CAMPAIGN_COLOR_SET.size !== PIECE_TYPES.length) {
  throw new Error('Puzzle campaign starting boards must use all seven piece colors.');
}

for (let left = 0; left < PUZZLE_LIBRARY.length; left += 1) {
  for (let right = left + 1; right < PUZZLE_LIBRARY.length; right += 1) {
    if (PUZZLE_LIBRARY[left]!.variant !== 'legacy' || PUZZLE_LIBRARY[right]!.variant !== 'legacy') continue;
    const first = PUZZLE_LIBRARY[left]!.boardRows.join('');
    const second = PUZZLE_LIBRARY[right]!.boardRows.join('');
    const hamming = [...first].filter((cell, index) => (cell === '.') !== (second[index] === '.')).length;
    if (hamming < 20) throw new Error('Puzzle occupancy masks require pairwise Hamming distance of at least 20.');
  }
}

function validateSeedBags(definition: PuzzleDefinition): void {
  let randomizer = createRandomizer(definition.seed);
  for (let bagIndex = 0; bagIndex < 12; bagIndex += 1) {
    const bag = new Set<PieceType>();
    for (let pieceIndex = 0; pieceIndex < PIECE_TYPES.length; pieceIndex += 1) {
      const draw = drawPiece(randomizer);
      randomizer = draw.randomizer;
      bag.add(draw.piece);
    }
    if (bag.size !== PIECE_TYPES.length) {
      throw new Error(`Puzzle ${definition.id} seed does not produce complete seven-bags.`);
    }
  }
}

export function validatePuzzleDefinition(definition: PuzzleDefinition): void {
  if (!PUZZLE_ID_SET.has(definition.id)) throw new Error(`Unknown puzzle id: ${definition.id}`);
  const canonical = PUZZLE_LIBRARY.find((candidate) => candidate.id === definition.id)!;
  if (!Number.isSafeInteger(definition.seed) || definition.seed <= 0 || definition.seed > 0xffff_ffff) {
    throw new Error(`Puzzle ${definition.id} has an invalid level seed.`);
  }
  if (definition.seed !== canonical.seed) throw new Error(`Puzzle ${definition.id} must retain its stable level seed.`);
  if (PUZZLE_SEED_SET.size !== PUZZLE_LIBRARY.length) throw new Error('Puzzle level seeds must be unique.');
  if (definition.variant === 'anchor-trial') {
    if (canonical.variant !== 'anchor-trial' || definition.anchorCells.length !== 2) {
      throw new Error(`Puzzle ${definition.id} has an invalid anchor trial contract.`);
    }
    if (JSON.stringify(definition.anchorCells) !== JSON.stringify(canonical.anchorCells)) {
      throw new Error(`Puzzle ${definition.id} must retain its seeded anchors.`);
    }
    if (definition.boardRows.length !== VISIBLE_HEIGHT || definition.setup.placements.length !== 0) {
      throw new Error(`Puzzle ${definition.id} anchor trial is malformed.`);
    }
    for (const anchor of definition.anchorCells) {
      if (anchor.x < 0 || anchor.x >= BOARD_WIDTH || anchor.y < 0 || anchor.y >= 17 || definition.boardRows[anchor.y]?.[anchor.x] !== '.') {
        throw new Error(`Puzzle ${definition.id} has an invalid anchor position.`);
      }
    }
    validateSeedBags(definition);
    return;
  }
  if (definition.variant !== 'legacy' || definition.anchorCells.length !== 0) {
    throw new Error(`Puzzle ${definition.id} has an invalid legacy anchor payload.`);
  }
  if (!definition.setup || !Number.isSafeInteger(definition.setup.seed) || definition.setup.seed <= 0
    || definition.setup.seed > 0xffff_ffff || !Array.isArray(definition.setup.placements)) {
    throw new Error(`Puzzle ${definition.id} has an invalid setup history.`);
  }
  if (definition.setup.placements.length < 16 || definition.setup.placements.length > 22) {
    throw new Error(`Puzzle ${definition.id} requires 16-22 setup pieces.`);
  }
  if (new Set(definition.setup.placements.map(({ type }) => type)).size !== PIECE_TYPES.length) {
    throw new Error(`Puzzle ${definition.id} setup must use all seven piece types.`);
  }
  if (definition.setup.seed !== canonical.setup.seed
    || JSON.stringify(definition.setup.placements) !== JSON.stringify(canonical.setup.placements)) {
    throw new Error(`Puzzle ${definition.id} must retain its frozen legal setup history.`);
  }
  if (PUZZLE_SETUP_SEED_SET.size !== PUZZLE_LIBRARY.length) throw new Error('Puzzle setup seeds must be unique.');
  if (!Array.isArray(definition.boardRows) || definition.boardRows.length !== VISIBLE_HEIGHT) {
    throw new Error(`Puzzle ${definition.id} requires exactly ${VISIBLE_HEIGHT} visible board rows.`);
  }
  if (!Array.isArray(definition.hiddenCells) || definition.hiddenCells.length !== 0) {
    throw new Error(`Puzzle ${definition.id} must begin with an empty hidden buffer.`);
  }
  const rebuiltRows = setupBoardRows(definition.setup);
  if (rebuiltRows.some((row, index) => row !== definition.boardRows[index])) {
    throw new Error(`Puzzle ${definition.id} board must byte-match its legal setup history.`);
  }

  let occupied = 0;
  const nonEmptyRows: string[] = [];
  const boardColors = new Set<PieceType>();
  for (const row of definition.boardRows) {
    if (typeof row !== 'string' || row.length !== BOARD_WIDTH) {
      throw new Error(`Puzzle ${definition.id} contains a malformed board row.`);
    }
    if ([...row].some((cell) => cell !== '.' && !PIECE_TYPE_SET.has(cell))) {
      throw new Error(`Puzzle ${definition.id} contains an illegal board cell.`);
    }
    if (![...row].includes('.')) throw new Error(`Puzzle ${definition.id} contains an initially full visible row.`);
    const rowOccupied = [...row].filter((cell) => cell !== '.').length;
    occupied += rowOccupied;
    for (const cell of row) if (cell !== '.') boardColors.add(cell as PieceType);
    if (rowOccupied > 0) nonEmptyRows.push(row);
  }
  if (occupied === 0) throw new Error(`Puzzle ${definition.id} requires a non-empty authored board.`);
  if (nonEmptyRows.length < 8 || nonEmptyRows.length > 12) {
    throw new Error(`Puzzle ${definition.id} requires an 8-12 row initial stack.`);
  }
  const occupancyRows = nonEmptyRows.map(occupancyRow);
  if (new Set(occupancyRows).size < 7) {
    throw new Error(`Puzzle ${definition.id} requires at least seven distinct occupancy-row shapes.`);
  }
  const rowDensities = nonEmptyRows.map((row) => [...row].filter((cell) => cell !== '.').length);
  if (new Set(rowDensities).size < 4 || rowDensities.filter((count) => count <= BOARD_WIDTH - 3).length < 2) {
    throw new Error(`Puzzle ${definition.id} forbids repeated floor templates and requires layered cavity density.`);
  }
  if (boardColors.size !== PIECE_TYPES.length) {
    throw new Error(`Puzzle ${definition.id} requires all seven source-piece materials.`);
  }
  for (let index = 0; index <= occupancyRows.length - 3; index += 1) {
    const rows = occupancyRows.slice(index, index + 3);
    const wells = rows.map((row) => [...row].flatMap((cell, x) => cell === '.' ? [x] : []));
    if (wells.every((columns) => columns.length === 1 && columns[0] === wells[0]![0])) {
      throw new Error(`Puzzle ${definition.id} forbids three consecutive rows exposing one straight well.`);
    }
  }

  const top = definition.boardRows.findIndex((row) => row !== EMPTY_ROW);
  const coveredEmptyColumns = new Set<number>();
  let buriedHoles = 0;
  for (let x = 0; x < BOARD_WIDTH; x += 1) {
    for (let y = Math.max(0, top + 1); y < VISIBLE_HEIGHT - 1; y += 1) {
      if (definition.boardRows[y]![x] !== '.') continue;
      const hasFilledAbove = definition.boardRows.slice(top, y).some((row) => row[x] !== '.');
      const hasFilledBelow = definition.boardRows.slice(y + 1).some((row) => row[x] !== '.');
      if (hasFilledAbove) coveredEmptyColumns.add(x);
      if (hasFilledAbove && hasFilledBelow) buriedHoles += 1;
    }
  }
  if (coveredEmptyColumns.size < 5 || buriedHoles < 8) {
    throw new Error(`Puzzle ${definition.id} requires at least five covered-cavity columns and eight buried holes.`);
  }

  validateSeedBags(definition);
}

export function getPuzzleDefinition(id: PuzzleId): PuzzleDefinition {
  const selected = PUZZLE_LIBRARY.find((candidate) => candidate.id === id);
  if (!selected) throw new Error(`Unknown puzzle id: ${id}`);
  validatePuzzleDefinition(selected);
  return selected;
}

export function createPuzzleBoard(definition: PuzzleDefinition): Board {
  validatePuzzleDefinition(definition);
  const board = createBoard();
  for (let y = 0; y < definition.boardRows.length; y += 1) {
    const row = definition.boardRows[y]!;
    for (let x = 0; x < row.length; x += 1) {
      const type = row[x]!;
      if (type !== '.') board[VISIBLE_START_ROW + y]![x] = type as PieceType;
    }
  }
  for (const anchor of definition.anchorCells) board[VISIBLE_START_ROW + anchor.y]![anchor.x] = ANCHOR_CELL;
  return board;
}

export function defaultPuzzleId(): PuzzleId {
  return PUZZLE_LIBRARY[0]!.id;
}

export function nextPuzzleId(id: PuzzleId): PuzzleId | null {
  const index = PUZZLE_LIBRARY.findIndex((candidate) => candidate.id === id);
  return index >= 0 ? PUZZLE_LIBRARY[index + 1]?.id ?? null : null;
}
