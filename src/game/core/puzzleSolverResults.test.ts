import { describe, expect, it } from 'vitest';
import artifactFile from '../../../docs/workstreams/tetris-t13-core/puzzle-endgame-results.json';
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

type VerifiedLevel = {
  id: PuzzleId;
  curriculumPosition: number;
  targetRowCount: number;
  setup: { seed: number; placementCount: number };
  anchorCells: readonly PuzzleAnchorCell[];
  routes: readonly [VerifiedRoute, VerifiedRoute];
  firstDivergenceLock: number;
};

type CurriculumArtifact = {
  schemaVersion: 6;
  claim: string;
  commandEncoding: Record<CommandToken, GameCommand>;
  difficultyTuple: readonly ['targetRowCount', 'authoredPosition', 'routePlanning', 'rotationPlanning', 'branchTiming', 'recoveryRoom'];
  campaignOrder: readonly PuzzleId[];
  levels: readonly VerifiedLevel[];
};

const artifact = artifactFile as unknown as CurriculumArtifact;

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

describe('T13 verified multi-route endgame workshop', () => {
  it('binds two real Core route families to every legal replay-derived board in the calibrated all-open order', () => {
    expect(artifact.schemaVersion).toBe(6);
    expect(artifact.claim).toContain('not a budget');
    expect(artifact.claim).toContain('unique answer');
    expect(Object.keys(artifact.commandEncoding).sort()).toEqual(['C', 'H', 'L', 'R', 'S', 'T']);
    expect(artifact.difficultyTuple).toEqual([
      'targetRowCount', 'authoredPosition', 'routePlanning', 'rotationPlanning', 'branchTiming', 'recoveryRoom',
    ]);
    expect(artifact.levels).toHaveLength(20);
    expect(new Set(artifact.levels.map(({ id }) => id)).size).toBe(20);
    expect(artifact.campaignOrder).toEqual(artifact.levels.map(({ id }) => id));
    expect(PUZZLE_DEFINITIONS.map(({ id }) => id)).toEqual(artifact.campaignOrder);

    for (const [index, level] of artifact.levels.entries()) {
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
  });

  it('replays both documented choices through public Core commands, with no post-win inputs and a genuine early landing branch', () => {
    for (const level of artifact.levels) {
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
