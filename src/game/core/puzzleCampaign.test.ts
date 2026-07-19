import { describe, expect, it } from 'vitest';
import referencesFile from '../../../docs/workstreams/tetris-t5-core/puzzle-references.json';
import { createInitialState, dispatch, dropDistance, replay, stateHash } from './engine';
import { PUZZLE_DEFINITIONS, PUZZLE_SOLVER_SLACK, getPuzzleDefinition } from './puzzles';
import { VISIBLE_START_ROW } from './constants';
import type { Cell, GameCommand, GameEvent, GameState, PieceType, PuzzleId, Rotation } from './types';

type Placement = {
  type: PieceType;
  rotation: Rotation;
  x: number;
  landingY: number;
  clearedLines: number;
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

type RouteReference = {
  id: string;
  placements: Placement[];
  metrics: RouteMetrics;
  evidence: RouteEvidence;
};

type LevelReference = {
  id: PuzzleId;
  name: string;
  seed: number;
  setup: { seed: number; placements: Array<Pick<Placement, 'type' | 'rotation' | 'x'>> };
  boardRows: string[];
  first84: PieceType[];
  routes: RouteReference[];
};

const fixture = referencesFile as unknown as {
  verifierLockGuard: number;
  levels: LevelReference[];
};
const references = fixture.levels;

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

function executeSetup(level: LevelReference) {
  let state = dispatch(createInitialState(level.setup.seed, 'marathon'), { type: 'start' }).state;
  for (const [index, placement] of level.setup.placements.entries()) {
    expect(state.active?.type, `${level.id}/setup type ${index}`).toBe(placement.type);
    for (const command of rotationCommands(placement.rotation)) state = dispatch(state, command).state;
    for (let guard = 0; state.active && state.active.x !== placement.x && guard < 16; guard += 1) {
      const beforeX: number = state.active.x;
      state = dispatch(state, { type: 'move', dx: placement.x < beforeX ? -1 : 1 }).state;
      expect(state.active?.x, `${level.id}/setup x ${index}`).not.toBe(beforeX);
    }
    const locked = dispatch(state, { type: 'hard-drop' });
    state = locked.state;
    expect(locked.events.some((event) => event.type === 'clear-started' || event.type === 'lines-cleared')).toBe(false);
    const lock = locked.events.find(
      (event): event is Extract<GameEvent, { type: 'piece-locked' }> => event.type === 'piece-locked',
    );
    expect(lock?.cells).toHaveLength(4);
    expect(lock?.cells.every(({ y }) => y >= VISIBLE_START_ROW)).toBe(true);
    for (let guard = 0; state.status === 'playing' && (!state.active || state.phase !== 'active') && guard < 64; guard += 1) {
      state = dispatch(state, { type: 'tick' }).state;
    }
  }
  expect(state.lines).toBe(0);
  expect(state.pieceCount).toBe(level.setup.placements.length);
  expect(state.board.slice(0, VISIBLE_START_ROW).flat().every((cell) => cell === null)).toBe(true);
  expect(state.board.slice(VISIBLE_START_ROW).map((row) => row.map((cell) => cell ?? '.').join(''))).toEqual(level.boardRows);
}

function execute(level: LevelReference, route: RouteReference) {
  let state = createInitialState(level.seed, 'puzzle', level.id);
  const initialHash = stateHash(state);
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
    expect(lockedPieces).toBeLessThan(fixture.verifierLockGuard);
    const placement = route.placements[placementIndex]!;
    expect(state.status, `${level.id}/${route.id} status ${placementIndex}`).toBe('playing');
    expect(state.phase, `${level.id}/${route.id} phase ${placementIndex}`).toBe('active');
    expect(state.active?.type, `${level.id}/${route.id} piece ${placementIndex}`).toBe(placement.type);

    for (const command of rotationCommands(placement.rotation)) apply(command);
    expect(state.active?.rotation, `${level.id}/${route.id} rotation ${placementIndex}`).toBe(placement.rotation);

    for (let guard = 0; state.active && state.active.x !== placement.x && guard < 16; guard += 1) {
      const beforeX = state.active.x;
      apply({ type: 'move', dx: placement.x < beforeX ? -1 : 1 });
      expect(state.active?.x, `${level.id}/${route.id} blocked x path ${placementIndex}`).not.toBe(beforeX);
    }
    expect(state.active?.x, `${level.id}/${route.id} x ${placementIndex}`).toBe(placement.x);
    expect((state.active?.y ?? 0) + dropDistance(state), `${level.id}/${route.id} landing ${placementIndex}`)
      .toBe(placement.landingY);

    const linesBefore = state.lines;
    landingXs.push(state.active!.x);
    const lockEvents = apply({ type: 'hard-drop' });
    const locked = lockEvents.find((event): event is Extract<GameEvent, { type: 'piece-locked' }> => event.type === 'piece-locked');
    expect(locked, `${level.id}/${route.id} lock event ${placementIndex}`).toBeDefined();
    lockedTypes.add(locked!.piece);
    placementCells.push(cellKey(locked!.cells));
    lockedPieces += 1;

    for (let guard = 0; state.status === 'playing' && (!state.active || state.phase !== 'active') && guard < 64; guard += 1) {
      apply({ type: 'tick' });
    }
    const lineDelta = state.lines - linesBefore;
    if (lineDelta === 0) nonClearingLocks += 1;
    expect(lineDelta, `${level.id}/${route.id} clear count ${placementIndex}`).toBe(placement.clearedLines);
    boardHashes.push(boardHash(state));
  }

  return {
    state,
    commands,
    initialHash,
    landingXs,
    lockedTypes,
    placementCells,
    boardHashes,
    effectiveRotations,
    lockedPieces,
    clearedLines,
    nonClearingLocks,
    clearPhases,
    firstTerminal,
    evidence: {
      initialHash,
      finalHash: stateHash(state),
      commandDigest: digest(commands),
      eventDigest: digest(eventLog),
      boardTraceDigest: digest(boardHashes),
      commandCount: commands.length,
    } satisfies RouteEvidence,
  };
}

