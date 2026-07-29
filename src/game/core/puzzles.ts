import { BOARD_WIDTH, VISIBLE_HEIGHT, VISIBLE_START_ROW } from './constants';
import { canPlace, createBoard, fullRows, mergePiece } from './board';
import { cellsForPiece, createSpawnPiece } from './pieces';
import { createRandomizer, drawPiece } from './random';
import { ANCHOR_CELL, PIECE_TYPES, type Board, type Cell, type PieceType, type PuzzleId, type Rotation } from './types';

export interface PuzzleCell {
  x: number;
  /** Visible-board coordinate, where 0 is the top and 19 is the floor. */
  y: number;
  type: PieceType;
}

/** A visible, fixed-world-coordinate Puzzle obstacle that never counts as a target. */
export interface PuzzleAnchorCell {
  x: number;
  /** Visible-board coordinate, where 0 is the top and 19 is the floor. */
  y: number;
}

/** One legal hard-drop in the empty-board history that authored a Puzzle start. */
export interface PuzzleSetupPlacement {
  type: PieceType;
  rotation: Rotation;
  x: number;
}

/** Stable separate seven-bag source for a visible authored endgame. */
export interface PuzzleSetupHistory {
  seed: number;
  placements: readonly PuzzleSetupPlacement[];
}

export interface PuzzleDefinition {
  id: PuzzleId;
  name: string;
  /** Stable curriculum order; the player can select every entry immediately. */
  difficulty: number;
  /** Explicit authored height of the contiguous original-target band at the floor. */
  targetRows: number;
  /** Stable level-owned seed for the normal deterministic gameplay seven-bag. */
  seed: number;
  /** Legal zero-clear setup replay that owns every ordinary original target. */
  setup: PuzzleSetupHistory;
  /** Exactly twenty visible rows derived from `setup`; never a hand-excavated mask. */
  boardRows: readonly string[];
  /** Always empty: every authored target begins inside the visible well. */
  hiddenCells: readonly PuzzleCell[];
  /** Zero to two fixed pegs in the visible headroom directly above the target band. */
  anchorCells: readonly PuzzleAnchorCell[];
}

const EMPTY_ROW = '.'.repeat(BOARD_WIDTH);
const EMPTY_HIDDEN_CELLS: readonly PuzzleCell[] = Object.freeze([]);
const EMPTY_ANCHOR_CELLS: readonly PuzzleAnchorCell[] = Object.freeze([]);
const PIECE_TYPE_SET = new Set<string>(PIECE_TYPES);
const PUZZLE_TARGET_ROWS: Readonly<Record<PuzzleId, number>> = Object.freeze({
  't3r-shaft-01': 3,
  't3r-shaft-02': 3,
  't3r-shaft-03': 3,
  't3r-shaft-04': 3,
  't3r-cascade-05': 3,
  't3r-cascade-06': 3,
  't5r-delta-07': 3,
  't5r-drift-08': 3,
  't5r-lattice-09': 3,
  't5r-rift-10': 3,
  't5r-prism-11': 4,
  't5r-current-12': 4,
  't5r-arc-13': 4,
  't5r-pulse-14': 4,
  't5r-horizon-15': 4,
  't6r-veil-16': 4,
  't6r-cairn-17': 4,
  't6r-terrace-18': 4,
  't6r-bastion-19': 4,
  't6r-keystone-20': 4,
});

function setup(seed: number, placements: readonly PuzzleSetupPlacement[]): PuzzleSetupHistory {
  return Object.freeze({
    seed,
    placements: Object.freeze(placements.map((placement) => Object.freeze({ ...placement }))),
  });
}

function anchors(cells: readonly PuzzleAnchorCell[] = EMPTY_ANCHOR_CELLS): readonly PuzzleAnchorCell[] {
  return Object.freeze(cells.map((cell) => Object.freeze({ ...cell })));
}

