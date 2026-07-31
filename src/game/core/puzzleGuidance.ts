import { ANCHOR_CELL, type Board, type GameState, type PieceType } from './types';
import { puzzleLandings } from './puzzleRouteSearch';

export type PuzzleGuidanceStrategy =
  | 'direct-clear'
  | 'repair-hole'
  | 'preserve-well'
  | 'flatten-skyline';

export type PuzzlePieceRole =
  | 'long-well'
  | 'flat-cap'
  | 'junction'
  | 'offset'
  | 'edge-turn';

export interface PuzzleQueueRole {
  piece: PieceType;
  role: PuzzlePieceRole;
}

export interface PuzzleGuidance {
  activePiece: PieceType;
  directClearLandings: number;
  safeLandings: number;
  buriedHoles: number;
  minimumBurden: number;
  strategy: PuzzleGuidanceStrategy;
  queueRoles: readonly PuzzleQueueRole[];
}

function coordinateKey(x: number, y: number): string {
  return `${x}:${y}`;
}

function isStackCell(cell: Board[number][number]): boolean {
  return cell !== null && cell !== ANCHOR_CELL;
}

/** Empty cells below the first ordinary stack cell in each column. Fixed pegs are not roofs. */
export function countPuzzleBuriedHoles(board: Board): number {
  let holes = 0;
  for (let x = 0; x < board[0]!.length; x += 1) {
    let roofFound = false;
    for (const row of board) {
      if (isStackCell(row[x]!)) roofFound = true;
      else if (roofFound && row[x] === null) holes += 1;
    }
  }
  return holes;
}

function nonTargetBurden(state: GameState): number {
  const targets = new Set(state.puzzleTargetCells.map((cell) => coordinateKey(cell.x, cell.y)));
  let burden = 0;
  for (let y = 0; y < state.board.length; y += 1) {
    for (let x = 0; x < state.board[y]!.length; x += 1) {
      const cell = state.board[y]![x]!;
      if (isStackCell(cell) && !targets.has(coordinateKey(x, y))) burden += 1;
    }
  }
  return burden;
}

function columnHeights(board: Board): number[] {
  return board[0]!.map((_, x) => {
    const first = board.findIndex((row) => isStackCell(row[x]!));
    return first < 0 ? 0 : board.length - first;
  });
}

function hasNarrowWell(board: Board): boolean {
  const heights = columnHeights(board);
  return heights.some((height, x) => {
    const left = x === 0 ? Number.POSITIVE_INFINITY : heights[x - 1]!;
    const right = x === heights.length - 1 ? Number.POSITIVE_INFINITY : heights[x + 1]!;
    return Math.min(left, right) - height >= 2;
  });
}

export function puzzleRoleForPiece(piece: PieceType): PuzzlePieceRole {
  if (piece === 'I') return 'long-well';
  if (piece === 'O') return 'flat-cap';
  if (piece === 'T') return 'junction';
  if (piece === 'S' || piece === 'Z') return 'offset';
  return 'edge-turn';
}

/**
 * Bounded, deterministic diagnosis of the current decision. This uses the same legal
 * landing enumerator as route validation but never searches beyond the current piece.
 */
export function analyzePuzzleGuidance(state: GameState): PuzzleGuidance | null {
  if (state.mode !== 'puzzle' || state.status !== 'playing' || state.phase !== 'active' || state.active === null) {
    return null;
  }

  const beforeTargets = state.puzzleTargetCells.length;
  const beforeHoles = countPuzzleBuriedHoles(state.board);
  const beforeBurden = nonTargetBurden(state);
  const landings = puzzleLandings(state);
  if (landings.length === 0) return null;

  const outcomes = landings.map((landing) => ({
    clearsTarget: landing.state.puzzleTargetCells.length < beforeTargets,
    holes: countPuzzleBuriedHoles(landing.state.board),
    addedBurden: Math.max(0, nonTargetBurden(landing.state) - beforeBurden),
  }));
  const minimumBurden = Math.min(...outcomes.map((outcome) => outcome.addedBurden));
  const directClearLandings = outcomes.filter((outcome) => outcome.clearsTarget).length;
  const safeLandings = outcomes.filter((outcome) => (
    outcome.holes <= beforeHoles && outcome.addedBurden === minimumBurden
  )).length;

  let strategy: PuzzleGuidanceStrategy = 'flatten-skyline';
  if (directClearLandings > 0) strategy = 'direct-clear';
  else if (outcomes.some((outcome) => outcome.holes < beforeHoles)) strategy = 'repair-hole';
  else if (hasNarrowWell(state.board)) strategy = 'preserve-well';

  return Object.freeze({
    activePiece: state.active.type,
    directClearLandings,
    safeLandings,
    buriedHoles: beforeHoles,
    minimumBurden,
    strategy,
    queueRoles: Object.freeze(state.queue.slice(0, 2).map((piece) => Object.freeze({
      piece,
      role: puzzleRoleForPiece(piece),
    }))),
  });
}
