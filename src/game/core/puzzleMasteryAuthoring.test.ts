import { describe, expect, it } from 'vitest';
import { VISIBLE_START_ROW } from './constants';
import { getPuzzleDefinition, replayPuzzleSetup, type PuzzleSetupHistory } from './puzzles';
import { certifyOptimalPuzzleRoute, encodePuzzleRoute, findPuzzleRoute, findPuzzleRouteForDefinition } from './puzzleRouteSearch';
import type { PuzzleId, Rotation } from './types';

// This authoring-only proof runs one level at a time so exhaustive search stays resource-bounded.
// @ts-expect-error Node environment variables are available to Vitest but not product types.
const LEVEL_ID = process.env.PUZZLE_AUTHOR_LEVEL_ID as PuzzleId | undefined;
// @ts-expect-error Node environment variables are available to Vitest but not product types.
const ROUTE = process.env.PUZZLE_AUTHOR_ROUTE as string | undefined;
// @ts-expect-error Node environment variables are available to Vitest but not product types.
const MAX_LOCKS = Number(process.env.PUZZLE_AUTHOR_MAX_LOCKS ?? 8);
// @ts-expect-error Node environment variables are available to Vitest but not product types.
const GENERATE_SETUP = process.env.PUZZLE_AUTHOR_GENERATE_SETUP === '1';
// @ts-expect-error Node environment variables are available to Vitest but not product types.
const SETUP_INDEX = Number(process.env.PUZZLE_AUTHOR_SETUP_INDEX ?? 0);
// @ts-expect-error Node environment variables are available to Vitest but not product types.
const SETUP_BASE_ID = process.env.PUZZLE_AUTHOR_SETUP_BASE_ID as PuzzleId | undefined;
// @ts-expect-error Node environment variables are available to Vitest but not product types.
const SETUP_PREFIX = Number(process.env.PUZZLE_AUTHOR_SETUP_PREFIX ?? 0);

describe.runIf(Boolean(LEVEL_ID && ROUTE))('single Puzzle mastery authoring proof', () => {
  it(`proves the strict optimum for ${LEVEL_ID ?? 'unset'}`, () => {
    const certificate = certifyOptimalPuzzleRoute(LEVEL_ID as PuzzleId, ROUTE as string);
    expect(certificate).not.toBeNull();
    console.error(`PUZZLE_CERT ${JSON.stringify({
      levelId: certificate?.levelId,
      optimalLocks: certificate?.optimalLocks,
      initialStateHash: certificate?.initialStateHash,
      exhaustedFrontierWidths: certificate?.exhaustedFrontierWidths,
      exploredStateCount: certificate?.exploredStateCount,
      transitionCount: certificate?.transitionCount,
      deficitBoundPrunes: certificate?.deficitBoundPrunes,
    })}`);
  }, 600_000);
});

describe.runIf(Boolean(LEVEL_ID && !ROUTE && !GENERATE_SETUP && !SETUP_PREFIX))('single Puzzle route authoring search', () => {
  it(`finds a bounded route for ${LEVEL_ID ?? 'unset'}`, () => {
    const replay = findPuzzleRoute(LEVEL_ID as PuzzleId, { maxLocks: MAX_LOCKS, beamWidth: 900 });
    expect(replay).not.toBeNull();
    console.log(`PUZZLE_ROUTE ${JSON.stringify({
      levelId: LEVEL_ID,
      locks: replay?.locks.length,
      route: replay ? encodePuzzleRoute(replay.commands) : null,
    })}`);
  }, 180_000);
});

