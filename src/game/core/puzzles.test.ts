import { describe, expect, it } from 'vitest';
import referencesFile from '../../../docs/workstreams/tetris-t5-core/puzzle-references.json';
import { createInitialState, dispatch, stateHash } from './engine';
import { PUZZLE_DEFINITIONS, getPuzzleDefinition, validatePuzzleDefinition, type PuzzleDefinition } from './puzzles';
import { createRandomizer, drawPiece } from './random';
import { PIECE_TYPES, type PieceType, type PuzzleId } from './types';

type T5Level = {
  id: PuzzleId;
  name: string;
  seed: number;
  boardRows: string[];
  first84: PieceType[];
};

const t5Levels = (referencesFile as unknown as { levels: T5Level[] }).levels;

function invalid(definition: PuzzleDefinition, patch: Partial<PuzzleDefinition>): PuzzleDefinition {
  return { ...definition, ...patch };
}

function generatedPieces(seed: number, count: number): PieceType[] {
  let randomizer = createRandomizer(seed);
  const pieces: PieceType[] = [];
  for (let index = 0; index < count; index += 1) {
    const draw = drawPiece(randomizer);
    pieces.push(draw.piece);
    randomizer = draw.randomizer;
  }
  return pieces;
}

describe('T5 normal-play Puzzle definitions', () => {
  it('matches the six-level fixture and enforces the authored topology floor', () => {
    expect(PUZZLE_DEFINITIONS).toHaveLength(6);
    expect(PUZZLE_DEFINITIONS.map(({ id, name, seed, boardRows }) => ({ id, name, seed, boardRows })))
      .toEqual(t5Levels.map(({ id, name, seed, boardRows }) => ({ id, name, seed, boardRows })));

    for (const definition of PUZZLE_DEFINITIONS) {
      expect(() => validatePuzzleDefinition(definition)).not.toThrow();
      expect('difficulty' in definition).toBe(false);
      expect('queue' in definition).toBe(false);
      expect('pieceBudget' in definition).toBe(false);
      const nonEmptyRows = definition.boardRows.filter((row) => row !== '..........');
      const densities = nonEmptyRows.map((row) => [...row].filter((cell) => cell !== '.').length);
      expect(nonEmptyRows.length).toBeGreaterThanOrEqual(8);
      expect(nonEmptyRows.length).toBeLessThanOrEqual(12);
      expect(new Set(nonEmptyRows).size).toBeGreaterThanOrEqual(5);
      expect(new Set(densities).size).toBeGreaterThanOrEqual(3);
      expect(densities.filter((count) => count <= 7).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('proves twelve consecutive complete seven-bags per stable level seed', () => {
    for (const level of t5Levels) {
      const first84 = generatedPieces(level.seed, 84);
      expect(first84).toEqual(level.first84);
      for (let bagIndex = 0; bagIndex < 12; bagIndex += 1) {
        const bag = first84.slice(bagIndex * 7, bagIndex * 7 + 7);
        expect(new Set(bag)).toEqual(new Set(PIECE_TYPES));
      }
    }
  });

  it('fails closed for malformed, shallow, repetitive, template-like, or hidden authored content', () => {
    const first = getPuzzleDefinition('t3r-shaft-01');
    expect(() => validatePuzzleDefinition(invalid(first, { seed: 0 }))).toThrow(/seed/i);
    expect(() => validatePuzzleDefinition(invalid(first, { seed: getPuzzleDefinition('t3r-shaft-02').seed }))).toThrow(/stable level seed/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: first.boardRows.slice(1) }))).toThrow(/exactly/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: [...first.boardRows.slice(0, 19), '.........'] }))).toThrow(/malformed/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: [...first.boardRows.slice(0, 19), 'QJJJ.JJJJ.'] }))).toThrow(/illegal/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: Array.from({ length: 20 }, () => '..........') }))).toThrow(/non-empty/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: [...first.boardRows.slice(0, 19), 'JJJJJJJJJJ'] }))).toThrow(/full visible row/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      boardRows: [...Array.from({ length: 14 }, () => '..........'), ...Array.from({ length: 6 }, () => 'J.........')],
    }))).toThrow(/8-12/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      boardRows: [...Array.from({ length: 12 }, () => '..........'), ...Array.from({ length: 8 }, () => 'J.........')],
    }))).toThrow(/five distinct/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      boardRows: [...Array.from({ length: 12 }, () => '..........'), ...Array.from({ length: 8 }, (_, index) => (
        'J'.repeat(index) + '.' + 'J'.repeat(9 - index)
      ))],
    }))).toThrow(/floor templates/i);
    expect(() => validatePuzzleDefinition(invalid(first, { hiddenCells: [{ x: 0, y: 0, type: 'J' }] }))).toThrow(/hidden buffer/i);
  });
});
describe('T5 Puzzle deterministic initialization', () => {
  it('uses the level seed and shared replenishing queue regardless of caller seed', () => {
    const definition = getPuzzleDefinition('t3r-shaft-02');
    const ready = createInitialState(7, 'puzzle', definition.id);
    const expected = generatedPieces(definition.seed, 6);

    expect(ready.status).toBe('ready');
    expect(ready.seed).toBe(definition.seed);
    expect(ready.active?.type).toBe(expected[0]);
    expect(ready.queue).toEqual(expected.slice(1));
    expect(ready.puzzleQueue).toEqual(ready.queue);
    expect(ready.puzzleQueueIndex).toBe(0);
    expect(ready.puzzlePieceBudget).toBeNull();
    expect(ready.puzzleGoal).toBe('canonical-board-empty');
    expect(ready.puzzleCompletion).toBe('active');
    expect(ready.puzzleTargetLines).toBeNull();

    const playing = dispatch(ready, { type: 'start' }).state;
    expect(playing.active).toEqual(ready.active);
    expect(playing.queue).toEqual(ready.queue);
  });

  it('shares Marathon gravity instead of freezing the active piece', () => {
    let state = dispatch(createInitialState(7, 'puzzle', 't3r-shaft-01'), { type: 'start' }).state;
    const spawnY = state.active?.y;
    for (let index = 0; index < 47; index += 1) state = dispatch(state, { type: 'tick' }).state;
    expect(state.active?.y).toBe(spawnY);
    state = dispatch(state, { type: 'tick' }).state;
    expect(state.active?.y).toBe((spawnY ?? 0) + 1);
  });

  it('restarts the exact authored board, seed, randomizer, active piece, and hash', () => {
    const initial = createInitialState(0x0ff5e7, 'puzzle', 't3r-cascade-05');
    let changed = dispatch(initial, { type: 'start' }).state;
    changed = dispatch(changed, { type: 'move', dx: -1 }).state;
    changed = dispatch(changed, { type: 'hard-drop' }).state;

    const restarted = dispatch(changed, { type: 'restart', seed: 123 }).state;
    expect(stateHash(restarted)).toBe(stateHash(initial));
    expect(restarted.seed).toBe(getPuzzleDefinition('t3r-cascade-05').seed);
    expect(restarted.active).toEqual(initial.active);
    expect(restarted.randomizer).toEqual(initial.randomizer);
    expect(restarted.board).toEqual(initial.board);
    expect(restarted.completedLevelId).toBeNull();
    expect(restarted.nextUnlockedLevelId).toBeNull();
  });
});
