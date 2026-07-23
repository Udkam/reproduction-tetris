import { createInitialState, dispatch } from './engine';
import type { Cell, GameCommand, GameState, PieceType, PuzzleId } from './types';

/** Public controls available to the ordinary Puzzle player and recorded in route evidence. */
export type PuzzleRouteToken = 'S' | 'T' | 'L' | 'R' | 'C' | 'H';

const PLANNER_COMMANDS: readonly GameCommand[] = Object.freeze([
  { type: 'rotate', direction: 1 },
  { type: 'move', dx: -1 },
  { type: 'move', dx: 1 },
]);

const MAX_SETTLEMENT_TICKS = 32;

export interface PuzzleRouteMetrics {
  commandCount: number;
  locks: number;
  rotationCount: number;
  moveCount: number;
}

/** A landed piece, independent from redundant pre-drop input. */
export interface PuzzleLockPlacement {
  piece: PieceType;
  cells: readonly Cell[];
  signature: string;
}

export interface PuzzleRouteReplay {
  state: GameState;
  commands: readonly GameCommand[];
  locks: readonly PuzzleLockPlacement[];
}

interface Landing {
  state: GameState;
  commands: readonly GameCommand[];
  lock: PuzzleLockPlacement;
}

interface SearchNode {
  state: GameState;
  parent: SearchNode | null;
  segment: readonly GameCommand[];
  lock: PuzzleLockPlacement | null;
  depth: number;
  cost: number;
}

export interface PuzzleRouteSearchOptions {
  /** A small recovery margin keeps alternatives legible instead of accepting long salvage play. */
  maxLocks?: number;
  /** Bounded beam width keeps authoring search repeatable and quick. */
  beamWidth?: number;
}

export interface PuzzleAlternativeSearchResult {
  canonical: PuzzleRouteReplay;
  alternative: PuzzleRouteReplay | null;
  /** One-based locked-piece index; null means no meaningful alternative was found. */
  firstDivergenceLock: number | null;
}

function tokenCommand(token: PuzzleRouteToken): GameCommand {
  switch (token) {
    case 'S': return { type: 'start' };
    case 'T': return { type: 'tick' };
    case 'L': return { type: 'move', dx: -1 };
    case 'R': return { type: 'move', dx: 1 };
    case 'C': return { type: 'rotate', direction: 1 };
    case 'H': return { type: 'hard-drop' };
  }
}

function commandToken(command: GameCommand): PuzzleRouteToken {
  if (command.type === 'start') return 'S';
  if (command.type === 'tick') return 'T';
  if (command.type === 'hard-drop') return 'H';
  if (command.type === 'rotate' && command.direction === 1) return 'C';
  if (command.type === 'move' && command.dx === -1) return 'L';
  if (command.type === 'move' && command.dx === 1) return 'R';
  throw new Error(`Puzzle route cannot encode ${command.type}.`);
}

function cellsSignature(piece: PieceType, cells: readonly Cell[]): string {
  return `${piece}:${[...cells]
    .sort((left, right) => left.y - right.y || left.x - right.x)
    .map((cell) => `${cell.x},${cell.y}`)
    .join('|')}`;
}

function lockPlacement(piece: PieceType, cells: readonly Cell[]): PuzzleLockPlacement {
  const stableCells = Object.freeze(cells
    .map((cell) => Object.freeze({ x: cell.x, y: cell.y }))
    .sort((left, right) => left.y - right.y || left.x - right.x));
  return Object.freeze({ piece, cells: stableCells, signature: cellsSignature(piece, stableCells) });
}

function isActive(state: GameState): boolean {
  return state.status === 'playing' && state.phase === 'active' && state.active !== null;
}

/** Applies only the ordinary delays after a hard drop, stopping at the next decision point. */
function settleAfterLock(state: GameState): { state: GameState; commands: readonly GameCommand[] } | null {
  let next = state;
  const commands: GameCommand[] = [];
  for (let tick = 0; tick < MAX_SETTLEMENT_TICKS; tick += 1) {
    if (next.status === 'finished' || isActive(next)) return { state: next, commands };
    if (next.status === 'game-over') return null;
    const transition = dispatch(next, { type: 'tick' });
    if (transition.state === next) return null;
    next = transition.state;
    commands.push({ type: 'tick' });
  }
  return null;
}

/**
 * Lists all meaningful normal landing choices from an active piece. The search state
 * only expands rotation and horizontal movement, then uses the same hard drop and
 * delay resolution a player sees; no timing trick, unsupported counter-rotation, or
 * state injection is part of the route domain.
 */
