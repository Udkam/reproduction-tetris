import { describe, expect, it } from 'vitest';
import { PUZZLE_DEFINITIONS, createInitialState, type GameState, type PuzzleId } from './game/core';
import {
  CAMPAIGN_LEVELS,
  CAMPAIGN_TIERS,
  INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT,
  PUZZLE_ROW_BANDS,
  V2_CAMPAIGN_ORDER,
  defaultPuzzleProgress,
  isPuzzleComplete,
  isPuzzleUnlocked,
  migrateLegacyPuzzleProgress,
  migrateV2PuzzleProgress,
  nextLockedPuzzleLevel,
  nextPuzzleTierGate,
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

function progressWith(...completedLevelIds: PuzzleId[]) {
  return parsePuzzleProgress(JSON.stringify({ version: 3, completedLevelIds }));
}

function unlockedIds(progress = defaultPuzzleProgress()): PuzzleId[] {
  return CAMPAIGN_LEVELS.filter((level) => isPuzzleUnlocked(progress, level.id)).map((level) => level.id);
}

describe('all-open Puzzle workshop persistence', () => {
  it('binds every authored level to ordered difficulty and four presentation-only row bands', () => {
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
    expect(PUZZLE_ROW_BANDS.map((band) => band.length)).toEqual([5, 5, 5, 5]);
    expect(PUZZLE_ROW_BANDS.flat().map((level) => level.id)).toEqual(CAMPAIGN_LEVELS.map((level) => level.id));
    expect(CAMPAIGN_TIERS).toBe(PUZZLE_ROW_BANDS);
  });

  it('makes every level available on a fresh save and exposes no artificial gate or frontier', () => {
    const progress = defaultPuzzleProgress();
    expect(INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT).toBe(CAMPAIGN_LEVELS.length);
    expect(unlockedPuzzleLevelCount(progress)).toBe(CAMPAIGN_LEVELS.length);
    expect(unlockedIds(progress)).toEqual(CAMPAIGN_LEVELS.map((level) => level.id));
    expect(nextLockedPuzzleLevel(progress)).toBeNull();
    expect(nextPuzzleTierGate(progress)).toBeNull();
  });

  it('keeps every selected endgame open regardless of historical completion order', () => {
    const historic = progressWith(CAMPAIGN_LEVELS[16]!.id, CAMPAIGN_LEVELS[17]!.id);
    expect(unlockedPuzzleLevelCount(historic)).toBe(CAMPAIGN_LEVELS.length);
    expect(unlockedIds(historic)).toEqual(CAMPAIGN_LEVELS.map((level) => level.id));
    expect(isPuzzleComplete(historic, CAMPAIGN_LEVELS[16]!.id)).toBe(true);
    expect(nextLockedPuzzleLevel(historic)).toBeNull();
    expect(nextPuzzleTierGate(historic)).toBeNull();
  });

  it('records any canonical completed specimen as history without changing access', () => {
    const late = CAMPAIGN_LEVELS.at(-1)!;
    const first = CAMPAIGN_LEVELS[0]!;
    let progress = defaultPuzzleProgress();

    progress = recordCanonicalPuzzleCompletion(progress, finishedPuzzleState(late.id));
    expect(progress.completedLevelIds).toEqual([late.id]);
    progress = recordCanonicalPuzzleCompletion(progress, finishedPuzzleState(first.id));
    expect(progress.completedLevelIds).toEqual([first.id, late.id]);
    expect(recordCanonicalPuzzleCompletion(progress, finishedPuzzleState(first.id))).toBe(progress);
    expect(unlockedPuzzleLevelCount(progress)).toBe(CAMPAIGN_LEVELS.length);
  });

  it('migrates v3, then frozen-order v2, then v1 records without losing canonical IDs', () => {
    const first = V2_CAMPAIGN_ORDER[0]!;
    const third = V2_CAMPAIGN_ORDER[2]!;
    const fourth = V2_CAMPAIGN_ORDER[3]!;
    const late = V2_CAMPAIGN_ORDER.at(-1)!;

    const current = parsePuzzleProgress(JSON.stringify({
      version: 3,
      completedLevelIds: [third, first, third],
    }));
    expect(current).toEqual({ version: 3, completedLevelIds: orderedCampaignIds(first, third) });

    const v2 = migrateV2PuzzleProgress(JSON.stringify({
      version: 2,
      completedLevelIds: [late, third, first, third],
    }));
    expect(v2).toEqual({ version: 3, completedLevelIds: orderedCampaignIds(first, third, late) });
    expect(isPuzzleComplete(v2, late)).toBe(true);

    const legacy = migrateLegacyPuzzleProgress(JSON.stringify({
      version: 1,
      nextUnlockedLevelId: fourth,
    }));
    expect(new Set(legacy.completedLevelIds)).toEqual(new Set(V2_CAMPAIGN_ORDER.slice(0, 3)));
    expect(legacy.version).toBe(3);
  });

  it('fails closed on malformed persisted values while preserving the all-open workshop', () => {
    const baseline = defaultPuzzleProgress();
    const malformed = [
      null,
      '{',
      '[]',
      '{"version":1,"completedLevelIds":[]}',
      '{"version":2,"completedLevelIds":"t3r-shaft-01"}',
      '{"version":3,"completedLevelIds":["offset-01"]}',
      '{"version":3,"completedLevelIds":["t3r-shaft-01",42]}',
    ];

    for (const raw of malformed) {
      const parsed = parsePuzzleProgress(raw);
      expect(parsed).toEqual(baseline);
      expect(unlockedPuzzleLevelCount(parsed)).toBe(CAMPAIGN_LEVELS.length);
    }

    expect(migrateV2PuzzleProgress('{"version":2,"completedLevelIds":["offset-01"]}')).toEqual(baseline);
    expect(migrateLegacyPuzzleProgress('{"version":1,"nextUnlockedLevelId":"offset-01"}')).toEqual(baseline);
    expect(migrateLegacyPuzzleProgress('{"version":1,"nextUnlockedLevelId":null}')).toEqual(baseline);
  });
});

function orderedCampaignIds(...ids: PuzzleId[]): PuzzleId[] {
  const completed = new Set(ids);
  return CAMPAIGN_LEVELS.filter((level) => completed.has(level.id)).map((level) => level.id);
}
