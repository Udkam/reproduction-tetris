import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as core from '../../../../src/game/core';
import type { Cell, GameCommand, GameEvent, GameState, PieceType } from '../../../../src/game/core';

type Level = {
  id: string;
  name: string;
  difficulty: number;
  boardRows: string[];
  queue: PieceType[];
  pieceBudget: number;
  expectedClearedLines: number;
  intendedMechanic: string;
};

type ReferenceReplay = {
  levelId: string;
  commands: GameCommand[];
  commandCount: number;
  lockedPieces: number;
  clearedLines: number;
  consumedQueueCount: number;
  effectiveRotations: number;
  landingXs: number[];
  distinctLandingXs: number;
  finalFullBoardOccupiedCells: number;
  proposedFinalOutcome: 'finished';
  currentAdapterInitialHash: string;
  currentAdapterFinalHash: string;
  commandDigest: string;
  eventDigest: string;
};

type Outcome = 'playing' | 'finished' | 'failed-top-out' | 'failed-budget';

const seed = 0x73a30001;
const cellTypes = new Set<PieceType>(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
const campaign = JSON.parse(readFileSync(new URL('../levels.json', import.meta.url), 'utf8')) as { levels: Level[] };
const references = JSON.parse(readFileSync(new URL('../REFERENCE_REPLAYS.json', import.meta.url), 'utf8')) as { replays: ReferenceReplay[] };

function digest(value: unknown): string {
  const canonical = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function fullBoardOccupied(state: GameState): number {
  return state.board.flat().filter((cell) => cell !== null).length;
}

function hiddenOccupied(state: GameState): number {
  return state.board.slice(0, core.VISIBLE_START_ROW).flat().filter((cell) => cell !== null).length;
}

function footprint(active: GameState['active']): string {
  return active ? core.cellsForPiece(active).map(({ x, y }) => `${x}:${y}`).sort().join('|') : 'none';
}

function validateLevel(level: Level): void {
  if (!/^t3r-(shaft|cascade)-0[1-6]$/.test(level.id)) throw new Error(`Invalid level ID: ${level.id}`);
  if (!level.name) throw new Error(`${level.id}: empty name`);
  if (!Number.isInteger(level.difficulty) || level.difficulty < 1) throw new Error(`${level.id}: invalid difficulty`);
  if (level.boardRows.length !== 20) throw new Error(`${level.id}: board must have exactly 20 rows`);
  let initialOccupied = 0;
  for (const row of level.boardRows) {
    if (row.length !== 10) throw new Error(`${level.id}: row width must be exactly 10`);
    if (![...row].every((cell) => cell === '.' || cellTypes.has(cell as PieceType))) throw new Error(`${level.id}: illegal board cell`);
    if ([...row].every((cell) => cell !== '.')) throw new Error(`${level.id}: authored board contains an already-complete row`);
    initialOccupied += [...row].filter((cell) => cell !== '.').length;
  }
  if (initialOccupied === 0) throw new Error(`${level.id}: initially empty board`);
  if (level.queue.length === 0 || !level.queue.every((piece) => cellTypes.has(piece))) throw new Error(`${level.id}: invalid queue`);
  if (!Number.isInteger(level.pieceBudget) || level.pieceBudget !== level.queue.length) throw new Error(`${level.id}: piece budget must exactly equal queue length`);
  if (!Number.isInteger(level.expectedClearedLines) || level.expectedClearedLines <= 0) throw new Error(`${level.id}: invalid expected cleared lines`);
}

/** Initialization only: no caller mutates the returned state directly. */
function authoredInitial(level: Level, hiddenCells: readonly Cell[] = []): GameState {
  validateLevel(level);
  const base = core.createInitialState(seed, 'puzzle', 'offset-01');
  const board = core.createBoard();
  for (const cell of hiddenCells) {
    if (cell.x < 0 || cell.x >= 10 || cell.y < 0 || cell.y >= core.VISIBLE_START_ROW) throw new Error(`${level.id}: invalid hidden fixture cell`);
    board[cell.y]![cell.x] = 'J';
  }
  for (let y = 0; y < level.boardRows.length; y += 1) {
    for (let x = 0; x < level.boardRows[y]!.length; x += 1) {
      const cell = level.boardRows[y]![x]!;
      if (cell !== '.') board[core.VISIBLE_START_ROW + y]![x] = cell as PieceType;
    }
  }
  const [first, ...queue] = level.queue;
  if (!first) throw new Error(`${level.id}: empty queue`);
  const active = core.createSpawnPiece(first);
  if (!core.canPlace(board, active)) throw new Error(`${level.id}: invalid spawn / top-out board`);
  return {
    ...base,
    board,
    active,
    queue,
    mode: 'puzzle',
    // Compatibility only: production must replace this line-target branch with
    // the full-board-empty predicate documented in the T3R contract.
    puzzleId: 'offset-01',
    puzzleTargetLines: level.expectedClearedLines,
    puzzlePieceBudget: level.pieceBudget,
    pieceCount: 0,
    status: 'ready',
    phase: 'active',
    phaseTicks: 0,
    pendingClearRows: [],
    gravityTicks: 0,
    lockTicks: 0,
    lockResets: 0,
    elapsedTicks: 0,
  };
}

function proposedOutcome(state: GameState, events: readonly GameEvent[], level: Level): Outcome {
  const topOut = events.some((event) => event.type === 'game-over' && (event.reason === 'block-out' || event.reason === 'lock-out' || event.reason === 'invalid-state'));
  if (topOut) return 'failed-top-out';
  if (!events.some((event) => event.type === 'piece-locked')) return 'playing';
  if (hiddenOccupied(state) > 0) return 'failed-top-out';
  if (fullBoardOccupied(state) === 0) return 'finished';
  if (state.pieceCount >= level.pieceBudget || (state.active === null && state.queue.length === 0)) return 'failed-budget';
  return 'playing';
}

function requireCommandPhase(before: GameState, command: GameCommand, index: number): void {
  if (index === 0) {
    if (command.type !== 'start') throw new Error('start must be the first and only start command');
    return;
  }
  if (command.type === 'start') throw new Error('start may appear exactly once');
  if (command.type === 'restart' || command.type === 'pause' || command.type === 'resume') throw new Error(`forbidden replay command: ${command.type}`);
  if (command.type === 'tick') {
    if (before.status !== 'playing' || before.active !== null || (before.phase !== 'entry' && before.phase !== 'line-clear')) throw new Error('tick is filler unless entry or line resolution requires it');
    return;
  }
  if (before.status !== 'playing' || before.phase !== 'active' || before.active === null) throw new Error(`${command.type} is invalid outside an active piece phase`);
}

function execute(level: Level, commands: readonly GameCommand[], hiddenCells: readonly Cell[] = []) {
  let state = authoredInitial(level, hiddenCells);
  const initialHash = core.stateHash(state);
  const initialOccupied = fullBoardOccupied(state);
  const eventRecords: Array<{ index: number; events: readonly GameEvent[] }> = [];
  const landingXs: number[] = [];
  let locks = 0;
  let clears = 0;
  let effectiveRotations = 0;
  let outcome: Outcome = 'playing';
  let terminalIndex = -1;
  let lastEvents: readonly GameEvent[] = [];

  for (let index = 0; index < commands.length; index += 1) {
    if (terminalIndex !== -1) throw new Error(`terminal tail command at index ${index}`);
    const command = commands[index]!;
    requireCommandPhase(state, command, index);
    const before = state;
    const beforeFootprint = footprint(before.active);
    if (command.type === 'hard-drop') landingXs.push(before.active!.x);
    const transition = core.dispatch(before, command);
    state = transition.state;
    lastEvents = transition.events;
    if (command.type === 'move' && state.active?.x === before.active?.x) throw new Error(`no-op move at index ${index}`);
    if (command.type === 'rotate') {
      if (footprint(state.active) === beforeFootprint) throw new Error(`ineffective rotation at index ${index}`);
      effectiveRotations += 1;
    }
    if (command.type === 'hard-drop' && transition.events.filter((event) => event.type === 'piece-locked').length !== 1) throw new Error(`hard drop did not lock exactly one piece at index ${index}`);
    locks += transition.events.filter((event) => event.type === 'piece-locked').length;
    clears += transition.events.filter((event) => event.type === 'lines-cleared').reduce((total, event) => total + event.count, 0);
    eventRecords.push({ index, events: transition.events });
    outcome = proposedOutcome(state, transition.events, level);
    if (outcome !== 'playing') terminalIndex = index;
  }

  if (terminalIndex === -1) throw new Error('replay does not reach a proposed terminal outcome');
  if (terminalIndex !== commands.length - 1) throw new Error('terminal tail command');
  if (commands.at(-1)?.type !== 'hard-drop' || !lastEvents.some((event) => event.type === 'piece-locked')) throw new Error('last effective command must be the final locking hard drop');
  return {
    state,
    initialHash,
    initialOccupied,
    locks,
    clears,
    effectiveRotations,
    landingXs,
    eventRecords,
    outcome,
    finalOccupied: fullBoardOccupied(state),
    finalHash: core.stateHash(state),
    commandDigest: digest(commands),
    eventDigest: digest(eventRecords),
  };
}

function levelFor(reference: ReferenceReplay): Level {
  const level = campaign.levels.find((candidate) => candidate.id === reference.levelId);
  if (!level) throw new Error(`Missing level for ${reference.levelId}`);
  return level;
}

function verifyReference(level: Level, reference: ReferenceReplay) {
  const first = execute(level, reference.commands);
  const second = execute(level, reference.commands);
  if (reference.commands.length !== reference.commandCount) throw new Error(`${reference.levelId}: command count mismatch`);
  if (first.locks !== reference.lockedPieces || first.locks !== level.queue.length || first.locks !== level.pieceBudget || first.state.queue.length !== 0 || first.state.pieceCount !== level.queue.length) throw new Error(`${reference.levelId}: locked-piece count does not consume exact queue/budget (unused queue tail)`);
  if (first.initialHash !== reference.currentAdapterInitialHash || second.initialHash !== first.initialHash) throw new Error(`${reference.levelId}: stale initial hash`);
  if (first.finalHash !== reference.currentAdapterFinalHash || second.finalHash !== first.finalHash) throw new Error(`${reference.levelId}: stale final hash`);
  if (first.commandDigest !== reference.commandDigest) throw new Error(`${reference.levelId}: stale command digest`);
  if (first.eventDigest !== reference.eventDigest || second.eventDigest !== first.eventDigest) throw new Error(`${reference.levelId}: stale event digest`);
  if (first.clears !== reference.clearedLines) throw new Error(`${reference.levelId}: cleared-line mismatch`);
  if (first.effectiveRotations !== reference.effectiveRotations) throw new Error(`${reference.levelId}: effective rotation mismatch`);
  if (JSON.stringify(first.landingXs) !== JSON.stringify(reference.landingXs) || new Set(first.landingXs).size !== reference.distinctLandingXs) throw new Error(`${reference.levelId}: lateral landing mismatch`);
  if (first.finalOccupied !== reference.finalFullBoardOccupiedCells || first.finalOccupied !== 0) throw new Error(`${reference.levelId}: canonical board is not empty`);
  if (first.initialOccupied + 4 * first.locks !== 10 * first.clears + first.finalOccupied) throw new Error(`${reference.levelId}: cell conservation failed`);
  if (first.outcome !== reference.proposedFinalOutcome) throw new Error(`${reference.levelId}: proposed outcome mismatch`);
  if (first.state.status !== 'finished' || first.state.active !== null || first.state.pendingClearRows.length !== 0 || first.state.queue.length !== 0 || first.state.pieceCount !== level.queue.length) throw new Error(`${reference.levelId}: unfinished runtime state or unused queue tail`);
  return first;
}

describe('TETRIS-T3R canonical six-level campaign verifier', () => {
  it('validates six unique non-empty 20x10 boards without a completed starting row', () => {
    expect(campaign.levels).toHaveLength(6);
    expect(new Set(campaign.levels.map((level) => level.id)).size).toBe(6);
    expect(new Set(campaign.levels.map((level) => level.boardRows.join('\n'))).size).toBe(6);
    campaign.levels.forEach(validateLevel);
  });

  it.each(references.replays)('$levelId twice reaches an empty canonical board through public commands', (reference) => {
    const verified = verifyReference(levelFor(reference), reference);
    expect(verified.outcome).toBe('finished');
  });

  it.each(references.replays.slice(3))('$levelId is a five-piece high-difficulty route with real rotations and multiple landings', (reference) => {
    expect(reference.lockedPieces).toBeGreaterThanOrEqual(5);
    expect(reference.effectiveRotations).toBeGreaterThanOrEqual(2);
    expect(reference.distinctLandingXs).toBeGreaterThanOrEqual(3);
  });

  it('rejects an initially empty board and an authored full row', () => {
    const base = campaign.levels[0]!;
    expect(() => authoredInitial({ ...base, boardRows: Array.from({ length: 20 }, () => '..........') })).toThrow(/initially empty/);
    const rows = [...base.boardRows];
    rows[19] = 'JJJJJJJJJJ';
    expect(() => authoredInitial({ ...base, boardRows: rows })).toThrow(/already-complete row/);
  });

  it('rejects illegal board cells, illegal pieces, and budget/queue mismatch', () => {
    const base = campaign.levels[0]!;
    const rows = [...base.boardRows];
    rows[19] = 'QJJJ.JJJJ.';
    expect(() => authoredInitial({ ...base, boardRows: rows })).toThrow(/illegal board cell/);
    expect(() => authoredInitial({ ...base, queue: ['Q'] as PieceType[], pieceBudget: 1 })).toThrow(/invalid queue/);
    expect(() => authoredInitial({ ...base, pieceBudget: base.queue.length - 1 })).toThrow(/exactly equal/);
  });

  it('rejects an unused authored queue tail', () => {
    const reference = references.replays[3]!;
    const level = levelFor(reference);
    const tailLevel = { ...level, queue: [...level.queue, 'O'] as PieceType[], pieceBudget: level.pieceBudget + 1 };
    expect(() => verifyReference(tailLevel, reference)).toThrow(/unused queue tail|locked-piece count/);
  });

  it('rejects invalid spawn and hidden-buffer top-out after a normal lock', () => {
    const base = campaign.levels[0]!;
    const rows = [...base.boardRows];
    rows[0] = '...J......';
    expect(() => authoredInitial({ ...base, boardRows: rows })).toThrow(/invalid spawn/);
    const hidden = execute(base, [{ type: 'start' }, { type: 'hard-drop' }], [{ x: 0, y: core.VISIBLE_START_ROW - 1 }]);
    expect(hidden.outcome).toBe('failed-top-out');
  });

  it('rejects legacy line-target completion when any canonical-board cell remains', () => {
    const rows = Array.from({ length: 20 }, () => '..........');
    rows[18] = '.........J';
    rows[19] = '....JJJJJJ';
    const level: Level = { ...campaign.levels[0]!, boardRows: rows, queue: ['I'], pieceBudget: 1, expectedClearedLines: 1 };
    const run = execute(level, [{ type: 'start' }, { type: 'move', dx: -1 }, { type: 'move', dx: -1 }, { type: 'move', dx: -1 }, { type: 'hard-drop' }]);
    expect(run.state.status).toBe('finished');
    expect(run.finalOccupied).toBeGreaterThan(0);
    expect(run.outcome).toBe('failed-budget');
  });

  it('rejects stale final hash and stale event digest', () => {
    const reference = references.replays[0]!;
    const level = levelFor(reference);
    expect(() => verifyReference(level, { ...reference, currentAdapterFinalHash: '00000000' })).toThrow(/stale final hash/);
    expect(() => verifyReference(level, { ...reference, eventDigest: '00000000' })).toThrow(/stale event digest/);
  });

  it('rejects terminal tail commands, no-op movement, filler ticks, and forbidden restart/pause/resume', () => {
    const reference = references.replays[0]!;
    const level = levelFor(reference);
    expect(() => execute(level, [...reference.commands, { type: 'tick' }])).toThrow(/terminal tail/);
    expect(() => execute(level, [{ type: 'start' }, { type: 'move', dx: -99 }])).toThrow(/no-op move/);
    expect(() => execute(level, [{ type: 'start' }, { type: 'tick' }])).toThrow(/tick is filler/);
    expect(() => execute(level, [{ type: 'start' }, { type: 'pause' }])).toThrow(/forbidden replay command/);
  });

  it('treats final-piece full-board clear as success before queue/budget exhaustion', () => {
    const reference = references.replays[3]!;
    const result = execute(levelFor(reference), reference.commands);
    expect(result.state.pieceCount).toBe(levelFor(reference).pieceBudget);
    expect(result.state.queue).toEqual([]);
    expect(result.finalOccupied).toBe(0);
    expect(result.outcome).toBe('finished');
  });
});
