import { BOARD_WIDTH, VISIBLE_HEIGHT, VISIBLE_START_ROW } from './constants';
import { createBoard } from './board';
import { createRandomizer, drawPiece } from './random';
import { PIECE_TYPES, type Board, type Cell, type PieceType, type PuzzleId } from './types';

export interface PuzzleCell {
  x: number;
  /** Visible-board coordinate, where 0 is the top and 19 is the floor. */
  y: number;
  type: PieceType;
}

export interface PuzzleDefinition {
  id: PuzzleId;
  name: string;
  /** Authored curriculum position, surfaced as the visible gentle difficulty. */
  difficulty: number;
  /** Stable level-owned seed for the fixed deterministic seven-bag. */
  seed: number;
  /** Exactly twenty rows, each with the visible board width. */
  boardRows: readonly string[];
  /** Always empty: the authored target band begins inside the visible well. */
  hiddenCells: readonly PuzzleCell[];
}

const EMPTY_ROW = '.'.repeat(BOARD_WIDTH);
const EMPTY_HIDDEN_CELLS: readonly PuzzleCell[] = Object.freeze([]);
const PIECE_TYPE_SET = new Set<string>(PIECE_TYPES);

/**
 * A shallow target row uses the existing seven-piece material vocabulary only for
 * visual variety. Its dots are the intentionally obvious holes the incoming piece
 * completes; material never changes collision or target ownership.
 */
function targetRow(gaps: readonly number[], materialOffset: number): string {
  const gapSet = new Set(gaps);
  return Array.from({ length: BOARD_WIDTH }, (_, x) => (
    gapSet.has(x) ? '.' : PIECE_TYPES[(x + materialOffset) % PIECE_TYPES.length]!
  )).join('');
}

function shallowRows(rowCount: number, gaps: readonly number[], materialOffset: number): readonly string[] {
  const rows = Array.from({ length: VISIBLE_HEIGHT }, () => EMPTY_ROW);
  for (let index = 0; index < rowCount; index += 1) {
    rows[VISIBLE_HEIGHT - rowCount + index] = targetRow(gaps, materialOffset + index * 2);
  }
  return Object.freeze(rows);
}

function curriculum(
  id: PuzzleId,
  name: string,
  difficulty: number,
  seed: number,
  rowCount: number,
  gaps: readonly number[],
  materialOffset: number,
): PuzzleDefinition {
  return Object.freeze({
    id,
    name,
    difficulty,
    seed,
    boardRows: shallowRows(rowCount, gaps, materialOffset),
    hiddenCells: EMPTY_HIDDEN_CELLS,
  });
}

/**
 * T12.5's low-pressure curriculum. Every board is a visible near-floor gap:
 * 01–07 introduce the seven shapes without rotation, 08–13 add one ordinary
 * rotation, and 14–20 use a clear vertical I-channel across two to four rows.
 * The fixed seed supplies the intended opening block while normal seven-bag play
 * remains available after a mistake.
 */
const PUZZLE_LIBRARY: readonly PuzzleDefinition[] = Object.freeze([
  curriculum('t3r-shaft-01', '青脊回旋', 1, 3, 1, [3, 4, 5, 6], 0),
  curriculum('t3r-shaft-02', '深湾折返', 2, 6, 2, [4, 5], 1),
  curriculum('t3r-shaft-03', '双岸错层', 3, 10, 1, [3, 4, 5], 2),
  curriculum('t3r-shaft-04', '侧槽逆流', 4, 9, 1, [3, 4], 3),
  curriculum('t3r-cascade-05', '潮线汇流', 5, 1, 1, [4, 5], 4),
  curriculum('t3r-cascade-06', '远岸终局', 6, 2, 1, [3, 4, 5], 5),
  curriculum('t5r-delta-07', '折光浅湾', 7, 4, 1, [3, 4, 5], 6),
  curriculum('t5r-drift-08', '微澜错屿', 8, 5, 1, [5], 1),
  curriculum('t5r-lattice-09', '蓝桥叠汐', 9, 35, 1, [4], 2),
  curriculum('t5r-rift-10', '薄雾回廊', 10, 41, 1, [5], 3),
  curriculum('t5r-prism-11', '棱湾交错', 11, 12, 1, [5, 6], 4),
  curriculum('t5r-current-12', '双潮折线', 12, 19, 1, [6], 5),
  curriculum('t5r-arc-13', '静弧深槽', 13, 22, 1, [2], 6),
  curriculum('t5r-pulse-14', '脉光群岛', 14, 13, 2, [5], 0),
  curriculum('t5r-horizon-15', '远蓝合流', 15, 26, 2, [7], 1),
  curriculum('t6r-veil-16', '澄湾折层', 16, 39, 2, [2], 2),
  curriculum('t6r-cairn-17', '层岩交径', 17, 49, 3, [5], 3),
  curriculum('t6r-terrace-18', '岚阶回环', 18, 66, 3, [7], 4),
  curriculum('t6r-bastion-19', '深湾阈门', 19, 75, 4, [5], 5),
  curriculum('t6r-keystone-20', '层界基石', 20, 97, 4, [7], 6),
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

/** Validates direct authored teaching boards rather than an obsolete deep-stack history. */
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

  if (occupied < 6 || occupied > 36) {
    throw new Error(`Puzzle ${definition.id} requires a small, non-empty original target band.`);
  }
  if (nonEmptyRows.length < 1 || nonEmptyRows.length > 4) {
    throw new Error(`Puzzle ${definition.id} requires one to four authored target rows.`);
  }
  const expectedStart = VISIBLE_HEIGHT - nonEmptyRows.length;
  if (nonEmptyRows.some((y, index) => y !== expectedStart + index)) {
    throw new Error(`Puzzle ${definition.id} target rows must form one shallow contiguous band at the floor.`);
  }
  if (definition.boardRows.slice(0, expectedStart).some((row) => row !== EMPTY_ROW)) {
    throw new Error(`Puzzle ${definition.id} may not hide targets above its shallow band.`);
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
