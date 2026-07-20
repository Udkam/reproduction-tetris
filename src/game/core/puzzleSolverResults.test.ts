import { describe, expect, it } from 'vitest';
import artifactFile from '../../../docs/workstreams/tetris-t12-core/puzzle-solver-results.json';
import { VISIBLE_START_ROW } from './constants';
import { createInitialState, dispatch } from './engine';
import { expectedPuzzleTargetRows, PUZZLE_DEFINITIONS, getPuzzleDefinition, type PuzzleAnchorCell } from './puzzles';
import { ANCHOR_CELL, type GameCommand, type PuzzleId } from './types';

type CommandToken = 'S' | 'T' | 'L' | 'R' | 'H' | 'C';

type VerifiedLevel = {
  id: PuzzleId;
  routeClass: string;
  targetRowCount: number;
  anchorCells: readonly PuzzleAnchorCell[];
  commandStream: string;
  commandCount: number;
  locks: number;
  rotationCount: number;
  moveCount: number;
};

type CurriculumArtifact = {
  schemaVersion: 4;
  claim: string;
  commandEncoding: Record<CommandToken, GameCommand>;
  difficultyTuple: readonly ['targetRowCount', 'locks', 'rotationCount', 'moveCount', 'commandCount', 'id'];
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

function targetRows(id: PuzzleId): number {
  return getPuzzleDefinition(id).boardRows.filter((row) => row !== '..........').length;
}

function difficultyKey(level: VerifiedLevel): readonly [number, number, number, number, number, string] {
  return [level.targetRowCount, level.locks, level.rotationCount, level.moveCount, level.commandCount, level.id];
}

function compareDifficulty(left: readonly (number | string)[], right: readonly (number | string)[]): number {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] === right[index]) continue;
    return left[index]! < right[index]! ? -1 : 1;
  }
  return 0;
}

describe('T12.6 verified layered Puzzle routes', () => {
  it('binds a public-command route to each three-to-seven-row level and records the ascending calibration', () => {
    expect(artifact.schemaVersion).toBe(4);
    expect(artifact.claim).toContain('not a mathematical optimality claim');
    expect(Object.keys(artifact.commandEncoding).sort()).toEqual(['C', 'H', 'L', 'R', 'S', 'T']);
    expect(artifact.difficultyTuple).toEqual(['targetRowCount', 'locks', 'rotationCount', 'moveCount', 'commandCount', 'id']);
    expect(artifact.levels).toHaveLength(20);
    expect(new Set(artifact.levels.map(({ id }) => id)).size).toBe(20);
    expect(artifact.campaignOrder).toEqual(artifact.levels.map(({ id }) => id));
    expect(PUZZLE_DEFINITIONS.map(({ id }) => id)).toEqual(artifact.campaignOrder);

    let prior: readonly (number | string)[] | null = null;
    for (const [index, level] of artifact.levels.entries()) {
      const definition = getPuzzleDefinition(level.id);
      expect(definition.difficulty).toBe(index + 1);
      expect(level.targetRowCount).toBe(expectedPuzzleTargetRows(definition.difficulty));
      expect(level.targetRowCount).toBe(targetRows(level.id));
      expect(level.anchorCells, level.id).toEqual(definition.anchorCells);
      expect(routeMetrics(level.commandStream), level.id).toEqual({
        commandCount: level.commandCount,
        locks: level.locks,
        rotationCount: level.rotationCount,
        moveCount: level.moveCount,
      });
      expect(level.locks, level.id).toBeGreaterThanOrEqual(level.targetRowCount);
      expect(level.commandStream.includes('D'), level.id).toBe(false);
      expect(level.commandStream.includes('A'), level.id).toBe(false);
      expect('solverPieceBudget' in definition, level.id).toBe(false);
      const key = difficultyKey(level);
      if (prior) expect(compareDifficulty(prior, key), level.id).toBeLessThanOrEqual(0);
      prior = key;
    }
  });

  it('replays every clearable route through real Core commands to the original-target victory', () => {
    for (const level of artifact.levels) {
      const definition = getPuzzleDefinition(level.id);
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
      expect(state.board.flat().filter((cell) => cell === ANCHOR_CELL), level.id).toHaveLength(definition.anchorCells.length);
      for (const anchor of definition.anchorCells) {
        expect(state.board[VISIBLE_START_ROW + anchor.y]?.[anchor.x], level.id).toBe(ANCHOR_CELL);
      }
    }
  });
});
