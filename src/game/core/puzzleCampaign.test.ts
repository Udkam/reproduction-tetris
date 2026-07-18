import { describe, expect, it } from 'vitest';
import referencesFile from '../../../docs/workstreams/tetris-t5-core/puzzle-references.json';
import { createInitialState, dispatch, dropDistance, replay, stateHash } from './engine';
import { PUZZLE_DEFINITIONS, getPuzzleDefinition } from './puzzles';
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
const references = fixture.levels.filter((level) => getPuzzleDefinition(level.id).variant === 'legacy');

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
    initialOccupied,
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

describe('T5 normal-play Puzzle campaign verifier', () => {
  it('retains twelve legacy definitions and twenty-four frozen public-dispatch routes alongside three anchor trials', () => {
    expect(PUZZLE_DEFINITIONS).toHaveLength(15);
    expect(references).toHaveLength(12);
    expect(references.flatMap((level) => level.routes)).toHaveLength(24);
    expect(PUZZLE_DEFINITIONS.filter((definition) => definition.variant === 'anchor-trial')).toHaveLength(3);
  });

  it.each(references)('$id has two successful same-seed public-dispatch routes', (level) => {
    const definition = getPuzzleDefinition(level.id);
    expect(definition.seed).toBe(level.seed);
    expect(definition.setup).toEqual(level.setup);
    expect(definition.boardRows).toEqual(level.boardRows);
    expect(level.routes).toHaveLength(2);
    executeSetup(level);

    const runs = level.routes.map((route) => execute(level, route));
    for (let routeIndex = 0; routeIndex < runs.length; routeIndex += 1) {
      const run = runs[routeIndex]!;
      const route = level.routes[routeIndex]!;
      const metrics = route.metrics;

      expect(run.state.status).toBe('finished');
      expect(run.state.puzzleCompletion).toBe('finished');
      expect(run.state.completedLevelId).toBe(level.id);
      expect(run.state.active).toBeNull();
      expect(run.state.pendingClearRows).toEqual([]);
      expect(run.state.puzzlePieceBudget).toBeNull();
      expect(run.state.puzzleQueueIndex).toBe(0);
      expect(run.state.queue).toHaveLength(5);
      expect(run.state.pieceCount).toBe(metrics.lockedPieces);
      expect(run.lockedPieces).toBe(metrics.lockedPieces);
      expect(run.lockedTypes.size).toBe(metrics.pieceTypes);
      expect(run.effectiveRotations).toBe(metrics.effectiveRotations);
      expect(new Set(run.landingXs).size).toBe(metrics.distinctLandingXs);
      expect(run.nonClearingLocks).toBe(metrics.nonClearingLocks);
      expect(run.clearPhases).toBe(metrics.clearPhases);
      expect(run.clearedLines).toBe(metrics.clearedLines);
      expect(run.lockedPieces).toBeGreaterThanOrEqual(30);
      expect(run.lockedPieces).toBeLessThanOrEqual(42);
      expect(run.lockedTypes.size).toBe(7);
      expect(run.effectiveRotations).toBeGreaterThanOrEqual(8);
      expect(new Set(run.landingXs).size).toBeGreaterThanOrEqual(7);
      expect(run.nonClearingLocks).toBeGreaterThanOrEqual(5);
      expect(run.clearPhases).toBeGreaterThanOrEqual(4);
      expect(occupied(run.state)).toBe(0);
      expect(run.initialOccupied + run.lockedPieces * 4).toBe(run.clearedLines * 10);
      expect(run.firstTerminal).toBe(run.commands.length - 1);
      expect(run.commands.flatMap((command) => command.type === 'hard-drop' ? [command] : [])).toHaveLength(run.lockedPieces);
      expect(run.evidence).toEqual(route.evidence);

      const terminalHash = stateHash(run.state);
      const tail = dispatch(run.state, { type: 'hard-drop' });
      expect(tail.events).toEqual([]);
      expect(stateHash(tail.state)).toBe(terminalHash);

      const restarted = dispatch(run.state, { type: 'restart' }).state;
      expect(stateHash(restarted)).toBe(run.initialHash);
      expect(restarted.active).not.toBeNull();
      expect(restarted.puzzleQueueIndex).toBe(0);
    }

    expect(runs[0]!.initialHash).toBe(runs[1]!.initialHash);
    let semanticDifferences = 0;
    let boardHashDivergences = 0;
    let firstDivergenceLock: number | null = null;
    for (let index = 0; index < Math.min(runs[0]!.placementCells.length, runs[1]!.placementCells.length); index += 1) {
      const left = level.routes[0]!.placements[index]!;
      const right = level.routes[1]!.placements[index]!;
      if (runs[0]!.placementCells[index] !== runs[1]!.placementCells[index]
        || left.x !== right.x
        || left.rotation !== right.rotation) {
        semanticDifferences += 1;
        firstDivergenceLock ??= index + 1;
      }
      if (runs[0]!.boardHashes[index] !== runs[1]!.boardHashes[index]) boardHashDivergences += 1;
    }
    expect(semanticDifferences).toBe(level.routes[1]!.metrics.semanticDifferences);
    expect(semanticDifferences).toBeGreaterThanOrEqual(5);
    expect(firstDivergenceLock).toBe(level.routes[1]!.metrics.firstDivergenceLock);
    expect(firstDivergenceLock!).toBeLessThanOrEqual(5);
    expect(boardHashDivergences).toBe(level.routes[1]!.metrics.boardHashDivergences);
    expect(boardHashDivergences).toBeGreaterThanOrEqual(2);
    expect(level.routes[1]!.metrics.boardHashDiverged).toBe(boardHashDivergences > 0);
  });

  it('keeps the 70-lock value verifier-only and never restores budget authority', () => {
    expect(fixture.verifierLockGuard).toBe(70);
    expect(PUZZLE_DEFINITIONS.every((definition) => !('queue' in definition) && !('pieceBudget' in definition))).toBe(true);

    const first = execute(references[0]!, references[0]!.routes[0]!);
    expect(first.state.pieceCount).toBeGreaterThan(16);
    expect(first.commands.some((command) => command.type === 'hard-drop')).toBe(true);
    expect(first.state.puzzleCompletion).not.toBe('failed-budget');
  });

  it('uses ordinary public-command top-out as the only unsolved gameplay failure', () => {
    let state = dispatch(createInitialState(references[0]!.seed, 'puzzle', references[0]!.id), { type: 'start' }).state;
    const events: GameEvent[] = [];
    let locks = 0;
    while (state.status === 'playing' && locks < fixture.verifierLockGuard) {
      const dropped = dispatch(state, { type: 'hard-drop' });
      state = dropped.state;
      events.push(...dropped.events);
      locks += dropped.events.filter((event) => event.type === 'piece-locked').length;
      for (let guard = 0; state.status === 'playing' && (!state.active || state.phase !== 'active') && guard < 64; guard += 1) {
        const ticked = dispatch(state, { type: 'tick' });
        state = ticked.state;
        events.push(...ticked.events);
      }
    }

    expect(locks).toBeLessThan(fixture.verifierLockGuard);
    expect(state.status).toBe('game-over');
    expect(state.puzzleCompletion).toBe('failed-top-out');
    expect(events.some((event) => event.type === 'game-over' && (event.reason === 'block-out' || event.reason === 'lock-out'))).toBe(true);
    expect(events.some((event) => event.type === 'game-over' && event.reason === 'puzzle-budget')).toBe(false);
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