describe('T12 original-target Puzzle campaign verifier', () => {
  it('retains the fifteen deterministic public-command routes and extends the safe-anchor campaign to twenty levels', () => {
    expect(PUZZLE_DEFINITIONS).toHaveLength(20);
    expect(references).toHaveLength(15);
    expect(references.flatMap((level) => level.routes)).toHaveLength(30);
    expect(PUZZLE_SOLVER_SLACK).toBe(10);
    expect(PUZZLE_DEFINITIONS.map((definition) => definition.difficulty)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
    for (const definition of PUZZLE_DEFINITIONS) {
      for (const anchor of definition.anchorCells) {
        expect(definition.boardRows[anchor.y - VISIBLE_START_ROW]).toBe('..........');
      }
    }
  });

  it('initializes the five generated extension levels with their deterministic source budgets', () => {
    const extension = PUZZLE_DEFINITIONS.filter((definition) => !references.some((level) => level.id === definition.id));
    expect(extension.map(({ id }) => id)).toEqual([
      't6r-veil-16', 't6r-cairn-17', 't6r-terrace-18', 't6r-bastion-19', 't6r-keystone-20',
    ]);
    expect(extension.map(({ solverPieceBudget }) => solverPieceBudget)).toEqual([40, 43, 43, 44, 52]);
    for (const definition of extension) {
      const ready = createInitialState(0x51a1f00d, 'puzzle', definition.id);
      expect(ready.seed).toBe(definition.seed);
      expect(ready.puzzlePieceBudget).toBe(definition.solverPieceBudget);
      expect(ready.puzzleInitialTargetCount).toBeGreaterThan(0);
      expect(ready.board.flat().filter((cell) => cell === 'A')).toHaveLength(definition.anchorCells.length);
      expect(definition.difficulty).toBeGreaterThanOrEqual(16);
    }
  });

  it.each(references)('$id keeps its authored setup and exposes a target budget', (level) => {
    const definition = getPuzzleDefinition(level.id);
    expect(definition.seed).toBe(level.seed);
    expect(definition.setup).toEqual(level.setup);
    expect(definition.boardRows).toEqual(level.boardRows);
    expect(level.routes).toHaveLength(2);
    executeSetup(level);
    const ready = createInitialState(level.seed, 'puzzle', level.id);
    expect(ready.status).toBe('ready');
    expect(ready.puzzleGoal).toBe('original-targets-cleared');
    expect(ready.puzzlePieceBudget).toBe(definition.solverPieceBudget);
    expect(ready.puzzleTargetCells).toHaveLength(ready.puzzleInitialTargetCount);
    expect(ready.puzzleInitialTargetCount).toBeGreaterThan(0);
    expect(ready.puzzlePieceBudget).toBeGreaterThan(PUZZLE_SOLVER_SLACK);
    expect(ready.board.flat().filter((cell) => cell === 'A')).toHaveLength(definition.anchorCells.length);
    const restarted = dispatch(ready, { type: 'restart' }).state;
    expect(stateHash(restarted)).toBe(stateHash(ready));
  });

  it('keeps the 70-lock verifier guard separate from the public budget authority', () => {
    expect(fixture.verifierLockGuard).toBe(70);
    expect(PUZZLE_DEFINITIONS.every((definition) => !('queue' in definition) && !('pieceBudget' in definition))).toBe(true);

    const first = createInitialState(references[0]!.seed, 'puzzle', references[0]!.id);
    expect(first.puzzlePieceBudget).toBe(getPuzzleDefinition(references[0]!.id).solverPieceBudget);
  });

  it('ends an unsolved Puzzle at its public budget', () => {
    let state = dispatch(createInitialState(references[0]!.seed, 'puzzle', references[0]!.id), { type: 'start' }).state;
    const events: GameEvent[] = [];
    state = { ...state, puzzlePieceBudget: 1 };
    while (state.status === 'playing') {
      const dropped = dispatch(state, { type: 'hard-drop' });
      state = dropped.state;
      events.push(...dropped.events);
      for (let guard = 0; state.status === 'playing' && (!state.active || state.phase !== 'active') && guard < 64; guard += 1) {
        const ticked = dispatch(state, { type: 'tick' });
        state = ticked.state;
        events.push(...ticked.events);
      }
    }

    expect(state.status).toBe('game-over');
    expect(state.puzzleCompletion).toBe('failed-budget');
    expect(events).toContainEqual({ type: 'game-over', reason: 'puzzle-budget' });
  });

  it('keeps Marathon and Race replay payloads isolated from Puzzle-only facts', () => {
    const marathonCommands: GameCommand[] = [{ type: 'start' }, { type: 'move', dx: -1 }, { type: 'hard-drop' }];
    const raceCommands: GameCommand[] = [{ type: 'start' }, { type: 'rotate', direction: 1 }, { type: 'hard-drop' }];
    for (const [mode, commands] of [['marathon', marathonCommands], ['race', raceCommands]] as const) {
      const first = replay(1234, commands, mode);
      const second = replay(1234, commands, mode);
      expect(stateHash(first)).toBe(stateHash(second));
      expect(first.puzzleGoal).toBeNull();
      expect(first.puzzleQueue).toBeNull();
      expect(first.puzzleCompletion).toBeNull();
    }
  });
});
