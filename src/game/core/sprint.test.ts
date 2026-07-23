import { describe, expect, it } from 'vitest';
import { LINE_CLEAR_DELAY_TICKS, SPRINT_GRAVITY_TICKS, SPRINT_TARGET_LINES, gravityForMode } from './constants';
import { createBoard, setCell } from './board';
import { createInitialState, dispatch, replay, stateHash } from './engine';
import type { GameState } from './types';

function readyFinalClear(seed = 0x5a71): GameState {
  let board = createBoard();
  for (let x = 0; x < 8; x += 1) board = setCell(board, x, 39, 'J');
  return {
    ...dispatch(createInitialState(seed, 'sprint'), { type: 'start' }).state,
    board,
    active: { type: 'O', rotation: 0, x: 8, y: 38 },
    lines: SPRINT_TARGET_LINES - 1,
    score: 0,
  };
}

function resolveFinalClear(state: GameState) {
  let transition = dispatch(state, { type: 'hard-drop' });
  for (let tick = 0; tick < LINE_CLEAR_DELAY_TICKS; tick += 1) transition = dispatch(transition.state, { type: 'tick' });
  return transition;
}

describe('Sprint 40-line completion', () => {
  it('starts on an empty board with a fixed brisk cadence and an explicit independent objective', () => {
    const ready = createInitialState(0x5a70, 'sprint');
    expect(ready.mode).toBe('sprint');
    expect(ready.board.flat().every((cell) => cell === null)).toBe(true);
    expect(ready.sprintTargetLines).toBe(SPRINT_TARGET_LINES);
    expect(ready.sprintCompletion).toBe('active');
    expect(ready.puzzleCompletion).toBeNull();
    expect(ready.survivalBedrockRows).toBe(0);
    expect(gravityForMode('sprint', 99, 99_999, 99_999)).toBe(SPRINT_GRAVITY_TICKS);
  });

  it('finishes on the normal line-clear resolution that reaches forty, then stops all further play', () => {
    const final = resolveFinalClear(readyFinalClear());
    expect(final.state.status).toBe('finished');
    expect(final.state.sprintCompletion).toBe('finished');
    expect(final.state.lines).toBe(SPRINT_TARGET_LINES);
    expect(final.state.active).toBeNull();
    expect(final.events.map((event) => event.type)).toEqual(['lines-cleared', 'finished']);
    expect(dispatch(final.state, { type: 'hard-drop' }).state).toBe(final.state);
    expect(dispatch(final.state, { type: 'tick' }).state).toBe(final.state);
  });

  it('remains replay-deterministic, hashes its own completion state, and resets as a new Sprint run', () => {
    const first = resolveFinalClear(readyFinalClear(0x5a72)).state;
    const second = resolveFinalClear(readyFinalClear(0x5a72)).state;
    expect(stateHash(first)).toBe(stateHash(second));
    expect(stateHash(first)).not.toBe(stateHash({ ...first, sprintCompletion: 'active' }));

    const restarted = dispatch(first, { type: 'restart', seed: 0x5a73, mode: 'sprint' }).state;
    expect(restarted.status).toBe('ready');
    expect(restarted.sprintCompletion).toBe('active');
    expect(restarted.sprintTargetLines).toBe(SPRINT_TARGET_LINES);
    expect(restarted.board.flat().every((cell) => cell === null)).toBe(true);

    const replayed = replay(0x5a73, [{ type: 'start' }, { type: 'hard-drop' }], 'sprint');
    expect(replayed.mode).toBe('sprint');
  });
});
