import { describe, expect, it } from 'vitest';
import referencesFile from '../../../docs/workstreams/tetris-t5-core/puzzle-references.json';
import { createInitialState, dispatch, stateHash } from './engine';
import { PUZZLE_DEFINITIONS, getPuzzleDefinition, validatePuzzleDefinition, type PuzzleDefinition } from './puzzles';
import type { PieceType, PuzzleId } from './types';

type T5Level = {
  id: PuzzleId;
  name: string;
  difficulty: number;
  boardRows: string[];
  queue: PieceType[];
  pieceBudget: number;
};

const t5Levels = (referencesFile as unknown as { levels: T5Level[] }).levels;

function invalid(definition: PuzzleDefinition, patch: Partial<PuzzleDefinition>): PuzzleDefinition {
  return { ...definition, ...patch };
}

describe('T5 campaign definitions', () => {
  it('matches the six-level T5 fixture exactly and enforces the authored complexity floor', () => {
    expect(PUZZLE_DEFINITIONS).toHaveLength(6);
    expect(PUZZLE_DEFINITIONS.map((definition) => ({
      id: definition.id,
      name: definition.name,
      difficulty: definition.difficulty,
      boardRows: definition.boardRows,
      queue: definition.queue,
      pieceBudget: definition.pieceBudget,
    }))).toEqual(t5Levels.map((level) => ({
      id: level.id,
      name: level.name,
      difficulty: level.difficulty,
      boardRows: level.boardRows,
      queue: level.queue,
      pieceBudget: level.pieceBudget,
    })));

    for (const definition of PUZZLE_DEFINITIONS) {
      expect(() => validatePuzzleDefinition(definition)).not.toThrow();
      expect(definition.queue.length).toBeGreaterThanOrEqual(10);
      expect(definition.queue.length).toBeLessThanOrEqual(16);
      expect(new Set(definition.queue).size).toBeGreaterThanOrEqual(4);
      expect(definition.boardRows.filter((row) => row.includes('J'))).toHaveLength(7);
    }
  });

  it('fails closed for malformed, unsupported, shallow, repetitive, or under-diverse authored content', () => {
    const first = getPuzzleDefinition('t3r-shaft-01');
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: first.boardRows.slice(1) }))).toThrow(/exactly/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: [...first.boardRows.slice(0, 19), '.........'] }))).toThrow(/malformed/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: [...first.boardRows.slice(0, 19), 'QJJJ.JJJJ.'] }))).toThrow(/illegal/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: Array.from({ length: 20 }, () => '..........') }))).toThrow(/non-empty/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: [...first.boardRows.slice(0, 19), 'JJJJJJJJJJ'] }))).toThrow(/full visible row/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: ['J.........', ...first.boardRows.slice(1)] }))).toThrow(/unsupported/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      boardRows: [...Array.from({ length: 14 }, () => '..........'), ...Array.from({ length: 6 }, () => 'J.........')],
    }))).toThrow(/four row shapes/i);
    expect(() => validatePuzzleDefinition(invalid(first, { hiddenCells: [{ x: 0, y: 0, type: 'J' }] }))).toThrow(/hidden buffer/i);
    expect(() => validatePuzzleDefinition(invalid(first, { queue: [] }))).toThrow(/non-empty queue/i);
    expect(() => validatePuzzleDefinition(invalid(first, { queue: ['Q'] as unknown as PieceType[] }))).toThrow(/illegal queue/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      queue: ['I', 'O', 'T', 'S', 'Z', 'J', 'L', 'I', 'O'], pieceBudget: 9,
    }))).toThrow(/10-16/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      queue: Array.from({ length: 17 }, () => 'I'), pieceBudget: 17,
    }))).toThrow(/10-16/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      queue: ['I', 'O', 'I', 'O', 'I', 'O', 'I', 'O', 'I', 'O'], pieceBudget: 10,
    }))).toThrow(/four piece types/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      queue: ['I', 'I', 'I', 'O', 'T', 'S', 'Z', 'J', 'L', 'O'], pieceBudget: 10,
    }))).toThrow(/overlong/i);
    expect(() => validatePuzzleDefinition(invalid(first, { pieceBudget: first.queue.length - 1 }))).toThrow(/budget/i);
  });
});

describe('T5 puzzle canonical initialization', () => {
  it('keeps the authored queue immutable and advances its index only after successful spawns', () => {
    const definition = getPuzzleDefinition('t3r-shaft-02');
    const ready = createInitialState(7, 'puzzle', definition.id);
    expect(ready.status).toBe('ready');
    expect(ready.active).toBeNull();
    expect(ready.puzzleQueueIndex).toBe(0);
    expect(ready.queue).toEqual(definition.queue);
    expect(ready.puzzleQueue).toEqual(definition.queue);
    expect(ready.puzzleGoal).toBe('canonical-board-empty');
    expect(ready.puzzleCompletion).toBe('active');
    expect(ready.puzzleTargetLines).toBeNull();

    const playing = dispatch(ready, { type: 'start' }).state;
    expect(playing.active?.type).toBe(definition.queue[0]);
    expect(playing.puzzleQueueIndex).toBe(1);
    expect(playing.queue).toEqual(definition.queue.slice(1));
    expect(playing.puzzleQueue).toEqual(ready.puzzleQueue);
  });

  it('has no automatic puzzle gravity and hashes campaign-only facts', () => {
    const started = dispatch(createInitialState(7, 'puzzle', 't3r-shaft-01'), { type: 'start' }).state;
    let afterTicks = started;
    for (let index = 0; index < 180; index += 1) afterTicks = dispatch(afterTicks, { type: 'tick' }).state;
    expect(afterTicks.active?.y).toBe(started.active?.y);
    expect(stateHash(started)).not.toBe(stateHash({ ...started, puzzleQueueIndex: 2 }));
    expect(stateHash(started)).not.toBe(stateHash({ ...started, puzzleCompletion: 'failed-budget' }));
  });

  it('restarts the exact authored ready state without retaining completion or unlock data', () => {
    const initial = createInitialState(0x0ff5e7, 'puzzle', 't3r-cascade-05');
    const started = dispatch(initial, { type: 'start' }).state;
    const restarted = dispatch(started, { type: 'restart' }).state;
    expect(stateHash(restarted)).toBe(stateHash(initial));
    expect(restarted.active).toBeNull();
    expect(restarted.puzzleQueueIndex).toBe(0);
    expect(restarted.completedLevelId).toBeNull();
    expect(restarted.nextUnlockedLevelId).toBeNull();
  });
});
