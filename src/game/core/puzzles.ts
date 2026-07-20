import { BOARD_WIDTH, VISIBLE_HEIGHT, VISIBLE_START_ROW } from './constants';
import { createBoard } from './board';
import { createRandomizer, drawPiece } from './random';
import { ANCHOR_CELL, PIECE_TYPES, type Board, type Cell, type PieceType, type PuzzleId } from './types';

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

export interface PuzzleDefinition {
  id: PuzzleId;
  name: string;
  /** Replay-calibrated campaign position, surfaced as the visible difficulty. */
  difficulty: number;
  /** Stable level-owned seed for the fixed deterministic seven-bag. */
  seed: number;
  /** Exactly twenty rows, each with the visible board width. */
  boardRows: readonly string[];
  /** Always empty: every authored target begins inside the visible well. */
  hiddenCells: readonly PuzzleCell[];
  /** Zero to two authored immutable single blocks outside the target floor band. */
  anchorCells: readonly PuzzleAnchorCell[];
}

const EMPTY_ROW = '.'.repeat(BOARD_WIDTH);
const EMPTY_HIDDEN_CELLS: readonly PuzzleCell[] = Object.freeze([]);
const EMPTY_ANCHOR_CELLS: readonly PuzzleAnchorCell[] = Object.freeze([]);
const PIECE_TYPE_SET = new Set<string>(PIECE_TYPES);

/**
 * Source glyphs describe target occupancy only: `T` is a normal original target and
 * `.` is an opening. The material cycle makes the still-ordinary target band legible
 * without introducing a new collision material or renderer rule.
 */
function targetBandRows(pattern: readonly string[], materialOffset: number): readonly string[] {
  const rows = Array.from({ length: VISIBLE_HEIGHT }, () => EMPTY_ROW);
  const start = VISIBLE_HEIGHT - pattern.length;
  for (const [relativeY, source] of pattern.entries()) {
    if (source.length !== BOARD_WIDTH || [...source].some((cell) => cell !== 'T' && cell !== '.')) {
      throw new Error('Puzzle target-band source must contain ten T-or-dot cells.');
    }
    rows[start + relativeY] = [...source].map((cell, x) => (
      cell === '.' ? '.' : PIECE_TYPES[(x + materialOffset + relativeY * 3) % PIECE_TYPES.length]!
    )).join('');
  }
  return Object.freeze(rows);
}

function curriculum(
  id: PuzzleId,
  name: string,
  difficulty: number,
  seed: number,
  pattern: readonly string[],
  materialOffset: number,
  anchorCells: readonly PuzzleAnchorCell[] = EMPTY_ANCHOR_CELLS,
): PuzzleDefinition {
  return Object.freeze({
    id,
    name,
    difficulty,
    seed,
    boardRows: targetBandRows(pattern, materialOffset),
    hiddenCells: EMPTY_HIDDEN_CELLS,
    anchorCells: Object.freeze(anchorCells.map((anchor) => Object.freeze({ ...anchor }))),
  });
}

/** Visible original-target rows promised by the T12.6 curriculum. */
export function expectedPuzzleTargetRows(difficulty: number): number {
  if (difficulty <= 3) return 3;
  if (difficulty <= 6) return 4;
  if (difficulty <= 10) return 5;
  if (difficulty <= 15) return 6;
  return 7;
}

/**
 * T12.6's replay-calibrated original-target curriculum. Every source pattern is a
 * three-to-seven-row floor composition with ordinary holes; each matching route is
 * independently replayed from its fixed seven-bag in puzzleSolverResults.test.ts.
 */
