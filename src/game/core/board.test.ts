import { describe, expect, it } from 'vitest';
import { BOARD_WIDTH } from './constants';
import { clearRows, createBoard, fullRows, mapCellsAfterClear, setCell } from './board';
import { ANCHOR_CELL } from './types';

describe('anchor-aware row resolution', () => {
  it('keeps an anchor fixed when a lower row clears and only drops cells inside their own segment', () => {
    const anchorY = 29;
    const clearY = 33;
    let board = createBoard();
    board = setCell(board, 4, anchorY, ANCHOR_CELL);
    board = setCell(board, 4, anchorY - 1, 'J');
    board = setCell(board, 3, anchorY - 1, 'L');
    for (let x = 0; x < BOARD_WIDTH; x += 1) board = setCell(board, x, clearY, 'I');

    const rows = fullRows(board);
    const cleared = clearRows(board, rows);
    const targets = mapCellsAfterClear(board, rows, [{ x: 4, y: anchorY - 1 }, { x: 3, y: anchorY - 1 }]);

    expect(rows).toEqual([clearY]);
    expect(cleared[anchorY]?.[4]).toBe(ANCHOR_CELL);
    expect(cleared[anchorY - 1]?.[4]).toBe('J');
    expect(cleared[anchorY]?.[3]).toBe('L');
    expect(targets).toEqual([{ x: 4, y: anchorY - 1 }, { x: 3, y: anchorY }]);
  });

  it('removes the ordinary cells from an anchor row without moving the anchor itself', () => {
    const anchorY = 31;
    let board = createBoard();
    for (let x = 0; x < BOARD_WIDTH; x += 1) board = setCell(board, x, anchorY, 'T');
    board = setCell(board, 4, anchorY, ANCHOR_CELL);
    board = setCell(board, 4, anchorY - 1, 'S');

    const rows = fullRows(board);
    const cleared = clearRows(board, rows);
    const targets = mapCellsAfterClear(board, rows, [{ x: 3, y: anchorY }]);

    expect(rows).toEqual([anchorY]);
    expect(cleared[anchorY]?.[4]).toBe(ANCHOR_CELL);
    expect(cleared[anchorY]?.[3]).toBeNull();
    expect(cleared[anchorY - 1]?.[4]).toBe('S');
    expect(targets).toEqual([]);
  });
});
