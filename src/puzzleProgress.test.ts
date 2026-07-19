import { describe, expect, it } from 'vitest';
import { PUZZLE_DEFINITIONS, createInitialState, type GameState, type PuzzleId } from './game/core';
import {
  CAMPAIGN_LEVELS,
  INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT,
  defaultPuzzleProgress,
  isPuzzleComplete,
  isPuzzleUnlocked,
  migrateLegacyPuzzleProgress,
  nextLockedPuzzleLevel,
  parsePuzzleProgress,
  recordCanonicalPuzzleCompletion,
  unlockedPuzzleLevelCount,
} from './puzzleProgress';

function finishedPuzzleState(levelId: PuzzleId): GameState {
  return {
    ...createInitialState(0x51a1f00d, 'puzzle', levelId),
    status: 'finished',
    puzzleCompletion: 'finished',
    completedLevelId: levelId,
  };
}

describe('progressive Puzzle campaign persistence', () => {
  it('binds every authored level to one ordered difficulty index', () => {
    expect(CAMPAIGN_LEVELS.map((level) => [level.id, level.name])).toEqual(
      PUZZLE_DEFINITIONS.map((level) => [level.id, level.name]),
    );
    expect(CAMPAIGN_LEVELS.map((level) => level.index)).toEqual(
      PUZZLE_DEFINITIONS.map((_, index) => index + 1),
    );
    expect(CAMPAIGN_LEVELS.map((level) => level.difficulty)).toEqual(
      PUZZLE_DEFINITIONS.map((level) => level.difficulty),
    );
    expect(CAMPAIGN_LEVELS.every((level) => level.total === CAMPAIGN_LEVELS.length)).toBe(true);
  });

  it('makes exactly the first three levels available for a new campaign', () => {
    const progress = defaultPuzzleProgress();
    const initiallyAvailable = Math.min(INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT, CAMPAIGN_LEVELS.length);

    expect(unlockedPuzzleLevelCount(progress)).toBe(initiallyAvailable);
    expect(CAMPAIGN_LEVELS.map((level) => isPuzzleUnlocked(progress, level.id))).toEqual(
      CAMPAIGN_LEVELS.map((_, index) => index < initiallyAvailable),
    );
    expect(nextLockedPuzzleLevel(progress)).toBe(CAMPAIGN_LEVELS[initiallyAvailable] ?? null);
  });

  it('opens one additional sequential level per distinct available canonical completion', () => {
    let progress = defaultPuzzleProgress();
    const initiallyAvailable = Math.min(INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT, CAMPAIGN_LEVELS.length);

    for (const [index, level] of CAMPAIGN_LEVELS.entries()) {
      const countBefore = unlockedPuzzleLevelCount(progress);
      const nextBefore = nextLockedPuzzleLevel(progress);
      const progressed = recordCanonicalPuzzleCompletion(progress, finishedPuzzleState(level.id));

      expect(unlockedPuzzleLevelCount(progressed)).toBe(
        Math.min(CAMPAIGN_LEVELS.length, initiallyAvailable + index + 1),
      );
      expect(nextLockedPuzzleLevel(progressed)).toBe(CAMPAIGN_LEVELS[unlockedPuzzleLevelCount(progressed)] ?? null);
      expect(isPuzzleComplete(progressed, level.id)).toBe(true);

      if (countBefore < CAMPAIGN_LEVELS.length) {
        expect(nextBefore).toBe(CAMPAIGN_LEVELS[countBefore]);
      }
      expect(recordCanonicalPuzzleCompletion(progressed, finishedPuzzleState(level.id))).toBe(progressed);
      progress = progressed;
    }

    expect(unlockedPuzzleLevelCount(progress)).toBe(CAMPAIGN_LEVELS.length);
    expect(nextLockedPuzzleLevel(progress)).toBeNull();
  });

  it('does not accept a completion for a locked level through a bypassed caller', () => {
    const locked = CAMPAIGN_LEVELS[INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT];
    if (!locked) return;

    const progress = defaultPuzzleProgress();
    expect(recordCanonicalPuzzleCompletion(progress, finishedPuzzleState(locked.id))).toBe(progress);
    expect(isPuzzleComplete(progress, locked.id)).toBe(false);
  });

  it('preserves valid current and legacy completion records while deriving the new unlock frontier', () => {
    const first = CAMPAIGN_LEVELS[0]!;
    const third = CAMPAIGN_LEVELS[2]!;
    const fourth = CAMPAIGN_LEVELS[3]!;
    const current = parsePuzzleProgress(JSON.stringify({
      version: 2,
      completedLevelIds: [third.id, first.id, third.id],
    }));

    expect(current).toEqual({ version: 2, completedLevelIds: [first.id, third.id] });
    expect(unlockedPuzzleLevelCount(current)).toBe(
      Math.min(CAMPAIGN_LEVELS.length, INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT + 2),
    );

    const legacy = migrateLegacyPuzzleProgress(JSON.stringify({
      version: 1,
      nextUnlockedLevelId: fourth.id,
    }));
    expect(legacy).toEqual({
      version: 2,
      completedLevelIds: CAMPAIGN_LEVELS.slice(0, 3).map((level) => level.id),
    });
    expect(unlockedPuzzleLevelCount(legacy)).toBe(
      Math.min(CAMPAIGN_LEVELS.length, INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT + 3),
    );

    const historicLateCompletion = parsePuzzleProgress(JSON.stringify({
      version: 2,
      completedLevelIds: [CAMPAIGN_LEVELS.at(-1)!.id],
    }));
    expect(isPuzzleComplete(historicLateCompletion, CAMPAIGN_LEVELS.at(-1)!.id)).toBe(true);
    expect(isPuzzleUnlocked(historicLateCompletion, CAMPAIGN_LEVELS.at(-1)!.id)).toBe(true);
    expect(nextLockedPuzzleLevel(historicLateCompletion)).toBe(
      CAMPAIGN_LEVELS[INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT + 1] ?? null,
    );
  });

  it('fails closed on malformed persisted values without opening extra levels', () => {
    const baseline = defaultPuzzleProgress();
    const malformed = [
      null,
      '{',
      '[]',
      '{"version":1,"completedLevelIds":[]}',
      '{"version":2,"completedLevelIds":"t3r-shaft-01"}',
      '{"version":2,"completedLevelIds":["offset-01"]}',
      '{"version":2,"completedLevelIds":["t3r-shaft-01",42]}',
    ];

    for (const raw of malformed) {
      const parsed = parsePuzzleProgress(raw);
      expect(parsed).toEqual(baseline);
      expect(unlockedPuzzleLevelCount(parsed)).toBe(
        Math.min(INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT, CAMPAIGN_LEVELS.length),
      );
    }

    expect(migrateLegacyPuzzleProgress('{"version":1,"nextUnlockedLevelId":"offset-01"}')).toEqual(baseline);
    expect(migrateLegacyPuzzleProgress('{"version":1,"nextUnlockedLevelId":null}')).toEqual(baseline);
  });
});
