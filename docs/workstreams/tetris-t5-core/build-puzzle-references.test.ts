import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInitialState, dispatch, dropDistance, stateHash } from '../../../src/game/core/engine';
import { PUZZLE_DEFINITIONS } from '../../../src/game/core/puzzles';
import { VISIBLE_START_ROW } from '../../../src/game/core/constants';
import { PIECE_SHAPES } from '../../../src/game/core/pieces';
import { createRandomizer, drawPiece } from '../../../src/game/core/random';
import type {
  Cell,
  GameCommand,
  GameEvent,
  GameState,
  PieceType,
  PuzzleId,
  Rotation,
} from '../../../src/game/core/types';
import { PIECE_TYPES } from '../../../src/game/core/types';

type Placement = {
  type: PieceType;
  rotation: Rotation;
  x: number;
  landingY: number;
  clearedLines: number;
};

type SourceRoute = {
  id: string;
  placements: Placement[];
};

type SetupPlacement = Pick<Placement, 'type' | 'rotation' | 'x'>;

type SetupSource = {
  seed: number;
  placements: SetupPlacement[];
};

type SourceLevel = {
  id: PuzzleId;
  seed: number;
  authoringCandidate: number;
  setup: SetupSource;
  routes: SourceRoute[];
};

type SearchResultFile = {
  result: null | {
    seed: number;
    candidateIndex: number;
    boardRows: string[];
    setup: SetupSource;
    routes: Array<{ placements: Placement[] }>;
  };
};

type RouteMetrics = {
  lockedPieces: number;
  pieceTypes: number;
  effectiveRotations: number;
  distinctLandingXs: number;
  nonClearingLocks: number;
  clearPhases: number;
  clearedLines: number;
  semanticDifferences: number;
  boardHashDiverged: boolean;
  boardHashDivergences: number;
  firstDivergenceLock: number | null;
};

type RouteEvidence = {
  initialHash: string;
  finalHash: string;
  commandDigest: string;
  eventDigest: string;
  boardTraceDigest: string;
  commandCount: number;
};

