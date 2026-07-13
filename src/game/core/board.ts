import { BOARD_HEIGHT, BOARD_WIDTH } from './constants';
import { cellsForPiece } from './pieces';
import type { ActivePiece, Board, Cell, PieceType } from './types';

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
    if (row.every((cell) => cell !== null)) rows.push(index);
  });
  return rows;
}

export function clearRows(board: Board, rows: readonly number[]): Board {
  const removed = new Set(rows);
  const remaining = board.filter((_, index) => !removed.has(index)).map((row) => [...row]);
  const blanks = Array.from({ length: rows.length }, () => Array.from({ length: BOARD_WIDTH }, () => null));
  return [...blanks, ...remaining] as Board;
}

export function setCell(board: Board, x: number, y: number, value: PieceType | null): Board {
  const next = cloneBoard(board);
  if (!next[y] || x < 0 || x >= BOARD_WIDTH) throw new Error('Test cell is outside the canonical board.');
  next[y]![x] = value;
  return next;
}
