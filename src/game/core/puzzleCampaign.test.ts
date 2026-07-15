import { describe, expect, it } from 'vitest';
import referencesFile from '../../../docs/workstreams/tetris-t5-core/puzzle-references.json';
import { VISIBLE_START_ROW } from './constants';
import { createInitialState, dispatch, dropDistance, replay, stateHash } from './engine';
import { PUZZLE_DEFINITIONS } from './puzzles';
import type { GameCommand, GameEvent, GameState, PieceType, PuzzleId, Rotation } from './types';

type Placement = {
  type: PieceType;
  rotation: Rotation;
  x: number;
  landingY: number;
  clearedLines: number;
};

type RouteMetrics = {
  pieceTypes: number;
  effectiveRotations: number;
  distinctLandingXs: number;
  nonClearingLocks: number;
  clearPhases: number;
  clearedLines: number;
};

type RouteEvidence = {
  initialHash: string;
  finalHash: string;
  commandDigest: string;
  eventDigest: string;
  commandCount: number;
};

type NegativeRoute = {
  placementIndex: number;
  x: number;
  expectedCompletion: 'failed-budget';
  finalHash: string;
};

type LevelReference = {
  id: PuzzleId;
  boardRows: string[];
  queue: PieceType[];
  pieceBudget: number;
  reference: {
    seed: number;
    placements: Placement[];
    metrics: RouteMetrics;
    evidence: RouteEvidence;
    negativeRoutes: NegativeRoute[];
  };
};

const references = (referencesFile as unknown as { levels: LevelReference[] }).levels;

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

function referenceFor(id: PuzzleId): LevelReference {
  const reference = references.find((candidate) => candidate.id === id);
  if (!reference) throw new Error(`Missing T5 reference for ${id}`);
  return reference;
}

function rotationCommands(rotation: Rotation): GameCommand[] {
  if (rotation === 1) return [{ type: 'rotate', direction: 1 }];
  if (rotation === 2) return [{ type: 'rotate', direction: 1 }, { type: 'rotate', direction: 1 }];
  if (rotation === 3) return [{ type: 'rotate', direction: -1 }];
  return [];
}

