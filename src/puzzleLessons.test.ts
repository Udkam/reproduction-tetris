import { describe, expect, it } from 'vitest';
import phase7Batch1File from '../docs/workstreams/tetris-t15-puzzle/puzzle-levels-01-10.json';
import phase7Batch2File from '../docs/workstreams/tetris-t15-puzzle/puzzle-levels-11-20.json';
import t32Changed01To03File from '../docs/workstreams/tetris-t32-puzzle/puzzle-levels-changed-01-03.json';
import t32Changed04To06File from '../docs/workstreams/tetris-t32-puzzle/puzzle-levels-changed-04-06.json';
import t32Changed07To09File from '../docs/workstreams/tetris-t32-puzzle/puzzle-levels-changed-07-09.json';
import t32Changed10File from '../docs/workstreams/tetris-t32-puzzle/puzzle-levels-changed-10.json';
import { VISIBLE_START_ROW, cellsForPiece, createInitialState, dispatch } from './game/core';
import type { Cell, GameCommand, GameState, PuzzleId } from './game/core';
import { puzzleLandings, replayPuzzleRoute } from './game/core/puzzleRouteSearch';
import { PUZZLE_LESSONS, puzzleLessonFor } from './puzzleLessons';

type RouteArtifact = {
  levels: readonly {
    id: PuzzleId;
    routes: readonly { id: 'primary' | 'alternate'; commandStream: string }[];
  }[];
};

const HISTORICAL_ROUTE_LEVELS = [
  ...(phase7Batch1File as unknown as RouteArtifact).levels,
  ...(phase7Batch2File as unknown as RouteArtifact).levels,
];
const T32_ROUTE_LEVELS = [
  ...(t32Changed01To03File as unknown as RouteArtifact).levels,
  ...(t32Changed04To06File as unknown as RouteArtifact).levels,
  ...(t32Changed07To09File as unknown as RouteArtifact).levels,
  ...(t32Changed10File as unknown as RouteArtifact).levels,
];
const ROUTE_LEVELS = [...new Map(
  [...HISTORICAL_ROUTE_LEVELS, ...T32_ROUTE_LEVELS].map((level) => [level.id, level]),
).values()];

const SIDE_SLIP_LEVEL: PuzzleId = 't5r-drift-08';
const SIDE_SLIP_ROUTE = (t32Changed10File as unknown as RouteArtifact).levels[0]!.routes[0]!.commandStream;
const SIDE_SLIP_LOCK = '1,37|2,36|2,37|3,36';

function cellSignature(cells: readonly Cell[]): string {
  return [...cells]
    .sort((left, right) => left.x - right.x || left.y - right.y)
    .map(({ x, y }) => `${x},${y}`)
    .join('|');
}

function commandFor(token: string): GameCommand {
  switch (token) {
    case 'S': return { type: 'start' };
    case 'T': return { type: 'tick' };
    case 'D': return { type: 'soft-drop' };
    case 'L': return { type: 'move', dx: -1 };
    case 'R': return { type: 'move', dx: 1 };
    case 'H': return { type: 'hard-drop' };
    case 'C': return { type: 'rotate', direction: 1 };
    default: throw new Error(`Unknown Puzzle lesson token: ${token}`);
  }
}

describe('authored Puzzle technique lessons', () => {
  it('binds each lesson to two different completed public-command routes', () => {
    expect(new Set(PUZZLE_LESSONS.map(({ levelId }) => levelId)).size).toBe(PUZZLE_LESSONS.length);
    for (const lesson of PUZZLE_LESSONS) {
      const artifact = ROUTE_LEVELS.find(({ id }) => id === lesson.levelId);
      expect(artifact, lesson.levelId).toBeDefined();
      expect(artifact?.routes.map(({ id }) => id)).toEqual(['primary', 'alternate']);
      const replays = artifact!.routes.map(({ commandStream }) => replayPuzzleRoute(lesson.levelId, commandStream));
      expect(replays.every(({ state }) => state.status === 'finished'), lesson.levelId).toBe(true);
      expect(replays[0]!.locks.some((lock, index) => lock.signature !== replays[1]!.locks[index]?.signature), lesson.levelId).toBe(true);
      expect(puzzleLessonFor(lesson.levelId)).toBe(lesson);
    }
  });

  it('proves the anchor lesson with a timed public side-slip unavailable to ordinary hard drop', () => {
    const anchor = { x: 1, y: VISIBLE_START_ROW + 15 };
    let state: GameState = createInitialState(0x51a1f00d, 'puzzle', SIDE_SLIP_LEVEL);
    let firstDecision: GameState | null = null;
    let firstLock: readonly Cell[] | null = null;
    let enteredBelowAnchor = false;

    for (const token of SIDE_SLIP_ROUTE) {
      const command = commandFor(token);
      if (state.pieceCount === 0 && state.status === 'playing' && state.phase === 'active' && state.active) {
        firstDecision ??= state;
        const before = cellsForPiece(state.active);
        const transition = dispatch(state, command);
        if (command.type === 'move' && transition.state.active) {
          const after = cellsForPiece(transition.state.active);
          enteredBelowAnchor ||= after.some(({ x, y }) => x === anchor.x && y > anchor.y)
            && !before.some(({ x, y }) => x === anchor.x && y > anchor.y);
        }
        const locked = transition.events.find((event) => event.type === 'piece-locked');
        if (locked) firstLock = locked.cells;
        state = transition.state;
      } else {
        state = dispatch(state, command).state;
      }
    }

    expect(state.status).toBe('finished');
    expect(firstDecision).not.toBeNull();
    expect(firstLock && cellSignature(firstLock)).toBe(SIDE_SLIP_LOCK);
    expect(enteredBelowAnchor).toBe(true);
    const ordinaryLocks = new Set(puzzleLandings(firstDecision!).map(({ lock }) => cellSignature(lock.cells)));
    expect(ordinaryLocks.has(SIDE_SLIP_LOCK)).toBe(false);
  });
});
