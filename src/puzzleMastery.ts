import type { PuzzleId } from './game/core';
import type { PuzzleTechnique } from './puzzleLessons';

export type PuzzleOptimalCertificate = Readonly<{
  levelId: PuzzleId;
  technique: PuzzleTechnique;
  optimalOperations: number;
  masteryOperations: number;
  initialStateHash: string;
  route: string;
  exhaustedFrontierWidths: readonly number[];
  exploredStateCount: number;
  transitionCount: number;
  deficitBoundPrunes: number;
}>;

/**
 * Frozen authoring certificates. The product reads these values only; the exhaustive
 * verifier lives in Core tests and never runs in the browser.
 */
export const PUZZLE_OPTIMAL_CERTIFICATES: readonly PuzzleOptimalCertificate[] = Object.freeze([
  Object.freeze({
    levelId: 't3r-cascade-06',
    technique: 'avoid-hole',
    optimalOperations: 5,
    masteryOperations: 10,
    initialStateHash: 'd194015a',
    route: 'SCCCRRHTTTCCRRRRHTTTTTTTTTTTTRRRRHTTTTTTTTTTTTCLHTTTCLLLLHTTTTTTTTTTTT',
    exhaustedFrontierWidths: Object.freeze([1, 34, 914, 6987]),
    exploredStateCount: 7936,
    transitionCount: 142046,
    deficitBoundPrunes: 133775,
  }),
  Object.freeze({
    levelId: 't3r-shaft-04',
    technique: 'read-queue',
    optimalOperations: 5,
    masteryOperations: 10,
    initialStateHash: '228d59f1',
    route: 'SRRRRHTTTCCCRHTTTCRRHTTTTTTTTTTTTCLLHTTTCCLLLHTTTTTTTTTTTT',
    exhaustedFrontierWidths: Object.freeze([1, 9, 284, 2417]),
    exploredStateCount: 2711,
    transitionCount: 47887,
    deficitBoundPrunes: 44233,
  }),
  Object.freeze({
    levelId: 't3r-cascade-05',
    technique: 'retain-opening',
    optimalOperations: 5,
    masteryOperations: 10,
    initialStateHash: 'dc168a38',
    route: 'SRRRRHTTTTTTTTTTTTLLHTTTCCRHTTTTTTTTTTTTCLLLLHTTTCRRRRHTTTTTTTTTTTT',
    exhaustedFrontierWidths: Object.freeze([1, 34, 313, 8372]),
    exploredStateCount: 8720,
    transitionCount: 311775,
    deficitBoundPrunes: 295656,
  }),
]);

export type PuzzleHardMasteryGroup = Readonly<{
  prerequisiteId: PuzzleId;
  technique: PuzzleTechnique;
  hardLevelIds: readonly PuzzleId[];
}>;

function puzzleIds(...ids: PuzzleId[]): readonly PuzzleId[] {
  return Object.freeze(ids);
}

export const PUZZLE_HARD_MASTERY_GROUPS: readonly PuzzleHardMasteryGroup[] = Object.freeze([
  Object.freeze({
    prerequisiteId: 't3r-cascade-06',
    technique: 'avoid-hole',
    hardLevelIds: puzzleIds(
      'tm-puzzle-31', 'tm-puzzle-34', 'tm-puzzle-35', 'tm-puzzle-38',
      'tm-puzzle-40', 'tm-puzzle-46', 'tm-puzzle-47',
    ),
  }),
  Object.freeze({
    prerequisiteId: 't3r-shaft-04',
    technique: 'read-queue',
    hardLevelIds: puzzleIds(
      'tm-puzzle-33', 'tm-puzzle-37', 'tm-puzzle-41', 'tm-puzzle-42',
      'tm-puzzle-43', 'tm-puzzle-44', 'tm-puzzle-45',
    ),
  }),
  Object.freeze({
    prerequisiteId: 't3r-cascade-05',
    technique: 'retain-opening',
    hardLevelIds: puzzleIds(
      'tm-puzzle-32', 'tm-puzzle-36', 'tm-puzzle-39',
      'tm-puzzle-48', 'tm-puzzle-49', 'tm-puzzle-50',
    ),
  }),
]);

const CERTIFICATE_BY_LEVEL = new Map(PUZZLE_OPTIMAL_CERTIFICATES.map((certificate) => [certificate.levelId, certificate]));
const HARD_GROUP_BY_LEVEL = new Map<PuzzleId, PuzzleHardMasteryGroup>();
for (const group of PUZZLE_HARD_MASTERY_GROUPS) {
  const certificate = CERTIFICATE_BY_LEVEL.get(group.prerequisiteId);
  if (!certificate || certificate.technique !== group.technique) {
    throw new Error(`Puzzle mastery group lacks a matching optimum certificate: ${group.prerequisiteId}.`);
  }
  if (certificate.masteryOperations !== certificate.optimalOperations + 5) {
    throw new Error(`Puzzle mastery threshold must equal optimum plus five: ${group.prerequisiteId}.`);
  }
  for (const levelId of group.hardLevelIds) {
    if (HARD_GROUP_BY_LEVEL.has(levelId)) throw new Error(`Hard Puzzle belongs to multiple mastery groups: ${levelId}.`);
    HARD_GROUP_BY_LEVEL.set(levelId, group);
  }
}
if (HARD_GROUP_BY_LEVEL.size !== 20) throw new Error('Every Hard Puzzle must belong to exactly one mastery group.');

export function puzzleOptimalCertificate(levelId: PuzzleId): PuzzleOptimalCertificate | null {
  return CERTIFICATE_BY_LEVEL.get(levelId) ?? null;
}

export function puzzleHardMasteryGroup(levelId: PuzzleId): PuzzleHardMasteryGroup | null {
  return HARD_GROUP_BY_LEVEL.get(levelId) ?? null;
}
