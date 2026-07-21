import { describe, expect, it } from 'vitest';
import { createInitialState, TICKS_PER_SECOND } from './game/core';
import {
  PUZZLE_HINT_UNLOCK_PIECES,
  PUZZLE_HINT_UNLOCK_SECONDS,
  defaultPuzzleHintProgress,
  isPuzzleHintUnlocked,
  parsePuzzleHintProgress,
  puzzleHintGuide,
  puzzleHintLockCopy,
  shouldUnlockPuzzleHint,
  unlockPuzzleHint,
} from './puzzleHints';

describe('Puzzle hint persistence and guide data', () => {
  it('fails closed on malformed local hint records and keeps canonical unlock order', () => {
    const baseline = defaultPuzzleHintProgress();
    expect(parsePuzzleHintProgress(null)).toEqual(baseline);
    expect(parsePuzzleHintProgress('{')).toEqual(baseline);
    expect(parsePuzzleHintProgress('{"version":1,"unlockedLevelIds":["missing"]}')).toEqual(baseline);
    const laterFirst = unlockPuzzleHint(baseline, 't6r-keystone-20');
    const ordered = unlockPuzzleHint(laterFirst, 't3r-shaft-01');
    expect(ordered.unlockedLevelIds).toEqual(['t3r-shaft-01', 't6r-keystone-20']);
    expect(isPuzzleHintUnlocked(ordered, 't3r-shaft-01')).toBe(true);
  });

  it('unlocks only after two placed pieces or twenty active seconds', () => {
    const state = createInitialState(0x51a1f00d, 'puzzle', 't3r-shaft-01');
    expect(shouldUnlockPuzzleHint(state)).toBe(false);
    expect(puzzleHintLockCopy(state)).toContain(`再落 ${PUZZLE_HINT_UNLOCK_PIECES} 块`);
    expect(shouldUnlockPuzzleHint({ ...state, pieceCount: PUZZLE_HINT_UNLOCK_PIECES - 1, elapsedTicks: PUZZLE_HINT_UNLOCK_SECONDS * TICKS_PER_SECOND - 1 })).toBe(false);
    expect(shouldUnlockPuzzleHint({ ...state, pieceCount: PUZZLE_HINT_UNLOCK_PIECES })).toBe(true);
    expect(shouldUnlockPuzzleHint({ ...state, elapsedTicks: PUZZLE_HINT_UNLOCK_SECONDS * TICKS_PER_SECOND })).toBe(true);
  });

  it('turns paired Core-replayed routes into two non-command strategy guides', () => {
    const guide = puzzleHintGuide('t6r-keystone-20');
    expect(guide.strategies.map((strategy) => strategy.id)).toEqual(['primary', 'alternate']);
    expect(guide.cue).not.toMatch(/[←→↑↓]/);
    for (const strategy of guide.strategies) {
      expect(strategy.steps.length).toBeGreaterThanOrEqual(7);
      expect(strategy.steps[0]?.detail).not.toMatch(/[←→↑↓]/);
      expect(strategy.steps.at(-1)?.detail).toContain('收口');
    }
  });
});
