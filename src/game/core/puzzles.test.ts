import { describe, expect, it } from 'vitest';
import referencesFile from '../../../docs/workstreams/tetris-t5-core/puzzle-references.json';
import { createInitialState, dispatch, stateHash } from './engine';
import { PUZZLE_DEFINITIONS, PUZZLE_SOLVER_SLACK, getPuzzleDefinition, validatePuzzleDefinition, type PuzzleDefinition } from './puzzles';
import { VISIBLE_START_ROW } from './constants';
import { createRandomizer, drawPiece } from './random';
import { PIECE_SHAPES } from './pieces';
import { PIECE_TYPES, type PieceType, type PuzzleId } from './types';

type T5Level = {
  id: PuzzleId;
  name: string;
  seed: number;
  setup: PuzzleDefinition['setup'];
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

function occupancyRow(row: string): string {
  return [...row].map((cell) => cell === '.' ? '.' : '#').join('');
}

function topology(definition: PuzzleDefinition) {
  const nonEmptyRows = definition.boardRows.filter((row) => row !== '..........');
  const densities = nonEmptyRows.map((row) => [...row].filter((cell) => cell !== '.').length);
  const colors = new Set(definition.boardRows.flatMap((row) => [...row].filter((cell) => cell !== '.')));
  const top = definition.boardRows.findIndex((row) => row !== '..........');
  const coveredColumns = new Set<number>();
  let buriedHoles = 0;
  for (let x = 0; x < 10; x += 1) {
    for (let y = Math.max(0, top + 1); y < 19; y += 1) {
      if (definition.boardRows[y]![x] !== '.') continue;
      const hasFilledAbove = definition.boardRows.slice(top, y).some((row) => row[x] !== '.');
      const hasFilledBelow = definition.boardRows.slice(y + 1).some((row) => row[x] !== '.');
      if (hasFilledAbove) coveredColumns.add(x);
      if (hasFilledAbove && hasFilledBelow) buriedHoles += 1;
    }
  }
  return {
    nonEmptyRows,
    occupancyShapes: new Set(nonEmptyRows.map(occupancyRow)).size,
    densityClasses: new Set(densities).size,
    coveredColumns: coveredColumns.size,
    buriedHoles,
    colors,
  };
}

function normalizedCells(cells: readonly { x: number; y: number }[]): string {
  const minimumX = Math.min(...cells.map(({ x }) => x));
  const minimumY = Math.min(...cells.map(({ y }) => y));
  return cells.map(({ x, y }) => `${x - minimumX},${y - minimumY}`).sort().join('|');
}

function sameTypeComponents(definition: PuzzleDefinition) {
  const seen = new Set<string>();
  const components: Array<{ type: PieceType; cells: Array<{ x: number; y: number }> }> = [];
  for (let y = 0; y < definition.boardRows.length; y += 1) for (let x = 0; x < 10; x += 1) {
    const type = definition.boardRows[y]![x] as PieceType | '.';
    const start = `${x},${y}`;
    if (type === '.' || seen.has(start)) continue;
    const cells: Array<{ x: number; y: number }> = [];
    const pending = [{ x, y }];
    seen.add(start);
    while (pending.length > 0) {
      const cell = pending.pop()!;
      cells.push(cell);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const next = { x: cell.x + dx, y: cell.y + dy };
        const key = `${next.x},${next.y}`;
        if (!seen.has(key) && definition.boardRows[next.y]?.[next.x] === type) {
          seen.add(key);
          pending.push(next);
        }
      }
    }
    components.push({ type, cells });
  }
  return components;
}