export function puzzleLandings(state: GameState): readonly Landing[] {
  if (!isActive(state)) return [];
  const queue: { state: GameState; commands: readonly GameCommand[] }[] = [{ state, commands: [] }];
  const seen = new Set<string>();
  const result: Landing[] = [];

  const activeKey = (candidate: GameState) => {
    const active = candidate.active;
    return active ? `${active.type}:${active.rotation}:${active.x}:${active.y}` : 'none';
  };
  seen.add(activeKey(state));

  for (let index = 0; index < queue.length; index += 1) {
    const route = queue[index]!;
    const dropped = dispatch(route.state, { type: 'hard-drop' });
    const locked = dropped.events.find((event): event is Extract<typeof event, { type: 'piece-locked' }> => event.type === 'piece-locked');
    const settled = locked ? settleAfterLock(dropped.state) : null;
    if (locked && settled) {
      result.push({
        state: withoutUndoHistory(settled.state),
        commands: Object.freeze([...route.commands, { type: 'hard-drop' }, ...settled.commands]),
        lock: lockPlacement(locked.piece, locked.cells),
      });
    }

    for (const command of PLANNER_COMMANDS) {
      const transition = dispatch(route.state, command);
      if (transition.state === route.state || !isActive(transition.state)) continue;
      const key = activeKey(transition.state);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: transition.state, commands: [...route.commands, command] });
    }
  }
  return Object.freeze(result);
}

/** Solver exploration does not need recursive undo snapshots; final replays retain them. */
function withoutUndoHistory(state: GameState): GameState {
  return state.puzzleUndoHistory.length === 0 ? state : { ...state, puzzleUndoHistory: Object.freeze([]) };
}

function targetKey(state: GameState): string {
  return state.puzzleTargetCells
    .map((cell) => `${cell.x},${cell.y}`)
    .sort()
    .join('|');
}

/** Score, elapsed time, and undo history do not affect a Puzzle's future legal moves. */
function routeStateKey(state: GameState): string {
  const active = state.active;
  return [
    state.board.map((row) => row.map((cell) => cell ?? '.').join('')).join('/'),
    targetKey(state),
    active ? `${active.type}:${active.rotation}:${active.x}:${active.y}` : '-',
    state.queue.join(''),
    state.randomizer.seed,
    state.randomizer.bag.join(''),
    state.pieceCount,
    state.puzzleSpawnCount,
    state.phase,
    state.status,
  ].join('~');
}

function countHoles(state: GameState): number {
  let holes = 0;
  for (let x = 0; x < state.board[0]!.length; x += 1) {
    let occupied = false;
    for (const row of state.board) {
      if (row[x]) occupied = true;
      else if (occupied) holes += 1;
    }
  }
  return holes;
}

/** Lower is friendlier: retain target removal first, then readable flat staging. */
function routeCost(state: GameState, depth: number): number {
  const targetCount = state.puzzleTargetCells.length;
  let aggregateHeight = 0;
  let bumpiness = 0;
  let rowCompletion = 0;
  const heights: number[] = [];
  for (let x = 0; x < state.board[0]!.length; x += 1) {
    let height = 0;
    for (let y = 0; y < state.board.length; y += 1) {
      if (state.board[y]![x]) {
        height = state.board.length - y;
        break;
      }
    }
    heights.push(height);
    aggregateHeight += height;
  }
  for (let x = 1; x < heights.length; x += 1) bumpiness += Math.abs(heights[x]! - heights[x - 1]!);
  for (const row of state.board) {
    const fill = row.reduce((count, cell) => count + Number(cell !== null), 0);
    if (fill >= 6) rowCompletion += fill * fill;
  }
  return targetCount * 1_000_000
    + countHoles(state) * 3_000
    + aggregateHeight * 40
    + bumpiness * 80
    - rowCompletion * 25
    + depth * 5;
}

function reconstructReplay(node: SearchNode): PuzzleRouteReplay {
  const segments: GameCommand[][] = [];
  const locks: PuzzleLockPlacement[] = [];
  for (let cursor: SearchNode | null = node; cursor?.parent; cursor = cursor.parent) {
    segments.push([...cursor.segment]);
    if (cursor.lock) locks.push(cursor.lock);
  }
  segments.reverse();
  locks.reverse();
  const commands: GameCommand[] = [{ type: 'start' }, ...segments.flat()];
  return Object.freeze({
    state: node.state,
    commands: Object.freeze(commands),
    locks: Object.freeze(locks),
  });
}

function firstDivergence(canonical: readonly PuzzleLockPlacement[], alternative: readonly PuzzleLockPlacement[]): number | null {
  const bound = Math.min(canonical.length, alternative.length);
  for (let index = 0; index < bound; index += 1) {
    if (canonical[index]!.signature !== alternative[index]!.signature) return index + 1;
  }
  return canonical.length === alternative.length ? null : bound + 1;
}

