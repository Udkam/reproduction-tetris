import { describe, expect, it } from 'vitest';
import { ENTRY_DELAY_TICKS, LOCK_DELAY_TICKS } from './constants';
import { createInitialState, dispatch } from './engine';
import type { GameState } from './types';

function advance(state: GameState, ticks: number): GameState {
  let next = state;
  for (let index = 0; index < ticks; index += 1) next = dispatch(next, { type: 'tick' }).state;
  return next;
}

describe('T5 Puzzle consecutive-piece flow', () => {
  it('keeps automatic gravity disabled but locks a soft-dropped grounded piece after the shared delay', () => {
    let state = dispatch(createInitialState(0x51a1f00d, 'puzzle', 't3r-shaft-01'), { type: 'start' }).state;
    const spawnY = state.active?.y;
    state = advance(state, 180);
    expect(state.active?.y).toBe(spawnY);

    while (true) {
      const moved = dispatch(state, { type: 'soft-drop' }).state;
      if (moved.active?.y === state.active?.y) break;
      state = moved;
    }

    const firstType = state.active?.type;
    state = advance(state, LOCK_DELAY_TICKS - 1);
    expect(state.pieceCount).toBe(0);
    expect(state.active?.type).toBe(firstType);

    state = advance(state, 1);
    expect(state.pieceCount).toBe(1);
    expect(state.active).toBeNull();
    expect(state.phase).toBe('entry');

    state = advance(state, ENTRY_DELAY_TICKS);
    expect(state.status).toBe('playing');
    expect(state.active?.type).toBe(state.puzzleQueue?.[1]);
    expect(state.puzzleQueueIndex).toBe(2);
  });
});
