import { describe, expect, it } from 'vitest';
import { replayPuzzleRoute } from './game/core/puzzleRouteSearch';
import { CAMPAIGN_LEVELS, PUZZLE_CATEGORIES } from './puzzleProgress';
import {
  PUZZLE_HARD_MASTERY_GROUPS,
  PUZZLE_OPTIMAL_CERTIFICATES,
  puzzleHardMasteryGroup,
  puzzleOptimalCertificate,
} from './puzzleMastery';

describe('Puzzle mastery certificate registry', () => {
  it('freezes three completed public-command witnesses at optimum plus five', () => {
    expect(PUZZLE_OPTIMAL_CERTIFICATES).toHaveLength(3);
    for (const certificate of PUZZLE_OPTIMAL_CERTIFICATES) {
      const replay = replayPuzzleRoute(certificate.levelId, certificate.route);
      expect(replay.state.status, certificate.levelId).toBe('finished');
      expect(replay.state.puzzleCompletion, certificate.levelId).toBe('finished');
      expect(replay.locks, certificate.levelId).toHaveLength(certificate.optimalOperations);
      expect(certificate.optimalOperations, certificate.levelId).toBeLessThanOrEqual(7);
      expect(certificate.masteryOperations, certificate.levelId).toBe(certificate.optimalOperations + 5);
      expect(certificate.exhaustedFrontierWidths, certificate.levelId).toHaveLength(certificate.optimalOperations - 1);
      expect(certificate.exploredStateCount, certificate.levelId).toBe(
        certificate.exhaustedFrontierWidths.reduce((sum, width) => sum + width, 0),
      );
      expect(puzzleOptimalCertificate(certificate.levelId)).toBe(certificate);
    }
  });

  it('assigns every Hard level to exactly one related Easy mastery group', () => {
    const easyIds = new Set(PUZZLE_CATEGORIES.find(({ id }) => id === 'easy')!.levels.map(({ id }) => id));
    const hardIds = PUZZLE_CATEGORIES.find(({ id }) => id === 'hard')!.levels.map(({ id }) => id);
    const assigned = PUZZLE_HARD_MASTERY_GROUPS.flatMap(({ hardLevelIds }) => hardLevelIds);
    expect(new Set(assigned)).toEqual(new Set(hardIds));
    expect(assigned).toHaveLength(new Set(assigned).size);
    for (const group of PUZZLE_HARD_MASTERY_GROUPS) {
      expect(easyIds.has(group.prerequisiteId), group.prerequisiteId).toBe(true);
      expect(puzzleOptimalCertificate(group.prerequisiteId)?.technique).toBe(group.technique);
      for (const levelId of group.hardLevelIds) expect(puzzleHardMasteryGroup(levelId)).toBe(group);
    }
    expect(CAMPAIGN_LEVELS).toHaveLength(50);
  });
});
