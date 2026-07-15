const WIDTH = 10;
const HEIGHT = 40;
const VISIBLE_START = 20;
const FULL = (1 << WIDTH) - 1;
const TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
const TYPE_BIT = Object.fromEntries(TYPES.map((type, index) => [type, 1 << index]));

const SHAPES = {
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
};

function random(seed) {
  let value = seed >>> 0;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 0x1_0000_0000;
  };
}

function popcount(value) {
  let count = 0;
  for (let bits = value; bits; bits >>>= 1) count += bits & 1;
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

function place(rows, type, rotation, x) {
  const shape = SHAPES[type][rotation];
  let y = 19;
  if (!canPlace(rows, shape, x, y)) return null;
  while (canPlace(rows, shape, x, y + 1)) y += 1;
  const merged = [...rows];
  for (const [dx, dy] of shape) merged[y + dy] |= 1 << (x + dx);
  const clearedRows = [];
  for (let row = 0; row < HEIGHT; row += 1) if (merged[row] === FULL) clearedRows.push(row);
  const kept = merged.filter((_, row) => !clearedRows.includes(row));
  const next = [...Array.from({ length: clearedRows.length }, () => 0), ...kept];
  if (next.slice(0, VISIBLE_START).some(Boolean)) return null;
  return { rows: next, y, cleared: clearedRows.length };
}

function metrics(rows) {
  let occupied = 0;
  const heights = [];
  let holes = 0;
  for (const row of rows) occupied += popcount(row);
  for (let x = 0; x < WIDTH; x += 1) {
    let top = HEIGHT;
    for (let y = VISIBLE_START; y < HEIGHT; y += 1) {
      if ((rows[y] & (1 << x)) !== 0) {
        top = y;
        break;
      }
    }
    heights.push(HEIGHT - top);
    let filled = false;
    for (let y = VISIBLE_START; y < HEIGHT; y += 1) {
      if ((rows[y] & (1 << x)) !== 0) filled = true;
      else if (filled) holes += 1;
    }
  }
  const aggregate = heights.reduce((sum, value) => sum + value, 0);
  const bumpiness = heights.slice(1).reduce((sum, value, index) => sum + Math.abs(value - heights[index]), 0);
  return { occupied, holes, aggregate, bumpiness, maximum: Math.max(...heights) };
}

function routeCommands(type, rotation, x) {
  const commands = [];
  if (rotation === 1) commands.push({ type: 'rotate', direction: 1 });
  if (rotation === 2) commands.push({ type: 'rotate', direction: 1 }, { type: 'rotate', direction: 1 });
  if (rotation === 3) commands.push({ type: 'rotate', direction: -1 });
  const spawnX = type === 'O' ? 4 : 3;
  const dx = x < spawnX ? -1 : 1;
  for (let cursor = spawnX; cursor !== x; cursor += dx) commands.push({ type: 'move', dx });
  commands.push({ type: 'hard-drop' });
  return commands;
}

function score(node) {
  const value = metrics(node.rows);
  return value.occupied * 75 + value.holes * 150 + value.aggregate * 6
    + value.bumpiness * 10 + value.maximum * 12
    - node.clearedLines * 180 - node.clearPhases * 70
    - popcount(node.typeMask) * 18 - Math.min(node.rotations, 4) * 12
    - Math.min(popcount(node.xMask), 5) * 12 - Math.min(node.nonClearing, 2) * 10;
}

function placements(node) {
  const results = [];
  for (const type of TYPES) {
    if (node.lastType === type && node.sameRun >= 2) continue;
    const seen = new Set();
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const shape = SHAPES[type][rotation];
      const minX = -Math.min(...shape.map(([x]) => x));
      const maxX = WIDTH - 1 - Math.max(...shape.map(([x]) => x));
      for (let x = minX; x <= maxX; x += 1) {
        const placed = place(node.rows, type, rotation, x);
        if (!placed) continue;
        const key = boardKey(placed.rows);
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({ type, rotation, x, ...placed });
      }
    }
  }
  return results;
}