function searchRoute(
  levelId: PuzzleId,
  maxLocks: number,
  beamWidth: number,
  banned?: { lock: PuzzleLockPlacement; index: number },
): PuzzleRouteReplay | null {
  const started = dispatch(createInitialState(0x51a1f00d, 'puzzle', levelId), { type: 'start' }).state;
  if (!isActive(started)) return null;
  let beam: SearchNode[] = [{ state: withoutUndoHistory(started), parent: null, segment: [], lock: null, depth: 0, cost: routeCost(started, 0) }];

  for (let depth = 0; depth < maxLocks; depth += 1) {
    const deduplicated = new Map<string, SearchNode>();
    for (const parent of beam) {
      for (const landing of puzzleLandings(parent.state)) {
        if (depth === banned?.index && landing.lock.signature === banned.lock.signature) continue;
        const node: SearchNode = {
          state: landing.state,
          parent,
          segment: landing.commands,
          lock: landing.lock,
          depth: parent.depth + 1,
          cost: routeCost(landing.state, parent.depth + 1),
        };
        if (landing.state.status === 'finished') return reconstructReplay(node);
        if (!isActive(landing.state)) continue;
        const key = routeStateKey(landing.state);
        const existing = deduplicated.get(key);
        if (!existing || node.cost < existing.cost) deduplicated.set(key, node);
      }
    }
    beam = [...deduplicated.values()]
      .sort((left, right) => left.cost - right.cost || left.lock!.signature.localeCompare(right.lock!.signature))
      .slice(0, beamWidth);
    if (beam.length === 0) return null;
  }
  return null;
}

/** Finds one legal Core-replayed route without making it a product rule or hint script. */
export function findPuzzleRoute(levelId: PuzzleId, options: PuzzleRouteSearchOptions = {}): PuzzleRouteReplay | null {
  return searchRoute(levelId, options.maxLocks ?? 30, options.beamWidth ?? 480);
}

export function decodePuzzleRoute(commandStream: string): readonly GameCommand[] {
  return Object.freeze([...commandStream].map((token) => tokenCommand(token as PuzzleRouteToken)));
}

export function encodePuzzleRoute(commands: readonly GameCommand[]): string {
  return commands.map(commandToken).join('');
}

/** Replays an artifact route through the current Core and records each genuine landing. */
export function replayPuzzleRoute(levelId: PuzzleId, commandStream: string): PuzzleRouteReplay {
  let state = createInitialState(0x51a1f00d, 'puzzle', levelId);
  const commands = decodePuzzleRoute(commandStream);
  const locks: PuzzleLockPlacement[] = [];
  for (const command of commands) {
    const transition = dispatch(state, command);
    const locked = transition.events.find((event): event is Extract<typeof event, { type: 'piece-locked' }> => event.type === 'piece-locked');
    if (locked) locks.push(lockPlacement(locked.piece, locked.cells));
    state = transition.state;
  }
  return Object.freeze({ state, commands, locks: Object.freeze(locks) });
}

export function metricsForPuzzleRoute(commandStream: string): PuzzleRouteMetrics {
  return Object.freeze({
    commandCount: commandStream.length,
    locks: [...commandStream].filter((token) => token === 'H').length,
    rotationCount: [...commandStream].filter((token) => token === 'C').length,
    moveCount: [...commandStream].filter((token) => token === 'L' || token === 'R').length,
  });
}

/**
 * Finds one compact alternate route by excluding the canonical landing at each possible
 * point in turn. The earliest replayable difference wins, which gives a player a real
 * early strategic choice instead of a late cosmetic variant.
 */
export function findPuzzleAlternativeRoute(
  levelId: PuzzleId,
  canonicalCommandStream: string,
  options: PuzzleRouteSearchOptions = {},
): PuzzleAlternativeSearchResult {
  const canonical = replayPuzzleRoute(levelId, canonicalCommandStream);
  const maxLocks = options.maxLocks ?? canonical.locks.length + 2;
  const beamWidth = options.beamWidth ?? 360;
  if (canonical.state.status !== 'finished' || canonical.state.puzzleCompletion !== 'finished') {
    throw new Error(`Canonical route for ${levelId} does not finish through Core.`);
  }

  for (let index = 0; index < canonical.locks.length; index += 1) {
    const alternative = searchRoute(levelId, maxLocks, beamWidth, { lock: canonical.locks[index]!, index });
    if (!alternative) continue;
    const divergence = firstDivergence(canonical.locks, alternative.locks);
    if (divergence !== null) return Object.freeze({ canonical, alternative, firstDivergenceLock: divergence });
  }
  return Object.freeze({ canonical, alternative: null, firstDivergenceLock: null });
}
