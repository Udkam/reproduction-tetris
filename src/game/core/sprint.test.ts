import { describe, expect, it } from 'vitest';
import {
  ENTRY_DELAY_TICKS,
  LINE_CLEAR_DELAY_TICKS,
  MUTATION_BOMB_SCORE,
  MUTATION_EFFECT_TICKS,
} from './constants';
import { createBoard, setCell } from './board';
import { createInitialState, dispatch, stateHash } from './engine';
import { collapseSprintColumns } from './sprint';
import type { GameState, MutationItem } from './types';

function playingMutation(seed = 0x5a71): GameState {
  return dispatch(createInitialState(seed, 'sprint'), { type: 'start' }).state;
}

function resolveLineClear(state: GameState): ReturnType<typeof dispatch> {
  let transition = dispatch(state, { type: 'hard-drop' });
  for (let tick = 0; tick < LINE_CLEAR_DELAY_TICKS; tick += 1) transition = dispatch(transition.state, { type: 'tick' });
  return transition;
}

function lockAndSpawn(state: GameState): GameState {
  let next = dispatch(state, { type: 'hard-drop' }).state;
  for (let tick = 0; tick < ENTRY_DELAY_TICKS; tick += 1) next = dispatch(next, { type: 'tick' }).state;
  return next;
}

function carrierClearState(item: MutationItem): GameState {
  let board = createBoard();
  for (let x = 0; x < 8; x += 1) board = setCell(board, x, 39, 'J');
  return {
    ...playingMutation(),
    board,
    active: { type: 'O', rotation: 0, x: 8, y: 38 },
    mutationActiveCarrier: { id: 9, item },
    mutationNextCarrierId: 10,
    score: 0,
  };
}

describe('异变 mode', () => {
  it('keeps ordinary columns intact until a temporary collapse effect is active', () => {
    let board = createBoard();
    board = setCell(board, 0, 34, 'T');
    const ordinary = dispatch({
      ...playingMutation(),
      board,
      active: { type: 'O', rotation: 0, x: 8, y: 38 },
    }, { type: 'hard-drop' }).state;
    expect(ordinary.board[34]?.[0]).toBe('T');

    const collapsed = dispatch({
      ...playingMutation(),
      board,
      active: { type: 'O', rotation: 0, x: 8, y: 38 },
      mutationCollapseTicks: 1,
      mutationCarriers: [{ id: 4, item: 'freeze', cells: [{ x: 0, y: 34 }] }],
    }, { type: 'hard-drop' }).state;
    expect(collapsed.board[39]?.[0]).toBe('T');
    expect(collapsed.mutationCarriers).toEqual([{ id: 4, item: 'freeze', cells: [{ x: 0, y: 39 }] }]);
  });

  it('starts with no carrier, schedules one only after two locks, and remains seeded', () => {
    const candidates = Array.from({ length: 128 }, (_, index) => index + 1).map((seed) => {
      let state = playingMutation(seed);
      state = lockAndSpawn(state);
      state = lockAndSpawn(state);
      return state;
    });
    const carrierState = candidates.find((state) => state.mutationActiveCarrier !== null);
    expect(carrierState).toBeDefined();
    expect(playingMutation(1).mutationActiveCarrier).toBeNull();
    if (!carrierState) return;

    const replayed = lockAndSpawn(lockAndSpawn(playingMutation(carrierState.seed)));
    expect(replayed.mutationActiveCarrier).toEqual(carrierState.mutationActiveCarrier);
    expect(stateHash(replayed)).toBe(stateHash(carrierState));
  });

  it('activates a marked carrier exactly once when any of its cells clears', () => {
    const transition = resolveLineClear(carrierClearState('freeze'));
    expect(transition.state.mutationFreezeTicks).toBe(MUTATION_EFFECT_TICKS);
    expect(transition.state.mutationCarriers).toEqual([]);
    expect(transition.events).toContainEqual({
      type: 'mutation-activated',
      item: 'freeze',
      durationTicks: MUTATION_EFFECT_TICKS,
      score: 0,
      rowsRemoved: 0,
    });
  });

  it('freezes automatic gravity but leaves manual soft drop available', () => {
    const state = {
      ...playingMutation(),
      mutationFreezeTicks: 4,
      gravityTicks: 47,
    };
    const frozen = dispatch(state, { type: 'tick' }).state;
    expect(frozen.active?.y).toBe(state.active?.y);
    expect(frozen.gravityTicks).toBe(0);
    expect(frozen.mutationFreezeTicks).toBe(3);
    expect(dispatch(frozen, { type: 'soft-drop' }).state.active?.y).toBe((state.active?.y ?? 0) + 1);
  });

  it('uses a bomb to remove the bottom three rows, award points, and advance speed progress', () => {
    let state = carrierClearState('bomb');
    let board = state.board;
    board = setCell(board, 0, 37, 'L');
    board = setCell(board, 1, 38, 'S');
    state = { ...state, board };
    const transition = resolveLineClear(state);

    expect(transition.state.lines).toBe(4);
    expect(transition.state.score).toBe(40 + MUTATION_BOMB_SCORE);
    expect(transition.state.board.flat().every((cell) => cell === null)).toBe(true);
    expect(transition.events).toContainEqual({ type: 'lines-cleared', rows: [37, 38, 39], count: 3, score: MUTATION_BOMB_SCORE });
    expect(transition.events).toContainEqual({ type: 'mutation-activated', item: 'bomb', durationTicks: 0, score: MUTATION_BOMB_SCORE, rowsRemoved: 3 });
  });

  it('doubles ordinary line-clear score while multiplier is active and includes item state in its hash', () => {
    const transition = resolveLineClear({ ...carrierClearState('freeze'), mutationMultiplierTicks: MUTATION_EFFECT_TICKS });
    expect(transition.state.score).toBe(80);
    expect(stateHash(transition.state)).not.toBe(stateHash({ ...transition.state, mutationMultiplierTicks: 0 }));
  });

  it('keeps the reusable independent-column resolver deterministic for the timed effect', () => {
    let board = createBoard();
    board = setCell(board, 0, 34, 'T');
    board = setCell(board, 0, 38, 'I');
    board = setCell(board, 1, 36, 'L');
    board = setCell(board, 1, 39, 'O');

    const collapsed = collapseSprintColumns(board);
    expect(collapsed[39]?.[0]).toBe('I');
    expect(collapsed[38]?.[0]).toBe('T');
    expect(collapsed[39]?.[1]).toBe('O');
    expect(collapsed[38]?.[1]).toBe('L');
  });
});
