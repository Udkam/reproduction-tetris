import type { PuzzleId } from './game/core';

/** Authored concepts shown before play. These are principles, never solver output. */
export type PuzzleTechnique =
  | 'complete-row'
  | 'preserve-well'
  | 'build-support'
  | 'avoid-hole'
  | 'read-queue'
  | 'retain-opening'
  | 'anchor-geometry'
  | 'anchor-side-slip';

export type PuzzleLesson = Readonly<{
  levelId: PuzzleId;
  technique: PuzzleTechnique;
  stage: 'foundation' | 'anchor';
}>;

/**
 * The opening curriculum deliberately leaves combination levels 7–9 unlabelled: the
 * player applies the first six ideas without receiving a live answer feed. Level 10
 * introduces fixed collision geometry; level 11 then adds the timed side-slip.
 */
export const PUZZLE_LESSONS: readonly PuzzleLesson[] = Object.freeze([
  Object.freeze({ levelId: 't3r-shaft-01', technique: 'complete-row', stage: 'foundation' }),
  Object.freeze({ levelId: 't3r-shaft-02', technique: 'preserve-well', stage: 'foundation' }),
  Object.freeze({ levelId: 't3r-shaft-03', technique: 'build-support', stage: 'foundation' }),
  Object.freeze({ levelId: 't3r-cascade-06', technique: 'avoid-hole', stage: 'foundation' }),
  Object.freeze({ levelId: 't3r-shaft-04', technique: 'read-queue', stage: 'foundation' }),
  Object.freeze({ levelId: 't3r-cascade-05', technique: 'retain-opening', stage: 'foundation' }),
  Object.freeze({ levelId: 't5r-drift-08', technique: 'anchor-geometry', stage: 'anchor' }),
  Object.freeze({ levelId: 't5r-pulse-14', technique: 'anchor-side-slip', stage: 'anchor' }),
]);

const LESSON_BY_LEVEL = new Map<PuzzleId, PuzzleLesson>(
  PUZZLE_LESSONS.map((lesson) => [lesson.levelId, lesson]),
);

export function puzzleLessonFor(levelId: PuzzleId): PuzzleLesson | null {
  return LESSON_BY_LEVEL.get(levelId) ?? null;
}