function isRotation(value: number): value is Rotation {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

function coordinateKey(x: number, y: number): string {
  return `${x}:${y}`;
}

/**
 * Replays one authoring history without the engine or renderer. This intentionally uses
 * the same bag, spawn, collision, hard-drop, and merge primitives as normal play while
 * rejecting setup clears, hidden cells, malformed rotations, and merged same-type owners.
 */
export function replayPuzzleSetup(history: PuzzleSetupHistory): Board {
  if (!Number.isSafeInteger(history.seed) || history.seed <= 0 || history.seed > 0xffff_ffff) {
    throw new Error('Puzzle setup history needs a nonzero uint32 seed.');
  }
  if (!Array.isArray(history.placements) || history.placements.length < 5 || history.placements.length > 15) {
    throw new Error('Puzzle setup history must contain five through fifteen legal drops.');
  }

  let board = createBoard();
  let randomizer = createRandomizer(history.seed);
  const owners = new Map<string, string>();
  for (const [index, placement] of history.placements.entries()) {
    if (!PIECE_TYPE_SET.has(placement.type) || !isRotation(placement.rotation) || !Number.isSafeInteger(placement.x)) {
      throw new Error(`Puzzle setup placement ${index + 1} is malformed.`);
    }
    const draw = drawPiece(randomizer);
    randomizer = draw.randomizer;
    if (draw.piece !== placement.type) {
      throw new Error(`Puzzle setup placement ${index + 1} does not match its seeded seven-bag draw.`);
    }

    let piece = { ...createSpawnPiece(placement.type), rotation: placement.rotation, x: placement.x };
    if (!canPlace(board, piece)) throw new Error(`Puzzle setup placement ${index + 1} cannot spawn legally.`);
    while (canPlace(board, { ...piece, y: piece.y + 1 })) piece = { ...piece, y: piece.y + 1 };

    const owner = `${placement.type}:${index}`;
    const cells = [...new Set(cellsForPiece(piece).map((cell) => coordinateKey(cell.x, cell.y)))];
    if (cells.length !== 4) throw new Error(`Puzzle setup placement ${index + 1} must own exactly four cells.`);
    for (const key of cells) {
      const [xText, yText] = key.split(':');
      const x = Number(xText);
      const y = Number(yText);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
        const neighbor = owners.get(coordinateKey(x + dx, y + dy));
        if (neighbor && neighbor !== owner && neighbor.startsWith(`${placement.type}:`)) {
          throw new Error(`Puzzle setup placement ${index + 1} merges two same-type source tetrominoes.`);
        }
      }
      owners.set(key, owner);
    }
    board = mergePiece(board, piece);
    if (fullRows(board).length > 0) throw new Error(`Puzzle setup placement ${index + 1} clears a row.`);
  }

  if (board.slice(0, VISIBLE_START_ROW).some((row) => row.some((cell) => cell !== null))) {
    throw new Error('Puzzle setup may not leave cells in the hidden buffer.');
  }
  return board;
}

function rowsForSetup(history: PuzzleSetupHistory): readonly string[] {
  const board = replayPuzzleSetup(history);
  return Object.freeze(board.slice(VISIBLE_START_ROW).map((row) => row.map((cell) => cell ?? '.').join('')));
}

function endgame(
  id: PuzzleId,
  name: string,
  difficulty: number,
  seed: number,
  history: PuzzleSetupHistory,
  anchorCells: readonly PuzzleAnchorCell[] = EMPTY_ANCHOR_CELLS,
): PuzzleDefinition {
  return Object.freeze({
    id,
    name,
    difficulty,
    targetRows: PUZZLE_TARGET_ROWS[id],
    seed,
    setup: history,
    boardRows: rowsForSetup(history),
    hiddenCells: EMPTY_HIDDEN_CELLS,
    anchorCells: anchors(anchorCells),
  });
}

/**
 * T13's all-open legal endgame workshop. Each board below is derived at module load
 * from its own deterministic setup history; gameplay has a separate stable seed and
 * continues normally after any non-winning lock.
 */
