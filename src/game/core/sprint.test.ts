import { describe, expect, it } from 'vitest';
import {
  LINE_CLEAR_DELAY_TICKS,
  SPRINT_DURATION_TICKS,
  SPRINT_GRAVITY_TICKS,
  gravityForMode,
} from './constants';
import { createBoard, setCell } from './board';
import { createInitialState, dispatch, replay, stateHash } from './engine';
import { collapseSprintColumns, sprintRemainingTicks } from './sprint';
import type { GameState } from './types';

function collapseReadyState(seed = 0x5a71): GameState {
  let board = createBoard();
  // The bottom row is completed by O. After it clears, the eight cells one row
  // above collapse into the O cells and create a second, genuinely new clear.
  for (let x = 0; x < 8; x += 1) {
    board = setCell(board, x, 39, 'J');
    board = setCell(board, x, 37, 'L');
  }
  return {
    ...dispatch(createInitialState(seed, 'sprint'), { type: 'start' }).state,
    board,
    active: { type: 'O', rotation: 0, x: 8, y: 38 },
    score: 0,
  };
}

function advanceClear(state: GameState): ReturnType<typeof dispatch> {
  let transition = dispatch(state, { type: 'hard-drop' });
  for (let tick = 0; tick < LINE_CLEAR_DELAY_TICKS; tick += 1) transition = dispatch(transition.state, { type: 'tick' });
  return transition;
}

function finishCascade(state: GameState): ReturnType<typeof dispatch> {
  let transition = advanceClear(state);
  expect(transition.state.phase).toBe('line-clear');
  for (let tick = 0; tick < LINE_CLEAR_DELAY_TICKS; tick += 1) transition = dispatch(transition.state, { type: 'tick' });
  return transition;
}

describe('Collapse mode', () => {
  it('settles each ordinary column independently while retaining every material identity', () => {
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
    expect(collapsed.flat().filter((cell) => cell !== null).sort()).toEqual(['I', 'L', 'O', 'T']);
  });

  it('starts an empty fixed-clock Collapse round with fresh live bags and no Puzzle/Survival state', () => {
    const first = createInitialState(0x5a70, 'sprint');
    const second = createInitialState(0x5a70, 'sprint');
    const otherSeed = createInitialState(0x5a71, 'sprint');

    expect(first.mode).toBe('sprint');
    expect(first.sprintGoal).toBe('cascade-score-attack');
    expect(first.sprintCascadeDepth).toBe(0);
    expect(first.sprintBestCascade).toBe(0);
    expect(first.sprintCompletion).toBe('active');
    expect(first.board.flat().every((cell) => cell === null)).toBe(true);
    expect(first.queue).toEqual(second.queue);
    expect(first.queue).not.toEqual(otherSeed.queue);
    expect(first.puzzleCompletion).toBeNull();
    expect(first.survivalBedrockRows).toBe(0);
    expect(gravityForMode('sprint', 99, 99_999, 99_999)).toBe(SPRINT_GRAVITY_TICKS);
    expect(sprintRemainingTicks(0)).toBe(SPRINT_DURATION_TICKS);
  });

  it('compacts columns on a non-clearing lock, so Collapse differs before its first line', () => {
    let board = createBoard();
    board = setCell(board, 0, 34, 'T');
    const state = {
      ...dispatch(createInitialState(0x5a75, 'sprint'), { type: 'start' }).state,
      board,
      active: { type: 'O' as const, rotation: 0 as const, x: 8, y: 38 },
    };
    const locked = dispatch(state, { type: 'hard-drop' });

    expect(locked.state.phase).toBe('entry');
    expect(locked.state.pendingClearRows).toEqual([]);
    expect(locked.state.board[39]?.[0]).toBe('T');
    expect(locked.state.board[34]?.[0]).toBeNull();
    expect(locked.state.sprintCascadeDepth).toBe(0);
  });

  it('resolves a second line formed by column collapse and squares the cascade score multiplier', () => {
    const firstClear = advanceClear(collapseReadyState());
    expect(firstClear.state.phase).toBe('line-clear');
    expect(firstClear.state.pendingClearRows).toEqual([39]);
    expect(firstClear.state.sprintCascadeDepth).toBe(2);
    expect(firstClear.state.sprintBestCascade).toBe(1);
    expect(firstClear.state.score).toBe(40);
    expect(firstClear.events.map((event) => event.type)).toEqual(['lines-cleared', 'clear-started']);

    const resolved = finishCascade(collapseReadyState());
    expect(resolved.state.status).toBe('playing');
    expect(resolved.state.phase).toBe('active');
    expect(resolved.state.lines).toBe(2);
    expect(resolved.state.score).toBe(200);
    expect(resolved.state.sprintCascadeDepth).toBe(0);
    expect(resolved.state.sprintBestCascade).toBe(2);
    expect(resolved.state.board.flat().every((cell) => cell === null)).toBe(true);
    expect(resolved.events.map((event) => event.type)).toEqual(['lines-cleared']);
  });

  it('finishes only on the fixed Collapse clock, and leaves early top-outs unranked', () => {
    const nearlyOver = {
      ...dispatch(createInitialState(0x5a72, 'sprint'), { type: 'start' }).state,
      elapsedTicks: SPRINT_DURATION_TICKS - 1,
      sprintBestCascade: 3,
    };
    const finished = dispatch(nearlyOver, { type: 'tick' });
    expect(finished.state.status).toBe('finished');
    expect(finished.state.sprintCompletion).toBe('finished');
    expect(finished.state.elapsedTicks).toBe(SPRINT_DURATION_TICKS);
    expect(finished.state.sprintCascadeDepth).toBe(0);
    expect(sprintRemainingTicks(finished.state.elapsedTicks)).toBe(0);
    expect(finished.events.map((event) => event.type)).toEqual(['finished']);
    expect(dispatch(finished.state, { type: 'hard-drop' }).state).toBe(finished.state);
  });

  it('keeps Collapse replays and state hashes deterministic while separating chain state', () => {
    const first = finishCascade(collapseReadyState(0x5a73)).state;
    const second = finishCascade(collapseReadyState(0x5a73)).state;
    expect(stateHash(first)).toBe(stateHash(second));
    expect(stateHash(first)).not.toBe(stateHash({ ...first, sprintBestCascade: first.sprintBestCascade + 1 }));

    const restarted = dispatch(first, { type: 'restart', seed: 0x5a74, mode: 'sprint' }).state;
    expect(restarted.status).toBe('ready');
    expect(restarted.sprintGoal).toBe('cascade-score-attack');
    expect(restarted.sprintBestCascade).toBe(0);
    expect(restarted.board.flat().every((cell) => cell === null)).toBe(true);

    const replayed = replay(0x5a74, [{ type: 'start' }, { type: 'hard-drop' }], 'sprint');
    expect(replayed.mode).toBe('sprint');
    expect(replayed.sprintGoal).toBe('cascade-score-attack');
  });
});
