export type RunMode = 'marathon' | 'race';
export type RunOutcome = 'top-out' | 'finished';

export interface ScoreRecord {
  version: 2;
  score: number;
  lines: number;
  pieces: number;
  elapsedTicks: number;
  completionTicks: number | null;
  mode: RunMode;
  outcome: RunOutcome;
  completedAt: string;
}

export interface Leaderboard {
  version: 2;
  marathon: ScoreRecord[];
  race: ScoreRecord[];
}

export const LEADERBOARD_KEY = 'stack-order:leaderboard:v2';
export const LEGACY_LEADERBOARD_KEY = 'stack-order:leaderboard:v1';
export const LEADERBOARD_LIMIT = 8;
export const RACE_COMPLETION_LINES = 20;

export function emptyLeaderboard(): Leaderboard {
  return { version: 2, marathon: [], race: [] };
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function isScoreRecord(value: unknown): value is ScoreRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Partial<ScoreRecord>;
  if (
    record.version !== 2
    || !isNonNegativeInteger(record.score)
    || !isNonNegativeInteger(record.lines)
    || !isNonNegativeInteger(record.pieces)
    || !isNonNegativeInteger(record.elapsedTicks)
    || (record.mode !== 'marathon' && record.mode !== 'race')
    || (record.outcome !== 'top-out' && record.outcome !== 'finished')
    || !isIsoDate(record.completedAt)
  ) {
    return false;
  }
  if (record.mode === 'marathon') {
    return record.outcome === 'top-out' && record.completionTicks === null;
  }
  return record.outcome === 'finished'
    && record.lines >= RACE_COMPLETION_LINES
    && record.completionTicks === record.elapsedTicks;
}

export function sortRecords(mode: RunMode, records: readonly ScoreRecord[]): ScoreRecord[] {
  return [...records].sort((left, right) => {
    if (mode === 'marathon') {
      return right.score - left.score
        || right.lines - left.lines
        || right.pieces - left.pieces
        || left.elapsedTicks - right.elapsedTicks
        || compareText(left.completedAt, right.completedAt);
    }
    return (left.completionTicks ?? Number.MAX_SAFE_INTEGER) - (right.completionTicks ?? Number.MAX_SAFE_INTEGER)
      || left.pieces - right.pieces
      || right.score - left.score
      || left.elapsedTicks - right.elapsedTicks
      || compareText(left.completedAt, right.completedAt);
  });
}

function recordsAreValid(mode: RunMode, records: unknown): records is ScoreRecord[] {
  return Array.isArray(records)
    && records.every((record) => isScoreRecord(record) && record.mode === mode);
}

function isLeaderboard(value: unknown): value is Leaderboard {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const board = value as Partial<Leaderboard>;
  return board.version === 2
    && recordsAreValid('marathon', board.marathon)
    && recordsAreValid('race', board.race);
}

export function parseLeaderboard(raw: string | null): Leaderboard {
  if (raw === null) return emptyLeaderboard();
  try {
    const value: unknown = JSON.parse(raw);
    if (!isLeaderboard(value)) return emptyLeaderboard();
    return {
      version: 2,
      marathon: sortRecords('marathon', value.marathon).slice(0, LEADERBOARD_LIMIT),
      race: sortRecords('race', value.race).slice(0, LEADERBOARD_LIMIT),
    };
  } catch {
    return emptyLeaderboard();
  }
}

/**
 * V1 rows do not have fixed-tick elapsed time or an outcome, so no safe,
 * deterministic migration is possible. Returning an empty v2 store is the
 * deliberate fail-closed migration result.
 */
export function migrateLegacyLeaderboard(_raw: string | null): Leaderboard {
  return emptyLeaderboard();
}

export function recordsForMode(leaderboard: Leaderboard, mode: RunMode): ScoreRecord[] {
  return leaderboard[mode];
}

export function insertScoreRecord(leaderboard: Leaderboard, record: ScoreRecord): Leaderboard {
  if (!isLeaderboard(leaderboard) || !isScoreRecord(record)) return emptyLeaderboard();
  const current = leaderboard[record.mode];
  const next = sortRecords(record.mode, [...current, record]).slice(0, LEADERBOARD_LIMIT);
  return {
    ...leaderboard,
    [record.mode]: next,
  };
}
