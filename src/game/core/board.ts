import { BOARD_HEIGHT, BOARD_WIDTH } from './constants';
import { cellsForPiece } from './pieces';
import { ANCHOR_CELL, BEDROCK_CELL, type ActivePiece, type Board, type BoardCell, type Cell } from './types';

export function createBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => null));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function isInside(cell: Cell): boolean {
  return cell.x >= 0 && cell.x < BOARD_WIDTH && cell.y >= 0 && cell.y < BOARD_HEIGHT;
}

export function canPlace(board: Board, piece: ActivePiece): boolean {
  return cellsForPiece(piece).every((cell) => isInside(cell) && board[cell.y]?.[cell.x] === null);
}

export function isGrounded(board: Board, piece: ActivePiece): boolean {
  return !canPlace(board, { ...piece, y: piece.y + 1 });
}

export function mergePiece(board: Board, piece: ActivePiece): Board {
  const next = cloneBoard(board);
  for (const cell of cellsForPiece(piece)) {
    if (!isInside(cell)) throw new Error('Cannot merge a piece outside the canonical board.');
    next[cell.y]![cell.x] = piece.type;
  }
  return next;
}

export function fullRows(board: Board): number[] {
  const rows: number[] = [];
  board.forEach((row, index) => {
    if (row.every((cell) => cell !== null && cell !== BEDROCK_CELL)) rows.push(index);
  });
  return rows;
}

export function clearRows(board: Board, rows: readonly number[]): Board {
  const anchoredRows = new Set(rows.filter((index) => board[index]?.includes(ANCHOR_CELL)));
  const removed = new Set(rows.filter((index) => !board[index]?.includes(BEDROCK_CELL) && !anchoredRows.has(index)));
  const remaining = board.filter((_, index) => !removed.has(index)).map((row) => [...row]);
  const blanks = Array.from({ length: removed.size }, () => Array.from({ length: BOARD_WIDTH }, () => null));
  const settled = [...blanks, ...remaining] as Board;
  for (const index of anchoredRows) {
    const shiftedIndex = index + removed.size - [...removed].filter((removedIndex) => removedIndex < index).length;
    const row = settled[shiftedIndex];
    if (!row) continue;
    settled[shiftedIndex] = row.map((cell) => cell === ANCHOR_CELL ? ANCHOR_CELL : null);
  }
  return settled;
}

export function raiseBedrock(board: Board, count: number): { board: Board; added: number; overflow: boolean } {
  let next = cloneBoard(board);
  let added = 0;
  let overflow = false;
  const requested = Math.max(0, Math.floor(count));
  while (added < requested) {
    overflow ||= next[0]!.some((cell) => cell !== null);
    next = [
      ...next.slice(1).map((row) => [...row]),
      Array.from({ length: BOARD_WIDTH }, () => BEDROCK_CELL),
    ];
    added += 1;
  }
  return { board: next, added, overflow };
}

export function lowerBedrock(board: Board, count: number): { board: Board; removed: number } {
  let next = cloneBoard(board);
  let removed = 0;
  const requested = Math.max(0, Math.floor(count));
  while (removed < requested && next.at(-1)?.every((cell) => cell === BEDROCK_CELL)) {
    next = [
      Array.from({ length: BOARD_WIDTH }, () => null),
      ...next.slice(0, -1).map((row) => [...row]),
    ];
    removed += 1;
  }
  return { board: next, removed };
}

export function setCell(board: Board, x: number, y: number, value: BoardCell): Board {
  const next = cloneBoard(board);
  if (!next[y] || x < 0 || x >= BOARD_WIDTH) throw new Error('Test cell is outside the canonical board.');
  next[y]![x] = value;
  return next;
}
