import { describe, expect, it } from 'vitest';
import { PUZZLE_DEFINITIONS, createInitialState, type GameState, type PuzzleId } from './game/core';
import {
  CAMPAIGN_LEVELS,
  CAMPAIGN_TIERS,
  INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT,
  PUZZLE_CATEGORIES,
  PUZZLE_CAMPAIGN_REVISION,
  PUZZLE_REVISION_2_CHANGED_IDS,
  PUZZLE_ROW_BANDS,
  V4_CAMPAIGN_ORDER,
  V2_CAMPAIGN_ORDER,
  defaultPuzzleProgress,
  isPuzzleComplete,
  isPuzzleUnlocked,
  migrateLegacyPuzzleProgress,
  migrateV4PuzzleProgress,
  migrateV3PuzzleProgress,
  migrateV2PuzzleProgress,
  nextLockedPuzzleLevel,
  nextPuzzleTierGate,
  parsePuzzleProgress,
  puzzleBestPieceCount,
  puzzleMasteryGateStatus,
  recordCanonicalPuzzleCompletion,
  type PuzzleProgress,
  unlockedPuzzleLevelCount,
} from './puzzleProgress';
import { PUZZLE_HARD_MASTERY_GROUPS, PUZZLE_OPTIMAL_CERTIFICATES } from './puzzleMastery';

function finishedPuzzleState(levelId: PuzzleId, pieceCount: number): GameState {
  return {
    ...createInitialState(0x51a1f00d, 'puzzle', levelId),
    status: 'finished',
    puzzleCompletion: 'finished',
    completedLevelId: levelId,
    pieceCount,
  };
}

function progressWith(...completedLevelIds: PuzzleId[]) {
  return parsePuzzleProgress(JSON.stringify({
    version: 5,
    campaignRevision: PUZZLE_CAMPAIGN_REVISION,
    completedLevelIds,
    bestPieceCounts: {},
  }));
}

function progressWithBests(
  completedLevelIds: readonly PuzzleId[],
  bestPieceCounts: Partial<Record<PuzzleId, number>>,
) {
  return parsePuzzleProgress(JSON.stringify({
    version: 5,
    campaignRevision: PUZZLE_CAMPAIGN_REVISION,
    completedLevelIds,
    bestPieceCounts,
  }));
}

function unlockedIds(progress = defaultPuzzleProgress()): PuzzleId[] {
  return CAMPAIGN_LEVELS.filter((level) => isPuzzleUnlocked(progress, level.id)).map((level) => level.id);
}

