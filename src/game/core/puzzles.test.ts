import { describe, expect, it } from 'vitest';
import { VISIBLE_HEIGHT, VISIBLE_START_ROW } from './constants';
import { createInitialState, dispatch, stateHash } from './engine';
import { PUZZLE_DEFINITIONS, createPuzzleBoard, getPuzzleDefinition, originalTargetCells, validatePuzzleDefinition, type PuzzleDefinition } from './puzzles';
import { createRandomizer, drawPiece } from './random';
import { PIECE_TYPES, type PieceType, type PuzzleId } from './types';

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

function occupiedCount(definition: PuzzleDefinition): number {
  return definition.boardRows.join('').replaceAll('.', '').length;
}

describe('T12.5 low-pressure Puzzle definitions', () => {
  it('keeps twenty stable IDs in an authored, gentle campaign order', () => {
    expect(PUZZLE_DEFINITIONS).toHaveLength(20);
    expect(PUZZLE_DEFINITIONS.map((definition) => definition.difficulty)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    );
    expect(PUZZLE_DEFINITIONS.map(({ id }) => id)).toEqual([
      't3r-shaft-01', 't3r-shaft-02', 't3r-shaft-03', 't3r-shaft-04', 't3r-cascade-05',
      't3r-cascade-06', 't5r-delta-07', 't5r-drift-08', 't5r-lattice-09', 't5r-rift-10',
      't5r-prism-11', 't5r-current-12', 't5r-arc-13', 't5r-pulse-14', 't5r-horizon-15',
      't6r-veil-16', 't6r-cairn-17', 't6r-terrace-18', 't6r-bastion-19', 't6r-keystone-20',
    ] satisfies PuzzleId[]);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ id }) => id)).size).toBe(20);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ name }) => name)).size).toBe(20);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ seed }) => seed)).size).toBe(20);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ boardRows }) => boardRows.join('/'))).size).toBe(20);
    expect(PUZZLE_DEFINITIONS.every((definition) => !('solverPieceBudget' in definition))).toBe(true);
    expect(PUZZLE_DEFINITIONS.every((definition) => !('anchorCells' in definition))).toBe(true);
  });

  it('uses only a contiguous one-to-four-row target band at the floor', () => {
    for (const definition of PUZZLE_DEFINITIONS) {
      expect(() => validatePuzzleDefinition(definition), definition.id).not.toThrow();
      expect(definition.boardRows).toHaveLength(VISIBLE_HEIGHT);
      expect(definition.hiddenCells).toEqual([]);

      const occupiedRows = definition.boardRows
        .map((row, y) => row === '.'.repeat(10) ? null : y)
        .filter((y): y is number => y !== null);
      expect(occupiedRows.length, definition.id).toBeGreaterThanOrEqual(1);
      expect(occupiedRows.length, definition.id).toBeLessThanOrEqual(4);
      expect(occupiedRows, definition.id).toEqual(
        Array.from({ length: occupiedRows.length }, (_, index) => VISIBLE_HEIGHT - occupiedRows.length + index),
      );
      expect(occupiedCount(definition), definition.id).toBeGreaterThanOrEqual(6);
      expect(occupiedCount(definition), definition.id).toBeLessThanOrEqual(36);

      for (const row of definition.boardRows) {
        expect(row).toHaveLength(10);
        expect([...row].every((cell) => cell === '.' || PIECE_TYPES.includes(cell as PieceType))).toBe(true);
        if (row !== '..........') expect([...row]).toContain('.');
      }
    }
  });

  it('starts every selected level from the exact shallow target board and a stable seven-bag', () => {
    for (const definition of PUZZLE_DEFINITIONS) {
      const ready = createInitialState(0x51a1f00d, 'puzzle', definition.id);
      expect(ready.status, definition.id).toBe('ready');
      expect(ready.seed, definition.id).toBe(definition.seed);
      expect(ready.puzzleGoal, definition.id).toBe('original-targets-cleared');
      expect(ready.puzzleInitialTargetCount, definition.id).toBe(occupiedCount(definition));
      expect(ready.puzzleTargetCells, definition.id).toEqual(originalTargetCells(definition));
      expect(ready.board.slice(0, VISIBLE_START_ROW).flat(), definition.id).toEqual(
        Array.from({ length: VISIBLE_START_ROW * 10 }, () => null),
      );
      expect(ready.board.slice(VISIBLE_START_ROW).map((row) => row.map((cell) => cell ?? '.').join('')), definition.id)
        .toEqual(definition.boardRows);
      expect(ready.board.flat().includes('A')).toBe(false);

      const firstEightyFour = generatedPieces(definition.seed, 84);
      for (let bag = 0; bag < 12; bag += 1) {
        expect(new Set(firstEightyFour.slice(bag * 7, bag * 7 + 7)), definition.id).toEqual(new Set(PIECE_TYPES));
      }
    }
  });

  it('rejects mutations that would reintroduce another board, hidden stack, or unbound seed', () => {
    const first = getPuzzleDefinition('t3r-shaft-01');
    expect(() => validatePuzzleDefinition(invalid(first, { seed: 0 }))).toThrow(/seed/i);
    expect(() => validatePuzzleDefinition(invalid(first, { seed: getPuzzleDefinition('t3r-shaft-02').seed }))).toThrow(/stable level seed/i);
    expect(() => validatePuzzleDefinition(invalid(first, { difficulty: 20 }))).toThrow(/difficulty/i);
    expect(() => validatePuzzleDefinition(invalid(first, { name: 'other' }))).toThrow(/name/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: first.boardRows.slice(1) }))).toThrow(/exactly/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      boardRows: [...first.boardRows.slice(0, 19), 'IIIIIIIIII'],
    }))).toThrow(/target pattern/i);
    expect(() => validatePuzzleDefinition(invalid(first, { hiddenCells: [{ x: 0, y: 0, type: 'J' }] }))).toThrow(/hidden buffer/i);
  });

  it('restarts a level with the exact same board, target ownership, queue, and hash', () => {
    const initial = createInitialState(0x51a1f00d, 'puzzle', 't3r-shaft-01');
    let changed = dispatch(initial, { type: 'start' }).state;
    changed = dispatch(changed, { type: 'move', dx: -1 }).state;
    changed = dispatch(changed, { type: 'hard-drop' }).state;
    const restarted = dispatch(changed, { type: 'restart', seed: 123, mode: 'puzzle', puzzleId: 't3r-shaft-01' }).state;

    expect(restarted).toEqual(initial);
    expect(stateHash(restarted)).toBe(stateHash(initial));
    expect(createPuzzleBoard(getPuzzleDefinition('t3r-shaft-01'))).toEqual(initial.board);
  });
});
