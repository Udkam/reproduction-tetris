import { describe, expect, it } from 'vitest';
import { VISIBLE_HEIGHT, VISIBLE_START_ROW } from './constants';
import { createInitialState, dispatch, stateHash } from './engine';
import {
  PUZZLE_DEFINITIONS,
  createPuzzleBoard,
  expectedPuzzleTargetRows,
  getPuzzleDefinition,
  originalTargetCells,
  validatePuzzleDefinition,
  type PuzzleDefinition,
} from './puzzles';
import { createRandomizer, drawPiece } from './random';
import { ANCHOR_CELL, PIECE_TYPES, type PieceType, type PuzzleId } from './types';

function invalid(definition: PuzzleDefinition, patch: Partial<PuzzleDefinition>): PuzzleDefinition {
  return { ...definition, ...patch };
}

function occupiedCount(definition: PuzzleDefinition): number {
  return definition.boardRows.join('').replaceAll('.', '').length;
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

function visibleBoardRows(definition: PuzzleDefinition): string[] {
  const rows = definition.boardRows.map((row) => [...row]);
  for (const anchor of definition.anchorCells) rows[anchor.y]![anchor.x] = ANCHOR_CELL;
  return rows.map((row) => row.join(''));
}

describe('T12.6 layered Puzzle definitions', () => {
  it('keeps twenty stable IDs in the replay-calibrated natural campaign order', () => {
    expect(PUZZLE_DEFINITIONS.map(({ id }) => id)).toEqual([
      't3r-shaft-01', 't3r-shaft-02', 't3r-shaft-03', 't3r-shaft-04', 't3r-cascade-05',
      't3r-cascade-06', 't5r-delta-07', 't5r-drift-08', 't5r-lattice-09', 't5r-rift-10',
      't5r-prism-11', 't5r-current-12', 't5r-arc-13', 't5r-pulse-14', 't5r-horizon-15',
      't6r-veil-16', 't6r-cairn-17', 't6r-terrace-18', 't6r-bastion-19', 't6r-keystone-20',
    ] satisfies PuzzleId[]);
    expect(PUZZLE_DEFINITIONS.map(({ difficulty }) => difficulty)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(new Set(PUZZLE_DEFINITIONS.map(({ id }) => id)).size).toBe(20);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ name }) => name)).size).toBe(20);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ seed }) => seed)).size).toBe(20);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ boardRows }) => boardRows.join('/'))).size).toBe(20);
    expect(PUZZLE_DEFINITIONS.every((definition) => !('solverPieceBudget' in definition))).toBe(true);
    expect(PUZZLE_DEFINITIONS.filter((definition) => definition.anchorCells.length > 0).map(({ id }) => id)).toEqual([
      't3r-shaft-02', 't3r-shaft-04', 't5r-delta-07', 't5r-lattice-09', 't5r-prism-11',
      't5r-pulse-14', 't6r-veil-16', 't6r-terrace-18', 't6r-keystone-20',
    ] satisfies PuzzleId[]);
    expect(PUZZLE_DEFINITIONS.reduce((count, definition) => count + definition.anchorCells.length, 0)).toBe(10);
    expect(PUZZLE_DEFINITIONS.every((definition) => definition.anchorCells.length <= 2)).toBe(true);
  });

  it('uses the required contiguous three-to-seven-row target bands at the floor', () => {
    expect(PUZZLE_DEFINITIONS.map((definition) => expectedPuzzleTargetRows(definition.difficulty))).toEqual([
      3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7,
    ]);

    for (const definition of PUZZLE_DEFINITIONS) {
      expect(() => validatePuzzleDefinition(definition), definition.id).not.toThrow();
      expect(definition.boardRows).toHaveLength(VISIBLE_HEIGHT);
      expect(definition.hiddenCells).toEqual([]);

      const occupiedRows = definition.boardRows
        .map((row, y) => row === '.'.repeat(10) ? null : y)
        .filter((y): y is number => y !== null);
      expect(occupiedRows, definition.id).toHaveLength(expectedPuzzleTargetRows(definition.difficulty));
      expect(occupiedRows, definition.id).toEqual(
        Array.from({ length: occupiedRows.length }, (_, index) => VISIBLE_HEIGHT - occupiedRows.length + index),
      );
      expect(occupiedCount(definition), definition.id).toBeGreaterThanOrEqual(12);
      expect(occupiedCount(definition), definition.id).toBeLessThanOrEqual(48);
      const targetBandStart = VISIBLE_HEIGHT - occupiedRows.length;
      for (const anchor of definition.anchorCells) {
        expect(anchor.x, definition.id).toBeGreaterThanOrEqual(0);
        expect(anchor.x, definition.id).toBeLessThan(10);
        expect(anchor.y, definition.id).toBeGreaterThanOrEqual(2);
        expect(anchor.y, definition.id).toBeLessThan(targetBandStart);
      }

      for (const row of definition.boardRows) {
        expect(row).toHaveLength(10);
        expect([...row].every((cell) => cell === '.' || PIECE_TYPES.includes(cell as PieceType))).toBe(true);
        if (row !== '..........') {
          expect([...row]).toContain('.');
          expect([...row].some((cell) => cell !== '.')).toBe(true);
        }
      }
    }
  });

  it('starts every selected level from the exact target board and a stable seven-bag', () => {
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
        .toEqual(visibleBoardRows(definition));
      expect(ready.board.flat().filter((cell) => cell === ANCHOR_CELL), definition.id)
        .toHaveLength(definition.anchorCells.length);
      for (const anchor of definition.anchorCells) {
        expect(ready.board[VISIBLE_START_ROW + anchor.y]?.[anchor.x], definition.id).toBe(ANCHOR_CELL);
        expect(ready.puzzleTargetCells.some((target) => target.x === anchor.x && target.y === VISIBLE_START_ROW + anchor.y), definition.id)
          .toBe(false);
      }

      const firstEightyFour = generatedPieces(definition.seed, 84);
      for (let bag = 0; bag < 12; bag += 1) {
        expect(new Set(firstEightyFour.slice(bag * 7, bag * 7 + 7)), definition.id).toEqual(new Set(PIECE_TYPES));
      }
    }
  });

  it('rejects mutations that would reintroduce another board, full row, hidden stack, or unbound seed', () => {
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
    expect(() => validatePuzzleDefinition(invalid(first, { anchorCells: [{ x: 0, y: 19 }] }))).toThrow(/anchor/i);
    expect(() => validatePuzzleDefinition(invalid(first, { anchorCells: [{ x: 0, y: 2 }, { x: 0, y: 2 }] }))).toThrow(/duplicate/i);
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
