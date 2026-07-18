import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH, LINE_CLEAR_DELAY_TICKS, LOCK_DELAY_TICKS, MAX_LOCK_RESETS, STANDARD_GRAVITY_TICKS, gravityForMode } from './constants';
import { canPlace, createBoard, setCell } from './board';
import { createInitialState, dispatch, stateHash } from './engine';
import { cellsForPiece } from './pieces';
import type { Board, GameCommand, GameState } from './types';

function start(seed = 99): GameState {
  return dispatch(createInitialState(seed), { type: 'start' }).state;
}

function ticks(state: GameState, count: number): GameState {
  let next = state;
  for (let index = 0; index < count; index += 1) next = dispatch(next, { type: 'tick' }).state;
  return next;
}

describe('Modern Classic timing and score contract', () => {
  it('keeps Classic at the standard gravity regardless of legacy level or progress', () => {
    expect(gravityForMode('marathon', 0, 0, 0)).toBe(STANDARD_GRAVITY_TICKS);
    expect(gravityForMode('marathon', 29, 10_000, 10_000)).toBe(STANDARD_GRAVITY_TICKS);
  });

  it('soft drop moves one row and scores exactly one point', () => {
    const state = start();
    const y = state.active!.y;
    const transition = dispatch(state, { type: 'soft-drop' });
    expect(transition.state.active?.y).toBe(y + 1);
    expect(transition.state.score).toBe(1);
    expect(transition.events).toContainEqual({
      type: 'piece-moved',
      piece: state.active!.type,
      dx: 0,
      dy: 1,
      cause: 'soft-drop',
    });
  });

  it('removes level acceleration and starts a chain at the ten-line boundary', () => {
    let board = createBoard();
    for (let x = 0; x < 8; x += 1) board = setCell(board, x, 39, 'S');
    let state: GameState = {
      ...start(),
      board,
      active: { type: 'O', rotation: 0, x: 8, y: 38 },
      lines: 9,
      level: 0,
      score: 0,
    };
    let transition = dispatch(state, { type: 'hard-drop' });
    for (let index = 0; index < LINE_CLEAR_DELAY_TICKS; index += 1) {
      transition = dispatch(transition.state, { type: 'tick' });
    }
    expect(transition.state.lines).toBe(10);
    expect(transition.state.level).toBe(0);
    expect(transition.state.combo).toBe(1);
    expect(transition.state.score).toBe(40);
    expect(transition.events.some((event) => event.type === 'level-up')).toBe(false);
  });

  it('adds a Classic chain bonus and breaks the chain on a non-clearing lock', () => {
    const clearSetup = (state: GameState): GameState => {
      let board = createBoard();
      for (let x = 0; x < 8; x += 1) board = setCell(board, x, 39, 'S');
      return { ...state, board, active: { type: 'O', rotation: 0, x: 8, y: 38 } };
    };
    const resolve = (state: GameState): GameState => {
      let next = dispatch(state, { type: 'hard-drop' }).state;
      return ticks(next, LINE_CLEAR_DELAY_TICKS);
    };

    let state = resolve(clearSetup({ ...start(), score: 0, combo: 0 }));
    expect(state.score).toBe(40);
    expect(state.combo).toBe(1);
    state = resolve(clearSetup(state));
    expect(state.score).toBe(130);
    expect(state.combo).toBe(2);

    state = dispatch({
      ...state,
      board: createBoard(),
      active: { type: 'O', rotation: 0, x: 4, y: 38 },
    }, { type: 'hard-drop' }).state;
    expect(state.combo).toBe(0);
  });
});

describe('lockdown and rotation invariants', () => {
  it('resets lock delay on a grounded move up to the reset budget', () => {
    let state: GameState = {
      ...start(),
      board: createBoard(),
      active: { type: 'O', rotation: 0, x: 4, y: 38 },
      lockTicks: 12,
      lockResets: 0,
    };
    state = dispatch(state, { type: 'move', dx: 1 }).state;
    expect(state.lockTicks).toBe(0);
    expect(state.lockResets).toBe(1);

    state = { ...state, lockTicks: 12, lockResets: MAX_LOCK_RESETS };
    state = dispatch(state, { type: 'move', dx: -1 }).state;
    expect(state.lockTicks).toBe(12);
    expect(state.lockResets).toBe(MAX_LOCK_RESETS);
  });

  it('does not mutate a piece when all rotation kick attempts are blocked', () => {
    const active = { type: 'T', rotation: 0, x: 3, y: 25 } as const;
    let board: Board = createBoard().map((row) => row.map(() => 'J'));
    for (const cell of cellsForPiece(active)) board = setCell(board, cell.x, cell.y, null);
    const state: GameState = { ...start(), board, active };
    expect(canPlace(board, active)).toBe(true);
    const transition = dispatch(state, { type: 'rotate', direction: 1 });
    expect(transition.state.active).toEqual(active);
    expect(transition.events).toEqual([]);
  });

  it('locks out when every cell of a grounded piece is hidden', () => {
    let board = createBoard();
    board = setCell(board, 4, 20, 'Z');
    board = setCell(board, 5, 20, 'Z');
    const state: GameState = {
      ...start(),
      board,
      active: { type: 'O', rotation: 0, x: 4, y: 18 },
      lockTicks: 0,
      gravityTicks: 0,
    };
    const ended = ticks(state, LOCK_DELAY_TICKS);
    expect(ended.status).toBe('game-over');
    expect(ended.active).toBeNull();
  });
});

describe('restart and serializable invariants', () => {
  it('restarts the exact same seed with the exact same initial hash', () => {
    const initial = createInitialState(541);
    let changed = dispatch(initial, { type: 'start' }).state;
    changed = dispatch(changed, { type: 'hard-drop' }).state;
    const restarted = dispatch(changed, { type: 'restart', seed: 541 }).state;
    expect(stateHash(restarted)).toBe(stateHash(initial));
  });

  it('preserves board and active-piece invariants over a deterministic command stress run', () => {
    const commandDomain: GameCommand[] = [
      { type: 'move', dx: -1 },
      { type: 'move', dx: 1 },
      { type: 'soft-drop' },
      { type: 'hard-drop' },
      { type: 'rotate', direction: -1 },
      { type: 'rotate', direction: 1 },
      { type: 'tick' },
    ];
    let random = 0x1234abcd;
    let state = start(2026);
    for (let index = 0; index < 2400; index += 1) {
      random ^= random << 13;
      random ^= random >>> 17;
      random ^= random << 5;
      const command = commandDomain[(random >>> 0) % commandDomain.length]!;
      state = dispatch(state, command).state;
      if (state.status === 'game-over') state = dispatch(state, { type: 'restart', seed: state.seed }).state;
      if (state.status === 'ready') state = dispatch(state, { type: 'start' }).state;

      expect(state.board).toHaveLength(BOARD_HEIGHT);
      expect(state.board.every((row) => row.length === BOARD_WIDTH)).toBe(true);
      expect(state.queue).toHaveLength(5);
      if (state.active) {
        const cells = cellsForPiece(state.active);
        expect(new Set(cells.map((cell) => `${cell.x},${cell.y}`)).size).toBe(4);
        expect(canPlace(state.board, state.active)).toBe(true);
      }
    }
  });
});