function solve(initialRows, maxDepth, beamWidth) {
  let beam = [{
    rows: initialRows,
    path: [],
    typeMask: 0,
    xMask: 0,
    rotations: 0,
    nonClearing: 0,
    clearPhases: 0,
    clearedLines: 0,
    lastType: null,
    sameRun: 0,
  }];

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const candidates = new Map();
    for (const node of beam) {
      for (const placed of placements(node)) {
        const rotationCommands = placed.rotation === 2 ? 2 : placed.rotation === 0 ? 0 : 1;
        const next = {
          rows: placed.rows,
          path: [...node.path, {
            type: placed.type,
            rotation: placed.rotation,
            x: placed.x,
            y: placed.y,
            cleared: placed.cleared,
          }],
          typeMask: node.typeMask | TYPE_BIT[placed.type],
          xMask: node.xMask | (1 << placed.x),
          rotations: node.rotations + rotationCommands,
          nonClearing: node.nonClearing + Number(placed.cleared === 0),
          clearPhases: node.clearPhases + Number(placed.cleared > 0),
          clearedLines: node.clearedLines + placed.cleared,
          lastType: placed.type,
          sameRun: node.lastType === placed.type ? node.sameRun + 1 : 1,
        };
        const occupied = metrics(next.rows).occupied;
        if (occupied === 0) {
          if (depth >= 10 && popcount(next.typeMask) >= 4 && next.rotations >= 4
            && popcount(next.xMask) >= 5 && next.nonClearing >= 1 && next.clearPhases >= 2) return next;
          continue;
        }
        const key = `${boardKey(next.rows)}|${next.typeMask}|${next.lastType}|${next.sameRun}`;
        const current = candidates.get(key);
        if (!current || score(next) < score(current)) candidates.set(key, next);
      }
    }
    beam = [...candidates.values()].sort((left, right) => score(left) - score(right)).slice(0, beamWidth);
    if (beam.length === 0) break;
  }
  return null;
}

function candidateBoard(seed, index) {
  const rand = random(seed ^ Math.imul(index + 1, 0x9e3779b1));
  const maximum = 7 + (index % 4);
  const heights = Array.from({ length: WIDTH }, () => 1 + Math.floor(rand() * maximum));
  const openColumns = [Math.floor(rand() * WIDTH), Math.floor(rand() * WIDTH)];
  while (openColumns[1] === openColumns[0]) openColumns[1] = Math.floor(rand() * WIDTH);
  heights[openColumns[0]] = 0;
  heights[openColumns[1]] = 0;
  heights[(openColumns[1] + 3) % WIDTH] = maximum;
  if (heights.reduce((sum, value) => sum + value, 0) % 2 !== 0) {
    const adjustable = heights.findIndex((value) => value > 0 && value < maximum);
    if (adjustable >= 0) heights[adjustable] += 1;
  }
  const rows = Array.from({ length: HEIGHT }, () => 0);
  for (let x = 0; x < WIDTH; x += 1) {
    for (let offset = 0; offset < heights[x]; offset += 1) rows[HEIGHT - 1 - offset] |= 1 << x;
  }
  return rows;
}

function visibleRows(rows) {
  return rows.slice(VISIBLE_START).map((mask) => Array.from({ length: WIDTH }, (_, x) => (
    (mask & (1 << x)) === 0 ? '.' : 'J'
  )).join(''));
}

function referenceCommands(path) {
  const commands = [{ type: 'start' }];
  for (let index = 0; index < path.length; index += 1) {
    const placement = path[index];
    commands.push(...routeCommands(placement.type, placement.rotation, placement.x));
    if (index < path.length - 1) {
      const delay = placement.cleared > 0 ? 12 : 3;
      for (let tick = 0; tick < delay; tick += 1) commands.push({ type: 'tick' });
    } else if (placement.cleared > 0) {
      for (let tick = 0; tick < 12; tick += 1) commands.push({ type: 'tick' });
    }
  }
  return commands;
}

const seed = Number(process.argv[2] ?? 0x75c0a001);
const wanted = Number(process.argv[3] ?? 1);
const maxCandidates = Number(process.argv[4] ?? 240);
const compact = process.argv[5] === 'compact';
const results = [];
for (let index = 0; index < maxCandidates && results.length < wanted; index += 1) {
  const rows = candidateBoard(seed, index);
  const nonEmpty = visibleRows(rows).filter((row) => row !== '.'.repeat(WIDTH));
  if (new Set(nonEmpty).size < 4) continue;
  const result = solve(rows, 16, 1800);
  if (!result) continue;
  results.push({
    candidateIndex: index,
    boardRows: visibleRows(rows),
    queue: result.path.map(({ type }) => type),
    placements: result.path,
    ...(!compact ? { commands: referenceCommands(result.path) } : {}),
    metrics: {
      queueLength: result.path.length,
      pieceTypes: popcount(result.typeMask),
      effectiveRotations: result.rotations,
      distinctLandingXs: popcount(result.xMask),
      nonClearingLocks: result.nonClearing,
      clearPhases: result.clearPhases,
      clearedLines: result.clearedLines,
    },
  });
  process.stderr.write(`found ${results.length}/${wanted} at candidate ${index}\n`);
}
process.stdout.write(`${JSON.stringify({ seed, results }, null, 2)}\n`);
