import { describe, expect, it } from 'vitest';
import legacyArtifactFile from '../../../docs/workstreams/tetris-t13-core/puzzle-endgame-results.json';
import phase7ArtifactFile from '../../../docs/workstreams/tetris-t15-puzzle/puzzle-levels-01-10.json';
import { VISIBLE_START_ROW } from './constants';
import { createInitialState, dispatch } from './engine';
import {
  PUZZLE_DEFINITIONS,
  createPuzzleBoard,
  expectedPuzzleTargetRows,
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

type CurriculumArtifact = {
  schemaVersion: 6;
  claim: string;
  commandEncoding: Record<CommandToken, GameCommand>;
  difficultyTuple: readonly ['targetRowCount', 'authoredPosition', 'routePlanning', 'rotationPlanning', 'branchTiming', 'recoveryRoom'];
  campaignOrder: readonly PuzzleId[];
  levels: readonly VerifiedLevel[];
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

const legacyArtifact = legacyArtifactFile as unknown as CurriculumArtifact;
const phase7Artifact = phase7ArtifactFile as unknown as Phase7Artifact;
const legacyTailIds = new Set(PUZZLE_DEFINITIONS.slice(10).map(({ id }) => id));
const activeLevels: readonly VerifiedLevel[] = Object.freeze([
  ...phase7Artifact.levels,
  ...legacyArtifact.levels.filter(({ id }) => legacyTailIds.has(id)),
]);

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
  it('binds the first ten re-authored levels and retained legacy tail to real Core route families', () => {
    expect(phase7Artifact.schemaVersion).toBe(7);
    expect(phase7Artifact.claim).toContain('non-unique');
    expect(phase7Artifact.claim).toContain('not an optimality proof');
    expect(phase7Artifact.batch).toEqual({ from: 1, to: 10 });
    expect(phase7Artifact.searchBounds).toEqual({ maxLocks: 18, primaryBeam: 900, alternateBeam: 700 });
    expect(Object.keys(phase7Artifact.commandEncoding).sort()).toEqual(['C', 'H', 'L', 'R', 'S', 'T']);
    expect(phase7Artifact.difficultyTuple).toEqual([
      'targetRowCount', 'lockedPieces', 'rotationPlanning', 'horizontalPlanning', 'clearDistribution',
      'maximumHeight', 'peakHoles', 'branchWidth', 'firstDivergenceLock', 'anchorCount',
    ]);
    expect(phase7Artifact.levels).toHaveLength(10);
    expect(phase7Artifact.campaignOrder).toEqual(PUZZLE_DEFINITIONS.slice(0, 10).map(({ id }) => id));
    expect(phase7Artifact.levels.map(({ shorterRouteLocks }) => shorterRouteLocks)).toEqual(
      [...phase7Artifact.levels.map(({ shorterRouteLocks }) => shorterRouteLocks)].sort((left, right) => left - right),
    );
    expect(phase7Artifact.levels.slice(0, 5).every(({ anchorCells }) => anchorCells.length === 0)).toBe(true);
    expect(phase7Artifact.levels.slice(5).reduce((count, { anchorCells }) => count + anchorCells.length, 0)).toBe(1);

    expect(legacyArtifact.schemaVersion).toBe(6);
    expect(legacyArtifact.claim).toContain('not a budget');
    expect(legacyArtifact.claim).toContain('unique answer');
    expect(legacyArtifact.difficultyTuple).toEqual([
      'targetRowCount', 'authoredPosition', 'routePlanning', 'rotationPlanning', 'branchTiming', 'recoveryRoom',
    ]);
    expect(activeLevels).toHaveLength(20);
    expect(new Set(activeLevels.map(({ id }) => id)).size).toBe(20);
    expect(PUZZLE_DEFINITIONS.map(({ id }) => id)).toEqual(activeLevels.map(({ id }) => id));

    for (const [index, level] of activeLevels.entries()) {
      const definition = getPuzzleDefinition(level.id);
      expect(level.curriculumPosition, level.id).toBe(index + 1);
      expect(definition.difficulty, level.id).toBe(index + 1);
      expect(level.targetRowCount, level.id).toBe(expectedPuzzleTargetRows(definition.difficulty));
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
      if (index < 10) expect(level.firstDivergenceLock, level.id).toBeLessThanOrEqual(4);
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

    for (const level of phase7Artifact.levels) {
      const definition = getPuzzleDefinition(level.id);
      expect(level.targetRowCount, level.id).toBe(3);
      expect(level.setup.placementCount, level.id).toBeGreaterThanOrEqual(5);
      expect(level.setup.placementCount, level.id).toBeLessThanOrEqual(6);
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
      const routeReplays = level.routes.map((route) => {
        const commands = decode(route.commandStream);
        let state = createInitialState(0x51a1f00d, 'puzzle', level.id);
        let terminalIndex = -1;
        for (const [index, command] of commands.entries()) {
          state = dispatch(state, command).state;
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
