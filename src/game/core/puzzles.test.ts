import { describe, expect, it } from 'vitest';
import { createInitialState, dispatch, replay, stateHash } from './engine';
import { PUZZLE_DEFINITIONS, getPuzzleDefinition, validatePuzzleDefinition } from './puzzles';
import type { GameCommand } from './types';

function run(commands: readonly GameCommand[], id: 'offset-01' | 'offset-02' | 'offset-03') {
  return replay(0x0ff5e7, commands, 'puzzle', id);
}

describe('clean-room puzzle definitions', () => {
  it('has three distinct typed boards, queues, and budgets', () => {
    expect(PUZZLE_DEFINITIONS).toHaveLength(3);
    expect(new Set(PUZZLE_DEFINITIONS.map((definition) => JSON.stringify(definition.board))).size).toBe(3);
    expect(new Set(PUZZLE_DEFINITIONS.map((definition) => JSON.stringify(definition.queue))).size).toBe(3);
    expect(new Set(PUZZLE_DEFINITIONS.map((definition) => definition.pieceBudget)).size).toBeGreaterThan(1);
    for (const definition of PUZZLE_DEFINITIONS) expect(() => validatePuzzleDefinition(definition)).not.toThrow();
  });

  it('fails closed for duplicate cells, empty queues, and illegal budgets', () => {
    const first = getPuzzleDefinition('offset-01');
    expect(() => validatePuzzleDefinition({ ...first, board: [...first.board, first.board[0]!] })).toThrow(/duplicate/i);
    expect(() => validatePuzzleDefinition({ ...first, queue: [] })).toThrow(/non-empty/i);
    expect(() => validatePuzzleDefinition({ ...first, pieceBudget: 2 })).toThrow(/budget/i);
  });
});

describe('puzzle canonical simulation', () => {
  it('has no automatic gravity and includes definition facts in its hash', () => {
    const initial = dispatch(createInitialState(7, 'puzzle', 'offset-01'), { type: 'start' }).state;
    let afterTicks = initial;
    for (let index = 0; index < 180; index += 1) afterTicks = dispatch(afterTicks, { type: 'tick' }).state;
    expect(afterTicks.active?.y).toBe(initial.active?.y);
    expect(stateHash(initial)).not.toBe(stateHash(createInitialState(7, 'puzzle', 'offset-02')));
  });

  it('finishes the authored rotation puzzle through public commands only', () => {
    const commands: GameCommand[] = [
      { type: 'start' },
      { type: 'rotate', direction: 1 },
      { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 },
      { type: 'hard-drop' },
    ];
    const state = run(commands, 'offset-02');
    expect(state.status).toBe('finished');
    expect(state.lines).toBe(1);
    expect(state.pieceCount).toBe(1);
    expect(state.active).toBeNull();
    expect(stateHash(state)).toBe(stateHash(run(commands, 'offset-02')));
  });

  it('requires a two-piece public command sequence for the double-layer puzzle', () => {
    const commands: GameCommand[] = [
      { type: 'start' },
      { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'hard-drop' },
      { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'hard-drop' },
    ];
    const state = run(commands, 'offset-03');
    expect(state.status).toBe('finished');
    expect(state.lines).toBe(2);
    expect(state.pieceCount).toBe(2);
  });

  it('ends immediately when the budget is exhausted and preserves puzzle identity through restart', () => {
    const failed = run([{ type: 'start' }, { type: 'hard-drop' }], 'offset-01');
    expect(failed.status).toBe('game-over');
    expect(failed.pieceCount).toBe(1);
    const restarted = dispatch(failed, { type: 'restart' }).state;
    expect(restarted.mode).toBe('puzzle');
    expect(restarted.puzzleId).toBe('offset-01');
    expect(dispatch(restarted, { type: 'restart', mode: 'marathon' }).state.puzzleId).toBeNull();
  });
});