function authoringSourceLevels(): SourceLevel[] {
  const paths = process.env.PUZZLE_AUTHORING_RESULTS?.split(';').filter(Boolean) ?? [];
  return paths.map((path) => {
    const search = JSON.parse(readFileSync(path, { encoding: 'utf8' })) as SearchResultFile;
    expect(search.result, `missing successful result in ${path}`).not.toBeNull();
    const definition = PUZZLE_DEFINITIONS.find((candidate) => candidate.seed === search.result!.seed);
    expect(definition, `no production definition for seed ${search.result!.seed}`).toBeDefined();
    expect(search.result!.routes).toHaveLength(2);
    return {
      id: definition!.id,
      seed: search.result!.seed,
      authoringCandidate: search.result!.candidateIndex,
      setup: {
        seed: search.result!.setup.seed,
        placements: search.result!.setup.placements,
      },
      routes: search.result!.routes.map((route, index) => ({
        id: `route-${index + 1}`,
        placements: route.placements,
      })),
    };
  });
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

function occupied(state: GameState): number {
  return state.board.flat().filter((cell) => cell !== null).length;
}

function boardHash(state: GameState): string {
  return digest(state.board);
}

function cellKey(cells: readonly Cell[]): string {
  return cells.map(({ x, y }) => `${x},${y}`).sort().join('|');
}

function rotationCommands(rotation: Rotation): GameCommand[] {
  if (rotation === 1) return [{ type: 'rotate', direction: 1 }];
  if (rotation === 2) return [{ type: 'rotate', direction: 1 }, { type: 'rotate', direction: 1 }];
  if (rotation === 3) return [{ type: 'rotate', direction: -1 }];
  return [];
}

function normalizedCells(cells: readonly Cell[]): string {
  const minimumX = Math.min(...cells.map(({ x }) => x));
  const minimumY = Math.min(...cells.map(({ y }) => y));
  return cells.map(({ x, y }) => `${x - minimumX},${y - minimumY}`).sort().join('|');
}

function executeSetup(setup: SetupSource, expectedRows: readonly string[]) {
  expect(setup.placements.length).toBeGreaterThanOrEqual(16);
  expect(setup.placements.length).toBeLessThanOrEqual(22);
  let state = dispatch(createInitialState(setup.seed, 'marathon'), { type: 'start' }).state;
  const owners: Array<{ type: PieceType; cells: Cell[] }> = [];
  for (const [placementIndex, placement] of setup.placements.entries()) {
    expect(state.status, `setup status ${placementIndex}`).toBe('playing');
    expect(state.phase, `setup phase ${placementIndex}`).toBe('active');
    expect(state.active?.type, `setup type ${placementIndex}`).toBe(placement.type);
    for (const command of rotationCommands(placement.rotation)) state = dispatch(state, command).state;
    expect(state.active?.rotation, `setup rotation ${placementIndex}`).toBe(placement.rotation);
    for (let guard = 0; state.active && state.active.x !== placement.x && guard < 16; guard += 1) {
      const beforeX: number = state.active.x;
      state = dispatch(state, { type: 'move', dx: placement.x < beforeX ? -1 : 1 }).state;
      expect(state.active?.x, `setup blocked x ${placementIndex}`).not.toBe(beforeX);
    }
    expect(state.active?.x, `setup x ${placementIndex}`).toBe(placement.x);
    const locked = dispatch(state, { type: 'hard-drop' });
    state = locked.state;
    expect(locked.events.some((event) => event.type === 'clear-started' || event.type === 'lines-cleared')).toBe(false);
    const lock = locked.events.find(
      (event): event is Extract<GameEvent, { type: 'piece-locked' }> => event.type === 'piece-locked',
    );
    expect(lock, `setup lock ${placementIndex}`).toBeDefined();
    expect(lock!.cells).toHaveLength(4);
    expect(lock!.cells.every(({ y }) => y >= VISIBLE_START_ROW)).toBe(true);
    expect(normalizedCells(lock!.cells)).toBe(normalizedCells(PIECE_SHAPES[placement.type][placement.rotation]));
    for (const owner of owners.filter(({ type }) => type === placement.type)) {
      const oldCells = new Set(owner.cells.map(({ x, y }) => `${x},${y}`));
      expect(lock!.cells.some(({ x, y }) => (
        oldCells.has(`${x - 1},${y}`) || oldCells.has(`${x + 1},${y}`)
          || oldCells.has(`${x},${y - 1}`) || oldCells.has(`${x},${y + 1}`)
      ))).toBe(false);
    }
    owners.push({ type: placement.type, cells: lock!.cells });
    for (let guard = 0; state.status === 'playing' && (!state.active || state.phase !== 'active') && guard < 64; guard += 1) {
      state = dispatch(state, { type: 'tick' }).state;
    }
  }
  expect(state.lines).toBe(0);
  expect(state.status).toBe('playing');
  expect(new Set(owners.map(({ type }) => type))).toEqual(new Set(PIECE_TYPES));
  expect(state.board.slice(0, VISIBLE_START_ROW).flat().every((cell) => cell === null)).toBe(true);
  const boardRows = state.board.slice(VISIBLE_START_ROW).map((row) => row.map((cell) => cell ?? '.').join(''));
  expect(boardRows).toEqual(expectedRows);
  return boardRows;
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

function execute(levelId: PuzzleId, seed: number, route: SourceRoute) {
  let state = createInitialState(seed, 'puzzle', levelId);
  const initialHash = stateHash(state);
  const initialOccupied = occupied(state);
  const commands: GameCommand[] = [];
  const eventLog: Array<{ command: GameCommand; events: GameEvent[] }> = [];
  const landingXs: number[] = [];
  const lockedTypes = new Set<PieceType>();
  const placementCells: string[] = [];
  const boardHashes: string[] = [];
  let effectiveRotations = 0;
  let lockedPieces = 0;
  let clearedLines = 0;
  let nonClearingLocks = 0;
  let clearPhases = 0;
  let firstTerminal = -1;

  const apply = (command: GameCommand): GameEvent[] => {
    const transition = dispatch(state, command);
    state = transition.state;
    commands.push(command);
    eventLog.push({ command, events: transition.events });
    effectiveRotations += transition.events.filter((event) => event.type === 'piece-rotated').length;
    clearPhases += transition.events.filter((event) => event.type === 'clear-started').length;
    clearedLines += transition.events
      .filter((event): event is Extract<GameEvent, { type: 'lines-cleared' }> => event.type === 'lines-cleared')
      .reduce((sum, event) => sum + event.count, 0);
    if (firstTerminal === -1 && (state.status === 'finished' || state.status === 'game-over')) {
      firstTerminal = commands.length - 1;
    }
    return transition.events;
  };

  apply({ type: 'start' });
  for (let placementIndex = 0; placementIndex < route.placements.length; placementIndex += 1) {
    const placement = route.placements[placementIndex]!;
    expect(lockedPieces, `${levelId}/${route.id} verifier guard`).toBeLessThan(70);
    expect(state.status, `${levelId}/${route.id} status ${placementIndex}`).toBe('playing');
    expect(state.phase, `${levelId}/${route.id} phase ${placementIndex}`).toBe('active');
    expect(state.active?.type, `${levelId}/${route.id} type ${placementIndex}`).toBe(placement.type);

    for (const command of rotationCommands(placement.rotation)) apply(command);
    expect(state.active?.rotation, `${levelId}/${route.id} rotation ${placementIndex}`).toBe(placement.rotation);

    for (let guard = 0; state.active && state.active.x !== placement.x && guard < 16; guard += 1) {
      const beforeX: number = state.active.x;
      apply({ type: 'move', dx: placement.x < beforeX ? -1 : 1 });
      expect(state.active?.x, `${levelId}/${route.id} blocked x ${placementIndex}`).not.toBe(beforeX);
    }
    expect(state.active?.x, `${levelId}/${route.id} x ${placementIndex}`).toBe(placement.x);
    expect((state.active?.y ?? 0) + dropDistance(state), `${levelId}/${route.id} y ${placementIndex}`)
      .toBe(placement.landingY);

    const linesBefore = state.lines;
    landingXs.push(state.active!.x);
    const lockEvents = apply({ type: 'hard-drop' });
    const locked = lockEvents.find(
      (event): event is Extract<GameEvent, { type: 'piece-locked' }> => event.type === 'piece-locked',
    );
    expect(locked, `${levelId}/${route.id} lock ${placementIndex}`).toBeDefined();
    lockedTypes.add(locked!.piece);
    placementCells.push(cellKey(locked!.cells));
    lockedPieces += 1;

    for (let guard = 0; state.status === 'playing' && (!state.active || state.phase !== 'active') && guard < 64; guard += 1) {
      apply({ type: 'tick' });
    }
    const lineDelta = state.lines - linesBefore;
    if (lineDelta === 0) nonClearingLocks += 1;
    expect(lineDelta, `${levelId}/${route.id} clears ${placementIndex}`).toBe(placement.clearedLines);
    boardHashes.push(boardHash(state));
  }

  const metrics: RouteMetrics = {
    lockedPieces,
    pieceTypes: lockedTypes.size,
    effectiveRotations,
    distinctLandingXs: new Set(landingXs).size,
    nonClearingLocks,
    clearPhases,
    clearedLines,
    semanticDifferences: 0,
    boardHashDiverged: false,
    boardHashDivergences: 0,
    firstDivergenceLock: null,
  };
  const evidence: RouteEvidence = {
    initialHash,
    finalHash: stateHash(state),
    commandDigest: digest(commands),
    eventDigest: digest(eventLog),
    boardTraceDigest: digest(boardHashes),
    commandCount: commands.length,
  };

  expect(state.status, `${levelId}/${route.id} terminal`).toBe('finished');
  expect(state.puzzleCompletion).toBe('finished');
  expect(occupied(state)).toBe(0);
  expect(lockedPieces).toBeGreaterThanOrEqual(30);
  expect(lockedPieces).toBeLessThanOrEqual(42);
  expect(lockedTypes.size).toBe(7);
  expect(effectiveRotations).toBeGreaterThanOrEqual(8);
  expect(new Set(landingXs).size).toBeGreaterThanOrEqual(7);
  expect(nonClearingLocks).toBeGreaterThanOrEqual(5);
  expect(clearPhases).toBeGreaterThanOrEqual(4);
  expect(initialOccupied + lockedPieces * 4).toBe(clearedLines * 10);
  expect(firstTerminal).toBe(commands.length - 1);
  expect(stateHash(dispatch(state, { type: 'restart' }).state)).toBe(initialHash);

  return { metrics, evidence, placementCells, boardHashes };
}

const referenceBuilderEnabled = process.env.WRITE_PUZZLE_REFERENCES === '1'
  || process.env.VERIFY_PUZZLE_AUTHORING === '1';
const setupVerifierEnabled = process.env.VERIFY_PUZZLE_SETUP === '1';

describe.skipIf(!setupVerifierEnabled)('T5 authored endgame setup verifier', () => {
  it('replays every supplied setup through public Marathon dispatch with zero clears', () => {
    const paths = process.env.PUZZLE_AUTHORING_RESULTS?.split(';').filter(Boolean) ?? [];
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      const search = JSON.parse(readFileSync(path, { encoding: 'utf8' })) as SearchResultFile;
      expect(search.result, `missing successful result in ${path}`).not.toBeNull();
      executeSetup(search.result!.setup, search.result!.boardRows);
    }
  });
});

describe.skipIf(!referenceBuilderEnabled)('T5 Puzzle reference builder', () => {
  it('regenerates every reference only after all production public-dispatch proofs pass', { timeout: 120_000 }, () => {
    const combinedSourceLevels = authoringSourceLevels();
    expect(combinedSourceLevels).toHaveLength(PUZZLE_DEFINITIONS.length);
    expect(new Set(combinedSourceLevels.map(({ id }) => id)).size).toBe(PUZZLE_DEFINITIONS.length);
    if (process.env.WRITE_PUZZLE_REFERENCES === '1') expect(PUZZLE_DEFINITIONS).toHaveLength(15);

    const levels = PUZZLE_DEFINITIONS.map((definition) => {
      const source = combinedSourceLevels.find((candidate) => candidate.id === definition.id);
      expect(source, `missing authoring source for ${definition.id}`).toBeDefined();
      expect(source!.seed).toBe(definition.seed);
      expect(source!.setup).toEqual(definition.setup);
      executeSetup(source!.setup, definition.boardRows);
      expect(source!.routes).toHaveLength(2);
      const runs = source!.routes.map((route) => execute(definition.id, definition.seed, route));

      let semanticDifferences = 0;
      let boardHashDivergences = 0;
      let firstDivergenceLock: number | null = null;
      for (let index = 0; index < Math.min(runs[0]!.placementCells.length, runs[1]!.placementCells.length); index += 1) {
        const left = source!.routes[0]!.placements[index]!;
        const right = source!.routes[1]!.placements[index]!;
        if (runs[0]!.placementCells[index] !== runs[1]!.placementCells[index]
          || left.x !== right.x
          || left.rotation !== right.rotation) {
          semanticDifferences += 1;
          firstDivergenceLock ??= index + 1;
        }
        if (runs[0]!.boardHashes[index] !== runs[1]!.boardHashes[index]) boardHashDivergences += 1;
      }
      const boardHashDiverged = boardHashDivergences > 0;
      expect(semanticDifferences).toBeGreaterThanOrEqual(5);
      expect(firstDivergenceLock).not.toBeNull();
      expect(firstDivergenceLock!).toBeLessThanOrEqual(5);
      expect(boardHashDivergences).toBeGreaterThanOrEqual(2);
      runs[1]!.metrics.semanticDifferences = semanticDifferences;
      runs[1]!.metrics.boardHashDiverged = boardHashDiverged;
      runs[1]!.metrics.boardHashDivergences = boardHashDivergences;
      runs[1]!.metrics.firstDivergenceLock = firstDivergenceLock;

      return {
        id: definition.id,
        name: definition.name,
        seed: definition.seed,
        authoringCandidate: source!.authoringCandidate,
        setup: source!.setup,
        boardRows: definition.boardRows,
        first84: generatedPieces(definition.seed, 84),
        routes: source!.routes.map((route, index) => ({
          id: route.id,
          placements: route.placements,
          metrics: runs[index]!.metrics,
          evidence: runs[index]!.evidence,
        })),
      };
    });

    const output = {
      taskId: 'TETRIS-T5-PUZZLE-AUTHORED-ENDGAMES-009',
      contract: 'Fifteen legal zero-clear authored setup histories with source-piece colors and two strengthened public-dispatch routes each.',
      verifierLockGuard: 70,
      levels,
    };
    if (process.env.WRITE_PUZZLE_REFERENCES !== '1') return;
    const temporaryDirectory = resolve(process.cwd(), '.vite');
    const temporaryPath = resolve(temporaryDirectory, `puzzle-references-${process.pid}.tmp`);
    const referencePath = resolve(process.cwd(), 'docs/workstreams/tetris-t5-core/puzzle-references.json');
    mkdirSync(temporaryDirectory, { recursive: true });
    writeFileSync(temporaryPath, `${JSON.stringify(output, null, 2)}\n`, { encoding: 'utf8' });
    renameSync(temporaryPath, referencePath);
  });
});
