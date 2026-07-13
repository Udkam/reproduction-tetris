import { describe, expect, it } from 'vitest';
import {
  LEADERBOARD_LIMIT,
  insertScoreRecord,
  parseLeaderboard,
  type ScoreRecord,
} from './leaderboard';

const record = (overrides: Partial<ScoreRecord> = {}): ScoreRecord => ({
  score: 1200,
  lines: 8,
  pieces: 31,
  mode: 'marathon',
  completedAt: '2026-07-14T01:00:00.000Z',
  ...overrides,
});

describe('local leaderboard boundary', () => {
  it('fails closed when any stored record is malformed', () => {
    expect(parseLeaderboard('{broken')).toEqual([]);
    expect(parseLeaderboard(JSON.stringify([record(), { ...record(), pieces: -1 }]))).toEqual([]);
    expect(parseLeaderboard(JSON.stringify([record(), { ...record(), mode: 'turbo' }]))).toEqual([]);
  });

  it('sorts deterministically and keeps a bounded number of completed runs', () => {
    let records: ScoreRecord[] = [];
    for (let index = 0; index < LEADERBOARD_LIMIT + 4; index += 1) {
      records = insertScoreRecord(records, record({
        score: index % 3 === 0 ? 900 : 1200,
        lines: index,
        pieces: 20 + index,
        mode: index % 2 === 0 ? 'race' : 'marathon',
        completedAt: new Date(Date.UTC(2026, 6, 14, 1, index)).toISOString(),
      }));
    }
    expect(records).toHaveLength(LEADERBOARD_LIMIT);
    expect(records[0]?.score).toBe(1200);
    expect(records[0]?.lines).toBeGreaterThanOrEqual(records[1]?.lines ?? 0);
    expect(parseLeaderboard(JSON.stringify(records))).toEqual(records);
  });

  it('uses later completion time only after score, lines, and pieces tie', () => {
    const earlier = record({ completedAt: '2026-07-14T01:00:00.000Z' });
    const later = record({ completedAt: '2026-07-14T02:00:00.000Z' });
    expect(insertScoreRecord([earlier], later)).toEqual([later, earlier]);
  });
});
