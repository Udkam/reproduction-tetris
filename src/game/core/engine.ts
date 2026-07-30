import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  ENTRY_DELAY_TICKS,
  LINE_CLEAR_BASE_SCORE,
  LINE_CLEAR_DELAY_TICKS,
  LOCK_DELAY_TICKS,
  MUTATION_BOMB_ROWS,
  MUTATION_BOMB_SCORE,
  MUTATION_CARRIER_CHANCE,
  MUTATION_EFFECT_TICKS,
  MUTATION_FREEZE_GRAVITY_TICKS,
  MUTATION_RANDOM_SALT,
  MUTATION_RESULT_TICKS,
  MAX_LOCK_RESETS,
  NEXT_QUEUE_SIZE,
  INITIAL_SURVIVAL_BEDROCK_ROWS,
  SURVIVAL_DEBRIS_FALL_PROGRESS_PER_TICK,
  SURVIVAL_DEBRIS_FALL_PROGRESS_THRESHOLD,
  SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS,
  SURVIVAL_DEBRIS_INTERVAL_STEP_SECONDS,
  SURVIVAL_DEBRIS_MIN_INTERVAL_SECONDS,
  SURVIVAL_DEBRIS_RANDOM_SALT,
  SURVIVAL_DEBRIS_WARNING_SECONDS,
  SURVIVAL_LINES_PER_BEDROCK,
  TICKS_PER_SECOND,
  VISIBLE_START_ROW,
  gravityForMode,
  survivalIntervalTicks,
} from './constants';
import { canPlace, clearRows, createBoard, fullRows, lowerBedrock, mapCellsAfterClear, mergePiece, raiseBedrock, setCell } from './board';
import { cellsForPiece, createSpawnPiece, nextRotation } from './pieces';
import { createPuzzleBoard, defaultPuzzleId, getPuzzleDefinition, nextPuzzleId, originalTargetCells } from './puzzles';
import { createRandomizer, drawPiece, drawRandom } from './random';
import { kickTests } from './rotation';
import { collapseSprintColumns } from './sprint';
import {
  collapseMutationCarriers,
  mapMutationCarriersAfterClear,
  mutationCarriersClearedByRows,
  withoutMutationCarriers,
} from './mutation';
import {
  SURVIVAL_STONE_CELL,
  type ActivePiece,
  type Cell,
  type GameCommand,
  type GameEvent,
  type GameMode,
  type GameState,
  type GameTransition,
  type MutationCarrier,
  type MutationItem,
  type PieceType,
  type PuzzleCompletion,
  type PuzzleId,
  type PuzzleUndoSnapshot,
  type SurvivalDebris,
} from './types';

const MUTATION_ITEMS: readonly MutationItem[] = Object.freeze(['freeze', 'collapse', 'bomb', 'multiplier']);

function survivalDebrisSeed(seed: number): number {
  return (seed ^ SURVIVAL_DEBRIS_RANDOM_SALT) >>> 0;
}

function mutationItemSeed(seed: number): number {
  return (seed ^ MUTATION_RANDOM_SALT) >>> 0;
}

function refillQueue(state: GameState, minimum = NEXT_QUEUE_SIZE + 1): GameState {
  const queue = [...state.queue];
  let randomizer = state.randomizer;
  while (queue.length < minimum) {
    const draw = drawPiece(randomizer);
    queue.push(draw.piece);
    randomizer = draw.randomizer;
  }
  return { ...state, queue, randomizer };
}

/** Schedules an optional marked carrier without weakening the normal seven-bag. */
function drawMutationItem(
  randomizer: GameState['mutationRandomizer'],
): { item: MutationItem | null; randomizer: GameState['mutationRandomizer'] } {
  const chance = drawRandom(randomizer);
  if (chance.value >= MUTATION_CARRIER_CHANCE) return { item: null, randomizer: chance.randomizer };
  const itemRoll = drawRandom(chance.randomizer);
  return {
    item: MUTATION_ITEMS[Math.floor(itemRoll.value * MUTATION_ITEMS.length)] ?? 'freeze',
    randomizer: itemRoll.randomizer,
  };
}

function assignMutationCarrier(state: GameState): GameState {
  if (state.mode !== 'sprint' || state.pieceCount < 2) {
    return state.mutationActiveCarrier === null ? state : { ...state, mutationActiveCarrier: null };
  }
  const draw = drawMutationItem(state.mutationRandomizer);
  if (draw.item === null) {
    return { ...state, mutationRandomizer: draw.randomizer, mutationActiveCarrier: null };
  }
  return {
    ...state,
    mutationRandomizer: draw.randomizer,
    mutationActiveCarrier: { id: state.mutationNextCarrierId, item: draw.item },
    mutationNextCarrierId: state.mutationNextCarrierId + 1,
  };
}

/**
 * Predicts the carrier attached to the immediate upcoming Mutation piece without
 * consuming state. It mirrors spawnPiece's queue refill and carrier draw exactly so the
 * renderer can present the real item on Next while Core timing stays untouched.
 */
export function nextMutationPreviewItem(state: GameState): MutationItem | null {
  if (state.mode !== 'sprint' || state.status === 'game-over') return null;
  const pieceCountAtUpcomingSpawn = state.pieceCount + (state.active === null ? 0 : 1);
  if (pieceCountAtUpcomingSpawn < 2) return null;
  return drawMutationItem(state.mutationRandomizer).item;
}

function puzzleFailure(
  state: GameState,
  completion: Exclude<PuzzleCompletion, 'active' | 'finished'>,
  reason: Extract<GameEvent, { type: 'game-over' }>['reason'],
): GameTransition {
  return {
    state: {
      ...state,
      active: null,
      status: 'game-over',
      phase: 'active',
      phaseTicks: 0,
      pendingClearRows: [],
      gravityTicks: 0,
      lockTicks: 0,
      lockResets: 0,
      puzzleCompletion: completion,
      completedLevelId: null,
      nextUnlockedLevelId: null,
    },
    events: [{ type: 'game-over', reason }],
  };
}

