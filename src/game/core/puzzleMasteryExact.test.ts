import { describe, expect, it } from 'vitest';
import { PUZZLE_OPTIMAL_CERTIFICATES } from '../../puzzleMastery';
import { certifyOptimalPuzzleRoute, encodePuzzleRoute } from './puzzleRouteSearch';

// The proof is intentionally opt-in: the three complete public-control searches take
// several minutes on one worker. Release verification runs this file once with
// PUZZLE_EXACT_CERTIFICATES=1; the ordinary suite still validates every frozen field.
// @ts-expect-error Node environment variables are available to Vitest but not product types.
const RUN_EXACT = process.env.PUZZLE_EXACT_CERTIFICATES === '1';

describe.runIf(RUN_EXACT)('strict Puzzle mastery optimum certificates', () => {
  for (const expected of PUZZLE_OPTIMAL_CERTIFICATES) {
    it(`exhausts every shorter public-control route for ${expected.levelId}`, () => {
      const actual = certifyOptimalPuzzleRoute(expected.levelId, expected.route);
      expect(actual).not.toBeNull();
      expect(actual && {
        levelId: actual.levelId,
        optimalOperations: actual.optimalLocks,
        initialStateHash: actual.initialStateHash,
        route: encodePuzzleRoute(actual.replay.commands),
        exhaustedFrontierWidths: actual.exhaustedFrontierWidths,
        exploredStateCount: actual.exploredStateCount,
        transitionCount: actual.transitionCount,
        deficitBoundPrunes: actual.deficitBoundPrunes,
      }).toEqual({
        levelId: expected.levelId,
        optimalOperations: expected.optimalOperations,
        initialStateHash: expected.initialStateHash,
        route: expected.route,
        exhaustedFrontierWidths: expected.exhaustedFrontierWidths,
        exploredStateCount: expected.exploredStateCount,
        transitionCount: expected.transitionCount,
        deficitBoundPrunes: expected.deficitBoundPrunes,
      });
    }, 180_000);
  }
});