describe('T12 progressive Puzzle definitions', () => {
  it('preserves the fifteen-level fixture, adds five generated endgames, and enforces normalized authored topology', () => {
    expect(PUZZLE_DEFINITIONS).toHaveLength(20);
    expect(t5Levels).toHaveLength(15);
    const legacyDefinitions = PUZZLE_DEFINITIONS.filter((definition) => t5Levels.some((level) => level.id === definition.id));
    expect(legacyDefinitions.map(({ id, name, seed, setup, boardRows }) => ({ id, name, seed, setup, boardRows })))
      .toEqual(t5Levels.map(({ id, name, seed, setup, boardRows }) => ({ id, name, seed, setup, boardRows })));
    expect(new Set(PUZZLE_DEFINITIONS.map(({ id }) => id)).size).toBe(20);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ seed }) => seed)).size).toBe(20);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ setup }) => setup.seed)).size).toBe(20);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ name }) => name)).size).toBe(20);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ boardRows }) => boardRows.map(occupancyRow).join('/'))).size).toBe(20);
    expect(PUZZLE_DEFINITIONS.map(({ difficulty }) => difficulty)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(PUZZLE_DEFINITIONS.slice(0, 6).map(({ id, seed }) => [id, seed])).toEqual([
      ['t3r-shaft-01', 0x75c0b101],
      ['t3r-shaft-02', 0x75c0b202],
      ['t3r-shaft-03', 0x75c0b303],
      ['t3r-shaft-04', 0x75c0b404],
      ['t3r-cascade-05', 0x75c0b505],
      ['t3r-cascade-06', 0x75c0b606],
    ]);
    const campaignColors = new Set<string>();
    for (const definition of PUZZLE_DEFINITIONS) {
      expect(() => validatePuzzleDefinition(definition)).not.toThrow();
      expect(definition.difficulty).toBeGreaterThanOrEqual(1);
      expect(definition.difficulty).toBeLessThanOrEqual(20);
      expect('queue' in definition).toBe(false);
      expect('pieceBudget' in definition).toBe(false);
      if (definition.anchorCells.length > 0) {
        expect(definition.anchorCells.length).toBeGreaterThanOrEqual(1);
        expect(definition.anchorCells.length).toBeLessThanOrEqual(2);
        for (const anchor of definition.anchorCells) {
          const visibleY = anchor.y - VISIBLE_START_ROW;
          expect(definition.boardRows[visibleY]?.[anchor.x]).toBe('.');
          expect(definition.boardRows[visibleY]).toBe('..........');
        }
      }
      const metrics = topology(definition);
      expect(definition.setup.placements.length).toBeGreaterThanOrEqual(16);
      expect(definition.setup.placements.length).toBeLessThanOrEqual(22);
      expect(new Set(definition.setup.placements.map(({ type }) => type))).toEqual(new Set(PIECE_TYPES));
      expect(metrics.nonEmptyRows.length).toBeGreaterThanOrEqual(8);
      expect(metrics.nonEmptyRows.length).toBeLessThanOrEqual(12);
      expect(metrics.occupancyShapes).toBeGreaterThanOrEqual(7);
      expect(metrics.densityClasses).toBeGreaterThanOrEqual(4);
      expect(metrics.coveredColumns).toBeGreaterThanOrEqual(5);
      expect(metrics.buriedHoles).toBeGreaterThanOrEqual(8);
      expect(metrics.colors).toEqual(new Set(PIECE_TYPES));
      const components = sameTypeComponents(definition);
      expect(components).toHaveLength(definition.setup.placements.length);
      for (const component of components) {
        expect(component.cells).toHaveLength(4);
        expect(Object.values(PIECE_SHAPES[component.type])
          .some((shape) => normalizedCells(shape) === normalizedCells(component.cells))).toBe(true);
      }
      for (const color of metrics.colors) campaignColors.add(color);
    }
    expect(campaignColors).toEqual(new Set(PIECE_TYPES));
    expect(PUZZLE_SOLVER_SLACK).toBe(10);
    expect(PUZZLE_DEFINITIONS.filter((definition) => definition.anchorCells.length > 0).length).toBeGreaterThanOrEqual(8);
    expect(PUZZLE_DEFINITIONS.filter((definition) => definition.anchorCells.length === 2).map(({ id }) => id)).toEqual(
      expect.arrayContaining(['t5r-delta-07', 't5r-arc-13', 't6r-keystone-20']),
    );
    for (let left = 0; left < PUZZLE_DEFINITIONS.length; left += 1) {
      for (let right = left + 1; right < PUZZLE_DEFINITIONS.length; right += 1) {
        const first = PUZZLE_DEFINITIONS[left]!.boardRows.join('');
        const second = PUZZLE_DEFINITIONS[right]!.boardRows.join('');
        const hamming = [...first].filter((cell, index) => (cell === '.') !== (second[index] === '.')).length;
        expect(hamming, `${PUZZLE_DEFINITIONS[left]!.id}/${PUZZLE_DEFINITIONS[right]!.id}`).toBeGreaterThanOrEqual(20);
      }
    }
  });

  it('proves twelve consecutive complete seven-bags per stable level seed', () => {
    for (const level of PUZZLE_DEFINITIONS) {
      const generated = generatedPieces(level.seed, 91);
      const first84 = generated.slice(0, 84);
      const legacy = t5Levels.find((candidate) => candidate.id === level.id);
      if (legacy) expect(first84).toEqual(legacy.first84);
      for (let bagIndex = 0; bagIndex < 12; bagIndex += 1) {
        const bag = first84.slice(bagIndex * 7, bagIndex * 7 + 7);
        expect(new Set(bag)).toEqual(new Set(PIECE_TYPES));
      }
      expect(new Set(generated.slice(84))).toEqual(new Set(PIECE_TYPES));
    }
  });

  it('fails closed when the frozen setup or its derived board is altered', () => {
    const first = getPuzzleDefinition('t3r-shaft-01');
    expect(() => validatePuzzleDefinition(invalid(first, { seed: 0 }))).toThrow(/seed/i);
    expect(() => validatePuzzleDefinition(invalid(first, { seed: getPuzzleDefinition('t3r-shaft-02').seed }))).toThrow(/stable level seed/i);
    expect(() => validatePuzzleDefinition(invalid(first, { difficulty: 20 }))).toThrow(/difficulty/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: first.boardRows.slice(1) }))).toThrow(/exactly/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: [...first.boardRows.slice(0, 19), '.........'] }))).toThrow(/byte-match/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: [...first.boardRows.slice(0, 19), 'QJJJ.JJJJ.'] }))).toThrow(/byte-match/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: Array.from({ length: 20 }, () => '..........') }))).toThrow(/byte-match/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      setup: { ...first.setup, seed: 0 },
    }))).toThrow(/setup history/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      setup: { ...first.setup, placements: first.setup.placements.slice(0, 15) },
    }))).toThrow(/16-22/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      setup: {
        ...first.setup,
        placements: [{ ...first.setup.placements[0]!, type: first.setup.placements[0]!.type === 'I' ? 'O' : 'I' }, ...first.setup.placements.slice(1)],
      },
    }))).toThrow(/frozen legal setup/i);
    expect(() => validatePuzzleDefinition(invalid(first, { hiddenCells: [{ x: 0, y: 0, type: 'J' }] }))).toThrow(/hidden buffer/i);
    const anchored = getPuzzleDefinition('t5r-arc-13');
    expect(() => validatePuzzleDefinition(invalid(anchored, { anchorCells: [] }))).toThrow(/deterministic anchor/i);
    expect(() => validatePuzzleDefinition(invalid(anchored, { anchorCells: [{ x: 0, y: 8 }, { x: 1, y: 8 }] }))).toThrow(/deterministic anchor/i);
  });
});
describe('T5 Puzzle deterministic initialization', () => {
  it('uses every gameplay seed without consuming it during separate setup reconstruction', () => {
    for (const definition of PUZZLE_DEFINITIONS) {
      const ready = createInitialState(7, 'puzzle', definition.id);
      const expected = generatedPieces(definition.seed, 6);

      expect(ready.status).toBe('ready');
      expect(ready.seed).toBe(definition.seed);
      expect(ready.active?.type).toBe(expected[0]);
      expect(ready.queue).toEqual(expected.slice(1));
      expect(ready.puzzleQueue).toEqual(ready.queue);
      expect(ready.puzzleQueueIndex).toBe(0);
      expect(ready.puzzlePieceBudget).toBe(definition.solverPieceBudget);
      expect(ready.puzzleGoal).toBe('original-targets-cleared');
      expect(ready.puzzleInitialTargetCount).toBeGreaterThan(0);
      expect(ready.puzzleTargetCells).toHaveLength(ready.puzzleInitialTargetCount);
      expect(ready.puzzleCompletion).toBe('active');
      expect(ready.puzzleTargetLines).toBeNull();

      const playing = dispatch(ready, { type: 'start' }).state;
      expect(playing.active).toEqual(ready.active);
      expect(playing.queue).toEqual(ready.queue);
    }
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