const PUZZLE_LIBRARY: readonly PuzzleDefinition[] = Object.freeze([
  // 01–05: three rows — read one clear structural gap before handling paired openings.
  endgame('t3r-shaft-01', '缺口', 1, 1073741827, setup(1588444805, [{ type: 'I', rotation: 0, x: 2 }, { type: 'L', rotation: 3, x: 5 }, { type: 'O', rotation: 2, x: 3 }, { type: 'Z', rotation: 2, x: 7 }, { type: 'J', rotation: 2, x: 7 }, { type: 'T', rotation: 2, x: 0 }])),
  endgame('t3r-shaft-02', '侧井', 2, 1618033988, setup(1588444826, [{ type: 'Z', rotation: 2, x: 7 }, { type: 'O', rotation: 2, x: 0 }, { type: 'T', rotation: 0, x: 3 }, { type: 'S', rotation: 0, x: 2 }, { type: 'J', rotation: 2, x: 7 }, { type: 'L', rotation: 3, x: 5 }])),
  endgame('t3r-shaft-03', '错层', 3, 994121443, setup(1588444824, [{ type: 'S', rotation: 0, x: 2 }, { type: 'J', rotation: 0, x: 5 }, { type: 'T', rotation: 2, x: 0 }, { type: 'O', rotation: 3, x: 8 }, { type: 'L', rotation: 2, x: 7 }, { type: 'I', rotation: 2, x: 3 }])),
  endgame('t3r-shaft-04', '转折', 5, 2309737967, setup(2718281711, [{ type: 'I', rotation: 0, x: 6 }, { type: 'Z', rotation: 1, x: 0 }, { type: 'S', rotation: 0, x: 4 }, { type: 'O', rotation: 1, x: 3 }, { type: 'J', rotation: 1, x: -1 }])),
  endgame('t3r-cascade-05', '双槽', 4, 3141592653, setup(1588444806, [{ type: 'Z', rotation: 0, x: 0 }, { type: 'I', rotation: 2, x: 3 }, { type: 'J', rotation: 2, x: 0 }, { type: 'S', rotation: 2, x: 7 }, { type: 'T', rotation: 0, x: 5 }, { type: 'L', rotation: 2, x: 3 }])),

  // 06–10: still three rows, with wider staging choices and one explicit headroom peg.
  endgame('t3r-cascade-06', '回路', 6, 1717986918, setup(2718281725, [{ type: 'T', rotation: 0, x: 1 }, { type: 'I', rotation: 2, x: 6 }, { type: 'Z', rotation: 2, x: 2 }, { type: 'O', rotation: 2, x: 0 }, { type: 'L', rotation: 3, x: 4 }])),
  endgame('t5r-delta-07', '长井', 7, 452198731, setup(2718281722, [{ type: 'O', rotation: 2, x: 3 }, { type: 'S', rotation: 3, x: 0 }, { type: 'T', rotation: 2, x: 1 }, { type: 'I', rotation: 2, x: 6 }, { type: 'L', rotation: 3, x: 4 }])),
  endgame('t5r-drift-08', '绕柱', 9, 2004318071, setup(2718281717, [{ type: 'O', rotation: 1, x: 7 }, { type: 'I', rotation: 2, x: 0 }, { type: 'L', rotation: 3, x: 8 }, { type: 'S', rotation: 1, x: 3 }, { type: 'T', rotation: 2, x: 5 }]), [{ x: 9, y: 16 }]),
  endgame('t5r-lattice-09', '交错', 8, 2718281828, setup(1588444814, [{ type: 'T', rotation: 0, x: 7 }, { type: 'Z', rotation: 0, x: 2 }, { type: 'S', rotation: 2, x: 5 }, { type: 'O', rotation: 3, x: 0 }, { type: 'I', rotation: 0, x: 6 }, { type: 'J', rotation: 2, x: 3 }])),
  endgame('t5r-rift-10', '双门', 10, 1311768467, setup(2718281718, [{ type: 'I', rotation: 0, x: 0 }, { type: 'Z', rotation: 3, x: 8 }, { type: 'O', rotation: 2, x: 5 }, { type: 'J', rotation: 1, x: 6 }, { type: 'L', rotation: 2, x: 4 }])),

  // 11–15: four rows — introduce platforms, wells, overhangs, stairs, and paired lanes.
  endgame('t5r-prism-11', '阶梯', 14, 2882400001, setup(3141593004, [{ type: 'S', rotation: 1, x: 1 }, { type: 'Z', rotation: 0, x: 4 }, { type: 'J', rotation: 0, x: 7 }, { type: 'O', rotation: 3, x: 0 }, { type: 'I', rotation: 0, x: 4 }, { type: 'L', rotation: 2, x: 3 }, { type: 'T', rotation: 2, x: 0 }])),
  endgame('t5r-current-12', '悬边', 13, 3471557507, setup(3141593005, [{ type: 'S', rotation: 2, x: 7 }, { type: 'I', rotation: 2, x: 0 }, { type: 'Z', rotation: 0, x: 4 }, { type: 'T', rotation: 2, x: 5 }, { type: 'O', rotation: 1, x: 2 }, { type: 'L', rotation: 2, x: 4 }, { type: 'J', rotation: 2, x: 7 }])),
  endgame('t5r-arc-13', '井口', 12, 3177056438, setup(3141593022, [{ type: 'Z', rotation: 0, x: 0 }, { type: 'S', rotation: 3, x: 3 }, { type: 'I', rotation: 0, x: 5 }, { type: 'J', rotation: 2, x: 7 }, { type: 'T', rotation: 2, x: 4 }, { type: 'O', rotation: 0, x: 0 }, { type: 'L', rotation: 2, x: 2 }])),
  endgame('t5r-pulse-14', '平台', 11, 3735928559, setup(3141593013, [{ type: 'O', rotation: 2, x: 5 }, { type: 'L', rotation: 3, x: 6 }, { type: 'Z', rotation: 1, x: 7 }, { type: 'J', rotation: 0, x: 0 }, { type: 'S', rotation: 0, x: 3 }, { type: 'T', rotation: 2, x: 7 }, { type: 'I', rotation: 2, x: 3 }]), [{ x: 5, y: 15 }]),
  endgame('t5r-horizon-15', '双井', 15, 324508639, setup(2718282021, [{ type: 'Z', rotation: 2, x: 7 }, { type: 'I', rotation: 2, x: 0 }, { type: 'O', rotation: 2, x: 5 }, { type: 'S', rotation: 1, x: 2 }, { type: 'T', rotation: 2, x: 0 }, { type: 'J', rotation: 2, x: 2 }, { type: 'L', rotation: 2, x: 5 }, { type: 'S', rotation: 1, x: 7 }])),

  // 16–20: four rows — add recovery, shelves, bridges, and two sparse headroom pegs.
  endgame('t6r-veil-16', '交汇', 20, 5783321, setup(3141593028, [{ type: 'I', rotation: 0, x: 1 }, { type: 'L', rotation: 2, x: 0 }, { type: 'S', rotation: 2, x: 5 }, { type: 'T', rotation: 3, x: 8 }, { type: 'O', rotation: 1, x: 3 }, { type: 'Z', rotation: 0, x: 4 }, { type: 'J', rotation: 2, x: 6 }])),
  endgame('t6r-cairn-17', '回填', 16, 1832906719, setup(3141593017, [{ type: 'S', rotation: 3, x: 5 }, { type: 'T', rotation: 0, x: 1 }, { type: 'Z', rotation: 0, x: 2 }, { type: 'J', rotation: 0, x: 7 }, { type: 'O', rotation: 0, x: 0 }, { type: 'I', rotation: 0, x: 0 }, { type: 'L', rotation: 2, x: 4 }]), [{ x: 1, y: 15 }]),
  endgame('t6r-terrace-18', '侧台', 17, 2596069104, setup(3141593031, [{ type: 'L', rotation: 0, x: 4 }, { type: 'Z', rotation: 2, x: 0 }, { type: 'T', rotation: 2, x: 2 }, { type: 'S', rotation: 0, x: 7 }, { type: 'I', rotation: 0, x: 3 }, { type: 'O', rotation: 0, x: 8 }, { type: 'J', rotation: 2, x: 5 }])),
  endgame('t6r-bastion-19', '窄门', 19, 521288629, setup(2718282009, [{ type: 'O', rotation: 3, x: 8 }, { type: 'J', rotation: 0, x: 0 }, { type: 'Z', rotation: 1, x: 5 }, { type: 'S', rotation: 0, x: 3 }, { type: 'L', rotation: 2, x: 3 }, { type: 'T', rotation: 2, x: 7 }, { type: 'I', rotation: 0, x: 3 }, { type: 'Z', rotation: 1, x: 0 }])),
  endgame('t6r-keystone-20', '横桥', 18, 19088743, setup(2718282013, [{ type: 'I', rotation: 0, x: 0 }, { type: 'J', rotation: 0, x: 4 }, { type: 'L', rotation: 2, x: 3 }, { type: 'S', rotation: 1, x: 5 }, { type: 'Z', rotation: 1, x: 7 }, { type: 'T', rotation: 2, x: 7 }, { type: 'O', rotation: 3, x: 1 }, { type: 'I', rotation: 0, x: 0 }])),
]);

