export type RunMode = 'marathon' | 'race' | 'sprint';
export type RunOutcome = 'top-out' | 'finished';

export interface ScoreRecord {
  version: 4;
  score: number;
  lines: number;
  pieces: number;
  elapsedTicks: number;
  mode: RunMode;
  outcome: RunOutcome;
  completedAt: string;
}

export interface Leaderboard {
  version: 4;
  marathon: ScoreRecord[];
  race: ScoreRecord[];
  sprint: ScoreRecord[];
}

export const LEADERBOARD_KEY = 'tetris:leaderboard:v4';
export const LEGACY_LEADERBOARD_KEYS = ['tetris:leaderboard:v3', 'stack-order:leaderboard:v2', 'stack-order:leaderboard:v1'] as const;
export const LEADERBOARD_LIMIT = 8;

export function emptyLeaderboard(): Leaderboard {
  return { version: 4, marathon: [], race: [], sprint: [] };
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
    record.version !== 4
    || !isNonNegativeInteger(record.score)
    || !isNonNegativeInteger(record.lines)
    || !isNonNegativeInteger(record.pieces)
    || !isNonNegativeInteger(record.elapsedTicks)
    || (record.mode !== 'marathon' && record.mode !== 'race' && record.mode !== 'sprint')
    || !isIsoDate(record.completedAt)
  ) return false;
  return record.mode === 'sprint' ? record.outcome === 'finished' : record.outcome === 'top-out';
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
    if (mode === 'race') {
      return right.elapsedTicks - left.elapsedTicks
        || right.lines - left.lines
        || right.score - left.score
        || right.pieces - left.pieces
        || compareText(left.completedAt, right.completedAt);
    }
    return left.elapsedTicks - right.elapsedTicks
      || left.pieces - right.pieces
      || right.score - left.score
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
  return board.version === 4
    && recordsAreValid('marathon', board.marathon)
    && recordsAreValid('race', board.race)
    && recordsAreValid('sprint', board.sprint);
}

export function parseLeaderboard(raw: string | null): Leaderboard {
  if (raw === null) return emptyLeaderboard();
  try {
    const value: unknown = JSON.parse(raw);
    if (!isLeaderboard(value)) return emptyLeaderboard();
    return {
      version: 4,
      marathon: sortRecords('marathon', value.marathon).slice(0, LEADERBOARD_LIMIT),
      race: sortRecords('race', value.race).slice(0, LEADERBOARD_LIMIT),
      sprint: sortRecords('sprint', value.sprint).slice(0, LEADERBOARD_LIMIT),
    };
  } catch {
    return emptyLeaderboard();
  }
}

interface LegacyV3ScoreRecord {
  version: 3;
  score: number;
  lines: number;
  pieces: number;
  elapsedTicks: number;
  mode: 'marathon' | 'race';
  outcome: 'top-out';
  completedAt: string;
}

interface LegacyV3Leaderboard {
  version: 3;
  marathon: LegacyV3ScoreRecord[];
  race: LegacyV3ScoreRecord[];
}

function isLegacyV3Record(value: unknown): value is LegacyV3ScoreRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Partial<LegacyV3ScoreRecord>;
  return record.version === 3
    && isNonNegativeInteger(record.score)
    && isNonNegativeInteger(record.lines)
    && isNonNegativeInteger(record.pieces)
    && isNonNegativeInteger(record.elapsedTicks)
    && (record.mode === 'marathon' || record.mode === 'race')
    && record.outcome === 'top-out'
    && isIsoDate(record.completedAt);
}

function isLegacyV3Leaderboard(value: unknown): value is LegacyV3Leaderboard {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const board = value as Partial<LegacyV3Leaderboard>;
  return board.version === 3
    && Array.isArray(board.marathon)
    && board.marathon.every((record) => isLegacyV3Record(record) && record.mode === 'marathon')
    && Array.isArray(board.race)
    && board.race.every((record) => isLegacyV3Record(record) && record.mode === 'race');
}

/** Preserves valid Classic/Survival rows while rejecting every malformed or older schema. */
export function migrateLegacyLeaderboard(raw: string | null): Leaderboard {
  if (raw === null) return emptyLeaderboard();
  try {
    const value: unknown = JSON.parse(raw);
    if (!isLegacyV3Leaderboard(value)) return emptyLeaderboard();
    return {
      version: 4,
      marathon: sortRecords('marathon', value.marathon.map((record) => ({ ...record, version: 4 }))).slice(0, LEADERBOARD_LIMIT),
      race: sortRecords('race', value.race.map((record) => ({ ...record, version: 4 }))).slice(0, LEADERBOARD_LIMIT),
      sprint: [],
    };
  } catch {
    return emptyLeaderboard();
  }
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
