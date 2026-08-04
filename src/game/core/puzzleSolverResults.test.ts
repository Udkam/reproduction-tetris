import { describe, expect, it } from 'vitest';
import phase7Batch1File from '../../../docs/workstreams/tetris-t15-puzzle/puzzle-levels-01-10.json';
import phase7Batch2File from '../../../docs/workstreams/tetris-t15-puzzle/puzzle-levels-11-20.json';
import phase7Batch3File from '../../../docs/workstreams/tetris-t15-puzzle/puzzle-levels-21-30.json';
import phase7Batch4File from '../../../docs/workstreams/tetris-t15-puzzle/puzzle-levels-31-40.json';
import phase7Batch5File from '../../../docs/workstreams/tetris-t15-puzzle/puzzle-levels-41-50.json';
import t32Changed01To03File from '../../../docs/workstreams/tetris-t32-puzzle/puzzle-levels-changed-01-03.json';
import t32Changed04To06File from '../../../docs/workstreams/tetris-t32-puzzle/puzzle-levels-changed-04-06.json';
import { VISIBLE_START_ROW } from './constants';
import { createInitialState, dispatch } from './engine';
import {
  PUZZLE_DEFINITIONS,
  createPuzzleBoard,
  getPuzzleDefinition,
  replayPuzzleSetup,
  type PuzzleAnchorCell,
} from './puzzles';
import { metricsForPuzzleRoute, replayPuzzleRoute } from './puzzleRouteSearch';
import { ANCHOR_CELL, type GameCommand, type PuzzleId } from './types';

type CommandToken = 'S' | 'T' | 'L' | 'R' | 'H' | 'C';

type VerifiedRoute = {
  id: 'primary' | 'alternate';
  commandStream: string;
  commandCount: number;
  locks: number;
  rotationCount: number;
  moveCount: number;
};

type Phase7VerifiedRoute = VerifiedRoute & {
  clearDistribution: readonly number[];
  maximumHeight: number;
  peakHoles: number;
  branchWidths: readonly number[];
  minimumBranchWidth: number;
  maximumBranchWidth: number;
  averageBranchWidth: number;
  anchorCount: number;
};

type VerifiedLevel = {
  id: PuzzleId;
  curriculumPosition: number;
  targetRowCount: number;
  setup: { seed: number; placementCount: number };
  anchorCells: readonly PuzzleAnchorCell[];
  routes: readonly [VerifiedRoute, VerifiedRoute];
  firstDivergenceLock: number;
};

type Phase7VerifiedLevel = Omit<VerifiedLevel, 'routes'> & {
  shorterRouteLocks: number;
  routes: readonly [Phase7VerifiedRoute, Phase7VerifiedRoute];
};

type Phase7Artifact = {
  schemaVersion: 7;
  claim: string;
  batch: { from: number; to: number };
  commandEncoding: Record<CommandToken, GameCommand>;
  difficultyTuple: readonly string[];
  campaignOrder: readonly PuzzleId[];
  levels: readonly Phase7VerifiedLevel[];
  searchBounds: { maxLocks: number; primaryBeam: number; alternateBeam: number };
};

const phase7Batch1 = phase7Batch1File as unknown as Phase7Artifact;
const phase7Batch2 = phase7Batch2File as unknown as Phase7Artifact;
const phase7Batch3 = phase7Batch3File as unknown as Phase7Artifact;
const phase7Batch4 = phase7Batch4File as unknown as Phase7Artifact;
const phase7Batch5 = phase7Batch5File as unknown as Phase7Artifact;
const t32Changed01To03 = t32Changed01To03File as unknown as Phase7Artifact;
const t32Changed04To06 = t32Changed04To06File as unknown as Phase7Artifact;
const phase7Artifacts = Object.freeze([
  phase7Batch1,
  phase7Batch2,
  phase7Batch3,
  phase7Batch4,
  phase7Batch5,
]);
const historicalLevels: readonly Phase7VerifiedLevel[] = Object.freeze([
  ...phase7Batch1.levels,
  ...phase7Batch2.levels,
  ...phase7Batch3.levels,
  ...phase7Batch4.levels,
  ...phase7Batch5.levels,
]);
const t32ChangedById = new Map(
  [...t32Changed01To03.levels, ...t32Changed04To06.levels].map((level) => [level.id, level]),
);
const activeLevels: readonly Phase7VerifiedLevel[] = Object.freeze(
  historicalLevels
    .map((level) => t32ChangedById.get(level.id) ?? level)
    .sort((left, right) => left.curriculumPosition - right.curriculumPosition),
);