/** The visible workshop order is authored from replayed complexity, not legacy ID order. */
export const PUZZLE_DEFINITIONS: readonly PuzzleDefinition[] = Object.freeze(
  [...PUZZLE_LIBRARY].sort((left, right) => left.difficulty - right.difficulty || left.id.localeCompare(right.id)),
);

const PUZZLE_ID_SET = new Set<string>(PUZZLE_LIBRARY.map((candidate) => candidate.id));
const PUZZLE_SEED_SET = new Set<number>(PUZZLE_LIBRARY.map((candidate) => candidate.seed));

function validateSeedBags(definition: PuzzleDefinition): void {
  let randomizer = createRandomizer(definition.seed);
  for (let bagIndex = 0; bagIndex < 12; bagIndex += 1) {
    const bag = new Set<PieceType>();
    for (let pieceIndex = 0; pieceIndex < PIECE_TYPES.length; pieceIndex += 1) {
      const draw = drawPiece(randomizer);
      randomizer = draw.randomizer;
      bag.add(draw.piece);
    }
    if (bag.size !== PIECE_TYPES.length) throw new Error(`Puzzle ${definition.id} seed does not produce complete seven-bags.`);
  }
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** Validates T13's derived, legal five-through-eight-row endgames. */
export function validatePuzzleDefinition(definition: PuzzleDefinition): void {
  if (!PUZZLE_ID_SET.has(definition.id)) throw new Error(`Unknown puzzle id: ${definition.id}`);
  const canonical = PUZZLE_LIBRARY.find((candidate) => candidate.id === definition.id)!;
  if (!Number.isSafeInteger(definition.seed) || definition.seed <= 0 || definition.seed > 0xffff_ffff) {
    throw new Error(`Puzzle ${definition.id} has an invalid level seed.`);
  }
  if (definition.seed !== canonical.seed) throw new Error(`Puzzle ${definition.id} must retain its stable level seed.`);
  if (PUZZLE_SEED_SET.size !== PUZZLE_LIBRARY.length) throw new Error('Puzzle level seeds must be unique.');
  if (!Number.isSafeInteger(definition.difficulty) || definition.difficulty < 1
    || definition.difficulty > PUZZLE_LIBRARY.length || definition.difficulty !== canonical.difficulty) {
    throw new Error(`Puzzle ${definition.id} must retain its authored campaign difficulty.`);
  }
  if (!Number.isSafeInteger(definition.targetRows) || definition.targetRows < 3 || definition.targetRows > 8
    || definition.targetRows !== canonical.targetRows) {
    throw new Error(`Puzzle ${definition.id} must retain its explicit authored target-row count.`);
  }
  if (definition.name !== canonical.name) throw new Error(`Puzzle ${definition.id} must retain its authored name.`);
  if (!sameJson(definition.setup, canonical.setup)) throw new Error(`Puzzle ${definition.id} must retain its legal setup history.`);
  if (!Array.isArray(definition.hiddenCells) || definition.hiddenCells.length !== 0) {
    throw new Error(`Puzzle ${definition.id} must begin with an empty hidden buffer.`);
  }
  if (!Array.isArray(definition.boardRows) || definition.boardRows.length !== VISIBLE_HEIGHT) {
    throw new Error(`Puzzle ${definition.id} requires exactly ${VISIBLE_HEIGHT} visible board rows.`);
  }
  const derivedRows = rowsForSetup(definition.setup);
  if (!sameJson(definition.boardRows, derivedRows) || !sameJson(definition.boardRows, canonical.boardRows)) {
    throw new Error(`Puzzle ${definition.id} board must be derived exactly from its legal setup history.`);
  }

  let occupied = 0;
  const nonEmptyRows: number[] = [];
  for (const [y, row] of definition.boardRows.entries()) {
    if (typeof row !== 'string' || row.length !== BOARD_WIDTH) throw new Error(`Puzzle ${definition.id} contains a malformed board row.`);
    if ([...row].some((cell) => cell !== '.' && !PIECE_TYPE_SET.has(cell))) throw new Error(`Puzzle ${definition.id} contains an illegal board cell.`);
    const rowOccupied = [...row].filter((cell) => cell !== '.').length;
    if (rowOccupied === BOARD_WIDTH) throw new Error(`Puzzle ${definition.id} contains an initially full visible row.`);
    if (rowOccupied > 0) {
      nonEmptyRows.push(y);
      occupied += rowOccupied;
    }
  }

  if (occupied !== definition.setup.placements.length * 4) {
    throw new Error(`Puzzle ${definition.id} must preserve every source tetromino as four ordinary targets.`);
  }
  const expectedRows = definition.targetRows;
  if (nonEmptyRows.length !== expectedRows) {
    throw new Error(`Puzzle ${definition.id} requires exactly ${expectedRows} visible endgame rows for its campaign band.`);
  }
  const expectedStart = VISIBLE_HEIGHT - expectedRows;
  if (nonEmptyRows.some((y, index) => y !== expectedStart + index)) {
    throw new Error(`Puzzle ${definition.id} must remain a contiguous visible endgame band at the floor.`);
  }
  if (definition.boardRows.slice(0, expectedStart).some((row) => row !== EMPTY_ROW)) {
    throw new Error(`Puzzle ${definition.id} may not hide targets above its visible endgame band.`);
  }
  if (!Array.isArray(definition.anchorCells) || definition.anchorCells.length > 2) {
    throw new Error(`Puzzle ${definition.id} may contain zero, one, or two immutable anchors.`);
  }
  const anchorKeys = new Set<string>();
  const headroomStart = Math.max(0, expectedStart - 2);
  for (const anchor of definition.anchorCells) {
    if (!Number.isSafeInteger(anchor.x) || !Number.isSafeInteger(anchor.y)
      || anchor.x < 0 || anchor.x >= BOARD_WIDTH || anchor.y < headroomStart || anchor.y >= expectedStart) {
      throw new Error(`Puzzle ${definition.id} anchor must remain in the visible headroom directly above its endgame band.`);
    }
    if (definition.boardRows[anchor.y]![anchor.x] !== '.') {
      throw new Error(`Puzzle ${definition.id} anchor may not occupy an original target cell.`);
    }
    const key = coordinateKey(anchor.x, anchor.y);
    if (anchorKeys.has(key)) throw new Error(`Puzzle ${definition.id} contains duplicate immutable anchors.`);
    anchorKeys.add(key);
  }
  if (!sameJson(definition.anchorCells, canonical.anchorCells)) {
    throw new Error(`Puzzle ${definition.id} must retain its authored immutable-anchor distribution.`);
  }
  validateSeedBags(definition);
}

export function getPuzzleDefinition(id: PuzzleId): PuzzleDefinition {
  const selected = PUZZLE_LIBRARY.find((candidate) => candidate.id === id);
  if (!selected) throw new Error(`Unknown puzzle id: ${id}`);
  validatePuzzleDefinition(selected);
  return selected;
}

export function createPuzzleBoard(definition: PuzzleDefinition, includeAnchors = true): Board {
  validatePuzzleDefinition(definition);
  const board = replayPuzzleSetup(definition.setup);
  if (!includeAnchors) return board;
  for (const anchor of definition.anchorCells) board[VISIBLE_START_ROW + anchor.y]![anchor.x] = ANCHOR_CELL;
  return board;
}

/** Canonical coordinates for all authored ordinary cells that must be cleared. */
export function originalTargetCells(definition: PuzzleDefinition): readonly Cell[] {
  validatePuzzleDefinition(definition);
  return Object.freeze(definition.boardRows.flatMap((row, y) => [...row].flatMap((cell, x) => (
    cell === '.' ? [] : [Object.freeze({ x, y: VISIBLE_START_ROW + y })]
  ))));
}

export function defaultPuzzleId(): PuzzleId {
  return PUZZLE_DEFINITIONS[0]!.id;
}

export function nextPuzzleId(id: PuzzleId): PuzzleId | null {
  const index = PUZZLE_DEFINITIONS.findIndex((candidate) => candidate.id === id);
  return index >= 0 ? PUZZLE_DEFINITIONS[index + 1]?.id ?? null : null;
}
