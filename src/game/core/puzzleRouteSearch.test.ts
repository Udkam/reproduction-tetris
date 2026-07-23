import { describe, expect, it } from 'vitest';
import artifactFile from '../../../docs/workstreams/tetris-t13-core/puzzle-endgame-results.json';
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

const artifact = artifactFile as unknown as { levels: readonly RecordedLevel[] };

describe('T13 Puzzle route search', () => {
  it('finds a legal Core path for an anchored deep endgame without introducing a product-side lock budget', () => {
    const level = artifact.levels.find(({ id }) => id === 't6r-keystone-20')!;
    const result = findPuzzleRoute(level.id, { maxLocks: 30, beamWidth: 900 });

    expect(result?.state.status).toBe('finished');
    expect(result?.state.puzzleCompletion).toBe('finished');
    expect(result?.locks.length).toBeGreaterThanOrEqual(level.routes[0].locks);
  }, 120_000);

  it('can exclude the primary opening landing and recover a distinct first-lock solution through the same public move domain', () => {
    const level = artifact.levels[0]!;
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
    const level = artifact.levels.at(-1)!;
    const alternate = level.routes.find((route) => route.id === 'alternate')!;
    const replay = replayPuzzleRoute(level.id, alternate.commandStream);
    expect(encodePuzzleRoute(replay.commands)).toBe(alternate.commandStream);
    expect(replay.locks).toHaveLength(alternate.locks);
    expect(replay.state.puzzleCompletion).toBe('finished');
  });
});
