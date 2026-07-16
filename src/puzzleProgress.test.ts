import { describe, expect, it } from 'vitest';
import referencesFile from '../docs/workstreams/tetris-t5-core/puzzle-references.json';
import { createInitialState, dispatch, type GameCommand, type GameState, type PuzzleId, type Rotation } from './game/core';
import {
  CAMPAIGN_LEVELS,
  defaultPuzzleProgress,
  isPuzzleUnlocked,
  parsePuzzleProgress,
  recordCanonicalPuzzleCompletion,
} from './puzzleProgress';

type PuzzleProgressFixture = {
  id: PuzzleId;
  name: string;
  routes: Array<{ placements: Array<{ rotation: Rotation; x: number }> }>;
};

const t5Levels = (referencesFile as unknown as { levels: PuzzleProgressFixture[] }).levels;

function rotationCommands(rotation: Rotation): GameCommand[] {
  if (rotation === 1) return [{ type: 'rotate', direction: 1 }];
  if (rotation === 2) return [{ type: 'rotate', direction: 1 }, { type: 'rotate', direction: 1 }];
  if (rotation === 3) return [{ type: 'rotate', direction: -1 }];
  return [];
}

function completeFirstT5Puzzle(): GameState {
  const reference = t5Levels[0]!;
  let state = createInitialState(0x51a1f00d, 'puzzle', reference.id);
  state = dispatch(state, { type: 'start' }).state;
  for (const placement of reference.routes[0]!.placements) {
    for (const command of rotationCommands(placement.rotation)) state = dispatch(state, command).state;
    while (state.active && state.active.x !== placement.x) {
      state = dispatch(state, { type: 'move', dx: placement.x < state.active.x ? -1 : 1 }).state;
    }
    state = dispatch(state, { type: 'hard-drop' }).state;
    while (state.status === 'playing' && (!state.active || state.phase !== 'active')) {
      state = dispatch(state, { type: 'tick' }).state;
    }
  }
  return state;
}

describe('T5 puzzle campaign presentation data', () => {
  it('binds the six T5 fixture IDs and labels without restoring numeric difficulty authority', () => {
    expect(CAMPAIGN_LEVELS.map((level) => [level.id, level.name, level.index, level.total])).toEqual(
      t5Levels.map((level, index) => [level.id, level.name, index + 1, t5Levels.length]),
    );
    expect(CAMPAIGN_LEVELS.every((level) => level.difficulty === undefined)).toBe(true);
  });

  it('fails closed to only level one for malformed, obsolete, and unknown storage', () => {
    for (const raw of [null, '{', '[]', '{"version":0,"nextUnlockedLevelId":"t3r-shaft-06"}', '{"version":1,"nextUnlockedLevelId":"offset-01"}']) {
      const progress = parsePuzzleProgress(raw);
      expect(progress).toEqual(defaultPuzzleProgress());
      expect(isPuzzleUnlocked(progress, 't3r-shaft-01')).toBe(true);
      expect(isPuzzleUnlocked(progress, 't3r-shaft-02')).toBe(false);
    }
  });

  it('advances only from a real canonical completion and never from failures or a locked run', () => {
    const state = completeFirstT5Puzzle();

    const progressed = recordCanonicalPuzzleCompletion(defaultPuzzleProgress(), state);
    expect(progressed.nextUnlockedLevelId).toBe('t3r-shaft-02');
    expect(recordCanonicalPuzzleCompletion(progressed, { ...state, puzzleCompletion: 'failed-top-out' })).toBe(progressed);
    expect(recordCanonicalPuzzleCompletion(defaultPuzzleProgress(), { ...state, completedLevelId: 't3r-shaft-04', nextUnlockedLevelId: 't3r-cascade-05' })).toEqual(defaultPuzzleProgress());
  });
});