describe('revisioned progressive Puzzle campaign persistence', () => {
  it('binds every authored level to the frozen 10/20/20 curriculum', () => {
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
    expect(PUZZLE_ROW_BANDS.map((band) => band.length)).toEqual([5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
    expect(PUZZLE_ROW_BANDS.flat().map((level) => level.id)).toEqual(CAMPAIGN_LEVELS.map((level) => level.id));
    expect(CAMPAIGN_TIERS).toBe(PUZZLE_ROW_BANDS);
    expect(PUZZLE_CATEGORIES.map(({ id, levels }) => [id, levels.length])).toEqual([
      ['intro', 10], ['easy', 20], ['hard', 20],
    ]);
    expect(PUZZLE_CATEGORIES.flatMap(({ levels }) => levels.map(({ id }) => id)))
      .toEqual(CAMPAIGN_LEVELS.map(({ id }) => id));
    expect(PUZZLE_REVISION_2_CHANGED_IDS).toEqual([
      ...CAMPAIGN_LEVELS.slice(0, 10).map(({ id }) => id),
      ...CAMPAIGN_LEVELS.slice(11, 14).map(({ id }) => id),
      CAMPAIGN_LEVELS[35]!.id,
      CAMPAIGN_LEVELS[37]!.id,
      ...CAMPAIGN_LEVELS.slice(45, 50).map(({ id }) => id),
    ]);
  });

  it('opens every Intro and Easy level immediately while keeping Hard mastery-only', () => {
    const progress = defaultPuzzleProgress();
    expect(INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT).toBe(30);
    expect(unlockedPuzzleLevelCount(progress)).toBe(30);
    expect(unlockedIds(progress)).toEqual(CAMPAIGN_LEVELS.slice(0, 30).map((level) => level.id));
    expect(nextLockedPuzzleLevel(progress)).toBe(CAMPAIGN_LEVELS[30]);
    expect(nextPuzzleTierGate(progress)).toBeNull();
  });

  it('unlocks related Hard groups only at each strictly certified optimum-plus-five boundary', () => {
    const completed = new Set<PuzzleId>(CAMPAIGN_LEVELS.slice(0, 30).map(({ id }) => id));
    const atThreshold = Object.fromEntries(PUZZLE_OPTIMAL_CERTIFICATES.map((certificate) => (
      [certificate.levelId, certificate.masteryOperations]
    ))) as Partial<Record<PuzzleId, number>>;
    const mastered = progressWithBests([...completed], atThreshold);
    expect(unlockedIds(mastered)).toEqual(CAMPAIGN_LEVELS.map(({ id }) => id));
    expect(unlockedPuzzleLevelCount(mastered)).toBe(50);
    expect(nextLockedPuzzleLevel(mastered)).toBeNull();

    for (const certificate of PUZZLE_OPTIMAL_CERTIFICATES) {
      const aboveThreshold = progressWithBests([...completed], {
        ...atThreshold,
        [certificate.levelId]: certificate.masteryOperations + 1,
      });
      const group = PUZZLE_HARD_MASTERY_GROUPS.find(({ prerequisiteId }) => prerequisiteId === certificate.levelId)!;
      for (const hardLevelId of group.hardLevelIds) {
        expect(isPuzzleUnlocked(aboveThreshold, hardLevelId), `${certificate.levelId} -> ${hardLevelId}`).toBe(false);
        expect(puzzleMasteryGateStatus(aboveThreshold, hardLevelId)).toMatchObject({
          bestOperations: certificate.masteryOperations + 1,
          requiredOperations: certificate.masteryOperations,
          unlocked: false,
        });
      }
      expect(unlockedPuzzleLevelCount(aboveThreshold)).toBe(50 - group.hardLevelIds.length);
    }
  });

  it('keeps migrated Hard completions replayable without unlocking unrelated Hard levels', () => {
    const historic = progressWith(CAMPAIGN_LEVELS[31]!.id, CAMPAIGN_LEVELS[32]!.id);
    expect(unlockedPuzzleLevelCount(historic)).toBe(32);
    expect(unlockedIds(historic)).toEqual([
      ...CAMPAIGN_LEVELS.slice(0, 30).map((level) => level.id),
      CAMPAIGN_LEVELS[31]!.id,
      CAMPAIGN_LEVELS[32]!.id,
    ]);
    expect(isPuzzleComplete(historic, CAMPAIGN_LEVELS[31]!.id)).toBe(true);
    expect(isPuzzleUnlocked(historic, CAMPAIGN_LEVELS[31]!.id)).toBe(true);
    expect(nextLockedPuzzleLevel(historic)).toBe(CAMPAIGN_LEVELS[30]);
    expect(nextPuzzleTierGate(historic)).toBeNull();
  });

  it('does not let unrelated Intro or Easy completions bypass a Hard mastery gate', () => {
    const progress = progressWith(...CAMPAIGN_LEVELS.slice(0, 30).map(({ id }) => id));
    expect(unlockedIds(progress)).toEqual(CAMPAIGN_LEVELS.slice(0, 30).map(({ id }) => id));
    expect(isPuzzleUnlocked(progress, CAMPAIGN_LEVELS[30]!.id)).toBe(false);
    expect(nextPuzzleTierGate(progress)).toBeNull();
  });

  it('records every selectable canonical win and retains the lowest successful count', () => {
    const late = CAMPAIGN_LEVELS.at(-1)!;
    const first = CAMPAIGN_LEVELS[0]!;
    let progress = defaultPuzzleProgress();

    progress = recordCanonicalPuzzleCompletion(progress, finishedPuzzleState(late.id, 12), late.id);
    expect(progress.completedLevelIds).toEqual([late.id]);
    expect(puzzleBestPieceCount(progress, late.id)).toBe(12);
    progress = recordCanonicalPuzzleCompletion(progress, finishedPuzzleState(first.id, 7));
    expect(progress.completedLevelIds).toEqual([first.id, late.id]);
    expect(puzzleBestPieceCount(progress, first.id)).toBe(7);
    expect(recordCanonicalPuzzleCompletion(progress, finishedPuzzleState(first.id, 8))).toBe(progress);
    progress = recordCanonicalPuzzleCompletion(progress, finishedPuzzleState(first.id, 5));
    expect(puzzleBestPieceCount(progress, first.id)).toBe(5);
    expect(puzzleBestPieceCount(progress, CAMPAIGN_LEVELS[1]!.id)).toBeNull();
    expect(unlockedPuzzleLevelCount(progress)).toBe(31);

    const migratedLate = progressWith(late.id);
    const replayedLate = recordCanonicalPuzzleCompletion(migratedLate, finishedPuzzleState(late.id, 11));
    expect(replayedLate.completedLevelIds).toContain(late.id);
    expect(puzzleBestPieceCount(replayedLate, late.id)).toBe(11);
    expect(unlockedPuzzleLevelCount(replayedLate)).toBe(31);
  });

  it('accepts the canonical Puzzle identity fallback but rejects mismatched snapshots', () => {
    const first = CAMPAIGN_LEVELS[0]!;
    const second = CAMPAIGN_LEVELS[1]!;
    const missingCompletionId = {
      ...finishedPuzzleState(first.id, 6),
      completedLevelId: null,
    };
    const recorded = recordCanonicalPuzzleCompletion(defaultPuzzleProgress(), missingCompletionId, first.id);
    expect(recorded.completedLevelIds).toEqual([first.id]);
    expect(puzzleBestPieceCount(recorded, first.id)).toBe(6);

    const mismatchedSnapshot = {
      ...finishedPuzzleState(first.id, 5),
      completedLevelId: second.id,
    };
    expect(recordCanonicalPuzzleCompletion(recorded, mismatchedSnapshot, first.id)).toBe(recorded);
    expect(recordCanonicalPuzzleCompletion(recorded, finishedPuzzleState(first.id, 5), second.id)).toBe(recorded);
  });

  it('parses revision 2 and selectively migrates changed boards out of older saves', () => {
    const first = V2_CAMPAIGN_ORDER[0]!;
    const third = V2_CAMPAIGN_ORDER[2]!;
    const fourth = V2_CAMPAIGN_ORDER[3]!;
    const late = V2_CAMPAIGN_ORDER.at(-1)!;

    const current = parsePuzzleProgress(JSON.stringify({
      version: 5,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: [third, first, third],
      bestPieceCounts: { [first]: 5, [third]: 8 },
    }));
    expect(current).toEqual({
      version: 5,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: orderedCampaignIds(first, third),
      bestPieceCounts: { [first]: 5, [third]: 8 },
    });

    const unchanged = CAMPAIGN_LEVELS[10]!.id;
    const revisionOne = parsePuzzleProgress(JSON.stringify({
      version: 5,
      campaignRevision: 1,
      completedLevelIds: [unchanged, first],
      bestPieceCounts: { [unchanged]: 6, [first]: 4 },
    }));
    expect(revisionOne).toEqual({
      version: 5,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: [unchanged],
      bestPieceCounts: { [unchanged]: 6 },
    });

    const v4 = migrateV4PuzzleProgress(JSON.stringify({
      version: 4,
      completedLevelIds: [third, first, third],
      bestPieceCounts: { [first]: 5, [third]: 8 },
    }));
    expect(v4).toEqual({
      version: 5,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: [],
      bestPieceCounts: {},
    });

    const v3 = migrateV3PuzzleProgress(JSON.stringify({
      version: 3,
      completedLevelIds: [third, first, third],
    }));
    expect(v3).toEqual({
      version: 5,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: [],
      bestPieceCounts: {},
    });

    const v2 = migrateV2PuzzleProgress(JSON.stringify({
      version: 2,
      completedLevelIds: [late, third, first, third],
    }));
    expect(v2).toEqual({
      version: 5,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: [late],
      bestPieceCounts: {},
    });
    expect(isPuzzleComplete(v2, late)).toBe(true);

    const legacy = migrateLegacyPuzzleProgress(JSON.stringify({
      version: 1,
      nextUnlockedLevelId: fourth,
    }));
    expect(legacy.completedLevelIds).toEqual([]);
    expect(legacy.version).toBe(5);
    expect(legacy.campaignRevision).toBe(PUZZLE_CAMPAIGN_REVISION);
    expect(legacy.bestPieceCounts).toEqual({});
  });

  it('freezes the v4 visible order separately from v2 and never promotes retired-board bests', () => {
    expect(V4_CAMPAIGN_ORDER).toHaveLength(20);
    expect(new Set(V4_CAMPAIGN_ORDER)).toEqual(new Set(V2_CAMPAIGN_ORDER));
    expect(V4_CAMPAIGN_ORDER).not.toEqual(V2_CAMPAIGN_ORDER);
    expect(new Set(V4_CAMPAIGN_ORDER)).toEqual(new Set(CAMPAIGN_LEVELS.slice(0, 20).map((level) => level.id)));
    expect(V4_CAMPAIGN_ORDER).not.toEqual(CAMPAIGN_LEVELS.slice(0, 20).map((level) => level.id));

    const completed = V4_CAMPAIGN_ORDER.filter((_, index) => index % 2 === 0);
    const bestPieceCounts = Object.fromEntries(completed.map((id, index) => [id, index + 1]));
    expect(migrateV4PuzzleProgress(JSON.stringify({
      version: 4,
      completedLevelIds: [...completed].reverse(),
      bestPieceCounts,
    }))).toEqual({
      version: 5,
      campaignRevision: PUZZLE_CAMPAIGN_REVISION,
      completedLevelIds: orderedCampaignIds(
        ...completed.filter((id) => !PUZZLE_REVISION_2_CHANGED_IDS.includes(id)),
      ),
      bestPieceCounts: {},
    });
  });

  it('fails closed on malformed persisted values while preserving only the fresh frontier', () => {
    const baseline = defaultPuzzleProgress();
    const malformed = [
      null,
      '{',
      '[]',
      '{"version":1,"completedLevelIds":[]}',
      '{"version":2,"completedLevelIds":"t3r-shaft-01"}',
      '{"version":3,"completedLevelIds":["offset-01"]}',
      '{"version":3,"completedLevelIds":["t3r-shaft-01",42]}',
      '{"version":4,"completedLevelIds":[],"bestPieceCounts":{}}',
      '{"version":5,"completedLevelIds":[],"bestPieceCounts":{}}',
      '{"version":5,"campaignRevision":0,"completedLevelIds":[],"bestPieceCounts":{}}',
      '{"version":5,"campaignRevision":1,"completedLevelIds":["t3r-shaft-01"],"bestPieceCounts":{"offset-01":4}}',
      '{"version":5,"campaignRevision":1,"completedLevelIds":["t3r-shaft-01"],"bestPieceCounts":{"t3r-shaft-01":0}}',
    ];

    for (const raw of malformed) {
      const parsed = parsePuzzleProgress(raw);
      expect(parsed).toEqual(baseline);
      expect(unlockedPuzzleLevelCount(parsed)).toBe(INITIAL_AVAILABLE_PUZZLE_LEVEL_COUNT);
    }

    expect(migrateV4PuzzleProgress('{"version":4,"completedLevelIds":["offset-01"],"bestPieceCounts":{}}')).toEqual(baseline);
    expect(migrateV4PuzzleProgress('{"version":4,"completedLevelIds":["t3r-shaft-01"],"bestPieceCounts":{"t3r-shaft-01":0}}')).toEqual(baseline);
    expect(migrateV4PuzzleProgress('{"version":4,"completedLevelIds":["t3r-shaft-01"],"bestPieceCounts":{"offset-01":4}}')).toEqual(baseline);
    expect(migrateV3PuzzleProgress('{"version":3,"completedLevelIds":["offset-01"]}')).toEqual(baseline);
    expect(migrateV2PuzzleProgress('{"version":2,"completedLevelIds":["offset-01"]}')).toEqual(baseline);
    expect(migrateLegacyPuzzleProgress('{"version":1,"nextUnlockedLevelId":"offset-01"}')).toEqual(baseline);
    expect(migrateLegacyPuzzleProgress('{"version":1,"nextUnlockedLevelId":null}')).toEqual(baseline);
  });

  it('fails frontier queries closed for malformed in-memory best records', () => {
    const completed = progressWith(
      CAMPAIGN_LEVELS[0]!.id,
      CAMPAIGN_LEVELS[1]!.id,
      CAMPAIGN_LEVELS[2]!.id,
    );
    const malformedBests: unknown[] = [
      null,
      { [CAMPAIGN_LEVELS[0]!.id]: 0 },
      { 'offset-01': 4 },
    ];

    for (const bestPieceCounts of malformedBests) {
      const malformed = { ...completed, bestPieceCounts } as unknown as PuzzleProgress;
      expect(unlockedIds(malformed)).toEqual(CAMPAIGN_LEVELS.slice(0, 30).map((level) => level.id));
      expect(unlockedPuzzleLevelCount(malformed)).toBe(30);
      expect(nextLockedPuzzleLevel(malformed)).toBe(CAMPAIGN_LEVELS[30]);
      expect(nextPuzzleTierGate(malformed)).toBeNull();
    }
  });
});

function orderedCampaignIds(...ids: PuzzleId[]): PuzzleId[] {
  const completed = new Set(ids);
  return CAMPAIGN_LEVELS.filter((level) => completed.has(level.id)).map((level) => level.id);
}