function execute(reference: LevelReference, options: {
  state?: GameState;
  xOverride?: { placementIndex: number; x: number };
  strict?: boolean;
} = {}) {
  const strict = options.strict ?? true;
  let state = options.state ?? createInitialState(reference.reference.seed, 'puzzle', reference.id);
  const initialHash = stateHash(state);
  const initialOccupied = occupied(state);
  const commands: GameCommand[] = [];
  const eventLog: Array<{ command: GameCommand; events: GameEvent[] }> = [];
  const landingXs: number[] = [];
  const landingYs: number[] = [];
  let effectiveRotations = 0;
  let lockedPieces = 0;
  let clearedLines = 0;
  let nonClearingLocks = 0;
  let clearPhases = 0;
  let firstTerminal = -1;

  const apply = (command: GameCommand) => {
    const transition = dispatch(state, command);
    state = transition.state;
    commands.push(command);
    eventLog.push({ command, events: transition.events });
    effectiveRotations += transition.events.filter((event) => event.type === 'piece-rotated').length;
    lockedPieces += transition.events.filter((event) => event.type === 'piece-locked').length;
    clearedLines += transition.events
      .filter((event): event is Extract<GameEvent, { type: 'lines-cleared' }> => event.type === 'lines-cleared')
      .reduce((sum, event) => sum + event.count, 0);
    clearPhases += transition.events.filter((event) => event.type === 'clear-started').length;
    if (firstTerminal === -1 && (state.status === 'finished' || state.status === 'game-over')) {
      firstTerminal = commands.length - 1;
    }
    return transition;
  };

  apply({ type: 'start' });
  for (let placementIndex = 0; placementIndex < reference.reference.placements.length; placementIndex += 1) {
    if (state.status !== 'playing' || !state.active) break;
    const placement = reference.reference.placements[placementIndex]!;
    if (strict) expect(state.active.type, `${reference.id} piece ${placementIndex}`).toBe(placement.type);

    for (const command of rotationCommands(placement.rotation)) apply(command);
    if (strict) expect(state.active?.rotation, `${reference.id} rotation ${placementIndex}`).toBe(placement.rotation);

    const targetX = options.xOverride?.placementIndex === placementIndex ? options.xOverride.x : placement.x;
    for (let guard = 0; state.active && state.active.x !== targetX && guard < 16; guard += 1) {
      const beforeX: number = state.active.x;
      apply({ type: 'move', dx: targetX < beforeX ? -1 : 1 });
      if (state.active?.x === beforeX) break;
    }
    if (strict) expect(state.active?.x, `${reference.id} x ${placementIndex}`).toBe(targetX);
    if (!state.active) break;

    const landingY = state.active.y + dropDistance(state);
    landingXs.push(state.active.x);
    landingYs.push(landingY);
    if (strict) expect(landingY, `${reference.id} landing y ${placementIndex}`).toBe(placement.landingY);

    const linesBefore = state.lines;
    apply({ type: 'hard-drop' });
    for (let guard = 0; state.status === 'playing' && (!state.active || state.phase !== 'active') && guard < 64; guard += 1) {
      apply({ type: 'tick' });
    }
    const lineDelta = state.lines - linesBefore;
    if (lineDelta === 0) nonClearingLocks += 1;
    if (strict) expect(lineDelta, `${reference.id} cleared lines ${placementIndex}`).toBe(placement.clearedLines);
  }

  return {
    state,
    commands,
    initialHash,
    initialOccupied,
    landingXs,
    landingYs,
    effectiveRotations,
    lockedPieces,
    clearedLines,
    nonClearingLocks,
    clearPhases,
    firstTerminal,
    eventDigest: digest(eventLog),
    commandDigest: digest(commands),
    finalHash: stateHash(state),
  };
}

