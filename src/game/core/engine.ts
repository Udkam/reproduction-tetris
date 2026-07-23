import {
  BOARD_HEIGHT,
  ENTRY_DELAY_TICKS,
  LINE_CLEAR_BASE_SCORE,
  LINE_CLEAR_DELAY_TICKS,
  LOCK_DELAY_TICKS,
  MUTATION_BOMB_ROWS,
  MUTATION_BOMB_SCORE,
  MUTATION_CARRIER_CHANCE,
  MUTATION_EFFECT_TICKS,
  MUTATION_RESULT_TICKS,
  MAX_LOCK_RESETS,
  NEXT_QUEUE_SIZE,
  INITIAL_SURVIVAL_BEDROCK_ROWS,
  SURVIVAL_LINES_PER_BEDROCK,
  VISIBLE_START_ROW,
  gravityForMode,
  survivalIntervalTicks,
} from './constants';
import { canPlace, clearRows, createBoard, fullRows, isGrounded, lowerBedrock, mapCellsAfterClear, mergePiece, raiseBedrock } from './board';
import { cellsForPiece, createSpawnPiece, nextRotation } from './pieces';
import { createPuzzleBoard, defaultPuzzleId, getPuzzleDefinition, nextPuzzleId, originalTargetCells } from './puzzles';
import { createRandomizer, drawPiece, drawRandom } from './random';
import { kickTests } from './rotation';
import { collapseSprintColumns } from './sprint';
import { collapseMutationCarriers, mapMutationCarriersAfterClear, mutationCarriersClearedByRows } from './mutation';
import { type ActivePiece, type GameCommand, type GameEvent, type GameMode, type GameState, type GameTransition, type MutationCarrier, type MutationItem, type PieceType, type PuzzleCompletion, type PuzzleId, type PuzzleUndoSnapshot } from './types';