function spawnPiece(state: GameState, type?: PieceType): GameTransition {
  // Puzzle undo returns a locked piece to its normal top spawn, not its old landing.
  const puzzleSpawnCheckpoint = state.mode === 'puzzle' ? puzzleUndoCheckpoint(state) : null;
  let next = refillQueue(state, type ? NEXT_QUEUE_SIZE : NEXT_QUEUE_SIZE + 1);
  const queue = [...next.queue];
  const pieceType = type ?? queue.shift();
  if (!pieceType) return invalidState(next);
  next = refillQueue({ ...next, queue }, NEXT_QUEUE_SIZE);
  const active = createSpawnPiece(pieceType);
  next = assignMutationCarrier(next);
  if (!canPlaceInState(next, active)) {
    if (next.mode === 'puzzle') return puzzleFailure(next, 'failed-top-out', 'block-out');
    return {
      state: { ...next, active: null, status: 'game-over', phase: 'active' },
      events: [{ type: 'game-over', reason: 'block-out' }],
    };
  }
  return {
    state: {
      ...next,
      active,
      puzzleQueue: next.mode === 'puzzle' ? Object.freeze([...next.queue]) : next.puzzleQueue,
      puzzleQueueIndex: 0,
      puzzleSpawnCount: next.mode === 'puzzle' ? next.puzzleSpawnCount + 1 : next.puzzleSpawnCount,
      puzzleActiveSpawnCheckpoint: puzzleSpawnCheckpoint,
      phase: 'active',
      phaseTicks: 0,
      pendingClearRows: [],
      gravityTicks: 0,
      lockTicks: 0,
      lockResets: 0,
    },
    events: [],
  };
}

export function createInitialState(seed = 0x51a1f00d, mode: GameMode = 'marathon', puzzleId?: PuzzleId): GameState {
  const selectedPuzzle = mode === 'puzzle' ? getPuzzleDefinition(puzzleId ?? defaultPuzzleId()) : null;
  const effectiveSeed = selectedPuzzle?.seed ?? seed;
  const initialBoard = selectedPuzzle ? createPuzzleBoard(selectedPuzzle) : createBoard();
  const puzzleTargetCells = selectedPuzzle ? originalTargetCells(selectedPuzzle) : Object.freeze([]);
  const openingBedrock = mode === 'race' ? raiseBedrock(initialBoard, INITIAL_SURVIVAL_BEDROCK_ROWS) : null;
  const base: GameState = {
    board: openingBedrock?.board ?? initialBoard,
    active: null,
    queue: [],
    score: 0,
    lines: 0,
    combo: 0,
    level: 0,
    mode,
    puzzleId: selectedPuzzle?.id ?? null,
    puzzleTargetLines: null,
    puzzleTargetCells,
    puzzleInitialTargetCount: puzzleTargetCells.length,
    puzzleBoardRows: selectedPuzzle?.boardRows ?? null,
    puzzleQueue: null,
    puzzleQueueIndex: 0,
    puzzleSpawnCount: 0,
    puzzleGoal: selectedPuzzle ? 'original-targets-cleared' : null,
    puzzleCompletion: selectedPuzzle ? 'active' : null,
    puzzleUndoHistory: Object.freeze([]),
    puzzleActiveSpawnCheckpoint: null,
    completedLevelId: null,
    nextUnlockedLevelId: null,
    pieceCount: 0,
    survivalBedrockRows: openingBedrock?.added ?? 0,
    survivalPressureTicks: 0,
    survivalRisePending: false,
    survivalDebris: Object.freeze([]),
    survivalDebrisNextId: 1,
    survivalDebrisIntervalTicks: 0,
    survivalDebrisIntervalSeconds: SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS,
    survivalDebrisWarningColumns: Object.freeze([]),
    survivalDebrisFallProgress: 0,
    survivalDebrisRandomizer: createRandomizer(survivalDebrisSeed(effectiveSeed)),
    mutationActiveCarrier: null,
    mutationRandomizer: createRandomizer(mutationItemSeed(effectiveSeed)),
    mutationCarriers: Object.freeze([]),
    mutationNextCarrierId: 1,
    mutationFreezeTicks: 0,
    mutationCollapseTicks: 0,
    mutationMultiplierTicks: 0,
    mutationMultiplierFactor: 1,
    mutationLastItem: null,
    mutationLastItemTicks: 0,
    status: 'ready',
    phase: 'active',
    phaseTicks: 0,
    pendingClearRows: [],
    gravityTicks: 0,
    lockTicks: 0,
    lockResets: 0,
    elapsedTicks: 0,
    randomizer: createRandomizer(effectiveSeed),
    seed: effectiveSeed,
  };
  const spawned = spawnPiece(base).state;
  return spawned.status === 'game-over' ? spawned : { ...spawned, status: 'ready' };
}

function invalidState(state: GameState): GameTransition {
  if (state.mode === 'puzzle') return puzzleFailure(state, 'failed-top-out', 'invalid-state');
  return {
    state: { ...state, active: null, status: 'game-over' },
    events: [{ type: 'game-over', reason: 'invalid-state' }],
  };
}

function finishPuzzleSuccess(state: GameState): GameTransition {
  const levelId = state.puzzleId;
  if (!levelId) return invalidState(state);
  return {
    state: {
      ...state,
      active: null,
      status: 'finished',
      phase: 'active',
      phaseTicks: 0,
      pendingClearRows: [],
      gravityTicks: 0,
      lockTicks: 0,
      lockResets: 0,
      puzzleCompletion: 'finished',
      completedLevelId: levelId,
      nextUnlockedLevelId: nextPuzzleId(levelId),
    },
    events: [{ type: 'finished', completionTicks: state.elapsedTicks }],
  };
}

/** Puzzle-only post-lock resolution after shared merge and ordinary line clearing. */
function resolvePuzzleAfterLock(state: GameState, spawnImmediately: boolean): GameTransition {
  if (state.puzzleGoal !== 'original-targets-cleared') return invalidState(state);
  if (state.puzzleTargetCells.length === 0) return finishPuzzleSuccess(state);
  if (spawnImmediately) return spawnPiece(state);
  return {
    state: {
      ...state,
      active: null,
      phase: 'entry',
      phaseTicks: 0,
      gravityTicks: 0,
      lockTicks: 0,
      lockResets: 0,
    },
    events: [],
  };
}

function withActive(state: GameState): state is GameState & { active: ActivePiece } {
  return state.active !== null;
}

function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

function cellsForSurvivalDebris(debris: SurvivalDebris): readonly [Cell, Cell] {
  return [
    { x: debris.x, y: debris.y },
    { x: debris.x, y: debris.y + 1 },
  ];
}

function canPlaceInState(state: GameState, piece: ActivePiece): boolean {
  if (!canPlace(state.board, piece)) return false;
  if (state.mode !== 'race' || state.survivalDebris.length === 0) return true;
  const debris = new Set(state.survivalDebris.flatMap(cellsForSurvivalDebris).map(cellKey));
  return cellsForPiece(piece).every((cell) => !debris.has(cellKey(cell)));
}