const PUZZLE_LIBRARY: readonly PuzzleDefinition[] = Object.freeze([
  // 01–03: three rows — read one compact clearing composition.
  curriculum('t3r-shaft-01', '青脊回旋', 1, 8, [
    'TTTT....TT',
    'TTTT....TT',
    'TTTT....TT',
  ], 0),
  curriculum('t3r-shaft-02', '深湾折返', 2, 3, [
    'TT........',
    'TT.T..TTTT',
    'TTTT.TTTTT',
  ], 1, [{ x: 0, y: 14 }]),
  curriculum('t3r-shaft-03', '双岸错层', 3, 1, [
    'TT........',
    'TTT.TTTT..',
    'TTTTTTTT.T',
  ], 2),

  // 04–06: four rows — alternate shelves and ordinary turns.
  curriculum('t3r-shaft-04', '侧槽逆流', 4, 9, [
    'T......TTT',
    'TT.....TTT',
    'TTTT...TTT',
    'TTTTT..TTT',
  ], 3, [{ x: 7, y: 13 }]),
  curriculum('t3r-cascade-05', '潮线汇流', 5, 7, [
    'T.......TT',
    'T.TT....TT',
    'TTTT.T..TT',
    'TTTTTT.TTT',
  ], 4),
  curriculum('t3r-cascade-06', '远岸终局', 6, 10, [
    'T......TTT',
    'T..T...TTT',
    'T..T..TTTT',
    'TT.TTTTTTT',
  ], 5),

  // 07–10: five rows — a readable current that has to be built in stages.
  curriculum('t5r-delta-07', '折光浅湾', 7, 27, [
    'T.....TTTT',
    'T.....TTTT',
    'T.....TTTT',
    'TT....TTTT',
    'TTTTT.TTTT',
  ], 6, [{ x: 6, y: 12 }]),
  curriculum('t5r-drift-08', '微澜错屿', 8, 15, [
    'TT......TT',
    'TT..T...TT',
    'TT..T..TTT',
    'TT..T..TTT',
    'TT.TTTTTTT',
  ], 0),
  curriculum('t5r-lattice-09', '蓝桥叠汐', 9, 22, [
    'T.....TTTT',
    'T.....TTTT',
    'T.....TTTT',
    'TT..T.TTTT',
    'TTT.T.TTTT',
  ], 1, [{ x: 8, y: 11 }]),
  curriculum('t5r-rift-10', '薄雾回廊', 10, 5, [
    '.......TTT',
    '.T.....TTT',
    'TT....TTTT',
    'TT.T.TTTTT',
    'TT.TTTTTTT',
  ], 2),

  // 11–15: six rows — longer layered currents, still with no special rule.
  curriculum('t5r-prism-11', '棱湾交错', 11, 61, [
    'T.......TT',
    'T.......TT',
    'T.......TT',
    'TTTT.TTTTT',
    'TTTT.TTTTT',
    'TTTT.TTTTT',
  ], 3, [{ x: 9, y: 10 }]),
  curriculum('t5r-current-12', '双潮折线', 12, 57, [
    'TTT.......',
    'TTT.......',
    'TTTT.T...T',
    'TTTT.T..TT',
    'TTTT.T.TTT',
    'TTTTTT.TTT',
  ], 4),
  curriculum('t5r-arc-13', '静弧深槽', 13, 35, [
    'T......TTT',
    'TT.....TTT',
    'TTT....TTT',
    'TTT....TTT',
    'TTT...TTTT',
    'TTT..TTTTT',
  ], 5),
  curriculum('t5r-pulse-14', '脉光群岛', 14, 24, [
    'T......TTT',
    'T......TTT',
    'T......TTT',
    'TT...T.TTT',
    'TTTTTT.TTT',
    'TTTTTT.TTT',
  ], 6, [{ x: 0, y: 10 }, { x: 9, y: 12 }]),
  curriculum('t5r-horizon-15', '远蓝合流', 15, 46, [
    'T......TTT',
    'T.....TTTT',
    'T.....TTTT',
    'T.....TTTT',
    'TT.T.TTTTT',
    'TT.TTTTTTT',
  ], 0),

  // 16–20: seven rows — complete a deep but transparent clearing current.
  curriculum('t6r-veil-16', '澄湾折层', 16, 599, [
    'T.........',
    'TT........',
    'TTT....TTT',
    'TTTT..TTTT',
    'TTTT..TTTT',
    'TTTT..TTTT',
    'TTTTT.TTTT',
  ], 1, [{ x: 0, y: 8 }]),
  curriculum('t6r-cairn-17', '层岩交径', 17, 416, [
    'TTT.......',
    'TTT.......',
    'TTTT......',
    'TTTT.TT..T',
    'TTTTTTT..T',
    'TTTTTTT..T',
    'TTTTTTT.TT',
  ], 2),
  curriculum('t6r-terrace-18', '岚阶回环', 18, 414, [
    'T.........',
    'TT.T...T..',
    'TTTT...TTT',
    'TTTT...TTT',
    'TTTT...TTT',
    'TTTTT..TTT',
    'TTTTT..TTT',
  ], 3, [{ x: 0, y: 6 }]),
  curriculum('t6r-bastion-19', '深湾阈门', 19, 107, [
    'T.........',
    'T..T......',
    'T..T.T..TT',
    'TT.T.T.TTT',
    'TTTT.TTTTT',
    'TTTT.TTTTT',
    'TTTT.TTTTT',
  ], 4),
  curriculum('t6r-keystone-20', '层界基石', 20, 104, [
    'TTT.......',
    'TTT.......',
    'TTTT.T...T',
    'TTTT.T...T',
    'TTTT.T...T',
    'TTTTTT.TTT',
    'TTTTTT.TTT',
  ], 5, [{ x: 2, y: 9 }]),
]);