const MUTATION_ITEMS: readonly MutationItem[] = Object.freeze(['freeze', 'collapse', 'bomb', 'multiplier']);

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
function assignMutationCarrier(state: GameState): GameState {
  if (state.mode !== 'sprint' || state.pieceCount < 2) {
    return state.mutationActiveCarrier === null ? state : { ...state, mutationActiveCarrier: null };
  }
  const chance = drawRandom(state.randomizer);
  if (chance.value >= MUTATION_CARRIER_CHANCE) {
    return { ...state, randomizer: chance.randomizer, mutationActiveCarrier: null };
  }
  const itemRoll = drawRandom(chance.randomizer);
  const item = MUTATION_ITEMS[Math.floor(itemRoll.value * MUTATION_ITEMS.length)] ?? 'freeze';
  return {
    ...state,
    randomizer: itemRoll.randomizer,
    mutationActiveCarrier: { id: state.mutationNextCarrierId, item },
    mutationNextCarrierId: state.mutationNextCarrierId + 1,
  };
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
  let next = refillQueue(state, type ? NEXT_QUEUE_SIZE : NEXT_QUEUE_SIZE + 1);
  const queue = [...next.queue];
  const pieceType = type ?? queue.shift();
  if (!pieceType) return invalidState(next);
  next = refillQueue({ ...next, queue }, NEXT_QUEUE_SIZE);
  const active = createSpawnPiece(pieceType);
  next = assignMutationCarrier(next);
  if (!canPlace(next.board, active)) {
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
    completedLevelId: null,
    nextUnlockedLevelId: null,
    pieceCount: 0,
    survivalBedrockRows: openingBedrock?.added ?? 0,
    survivalPressureTicks: 0,
    survivalRisePending: false,
    mutationActiveCarrier: null,
    mutationCarriers: Object.freeze([]),
    mutationNextCarrierId: 1,
    mutationFreezeTicks: 0,
    mutationCollapseTicks: 0,
    mutationMultiplierTicks: 0,
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

/** Restores the latest pre-lock Puzzle checkpoint. Finished levels remain terminal. */
function undoPuzzle(state: GameState): GameTransition {
  if (state.mode !== 'puzzle' || state.status === 'finished') return { state, events: [] };
  if (state.status !== 'playing' && state.status !== 'paused' && state.status !== 'game-over') return { state, events: [] };
  const checkpoint = state.puzzleUndoHistory.at(-1);
  if (!checkpoint) return { state, events: [] };

  return {
    state: {
      // Start from the current shape so JSON-backed state hashes retain their
      // canonical property order while checkpoint values replace every field.
      ...state,
      ...checkpoint,
      // Undo from Pause stays paused; recovery from top-out returns to the live checkpoint.
      status: state.status === 'paused' ? 'paused' : checkpoint.status,
      puzzleUndoHistory: Object.freeze(state.puzzleUndoHistory.slice(0, -1)),
    },
    events: [{ type: 'puzzle-undone' }],
  };
}

/** Creates a self-contained pre-lock checkpoint without recursively retaining prior histories. */
function puzzleUndoCheckpoint(state: GameState): PuzzleUndoSnapshot {
  const { puzzleUndoHistory: _puzzleUndoHistory, ...checkpoint } = state;
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
  const next: GameState = {
    ...state,
    board: raised.board,
    survivalBedrockRows: state.survivalBedrockRows + raised.added,
    survivalPressureTicks: 0,
    survivalRisePending: false,
  };
  const events: GameEvent[] = raised.added > 0
    ? [{ type: 'bedrock-raised', count: raised.added, height: next.survivalBedrockRows }]
    : [];
  if (!raised.overflow || deferOverflow) return { state: next, events, overflow: raised.overflow };
  return {
    state: { ...next, active: null, status: 'game-over', phase: 'active' },
    events: [...events, { type: 'game-over', reason: 'bedrock-overflow' }],
    overflow: true,
  };
}

function moveActive(state: GameState, dx: number, dy: number, cause: 'move' | 'gravity' | 'soft-drop'): GameTransition {
  if (!withActive(state)) return { state, events: [] };
  const candidate = { ...state.active, x: state.active.x + dx, y: state.active.y + dy };
  if (!canPlace(state.board, candidate)) return { state, events: [] };

  const wasGrounded = isGrounded(state.board, state.active);
  const remainsGrounded = isGrounded(state.board, candidate);
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
  return state.mode === 'sprint' && state.mutationMultiplierTicks > 0 ? 2 : 1;
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
  const pending = triggered.map((carrier) => carrier.id);
  const queued = new Set(pending);
  const activated = new Set<number>();

  while (pending.length > 0) {
    const id = pending.shift();
    if (id === undefined || activated.has(id)) continue;
    const carrier = next.mutationCarriers.find((candidate) => candidate.id === id);
    if (!carrier) continue;
    activated.add(id);
    next = {
      ...next,
      mutationCarriers: Object.freeze(next.mutationCarriers.filter((candidate) => candidate.id !== id)),
    };

    let durationTicks = 0;
    let score = 0;
    let rowsRemoved = 0;
    if (carrier.item === 'freeze') {
      durationTicks = MUTATION_EFFECT_TICKS;
      next = { ...next, mutationFreezeTicks: Math.max(next.mutationFreezeTicks, durationTicks) };
    } else if (carrier.item === 'collapse') {
      durationTicks = MUTATION_EFFECT_TICKS;
      next = { ...next, mutationCollapseTicks: Math.max(next.mutationCollapseTicks, durationTicks) };
    } else if (carrier.item === 'multiplier') {
      durationTicks = MUTATION_EFFECT_TICKS;
      next = { ...next, mutationMultiplierTicks: Math.max(next.mutationMultiplierTicks, durationTicks) };
    } else {
      const rows = bottomBombRows();
      const bombTriggered = mutationCarriersClearedByRows(next.mutationCarriers, rows);
      score = MUTATION_BOMB_SCORE * mutationScoreMultiplier(next);
      rowsRemoved = rows.length;
      next = {
        ...next,
        board: clearRows(next.board, rows),
        mutationCarriers: mapMutationCarriersAfterClear(next.board, rows, next.mutationCarriers),
        score: next.score + score,
        lines: next.lines + rowsRemoved,
      };
      events.push({ type: 'lines-cleared', rows, count: rowsRemoved, score });
      for (const candidate of bombTriggered) {
        if (!activated.has(candidate.id) && !queued.has(candidate.id)) {
          queued.add(candidate.id);
          pending.push(candidate.id);
        }
      }
    }

    next = {
      ...next,
      mutationLastItem: carrier.item,
      mutationLastItemTicks: durationTicks > 0 ? durationTicks : MUTATION_RESULT_TICKS,
    };
    events.push({ type: 'mutation-activated', item: carrier.item, durationTicks, score, rowsRemoved });
  }
  return { state: next, events };
}

function advanceMutationEffects(state: GameState): GameState {
  if (state.mode !== 'sprint') return state;
  return {
    ...state,
    mutationFreezeTicks: Math.max(0, state.mutationFreezeTicks - 1),
    mutationCollapseTicks: Math.max(0, state.mutationCollapseTicks - 1),
    mutationMultiplierTicks: Math.max(0, state.mutationMultiplierTicks - 1),
    mutationLastItemTicks: Math.max(0, state.mutationLastItemTicks - 1),
  };
}

function lockActive(
  state: GameState,
  extraEvents: GameEvent[] = [],
  checkpointBeforeLock?: PuzzleUndoSnapshot,
): GameTransition {
  if (!withActive(state)) return { state, events: extraEvents };
  const undoCheckpoint = checkpointBeforeLock ?? (state.mode === 'puzzle' ? puzzleUndoCheckpoint(state) : null);
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
      mutationCarriers = collapseMutationCarriers(board, mutationCarriers);
      board = collapseSprintColumns(board);
    }
  }
  const lockedState: GameState = {
    ...state,
    board,
    active: null,
    pieceCount,
    mutationActiveCarrier: null,
    mutationCarriers,
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
  // Puzzle's checkpoint must predate both the hard-drop score and landing translation.
  const checkpointBeforeLock = state.mode === 'puzzle' ? puzzleUndoCheckpoint(state) : undefined;
  let distance = 0;
  let candidate = state.active;
  while (canPlace(state.board, { ...candidate, y: candidate.y + 1 })) {
    candidate = { ...candidate, y: candidate.y + 1 };
    distance += 1;
  }
  const next = { ...state, active: candidate, score: state.score + distance * 2 };
  return lockActive(next, [{ type: 'hard-dropped', piece: candidate.type, distance }], checkpointBeforeLock);
}

function rotate(state: GameState, direction: -1 | 1): GameTransition {
  if (!withActive(state)) return { state, events: [] };
  const target = nextRotation(state.active.rotation, direction);
  const wasGrounded = isGrounded(state.board, state.active);
  for (const kick of kickTests(state.active, target)) {
    const candidate: ActivePiece = {
      ...state.active,
      rotation: target,
      x: state.active.x + kick.x,
      y: state.active.y + kick.y,
    };
    if (!canPlace(state.board, candidate)) continue;
    const remainsGrounded = isGrounded(state.board, candidate);
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
  let cleared: GameState = {
    ...state,
    board: clearRows(state.board, rows),
    puzzleTargetCells: state.mode === 'puzzle' ? mapCellsAfterClear(state.board, rows, state.puzzleTargetCells) : state.puzzleTargetCells,
    mutationCarriers: state.mode === 'sprint'
      ? mapMutationCarriersAfterClear(state.board, rows, state.mutationCarriers)
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
      const lowered = lowerBedrock(cleared.board, crossedRewardThresholds);
      cleared = {
        ...cleared,
        board: lowered.board,
        survivalBedrockRows: Math.max(0, cleared.survivalBedrockRows - lowered.removed),
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
  }
  const spawned = spawnPiece(cleared);
  return { state: spawned.state, events: [...events, ...spawned.events] };
}

function tick(state: GameState): GameTransition {
  if (state.status !== 'playing') return { state, events: [] };
  let next: GameState = advanceMutationEffects(advanceSurvivalPressure({ ...state, elapsedTicks: state.elapsedTicks + 1 }));
  const timedEvents: GameEvent[] = [];

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

  if (isGrounded(next.board, next.active)) {
    next = { ...next, lockTicks: next.lockTicks + 1 };
    if (next.lockTicks >= LOCK_DELAY_TICKS) {
      const locked = lockActive(next);
      return { state: locked.state, events: [...timedEvents, ...locked.events] };
    }
  } else if (next.lockTicks !== 0) {
    next = { ...next, lockTicks: 0 };
  }

  if (next.mode === 'sprint' && next.mutationFreezeTicks > 0) {
    return { state: { ...next, gravityTicks: 0 }, events: timedEvents };
  }

  const gravityTicks = next.gravityTicks + 1;
  if (gravityTicks >= gravityForMode(next.mode, next.level, next.pieceCount, next.lines)) {
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
  while (canPlace(state.board, { ...state.active, y: state.active.y + distance + 1 })) distance += 1;
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
        mutationActiveCarrier: _mutationActiveCarrier,
        mutationCarriers: _mutationCarriers,
        mutationNextCarrierId: _mutationNextCarrierId,
        mutationFreezeTicks: _mutationFreezeTicks,
        mutationCollapseTicks: _mutationCollapseTicks,
        mutationMultiplierTicks: _mutationMultiplierTicks,
        mutationLastItem: _mutationLastItem,
        mutationLastItemTicks: _mutationLastItemTicks,
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
        completedLevelId: _completedLevelId,
        nextUnlockedLevelId: _nextUnlockedLevelId,
        ...legacyState
      } = state;
      if (state.mode === 'marathon') {
        const {
          survivalBedrockRows: _survivalBedrockRows,
          survivalPressureTicks: _survivalPressureTicks,
          survivalRisePending: _survivalRisePending,
          mutationActiveCarrier: _mutationActiveCarrier,
          mutationCarriers: _mutationCarriers,
          mutationNextCarrierId: _mutationNextCarrierId,
          mutationFreezeTicks: _mutationFreezeTicks,
          mutationCollapseTicks: _mutationCollapseTicks,
          mutationMultiplierTicks: _mutationMultiplierTicks,
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
          ...sprintState
        } = legacyState;
        return sprintState;
      }
      const {
        combo: _combo,
        mutationActiveCarrier: _mutationActiveCarrier,
        mutationCarriers: _mutationCarriers,
        mutationNextCarrierId: _mutationNextCarrierId,
        mutationFreezeTicks: _mutationFreezeTicks,
        mutationCollapseTicks: _mutationCollapseTicks,
        mutationMultiplierTicks: _mutationMultiplierTicks,
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