function isGroundedInState(state: GameState, piece: ActivePiece): boolean {
  return !canPlaceInState(state, { ...piece, y: piece.y + 1 });
}

function advanceSurvivalPressure(state: GameState): GameState {
  if (state.mode !== 'race' || state.survivalRisePending) return state;
  const intervalTicks = survivalIntervalTicks(state.lines);
  const survivalPressureTicks = Math.min(intervalTicks, state.survivalPressureTicks + 1);
  return {
    ...state,
    survivalPressureTicks,
    survivalRisePending: survivalPressureTicks >= intervalTicks,
  };
}

function planSurvivalDebris(state: GameState): { state: GameState; columns: readonly number[] } {
  if (state.survivalDebrisWarningColumns.length > 0) {
    return { state, columns: state.survivalDebrisWarningColumns };
  }
  const columnRoll = drawRandom(state.survivalDebrisRandomizer);
  const frozenColumns = Object.freeze([
    Math.min(BOARD_WIDTH - 1, Math.floor(columnRoll.value * BOARD_WIDTH)),
  ]);

  // The plan deliberately ignores the current stack. If either cell of the
  // warned pair is blocked when due, the same announced column waits.
  return {
    state: {
      ...state,
      survivalDebrisWarningColumns: frozenColumns,
      survivalDebrisRandomizer: columnRoll.randomizer,
    },
    columns: frozenColumns,
  };
}

function spawnSurvivalDebris(state: GameState): { state: GameState; cells: readonly Cell[] } {
  const occupied = new Set<string>([
    ...state.survivalDebris.flatMap(cellsForSurvivalDebris).map(cellKey),
    ...(state.active ? cellsForPiece(state.active).map(cellKey) : []),
  ]);
  const survivalDebris = [...state.survivalDebris];
  const cells: Cell[] = [];
  let survivalDebrisNextId = state.survivalDebrisNextId;

  const x = state.survivalDebrisWarningColumns[0];
  if (x !== undefined) {
    const pair: SurvivalDebris = { id: survivalDebrisNextId, x, y: VISIBLE_START_ROW - 1 };
    const pairCells = cellsForSurvivalDebris(pair);
    const blocked = pairCells.some((cell) => (
      cell.y < 0
      || cell.y >= BOARD_HEIGHT
      || state.board[cell.y]?.[cell.x] !== null
      || occupied.has(cellKey(cell))
    ));
    if (!blocked) {
      survivalDebris.push(pair);
      survivalDebrisNextId += 1;
      cells.push(...pairCells);
    }
  }

  return {
    state: {
      ...state,
      survivalDebris: Object.freeze(survivalDebris),
      survivalDebrisNextId,
      survivalDebrisWarningColumns: cells.length > 0
        ? Object.freeze([])
        : state.survivalDebrisWarningColumns,
    },
    cells: Object.freeze(cells),
  };
}

function settleSurvivalDebris(state: GameState): { state: GameState; landed: readonly Cell[] } {
  if (state.mode !== 'race' || state.survivalDebris.length === 0) return { state, landed: Object.freeze([]) };
  const occupied = new Set(state.survivalDebris.flatMap(cellsForSurvivalDebris).map(cellKey));
  const activeCells = new Set(state.active ? cellsForPiece(state.active).map(cellKey) : []);
  const falling = [...state.survivalDebris].sort((left, right) => (
    right.y - left.y || left.x - right.x || left.id - right.id
  ));
  const survivalDebris: SurvivalDebris[] = [];
  const landed: Cell[] = [];
  let board = state.board;

  for (const pair of falling) {
    for (const cell of cellsForSurvivalDebris(pair)) occupied.delete(cellKey(cell));
    const movedPair = { ...pair, y: pair.y + 1 };
    const movedCells = cellsForSurvivalDebris(movedPair);
    const canFall = movedCells.every((cell) => (
      cell.y >= 0
      && cell.y < BOARD_HEIGHT
      && board[cell.y]?.[cell.x] === null
      && !activeCells.has(cellKey(cell))
      && !occupied.has(cellKey(cell))
    ));
    if (canFall) {
      survivalDebris.push(movedPair);
      for (const cell of movedCells) occupied.add(cellKey(cell));
      continue;
    }
    const settledCells = cellsForSurvivalDebris(pair);
    for (const cell of settledCells) board = setCell(board, cell.x, cell.y, SURVIVAL_STONE_CELL);
    landed.push(...settledCells);
  }

  return {
    state: {
      ...state,
      board,
      survivalDebris: Object.freeze(survivalDebris.sort((left, right) => left.id - right.id)),
    },
    landed: Object.freeze(landed),
  };
}

interface SurvivalDebrisAdvance extends GameTransition {
  startedLineClear: boolean;
}

/** Advances the independent debris clock and its exact 2× fixed-tick fall accumulator. */
function advanceSurvivalDebris(state: GameState): SurvivalDebrisAdvance {
  if (state.mode !== 'race') return { state, events: [], startedLineClear: false };
  let next = state;
  const events: GameEvent[] = [];
  const progress = state.survivalDebrisFallProgress + SURVIVAL_DEBRIS_FALL_PROGRESS_PER_TICK;
  if (progress >= SURVIVAL_DEBRIS_FALL_PROGRESS_THRESHOLD) {
    const settled = settleSurvivalDebris(state);
    next = {
      ...settled.state,
      survivalDebrisFallProgress: progress - SURVIVAL_DEBRIS_FALL_PROGRESS_THRESHOLD,
    };
    if (settled.landed.length > 0) events.push({ type: 'survival-stones-landed', cells: settled.landed });
  } else {
    next = { ...state, survivalDebrisFallProgress: progress };
  }

  // Resolve in-flight stones before adding a new source stone. A fresh stone
  // therefore always appears on the top visible row for one complete tick,
  // rather than sometimes skipping a cell when the 3:2 accumulator wraps.
  const intervalTicks = next.survivalDebrisIntervalSeconds * TICKS_PER_SECOND;
  const survivalDebrisIntervalTicks = Math.min(intervalTicks, next.survivalDebrisIntervalTicks + 1);
  const warningTicks = SURVIVAL_DEBRIS_WARNING_SECONDS * TICKS_PER_SECOND;
  const warningStartsAt = intervalTicks - warningTicks;
  if (
    next.survivalDebrisWarningColumns.length === 0
    && survivalDebrisIntervalTicks >= warningStartsAt
  ) {
    const planned = planSurvivalDebris(next);
    next = planned.state;
    events.push({
      type: 'survival-stones-warned',
      columns: planned.columns,
      leadSeconds: SURVIVAL_DEBRIS_WARNING_SECONDS,
    });
  }
  if (survivalDebrisIntervalTicks >= intervalTicks) {
    const emitted = spawnSurvivalDebris(next);
    if (emitted.cells.length > 0) {
      const nextIntervalSeconds = Math.max(
        SURVIVAL_DEBRIS_MIN_INTERVAL_SECONDS,
        next.survivalDebrisIntervalSeconds - SURVIVAL_DEBRIS_INTERVAL_STEP_SECONDS,
      );
      next = {
        ...emitted.state,
        survivalDebrisIntervalTicks: 0,
        survivalDebrisIntervalSeconds: nextIntervalSeconds,
      };
      events.push({
        type: 'survival-stones-spawned',
        cells: emitted.cells,
        intervalSeconds: state.survivalDebrisIntervalSeconds,
        nextIntervalSeconds,
      });
    } else {
      // Keep the timer due and the exact warned columns visible until at least
      // one entry cell opens; never skip or redirect a blocked event.
      next = {
        ...emitted.state,
        survivalDebrisIntervalTicks: intervalTicks,
      };
    }
  } else {
    next = { ...next, survivalDebrisIntervalTicks };
  }

  const full = fullRows(next.board);
  const pending = new Set(next.pendingClearRows);
  const newlyFull = full.filter((row) => !pending.has(row));
  if (newlyFull.length === 0) return { state: next, events, startedLineClear: false };

  const pendingClearRows = [...pending, ...newlyFull].sort((left, right) => left - right);
  return {
    state: {
      ...next,
      phase: 'line-clear',
      phaseTicks: 0,
      pendingClearRows,
      gravityTicks: 0,
      lockTicks: 0,
    },
    events: [...events, { type: 'clear-started', rows: newlyFull }],
    startedLineClear: state.phase !== 'line-clear',
  };
}

