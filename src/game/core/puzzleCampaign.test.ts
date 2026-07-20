import { describe, expect, it } from 'vitest';
import { createInitialState, dispatch } from './engine';
import { PUZZLE_DEFINITIONS, getPuzzleDefinition } from './puzzles';
import type { GameCommand, GameState, PuzzleId } from './types';

function settle(state: GameState): GameState {
  let next = state;
  for (let tick = 0; tick < 64 && next.status === 'playing' && (!next.active || next.phase !== 'active'); tick += 1) {
    next = dispatch(next, { type: 'tick' }).state;
  }
  return next;
}

describe('T12.6 Puzzle campaign behavior', () => {
  it('uses the natural 01–20 curriculum order with only authored immutable anchors and no public allowance', () => {
    expect(PUZZLE_DEFINITIONS.map((definition) => definition.id)).toEqual([
      't3r-shaft-01', 't3r-shaft-02', 't3r-shaft-03', 't3r-shaft-04', 't3r-cascade-05',
      't3r-cascade-06', 't5r-delta-07', 't5r-drift-08', 't5r-lattice-09', 't5r-rift-10',
      't5r-prism-11', 't5r-current-12', 't5r-arc-13', 't5r-pulse-14', 't5r-horizon-15',
      't6r-veil-16', 't6r-cairn-17', 't6r-terrace-18', 't6r-bastion-19', 't6r-keystone-20',
    ] satisfies PuzzleId[]);
    expect(PUZZLE_DEFINITIONS.every((definition) => !('solverPieceBudget' in definition))).toBe(true);
    expect(PUZZLE_DEFINITIONS.some((definition) => definition.anchorCells.length > 0)).toBe(true);
    expect(PUZZLE_DEFINITIONS.every((definition) => definition.anchorCells.length <= 2)).toBe(true);
  });

  it('continues an unsolved Puzzle through ordinary locks instead of failing by a piece count', () => {
    let state = dispatch(createInitialState(0, 'puzzle', 't3r-shaft-01'), { type: 'start' }).state;
    // Move the opening piece away from the replayed composition. It locks without
    // clearing every original target, yet the game must continue via normal flow.
    state = dispatch(state, { type: 'move', dx: -1 }).state;
    const locked = dispatch(state, { type: 'hard-drop' });
    state = settle(locked.state);

    expect(locked.events.some((event) => event.type === 'piece-locked')).toBe(true);
    expect(state.status).toBe('playing');
    expect(state.puzzleCompletion).toBe('active');
    expect(state.puzzleTargetCells.length).toBeGreaterThan(0);
    expect(state.active).not.toBeNull();
  });

  it('keeps level selection, deterministic restart, and continuous queue ownership level-local', () => {
    for (const definition of PUZZLE_DEFINITIONS) {
      const ready = createInitialState(0x51a1f00d, 'puzzle', definition.id);
      expect(ready.puzzleId).toBe(definition.id);
      expect(ready.seed).toBe(definition.seed);
      expect(ready.queue.length).toBeGreaterThanOrEqual(5);
      expect(ready.puzzleQueue).toEqual(ready.queue);
      const restarted = dispatch(ready, { type: 'restart' }).state;
      expect(restarted).toEqual(ready);
    }
  });

  it('retains direct Core selection validation for every stable campaign id', () => {
    for (const definition of PUZZLE_DEFINITIONS) {
      expect(getPuzzleDefinition(definition.id)).toBe(definition);
    }
  });

  it('does not give an arbitrary public-command replay a hidden queue limit', () => {
    const commands: GameCommand[] = [
      { type: 'start' },
      { type: 'move', dx: -1 },
      { type: 'hard-drop' },
      { type: 'tick' },
      { type: 'tick' },
      { type: 'tick' },
    ];
    const state = commands.reduce(
      (current, command) => dispatch(current, command).state,
      createInitialState(0, 'puzzle', 't3r-shaft-01'),
    );
    expect(state.status).toBe('playing');
    expect(state.puzzleCompletion).toBe('active');
  });
});
