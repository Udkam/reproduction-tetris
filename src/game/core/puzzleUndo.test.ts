import { describe, expect, it } from 'vitest';
import { createInitialState, dispatch, stateHash } from './engine';
import type { GameState } from './types';

function startPuzzle(): GameState {
  return dispatch(createInitialState(0x0badc0de, 'puzzle', 't3r-shaft-01'), { type: 'start' }).state;
}

function advanceToActive(state: GameState): GameState {
  let next = state;
  for (let guard = 0; guard < 16 && (!next.active || next.phase !== 'active'); guard += 1) {
    next = dispatch(next, { type: 'tick' }).state;
  }
  expect(next.status).toBe('playing');
  expect(next.active).not.toBeNull();
  expect(next.phase).toBe('active');
  return next;
}

function canonicalPuzzleState(state: GameState) {
  const { puzzleUndoHistory: _history, puzzleActiveSpawnCheckpoint: _activeCheckpoint, ...canonical } = state;
  return canonical;
}

describe('Puzzle Core undo', () => {
  it('records a nonrecursive pre-spawn checkpoint and respawns the same first piece at its normal entry', () => {
    const before = startPuzzle();
    const locked = dispatch(before, { type: 'hard-drop' });

    expect(locked.state.puzzleUndoHistory).toHaveLength(1);
    expect(locked.state.puzzleUndoHistory[0]).not.toHaveProperty('puzzleUndoHistory');
    expect(locked.state.puzzleUndoHistory[0]).not.toHaveProperty('puzzleActiveSpawnCheckpoint');
    expect(locked.events.some((event) => event.type === 'piece-locked')).toBe(true);

    const undone = dispatch(locked.state, { type: 'undo' });
    expect(undone.events).toEqual([{ type: 'puzzle-undone' }]);
    expect(undone.state.puzzleUndoHistory).toEqual([]);
    expect(undone.state.active).toEqual(before.active);
    expect(undone.state.board).toEqual(before.board);
    expect(undone.state.queue).toEqual(before.queue);
    expect(undone.state.pieceCount).toBe(before.pieceCount);
    expect(canonicalPuzzleState(undone.state)).toEqual(canonicalPuzzleState(before));
    expect(stateHash(undone.state)).toBe(stateHash(before));
  });

  it('walks back through successive locked pieces without changing the seeded queue order', () => {
    const firstBefore = startPuzzle();
    const firstLock = dispatch(firstBefore, { type: 'hard-drop' }).state;
    const secondBefore = advanceToActive(firstLock);
    const secondLock = dispatch(secondBefore, { type: 'hard-drop' }).state;

    expect(secondLock.puzzleUndoHistory).toHaveLength(2);

    const afterOneUndo = dispatch(secondLock, { type: 'undo' });
    expect(afterOneUndo.events).toEqual([{ type: 'puzzle-undone' }]);
    expect(afterOneUndo.state.puzzleUndoHistory).toHaveLength(1);
    expect(afterOneUndo.state.active).toEqual(secondBefore.active);
    expect(stateHash(afterOneUndo.state)).toBe(stateHash(secondBefore));
    expect(afterOneUndo.state.queue).toEqual(secondBefore.queue);

    const afterTwoUndos = dispatch(afterOneUndo.state, { type: 'undo' });
    expect(afterTwoUndos.events).toEqual([{ type: 'puzzle-undone' }]);
    expect(afterTwoUndos.state.puzzleUndoHistory).toEqual([]);
    expect(afterTwoUndos.state.active).toEqual(firstBefore.active);
    expect(stateHash(afterTwoUndos.state)).toBe(stateHash(firstBefore));
    expect(afterTwoUndos.state.queue).toEqual(firstBefore.queue);
  });

  it('is a no-op before a lock, preserves a paused state, and never rewinds a completed puzzle', () => {
    const before = startPuzzle();
    expect(dispatch(before, { type: 'undo' })).toEqual({ state: before, events: [] });

    const locked = dispatch(before, { type: 'hard-drop' }).state;
    const paused = dispatch(locked, { type: 'pause' }).state;
    const pausedUndo = dispatch(paused, { type: 'undo' });
    expect(pausedUndo.events).toEqual([{ type: 'puzzle-undone' }]);
    expect(pausedUndo.state.status).toBe('paused');
    expect(pausedUndo.state.active).toEqual(before.active);

    const finished: GameState = {
      ...locked,
      status: 'finished',
      puzzleCompletion: 'finished',
      puzzleUndoHistory: locked.puzzleUndoHistory,
    };
    expect(dispatch(finished, { type: 'undo' })).toEqual({ state: finished, events: [] });
  });
});
