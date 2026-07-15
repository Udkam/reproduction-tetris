import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type HistoricalPieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
type HistoricalCommand =
  | { type: 'start' | 'tick' | 'soft-drop' | 'hard-drop' }
  | { type: 'move'; dx: -1 | 1 }
  | { type: 'rotate'; direction: -1 | 1 };

type Level = {
  id: string;
  name: string;
  difficulty: number;
  boardRows: string[];
  queue: HistoricalPieceType[];
  pieceBudget: number;
  expectedClearedLines: number;
  intendedMechanic: string;
};

type ReferenceReplay = {
  levelId: string;
  commands: HistoricalCommand[];
  commandCount: number;
  lockedPieces: number;
  clearedLines: number;
  consumedQueueCount: number;
  effectiveRotations: number;
  landingXs: number[];
  distinctLandingXs: number;
  finalFullBoardOccupiedCells: number;
  proposedFinalOutcome: 'finished';
  /** Frozen historical design-adapter evidence, not current production hash authority. */
  currentAdapterInitialHash: string;
  /** Frozen historical design-adapter evidence, not current production hash authority. */
  currentAdapterFinalHash: string;
  commandDigest: string;
  /** Frozen historical design-adapter evidence, not current production event authority. */
  eventDigest: string;
};

const cellTypes = new Set<HistoricalPieceType>(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
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

function occupiedCells(level: Level): number {
  return level.boardRows.reduce(
    (total, row) => total + [...row].filter((cell) => cell !== '.').length,
    0,
  );
}

/** Validates only the frozen T3 design artifact. It never reads current production definitions. */
function validateDesignLevel(level: Level): void {
  if (!/^t3r-(shaft|cascade)-0[1-6]$/.test(level.id)) throw new Error(`Invalid level ID: ${level.id}`);
  if (!level.name || !level.intendedMechanic) throw new Error(`${level.id}: missing authored metadata`);
  if (!Number.isInteger(level.difficulty) || level.difficulty < 1) throw new Error(`${level.id}: invalid difficulty`);
  if (level.boardRows.length !== 20) throw new Error(`${level.id}: board must have exactly 20 rows`);
  for (const row of level.boardRows) {
    if (row.length !== 10) throw new Error(`${level.id}: row width must be exactly 10`);
    if (![...row].every((cell) => cell === '.' || cellTypes.has(cell as HistoricalPieceType))) {
      throw new Error(`${level.id}: illegal board cell`);
    }
    if (![...row].includes('.')) throw new Error(`${level.id}: authored board contains an already-complete row`);
  }
  if (occupiedCells(level) === 0) throw new Error(`${level.id}: initially empty board`);
  if (level.queue.length === 0 || !level.queue.every((piece) => cellTypes.has(piece))) {
    throw new Error(`${level.id}: invalid queue`);
  }
  if (!Number.isInteger(level.pieceBudget) || level.pieceBudget !== level.queue.length) {
    throw new Error(`${level.id}: piece budget must exactly equal queue length`);
  }
  if (!Number.isInteger(level.expectedClearedLines) || level.expectedClearedLines <= 0) {
    throw new Error(`${level.id}: invalid expected cleared lines`);
  }
}

function validateCommand(command: HistoricalCommand, index: number): void {
  if (!command || typeof command !== 'object') throw new Error(`command ${index}: malformed command`);
  if (index === 0) {
    if (command.type !== 'start') throw new Error('start must be the first historical command');
    return;
  }
  if (command.type === 'start') throw new Error('start may appear only once');
  if (command.type === 'move' && command.dx !== -1 && command.dx !== 1) throw new Error(`command ${index}: invalid move`);
  if (command.type === 'rotate' && command.direction !== -1 && command.direction !== 1) {
    throw new Error(`command ${index}: invalid rotation`);
  }
  if (!['tick', 'soft-drop', 'hard-drop', 'move', 'rotate'].includes(command.type)) {
    throw new Error(`command ${index}: unsupported command`);
  }
}

function referenceFor(id: string): ReferenceReplay {
  const reference = references.replays.find((candidate) => candidate.levelId === id);
  if (!reference) throw new Error(`Missing reference replay for ${id}`);
  return reference;
}

/**
 * Checks internal frozen-artifact facts only. T5 production behavior is verified by
 * `src/game/core/puzzleCampaign.test.ts` against the T5 fixture.
 */
function verifyHistoricalReference(level: Level, reference: ReferenceReplay): void {
  validateDesignLevel(level);
  if (reference.levelId !== level.id) throw new Error(`${level.id}: reference ID mismatch`);
  if (reference.commands.length !== reference.commandCount) throw new Error(`${level.id}: command count mismatch`);
  reference.commands.forEach(validateCommand);
  if (digest(reference.commands) !== reference.commandDigest) throw new Error(`${level.id}: historical command digest malformed`);
  for (const historical of [reference.currentAdapterInitialHash, reference.currentAdapterFinalHash, reference.eventDigest]) {
    if (!/^[0-9a-f]{8}$/.test(historical)) throw new Error(`${level.id}: malformed historical adapter evidence`);
  }

  const hardDrops = reference.commands.filter((command) => command.type === 'hard-drop').length;
  const rotateInputs = reference.commands.filter((command) => command.type === 'rotate').length;
  if (
    reference.lockedPieces !== level.queue.length
    || reference.lockedPieces !== level.pieceBudget
    || reference.lockedPieces !== reference.consumedQueueCount
    || hardDrops !== reference.lockedPieces
  ) {
    throw new Error(`${level.id}: historical queue-consumption facts drifted`);
  }
  if (reference.clearedLines !== level.expectedClearedLines) throw new Error(`${level.id}: cleared-line fact drifted`);
  if (!Number.isInteger(reference.effectiveRotations) || reference.effectiveRotations < 0 || reference.effectiveRotations > rotateInputs) {
    throw new Error(`${level.id}: rotation fact drifted`);
  }
  if (
    reference.landingXs.length !== reference.lockedPieces
    || reference.landingXs.some((x) => !Number.isInteger(x))
    || new Set(reference.landingXs).size !== reference.distinctLandingXs
  ) {
    throw new Error(`${level.id}: landing fact drifted`);
  }
  if (reference.proposedFinalOutcome !== 'finished' || reference.finalFullBoardOccupiedCells !== 0) {
    throw new Error(`${level.id}: frozen proposed outcome drifted`);
  }
  if (
    occupiedCells(level) + 4 * reference.lockedPieces
    !== 10 * reference.clearedLines + reference.finalFullBoardOccupiedCells
  ) {
    throw new Error(`${level.id}: static cell conservation failed`);
  }
}

describe('TETRIS-T3R frozen campaign artifact integrity', () => {
  it('retains six unique, internally valid level/replay pairs without reading T5 production definitions', () => {
    expect(campaign.levels).toHaveLength(6);
    expect(references.replays).toHaveLength(6);
    expect(new Set(campaign.levels.map((level) => level.id))).toEqual(
      new Set(references.replays.map((reference) => reference.levelId)),
    );
    expect(new Set(campaign.levels.map((level) => level.id))).toHaveLength(6);
    expect(new Set(campaign.levels.map((level) => level.boardRows.join('\n')))).toHaveLength(6);
    for (const level of campaign.levels) verifyHistoricalReference(level, referenceFor(level.id));
  });

  it.each(references.replays)('$levelId retains its frozen command digest and static conservation facts', (reference) => {
    const level = campaign.levels.find((candidate) => candidate.id === reference.levelId);
    if (!level) throw new Error(`Missing level for ${reference.levelId}`);
    expect(() => verifyHistoricalReference(level, reference)).not.toThrow();
  });

  it.each(references.replays.slice(3))('$levelId retains the historical high-difficulty evidence shape', (reference) => {
    expect(reference.lockedPieces).toBeGreaterThanOrEqual(5);
    expect(reference.effectiveRotations).toBeGreaterThan(2);
    expect(reference.distinctLandingXs).toBeGreaterThanOrEqual(3);
  });

  it('rejects malformed frozen level shapes without creating a canonical game state', () => {
    const base = campaign.levels[0]!;
    expect(() => validateDesignLevel({ ...base, boardRows: Array.from({ length: 20 }, () => '..........') })).toThrow(/initially empty/);
    expect(() => validateDesignLevel({ ...base, boardRows: [...base.boardRows.slice(0, 19), 'JJJJJJJJJJ'] })).toThrow(/already-complete/);
    expect(() => validateDesignLevel({ ...base, boardRows: [...base.boardRows.slice(0, 19), 'QJJJ.JJJJ.'] })).toThrow(/illegal board cell/);
    expect(() => validateDesignLevel({ ...base, queue: ['Q'] as unknown as HistoricalPieceType[], pieceBudget: 1 })).toThrow(/invalid queue/);
    expect(() => validateDesignLevel({ ...base, pieceBudget: base.queue.length - 1 })).toThrow(/exactly equal/);
  });

  it('fails closed when frozen replay facts drift internally', () => {
    const reference = referenceFor('t3r-shaft-01');
    const level = campaign.levels[0]!;
    expect(() => verifyHistoricalReference({ ...level, queue: ['O', 'I'], pieceBudget: 2 }, reference)).toThrow(/queue-consumption/);
    expect(() => verifyHistoricalReference(level, { ...reference, commandDigest: '00000000' })).toThrow(/digest/);
    expect(() => verifyHistoricalReference(level, { ...reference, landingXs: [0, 0, 0] })).toThrow(/landing fact/);
  });
});
