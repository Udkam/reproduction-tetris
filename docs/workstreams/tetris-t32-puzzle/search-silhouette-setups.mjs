/**
 * Deterministic T32 authoring search for the three signature hard-level silhouettes.
 *
 * The search accepts only legal spawn-to-hard-drop placements, never clears a setup
 * row, never writes hidden cells, and rejects touching cells from separate tetrominoes
 * of the same type. Output is an authoring candidate until public Core route replay
 * proves two completions for the corresponding product level.
 *
 * Usage:
 *   node search-silhouette-setups.mjs
 *     --shape lower-triangle|pyramid|hollow-roof
 *     --seed-start <uint32> --seed-count <positive-int>
 *     --node-budget <positive-int> --output <explicit-json-path>
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

const SILHOUETTES = Object.freeze({
  'lower-triangle': Object.freeze({
    setupCount: 9,
    targetRows: 6,
    description: 'A six-row lower-left stepped triangle.',
    heights: Object.freeze([6, 6, 5, 5, 4, 4, 3, 3, 0, 0]),
  }),
  pyramid: Object.freeze({
    setupCount: 10,
    targetRows: 6,
    description: 'A six-row centred stepped pyramid with open edge columns.',
    heights: Object.freeze([0, 3, 5, 6, 6, 6, 6, 5, 3, 0]),
  }),
  'hollow-roof': Object.freeze({
    setupCount: 10,
    targetRows: 7,
    description: 'Two seven-row side walls with narrow inward roof ledges and a hollow centre.',
    cells: Object.freeze([
      ...[0, 1, 8, 9].flatMap((x) => Array.from({ length: 7 }, (_, rowFromBottom) => [x, rowFromBottom])),
      ...[0, 1, 2, 4, 5, 6].flatMap((rowFromBottom) => [2, 7].map((x) => [x, rowFromBottom])),
    ]),
  }),
});

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) throw new Error('Expected explicit --name value pairs.');
    values.set(key, value);
  }
  const shapeName = values.get('--shape');
  if (!shapeName || !(shapeName in SILHOUETTES)) throw new Error('--shape must name a supported silhouette.');
  const integer = (name, minimum, maximum) => {
    const value = Number(values.get(name));
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
      throw new Error(`${name} must be an integer from ${minimum} through ${maximum}.`);
    }
    return value;
  };
  const output = values.get('--output');
  if (!output) throw new Error('--output is required.');
  return Object.freeze({
    shapeName,
    seedStart: integer('--seed-start', 1, 0xffff_ffff),
    seedCount: integer('--seed-count', 1, 10_000_000),
    nodeBudget: integer('--node-budget', 1, 1_000_000_000),
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
  return Object.freeze(sequence);
}

function rowsForSilhouette(silhouette) {
  const rows = Array.from({ length: HEIGHT }, () => 0);
  const cells = silhouette.heights
    ? silhouette.heights.flatMap((height, x) => Array.from({ length: height }, (_, rowFromBottom) => [x, rowFromBottom]))
    : silhouette.cells;
  for (const [x, rowFromBottom] of cells) rows[HEIGHT - 1 - rowFromBottom] |= 1 << x;
  if (cells.length !== silhouette.setupCount * 4) throw new Error('Silhouette cell count does not match setup count.');
  if (rows.some((row) => row === FULL_ROW)) throw new Error('Silhouette contains a full setup row.');
  return Object.freeze(rows);
}

function canPlace(rows, shape, x, y) {
  return shape.every(([dx, dy]) => {
    const cellX = x + dx;
    const cellY = y + dy;
    return cellX >= 0 && cellX < WIDTH && cellY >= 0 && cellY < HEIGHT
      && (rows[cellY] & (1 << cellX)) === 0;
  });
}

function landing(rows, typeRows, targetRows, type, rotation, x) {
  const shape = SHAPES[type][rotation];
  let y = VISIBLE_START - 1;
  if (!canPlace(rows, shape, x, y)) return null;
  while (canPlace(rows, shape, x, y + 1)) y += 1;
  const cells = shape.map(([dx, dy]) => [x + dx, y + dy]);
  if (cells.some(([cellX, cellY]) => (targetRows[cellY] & (1 << cellX)) === 0)) return null;

  const ownCells = new Set(cells.map(([cellX, cellY]) => `${cellX}:${cellY}`));
  for (const [cellX, cellY] of cells) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      if (ownCells.has(`${cellX + dx}:${cellY + dy}`)) continue;
      const neighbourX = cellX + dx;
      const neighbourY = cellY + dy;
      if (neighbourX >= 0 && neighbourX < WIDTH && neighbourY >= 0 && neighbourY < HEIGHT
        && (typeRows[type][neighbourY] & (1 << neighbourX)) !== 0) return null;
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

function relevantRowsKey(rows, topRow) {
  return rows.slice(topRow).map((row) => row.toString(36)).join('.');
}

function visibleBoardRows(targetRows) {
  return targetRows.slice(VISIBLE_START).map((row) => Array.from({ length: WIDTH }, (_, x) => (
    (row & (1 << x)) === 0 ? '.' : '#'
  )).join(''));
}

function enumerateStaticPlacements(targetRows, targetTopRow) {
  const targetCells = [];
  const targetCellIndex = new Map();
  for (let y = targetTopRow; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if ((targetRows[y] & (1 << x)) === 0) continue;
      targetCellIndex.set(`${x}:${y}`, targetCells.length);
      targetCells.push(Object.freeze([x, y]));
    }
  }

  const placements = [];
  const seen = new Set();
  for (const type of TYPES) {
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const shape = SHAPES[type][rotation];
      const minimumX = -Math.min(...shape.map(([cellX]) => cellX));
      const maximumX = WIDTH - 1 - Math.max(...shape.map(([cellX]) => cellX));
      const minimumY = targetTopRow - Math.min(...shape.map(([, cellY]) => cellY));
      const maximumY = HEIGHT - 1 - Math.max(...shape.map(([, cellY]) => cellY));
      for (let y = minimumY; y <= maximumY; y += 1) {
        for (let x = minimumX; x <= maximumX; x += 1) {
          const cells = shape.map(([dx, dy]) => Object.freeze([x + dx, y + dy]));
          const indexes = cells.map(([cellX, cellY]) => targetCellIndex.get(`${cellX}:${cellY}`));
          if (indexes.some((index) => index === undefined)) continue;
          const cellKey = [...indexes].sort((left, right) => left - right).join(',');
          const dedupeKey = `${type}:${cellKey}`;
          if (seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);
          let cellMask = 0n;
          for (const index of indexes) cellMask |= 1n << BigInt(index);
          const ownCellKeys = new Set(cells.map(([cellX, cellY]) => `${cellX}:${cellY}`));
          let sameTypeForbiddenMask = 0n;
          for (const [cellX, cellY] of cells) {
            for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
              const key = `${cellX + dx}:${cellY + dy}`;
              if (ownCellKeys.has(key)) continue;
              const index = targetCellIndex.get(key);
              if (index !== undefined) sameTypeForbiddenMask |= 1n << BigInt(index);
            }
          }
          placements.push(Object.freeze({
            type, rotation, x, y, cells, cellMask, sameTypeForbiddenMask,
          }));
        }
      }
    }
  }

  const byCell = Array.from({ length: targetCells.length }, () => []);
  for (const [placementIndex, placement] of placements.entries()) {
    for (let cellIndex = 0; cellIndex < targetCells.length; cellIndex += 1) {
      if ((placement.cellMask & (1n << BigInt(cellIndex))) !== 0n) byCell[cellIndex].push(placementIndex);
    }
  }
  return Object.freeze({
    targetCells: Object.freeze(targetCells),
    placements: Object.freeze(placements),
    byCell: Object.freeze(byCell.map((indexes) => Object.freeze(indexes))),
    fullMask: (1n << BigInt(targetCells.length)) - 1n,
  });
}

function findLegalHardDropOrder(chosen, targetRows, budget) {
  const emptyRows = Array.from({ length: HEIGHT }, () => 0);
  const emptyTypeRows = Object.fromEntries(TYPES.map((type) => [type, [...emptyRows]]));
  const failed = new Set();

  function visit(order, remaining, rows, typeRows) {
    if (remaining.length === 0) return order;
    const depth = order.length;
    const bagStart = depth < 7 ? 0 : 7;
    const usedInBag = new Set(order.slice(bagStart).map((placement) => placement.type));
    const stateKey = `${remaining.join(',')}|${relevantRowsKey(rows, targetRows.findIndex(Boolean))}`;
    if (failed.has(stateKey)) return null;

    for (const chosenIndex of remaining) {
      budget.attempts += 1;
      if (budget.attempts > budget.limit) return null;
      const candidate = chosen[chosenIndex];
      if (usedInBag.has(candidate.type)) continue;
      const placed = landing(rows, typeRows, targetRows, candidate.type, candidate.rotation, candidate.x);
      if (!placed || placed.landingY !== candidate.y) continue;
      const result = visit(
        [...order, candidate],
        remaining.filter((index) => index !== chosenIndex),
        placed.rows,
        placed.typeRows,
      );
      if (result) return result;
      if (budget.attempts > budget.limit) return null;
    }
    failed.add(stateKey);
    return null;
  }

  return visit([], chosen.map((_, index) => index), emptyRows, emptyTypeRows);
}

function solveStaticTiling(silhouette, targetRows, targetTopRow, budget) {
  const catalog = enumerateStaticPlacements(targetRows, targetTopRow);
  const chosen = [];
  const typeCounts = Object.fromEntries(TYPES.map((type) => [type, 0]));
  const typeMasks = Object.fromEntries(TYPES.map((type) => [type, 0n]));
  const extraCount = silhouette.setupCount - TYPES.length;

  function placementAllowed(placement, occupiedMask) {
    if ((placement.cellMask & occupiedMask) !== 0n) return false;
    if (typeCounts[placement.type] >= 2) return false;
    if (typeCounts[placement.type] === 1
      && TYPES.filter((type) => typeCounts[type] === 2).length >= extraCount) return false;
    return (typeMasks[placement.type] & placement.sameTypeForbiddenMask) === 0n;
  }

  function visit(occupiedMask) {
    if (occupiedMask === catalog.fullMask) {
      if (chosen.length !== silhouette.setupCount
        || TYPES.some((type) => typeCounts[type] < 1 || typeCounts[type] > 2)
        || TYPES.filter((type) => typeCounts[type] === 2).length !== extraCount) return null;
      const order = findLegalHardDropOrder(chosen, targetRows, budget);
      return order ? Object.freeze([...order]) : null;
    }
    if (chosen.length >= silhouette.setupCount || budget.attempts > budget.limit) return null;
    const remainingSlots = silhouette.setupCount - chosen.length;
    if (TYPES.filter((type) => typeCounts[type] === 0).length > remainingSlots) return null;

    let selectedCandidates = null;
    for (let cellIndex = 0; cellIndex < catalog.targetCells.length; cellIndex += 1) {
      if ((occupiedMask & (1n << BigInt(cellIndex))) !== 0n) continue;
      const candidates = catalog.byCell[cellIndex]
        .map((placementIndex) => catalog.placements[placementIndex])
        .filter((placement) => placementAllowed(placement, occupiedMask));
      if (candidates.length === 0) return null;
      if (!selectedCandidates || candidates.length < selectedCandidates.length) selectedCandidates = candidates;
    }

    selectedCandidates.sort((left, right) => right.y - left.y
      || left.type.localeCompare(right.type)
      || left.rotation - right.rotation
      || left.x - right.x);
    for (const placement of selectedCandidates) {
      budget.attempts += 1;
      if (budget.attempts > budget.limit) return null;
      chosen.push(placement);
      typeCounts[placement.type] += 1;
      const previousTypeMask = typeMasks[placement.type];
      typeMasks[placement.type] |= placement.cellMask;
      const result = visit(occupiedMask | placement.cellMask);
      if (result) return result;
      typeMasks[placement.type] = previousTypeMask;
      typeCounts[placement.type] -= 1;
      chosen.pop();
    }
    return null;
  }

  const order = visit(0n);
  return Object.freeze({ order, catalogPlacements: catalog.placements.length });
}

function findSeedForOrder(order, seedStart, seedCount) {
  const typeSequence = order.map((placement) => placement.type).join('');
  for (let offset = 0; offset < seedCount; offset += 1) {
    const seed = (seedStart + offset) >>> 0 || 1;
    if (sequenceForSeed(seed, order.length).join('') === typeSequence) {
      return Object.freeze({ seed, processedSeeds: offset + 1 });
    }
  }
  return Object.freeze({ seed: null, processedSeeds: seedCount });
}

const options = parseArguments(process.argv.slice(2));
const silhouette = SILHOUETTES[options.shapeName];
const targetRows = rowsForSilhouette(silhouette);
const targetTopRow = targetRows.findIndex(Boolean);
const budget = { attempts: 0, limit: options.nodeBudget };
const solved = solveStaticTiling(silhouette, targetRows, targetTopRow, budget);
const seedResult = solved.order
  ? findSeedForOrder(solved.order, options.seedStart, options.seedCount)
  : Object.freeze({ seed: null, processedSeeds: 0 });
const result = solved.order && seedResult.seed
  ? Object.freeze({
    seed: seedResult.seed,
    sequence: Object.freeze(solved.order.map((placement) => placement.type)),
    placements: Object.freeze(solved.order.map(({ type, rotation, x }) => Object.freeze({ type, rotation, x }))),
  })
  : null;

const output = Object.freeze({
  schemaVersion: 1,
  claim: 'T32 silhouette setup candidate; two public Core completion routes remain mandatory.',
  status: result
    ? 'candidate'
    : budget.attempts > budget.limit
      ? 'budget-exhausted'
      : solved.order
        ? 'seed-not-found'
        : 'not-found',
  shape: options.shapeName,
  description: silhouette.description,
  setupCount: silhouette.setupCount,
  targetRows: silhouette.targetRows,
  setupSeed: result?.seed ?? null,
  sequence: result?.sequence ?? null,
  placements: result?.placements ?? null,
  boardRows: visibleBoardRows(targetRows),
  search: Object.freeze({
    seedStart: options.seedStart,
    seedCount: options.seedCount,
    processedSeeds: seedResult.processedSeeds,
    catalogPlacements: solved.catalogPlacements,
    attemptedLandings: budget.attempts,
    nodeBudget: options.nodeBudget,
  }),
});

mkdirSync(dirname(options.outputPath), { recursive: true });
writeFileSync(options.outputPath, `${JSON.stringify(output, null, 2)}\n`, { encoding: 'utf8' });
process.stdout.write(`${JSON.stringify({
  status: output.status,
  shape: output.shape,
  setupSeed: output.setupSeed,
  processedSeeds: seedResult.processedSeeds,
  catalogPlacements: solved.catalogPlacements,
  attemptedLandings: budget.attempts,
  outputPath: options.outputPath,
})}\n`);
if (!result) process.exitCode = 2;
