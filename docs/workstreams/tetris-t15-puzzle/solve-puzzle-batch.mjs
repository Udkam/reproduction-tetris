/**
 * Replays one registered Phase-7 batch through the real TypeScript Core.
 *
 * Vite is used only as an in-process TypeScript module loader. Middleware mode
 * never opens a listener, and the loader is closed before this process exits.
 *
 * Usage:
 *   node solve-puzzle-batch.mjs --from 1 --to 10 --max-locks 18
 *     --primary-beam 720 --alternate-beam 560 --output <explicit-json-path>
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error('Every solver option needs an explicit --name value pair.');
    }
    values.set(key, value);
  }
  const integer = (name, minimum, maximum) => {
    const value = Number(values.get(name));
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
      throw new Error(`${name} must be an integer from ${minimum} through ${maximum}.`);
    }
    return value;
  };
  const output = values.get('--output');
  if (!output) throw new Error('--output is required; this runner never chooses an implicit artifact path.');
  const from = integer('--from', 1, 50);
  const to = integer('--to', from, 50);
  if (to - from + 1 > 10) throw new Error('One solver run may cover at most one ten-level batch.');
  return Object.freeze({
    from,
    to,
    maxLocks: integer('--max-locks', 1, 40),
    primaryBeam: integer('--primary-beam', 16, 5000),
    alternateBeam: integer('--alternate-beam', 16, 5000),
    outputPath: resolve(output),
  });
}

function boardHeight(board) {
  const first = board.findIndex((row) => row.some((cell) => cell !== null));
  return first < 0 ? 0 : board.length - first;
}

function boardHoles(board) {
  let holes = 0;
  for (let x = 0; x < board[0].length; x += 1) {
    let occupied = false;
    for (const row of board) {
      if (row[x] !== null) occupied = true;
      else if (occupied) holes += 1;
    }
  }
  return holes;
}

function routeMetrics(core, routeSearch, level, commandStream) {
  let state = core.createInitialState(0x51a1f00d, 'puzzle', level.id);
  let maximumHeight = boardHeight(state.board);
  let peakHoles = boardHoles(state.board);
  const clearDistribution = [];
  const branchWidths = [];

  for (const command of routeSearch.decodePuzzleRoute(commandStream)) {
    if (command.type === 'hard-drop') branchWidths.push(routeSearch.puzzleLandings(state).length);
    const transition = core.dispatch(state, command);
    for (const event of transition.events) {
      if (event.type === 'lines-cleared') clearDistribution.push(event.count);
    }
    state = transition.state;
    maximumHeight = Math.max(maximumHeight, boardHeight(state.board));
    peakHoles = Math.max(peakHoles, boardHoles(state.board));
  }

  if (state.status !== 'finished' || state.puzzleCompletion !== 'finished' || state.puzzleTargetCells.length !== 0) {
    throw new Error(`Route for ${level.id} did not finish through public Core dispatch.`);
  }
  const compact = routeSearch.metricsForPuzzleRoute(commandStream);
  return Object.freeze({
    ...compact,
    clearDistribution: Object.freeze(clearDistribution),
    maximumHeight,
    peakHoles,
    branchWidths: Object.freeze(branchWidths),
    minimumBranchWidth: Math.min(...branchWidths),
    maximumBranchWidth: Math.max(...branchWidths),
    averageBranchWidth: Number(
      (branchWidths.reduce((sum, width) => sum + width, 0) / branchWidths.length).toFixed(3),
    ),
    anchorCount: level.anchorCells.length,
  });
}

function routeRecord(core, routeSearch, level, id, replay) {
  const commandStream = routeSearch.encodePuzzleRoute(replay.commands);
  return Object.freeze({
    id,
    commandStream,
    ...routeMetrics(core, routeSearch, level, commandStream),
  });
}

const options = parseArguments(process.argv.slice(2));
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '../../..');
const loader = await createServer({
  root: projectRoot,
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
});

try {
  const core = await loader.ssrLoadModule('/src/game/core/index.ts');
  const routeSearch = await loader.ssrLoadModule('/src/game/core/puzzleRouteSearch.ts');
  const selected = core.PUZZLE_DEFINITIONS.slice(options.from - 1, options.to);
  if (selected.length !== options.to - options.from + 1) {
    throw new Error(`Registered campaign does not contain positions ${options.from} through ${options.to}.`);
  }

  const levels = [];
  for (const [offset, level] of selected.entries()) {
    const position = options.from + offset;
    process.stderr.write(`search ${String(position).padStart(2, '0')} ${level.id}: primary\n`);
    const primary = routeSearch.findPuzzleRoute(level.id, {
      maxLocks: options.maxLocks,
      beamWidth: options.primaryBeam,
    });
    if (!primary) throw new Error(`No primary route found for ${level.id}.`);

    const primaryStream = routeSearch.encodePuzzleRoute(primary.commands);
    process.stderr.write(`search ${String(position).padStart(2, '0')} ${level.id}: alternate\n`);
    const pair = routeSearch.findPuzzleAlternativeRoute(level.id, primaryStream, {
      maxLocks: Math.min(options.maxLocks, primary.locks.length + 4),
      beamWidth: options.alternateBeam,
    });
    if (!pair.alternative || pair.firstDivergenceLock === null) {
      throw new Error(`No alternate route found for ${level.id}.`);
    }
    const shorterRouteLocks = Math.min(primary.locks.length, pair.alternative.locks.length);
    if (pair.firstDivergenceLock > Math.min(4, shorterRouteLocks)) {
      throw new Error(`Routes for ${level.id} diverge too late at lock ${pair.firstDivergenceLock}.`);
    }

    const routes = Object.freeze([
      routeRecord(core, routeSearch, level, 'primary', primary),
      routeRecord(core, routeSearch, level, 'alternate', pair.alternative),
    ]);
    levels.push(Object.freeze({
      id: level.id,
      curriculumPosition: position,
      targetRowCount: core.expectedPuzzleTargetRows(level.difficulty),
      setup: Object.freeze({
        seed: level.setup.seed,
        placementCount: level.setup.placements.length,
      }),
      anchorCells: level.anchorCells,
      firstDivergenceLock: pair.firstDivergenceLock,
      shorterRouteLocks,
      routes,
    }));
    process.stderr.write(
      `verified ${String(position).padStart(2, '0')} ${level.id}: `
      + `${routes[0].locks}/${routes[1].locks} locks, branch ${pair.firstDivergenceLock}\n`,
    );
  }

  const artifact = Object.freeze({
    schemaVersion: 7,
    claim: 'Two non-unique public-Core routes per Phase-7 level; search is not an optimality proof.',
    batch: Object.freeze({ from: options.from, to: options.to }),
    commandEncoding: Object.freeze({
      S: { type: 'start' },
      T: { type: 'tick' },
      L: { type: 'move', dx: -1 },
      R: { type: 'move', dx: 1 },
      C: { type: 'rotate', direction: 1 },
      H: { type: 'hard-drop' },
    }),
    difficultyTuple: Object.freeze([
      'targetRowCount',
      'lockedPieces',
      'rotationPlanning',
      'horizontalPlanning',
      'clearDistribution',
      'maximumHeight',
      'peakHoles',
      'branchWidth',
      'firstDivergenceLock',
      'anchorCount',
    ]),
    campaignOrder: Object.freeze(levels.map(({ id }) => id)),
    levels: Object.freeze(levels),
    searchBounds: Object.freeze({
      maxLocks: options.maxLocks,
      primaryBeam: options.primaryBeam,
      alternateBeam: options.alternateBeam,
    }),
  });
  mkdirSync(dirname(options.outputPath), { recursive: true });
  writeFileSync(options.outputPath, `${JSON.stringify(artifact, null, 2)}\n`, { encoding: 'utf8' });
  process.stdout.write(`${JSON.stringify({
    outputPath: options.outputPath,
    schemaVersion: artifact.schemaVersion,
    levels: artifact.levels.length,
    routes: artifact.levels.length * 2,
  })}\n`);
} finally {
  await loader.close();
}
