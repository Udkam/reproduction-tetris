import { describe, expect, it } from 'vitest';
import {
  LEADERBOARD_LIMIT,
  emptyLeaderboard,
  insertScoreRecord,
  migrateLegacyLeaderboard,
  parseLeaderboard,
  recordsForMode,
  type ScoreRecord,
} from './leaderboard';

const marathonRecord = (overrides: Partial<ScoreRecord> = {}): ScoreRecord => ({
  version: 2,
  score: 1200,
  lines: 8,
  pieces: 31,
  elapsedTicks: 3600,
  completionTicks: null,
  mode: 'marathon',
  outcome: 'top-out',
  completedAt: '2026-07-14T01:00:00.000Z',
  ...overrides,
});

const raceRecord = (overrides: Partial<ScoreRecord> = {}): ScoreRecord => ({
  version: 2,
  score: 1200,
  lines: 20,
  pieces: 31,
  elapsedTicks: 3600,
  completionTicks: 3600,
  mode: 'race',
  outcome: 'finished',
  completedAt: '2026-07-14T01:00:00.000Z',
  ...overrides,
});

describe('local leaderboard boundary', () => {
  it('fails closed on malformed schema, incomplete race rows, and legacy v1 rows', () => {
    expect(parseLeaderboard('{broken')).toEqual(emptyLeaderboard());
    expect(parseLeaderboard(JSON.stringify({
      version: 2,
      marathon: [marathonRecord(), { ...marathonRecord(), pieces: -1 }],
      race: [],
    }))).toEqual(emptyLeaderboard());
    expect(parseLeaderboard(JSON.stringify({
      version: 2,
      marathon: [],
      race: [raceRecord({ lines: 19 })],
    }))).toEqual(emptyLeaderboard());
    expect(migrateLegacyLeaderboard(JSON.stringify([{ score: 1200, lines: 8, pieces: 31, mode: 'marathon', completedAt: '2026-07-14T01:00:00.000Z' }])))
      .toEqual(emptyLeaderboard());
  });

  it('keeps separately bounded, mode-specific deterministic records', () => {
    let leaderboard = emptyLeaderboard();
    for (let index = 0; index < LEADERBOARD_LIMIT + 4; index += 1) {
      leaderboard = insertScoreRecord(leaderboard, marathonRecord({
        score: index % 3 === 0 ? 900 : 1200,
        lines: index,
        pieces: 20 + index,
        elapsedTicks: 3600 + index,
        completedAt: new Date(Date.UTC(2026, 6, 14, 1, index)).toISOString(),
      }));
      leaderboard = insertScoreRecord(leaderboard, raceRecord({
        score: 800 + index,
        pieces: 40 - index,
        elapsedTicks: 3000 + index,
        completionTicks: 3000 + index,
        completedAt: new Date(Date.UTC(2026, 6, 14, 2, index)).toISOString(),
      }));
    }

    expect(recordsForMode(leaderboard, 'marathon')).toHaveLength(LEADERBOARD_LIMIT);
    expect(recordsForMode(leaderboard, 'race')).toHaveLength(LEADERBOARD_LIMIT);
    expect(recordsForMode(leaderboard, 'marathon')[0]?.score).toBe(1200);
    expect(recordsForMode(leaderboard, 'race')[0]?.completionTicks).toBe(3000);
    expect(parseLeaderboard(JSON.stringify(leaderboard))).toEqual(leaderboard);
  });

  it('uses the frozen tie-break order for both modes', () => {
    let leaderboard = emptyLeaderboard();
    const marathonFast = marathonRecord({ elapsedTicks: 100 });
    const marathonMoreLines = marathonRecord({ lines: 9, elapsedTicks: 900 });
    const marathonBetterScore = marathonRecord({ score: 1300, lines: 1, pieces: 1, elapsedTicks: 900 });
    leaderboard = insertScoreRecord(leaderboard, marathonFast);
    leaderboard = insertScoreRecord(leaderboard, marathonMoreLines);
    leaderboard = insertScoreRecord(leaderboard, marathonBetterScore);
    expect(recordsForMode(leaderboard, 'marathon')).toEqual([marathonBetterScore, marathonMoreLines, marathonFast]);

    const raceSlower = raceRecord({ completionTicks: 200, elapsedTicks: 200, pieces: 1, score: 1 });
    const raceFewerPieces = raceRecord({ completionTicks: 100, elapsedTicks: 100, pieces: 8, score: 1 });
    const raceHigherScore = raceRecord({ completionTicks: 100, elapsedTicks: 100, pieces: 8, score: 2 });
    const raceWinner = raceRecord({ completionTicks: 100, elapsedTicks: 100, pieces: 7, score: 0 });
    leaderboard = insertScoreRecord(leaderboard, raceSlower);
    leaderboard = insertScoreRecord(leaderboard, raceFewerPieces);
    leaderboard = insertScoreRecord(leaderboard, raceHigherScore);
    leaderboard = insertScoreRecord(leaderboard, raceWinner);
    expect(recordsForMode(leaderboard, 'race')).toEqual([raceWinner, raceHigherScore, raceFewerPieces, raceSlower]);
  });
});
