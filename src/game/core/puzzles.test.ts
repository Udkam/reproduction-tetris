import { describe, expect, it } from 'vitest';
import { VISIBLE_HEIGHT, VISIBLE_START_ROW } from './constants';
import { createInitialState, dispatch, stateHash } from './engine';
import {
  PUZZLE_DEFINITIONS,
  createPuzzleBoard,
  expectedPuzzleTargetRows,
  getPuzzleDefinition,
  originalTargetCells,
  replayPuzzleSetup,
  validatePuzzleDefinition,
  type PuzzleDefinition,
} from './puzzles';
import { puzzleLandings } from './puzzleRouteSearch';
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

function initialLandingSignatures(definition: PuzzleDefinition, includeAnchors: boolean): string[] {
  let state = dispatch(createInitialState(0x51a1f00d, 'puzzle', definition.id), { type: 'start' }).state;
  if (!includeAnchors) state = { ...state, board: createPuzzleBoard(definition, false) };
  return puzzleLandings(state).map(({ lock }) => lock.signature).sort();
}

describe('T13 legal endgame workshop definitions', () => {
  it('keeps twenty stable IDs but exposes the replay-calibrated workshop order', () => {
    expect(PUZZLE_DEFINITIONS.map(({ id }) => id)).toEqual([
      't3r-shaft-01', 't3r-shaft-02', 't3r-shaft-03', 't3r-cascade-05', 't3r-shaft-04',
      't3r-cascade-06', 't5r-delta-07', 't5r-lattice-09', 't5r-drift-08', 't5r-rift-10',
      't5r-pulse-14', 't5r-arc-13', 't5r-current-12', 't5r-prism-11', 't5r-horizon-15',
      't6r-cairn-17', 't6r-terrace-18', 't6r-keystone-20', 't6r-bastion-19', 't6r-veil-16',
    ] satisfies PuzzleId[]);
    expect(PUZZLE_DEFINITIONS.map(({ difficulty }) => difficulty)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(new Set(PUZZLE_DEFINITIONS.map(({ id }) => id)).size).toBe(20);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ name }) => name)).size).toBe(20);
    expect(PUZZLE_DEFINITIONS.map(({ name }) => name)).toEqual([
      '开槽', '回转', '错层', '双湾', '侧槽', '折角', '长槽', '搭桥', '交错', '双仓',
      '竖脊', '弧底', '双折', '盆地', '缺口', '双坡', '阶梯', '基石', '交口', '深槽',
    ]);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ seed }) => seed)).size).toBe(20);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ boardRows }) => boardRows.join('/'))).size).toBe(20);
    expect(PUZZLE_DEFINITIONS.filter((definition) => definition.anchorCells.length > 0).map(({ id }) => id)).toEqual([
      't3r-shaft-01', 't5r-lattice-09',
    ] satisfies PuzzleId[]);
  });

  it('derives every five-through-eight-row start from a legal zero-clear hard-drop history', () => {
    expect(PUZZLE_DEFINITIONS.map((definition) => expectedPuzzleTargetRows(definition.difficulty))).toEqual([
      5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8,
    ]);

    for (const definition of PUZZLE_DEFINITIONS) {
      expect(() => validatePuzzleDefinition(definition), definition.id).not.toThrow();
      expect(definition.boardRows).toHaveLength(VISIBLE_HEIGHT);
      expect(definition.hiddenCells).toEqual([]);
      expect(definition.setup.placements.length, definition.id).toBeGreaterThanOrEqual(8);
      expect(definition.setup.placements.length, definition.id).toBeLessThanOrEqual(14);
      expect(occupiedCount(definition), definition.id).toBe(definition.setup.placements.length * 4);
      expect(createPuzzleBoard(definition, false), definition.id).toEqual(replayPuzzleSetup(definition.setup));

      const occupiedRows = definition.boardRows
        .map((row, y) => row === '.'.repeat(10) ? null : y)
        .filter((y): y is number => y !== null);
      expect(occupiedRows, definition.id).toHaveLength(expectedPuzzleTargetRows(definition.difficulty));
      expect(occupiedRows, definition.id).toEqual(
        Array.from({ length: occupiedRows.length }, (_, index) => VISIBLE_HEIGHT - occupiedRows.length + index),
      );
      for (const row of definition.boardRows) {
        expect(row).toHaveLength(10);
        expect([...row].every((cell) => cell === '.' || PIECE_TYPES.includes(cell as PieceType))).toBe(true);
        if (row !== '..........') expect([...row]).toContain('.');
      }
      for (const anchor of definition.anchorCells) {
        const targetStart = VISIBLE_HEIGHT - expectedPuzzleTargetRows(definition.difficulty);
        expect(anchor.y, definition.id).toBeGreaterThanOrEqual(Math.max(0, targetStart - 2));
        expect(anchor.y, definition.id).toBeLessThan(targetStart);
        expect(definition.boardRows[anchor.y]?.[anchor.x], definition.id).toBe('.');
      }
    }
  });

  it('starts every selected level from the exact derived board and a stable seven-bag', () => {
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

  it('keeps every curated anchor in headroom and proves it changes a legal landing without covering a target', () => {
    for (const definition of PUZZLE_DEFINITIONS.filter((level) => level.anchorCells.length > 0)) {
      const anchoredLandings = initialLandingSignatures(definition, true);
      const anchorFreeLandings = initialLandingSignatures(definition, false);
      expect(anchoredLandings, definition.id).not.toEqual(anchorFreeLandings);
      for (const anchor of definition.anchorCells) {
        expect(definition.boardRows[anchor.y]?.[anchor.x], definition.id).toBe('.');
      }
    }
  });

  it('rejects mutated seeds, histories, rows, hidden cells, and invalid anchors', () => {
    const first = getPuzzleDefinition('t3r-shaft-01');
    expect(() => validatePuzzleDefinition(invalid(first, { seed: 0 }))).toThrow(/seed/i);
    expect(() => validatePuzzleDefinition(invalid(first, { seed: getPuzzleDefinition('t3r-shaft-02').seed }))).toThrow(/stable level seed/i);
    expect(() => validatePuzzleDefinition(invalid(first, { difficulty: 20 }))).toThrow(/difficulty/i);
    expect(() => validatePuzzleDefinition(invalid(first, { name: 'other' }))).toThrow(/name/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: first.boardRows.slice(1) }))).toThrow(/exactly/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      boardRows: [...first.boardRows.slice(0, 19), 'IIIIIIIIII'],
    }))).toThrow(/derived/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      setup: { ...first.setup, seed: first.setup.seed + 1 },
    }))).toThrow(/setup history/i);
    expect(() => validatePuzzleDefinition(invalid(first, { hiddenCells: [{ x: 0, y: 0, type: 'J' }] }))).toThrow(/hidden buffer/i);
    expect(() => validatePuzzleDefinition(invalid(first, { anchorCells: [{ x: 0, y: 19 }] }))).toThrow(/anchor/i);
    expect(() => validatePuzzleDefinition(invalid(first, { anchorCells: [{ x: 3, y: 14 }, { x: 3, y: 14 }] }))).toThrow(/duplicate/i);
  });

  it('restarts a level with the exact same derived board, target ownership, queue, and hash', () => {
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
