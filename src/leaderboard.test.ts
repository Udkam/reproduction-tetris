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
  version: 3,
  score: 1200,
  lines: 8,
  pieces: 31,
  elapsedTicks: 3600,
  mode: 'marathon',
  outcome: 'top-out',
  completedAt: '2026-07-14T01:00:00.000Z',
  ...overrides,
});

const raceRecord = (overrides: Partial<ScoreRecord> = {}): ScoreRecord => ({
  version: 3,
  score: 1200,
  lines: 20,
  pieces: 31,
  elapsedTicks: 3600,
  mode: 'race',
  outcome: 'top-out',
  completedAt: '2026-07-14T01:00:00.000Z',
  ...overrides,
});

describe('local leaderboard boundary', () => {
  it('fails closed on malformed schema, obsolete completion rows, and legacy stores', () => {
    expect(parseLeaderboard('{broken')).toEqual(emptyLeaderboard());
    expect(parseLeaderboard(JSON.stringify({
      version: 3,
      marathon: [marathonRecord(), { ...marathonRecord(), pieces: -1 }],
      race: [],
    }))).toEqual(emptyLeaderboard());
    expect(parseLeaderboard(JSON.stringify({
      version: 3,
      marathon: [],
      race: [{ ...raceRecord(), version: 2, outcome: 'finished', completionTicks: 3600 }],
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
        lines: index,
        pieces: 40 - index,
        elapsedTicks: 3000 + index,
        completedAt: new Date(Date.UTC(2026, 6, 14, 2, index)).toISOString(),
      }));
    }

    expect(recordsForMode(leaderboard, 'marathon')).toHaveLength(LEADERBOARD_LIMIT);
    expect(recordsForMode(leaderboard, 'race')).toHaveLength(LEADERBOARD_LIMIT);
    expect(recordsForMode(leaderboard, 'marathon')[0]?.lines).toBe(LEADERBOARD_LIMIT + 3);
    expect(recordsForMode(leaderboard, 'race')[0]?.elapsedTicks).toBe(3000 + LEADERBOARD_LIMIT + 3);
    expect(parseLeaderboard(JSON.stringify(leaderboard))).toEqual(leaderboard);
  });

  it('ranks Classic by cleared lines and Survival by elapsed survival time', () => {
    let leaderboard = emptyLeaderboard();
    const marathonLowerLines = marathonRecord({ lines: 8, score: 9000, elapsedTicks: 100 });
    const marathonHigherScore = marathonRecord({ lines: 9, score: 1300, elapsedTicks: 900 });
    const marathonWinner = marathonRecord({ lines: 9, score: 1600, elapsedTicks: 1200 });
    leaderboard = insertScoreRecord(leaderboard, marathonLowerLines);
    leaderboard = insertScoreRecord(leaderboard, marathonHigherScore);
    leaderboard = insertScoreRecord(leaderboard, marathonWinner);
    expect(recordsForMode(leaderboard, 'marathon')).toEqual([marathonWinner, marathonHigherScore, marathonLowerLines]);

    const raceMostLinesShorter = raceRecord({ lines: 99, elapsedTicks: 100, pieces: 69, score: 100 });
    const raceTieFewerLines = raceRecord({ lines: 19, elapsedTicks: 600, pieces: 70, score: 9000 });
    const raceTieWinner = raceRecord({ lines: 20, elapsedTicks: 600, pieces: 70, score: 4000 });
    const raceWinner = raceRecord({ lines: 1, elapsedTicks: 900, pieces: 70, score: 20 });
    leaderboard = insertScoreRecord(leaderboard, raceTieFewerLines);
    leaderboard = insertScoreRecord(leaderboard, raceMostLinesShorter);
    leaderboard = insertScoreRecord(leaderboard, raceTieWinner);
    leaderboard = insertScoreRecord(leaderboard, raceWinner);
    expect(recordsForMode(leaderboard, 'race')).toEqual([raceWinner, raceTieWinner, raceTieFewerLines, raceMostLinesShorter]);
  });
});
