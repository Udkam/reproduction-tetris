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
  version: 4,
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
  version: 4,
  score: 1200,
  lines: 20,
  pieces: 31,
  elapsedTicks: 3600,
  mode: 'race',
  outcome: 'top-out',
  completedAt: '2026-07-14T01:00:00.000Z',
  ...overrides,
});

const sprintRecord = (overrides: Partial<ScoreRecord> = {}): ScoreRecord => ({
  version: 4,
  score: 2400,
  lines: 40,
  pieces: 55,
  elapsedTicks: 2700,
  mode: 'sprint',
  outcome: 'finished',
  completedAt: '2026-07-14T01:00:00.000Z',
  ...overrides,
});

describe('local leaderboard boundary', () => {
  it('fails closed on malformed schema, invalid outcomes, and non-migratable old stores', () => {
    expect(parseLeaderboard('{broken')).toEqual(emptyLeaderboard());
    expect(parseLeaderboard(JSON.stringify({
      version: 4,
      marathon: [marathonRecord(), { ...marathonRecord(), pieces: -1 }],
      race: [],
      sprint: [],
    }))).toEqual(emptyLeaderboard());
    expect(parseLeaderboard(JSON.stringify({
      version: 4,
      marathon: [],
      race: [],
      sprint: [{ ...sprintRecord(), outcome: 'top-out' }],
    }))).toEqual(emptyLeaderboard());
    expect(migrateLegacyLeaderboard(JSON.stringify([{ score: 1200, lines: 8, pieces: 31, mode: 'marathon', completedAt: '2026-07-14T01:00:00.000Z' }]))).toEqual(emptyLeaderboard());
  });

  it('preserves a valid v3 Classic/Survival store while opening an empty Sprint table', () => {
    const legacy = {
      version: 3,
      marathon: [{ ...marathonRecord(), version: 3, mode: 'marathon' as const }],
      race: [{ ...raceRecord(), version: 3, mode: 'race' as const }],
    };
    const migrated = migrateLegacyLeaderboard(JSON.stringify(legacy));
    expect(migrated.version).toBe(4);
    expect(migrated.marathon[0]).toMatchObject({ version: 4, mode: 'marathon', outcome: 'top-out' });
    expect(migrated.race[0]).toMatchObject({ version: 4, mode: 'race', outcome: 'top-out' });
    expect(migrated.sprint).toEqual([]);
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
      leaderboard = insertScoreRecord(leaderboard, sprintRecord({
        score: 800 + index,
        pieces: 80 - index,
        elapsedTicks: 3000 - index,
        completedAt: new Date(Date.UTC(2026, 6, 14, 3, index)).toISOString(),
      }));
    }

    expect(recordsForMode(leaderboard, 'marathon')).toHaveLength(LEADERBOARD_LIMIT);
    expect(recordsForMode(leaderboard, 'race')).toHaveLength(LEADERBOARD_LIMIT);
    expect(recordsForMode(leaderboard, 'sprint')).toHaveLength(LEADERBOARD_LIMIT);
    expect(recordsForMode(leaderboard, 'marathon')[0]?.lines).toBe(LEADERBOARD_LIMIT + 3);
    expect(recordsForMode(leaderboard, 'race')[0]?.elapsedTicks).toBe(3000 + LEADERBOARD_LIMIT + 3);
    expect(recordsForMode(leaderboard, 'sprint')[0]?.elapsedTicks).toBe(3000 - (LEADERBOARD_LIMIT + 3));
    expect(parseLeaderboard(JSON.stringify(leaderboard))).toEqual(leaderboard);
  });

  it('ranks Classic by lines, Survival by endurance, and Sprint by low time then low piece count', () => {
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

    const sprintSlow = sprintRecord({ elapsedTicks: 1000, pieces: 40, score: 9000 });
    const sprintTieMorePieces = sprintRecord({ elapsedTicks: 900, pieces: 41, score: 9000 });
    const sprintTieHigherScore = sprintRecord({ elapsedTicks: 900, pieces: 40, score: 1500 });
    const sprintWinner = sprintRecord({ elapsedTicks: 900, pieces: 40, score: 1900 });
    leaderboard = insertScoreRecord(leaderboard, sprintSlow);
    leaderboard = insertScoreRecord(leaderboard, sprintTieMorePieces);
    leaderboard = insertScoreRecord(leaderboard, sprintTieHigherScore);
    leaderboard = insertScoreRecord(leaderboard, sprintWinner);
    expect(recordsForMode(leaderboard, 'sprint')).toEqual([sprintWinner, sprintTieHigherScore, sprintTieMorePieces, sprintSlow]);
  });
});
