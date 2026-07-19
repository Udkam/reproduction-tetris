import { describe, expect, it } from 'vitest';
import { createBoard, setCell } from './board';
import { createInitialState, dispatch, stateHash } from './engine';
import type { GameState } from './types';

function startPuzzle(): GameState {
  return dispatch(createInitialState(0x0badc0de, 'puzzle', 't3r-shaft-01'), { type: 'start' }).state;
}

function stagedPuzzleState(): GameState {
  return {
    ...startPuzzle(),
    board: createBoard(),
    active: { type: 'O', rotation: 0, x: 4, y: 38 },
    puzzleTargetCells: Object.freeze([{ x: 0, y: 39 }]),
    puzzleInitialTargetCount: 1,
    puzzleUndoHistory: Object.freeze([]),
    phase: 'active',
    phaseTicks: 0,
    gravityTicks: 0,
    lockTicks: 0,
    lockResets: 0,
    status: 'playing',
  };
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

describe('Puzzle Core undo', () => {
  it('captures a nonrecursive pre-hard-drop checkpoint and restores every canonical field including score', () => {
    const before: GameState = {
      ...stagedPuzzleState(),
      active: { type: 'O', rotation: 0, x: 4, y: 19 },
      score: 37,
    };
    const locked = dispatch(before, { type: 'hard-drop' });

    expect(locked.state.puzzleUndoHistory).toHaveLength(1);
    expect(locked.state.puzzleUndoHistory[0]).not.toHaveProperty('puzzleUndoHistory');
    expect(locked.events.some((event) => event.type === 'piece-locked')).toBe(true);
    expect(locked.state.score).toBeGreaterThan(before.score);

    const undone = dispatch(locked.state, { type: 'undo' });
    expect(undone.events).toEqual([{ type: 'puzzle-undone' }]);
    expect(undone.state.puzzleUndoHistory).toEqual([]);
    expect(undone.state).toEqual(before);
    expect(stateHash(undone.state)).toBe(stateHash(before));
    expect(undone.state.score).toBe(before.score);
  });

  it('walks backward through successive locks without changing the seeded queue order', () => {
    const firstCheckpoint = stagedPuzzleState();
    const firstLock = dispatch(firstCheckpoint, { type: 'hard-drop' }).state;
    const secondCheckpoint = advanceToActive(firstLock);
    const secondLock = dispatch(secondCheckpoint, { type: 'hard-drop' }).state;

    expect(secondLock.puzzleUndoHistory).toHaveLength(2);

    const afterOneUndo = dispatch(secondLock, { type: 'undo' });
    expect(afterOneUndo.events).toEqual([{ type: 'puzzle-undone' }]);
    expect(stateHash(afterOneUndo.state)).toBe(stateHash(secondCheckpoint));
    expect(afterOneUndo.state.puzzleUndoHistory).toHaveLength(1);

    const afterTwoUndos = dispatch(afterOneUndo.state, { type: 'undo' });
    expect(afterTwoUndos.events).toEqual([{ type: 'puzzle-undone' }]);
    expect(stateHash(afterTwoUndos.state)).toBe(stateHash(firstCheckpoint));
    expect(afterTwoUndos.state.puzzleUndoHistory).toEqual([]);
    expect(afterOneUndo.state.queue).toEqual(secondCheckpoint.queue);
    expect(afterTwoUndos.state.queue).toEqual(firstCheckpoint.queue);
  });

  it('can undo a pending line clear while preserving original-target ownership', () => {
    let board = createBoard();
    for (let x = 0; x < 8; x += 1) board = setCell(board, x, 39, 'J');
    const targets = Object.freeze(Array.from({ length: 8 }, (_, x) => ({ x, y: 39 })));
    const before: GameState = {
      ...stagedPuzzleState(),
      board,
      active: { type: 'O', rotation: 0, x: 8, y: 38 },
      puzzleTargetCells: targets,
      puzzleInitialTargetCount: targets.length,
    };
    const locked = dispatch(before, { type: 'hard-drop' });
    expect(locked.state.phase).toBe('line-clear');
    expect(locked.state.puzzleUndoHistory).toHaveLength(1);

    const undone = dispatch(locked.state, { type: 'undo' });
    expect(undone.events).toEqual([{ type: 'puzzle-undone' }]);
    expect(stateHash(undone.state)).toBe(stateHash(before));
    expect(undone.state.puzzleTargetCells).toEqual(targets);
  });

  it('keeps Pause paused and can recover from a Puzzle lock-out, but never rewinds a finished level', () => {
    const lock = dispatch(stagedPuzzleState(), { type: 'hard-drop' }).state;
    const paused = dispatch(lock, { type: 'pause' }).state;
    const pausedUndo = dispatch(paused, { type: 'undo' });
    expect(pausedUndo.events).toEqual([{ type: 'puzzle-undone' }]);
    expect(pausedUndo.state.status).toBe('paused');
    expect(pausedUndo.state.active).not.toBeNull();

    let board = createBoard();
    board = setCell(board, 4, 20, 'J');
    board = setCell(board, 5, 20, 'J');
    const beforeLockOut: GameState = {
      ...stagedPuzzleState(),
      board,
      active: { type: 'O', rotation: 0, x: 4, y: 18 },
      puzzleTargetCells: Object.freeze([{ x: 4, y: 20 }, { x: 5, y: 20 }]),
      puzzleInitialTargetCount: 2,
    };
    const lockOut = dispatch(beforeLockOut, { type: 'hard-drop' }).state;
    expect(lockOut.status).toBe('game-over');
    expect(lockOut.puzzleUndoHistory).toHaveLength(1);
    const recovered = dispatch(lockOut, { type: 'undo' });
    expect(recovered.events).toEqual([{ type: 'puzzle-undone' }]);
    expect(recovered.state.status).toBe('playing');
    expect(stateHash(recovered.state)).toBe(stateHash(beforeLockOut));
    expect(recovered.state.board).toEqual(beforeLockOut.board);

    const finished = { ...lockOut, status: 'finished' as const, puzzleCompletion: 'finished' as const };
    expect(dispatch(finished, { type: 'undo' })).toEqual({ state: finished, events: [] });
  });

  it('is a no-op outside Puzzle or before a Puzzle piece has locked', () => {
    const classic = dispatch(createInitialState(99), { type: 'start' }).state;
    expect(dispatch(classic, { type: 'undo' })).toEqual({ state: classic, events: [] });

    const readyPuzzle = createInitialState(99, 'puzzle', 't3r-shaft-01');
    expect(dispatch(readyPuzzle, { type: 'undo' })).toEqual({ state: readyPuzzle, events: [] });
  });
});
