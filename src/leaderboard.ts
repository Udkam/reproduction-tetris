export type RunMode = 'marathon' | 'race';
export type RunOutcome = 'top-out';

export interface ScoreRecord {
  version: 3;
  score: number;
  lines: number;
  pieces: number;
  elapsedTicks: number;
  mode: RunMode;
  outcome: RunOutcome;
  completedAt: string;
}

export interface Leaderboard {
  version: 3;
  marathon: ScoreRecord[];
  race: ScoreRecord[];
}

export const LEADERBOARD_KEY = 'tetris:leaderboard:v3';
export const LEGACY_LEADERBOARD_KEYS = ['stack-order:leaderboard:v2', 'stack-order:leaderboard:v1'] as const;
export const LEADERBOARD_LIMIT = 8;

export function emptyLeaderboard(): Leaderboard {
  return { version: 3, marathon: [], race: [] };
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
    record.version !== 3
    || !isNonNegativeInteger(record.score)
    || !isNonNegativeInteger(record.lines)
    || !isNonNegativeInteger(record.pieces)
    || !isNonNegativeInteger(record.elapsedTicks)
    || (record.mode !== 'marathon' && record.mode !== 'race')
    || record.outcome !== 'top-out'
    || !isIsoDate(record.completedAt)
  ) {
    return false;
  }
  return true;
}

export function sortRecords(mode: RunMode, records: readonly ScoreRecord[]): ScoreRecord[] {
  return [...records].sort((left, right) => {
    if (mode === 'marathon') {
      return right.lines - left.lines
        || right.score - left.score
        || right.pieces - left.pieces
        || left.elapsedTicks - right.elapsedTicks
        || compareText(left.completedAt, right.completedAt);
    }
    return right.elapsedTicks - left.elapsedTicks
      || right.lines - left.lines
      || right.score - left.score
      || right.pieces - left.pieces
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
  return board.version === 3
    && recordsAreValid('marathon', board.marathon)
    && recordsAreValid('race', board.race);
}

export function parseLeaderboard(raw: string | null): Leaderboard {
  if (raw === null) return emptyLeaderboard();
  try {
    const value: unknown = JSON.parse(raw);
    if (!isLeaderboard(value)) return emptyLeaderboard();
    return {
      version: 3,
      marathon: sortRecords('marathon', value.marathon).slice(0, LEADERBOARD_LIMIT),
      race: sortRecords('race', value.race).slice(0, LEADERBOARD_LIMIT),
    };
  } catch {
    return emptyLeaderboard();
  }
}

/**
 * Legacy rows do not provide the v3 top-out endurance contract, so no safe,
 * deterministic migration is possible. Returning an empty v3 store is the
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
