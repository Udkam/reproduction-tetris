import { describe, expect, it } from 'vitest';
import { PUZZLE_DEFINITIONS, createInitialState, type GameState, type PuzzleId } from './game/core';
import {
  CAMPAIGN_LEVELS,
  CAMPAIGN_TIERS,
  INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT,
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

describe('tiered Puzzle campaign persistence', () => {
  it('binds every authored level to one ordered difficulty index and fixed tier shape', () => {
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
    expect(CAMPAIGN_TIERS.map((tier) => tier.length)).toEqual([3, 3, 3, 3, 3, 3, 2]);
    expect(CAMPAIGN_TIERS.flat().map((level) => level.id)).toEqual(CAMPAIGN_LEVELS.map((level) => level.id));
  });

  it('makes exactly the first three levels available for a new campaign', () => {
    const progress = defaultPuzzleProgress();
    expect(unlockedPuzzleLevelCount(progress)).toBe(INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT);
    expect(unlockedIds(progress)).toEqual(CAMPAIGN_TIERS[0]!.map((level) => level.id));
    expect(nextLockedPuzzleLevel(progress)).toBe(CAMPAIGN_LEVELS[3] ?? null);
    expect(nextPuzzleTierGate(progress)).toMatchObject({
      completedCount: 0,
      requiredCount: 2,
      prerequisiteTier: CAMPAIGN_TIERS[0],
      unlocksTier: CAMPAIGN_TIERS[1],
    });
  });

  it('uses the immediate prior tier only and opens each full tier at two completions', () => {
    const [first, second, third] = CAMPAIGN_TIERS[0]!;
    const [fourth, fifth, sixth] = CAMPAIGN_TIERS[1]!;
    const seventhTier = CAMPAIGN_TIERS[2]!;

    const zero = progressWith();
    const one = progressWith(first!.id);
    const firstAndThird = progressWith(first!.id, third!.id);
    const plusFourth = progressWith(first!.id, third!.id, fourth!.id);
    const secondGate = progressWith(first!.id, third!.id, fourth!.id, sixth!.id);

    expect(unlockedIds(zero)).toEqual(CAMPAIGN_TIERS[0]!.map((level) => level.id));
    expect(unlockedIds(one)).toEqual(CAMPAIGN_TIERS[0]!.map((level) => level.id));
    expect(unlockedIds(firstAndThird)).toEqual(CAMPAIGN_TIERS.slice(0, 2).flat().map((level) => level.id));
    expect(unlockedIds(plusFourth)).toEqual(CAMPAIGN_TIERS.slice(0, 2).flat().map((level) => level.id));
    expect(unlockedIds(secondGate)).toEqual(CAMPAIGN_TIERS.slice(0, 3).flat().map((level) => level.id));
    expect(nextPuzzleTierGate(secondGate)).toMatchObject({
      completedCount: 0,
      requiredCount: 2,
      prerequisiteTier: seventhTier,
      unlocksTier: CAMPAIGN_TIERS[3],
    });

    // Silence TypeScript's unused check while retaining explicit named tier positions.
    expect(second).toBeDefined();
    expect(fifth).toBeDefined();
  });

  it('keeps historical late completions selectable without cascading through missing earlier gates', () => {
    const historic = progressWith(CAMPAIGN_LEVELS[16]!.id, CAMPAIGN_LEVELS[17]!.id);
    const expected = [
      ...CAMPAIGN_TIERS[0]!.map((level) => level.id),
      CAMPAIGN_LEVELS[16]!.id,
      CAMPAIGN_LEVELS[17]!.id,
    ];

    expect(unlockedPuzzleLevelCount(historic)).toBe(5);
    expect(unlockedIds(historic)).toEqual(expected);
    expect(isPuzzleComplete(historic, CAMPAIGN_LEVELS[16]!.id)).toBe(true);
    expect(nextLockedPuzzleLevel(historic)).toBe(CAMPAIGN_LEVELS[3] ?? null);
    expect(nextPuzzleTierGate(historic)).toMatchObject({ completedCount: 0, requiredCount: 2 });
  });

  it('records only selectable canonical completions and unlocks a tier on its second completion', () => {
    const [first, , third] = CAMPAIGN_TIERS[0]!;
    const fourth = CAMPAIGN_TIERS[1]![0]!;
    const locked = CAMPAIGN_TIERS[2]![0]!;

    let progress = defaultPuzzleProgress();
    expect(recordCanonicalPuzzleCompletion(progress, finishedPuzzleState(locked.id))).toBe(progress);

    progress = recordCanonicalPuzzleCompletion(progress, finishedPuzzleState(first!.id));
    expect(unlockedIds(progress)).toEqual(CAMPAIGN_TIERS[0]!.map((level) => level.id));
    progress = recordCanonicalPuzzleCompletion(progress, finishedPuzzleState(third!.id));
    expect(unlockedIds(progress)).toEqual(CAMPAIGN_TIERS.slice(0, 2).flat().map((level) => level.id));
    expect(recordCanonicalPuzzleCompletion(progress, finishedPuzzleState(fourth.id))).not.toBe(progress);
    expect(recordCanonicalPuzzleCompletion(progress, finishedPuzzleState(third!.id))).toBe(progress);
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

  it('fails closed on malformed persisted values without opening extra levels', () => {
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
      expect(unlockedPuzzleLevelCount(parsed)).toBe(INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT);
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