describe.runIf(Boolean(LEVEL_ID && SETUP_BASE_ID && SETUP_PREFIX > 0))('Puzzle setup-prefix authoring search', () => {
  it(`finds a bounded route for the ${SETUP_PREFIX}-piece prefix`, () => {
    const baseDefinition = getPuzzleDefinition(SETUP_BASE_ID as PuzzleId);
    const history: PuzzleSetupHistory = {
      seed: baseDefinition.setup.seed,
      placements: baseDefinition.setup.placements.slice(0, SETUP_PREFIX),
    };
    const board = replayPuzzleSetup(history);
    const visible = board.slice(VISIBLE_START_ROW);
    const targetRows = visible.filter((row) => row.some((cell) => cell !== null)).length;
    const definition = {
      ...baseDefinition,
      id: LEVEL_ID as PuzzleId,
      targetRows,
      setup: history,
      boardRows: Object.freeze(visible.map((row) => row.map((cell) => cell ?? '.').join(''))),
      anchorCells: Object.freeze([]),
    };
    const replay = findPuzzleRouteForDefinition(definition, { maxLocks: MAX_LOCKS, beamWidth: 900 });
    expect(replay).not.toBeNull();
    console.error(`PUZZLE_PREFIX ${JSON.stringify({ targetRows, setup: history, route: replay ? encodePuzzleRoute(replay.commands) : '', locks: replay?.locks.length })}`);
  }, 120_000);
});

describe.runIf(Boolean(LEVEL_ID && GENERATE_SETUP))('three-row Puzzle setup authoring search', () => {
  it(`finds a deterministic setup candidate for ${LEVEL_ID ?? 'unset'}`, () => {
    const baseDefinition = getPuzzleDefinition(SETUP_BASE_ID ?? LEVEL_ID as PuzzleId);
    const source = baseDefinition.setup;
    let random = (source.seed ^ 0x9e37_79b9) >>> 0;
    const nextRandom = () => {
      random = (Math.imul(random, 1_664_525) + 1_013_904_223) >>> 0;
      return random;
    };
    const sourceSignature = replayPuzzleSetup(source).slice(VISIBLE_START_ROW)
      .map((row) => row.map((cell) => cell === null ? '.' : '#').join('')).join('/');
    const candidates = new Map<string, { setup: PuzzleSetupHistory; route: string; locks: number }>();
    for (let attempt = 0; attempt < 250_000 && candidates.size <= SETUP_INDEX; attempt += 1) {
      const placements = source.placements.slice(0, 6).map(({ type, rotation, x }) => ({
        type,
        rotation: nextRandom() % 100 < 8 ? (nextRandom() % 4) as Rotation : rotation,
        x: nextRandom() % 100 < 22 ? Math.max(-2, Math.min(8, x + (nextRandom() % 3) - 1)) : x,
      }));
      const history: PuzzleSetupHistory = { seed: source.seed, placements };
      try {
        const board = replayPuzzleSetup(history);
        const visible = board.slice(VISIBLE_START_ROW);
        const nonEmptyRows = visible.flatMap((row, index) => row.some((cell) => cell !== null) ? [index] : []);
        const occupied = visible.reduce((count, row) => count + row.filter((cell) => cell !== null).length, 0);
        if (occupied !== 24 || nonEmptyRows.join(',') !== '17,18,19') continue;
        const signature = visible.map((row) => row.map((cell) => cell === null ? '.' : '#').join('')).join('/');
        if (signature === sourceSignature) continue;
        if (candidates.has(signature)) continue;
        const definition = {
          ...baseDefinition,
          id: LEVEL_ID as PuzzleId,
          targetRows: 3,
          setup: history,
          boardRows: Object.freeze(visible.map((row) => row.map((cell) => cell ?? '.').join(''))),
          anchorCells: Object.freeze([]),
        };
        const replay = findPuzzleRouteForDefinition(definition, { maxLocks: MAX_LOCKS, beamWidth: 120 });
        if (!replay) continue;
        candidates.set(signature, {
          setup: history,
          route: encodePuzzleRoute(replay.commands),
          locks: replay.locks.length,
        });
      } catch {
        // Illegal drops are expected while sampling the bounded authoring domain.
      }
    }
    const candidate = [...candidates.values()][SETUP_INDEX] ?? null;
    expect(candidate).not.toBeNull();
    console.log(`PUZZLE_SETUP ${JSON.stringify({ levelId: LEVEL_ID, ...candidate })}`);
  }, 60_000);
});
