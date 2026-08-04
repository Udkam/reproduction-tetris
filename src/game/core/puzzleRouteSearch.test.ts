import { describe, expect, it } from 'vitest';
import phase7Batch2File from '../../../docs/workstreams/tetris-t15-puzzle/puzzle-levels-11-20.json';
import phase7Batch5File from '../../../docs/workstreams/tetris-t15-puzzle/puzzle-levels-41-50.json';
import t32Changed01To03File from '../../../docs/workstreams/tetris-t32-puzzle/puzzle-levels-changed-01-03.json';
import {
  encodePuzzleRoute,
  findPuzzleAlternativeRoute,
  findPuzzleRoute,
  metricsForPuzzleRoute,
  replayPuzzleRoute,
} from './puzzleRouteSearch';
import type { PuzzleId } from './types';

type RecordedRoute = {
  id: 'primary' | 'alternate';
  commandStream: string;
  locks: number;
};

type RecordedLevel = {
  id: PuzzleId;
  firstDivergenceLock: number;
  routes: readonly [RecordedRoute, RecordedRoute];
};

const phase7Batch2 = phase7Batch2File as unknown as { levels: readonly RecordedLevel[] };
const phase7Batch5 = phase7Batch5File as unknown as { levels: readonly RecordedLevel[] };
const t32Changed01To03 = t32Changed01To03File as unknown as { levels: readonly RecordedLevel[] };

describe('Phase-7 Puzzle route search', () => {
  it('finds a legal Core path for a deep current endgame without introducing a product-side lock budget', () => {
    const level = phase7Batch2.levels.find(({ id }) => id === 't6r-keystone-20')!;
    const result = findPuzzleRoute(level.id, { maxLocks: 30, beamWidth: 900 });

    expect(result?.state.status).toBe('finished');
    expect(result?.state.puzzleCompletion).toBe('finished');
    expect(result?.locks.length).toBeGreaterThan(0);
    expect(result?.locks.length).toBeLessThanOrEqual(30);
  }, 120_000);

  it('can exclude the primary opening landing and recover a distinct first-lock solution through the same public move domain', () => {
    const level = t32Changed01To03.levels.find(({ id }) => id === 't3r-shaft-01')!;
    const primary = level.routes.find((route) => route.id === 'primary')!;
    const result = findPuzzleAlternativeRoute(level.id, primary.commandStream, {
      maxLocks: primary.locks + 8,
      beamWidth: 900,
    });
    const stream = result.alternative ? encodePuzzleRoute(result.alternative.commands) : '';

    expect(result.firstDivergenceLock).toBe(1);
    expect(result.alternative?.state.puzzleCompletion).toBe('finished');
    expect(metricsForPuzzleRoute(stream).locks).toBeLessThanOrEqual(primary.locks + 8);
    expect(result.canonical.locks[0]?.signature).not.toBe(result.alternative?.locks[0]?.signature);
  }, 120_000);

  it('round-trips the recorded alternate through compact public tokens without changing its landing count', () => {
    const level = phase7Batch5.levels.at(-1)!;
    const alternate = level.routes.find((route) => route.id === 'alternate')!;
    const replay = replayPuzzleRoute(level.id, alternate.commandStream);
    expect(encodePuzzleRoute(replay.commands)).toBe(alternate.commandStream);
    expect(replay.locks).toHaveLength(alternate.locks);
    expect(replay.state.puzzleCompletion).toBe('finished');
  });
});
