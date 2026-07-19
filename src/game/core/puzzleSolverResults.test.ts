import { describe, expect, it } from 'vitest';
import artifactFile from '../../../docs/workstreams/tetris-t12-core/puzzle-solver-results.json';
import { createInitialState, dispatch } from './engine';
import { PUZZLE_DEFINITIONS, getPuzzleDefinition } from './puzzles';
import type { GameCommand, PuzzleId } from './types';

type CommandToken = 'S' | 'T' | 'L' | 'R' | 'H' | 'C';

type VerifiedLevel = {
  id: PuzzleId;
  routeClass: string;
  commandStream: string;
  commandCount: number;
  locks: number;
  rotationCount: number;
  moveCount: number;
};

type CurriculumArtifact = {
  schemaVersion: 2;
  claim: string;
  commandEncoding: Record<CommandToken, GameCommand>;
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

function routeMetrics(stream: string) {
  const tokens = [...stream] as CommandToken[];
  return {
    commandCount: tokens.length,
    locks: tokens.filter((token) => token === 'H').length,
    rotationCount: tokens.filter((token) => token === 'C').length,
    moveCount: tokens.filter((token) => token === 'L' || token === 'R').length,
  };
}

describe('T12.5 verified low-pressure Puzzle routes', () => {
  it('binds a short public-command route to each level without a solver budget', () => {
    expect(artifact.schemaVersion).toBe(2);
    expect(artifact.claim).toContain('not a mathematical optimality claim');
    expect(Object.keys(artifact.commandEncoding).sort()).toEqual(['C', 'H', 'L', 'R', 'S', 'T']);
    expect(artifact.levels).toHaveLength(20);
    expect(new Set(artifact.levels.map(({ id }) => id)).size).toBe(20);
    expect(artifact.campaignOrder).toEqual(artifact.levels.map(({ id }) => id));
    expect(PUZZLE_DEFINITIONS.map(({ id }) => id)).toEqual(artifact.campaignOrder);

    for (const [index, level] of artifact.levels.entries()) {
      const definition = getPuzzleDefinition(level.id);
      expect(definition.difficulty).toBe(index + 1);
      expect(routeMetrics(level.commandStream), level.id).toEqual({
        commandCount: level.commandCount,
        locks: level.locks,
        rotationCount: level.rotationCount,
        moveCount: level.moveCount,
      });
      expect(level.locks, level.id).toBe(1);
      expect(level.rotationCount, level.id).toBeLessThanOrEqual(1);
      expect(level.moveCount, level.id).toBeLessThanOrEqual(3);
      expect(level.commandStream.includes('D'), level.id).toBe(false);
      expect(level.commandStream.includes('A'), level.id).toBe(false);
      expect('solverPieceBudget' in definition, level.id).toBe(false);
    }
  });

  it('replays every clearable route through real Core commands to the original-target victory', () => {
    for (const level of artifact.levels) {
      const commands = decode(level.commandStream);
      expect(commands, `${level.id} command count`).toHaveLength(level.commandCount);

      let state = createInitialState(0x51a1f00d, 'puzzle', level.id);
      let terminalIndex = -1;
      for (const [index, command] of commands.entries()) {
        state = dispatch(state, command).state;
        if (state.status !== 'playing' && terminalIndex === -1) terminalIndex = index;
      }

      expect(terminalIndex, `${level.id} has no commands after terminal`).toBe(commands.length - 1);
      expect(state.status, level.id).toBe('finished');
      expect(state.puzzleCompletion, level.id).toBe('finished');
      expect(state.puzzleTargetCells, level.id).toHaveLength(0);
      expect(state.pieceCount, level.id).toBe(level.locks);
      expect(state.board.flat().includes('A'), level.id).toBe(false);
    }
  });
});