function mapSurvivalDebrisAfterClear(board: GameState['board'], rows: readonly number[], debris: readonly SurvivalDebris[]): readonly SurvivalDebris[] {
  return Object.freeze(debris.map((pair) => {
    const before = cellsForSurvivalDebris(pair);
    const after = mapCellsAfterClear(board, rows, before);
    if (after.length !== before.length) return pair;
    const dx = after[0]!.x - before[0]!.x;
    const dy = after[0]!.y - before[0]!.y;
    const rigid = after.every((cell, index) => (
      cell.x - before[index]!.x === dx
      && cell.y - before[index]!.y === dy
    ));
    return rigid ? { ...pair, x: pair.x + dx, y: pair.y + dy } : pair;
  }));
}

function mapActiveAfterClear(board: GameState['board'], rows: readonly number[], active: ActivePiece | null): ActivePiece | null {
  if (!active) return null;
  const before = cellsForPiece(active);
  const after = mapCellsAfterClear(board, rows, before);
  if (after.length !== before.length) return active;
  const dx = after[0]!.x - before[0]!.x;
  const dy = after[0]!.y - before[0]!.y;
  return after.every((cell, index) => (
    cell.x - before[index]!.x === dx && cell.y - before[index]!.y === dy
  ))
    ? { ...active, x: active.x + dx, y: active.y + dy }
    : active;
}

function shiftSurvivalMovers(state: GameState, deltaY: number): {
  active: ActivePiece | null;
  survivalDebris: readonly SurvivalDebris[];
  overflow: boolean;
} {
  const active = state.active ? { ...state.active, y: state.active.y + deltaY } : null;
  const survivalDebris = Object.freeze(state.survivalDebris.map((pair) => ({ ...pair, y: pair.y + deltaY })));
  const activeOverflow = active !== null && cellsForPiece(active).some((cell) => cell.y < 0 || cell.y >= BOARD_HEIGHT);
  const debrisOverflow = survivalDebris.some((pair) => pair.y < 0 || pair.y + 1 >= BOARD_HEIGHT);
  return { active, survivalDebris, overflow: activeOverflow || debrisOverflow };
}

function lowerSurvivalBedrock(state: GameState, count: number): { state: GameState; removed: number } {
  const lowered = lowerBedrock(state.board, count);
  if (lowered.removed === 0) return { state, removed: 0 };
  const movers = shiftSurvivalMovers(state, lowered.removed);
  return {
    state: {
      ...state,
      board: lowered.board,
      active: movers.active,
      survivalDebris: movers.survivalDebris,
      survivalBedrockRows: Math.max(0, state.survivalBedrockRows - lowered.removed),
    },
    removed: lowered.removed,
  };
}

/** Restores and respawns the latest locked Puzzle piece from its normal top entry. */
function undoPuzzle(state: GameState): GameTransition {
  if (state.mode !== 'puzzle' || state.status === 'finished') return { state, events: [] };
  if (state.status !== 'playing' && state.status !== 'paused' && state.status !== 'game-over') return { state, events: [] };
  const checkpoint = state.puzzleUndoHistory.at(-1);
  if (!checkpoint) return { state, events: [] };

  const restored: GameState = {
    // Start from the current shape so JSON-backed state hashes retain their
    // canonical property order while checkpoint values replace every field.
    ...state,
    ...checkpoint,
    status: state.status === 'paused' ? 'paused' : 'playing',
    puzzleUndoHistory: Object.freeze(state.puzzleUndoHistory.slice(0, -1)),
    puzzleActiveSpawnCheckpoint: null,
  };
  const respawned = spawnPiece(restored);
  return {
    state: respawned.state,
    events: [...respawned.events, { type: 'puzzle-undone' }],
  };
}

/** Creates a self-contained pre-spawn checkpoint without recursively retaining undo state. */
function puzzleUndoCheckpoint(state: GameState): PuzzleUndoSnapshot {
  const {
    puzzleUndoHistory: _puzzleUndoHistory,
    puzzleActiveSpawnCheckpoint: _puzzleActiveSpawnCheckpoint,
    ...checkpoint
  } = state;
  return checkpoint;
}

function appendPuzzleUndoCheckpoint(state: GameState, checkpoint: PuzzleUndoSnapshot | null): GameState {
  if (checkpoint === null) return state;
  return {
    ...state,
    puzzleUndoHistory: Object.freeze([...state.puzzleUndoHistory, checkpoint]),
  };
}

interface SurvivalRiseResolution extends GameTransition {
  overflow: boolean;
}

