import { describe, expect, it } from 'vitest';
import {
  MUTATION_LEADERBOARD_LIMIT,
  LEADERBOARD_LIMIT,
  emptyLeaderboard,
  insertScoreRecord,
  migrateLegacyLeaderboard,
  parseLeaderboard,
  recordsForMode,
  type ScoreRecord,
} from './leaderboard';

const marathonRecord = (overrides: Partial<ScoreRecord> = {}): ScoreRecord => ({
  version: 7,
  score: 1200,
  lines: 8,
  pieces: 31,
  elapsedTicks: 3600,
  chain: 0,
  mode: 'marathon',
  outcome: 'top-out',
  completedAt: '2026-07-14T01:00:00.000Z',
  ...overrides,
});

const raceRecord = (overrides: Partial<ScoreRecord> = {}): ScoreRecord => ({
  version: 7,
  score: 1200,
  lines: 20,
  pieces: 31,
  elapsedTicks: 3600,
  chain: 0,
  mode: 'race',
  outcome: 'top-out',
  completedAt: '2026-07-14T01:00:00.000Z',
  ...overrides,
});

const sprintRecord = (overrides: Partial<ScoreRecord> = {}): ScoreRecord => ({
  version: 7,
  score: 2400,
  lines: 40,
  pieces: 55,
  elapsedTicks: 2700,
  chain: 0,
  mode: 'sprint',
  outcome: 'top-out',
  completedAt: '2026-07-14T01:00:00.000Z',
  ...overrides,
});

describe('local leaderboard boundary', () => {
  it('fails closed on malformed schema, invalid outcomes, and non-migratable stores', () => {
    expect(parseLeaderboard('{broken')).toEqual(emptyLeaderboard());
    expect(parseLeaderboard(JSON.stringify({
      version: 7,
      marathon: [marathonRecord(), { ...marathonRecord(), pieces: -1 }],
      race: [],
      sprint: [],
    }))).toEqual(emptyLeaderboard());
    expect(parseLeaderboard(JSON.stringify({
      version: 7,
      marathon: [],
      race: [],
      sprint: [{ ...sprintRecord(), outcome: 'finished' }],
    }))).toEqual(emptyLeaderboard());
    expect(migrateLegacyLeaderboard(JSON.stringify([{ score: 1200, lines: 8, pieces: 31, mode: 'marathon', completedAt: '2026-07-14T01:00:00.000Z' }]))).toEqual(emptyLeaderboard());
  });

  it('migrates valid v5 Classic/Survival rows but clears incompatible fourth-mode rows', () => {
    const legacy = {
      version: 5,
      marathon: [{ ...marathonRecord(), version: 5, mode: 'marathon' as const }],
      race: [{ ...raceRecord(), version: 5, mode: 'race' as const }],
      sprint: [{ ...sprintRecord(), version: 5, outcome: 'finished' as const }],
    };
    const migrated = migrateLegacyLeaderboard(JSON.stringify(legacy));
    expect(migrated.version).toBe(7);
    expect(migrated.marathon[0]).toMatchObject({ version: 7, chain: 0, mode: 'marathon', outcome: 'top-out' });
    expect(migrated.race[0]).toMatchObject({ version: 7, chain: 0, mode: 'race', outcome: 'top-out' });
    expect(migrated.sprint).toEqual([]);
  });

  it('resets only the retired v6 fourth-mode rows while retaining valid Classic and Survival history', () => {
    const legacy = {
      version: 6,
      marathon: [{ ...marathonRecord(), version: 6 as const, mode: 'marathon' as const }],
      race: [{ ...raceRecord(), version: 6 as const, mode: 'race' as const }],
      sprint: [{ ...sprintRecord(), version: 6 as const, mode: 'sprint' as const, chain: 4 }],
    };
    const migrated = migrateLegacyLeaderboard(JSON.stringify(legacy));
    expect(migrated).toMatchObject({ version: 7, sprint: [] });
    expect(migrated.marathon[0]).toMatchObject({ version: 7, mode: 'marathon' });
    expect(migrated.race[0]).toMatchObject({ version: 7, mode: 'race' });
  });

  it('preserves a valid v3 Classic/Survival store while opening an empty 异变 table', () => {
    const legacy = {
      version: 3,
      marathon: [{ ...marathonRecord(), version: 3, mode: 'marathon' as const }],
      race: [{ ...raceRecord(), version: 3, mode: 'race' as const }],
    };
    const migrated = migrateLegacyLeaderboard(JSON.stringify(legacy));
    expect(migrated.version).toBe(7);
    expect(migrated.marathon[0]).toMatchObject({ version: 7, chain: 0, mode: 'marathon', outcome: 'top-out' });
    expect(migrated.race[0]).toMatchObject({ version: 7, chain: 0, mode: 'race', outcome: 'top-out' });
    expect(migrated.sprint).toEqual([]);
  });

  it('keeps only the requested five date-stamped records per mode', () => {
    let leaderboard = emptyLeaderboard();
    for (let index = 0; index < MUTATION_LEADERBOARD_LIMIT + 4; index += 1) {
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
        lines: index,
        pieces: 80 - index,
        elapsedTicks: 3000 - index,
        completedAt: new Date(Date.UTC(2026, 6, 14, 3, index)).toISOString(),
      }));
    }

    expect(recordsForMode(leaderboard, 'marathon')).toHaveLength(LEADERBOARD_LIMIT);
    expect(recordsForMode(leaderboard, 'race')).toHaveLength(LEADERBOARD_LIMIT);
    expect(recordsForMode(leaderboard, 'sprint')).toHaveLength(MUTATION_LEADERBOARD_LIMIT);
    expect(recordsForMode(leaderboard, 'marathon')[0]?.lines).toBe(MUTATION_LEADERBOARD_LIMIT + 3);
    expect(recordsForMode(leaderboard, 'race')[0]?.elapsedTicks).toBe(3000 + MUTATION_LEADERBOARD_LIMIT + 3);
    expect(recordsForMode(leaderboard, 'sprint').map((record) => record.lines)).toEqual([8, 7, 6, 5, 4]);
    expect(parseLeaderboard(JSON.stringify(leaderboard))).toEqual(leaderboard);
  });

  it('ranks Classic by lines, Survival by endurance, and 异变 by lines before score', () => {
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

    const sprintLowerLinesHigherScore = sprintRecord({ score: 9999, lines: 29, pieces: 30 });
    const sprintTieMorePieces = sprintRecord({ score: 2400, lines: 30, pieces: 41 });
    const sprintTieFewerPieces = sprintRecord({ score: 2400, lines: 30, pieces: 20 });
    const sprintWinner = sprintRecord({ score: 100, lines: 31, pieces: 40 });
    leaderboard = insertScoreRecord(leaderboard, sprintLowerLinesHigherScore);
    leaderboard = insertScoreRecord(leaderboard, sprintTieMorePieces);
    leaderboard = insertScoreRecord(leaderboard, sprintTieFewerPieces);
    leaderboard = insertScoreRecord(leaderboard, sprintWinner);
    expect(recordsForMode(leaderboard, 'sprint')).toEqual([sprintWinner, sprintTieFewerPieces, sprintTieMorePieces, sprintLowerLinesHigherScore]);
  });
});
