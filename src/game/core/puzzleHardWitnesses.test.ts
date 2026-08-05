import { describe, expect, it } from 'vitest';
import { replayPuzzleRoute } from './puzzleRouteSearch';
import { T32_HARD_REBUILD_WITNESSES } from './puzzleT32HardRebuildRoutes';

describe('T32 strict Hard rebuild witnesses', () => {
  it.each(T32_HARD_REBUILD_WITNESSES)('$id finishes through two divergent public-Core routes', ({
    id, primary, alternate,
  }) => {
    const canonical = replayPuzzleRoute(id, primary.commandStream);
    const divergent = replayPuzzleRoute(id, alternate.commandStream);
    expect(canonical.locks).toHaveLength(primary.locks);
    expect(divergent.locks).toHaveLength(alternate.locks);
    expect(canonical.state.puzzleCompletion).toBe('finished');
    expect(divergent.state.puzzleCompletion).toBe('finished');
    const firstDivergence = canonical.locks.findIndex(
      (lock, index) => lock.signature !== divergent.locks[index]?.signature,
    );
    expect(firstDivergence).toBeGreaterThanOrEqual(0);
  });
});
