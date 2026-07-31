import { describe, expect, it } from 'vitest';
import { createInitialState, dispatch } from './engine';
import { analyzePuzzleGuidance, countPuzzleBuriedHoles, puzzleRoleForPiece } from './puzzleGuidance';
import type { Board, GameState, PuzzleId } from './types';

function startedPuzzle(id: PuzzleId): GameState {
  return dispatch(createInitialState(0x51a1f00d, 'puzzle', id), { type: 'start' }).state;
}

describe('Phase 11 Puzzle guidance', () => {
  it('counts only holes buried below ordinary stack cells, not empty space below a fixed peg', () => {
    const board: Board = Array.from({ length: 6 }, () => Array(4).fill(null));
    board[1]![0] = 'A';
    board[3]![1] = 'T';
    board[5]![1] = 'L';
    expect(countPuzzleBuriedHoles(board)).toBe(1);
  });

  it('maps the visible queue to stable tactical roles without changing piece identity', () => {
    expect(['I', 'O', 'T', 'S', 'Z', 'J', 'L'].map((piece) => puzzleRoleForPiece(piece as never))).toEqual([
      'long-well', 'flat-cap', 'junction', 'offset', 'offset', 'edge-turn', 'edge-turn',
    ]);
  });

  it.each<PuzzleId>(['t3r-shaft-01', 't5r-rift-10', 'tm-puzzle-25'])(
    'diagnoses %s deterministically with a bounded current-piece landing set',
    (id) => {
      const state = startedPuzzle(id);
      const before = structuredClone(state);
      const first = analyzePuzzleGuidance(state);
      const second = analyzePuzzleGuidance(state);

      expect(first).toEqual(second);
      expect(state).toEqual(before);
      expect(first).not.toBeNull();
      expect(first!.directClearLandings).toBeGreaterThanOrEqual(0);
      expect(first!.safeLandings).toBeGreaterThanOrEqual(0);
      expect(first!.buriedHoles).toBeGreaterThanOrEqual(0);
      expect(first!.minimumBurden).toBeGreaterThanOrEqual(0);
      expect(first!.activePiece).toBe(state.active?.type);
      expect(first!.queueRoles.map(({ piece }) => piece)).toEqual(state.queue.slice(0, 2));
    },
  );

  it('recomputes after a real decision while preserving Core queue and undo state', () => {
    const state = startedPuzzle('t3r-shaft-01');
    const moved = dispatch(state, { type: 'move', dx: -1 }).state;
    const queue = [...moved.queue];
    const undo = moved.puzzleUndoHistory;
    const guidance = analyzePuzzleGuidance(moved);

    expect(guidance).not.toBeNull();
    expect(moved.queue).toEqual(queue);
    expect(moved.puzzleUndoHistory).toBe(undo);
  });

  it('stays silent outside a live Puzzle decision boundary', () => {
    expect(analyzePuzzleGuidance(createInitialState(1, 'puzzle', 't3r-shaft-01'))).toBeNull();
    expect(analyzePuzzleGuidance(dispatch(createInitialState(1, 'marathon'), { type: 'start' }).state)).toBeNull();
  });
});