function resolvePendingSurvivalRise(state: GameState, deferOverflow = false): SurvivalRiseResolution {
  if (state.mode !== 'race' || !state.survivalRisePending) return { state, events: [], overflow: false };
  const raised = raiseBedrock(state.board, 1);
  const movers = shiftSurvivalMovers(state, -raised.added);
  const next: GameState = {
    ...state,
    board: raised.board,
    active: movers.active,
    survivalDebris: movers.survivalDebris,
    survivalBedrockRows: state.survivalBedrockRows + raised.added,
    survivalPressureTicks: 0,
    survivalRisePending: false,
  };
  const events: GameEvent[] = raised.added > 0
    ? [{ type: 'bedrock-raised', count: raised.added, height: next.survivalBedrockRows }]
    : [];
  const overflow = raised.overflow || movers.overflow;
  if (!overflow || deferOverflow) return { state: next, events, overflow };
  return {
    state: { ...next, active: null, status: 'game-over', phase: 'active' },
    events: [...events, { type: 'game-over', reason: 'bedrock-overflow' }],
    overflow: true,
  };
}

function moveActive(state: GameState, dx: number, dy: number, cause: 'move' | 'gravity' | 'soft-drop'): GameTransition {
  if (!withActive(state)) return { state, events: [] };
  const candidate = { ...state.active, x: state.active.x + dx, y: state.active.y + dy };
  if (!canPlaceInState(state, candidate)) return { state, events: [] };

  const wasGrounded = isGroundedInState(state, state.active);
  const remainsGrounded = isGroundedInState(state, candidate);
  const canReset = cause === 'move' && wasGrounded && state.lockResets < MAX_LOCK_RESETS;

  return {
    state: {
      ...state,
      active: candidate,
      gravityTicks: dy > 0 ? 0 : state.gravityTicks,
      lockTicks: remainsGrounded ? (canReset ? 0 : state.lockTicks) : 0,
      lockResets: canReset ? state.lockResets + 1 : state.lockResets,
      score: cause === 'soft-drop' ? state.score + 1 : state.score,
    },
    events: [{ type: 'piece-moved', piece: candidate.type, dx, dy, cause }],
  };
}

function mutationScoreMultiplier(state: GameState): number {
  if (state.mode !== 'sprint' || state.mutationMultiplierTicks <= 0) return 1;
  return state.mutationMultiplierFactor === 4 ? 4 : 2;
}

function bottomBombRows(): number[] {
  return Array.from({ length: MUTATION_BOMB_ROWS }, (_, index) => BOARD_HEIGHT - MUTATION_BOMB_ROWS + index);
}

interface MutationActivation {
  state: GameState;
  events: GameEvent[];
}

/**
 * Applies every carrier triggered by one resolved clear. Bombs may remove another
 * carrier, so the deterministic queue handles that finite chain without a second
 * render or browser-timing pass.
 */
function activateMutationCarriers(state: GameState, triggered: readonly MutationCarrier[]): MutationActivation {
  if (state.mode !== 'sprint' || triggered.length === 0) return { state, events: [] };

  let next = state;
  const events: GameEvent[] = [];
  const pending = [...triggered];
  const queued = new Set(triggered.map((carrier) => carrier.id));
  const activated = new Set<number>();

  while (pending.length > 0) {
    const carrier = pending.shift();
    if (!carrier || activated.has(carrier.id)) continue;
    activated.add(carrier.id);
    next = {
      ...next,
      mutationCarriers: withoutMutationCarriers(next.mutationCarriers, [carrier]),
    };

    let durationTicks = 0;
    let score = 0;
    let rowsRemoved = 0;
    if (carrier.item === 'freeze') {
      // A fresh carrier never stacks latent play time. The player gets a clear,
      // repeatable ten-second window from the instant this effect resolves.
      durationTicks = MUTATION_EFFECT_TICKS;
      next = { ...next, mutationFreezeTicks: durationTicks };
    } else if (carrier.item === 'collapse') {
      durationTicks = MUTATION_EFFECT_TICKS;
      next = { ...next, mutationCollapseTicks: durationTicks };
    } else if (carrier.item === 'multiplier') {
      const wasActive = next.mutationMultiplierTicks > 0;
      durationTicks = MUTATION_EFFECT_TICKS;
      next = {
        ...next,
        mutationMultiplierTicks: durationTicks,
        mutationMultiplierFactor: wasActive ? 4 : 2,
      };
    } else {
      const rows = bottomBombRows();
      const bombTriggered = mutationCarriersClearedByRows(next.mutationCarriers, rows);
      score = MUTATION_BOMB_SCORE * mutationScoreMultiplier(next);
      rowsRemoved = rows.length;
      next = {
        ...next,
        board: clearRows(next.board, rows),
        mutationCarriers: mapMutationCarriersAfterClear(
          next.board,
          rows,
          withoutMutationCarriers(next.mutationCarriers, bombTriggered),
        ),
        score: next.score + score,
        lines: next.lines + rowsRemoved,
      };
      events.push({ type: 'lines-cleared', rows, count: rowsRemoved, score });
      for (const candidate of bombTriggered) {
        if (!activated.has(candidate.id) && !queued.has(candidate.id)) {
          queued.add(candidate.id);
          pending.push(candidate);
        }
      }
    }

    next = {
      ...next,
      mutationLastItem: carrier.item,
      mutationLastItemTicks: durationTicks > 0 ? durationTicks : MUTATION_RESULT_TICKS,
    };
    const multiplierFactor = carrier.item === 'multiplier'
      ? (next.mutationMultiplierFactor === 4 ? 4 : 2)
      : undefined;
    events.push({
      type: 'mutation-activated',
      item: carrier.item,
      durationTicks,
      score,
      rowsRemoved,
      triggerCells: carrier.cells,
      ...(multiplierFactor === undefined ? {} : { multiplierFactor }),
    });
  }
  return { state: next, events };
}

function advanceMutationEffects(state: GameState): GameState {
  if (state.mode !== 'sprint') return state;
  const mutationMultiplierTicks = Math.max(0, state.mutationMultiplierTicks - 1);
  return {
    ...state,
    mutationFreezeTicks: Math.max(0, state.mutationFreezeTicks - 1),
    mutationCollapseTicks: Math.max(0, state.mutationCollapseTicks - 1),
    mutationMultiplierTicks,
    mutationMultiplierFactor: mutationMultiplierTicks > 0 ? state.mutationMultiplierFactor : 1,
    mutationLastItemTicks: Math.max(0, state.mutationLastItemTicks - 1),
  };
}

