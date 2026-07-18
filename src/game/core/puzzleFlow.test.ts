import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, ENTRY_DELAY_TICKS, LOCK_DELAY_TICKS, PUZZLE_VOLATILE_PIECE_TICKS } from './constants';
import { createBoard, setCell } from './board';
import { createInitialState, dispatch } from './engine';
import { ANCHOR_CELL, type GameState, type PieceType } from './types';
import { getPuzzleDefinition } from './puzzles';

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

  it.each([
    ['t3r-shaft-03', 1], ['t3r-cascade-06', 1], ['t5r-lattice-09', 1], ['t5r-current-12', 1],
    ['t5r-arc-13', 2], ['t5r-pulse-14', 2], ['t5r-horizon-15', 2],
  ] as const)('keeps the authored deep endgame for %s and overlays %i anchors', (id, anchorCount) => {
    const definition = getPuzzleDefinition(id);
    const state = createInitialState(1, 'puzzle', id);

    expect(definition.variant).toBe('anchored-legacy');
    expect(definition.setup.placements.length).toBeGreaterThanOrEqual(16);
    expect(definition.boardRows.filter((row) => row !== '..........').length).toBeGreaterThanOrEqual(8);
    expect(definition.anchorCells).toHaveLength(anchorCount);
    expect(state.puzzleGoal).toBe('removable-board-empty');
    expect(state.board.flat().filter((cell) => cell === ANCHOR_CELL)).toHaveLength(anchorCount);
    for (const anchor of definition.anchorCells) expect(definition.boardRows[anchor.y]?.[anchor.x]).toBe('.');
  });

  it('expires a settled volatile input after 300 playing ticks, pauses safely, and settles complete components above it', () => {
    let board = createBoard();
    for (let x = 3; x <= 6; x += 1) board = setCell(board, x, BOARD_HEIGHT - 5, 'I');
    for (const cell of [{ x: 4, y: BOARD_HEIGHT - 7 }, { x: 5, y: BOARD_HEIGHT - 7 }, { x: 4, y: BOARD_HEIGHT - 6 }, { x: 5, y: BOARD_HEIGHT - 6 }]) {
      board = setCell(board, cell.x, cell.y, 'O');
    }
    const unrelatedCells = [
      { x: 0, y: BOARD_HEIGHT - 8 }, { x: 0, y: BOARD_HEIGHT - 7 },
      { x: 1, y: BOARD_HEIGHT - 7 }, { x: 2, y: BOARD_HEIGHT - 7 },
    ];
    for (const cell of unrelatedCells) board = setCell(board, cell.x, cell.y, 'J');
    let state = dispatch(createInitialState(1, 'puzzle', 't5r-arc-13'), { type: 'start' }).state;
    state = {
      ...state,
      board,
      gravityTicks: -1_000,
      puzzleActiveVolatile: false,
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
    for (const cell of unrelatedCells) expect(state.board[cell.y]?.[cell.x]).toBe('J');
  });
});
