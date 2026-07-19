import { describe, expect, it } from 'vitest';
import { ENTRY_DELAY_TICKS, LINE_CLEAR_DELAY_TICKS, LOCK_DELAY_TICKS, VISIBLE_HEIGHT } from './constants';
import { createBoard, setCell } from './board';
import { createInitialState, dispatch } from './engine';
import { getPuzzleDefinition } from './puzzles';
import type { GameState, PieceType } from './types';

function advance(state: GameState, ticks: number): GameState {
  let next = state;
  for (let index = 0; index < ticks; index += 1) next = dispatch(next, { type: 'tick' }).state;
  return next;
}

function resolveToActive(state: GameState): GameState {
  let next = state;
  for (let guard = 0; next.status === 'playing' && (!next.active || next.phase !== 'active') && guard < 64; guard += 1) {
    next = dispatch(next, { type: 'tick' }).state;
  }
  return next;
}

describe('T12.5 Puzzle ordinary consecutive-piece flow', () => {
  it('applies automatic gravity, shared grounded lock delay, and ordinary entry after a non-clearing lock', () => {
    let state = dispatch(createInitialState(0x51a1f00d, 'puzzle', 't3r-shaft-01'), { type: 'start' }).state;
    // Deliberately leave the visible gap; the test exercises normal continuation,
    // not the one-lock teaching solution.
    state = dispatch(state, { type: 'move', dx: -1 }).state;
    const spawnY = state.active!.y;
    state = advance(state, 48);
    expect(state.active?.y).toBe(spawnY + 1);

    while (true) {
      const beforeY = state.active?.y;
      const moved = dispatch(state, { type: 'soft-drop' }).state;
      if (moved.active?.y === beforeY) break;
      state = moved;
    }

    const expectedNext = state.queue[0];
    state = advance(state, LOCK_DELAY_TICKS - 1);
    expect(state.pieceCount).toBe(0);
    expect(state.active).not.toBeNull();

    state = advance(state, 1);
    expect(state.pieceCount).toBe(1);
    expect(state.active).toBeNull();
    expect(state.phase).toBe('entry');

    state = resolveToActive(state);
    expect(state.status).toBe('playing');
    expect(state.active?.type).toBe(expectedNext);
    expect(state.queue).toHaveLength(5);
    expect(state.puzzleQueue).toEqual(state.queue);
    expect(state.puzzleQueueIndex).toBe(0);
    expect(state.elapsedTicks).toBeGreaterThanOrEqual(48 + LOCK_DELAY_TICKS + ENTRY_DELAY_TICKS);
  });

  it('keeps replenishing after multiple public hard-drop locks without a queue or budget stop', () => {
    let state = dispatch(createInitialState(1, 'puzzle', 't5r-current-12'), { type: 'start' }).state;
    const lockedTypes: PieceType[] = [];

    for (let lock = 0; lock < 3; lock += 1) {
      expect(state.status).toBe('playing');
      expect(state.active).not.toBeNull();
      lockedTypes.push(state.active!.type);
      state = dispatch(state, { type: 'hard-drop' }).state;
      state = resolveToActive(state);
    }

    expect(lockedTypes).toHaveLength(3);
    expect(state.pieceCount).toBe(3);
    expect(state.status).toBe('playing');
    expect(state.active).not.toBeNull();
    expect(state.queue).toHaveLength(5);
    expect(state.puzzleCompletion).toBe('active');
  });

  it.each([
    't3r-shaft-01', 't5r-lattice-09', 't5r-prism-11', 't5r-horizon-15', 't6r-bastion-19',
  ] as const)('keeps %s as a shallow anchor-free teaching board', (id) => {
    const definition = getPuzzleDefinition(id);
    const state = createInitialState(1, 'puzzle', id);
    const occupiedRows = definition.boardRows.filter((row) => row !== '..........');

    expect(occupiedRows.length).toBeGreaterThanOrEqual(1);
    expect(occupiedRows.length).toBeLessThanOrEqual(4);
    expect(definition.boardRows.slice(0, VISIBLE_HEIGHT - occupiedRows.length)).toEqual(
      Array.from({ length: VISIBLE_HEIGHT - occupiedRows.length }, () => '..........'),
    );
    expect(state.puzzleGoal).toBe('original-targets-cleared');
    expect(state.board.flat().includes('A')).toBe(false);
  });

  it('tracks only original targets through a normal cleared row', () => {
    let state = dispatch(createInitialState(1, 'puzzle', 't3r-shaft-02'), { type: 'start' }).state;
    const row = state.puzzleTargetCells[0]!.y;
    const clearedTargetCount = state.puzzleTargetCells.filter((cell) => cell.y === row).length;
    let board = createBoard();
    for (let x = 0; x < 10; x += 1) board = setCell(board, x, row, 'J');
    state = {
      ...state,
      board,
      active: null,
      phase: 'line-clear',
      phaseTicks: LINE_CLEAR_DELAY_TICKS - 1,
      pendingClearRows: [row],
    };
    state = dispatch(state, { type: 'tick' }).state;
    expect(state.puzzleTargetCells).toHaveLength(state.puzzleInitialTargetCount - clearedTargetCount);
  });
});