function lockActive(
  state: GameState,
  extraEvents: GameEvent[] = [],
): GameTransition {
  if (!withActive(state)) return { state, events: extraEvents };
  const undoCheckpoint = state.mode === 'puzzle' ? state.puzzleActiveSpawnCheckpoint : null;
  const cells = cellsForPiece(state.active);
  if (cells.some((cell) => cell.y < 0 || cell.y >= BOARD_HEIGHT)) return invalidState(state);
  let board = mergePiece(state.board, state.active);
  const pieceCount = state.pieceCount + 1;
  const lockedEvent: GameEvent = { type: 'piece-locked', piece: state.active.type, cells };
  let mutationCarriers = state.mutationCarriers;
  if (state.mode === 'sprint') {
    if (state.mutationActiveCarrier !== null) {
      mutationCarriers = Object.freeze([
        ...mutationCarriers,
        {
          id: state.mutationActiveCarrier.id,
          item: state.mutationActiveCarrier.item,
          cells: Object.freeze(cells.map((cell) => ({ ...cell }))),
        },
      ]);
    }
    if (state.mutationCollapseTicks > 0) {
      const collapsed = collapseSprintColumns(board);
      mutationCarriers = collapseMutationCarriers(collapsed.settledRowBySource, mutationCarriers);
      board = collapsed.board;
    }
  }
  const lockedState: GameState = {
    ...state,
    board,
    active: null,
    pieceCount,
    mutationActiveCarrier: null,
    mutationCarriers,
    puzzleActiveSpawnCheckpoint: null,
  };
  const rows = fullRows(board);
  const lockOut = cells.every((cell) => cell.y < VISIBLE_START_ROW) && rows.length === 0;

  if (lockOut) {
    if (state.mode === 'puzzle') {
      const failed = puzzleFailure(lockedState, 'failed-top-out', 'lock-out');
      return {
        state: appendPuzzleUndoCheckpoint(failed.state, undoCheckpoint),
        events: [...extraEvents, lockedEvent, ...failed.events],
      };
    }
    return {
      state: { ...lockedState, status: 'game-over', combo: 0 },
      events: [...extraEvents, lockedEvent, { type: 'game-over', reason: 'lock-out' }],
    };
  }

  if (rows.length > 0) {
    const clearing: GameState = {
      ...lockedState,
      phase: 'line-clear',
      phaseTicks: 0,
      pendingClearRows: rows,
      gravityTicks: 0,
      lockTicks: 0,
    };
    return {
      state: appendPuzzleUndoCheckpoint(clearing, undoCheckpoint),
      events: [...extraEvents, lockedEvent, { type: 'clear-started', rows }],
    };
  }

  if (state.mode === 'sprint') {
    return {
      state: {
        ...lockedState,
        phase: 'entry',
        phaseTicks: 0,
        gravityTicks: 0,
        lockTicks: 0,
        lockResets: 0,
        combo: 0,
      },
      events: [...extraEvents, lockedEvent],
    };
  }

  if (state.mode === 'puzzle') {
    const resolved = resolvePuzzleAfterLock({
      ...lockedState,
      phase: 'active',
      phaseTicks: 0,
      pendingClearRows: [],
      gravityTicks: 0,
      lockTicks: 0,
      lockResets: 0,
      combo: 0,
    }, false);
    return {
      state: appendPuzzleUndoCheckpoint(resolved.state, undoCheckpoint),
      events: [...extraEvents, lockedEvent, ...resolved.events],
    };
  }

  if (state.mode === 'race') {
    const resolved = resolvePendingSurvivalRise({
      ...lockedState,
      phase: 'active',
      phaseTicks: 0,
      pendingClearRows: [],
      gravityTicks: 0,
      lockTicks: 0,
      lockResets: 0,
      combo: 0,
    });
    if (resolved.state.status === 'game-over') {
      return { state: resolved.state, events: [...extraEvents, lockedEvent, ...resolved.events] };
    }
    return {
      state: { ...resolved.state, phase: 'entry' },
      events: [...extraEvents, lockedEvent, ...resolved.events],
    };
  }

  return {
    state: {
      ...lockedState,
      phase: 'entry',
      phaseTicks: 0,
      gravityTicks: 0,
      lockTicks: 0,
      combo: 0,
    },
    events: [...extraEvents, lockedEvent],
  };
}

function hardDrop(state: GameState): GameTransition {
  if (!withActive(state)) return { state, events: [] };
  let distance = 0;
  let candidate = state.active;
  while (canPlaceInState(state, { ...candidate, y: candidate.y + 1 })) {
    candidate = { ...candidate, y: candidate.y + 1 };
    distance += 1;
  }
  const next = { ...state, active: candidate, score: state.score + distance * 2 };
  return lockActive(next, [{ type: 'hard-dropped', piece: candidate.type, distance }]);
}

function rotate(state: GameState, direction: -1 | 1): GameTransition {
  if (!withActive(state)) return { state, events: [] };
  const target = nextRotation(state.active.rotation, direction);
  const wasGrounded = isGroundedInState(state, state.active);
  for (const kick of kickTests(state.active, target)) {
    const candidate: ActivePiece = {
      ...state.active,
      rotation: target,
      x: state.active.x + kick.x,
      y: state.active.y + kick.y,
    };
    if (!canPlaceInState(state, candidate)) continue;
    const remainsGrounded = isGroundedInState(state, candidate);
    const canReset = wasGrounded && state.lockResets < MAX_LOCK_RESETS;
    return {
      state: {
        ...state,
        active: candidate,
        lockTicks: remainsGrounded ? (canReset ? 0 : state.lockTicks) : 0,
        lockResets: canReset ? state.lockResets + 1 : state.lockResets,
      },
      events: [{ type: 'piece-rotated', piece: candidate.type, direction }],
    };
  }
  return { state, events: [] };
}