export const PUZZLE_DEFINITIONS = PUZZLE_LIBRARY;

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
    if (bag.size !== PIECE_TYPES.length) {
      throw new Error(`Puzzle ${definition.id} seed does not produce complete seven-bags.`);
    }
  }
}

/** Validates direct authored multi-row target bands, not an obsolete deep-stack history. */
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
  if (definition.name !== canonical.name) throw new Error(`Puzzle ${definition.id} must retain its authored name.`);
  if (!Array.isArray(definition.hiddenCells) || definition.hiddenCells.length !== 0) {
    throw new Error(`Puzzle ${definition.id} must begin with an empty hidden buffer.`);
  }
  if (!Array.isArray(definition.anchorCells) || definition.anchorCells.length > 2) {
    throw new Error(`Puzzle ${definition.id} may contain zero, one, or two immutable anchors.`);
  }
  if (!Array.isArray(definition.boardRows) || definition.boardRows.length !== VISIBLE_HEIGHT) {
    throw new Error(`Puzzle ${definition.id} requires exactly ${VISIBLE_HEIGHT} visible board rows.`);
  }
  if (JSON.stringify(definition.boardRows) !== JSON.stringify(canonical.boardRows)) {
    throw new Error(`Puzzle ${definition.id} must retain its authored target pattern.`);
  }

  let occupied = 0;
  const nonEmptyRows: number[] = [];
  for (const [y, row] of definition.boardRows.entries()) {
    if (typeof row !== 'string' || row.length !== BOARD_WIDTH) {
      throw new Error(`Puzzle ${definition.id} contains a malformed board row.`);
    }
    if ([...row].some((cell) => cell !== '.' && !PIECE_TYPE_SET.has(cell))) {
      throw new Error(`Puzzle ${definition.id} contains an illegal board cell.`);
    }
    const rowOccupied = [...row].filter((cell) => cell !== '.').length;
    if (rowOccupied === BOARD_WIDTH) throw new Error(`Puzzle ${definition.id} contains an initially full visible row.`);
    if (rowOccupied > 0) {
      nonEmptyRows.push(y);
      occupied += rowOccupied;
    }
  }

  if (occupied < 12 || occupied > 48) {
    throw new Error(`Puzzle ${definition.id} requires a compact multi-row original-target band.`);
  }
  const expectedRows = expectedPuzzleTargetRows(definition.difficulty);
  if (nonEmptyRows.length !== expectedRows) {
    throw new Error(`Puzzle ${definition.id} requires exactly ${expectedRows} authored target rows for its campaign band.`);
  }
  const expectedStart = VISIBLE_HEIGHT - nonEmptyRows.length;
  if (nonEmptyRows.some((y, index) => y !== expectedStart + index)) {
    throw new Error(`Puzzle ${definition.id} target rows must form one contiguous band at the floor.`);
  }
  if (definition.boardRows.slice(0, expectedStart).some((row) => row !== EMPTY_ROW)) {
    throw new Error(`Puzzle ${definition.id} may not hide targets above its floor band.`);
  }
  const anchorKeys = new Set<string>();
  for (const anchor of definition.anchorCells) {
    if (!Number.isSafeInteger(anchor.x) || !Number.isSafeInteger(anchor.y)
      || anchor.x < 0 || anchor.x >= BOARD_WIDTH || anchor.y < 2 || anchor.y >= expectedStart) {
      throw new Error(`Puzzle ${definition.id} anchor must remain above the target band and clear of the spawn lane.`);
    }
    const key = `${anchor.x}:${anchor.y}`;
    if (anchorKeys.has(key)) throw new Error(`Puzzle ${definition.id} contains duplicate immutable anchors.`);
    anchorKeys.add(key);
  }
  if (JSON.stringify(definition.anchorCells) !== JSON.stringify(canonical.anchorCells)) {
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
  for (const anchor of definition.anchorCells) {
    board[VISIBLE_START_ROW + anchor.y]![anchor.x] = ANCHOR_CELL;
  }
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
  return PUZZLE_LIBRARY[0]!.id;
}

export function nextPuzzleId(id: PuzzleId): PuzzleId | null {
  const index = PUZZLE_LIBRARY.findIndex((candidate) => candidate.id === id);
  return index >= 0 ? PUZZLE_LIBRARY[index + 1]?.id ?? null : null;
}
