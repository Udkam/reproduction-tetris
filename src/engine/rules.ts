// The single source of truth for game rules. Used by the client (play), the
// server (authoritative replay/validation), and the solver (verification).
//
// Design choices that keep the rules deterministic and unambiguous:
//  - Only crates slide on ice; the player walks normally ("heavy crates, you
//    wear grippy boots"). This preserves the strategic core of ice — committing
//    a crate to a trajectory you can't take back — without navigation frustration.
//  - The player can never step into an unfilled pit (it acts as a wall for the
//    player); a crate pushed into a pit fills it permanently and is consumed.
//  - Gate openness is evaluated from the state at the *start* of a move and held
//    constant for the whole move resolution, then recomputed for the next move.

import type { Cell, Crate, Dir, GameState, Level, MoveEffect, MoveResult } from './types.js';
import { DIRS, idx } from './types.js';

export function cellAt(level: Level, x: number, y: number): Cell | null {
  if (x < 0 || y < 0 || x >= level.width || y >= level.height) return null;
  return level.cells[idx(level, x, y)] ?? null;
}

export function crateAt(state: GameState, x: number, y: number): Crate | undefined {
  return state.crates.find((c) => c.x === x && c.y === y);
}

/** How many plates of a group are currently weighed down (by player or a crate). */
export function pressedPlateCount(level: Level, state: GameState, group: string): number {
  let n = 0;
  for (let i = 0; i < level.cells.length; i++) {
    if (level.cells[i]!.plateGroup !== group) continue;
    const x = i % level.width;
    const y = Math.floor(i / level.width);
    const weighed =
      (state.playerX === x && state.playerY === y) ||
      state.crates.some((c) => c.x === x && c.y === y);
    if (weighed) n++;
  }
  return n;
}

export function computeOpenGates(level: Level, state: GameState): Set<string> {
  const open = new Set<string>();
  for (const group of Object.keys(level.gateThreshold)) {
    if (pressedPlateCount(level, state, group) >= level.gateThreshold[group]!) open.add(group);
  }
  return open;
}

function isFilled(state: GameState, index: number): boolean {
  return state.filled.includes(index);
}

/** Can the player step onto (x, y)? Crates block; pushing is handled separately. */
export function playerCanEnter(
  level: Level,
  state: GameState,
  x: number,
  y: number,
  openGates: Set<string>,
): boolean {
  const cell = cellAt(level, x, y);
  if (!cell || cell.terrain === 'wall') return false;
  if (cell.terrain === 'pit' && !isFilled(state, idx(level, x, y))) return false;
  if (cell.gateGroup && !openGates.has(cell.gateGroup)) return false;
  if (crateAt(state, x, y)) return false;
  return true;
}

/** Can a crate (other than the one moving) occupy (x, y)? Pits are enterable (they get filled). */
function crateCanEnter(
  level: Level,
  state: GameState,
  x: number,
  y: number,
  openGates: Set<string>,
  movingId: number,
): boolean {
  const cell = cellAt(level, x, y);
  if (!cell || cell.terrain === 'wall') return false;
  if (cell.gateGroup && !openGates.has(cell.gateGroup)) return false;
  const other = state.crates.find((c) => c.x === x && c.y === y && c.id !== movingId);
  if (other) return false;
  return true;
}

interface PushOutcome {
  moved: boolean;
  sank: boolean;
  to: { x: number; y: number };
  fillIndex?: number;
}

/** Resolve a crate being pushed in `dir`, including any slide across ice. */
function resolveCratePush(
  level: Level,
  state: GameState,
  crate: Crate,
  dir: Dir,
  openGates: Set<string>,
): PushOutcome {
  const { dx, dy } = DIRS[dir];
  let nx = crate.x + dx;
  let ny = crate.y + dy;
  if (!crateCanEnter(level, state, nx, ny, openGates, crate.id)) {
    return { moved: false, sank: false, to: { x: crate.x, y: crate.y } };
  }

  let cx = crate.x;
  let cy = crate.y;
  // Step the crate forward; keep sliding while it lands on ice and the way is clear.
  for (;;) {
    const cell = cellAt(level, nx, ny)!;
    if (cell.terrain === 'pit' && !isFilled(state, idx(level, nx, ny))) {
      return { moved: true, sank: true, to: { x: nx, y: ny }, fillIndex: idx(level, nx, ny) };
    }
    cx = nx;
    cy = ny;
    if (cell.terrain !== 'ice') break; // landed on solid ground -> stop
    const px = cx + dx;
    const py = cy + dy;
    if (!crateCanEnter(level, state, px, py, openGates, crate.id)) break; // blocked -> stop on ice
    nx = px;
    ny = py;
  }
  return { moved: true, sank: false, to: { x: cx, y: cy } };
}

const manhattan = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/** Apply one move. Returns a brand-new immutable state (or the same one if blocked). */
export function applyMove(level: Level, state: GameState, dir: Dir): MoveResult {
  const { dx, dy } = DIRS[dir];
  const openGates = computeOpenGates(level, state);
  const tx = state.playerX + dx;
  const ty = state.playerY + dy;
  const from = { x: state.playerX, y: state.playerY };
  const target = crateAt(state, tx, ty);

  if (target) {
    const push = resolveCratePush(level, state, target, dir, openGates);
    if (!push.moved) return { changed: false, state };

    const slid = !push.sank && manhattan({ x: target.x, y: target.y }, push.to) > 1;
    let crates: Crate[];
    let filled = state.filled;
    if (push.sank) {
      crates = state.crates.filter((c) => c.id !== target.id);
      filled = [...state.filled, push.fillIndex!];
    } else {
      crates = state.crates.map((c) =>
        c.id === target.id ? { ...c, x: push.to.x, y: push.to.y } : c,
      );
    }
    const next: GameState = {
      playerX: tx,
      playerY: ty,
      crates,
      filled,
      moves: state.moves + 1,
      pushes: state.pushes + 1,
    };
    const effect: MoveEffect = {
      dir,
      player: { from, to: { x: tx, y: ty } },
      crate: {
        id: target.id,
        from: { x: target.x, y: target.y },
        to: push.to,
        slid,
        sank: push.sank,
      },
    };
    if (push.sank) effect.filledPit = push.fillIndex!;
    return { changed: true, state: next, effect };
  }

  if (!playerCanEnter(level, state, tx, ty, openGates)) return { changed: false, state };
  const next: GameState = {
    playerX: tx,
    playerY: ty,
    crates: state.crates,
    filled: state.filled,
    moves: state.moves + 1,
    pushes: state.pushes,
  };
  return { changed: true, state: next, effect: { dir, player: { from, to: { x: tx, y: ty } } } };
}

/** Every goal covered by a crate of the right color? */
export function isSolved(level: Level, state: GameState): boolean {
  for (let i = 0; i < level.cells.length; i++) {
    const goal = level.cells[i]!.goal;
    if (!goal) continue;
    const x = i % level.width;
    const y = Math.floor(i / level.width);
    const crate = crateAt(state, x, y);
    if (!crate) return false;
    if (goal !== 'natural' && crate.color !== goal) return false;
  }
  return true;
}

/** Canonical key for solver/dedup. Crates are sorted so identical layouts collapse. */
export function stateKey(state: GameState): string {
  const cr = state.crates
    .map((c) => `${c.x},${c.y},${c.color}`)
    .sort()
    .join('|');
  const fl = [...state.filled].sort((a, b) => a - b).join(',');
  return `${state.playerX},${state.playerY};${cr};${fl}`;
}
