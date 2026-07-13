export type RunMode = 'marathon' | 'race';

export interface ScoreRecord {
  score: number;
  lines: number;
  pieces: number;
  mode: RunMode;
  completedAt: string;
}

export const LEADERBOARD_KEY = 'stack-order:leaderboard:v1';
export const LEADERBOARD_LIMIT = 8;

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

export function isScoreRecord(value: unknown): value is ScoreRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Partial<ScoreRecord>;
  return isNonNegativeInteger(record.score)
    && isNonNegativeInteger(record.lines)
    && isNonNegativeInteger(record.pieces)
    && (record.mode === 'marathon' || record.mode === 'race')
    && isIsoDate(record.completedAt);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function sortLeaderboard(records: readonly ScoreRecord[]): ScoreRecord[] {
  return [...records].sort((left, right) =>
    right.score - left.score
    || right.lines - left.lines
    || right.pieces - left.pieces
    || compareText(right.completedAt, left.completedAt)
    || compareText(left.mode, right.mode),
  );
}

export function parseLeaderboard(raw: string | null): ScoreRecord[] {
  if (raw === null) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || !value.every(isScoreRecord)) return [];
    return sortLeaderboard(value).slice(0, LEADERBOARD_LIMIT);
  } catch {
    return [];
  }
}

export function insertScoreRecord(records: readonly ScoreRecord[], record: ScoreRecord): ScoreRecord[] {
  if (!records.every(isScoreRecord) || !isScoreRecord(record)) return [];
  return sortLeaderboard([...records, record]).slice(0, LEADERBOARD_LIMIT);
}
