import type { PuzzleId } from './game/core';

/** Authored concepts shown before play. These are principles, never solver output. */
export type PuzzleTechnique =
  | 'complete-row'
  | 'preserve-well'
  | 'build-support'
  | 'avoid-hole'
  | 'read-queue'
  | 'retain-opening'
  | 'edge-to-centre'
  | 'split-lanes'
  | 'choose-gate'
  | 'anchor-side-slip';

export type PuzzleLesson = Readonly<{
  levelId: PuzzleId;
  technique: PuzzleTechnique;
  stage: 'foundation' | 'anchor';
}>;

/**
 * Each Intro level names one transferable decision without exposing a live solver
 * answer. The tenth lesson introduces the only timing-specific anchor manoeuvre.
 */
export const PUZZLE_LESSONS: readonly PuzzleLesson[] = Object.freeze([
  Object.freeze({ levelId: 't3r-shaft-01', technique: 'complete-row', stage: 'foundation' }),
  Object.freeze({ levelId: 't3r-shaft-02', technique: 'preserve-well', stage: 'foundation' }),
  Object.freeze({ levelId: 't3r-shaft-03', technique: 'build-support', stage: 'foundation' }),
  Object.freeze({ levelId: 't3r-cascade-06', technique: 'retain-opening', stage: 'foundation' }),
  Object.freeze({ levelId: 't3r-shaft-04', technique: 'read-queue', stage: 'foundation' }),
  Object.freeze({ levelId: 't3r-cascade-05', technique: 'avoid-hole', stage: 'foundation' }),
  Object.freeze({ levelId: 't5r-delta-07', technique: 'edge-to-centre', stage: 'foundation' }),
  Object.freeze({ levelId: 't5r-lattice-09', technique: 'split-lanes', stage: 'foundation' }),
  Object.freeze({ levelId: 't5r-rift-10', technique: 'choose-gate', stage: 'foundation' }),
  Object.freeze({ levelId: 't5r-drift-08', technique: 'anchor-side-slip', stage: 'anchor' }),
]);

const LESSON_BY_LEVEL = new Map<PuzzleId, PuzzleLesson>(
  PUZZLE_LESSONS.map((lesson) => [lesson.levelId, lesson]),
);

export function puzzleLessonFor(levelId: PuzzleId): PuzzleLesson | null {
  return LESSON_BY_LEVEL.get(levelId) ?? null;
}
