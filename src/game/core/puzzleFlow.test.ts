import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, ENTRY_DELAY_TICKS, LOCK_DELAY_TICKS, PUZZLE_VOLATILE_PIECE_TICKS } from './constants';
import { createBoard, setCell } from './board';
import { createInitialState, dispatch } from './engine';
import { ANCHOR_CELL, type GameState, type PieceType } from './types';

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

describe('T5 Puzzle ordinary consecutive-piece flow', () => {
  it('applies automatic gravity, shared grounded lock delay, and ordinary entry', () => {
    let state = dispatch(createInitialState(0x51a1f00d, 'puzzle', 't3r-shaft-01'), { type: 'start' }).state;
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
    expect(['entry', 'line-clear']).toContain(state.phase);

    const phaseAtLock = state.phase;
    state = resolveToActive(state);
    expect(state.status).toBe('playing');
    expect(state.active?.type).toBe(expectedNext);
    expect(state.queue).toHaveLength(5);
    expect(state.puzzleQueue).toEqual(state.queue);
    expect(state.puzzleQueueIndex).toBe(0);
    if (phaseAtLock === 'entry') expect(state.elapsedTicks).toBeGreaterThanOrEqual(48 + LOCK_DELAY_TICKS + ENTRY_DELAY_TICKS);
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
    expect(state.puzzlePieceBudget).toBeNull();
    expect(state.puzzleCompletion).toBe('active');
  });

  it.each(['t5r-arc-13', 't5r-pulse-14', 't5r-horizon-15'] as const)('solves low-pressure anchor trial %s in one seeded lock while retaining anchors', (id) => {
    let state = dispatch(createInitialState(1, 'puzzle', id), { type: 'start' }).state;
    expect(state.active?.type).toBe('I');
    state = dispatch(state, { type: 'rotate', direction: 1 }).state;
    while (state.active!.x < 7) state = dispatch(state, { type: 'move', dx: 1 }).state;
    const firstDrop = dispatch(state, { type: 'hard-drop' });
    state = firstDrop.state;
    state = advance(state, 16);

    expect(state.status).toBe('finished');
    expect(state.puzzleCompletion).toBe('finished');
    expect(state.pieceCount).toBe(1);
    expect(state.board.flat().filter((cell) => cell === ANCHOR_CELL)).toHaveLength(2);
    expect(state.board.flat().filter((cell) => cell !== null && cell !== ANCHOR_CELL)).toHaveLength(0);
  });

  it('expires a settled volatile input after 600 playing ticks, pauses safely, and settles complete components above it', () => {
    let board = createBoard();
    for (let x = 3; x <= 6; x += 1) board = setCell(board, x, BOARD_HEIGHT - 5, 'I');
    for (const cell of [{ x: 4, y: BOARD_HEIGHT - 7 }, { x: 5, y: BOARD_HEIGHT - 7 }, { x: 4, y: BOARD_HEIGHT - 6 }, { x: 5, y: BOARD_HEIGHT - 6 }]) {
      board = setCell(board, cell.x, cell.y, 'O');
    }
    let state = dispatch(createInitialState(1, 'puzzle', 't5r-arc-13'), { type: 'start' }).state;
    state = {
      ...state,
      board,
      puzzleVolatilePieces: [{ type: 'I', cells: [{ x: 3, y: BOARD_HEIGHT - 5 }, { x: 4, y: BOARD_HEIGHT - 5 }, { x: 5, y: BOARD_HEIGHT - 5 }, { x: 6, y: BOARD_HEIGHT - 5 }], expiryTicks: PUZZLE_VOLATILE_PIECE_TICKS }],
    };
    state = dispatch(state, { type: 'pause' }).state;
    state = advance(state, 8);
    expect(state.puzzleVolatilePieces[0]?.expiryTicks).toBe(PUZZLE_VOLATILE_PIECE_TICKS);
    state = dispatch(state, { type: 'resume' }).state;
    state = advance(state, PUZZLE_VOLATILE_PIECE_TICKS - 1);
    expect(state.puzzleVolatilePieces[0]?.expiryTicks).toBe(1);
    const expired = dispatch(state, { type: 'tick' });
    state = expired.state;
    expect(expired.events).toContainEqual({ type: 'piece-expired', piece: 'I' });
    expect(state.puzzleVolatilePieces).toEqual([]);
    expect(state.board[BOARD_HEIGHT - 2]?.[4]).toBe('O');
    expect(state.board[BOARD_HEIGHT - 1]?.[5]).toBe('O');
  });
});