function finishLineClear(state: GameState): GameTransition {
  const rows = [...state.pendingClearRows];
  const count = rows.length;
  const lines = state.lines + count;
  const combo = state.mode === 'marathon' ? state.combo + 1 : 0;
  const comboBonus = state.mode === 'marathon' ? 50 * Math.max(0, combo - 1) : 0;
  const level = state.mode === 'puzzle' ? Math.floor(lines / 10) : 0;
  const baseScore = LINE_CLEAR_BASE_SCORE[count] ?? 0;
  const clearScore = state.mode === 'puzzle'
    ? baseScore * (level + 1)
    : state.mode === 'sprint'
      ? baseScore * mutationScoreMultiplier(state)
      : baseScore + comboBonus;
  const triggeredCarriers = state.mode === 'sprint'
    ? mutationCarriersClearedByRows(state.mutationCarriers, rows)
    : Object.freeze([]);
  const activeAfterClear = state.mode === 'race'
    ? mapActiveAfterClear(state.board, rows, state.active)
    : state.active;
  const debrisAfterClear = state.mode === 'race'
    ? mapSurvivalDebrisAfterClear(state.board, rows, state.survivalDebris)
    : state.survivalDebris;
  let cleared: GameState = {
    ...state,
    board: clearRows(state.board, rows),
    active: activeAfterClear,
    survivalDebris: debrisAfterClear,
    puzzleTargetCells: state.mode === 'puzzle' ? mapCellsAfterClear(state.board, rows, state.puzzleTargetCells) : state.puzzleTargetCells,
    mutationCarriers: state.mode === 'sprint'
      ? mapMutationCarriersAfterClear(
        state.board,
        rows,
        withoutMutationCarriers(state.mutationCarriers, triggeredCarriers),
      )
      : state.mutationCarriers,
    score: state.score + clearScore,
    lines,
    combo,
    level,
    pendingClearRows: [],
    phaseTicks: 0,
  };
  const events: GameEvent[] = [{ type: 'lines-cleared', rows, count, score: clearScore }];
  if (state.mode === 'puzzle' && level > state.level) events.push({ type: 'level-up', level });
  if (cleared.mode === 'puzzle') {
    const resolved = resolvePuzzleAfterLock(cleared, true);
    return { state: resolved.state, events: [...events, ...resolved.events] };
  }
  if (cleared.mode === 'sprint') {
    const activated = activateMutationCarriers(cleared, triggeredCarriers);
    const spawned = spawnPiece(activated.state);
    return { state: spawned.state, events: [...events, ...activated.events, ...spawned.events] };
  }
  if (cleared.mode === 'race') {
    const risen = resolvePendingSurvivalRise(cleared, true);
    cleared = risen.state;
    events.push(...risen.events);

    const crossedRewardThresholds = Math.floor(lines / SURVIVAL_LINES_PER_BEDROCK)
      - Math.floor(state.lines / SURVIVAL_LINES_PER_BEDROCK);
    if (crossedRewardThresholds > 0) {
      const lowered = lowerSurvivalBedrock(cleared, crossedRewardThresholds);
      cleared = {
        ...lowered.state,
        survivalPressureTicks: 0,
        survivalRisePending: false,
      };
      if (lowered.removed > 0) {
        events.push({ type: 'bedrock-lowered', count: lowered.removed, height: cleared.survivalBedrockRows });
      }
    }
    if (risen.overflow && crossedRewardThresholds === 0) {
      return {
        state: { ...cleared, active: null, status: 'game-over', phase: 'active' },
        events: [...events, { type: 'game-over', reason: 'bedrock-overflow' }],
      };
    }
    if (cleared.active !== null) {
      return {
        state: {
          ...cleared,
          phase: 'active',
          phaseTicks: 0,
          gravityTicks: 0,
          lockTicks: 0,
          lockResets: 0,
        },
        events,
      };
    }
  }
  const spawned = spawnPiece(cleared);
  return { state: spawned.state, events: [...events, ...spawned.events] };
}

function tick(state: GameState): GameTransition {
  if (state.status !== 'playing') return { state, events: [] };
  const freezeGravityActive = state.mode === 'sprint' && state.mutationFreezeTicks > 0;
  const debris = advanceSurvivalDebris(
    advanceMutationEffects(advanceSurvivalPressure({ ...state, elapsedTicks: state.elapsedTicks + 1 })),
  );
  let next: GameState = debris.state;
  const timedEvents: GameEvent[] = [...debris.events];

  // A stone-created row receives a full visible clear interval before its first
  // countdown tick, matching a player-created clear rather than skipping the cue.
  if (debris.startedLineClear) return { state: next, events: timedEvents };

  if (next.phase === 'entry') {
    const phaseTicks = next.phaseTicks + 1;
    if (phaseTicks >= ENTRY_DELAY_TICKS) {
      const resolved = resolvePendingSurvivalRise({ ...next, phaseTicks: 0 });
      if (resolved.state.status === 'game-over') return { state: resolved.state, events: [...timedEvents, ...resolved.events] };
      const spawned = spawnPiece(resolved.state);
      return { state: spawned.state, events: [...timedEvents, ...resolved.events, ...spawned.events] };
    }
    return { state: { ...next, phaseTicks }, events: timedEvents };
  }

  if (next.phase === 'line-clear') {
    const phaseTicks = next.phaseTicks + 1;
    if (phaseTicks >= LINE_CLEAR_DELAY_TICKS) {
      const finished = finishLineClear(next);
      return { state: finished.state, events: [...timedEvents, ...finished.events] };
    }
    return { state: { ...next, phaseTicks }, events: timedEvents };
  }

  if (!withActive(next)) {
    const invalid = invalidState(next);
    return { state: invalid.state, events: [...timedEvents, ...invalid.events] };
  }

  if (isGroundedInState(next, next.active)) {
    next = { ...next, lockTicks: next.lockTicks + 1 };
    if (next.lockTicks >= LOCK_DELAY_TICKS) {
      const locked = lockActive(next);
      return { state: locked.state, events: [...timedEvents, ...locked.events] };
    }
  } else if (next.lockTicks !== 0) {
    next = { ...next, lockTicks: 0 };
  }

  const gravityTicks = next.gravityTicks + 1;
  const gravityInterval = freezeGravityActive
    ? MUTATION_FREEZE_GRAVITY_TICKS
    : gravityForMode(next.mode, next.level, next.pieceCount, next.lines);
  if (gravityTicks >= gravityInterval) {
    const moved = moveActive({ ...next, gravityTicks: 0 }, 0, 1, 'gravity');
    return { state: moved.state, events: [...timedEvents, ...moved.events] };
  }
  return { state: { ...next, gravityTicks }, events: timedEvents };
}

export function dispatch(state: GameState, command: GameCommand): GameTransition {
  if (command.type === 'restart') {
    return {
      state: createInitialState(command.seed ?? state.seed, command.mode ?? state.mode, command.puzzleId ?? state.puzzleId ?? undefined),
      events: [{ type: 'restarted' }],
    };
  }
  if (command.type === 'start' && state.status === 'ready') {
    return { state: { ...state, status: 'playing' }, events: [{ type: 'started' }] };
  }
  if (command.type === 'pause' && state.status === 'playing') {
    return { state: { ...state, status: 'paused' }, events: [{ type: 'paused' }] };
  }
  if (command.type === 'resume' && state.status === 'paused') {
    return { state: { ...state, status: 'playing' }, events: [{ type: 'resumed' }] };
  }
  if (command.type === 'undo') return undoPuzzle(state);
  if (command.type === 'tick') return tick(state);
  if (state.status !== 'playing' || state.phase !== 'active') return { state, events: [] };

  switch (command.type) {
    case 'move':
      return moveActive(state, command.dx, 0, 'move');
    case 'soft-drop':
      return moveActive(state, 0, 1, 'soft-drop');
    case 'hard-drop':
      return hardDrop(state);
    case 'rotate':
      return rotate(state, command.direction);
    default:
      return { state, events: [] };
  }
}

