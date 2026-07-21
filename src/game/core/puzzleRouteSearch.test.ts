import { describe, expect, it } from 'vitest';
import artifactFile from '../../../docs/workstreams/tetris-t12-core/puzzle-solver-results.json';
import { encodePuzzleRoute, findPuzzleAlternativeRoute, metricsForPuzzleRoute, replayPuzzleRoute } from './puzzleRouteSearch';

type CurrentRoute = {
  id: string;
  commandStream: string;
  routes: readonly { id: 'primary' | 'alternate'; commandStream: string; locks: number }[];
};
const artifact = artifactFile as { levels: readonly CurrentRoute[] };

describe('Puzzle route alternative audit', () => {
  it('can find an independent early branch within the documented compact recovery margin', () => {
    const level = artifact.levels[0]!;
    const result = findPuzzleAlternativeRoute(
      level.id as Parameters<typeof findPuzzleAlternativeRoute>[0],
      level.commandStream,
      { maxLocks: level.routes[0]!.locks + 2 },
    );
    const stream = result.alternative ? encodePuzzleRoute(result.alternative.commands) : '';
    expect(result.firstDivergenceLock).toBe(1);
    expect(result.alternative?.state.status).toBe('finished');
    expect(metricsForPuzzleRoute(stream).locks).toBeLessThanOrEqual(level.routes[0]!.locks + 2);
    expect(result.canonical.locks[0]?.signature).not.toBe(result.alternative?.locks[0]?.signature);
  });

  it('round-trips the recorded alternate through compact public tokens without changing its landing count', () => {
    const level = artifact.levels.at(-1)!;
    const alternate = level.routes.find((route) => route.id === 'alternate')!;
    const replay = replayPuzzleRoute(level.id as Parameters<typeof replayPuzzleRoute>[0], alternate.commandStream);
    expect(encodePuzzleRoute(replay.commands)).toBe(alternate.commandStream);
    expect(replay.locks).toHaveLength(alternate.locks);
    expect(replay.state.puzzleCompletion).toBe('finished');
  });
});
