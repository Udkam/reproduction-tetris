import { describe, expect, it } from 'vitest';
import artifactFile from '../../../docs/workstreams/tetris-t12-core/puzzle-solver-results.json';
import { createInitialState, dispatch, stateHash } from './engine';
import { PUZZLE_DEFINITIONS, PUZZLE_SOLUTION_BUDGET_MULTIPLIER, getPuzzleDefinition } from './puzzles';
import type { GameCommand, PuzzleId } from './types';

type CommandToken = 'S' | 'T' | 'L' | 'R' | 'D' | 'H' | 'C' | 'A';

type VerifiedLevel = {
  id: PuzzleId;
  solutionLocks: number;
  budget: number;
  retainedAnchorCount: number;
  routeSource: 'guided-soft' | 'legacy-route-1' | 'extension-route-transcript';
  commandStream: string;
  commandCount: number;
  commandDigest: string;
  softDropCount: number;
  rotationCount: number;
  moveCount: number;
  finalState: {
    status: 'finished';
    completion: 'finished';
    targetsRemaining: 0;
    stateHash: string;
  };
};

type SolverArtifact = {
  schemaVersion: 1;
  sourceCommit: string;
  claim: string;
  commandEncoding: Record<CommandToken, GameCommand>;
  orderTieBreak: readonly string[];
  campaignOrder: readonly PuzzleId[];
  levels: readonly VerifiedLevel[];
};

const artifact = artifactFile as unknown as SolverArtifact;

function commandFor(token: string): GameCommand {
  switch (token) {
    case 'S': return { type: 'start' };
    case 'T': return { type: 'tick' };
    case 'L': return { type: 'move', dx: -1 };
    case 'R': return { type: 'move', dx: 1 };
    case 'D': return { type: 'soft-drop' };
    case 'H': return { type: 'hard-drop' };
    case 'C': return { type: 'rotate', direction: 1 };
    case 'A': return { type: 'rotate', direction: -1 };
    default: throw new Error(`Unknown compact public command: ${token}`);
  }
}

function decode(stream: string): GameCommand[] {
  return [...stream].map(commandFor);
}

function digest(value: unknown): string {
  const canonical = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function routeMetrics(stream: string) {
  const tokens = [...stream] as CommandToken[];
  return {
    commandCount: tokens.length,
    solutionLocks: tokens.filter((token) => token === 'H').length,
    softDropCount: tokens.filter((token) => token === 'D').length,
    rotationCount: tokens.filter((token) => token === 'A' || token === 'C').length,
    moveCount: tokens.filter((token) => token === 'L' || token === 'R').length,
  };
}

function compareCampaignDifficulty(left: VerifiedLevel, right: VerifiedLevel): number {
  return left.solutionLocks - right.solutionLocks
    || left.retainedAnchorCount - right.retainedAnchorCount
    || left.softDropCount - right.softDropCount
    || left.commandCount - right.commandCount
    || left.id.localeCompare(right.id);
}

describe('T12.4 verified Puzzle route artifact', () => {
  it('keeps the calibrated order, doubled allowances, and explicit non-optimality claim', () => {
    expect(artifact.schemaVersion).toBe(1);
    expect(artifact.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(artifact.claim).toContain('not a mathematical optimality proof');
    expect(Object.keys(artifact.commandEncoding).sort()).toEqual(['A', 'C', 'D', 'H', 'L', 'R', 'S', 'T']);
    expect(artifact.levels).toHaveLength(20);
    expect(new Set(artifact.levels.map(({ id }) => id)).size).toBe(20);
    expect(artifact.campaignOrder).toEqual(artifact.levels.map(({ id }) => id));
    expect(PUZZLE_DEFINITIONS.map(({ id }) => id)).toEqual(artifact.campaignOrder);
    expect([...artifact.levels].sort(compareCampaignDifficulty).map(({ id }) => id)).toEqual(artifact.campaignOrder);

    for (const [index, level] of artifact.levels.entries()) {
      const definition = getPuzzleDefinition(level.id);
      expect(routeMetrics(level.commandStream), level.id).toEqual({
        commandCount: level.commandCount,
        solutionLocks: level.solutionLocks,
        softDropCount: level.softDropCount,
        rotationCount: level.rotationCount,
        moveCount: level.moveCount,
      });
      expect(level.budget, level.id).toBe(level.solutionLocks * PUZZLE_SOLUTION_BUDGET_MULTIPLIER);
      expect(definition.solverPieceBudget, level.id).toBe(level.budget);
      expect(definition.anchorCells, level.id).toHaveLength(level.retainedAnchorCount);
      expect(definition.difficulty, level.id).toBe(index + 1);
      if (index > 0) expect(level.solutionLocks).toBeGreaterThanOrEqual(artifact.levels[index - 1]!.solutionLocks);
    }
  });

  it('replays every lossless public-command stream to its stated finished state', () => {
    for (const level of artifact.levels) {
      const commands = decode(level.commandStream);
      expect(commands, `${level.id} command count`).toHaveLength(level.commandCount);
      expect(digest(commands), `${level.id} command digest`).toBe(level.commandDigest);

      let state = createInitialState(0x51a1f00d, 'puzzle', level.id);
      let terminalIndex = -1;
      for (const [index, command] of commands.entries()) {
        state = dispatch(state, command).state;
        if (state.status !== 'playing' && terminalIndex === -1) terminalIndex = index;
      }

      expect(terminalIndex, `${level.id} no commands after terminal`).toBe(commands.length - 1);
      expect(state.status, level.id).toBe(level.finalState.status);
      expect(state.puzzleCompletion, level.id).toBe(level.finalState.completion);
      expect(state.puzzleTargetCells, level.id).toHaveLength(level.finalState.targetsRemaining);
      expect(state.pieceCount, level.id).toBe(level.solutionLocks);
      expect(state.puzzlePieceBudget, level.id).toBe(level.budget);
      expect(stateHash(state), level.id).toBe(level.finalState.stateHash);
    }
  });
});