describe('T5 six-level production campaign', () => {
  it.each(PUZZLE_DEFINITIONS)('$id completes its fixed queue through public commands only', (definition) => {
    const reference = referenceFor(definition.id);
    const first = execute(reference);
    const second = execute(reference);
    const metrics = reference.reference.metrics;

    expect(first.state.status).toBe('finished');
    expect(first.state.puzzleCompletion).toBe('finished');
    expect(first.state.completedLevelId).toBe(definition.id);
    expect(first.state.nextUnlockedLevelId).toBe(PUZZLE_DEFINITIONS[PUZZLE_DEFINITIONS.indexOf(definition) + 1]?.id ?? null);
    expect(first.state.active).toBeNull();
    expect(first.state.pendingClearRows).toEqual([]);
    expect(first.state.queue).toEqual([]);
    expect(first.state.puzzleQueueIndex).toBe(definition.queue.length);
    expect(first.lockedPieces).toBe(definition.queue.length);
    expect(first.state.pieceCount).toBe(definition.pieceBudget);
    expect(first.clearedLines).toBe(metrics.clearedLines);
    expect(first.effectiveRotations).toBe(metrics.effectiveRotations);
    expect(new Set(first.landingXs).size).toBe(metrics.distinctLandingXs);
    expect(first.nonClearingLocks).toBe(metrics.nonClearingLocks);
    expect(first.clearPhases).toBe(metrics.clearPhases);
    expect(new Set(definition.queue).size).toBe(metrics.pieceTypes);
    expect(first.effectiveRotations).toBeGreaterThanOrEqual(4);
    expect(new Set(first.landingXs).size).toBeGreaterThanOrEqual(5);
    expect(first.nonClearingLocks).toBeGreaterThanOrEqual(1);
    expect(first.clearPhases).toBeGreaterThan(1);
    expect(occupied(first.state)).toBe(0);
    expect(first.initialOccupied + first.lockedPieces * 4).toBe(first.clearedLines * 10);
    expect(first.firstTerminal).toBe(first.commands.length - 1);
    expect(first.initialHash).toBe(second.initialHash);
    expect(first.finalHash).toBe(second.finalHash);
    expect(first.commandDigest).toBe(second.commandDigest);
    expect(first.eventDigest).toBe(second.eventDigest);

    expect({
      initialHash: first.initialHash,
      finalHash: first.finalHash,
      commandDigest: first.commandDigest,
      eventDigest: first.eventDigest,
      commandCount: first.commands.length,
    }).toEqual(reference.reference.evidence);

    const terminalHash = stateHash(first.state);
    const tail = dispatch(first.state, { type: 'hard-drop' });
    expect(tail.events).toEqual([]);
    expect(stateHash(tail.state)).toBe(terminalHash);

    const restarted = dispatch(first.state, { type: 'restart' }).state;
    expect(stateHash(restarted)).toBe(first.initialHash);
    expect(restarted.active).toBeNull();
    expect(restarted.puzzleQueueIndex).toBe(0);
  });

  it('proves six one-column neighboring decisions exhaust the budget without solving', () => {
    let checked = 0;
    for (const reference of references) {
      for (const negative of reference.reference.negativeRoutes) {
        const canonical = reference.reference.placements[negative.placementIndex]!;
        expect(Math.abs(negative.x - canonical.x)).toBe(1);
        const result = execute(reference, {
          xOverride: { placementIndex: negative.placementIndex, x: negative.x },
          strict: false,
        });
        expect(result.landingXs[negative.placementIndex]).toBe(negative.x);
        expect(result.state.pieceCount).toBe(reference.pieceBudget);
        expect(result.state.status).toBe('game-over');
        expect(result.state.puzzleCompletion).toBe(negative.expectedCompletion);
        expect(result.finalHash).toBe(negative.finalHash);
        expect(occupied(result.state)).toBeGreaterThan(0);
        checked += 1;
      }
    }
    expect(checked).toBe(6);
  });

  it('fails an invalid initial spawn without advancing the queue index', () => {
    const ready = createInitialState(9, 'puzzle', 't3r-shaft-01');
    const blocked = { ...ready, board: ready.board.map((row) => [...row]) };
    blocked.board[20]![4] = 'J';
    const transition = dispatch(blocked, { type: 'start' });
    expect(transition.state.status).toBe('game-over');
    expect(transition.state.puzzleCompletion).toBe('failed-invalid-spawn');
    expect(transition.state.puzzleQueueIndex).toBe(0);
    expect(transition.events).toContainEqual({ type: 'game-over', reason: 'puzzle-invalid-spawn' });
  });

  it('fails hidden-buffer occupancy as top-out after a public lock', () => {
    const reference = referenceFor('t3r-shaft-01');
    const ready = createInitialState(11, 'puzzle', reference.id);
    const board = ready.board.map((row) => [...row]);
    board[VISIBLE_START_ROW - 1]![0] = 'J';
    const started = dispatch({ ...ready, board }, { type: 'start' }).state;
    const ended = dispatch(started, { type: 'hard-drop' });
    expect(ended.state.status).toBe('game-over');
    expect(ended.state.puzzleCompletion).toBe('failed-top-out');
    expect(ended.events).toContainEqual({ type: 'game-over', reason: 'lock-out' });
  });

  it('keeps final-piece board-empty success ahead of budget exhaustion and replay drift detectable', () => {
    const reference = referenceFor('t3r-shaft-04');
    const completed = execute(reference);
    expect(completed.state.pieceCount).toBe(completed.state.puzzlePieceBudget);
    expect(completed.state.puzzleQueueIndex).toBe(completed.state.puzzleQueue?.length);
    expect(completed.state.status).toBe('finished');

    const altered = [...completed.commands];
    altered[1] = { type: 'move', dx: -1 };
    expect(stateHash(replay(reference.reference.seed, altered, 'puzzle', reference.id))).not.toBe(completed.finalHash);
  });

  it('leaves Marathon and Race deterministic payloads isolated from Puzzle-only facts', () => {
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