export function dropDistance(state: GameState): number {
  if (!withActive(state)) return 0;
  let distance = 0;
  while (canPlaceInState(state, { ...state.active, y: state.active.y + distance + 1 })) distance += 1;
  return distance;
}

export function replay(seed: number, commands: readonly GameCommand[], mode: GameMode = 'marathon', puzzleId?: PuzzleId): GameState {
  return commands.reduce((state, command) => dispatch(state, command).state, createInitialState(seed, mode, puzzleId));
}

export function stateHash(state: GameState): string {
  // Mode-private fields stay out of unrelated replays so the established Classic,
  // Survival, and Puzzle hash domains remain stable. 异变 keeps its item/timer state
  // in its own canonical payload because that state changes legal future play.
  const canonicalState = state.mode === 'puzzle'
    ? (() => {
      const {
        combo: _combo,
        survivalBedrockRows: _survivalBedrockRows,
        survivalPressureTicks: _survivalPressureTicks,
        survivalRisePending: _survivalRisePending,
        survivalDebris: _survivalDebris,
        survivalDebrisNextId: _survivalDebrisNextId,
        survivalDebrisIntervalTicks: _survivalDebrisIntervalTicks,
        survivalDebrisIntervalSeconds: _survivalDebrisIntervalSeconds,
        survivalDebrisWarningColumns: _survivalDebrisWarningColumns,
        survivalDebrisFallProgress: _survivalDebrisFallProgress,
        survivalDebrisRandomizer: _survivalDebrisRandomizer,
        mutationActiveCarrier: _mutationActiveCarrier,
        mutationRandomizer: _mutationRandomizer,
        mutationCarriers: _mutationCarriers,
        mutationNextCarrierId: _mutationNextCarrierId,
        mutationFreezeTicks: _mutationFreezeTicks,
        mutationCollapseTicks: _mutationCollapseTicks,
        mutationMultiplierTicks: _mutationMultiplierTicks,
        mutationMultiplierFactor: _mutationMultiplierFactor,
        mutationLastItem: _mutationLastItem,
        mutationLastItemTicks: _mutationLastItemTicks,
        puzzleUndoHistory: _puzzleUndoHistory,
        puzzleActiveSpawnCheckpoint: _puzzleActiveSpawnCheckpoint,
        ...puzzleState
      } = state;
      return puzzleState;
    })()
    : (() => {
      const {
        puzzleBoardRows: _puzzleBoardRows,
        puzzleTargetCells: _puzzleTargetCells,
        puzzleInitialTargetCount: _puzzleInitialTargetCount,
        puzzleQueue: _puzzleQueue,
        puzzleQueueIndex: _puzzleQueueIndex,
        puzzleSpawnCount: _puzzleSpawnCount,
        puzzleGoal: _puzzleGoal,
        puzzleCompletion: _puzzleCompletion,
        puzzleUndoHistory: _puzzleUndoHistory,
        puzzleActiveSpawnCheckpoint: _puzzleActiveSpawnCheckpoint,
        completedLevelId: _completedLevelId,
        nextUnlockedLevelId: _nextUnlockedLevelId,
        ...legacyState
      } = state;
      if (state.mode === 'marathon') {
        const {
          survivalBedrockRows: _survivalBedrockRows,
          survivalPressureTicks: _survivalPressureTicks,
          survivalRisePending: _survivalRisePending,
          survivalDebris: _survivalDebris,
          survivalDebrisNextId: _survivalDebrisNextId,
          survivalDebrisIntervalTicks: _survivalDebrisIntervalTicks,
          survivalDebrisIntervalSeconds: _survivalDebrisIntervalSeconds,
          survivalDebrisWarningColumns: _survivalDebrisWarningColumns,
          survivalDebrisFallProgress: _survivalDebrisFallProgress,
          survivalDebrisRandomizer: _survivalDebrisRandomizer,
          mutationActiveCarrier: _mutationActiveCarrier,
          mutationRandomizer: _mutationRandomizer,
          mutationCarriers: _mutationCarriers,
          mutationNextCarrierId: _mutationNextCarrierId,
          mutationFreezeTicks: _mutationFreezeTicks,
          mutationCollapseTicks: _mutationCollapseTicks,
          mutationMultiplierTicks: _mutationMultiplierTicks,
          mutationMultiplierFactor: _mutationMultiplierFactor,
          mutationLastItem: _mutationLastItem,
          mutationLastItemTicks: _mutationLastItemTicks,
          ...classicState
        } = legacyState;
        return classicState;
      }
      if (state.mode === 'sprint') {
        const {
          combo: _combo,
          survivalBedrockRows: _survivalBedrockRows,
          survivalPressureTicks: _survivalPressureTicks,
          survivalRisePending: _survivalRisePending,
          survivalDebris: _survivalDebris,
          survivalDebrisNextId: _survivalDebrisNextId,
          survivalDebrisIntervalTicks: _survivalDebrisIntervalTicks,
          survivalDebrisIntervalSeconds: _survivalDebrisIntervalSeconds,
          survivalDebrisWarningColumns: _survivalDebrisWarningColumns,
          survivalDebrisFallProgress: _survivalDebrisFallProgress,
          survivalDebrisRandomizer: _survivalDebrisRandomizer,
          ...sprintState
        } = legacyState;
        return sprintState;
      }
      const {
        combo: _combo,
        mutationActiveCarrier: _mutationActiveCarrier,
        mutationRandomizer: _mutationRandomizer,
        mutationCarriers: _mutationCarriers,
        mutationNextCarrierId: _mutationNextCarrierId,
        mutationFreezeTicks: _mutationFreezeTicks,
        mutationCollapseTicks: _mutationCollapseTicks,
        mutationMultiplierTicks: _mutationMultiplierTicks,
        mutationMultiplierFactor: _mutationMultiplierFactor,
        mutationLastItem: _mutationLastItem,
        mutationLastItemTicks: _mutationLastItemTicks,
        ...survivalState
      } = legacyState;
      return survivalState;
    })();
  const canonical = JSON.stringify(canonicalState);
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