function commandFor(token: CommandToken): GameCommand {
  switch (token) {
    case 'S': return { type: 'start' };
    case 'T': return { type: 'tick' };
    case 'L': return { type: 'move', dx: -1 };
    case 'R': return { type: 'move', dx: 1 };
    case 'H': return { type: 'hard-drop' };
    case 'C': return { type: 'rotate', direction: 1 };
  }
}

function decode(stream: string): GameCommand[] {
  return [...stream].map((token) => {
    if (!['S', 'T', 'L', 'R', 'H', 'C'].includes(token)) throw new Error(`Unknown compact public command: ${token}`);
    return commandFor(token as CommandToken);
  });
}

describe('Phase-7 source-bound multi-route Puzzle curriculum', () => {
  it('overlays the admitted T32 definitions without rewriting the historical T15 evidence', () => {
    expect(t32Changed01To03.schemaVersion).toBe(7);
    expect(t32Changed01To03.batch).toEqual({ from: 1, to: 3 });
    expect(t32Changed01To03.campaignOrder).toEqual(t32Changed01To03.levels.map(({ id }) => id));
    expect(t32Changed01To03.levels).toHaveLength(3);
    expect(t32Changed01To03.searchBounds).toEqual({
      maxLocks: 14,
      primaryBeam: 900,
      alternateBeam: 750,
    });
    expect(activeLevels.slice(0, 3)).toEqual(t32Changed01To03.levels);
    expect(t32Changed04To06.schemaVersion).toBe(7);
    expect(t32Changed04To06.batch).toEqual({ from: 4, to: 6 });
    expect(t32Changed04To06.campaignOrder).toEqual(t32Changed04To06.levels.map(({ id }) => id));
    expect(t32Changed04To06.levels).toHaveLength(3);
    expect(t32Changed04To06.searchBounds).toEqual({
      maxLocks: 14,
      primaryBeam: 900,
      alternateBeam: 750,
    });
    expect(activeLevels.slice(3, 6)).toEqual(t32Changed04To06.levels);
    expect(historicalLevels.slice(0, 3)).toEqual(phase7Batch1.levels.slice(0, 3));
  });

  it('binds all five re-authored ten-level batches to real Core route families', () => {
    for (const [index, artifact] of phase7Artifacts.entries()) {
      const from = index * 10 + 1;
      const to = from + 9;
      expect(artifact.schemaVersion).toBe(7);
      expect(artifact.claim).toContain('non-unique');
      expect(artifact.claim).toContain('not an optimality proof');
      expect(artifact.batch).toEqual({ from, to });
      expect(artifact.searchBounds).toEqual([
        { maxLocks: 18, primaryBeam: 900, alternateBeam: 700 },
        { maxLocks: 18, primaryBeam: 600, alternateBeam: 480 },
        { maxLocks: 24, primaryBeam: 600, alternateBeam: 480 },
        { maxLocks: 30, primaryBeam: 600, alternateBeam: 480 },
        { maxLocks: 36, primaryBeam: 720, alternateBeam: 560 },
      ][index]);
      expect(Object.keys(artifact.commandEncoding).sort()).toEqual(['C', 'H', 'L', 'R', 'S', 'T']);
      expect(artifact.difficultyTuple).toEqual([
        'targetRowCount', 'lockedPieces', 'rotationPlanning', 'horizontalPlanning', 'clearDistribution',
        'maximumHeight', 'peakHoles', 'branchWidth', 'firstDivergenceLock', 'anchorCount',
      ]);
      expect(artifact.levels).toHaveLength(10);
      expect(artifact.campaignOrder).toEqual(artifact.levels.map(({ id }) => id));
    }
    for (const artifact of phase7Artifacts.slice(0, 3)) {
      expect(artifact.levels.map(({ shorterRouteLocks }) => shorterRouteLocks)).toEqual(
        [...artifact.levels.map(({ shorterRouteLocks }) => shorterRouteLocks)].sort((left, right) => left - right),
      );
    }
    expect(phase7Batch1.levels.slice(0, 5).every(({ anchorCells }) => anchorCells.length === 0)).toBe(true);
    expect(phase7Batch1.levels.reduce((count, { anchorCells }) => count + anchorCells.length, 0)).toBe(1);
    expect(phase7Batch2.levels.reduce((count, { anchorCells }) => count + anchorCells.length, 0)).toBe(2);
    expect(phase7Batch3.levels.reduce((count, { anchorCells }) => count + anchorCells.length, 0)).toBe(3);
    expect(phase7Batch3.levels.filter(({ anchorCells }) => anchorCells.length > 0)
      .every(({ setup }) => setup.placementCount === 7)).toBe(true);
    expect(phase7Batch3.levels.filter(({ anchorCells }) => anchorCells.length === 0)
      .every(({ setup }) => setup.placementCount === 10)).toBe(true);
    expect(phase7Batch4.levels.reduce((count, { anchorCells }) => count + anchorCells.length, 0)).toBe(3);
    expect(phase7Batch4.levels.filter(({ anchorCells }) => anchorCells.length > 0)
      .map(({ curriculumPosition }) => curriculumPosition)).toEqual([32, 36, 39]);
    expect(phase7Batch4.levels.filter(({ anchorCells }) => anchorCells.length > 0)
      .every(({ setup }) => setup.placementCount === 9)).toBe(true);
    expect(phase7Batch4.levels.filter(({ anchorCells }) => anchorCells.length === 0)
      .every(({ setup }) => setup.placementCount === 12)).toBe(true);
    expect(phase7Batch4.levels.filter(({ anchorCells }) => anchorCells.length === 0)
      .map(({ shorterRouteLocks }) => shorterRouteLocks)).toEqual([11, 15, 16, 18, 19, 19, 21]);
    expect(phase7Batch5.levels.reduce((count, { anchorCells }) => count + anchorCells.length, 0)).toBe(0);
    expect(phase7Batch5.levels.map(({ setup }) => setup.placementCount))
      .toEqual([14, 14, 14, 14, 14, 14, 15, 14, 14, 14]);
    expect(phase7Batch5.levels.map(({ routes }) => routes.map(({ locks }) => locks)))
      .toEqual([
        [16, 16], [17, 20], [17, 20], [19, 21], [22, 26],
        [23, 24], [27, 23], [24, 24], [25, 25], [25, 29],
      ]);
    expect(activeLevels).toHaveLength(50);
    expect(new Set(activeLevels.map(({ id }) => id)).size).toBe(50);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ id }) => id))).toEqual(new Set(activeLevels.map(({ id }) => id)));
    expect(PUZZLE_DEFINITIONS.map(({ difficulty }) => difficulty))
      .toEqual(Array.from({ length: 50 }, (_, index) => index + 1));

    for (const [index, level] of activeLevels.entries()) {
      const definition = getPuzzleDefinition(level.id);
      expect(level.curriculumPosition, level.id).toBe(index + 1);
      expect(level.targetRowCount, level.id).toBe(definition.targetRows);
      expect(level.setup, level.id).toEqual({
        seed: definition.setup.seed,
        placementCount: definition.setup.placements.length,
      });
      expect(level.anchorCells, level.id).toEqual(definition.anchorCells);
      expect(createPuzzleBoard(definition, false), level.id).toEqual(replayPuzzleSetup(definition.setup));
      expect(level.routes.map((route) => route.id), level.id).toEqual(['primary', 'alternate']);
      expect(level.firstDivergenceLock, level.id).toBeGreaterThanOrEqual(1);
      expect(level.firstDivergenceLock, level.id).toBeLessThanOrEqual(
        Math.min(level.routes[0].locks, level.routes[1].locks),
      );
      expect(level.firstDivergenceLock, level.id).toBeLessThanOrEqual(4);
      for (const route of level.routes) {
        expect(metricsForPuzzleRoute(route.commandStream), `${level.id}/${route.id}`).toEqual({
          commandCount: route.commandCount,
          locks: route.locks,
          rotationCount: route.rotationCount,
          moveCount: route.moveCount,
        });
        expect(route.commandStream, `${level.id}/${route.id}`).toMatch(/^S[STLRHC]+$/);
        expect(route.locks, `${level.id}/${route.id}`).toBeGreaterThanOrEqual(level.targetRowCount);
      }
    }

    for (const level of activeLevels) {
      const definition = getPuzzleDefinition(level.id);
      expect(level.targetRowCount, level.id).toBe(
        definition.difficulty <= 10 ? 3
          : definition.difficulty <= 20 ? 4
            : definition.difficulty <= 30 ? 5
              : definition.difficulty <= 40 ? 6 : 7,
      );
      expect(level.setup.placementCount, level.id).toBeGreaterThanOrEqual(5);
      expect(level.setup.placementCount, level.id).toBeLessThanOrEqual(
        definition.difficulty <= 10 ? 6
          : definition.difficulty <= 20 ? 8
            : definition.difficulty <= 30 ? 10
              : definition.difficulty <= 40 ? 12 : 15,
      );
      expect(level.shorterRouteLocks, level.id).toBe(
        Math.min(level.routes[0].locks, level.routes[1].locks),
      );
      for (const route of level.routes) {
        expect(route.clearDistribution.reduce((sum, count) => sum + count, 0), `${level.id}/${route.id}`)
          .toBeGreaterThanOrEqual(level.targetRowCount);
        expect(route.maximumHeight, `${level.id}/${route.id}`).toBeGreaterThanOrEqual(level.targetRowCount);
        expect(route.peakHoles, `${level.id}/${route.id}`).toBeGreaterThanOrEqual(0);
        expect(route.branchWidths, `${level.id}/${route.id}`).toHaveLength(route.locks);
        expect(route.minimumBranchWidth, `${level.id}/${route.id}`).toBeGreaterThan(0);
        expect(route.maximumBranchWidth, `${level.id}/${route.id}`).toBeGreaterThanOrEqual(route.minimumBranchWidth);
        expect(route.averageBranchWidth, `${level.id}/${route.id}`).toBeGreaterThan(0);
        expect(route.anchorCount, `${level.id}/${route.id}`).toBe(definition.anchorCells.length);
      }
    }
  });

  it('replays both documented choices through public Core commands, with no post-win inputs and a genuine early landing branch', () => {
    for (const level of activeLevels) {
      const definition = getPuzzleDefinition(level.id);
      const anchorRows = new Set(
        definition.anchorCells.map(({ y }) => VISIBLE_START_ROW + y),
      );
      const routeReplays = level.routes.map((route) => {
        const commands = decode(route.commandStream);
        let state = createInitialState(0x51a1f00d, 'puzzle', level.id);
        let terminalIndex = -1;
        for (const [index, command] of commands.entries()) {
          const transition = dispatch(state, command);
          for (const event of transition.events) {
            if (event.type !== 'lines-cleared') continue;
            for (const row of event.rows) {
              expect(anchorRows.has(row), `${level.id}/${route.id} cleared anchor row ${row}`).toBe(false);
            }
          }
          state = transition.state;
          if (state.status !== 'playing' && terminalIndex === -1) terminalIndex = index;
        }

        expect(terminalIndex, `${level.id}/${route.id} terminal command`).toBe(commands.length - 1);
        expect(state.status, `${level.id}/${route.id}`).toBe('finished');
        expect(state.puzzleCompletion, `${level.id}/${route.id}`).toBe('finished');
        expect(state.puzzleTargetCells, `${level.id}/${route.id}`).toHaveLength(0);
        expect(state.pieceCount, `${level.id}/${route.id}`).toBe(route.locks);
        expect(state.board.flat().filter((cell) => cell === ANCHOR_CELL), `${level.id}/${route.id}`)
          .toHaveLength(definition.anchorCells.length);
        for (const anchor of definition.anchorCells) {
          expect(state.board[VISIBLE_START_ROW + anchor.y]?.[anchor.x], `${level.id}/${route.id}`).toBe(ANCHOR_CELL);
        }
        return replayPuzzleRoute(level.id, route.commandStream);
      });

      const [primary, alternate] = routeReplays;
      const divergenceIndex = level.firstDivergenceLock - 1;
      expect(primary.locks[divergenceIndex]?.signature, `${level.id} primary landing`)
        .not.toBe(alternate.locks[divergenceIndex]?.signature);
      expect(primary.state.puzzleCompletion, level.id).toBe('finished');
      expect(alternate.state.puzzleCompletion, level.id).toBe('finished');
    }
  });
});
