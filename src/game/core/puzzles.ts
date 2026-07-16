import { BOARD_WIDTH, VISIBLE_HEIGHT, VISIBLE_START_ROW } from './constants';
import { createBoard } from './board';
import { createRandomizer, drawPiece } from './random';
import { PIECE_TYPES, type Board, type PieceType, type PuzzleId } from './types';

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
  /** Exactly twenty rows, each with the visible board width. */
  boardRows: readonly string[];
  /** Always empty for authored T5 levels; makes hidden-buffer validation explicit. */
  hiddenCells: readonly PuzzleCell[];
}

/**
 * Temporary type-only facade for the blocked frontend's old `level.difficulty` read.
 * Runtime definitions do not own this property; the frontend slice removes the read.
 */
type LegacyPuzzleDefinitionView = PuzzleDefinition & { readonly difficulty: number };

const EMPTY_ROW = '.'.repeat(BOARD_WIDTH);
const EMPTY_HIDDEN_CELLS: readonly PuzzleCell[] = Object.freeze([]);

function bottomRows(...rows: readonly string[]): readonly string[] {
  return Object.freeze([...Array.from({ length: VISIBLE_HEIGHT - rows.length }, () => EMPTY_ROW), ...rows]);
}

function definition(
  id: PuzzleId,
  name: string,
  seed: number,
  boardRows: readonly string[],
): PuzzleDefinition {
  return Object.freeze({
    id,
    name,
    seed,
    boardRows: Object.freeze([...boardRows]),
    hiddenCells: EMPTY_HIDDEN_CELLS,
  });
}

/** Six clean-room T5 starting boards. Piece input comes only from each level seed. */
const PUZZLE_LIBRARY: readonly PuzzleDefinition[] = [
  definition('t3r-shaft-01', '青脊回旋', 0x75c0b101, bottomRows(
    'JJ.J.JJJ..', 'JJJ.J..JJJ', '.JJ..JJJJJ', 'JJJ.JJJJJ.', 'JJJ..JJJJJ', 'JJ..JJJJJJ', 'JJJJJJJJJ.', 'JJJJJJ.JJJ', 'JJJJJ.JJJJ', '.JJJJJJJJJ',
  )),
  definition('t3r-shaft-02', '深湾折返', 0x75c0b202, bottomRows(
    'JJJ.J..JJ.', 'J...JJJJJJ', 'J..JJJJJ.J', 'JJJJ.JJJJ.', 'JJJJJ.JJ.J', 'JJ..JJJJJJ', 'JJ.JJJJJJJ', 'JJJJ.JJJJJ', '.JJJJJJJJJ', 'JJJJJJJJJ.',
  )),
  definition('t3r-shaft-03', '双岸错层', 0x75c0b303, bottomRows(
    'JJ...JJJ.J', 'JJJ...JJJJ', 'JJ.JJJJJ..', 'J.JJJ.JJJJ', 'J.JJJJ.JJJ', 'JJJJ..JJJJ', 'JJJJJJJ.JJ', 'JJJJJJJJJ.', 'JJJJJJJJ.J', 'J.JJJJJJJJ',
  )),
  definition('t3r-shaft-04', '侧槽逆流', 0x75c0b404, bottomRows(
    '..JJJ.JJ.J', 'JJ.JJJ.J.J', '...JJJJJJJ', 'J.JJJJJJ.J', 'JJJJJJJJJ.', 'JJJJJ.JJJJ', 'J.JJJJJJJJ', 'JJJ.JJJJJJ',
  )),
  definition('t3r-cascade-05', '潮线汇流', 0x75c0b505, bottomRows(
    'J.J...JJJJ', '.JJJJJ.J.J', '.J.JJJJ.JJ', '.JJJ.JJJJJ', '.JJJJJJJJJ', 'J.JJJJJJJJ', 'JJJJJ.JJJJ', 'JJJJ.JJJJJ',
  )),
  definition('t3r-cascade-06', '远岸终局', 0x75c0b606, bottomRows(
    'JJJJJ...J.', '.JJ..JJJJJ', 'JJJ.JJ..JJ', 'J.JJJJJJJ.', '..JJJJJJJJ', 'JJJ.J.JJJJ', 'J.JJJJJJJJ', 'JJJJJ.JJJJ', 'JJJ.JJJJJJ', 'JJJJJJJJ.J',
  )),
] as const;

// See LegacyPuzzleDefinitionView above. No runtime object contains a numeric difficulty.
export const PUZZLE_DEFINITIONS = PUZZLE_LIBRARY as readonly LegacyPuzzleDefinitionView[];

const PIECE_TYPE_SET = new Set<string>(PIECE_TYPES);
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

export function validatePuzzleDefinition(definition: PuzzleDefinition): void {
  if (!PUZZLE_ID_SET.has(definition.id)) throw new Error(`Unknown puzzle id: ${definition.id}`);
  const canonical = PUZZLE_LIBRARY.find((candidate) => candidate.id === definition.id)!;
  if (!Number.isSafeInteger(definition.seed) || definition.seed <= 0 || definition.seed > 0xffff_ffff) {
    throw new Error(`Puzzle ${definition.id} has an invalid level seed.`);
  }
  if (definition.seed !== canonical.seed) throw new Error(`Puzzle ${definition.id} must retain its stable level seed.`);
  if (PUZZLE_SEED_SET.size !== PUZZLE_LIBRARY.length) throw new Error('Puzzle level seeds must be unique.');
  if (!Array.isArray(definition.boardRows) || definition.boardRows.length !== VISIBLE_HEIGHT) {
    throw new Error(`Puzzle ${definition.id} requires exactly ${VISIBLE_HEIGHT} visible board rows.`);
  }
  if (!Array.isArray(definition.hiddenCells) || definition.hiddenCells.length !== 0) {
    throw new Error(`Puzzle ${definition.id} must begin with an empty hidden buffer.`);
  }

  let occupied = 0;
  const nonEmptyRows: string[] = [];
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
    if (rowOccupied > 0) nonEmptyRows.push(row);
  }
  if (occupied === 0) throw new Error(`Puzzle ${definition.id} requires a non-empty authored board.`);
  if (nonEmptyRows.length < 8 || nonEmptyRows.length > 12) {
    throw new Error(`Puzzle ${definition.id} requires an 8-12 row initial stack.`);
  }
  if (new Set(nonEmptyRows).size < 5) {
    throw new Error(`Puzzle ${definition.id} requires at least five distinct non-empty row shapes.`);
  }
  const rowDensities = nonEmptyRows.map((row) => [...row].filter((cell) => cell !== '.').length);
  if (new Set(rowDensities).size < 3 || rowDensities.filter((count) => count <= BOARD_WIDTH - 3).length < 2) {
    throw new Error(`Puzzle ${definition.id} forbids repeated floor templates and requires layered cavity density.`);
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
  if (coveredEmptyColumns.size < 3 || buriedHoles < 4) {
    throw new Error(`Puzzle ${definition.id} requires staggered covered cavities in at least three columns.`);
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

export function defaultPuzzleId(): PuzzleId {
  return PUZZLE_LIBRARY[0]!.id;
}

export function nextPuzzleId(id: PuzzleId): PuzzleId | null {
  const index = PUZZLE_LIBRARY.findIndex((candidate) => candidate.id === id);
  return index >= 0 ? PUZZLE_LIBRARY[index + 1]?.id ?? null : null;
}
