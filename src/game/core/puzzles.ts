import { BOARD_WIDTH, VISIBLE_HEIGHT, VISIBLE_START_ROW } from './constants';
import { createBoard } from './board';
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
  difficulty: number;
  /** Exactly twenty rows, each with the visible board width. */
  boardRows: readonly string[];
  /** Always empty for authored T5 levels; makes hidden-buffer validation explicit. */
  hiddenCells: readonly PuzzleCell[];
  queue: readonly PieceType[];
  pieceBudget: number;
}

const EMPTY_ROW = '.'.repeat(BOARD_WIDTH);
const EMPTY_HIDDEN_CELLS: readonly PuzzleCell[] = Object.freeze([]);

function bottomRows(...rows: readonly string[]): readonly string[] {
  return Object.freeze([...Array.from({ length: VISIBLE_HEIGHT - rows.length }, () => EMPTY_ROW), ...rows]);
}

function definition(
  id: PuzzleId,
  name: string,
  difficulty: number,
  boardRows: readonly string[],
  queue: readonly PieceType[],
): PuzzleDefinition {
  return Object.freeze({
    id,
    name,
    difficulty,
    boardRows: Object.freeze([...boardRows]),
    hiddenCells: EMPTY_HIDDEN_CELLS,
    queue: Object.freeze([...queue]),
    pieceBudget: queue.length,
  });
}

/** Six clean-room T5 library boards. Each sequence is finite and authored. */
export const PUZZLE_DEFINITIONS: readonly PuzzleDefinition[] = [
  definition('t3r-shaft-01', '青脊回旋', 8, bottomRows(
    '.J.J.J....', '.J.J.J....', '.J.JJJ...J', '.J.JJJ...J', '.J.JJJ...J', '.JJJJJ..JJ', '.JJJJJ.JJJ',
  ), ['I', 'S', 'I', 'L', 'Z', 'I', 'J', 'O', 'J', 'T', 'I']),
  definition('t3r-shaft-02', '深湾折返', 9, bottomRows(
    '.....JJ...', '..J..JJ...', '..J..JJ...', '..J..JJ...', '..J..JJ.J.', 'J.J..JJ.J.', 'J.J.JJJJJJ',
  ), ['L', 'J', 'I', 'L', 'S', 'O', 'T', 'Z', 'J', 'I', 'O', 'I', 'I']),
  definition('t3r-shaft-03', '双岸错层', 9, bottomRows(
    '...J....J.', '.J.J....J.', '.J.J....J.', '.JJJ....J.', '.JJJJ..JJJ', '.JJJJ..JJJ', 'JJJJJ..JJJ',
  ), ['I', 'S', 'Z', 'T', 'I', 'L', 'T', 'J', 'J', 'O', 'I', 'O', 'I', 'I']),
  definition('t3r-shaft-04', '侧槽逆流', 10, bottomRows(
    '.....J...J', '.J...J...J', '.JJ..J...J', '.JJ..J...J', '.JJJ.J.J.J', 'JJJJ.J.J.J', 'JJJJ.J.JJJ',
  ), ['I', 'I', 'L', 'I', 'Z', 'J', 'S', 'O', 'T', 'L', 'I', 'O', 'I', 'I']),
  definition('t3r-cascade-05', '潮线汇流', 10, bottomRows(
    '....J.....', '....J.....', '...JJ....J', '...JJJ..JJ', '...JJJ..JJ', '...JJJJJJJ', 'J..JJJJJJJ',
  ), ['Z', 'T', 'O', 'S', 'J', 'I', 'J', 'L', 'I', 'I', 'L', 'I', 'O', 'I', 'I']),
  definition('t3r-cascade-06', '远岸终局', 10, bottomRows(
    '.J........', '.J...JJ...', '.J...JJ...', '.J..JJJ...', '.J..JJJJ..', '.J.JJJJJ..', 'JJJJJJJJ..',
  ), ['O', 'I', 'T', 'Z', 'J', 'L', 'S', 'L', 'J', 'I', 'Z', 'I', 'O', 'I', 'I']),
] as const;

const PIECE_TYPE_SET = new Set<string>(PIECE_TYPES);
const PUZZLE_ID_SET = new Set<string>(PUZZLE_DEFINITIONS.map((definition) => definition.id));

export function validatePuzzleDefinition(definition: PuzzleDefinition): void {
  if (!PUZZLE_ID_SET.has(definition.id)) throw new Error(`Unknown puzzle id: ${definition.id}`);
  if (!Number.isSafeInteger(definition.difficulty) || definition.difficulty < 1) {
    throw new Error(`Puzzle ${definition.id} has an invalid difficulty.`);
  }
  if (!Array.isArray(definition.boardRows) || definition.boardRows.length !== VISIBLE_HEIGHT) {
    throw new Error(`Puzzle ${definition.id} requires exactly ${VISIBLE_HEIGHT} visible board rows.`);
  }
  if (!Array.isArray(definition.hiddenCells) || definition.hiddenCells.length !== 0) {
    throw new Error(`Puzzle ${definition.id} must begin with an empty hidden buffer.`);
  }
  if (!Array.isArray(definition.queue) || definition.queue.length === 0) {
    throw new Error(`Puzzle ${definition.id} requires a non-empty queue.`);
  }
  if (definition.queue.some((type) => !PIECE_TYPE_SET.has(type))) {
    throw new Error(`Puzzle ${definition.id} contains an illegal queue piece.`);
  }
  if (!Number.isSafeInteger(definition.pieceBudget) || definition.pieceBudget <= 0 || definition.pieceBudget !== definition.queue.length) {
    throw new Error(`Puzzle ${definition.id} has an invalid piece budget.`);
  }
  if (definition.queue.length < 10 || definition.queue.length > 16) {
    throw new Error(`Puzzle ${definition.id} requires a 10-16 piece queue.`);
  }
  if (new Set(definition.queue).size < 4) {
    throw new Error(`Puzzle ${definition.id} requires at least four piece types.`);
  }
  for (let index = 2; index < definition.queue.length; index += 1) {
    if (definition.queue[index] === definition.queue[index - 1] && definition.queue[index] === definition.queue[index - 2]) {
      throw new Error(`Puzzle ${definition.id} contains an overlong identical-piece run.`);
    }
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
  if (nonEmptyRows.length < 6 || new Set(nonEmptyRows).size < 4) {
    throw new Error(`Puzzle ${definition.id} requires at least six occupied rows and four row shapes.`);
  }
  for (let y = 0; y < definition.boardRows.length - 1; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      if (definition.boardRows[y]![x] !== '.' && definition.boardRows[y + 1]![x] === '.') {
        throw new Error(`Puzzle ${definition.id} contains an unsupported authored cell.`);
      }
    }
  }
}

export function getPuzzleDefinition(id: PuzzleId): PuzzleDefinition {
  const definition = PUZZLE_DEFINITIONS.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown puzzle id: ${id}`);
  validatePuzzleDefinition(definition);
  return definition;
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
  return PUZZLE_DEFINITIONS[0].id;
}

export function nextPuzzleId(id: PuzzleId): PuzzleId | null {
  const index = PUZZLE_DEFINITIONS.findIndex((definition) => definition.id === id);
  return index >= 0 ? PUZZLE_DEFINITIONS[index + 1]?.id ?? null : null;
}
