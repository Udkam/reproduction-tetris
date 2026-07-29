/**
 * Deterministic Phase-7 setup authoring for the 01–10 three-row curriculum.
 *
 * This tool produces candidates only. A candidate becomes product data only after
 * the TypeScript Core replays its setup and two public-dispatch completion routes.
 *
 * Usage:
 *   node search-puzzles.mjs
 *     --target-rows <3..7>
 *     --seed-start <uint32> --seed-count <1..256>
 *     --setup-counts <5..15 subset> --candidate-count <1..100>
 *     --beam-width <16..5000> --node-budget <positive-int>
 *     --output <explicit-json-path>
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const WIDTH = 10;
const HEIGHT = 40;
const VISIBLE_START = 20;
const FULL_ROW = (1 << WIDTH) - 1;
const TYPES = Object.freeze(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
const SHAPES = Object.freeze({
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
  ],
  O: Array.from({ length: 4 }, () => [[0, 0], [1, 0], [0, 1], [1, 1]]),
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]],
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]],
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
  ],
});

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error('Every authoring option needs an explicit --name value pair.');
    }
    values.set(key, value);
  }

  const integer = (name, minimum, maximum) => {
    const raw = values.get(name);
    const value = raw === undefined ? Number.NaN : Number(raw);
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
      throw new Error(`${name} must be an integer from ${minimum} through ${maximum}.`);
    }
    return value;
  };
  const setupCounts = (values.get('--setup-counts') ?? '')
    .split(',')
    .filter(Boolean)
    .map(Number);
  if (
    setupCounts.length === 0
    || setupCounts.some((value) => !Number.isInteger(value) || value < 5 || value > 15)
    || new Set(setupCounts).size !== setupCounts.length
  ) {
    throw new Error('--setup-counts must be a unique comma-separated subset of 5 through 15.');
  }
  const output = values.get('--output');
  if (!output) throw new Error('--output is required; this tool never chooses an implicit output path.');

  return Object.freeze({
    targetRows: integer('--target-rows', 3, 7),
    seedStart: integer('--seed-start', 1, 0xffff_ffff),
    seedCount: integer('--seed-count', 1, 256),
    setupCounts: Object.freeze(setupCounts),
    candidateCount: integer('--candidate-count', 1, 100),
    beamWidth: integer('--beam-width', 16, 5000),
    nodeBudget: integer('--node-budget', 1, 100_000_000),
    outputPath: resolve(output),
  });
}

function nextSeed(seed) {
  let value = seed >>> 0;
  if (value === 0) value = 0x6d2b79f5;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}

function sequenceForSeed(seed, count) {
  let randomizerSeed = seed >>> 0 || 0x6d2b79f5;
  let bag = [];
  const sequence = [];
  while (sequence.length < count) {
    if (bag.length === 0) {
      bag = [...TYPES];
      for (let index = bag.length - 1; index > 0; index -= 1) {
        randomizerSeed = nextSeed(randomizerSeed);
        const swapIndex = randomizerSeed % (index + 1);
        [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
      }
    }
    sequence.push(bag.shift());
  }
  return sequence;
}

function popcount(value) {
  let count = 0;
  for (let bits = value >>> 0; bits; bits >>>= 1) count += bits & 1;
  return count;
}

function boardKey(rows) {
  return rows.slice(VISIBLE_START).map((row) => row.toString(36)).join('.');
}

function canPlace(rows, shape, x, y) {
  return shape.every(([dx, dy]) => {
    const cellX = x + dx;
    const cellY = y + dy;
    return cellX >= 0 && cellX < WIDTH && cellY >= 0 && cellY < HEIGHT
      && (rows[cellY] & (1 << cellX)) === 0;
  });
}

function setupLanding(rows, typeRows, type, rotation, x) {
  const shape = SHAPES[type][rotation];
  let y = VISIBLE_START - 1;
  if (!canPlace(rows, shape, x, y)) return null;
  while (canPlace(rows, shape, x, y + 1)) y += 1;

  const cells = shape.map(([dx, dy]) => [x + dx, y + dy]);
  const ownCells = new Set(cells.map(([cellX, cellY]) => `${cellX}:${cellY}`));
  for (const [cellX, cellY] of cells) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      if (ownCells.has(`${cellX + dx}:${cellY + dy}`)) continue;
      if (
        cellX + dx >= 0 && cellX + dx < WIDTH && cellY + dy >= 0 && cellY + dy < HEIGHT
        && (typeRows[type][cellY + dy] & (1 << (cellX + dx))) !== 0
      ) return null;
    }
  }

  const nextRows = [...rows];
  const nextTypeRows = { ...typeRows, [type]: [...typeRows[type]] };
  for (const [cellX, cellY] of cells) {
    nextRows[cellY] |= 1 << cellX;
    nextTypeRows[type][cellY] |= 1 << cellX;
  }
  if (nextRows.some((row) => row === FULL_ROW) || nextRows.slice(0, VISIBLE_START).some(Boolean)) return null;
  return Object.freeze({ rows: nextRows, typeRows: nextTypeRows, landingY: y });
}

function topology(rows) {
  const visible = rows.slice(VISIBLE_START);
  const firstOccupied = visible.findIndex(Boolean);
  if (firstOccupied < 0) {
    return Object.freeze({
      targetRows: 0, occupied: 0, holes: 0, coveredColumns: 0,
      bumpiness: 0, rowSpread: 0, rowDensities: 0,
    });
  }
  const occupiedRows = visible.slice(firstOccupied);
  const heights = [];
  let occupied = 0;
  let holes = 0;
  const coveredColumns = new Set();
  for (const row of visible) occupied += popcount(row);
  for (let x = 0; x < WIDTH; x += 1) {
    let top = visible.length;
    for (let y = 0; y < visible.length; y += 1) {
      if ((visible[y] & (1 << x)) !== 0) {
        top = y;
        coveredColumns.add(x);
        break;
      }
    }
    heights.push(visible.length - top);
    for (let y = top + 1; y < visible.length; y += 1) {
      if ((visible[y] & (1 << x)) === 0) holes += 1;
    }
  }
  const fills = occupiedRows.map(popcount);
  return Object.freeze({
    targetRows: occupiedRows.length,
    occupied,
    holes,
    coveredColumns: coveredColumns.size,
    bumpiness: heights.slice(1).reduce((sum, height, index) => sum + Math.abs(height - heights[index]), 0),
    rowSpread: Math.max(...fills) - Math.min(...fills),
    rowDensities: new Set(fills).size,
  });
}

function scoreState(rows, depth, pathHash, targetRows) {
  const value = topology(rows);
  const expectedRows = Math.min(targetRows, Math.max(1, Math.ceil((depth * 4) / 9)));
  const deterministicTieBreak = (pathHash % 101) / 101;
  return Math.abs(value.targetRows - expectedRows) * 20_000
    + Math.abs(value.holes - Math.max(1, depth - 3)) * 160
    + value.bumpiness * 42
    + value.rowSpread * 55
    - value.coveredColumns * 95
    - value.rowDensities * 35
    + deterministicTieBreak;
}

function pathFor(node) {
  const placements = [];
  for (let cursor = node; cursor?.placement; cursor = cursor.parent) placements.push(cursor.placement);
  return placements.reverse();
}

function visibleRows(typeRows) {
  return Array.from({ length: HEIGHT - VISIBLE_START }, (_, visibleY) => {
    const y = VISIBLE_START + visibleY;
    return Array.from({ length: WIDTH }, (_, x) => (
      TYPES.find((type) => (typeRows[type][y] & (1 << x)) !== 0) ?? '.'
    )).join('');
  });
}

function searchSeed(setupSeed, setupCount, targetRows, beamWidth, budget) {
  const sequence = sequenceForSeed(setupSeed, setupCount);
  const emptyTypeRows = Object.fromEntries(
    TYPES.map((type) => [type, Array.from({ length: HEIGHT }, () => 0)]),
  );
  let beam = [{
    rows: Array.from({ length: HEIGHT }, () => 0),
    typeRows: emptyTypeRows,
    parent: null,
    placement: null,
    pathHash: 2166136261,
    score: 0,
  }];

  for (let depth = 0; depth < setupCount; depth += 1) {
    const type = sequence[depth];
    const candidates = new Map();
    for (const node of beam) {
      for (let rotation = 0; rotation < 4; rotation += 1) {
        const shape = SHAPES[type][rotation];
        const minimumX = -Math.min(...shape.map(([x]) => x));
        const maximumX = WIDTH - 1 - Math.max(...shape.map(([x]) => x));
        for (let x = minimumX; x <= maximumX; x += 1) {
          budget.attempts += 1;
          if (budget.attempts > budget.limit) return Object.freeze({ candidates: [], exhausted: true });
          const placed = setupLanding(node.rows, node.typeRows, type, rotation, x);
          if (!placed) continue;
          const pathHash = Math.imul(
            node.pathHash ^ ((x + 3) * 31 + rotation * 131 + placed.landingY * 521 + (depth + 1) * 977),
            16777619,
          ) >>> 0;
          const next = {
            ...placed,
            parent: node,
            placement: Object.freeze({ type, rotation, x }),
            pathHash,
            score: scoreState(placed.rows, depth + 1, pathHash, targetRows),
          };
          const colorKey = TYPES.map((piece) => boardKey(next.typeRows[piece])).join('/');
          const key = `${boardKey(next.rows)}|${colorKey}`;
          const previous = candidates.get(key);
          if (!previous || next.score < previous.score) candidates.set(key, next);
        }
      }
    }
    beam = [...candidates.values()]
      .sort((left, right) => left.score - right.score || left.pathHash - right.pathHash)
      .slice(0, beamWidth);
    if (beam.length === 0) break;
  }

  const accepted = beam
    .filter((node) => {
      const value = topology(node.rows);
      return value.targetRows === targetRows
        && value.occupied === setupCount * 4
        && value.coveredColumns >= 7
        && value.rowDensities >= 2;
    })
    .sort((left, right) => left.score - right.score || left.pathHash - right.pathHash)
    .slice(0, 4)
    .map((node) => Object.freeze({
      setupSeed,
      setupCount,
      placements: Object.freeze(pathFor(node)),
      boardRows: Object.freeze(visibleRows(node.typeRows)),
      metrics: topology(node.rows),
      authoringScore: Number(node.score.toFixed(6)),
      boardKey: boardKey(node.rows),
    }));
  return Object.freeze({ candidates: accepted, exhausted: false });
}

function validateCandidate(candidate, targetRows) {
  if (candidate.placements.length !== candidate.setupCount) throw new Error('Candidate placement count drifted.');
  if (candidate.boardRows.length !== 20 || candidate.boardRows.some((row) => row.length !== WIDTH)) {
    throw new Error('Candidate board must contain twenty ten-cell visible rows.');
  }
  if (candidate.metrics.targetRows !== targetRows) throw new Error('Candidate target height drifted.');
  if (candidate.metrics.occupied !== candidate.setupCount * 4) throw new Error('Candidate lost setup cells.');
  if (candidate.boardRows.some((row) => !/^[.IOTSZJL]{10}$/.test(row))) {
    throw new Error('Candidate board contains an unknown material.');
  }
  if (candidate.boardRows.some((row) => !row.includes('.'))) throw new Error('Candidate setup contains a full row.');
}

const options = parseArguments(process.argv.slice(2));
const budget = { attempts: 0, limit: options.nodeBudget };
const byBoard = new Map();
let exhausted = false;
let processedSeeds = 0;
for (let offset = 0; offset < options.seedCount && !exhausted; offset += 1) {
  const setupSeed = (options.seedStart + offset) >>> 0 || 1;
  processedSeeds += 1;
  for (const setupCount of options.setupCounts) {
    const result = searchSeed(setupSeed, setupCount, options.targetRows, options.beamWidth, budget);
    exhausted ||= result.exhausted;
    for (const candidate of result.candidates) {
      const previous = byBoard.get(candidate.boardKey);
      if (!previous || candidate.authoringScore < previous.authoringScore) byBoard.set(candidate.boardKey, candidate);
    }
    if (exhausted) break;
  }
}

const candidates = [...byBoard.values()]
  .sort((left, right) => left.authoringScore - right.authoringScore
    || left.setupCount - right.setupCount
    || left.setupSeed - right.setupSeed
    || left.boardKey.localeCompare(right.boardKey))
  .slice(0, options.candidateCount);
for (const candidate of candidates) validateCandidate(candidate, options.targetRows);

const complete = !exhausted && candidates.length === options.candidateCount;
const output = Object.freeze({
  schemaVersion: 1,
  claim: 'Phase-7 setup candidates only; public Core route replay remains mandatory.',
  status: complete ? 'complete' : 'incomplete',
  constraints: Object.freeze({
    targetRows: options.targetRows,
    legalHardDrops: true,
    zeroSetupClears: true,
    hiddenCells: 0,
    mergedSameTypeOwners: false,
  }),
  options: Object.freeze({
    targetRows: options.targetRows,
    seedStart: options.seedStart,
    seedCount: options.seedCount,
    setupCounts: options.setupCounts,
    candidateCount: options.candidateCount,
    beamWidth: options.beamWidth,
    nodeBudget: options.nodeBudget,
  }),
  processedSeeds,
  attemptedLandings: budget.attempts,
  budgetExhausted: exhausted,
  candidates: Object.freeze(candidates),
});

mkdirSync(dirname(options.outputPath), { recursive: true });
writeFileSync(options.outputPath, `${JSON.stringify(output, null, 2)}\n`, { encoding: 'utf8' });
process.stdout.write(`${JSON.stringify({
  outputPath: options.outputPath,
  status: output.status,
  candidates: candidates.length,
  processedSeeds,
  attemptedLandings: budget.attempts,
  budgetExhausted: exhausted,
})}\n`);
if (!complete) process.exitCode = 2;
