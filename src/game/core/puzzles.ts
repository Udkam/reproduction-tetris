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
  board: readonly PuzzleCell[];
  queue: readonly PieceType[];
  pieceBudget: number;
  targetLines: number;
}

const bottomRow = (filledThrough: number, type: PieceType, y = VISIBLE_HEIGHT - 1): PuzzleCell[] => (
  Array.from({ length: filledThrough + 1 }, (_, x) => ({ x, y, type }))
);

/**
 * The authored layouts deliberately teach three different public command routes:
 * a horizontal placement, a clockwise I rotation, and a two-piece sequence.
 */
export const PUZZLE_DEFINITIONS: readonly PuzzleDefinition[] = [
  {
    id: 'offset-01',
    name: '右侧补线',
    board: bottomRow(5, 'J'),
    queue: ['I'],
    pieceBudget: 1,
    targetLines: 1,
  },
  {
    id: 'offset-02',
    name: '竖线缺口',
    board: bottomRow(8, 'L'),
    queue: ['I', 'T', 'O'],
    pieceBudget: 3,
    targetLines: 1,
  },
  {
    id: 'offset-03',
    name: '双层回填',
    board: [...bottomRow(5, 'S', VISIBLE_HEIGHT - 2), ...bottomRow(5, 'Z')],
    queue: ['I', 'I'],
    pieceBudget: 2,
    targetLines: 2,
  },
] as const;

const PIECE_TYPE_SET = new Set<string>(PIECE_TYPES);
const PUZZLE_ID_SET = new Set<string>(PUZZLE_DEFINITIONS.map((definition) => definition.id));

export function validatePuzzleDefinition(definition: PuzzleDefinition): void {
  if (!PUZZLE_ID_SET.has(definition.id)) throw new Error(`Unknown puzzle id: ${definition.id}`);
  if (!Array.isArray(definition.board) || !Array.isArray(definition.queue) || definition.queue.length === 0) {
    throw new Error(`Puzzle ${definition.id} requires a non-empty board array and queue.`);
  }
  if (!Number.isSafeInteger(definition.pieceBudget) || definition.pieceBudget <= 0 || definition.pieceBudget > definition.queue.length) {
    throw new Error(`Puzzle ${definition.id} has an invalid piece budget.`);
  }
  if (!Number.isSafeInteger(definition.targetLines) || definition.targetLines <= 0 || definition.targetLines > VISIBLE_HEIGHT) {
    throw new Error(`Puzzle ${definition.id} has an invalid target line count.`);
  }
  const occupied = new Set<string>();
  for (const cell of definition.board) {
    if (!Number.isInteger(cell.x) || !Number.isInteger(cell.y)
      || cell.x < 0 || cell.x >= BOARD_WIDTH || cell.y < 0 || cell.y >= VISIBLE_HEIGHT
      || !PIECE_TYPE_SET.has(cell.type)) {
      throw new Error(`Puzzle ${definition.id} contains an illegal board cell.`);
    }
    const key = `${cell.x}:${cell.y}`;
    if (occupied.has(key)) throw new Error(`Puzzle ${definition.id} contains a duplicate board cell.`);
    occupied.add(key);
  }
  if (definition.queue.some((type) => !PIECE_TYPE_SET.has(type))) {
    throw new Error(`Puzzle ${definition.id} contains an illegal queue piece.`);
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
  for (const cell of definition.board) board[VISIBLE_START_ROW + cell.y]![cell.x] = cell.type;
  return board;
}

export function defaultPuzzleId(): PuzzleId {
  return PUZZLE_DEFINITIONS[0].id;
}
