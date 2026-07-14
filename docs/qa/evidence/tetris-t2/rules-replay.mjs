import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const outputDirectory = resolve('docs/qa/evidence/tetris-t2');
await mkdir(outputDirectory, { recursive: true });

const vite = await createServer({ appType: 'custom', logLevel: 'error', server: { middlewareMode: true } });
try {
  const core = await vite.ssrLoadModule('/src/game/core/index.ts');
  const raceQa = await vite.ssrLoadModule('/src/game/runtime/qaScenario.ts');
  const leaderboardApi = await vite.ssrLoadModule('/src/leaderboard.ts');

  const snapshot = (state) => ({
    hash: core.stateHash(state), status: state.status, mode: state.mode, lines: state.lines,
    score: state.score, pieces: state.pieceCount, elapsedTicks: state.elapsedTicks,
    puzzleId: state.puzzleId, puzzleTargetLines: state.puzzleTargetLines,
    puzzlePieceBudget: state.puzzlePieceBudget, queue: state.queue, active: state.active,
  });

  const commandReplay = (seed, mode, commands, puzzleId) => ({
    commands,
    state: core.replay(seed, commands, mode, puzzleId),
  });

  const marathonSeed = 0x4d415241;
  const marathonCommands = [{ type: 'start' }];
  let marathon = core.createInitialState(marathonSeed, 'marathon');
  marathon = core.dispatch(marathon, marathonCommands[0]).state;
  for (let index = 0; index < 80 && marathon.status === 'playing'; index += 1) {
    const hardDrop = { type: 'hard-drop' };
    marathonCommands.push(hardDrop);
    marathon = core.dispatch(marathon, hardDrop).state;
    while (marathon.status === 'playing' && marathon.phase !== 'active') {
      const tick = { type: 'tick' };
      marathonCommands.push(tick);
      marathon = core.dispatch(marathon, tick).state;
    }
  }
  if (marathon.status !== 'game-over') throw new Error(`Marathon command replay did not top out: ${marathon.status}`);

  const raceSeed = 0x52414345;
  const race = raceQa.replayRaceCompletion(raceSeed);
  if (race.state.status !== 'finished' || race.state.lines !== 20) throw new Error('Race command replay did not reach the 20-line finish.');

  const puzzleInputs = {
    'offset-01': [{ type: 'start' }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'hard-drop' }],
    'offset-02': [{ type: 'start' }, { type: 'rotate', direction: 1 }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'hard-drop' }],
    'offset-03': [{ type: 'start' }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'hard-drop' }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'hard-drop' }],
  };
  const puzzles = Object.fromEntries(Object.entries(puzzleInputs).map(([id, commands]) => {
    const replay = commandReplay(0x50555a5a, 'puzzle', commands, id);
    if (replay.state.status !== 'finished') throw new Error(`${id} did not finish through its public command replay.`);
    return [id, { commands, ...snapshot(replay.state) }];
  }));
  const puzzleBudgetFailure = commandReplay(0x50555a5a, 'puzzle', [{ type: 'start' }, { type: 'hard-drop' }], 'offset-01');
  if (puzzleBudgetFailure.state.status !== 'game-over') throw new Error('Puzzle budget-failure replay did not end.');

  const completedAt = '2026-07-14T10:00:00.000Z';
  const marathonRecord = {
    version: 2, mode: 'marathon', outcome: 'top-out', completionTicks: null, completedAt,
    score: marathon.score, lines: marathon.lines, pieces: marathon.pieceCount, elapsedTicks: marathon.elapsedTicks,
  };
  const raceRecord = {
    version: 2, mode: 'race', outcome: 'finished', completionTicks: race.state.elapsedTicks, completedAt,
    score: race.state.score, lines: race.state.lines, pieces: race.state.pieceCount, elapsedTicks: race.state.elapsedTicks,
  };
  let leaderboard = leaderboardApi.emptyLeaderboard();
  leaderboard = leaderboardApi.insertScoreRecord(leaderboard, marathonRecord);
  leaderboard = leaderboardApi.insertScoreRecord(leaderboard, raceRecord);
  const ownership = {
    marathon: leaderboardApi.recordsForMode(leaderboard, 'marathon').map((record) => ({ mode: record.mode, outcome: record.outcome, score: record.score })),
    race: leaderboardApi.recordsForMode(leaderboard, 'race').map((record) => ({ mode: record.mode, outcome: record.outcome, completionTicks: record.completionTicks })),
  };
  if (ownership.marathon.some((record) => record.mode !== 'marathon') || ownership.race.some((record) => record.mode !== 'race')) {
    throw new Error('Leaderboard records crossed mode ownership.');
  }

  const payload = {
    sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    method: 'Actual core modules loaded by Vite SSR; every terminal state is produced only by public dispatch/replay commands.',
    marathon: { commandCount: marathonCommands.length, ...snapshot(marathon) },
    race: { commandCount: race.commands.length, ...snapshot(race.state) },
    puzzles,
    puzzleBudgetFailure: { commands: puzzleBudgetFailure.commands, ...snapshot(puzzleBudgetFailure.state) },
    leaderboardOwnership: ownership,
  };
  await writeFile(resolve(outputDirectory, 'rules-replay.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
} finally {
  await vite.close();
}
