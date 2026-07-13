import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH, LINE_CLEAR_DELAY_TICKS, LOCK_DELAY_TICKS } from './constants';
import { canPlace, createBoard, setCell } from './board';
import { createInitialState, dispatch, replay, stateHash } from './engine';
import { cellsForPiece, createSpawnPiece, PIECE_SHAPES } from './pieces';
import { createRandomizer, drawPiece } from './random';
import { PIECE_TYPES, type GameCommand, type GameState, type PieceType } from './types';

function playing(seed = 42): GameState {
  return dispatch(createInitialState(seed), { type: 'start' }).state;
}

function advance(state: GameState, ticks: number): GameState {
  let next = state;
  for (let tick = 0; tick < ticks; tick += 1) next = dispatch(next, { type: 'tick' }).state;
  return next;
}

describe('piece definitions', () => {
  it('defines four unique cells for every piece and rotation', () => {
    for (const type of PIECE_TYPES) {
      for (const rotation of [0, 1, 2, 3] as const) {
        const cells = PIECE_SHAPES[type][rotation];
        expect(cells).toHaveLength(4);
        expect(new Set(cells.map(({ x, y }) => `${x},${y}`)).size).toBe(4);
      }
    }
  });

  it('spawns each piece within the canonical 10 x 40 board', () => {
    const board = createBoard();
    expect(board).toHaveLength(BOARD_HEIGHT);
    expect(board.every((row) => row.length === BOARD_WIDTH)).toBe(true);
    for (const type of PIECE_TYPES) expect(canPlace(board, createSpawnPiece(type))).toBe(true);
  });
});

describe('deterministic randomizer', () => {
  it('emits each piece once in every seven-piece bag', () => {
    let randomizer = createRandomizer(1234);
    const pieces: PieceType[] = [];
    for (let index = 0; index < 21; index += 1) {
      const draw = drawPiece(randomizer);
      pieces.push(draw.piece);
      randomizer = draw.randomizer;
    }
    for (let index = 0; index < 21; index += 7) {
      expect([...pieces.slice(index, index + 7)].sort()).toEqual([...PIECE_TYPES].sort());
    }
  });

  it('replays identical queues from an identical seed', () => {
    expect(createInitialState(90210).queue).toEqual(createInitialState(90210).queue);
    expect(createInitialState(90210).active).toEqual(createInitialState(90210).active);
  });
});

describe('movement, rotation, drop, and lock', () => {
  it('moves horizontally but never through the board wall', () => {
    let state = playing();
    for (let index = 0; index < 12; index += 1) state = dispatch(state, { type: 'move', dx: -1 }).state;
    const leftmost = Math.min(...cellsForPiece(state.active!).map((cell) => cell.x));
    expect(leftmost).toBe(0);
    const blockedHash = stateHash(state);
    state = dispatch(state, { type: 'move', dx: -1 }).state;
    expect(stateHash(state)).toBe(blockedHash);
  });

  it('uses an I-piece wall kick when a rotation would cross the right wall', () => {
    const state: GameState = {
      ...playing(),
      active: { type: 'I', rotation: 1, x: 7, y: 24 },
      board: createBoard(),
    };
    const transition = dispatch(state, { type: 'rotate', direction: 1 });
    expect(transition.state.active?.rotation).toBe(2);
    expect(transition.state.active?.x).toBe(6);
    expect(transition.events[0]?.type).toBe('piece-rotated');
  });

  it('hard drops to the landing row, scores distance, and locks immediately', () => {
    const state = playing(7);
    const startY = state.active!.y;
    const transition = dispatch(state, { type: 'hard-drop' });
    const dropEvent = transition.events.find((event) => event.type === 'hard-dropped');
    expect(dropEvent?.type).toBe('hard-dropped');
    if (dropEvent?.type !== 'hard-dropped') throw new Error('Missing hard-drop event.');
    expect(dropEvent.distance).toBeGreaterThan(0);
    expect(transition.state.score).toBe(dropEvent.distance * 2);
    expect(transition.state.active).toBeNull();
    expect(transition.state.board.flat().filter(Boolean)).toHaveLength(4);
    expect(startY + dropEvent.distance).toBeGreaterThan(startY);
  });

  it('locks a grounded piece after exactly the lock delay', () => {
    const state: GameState = {
      ...playing(),
      board: createBoard(),
      active: { type: 'O', rotation: 0, x: 4, y: 38 },
      gravityTicks: 0,
      lockTicks: 0,
    };
    const beforeLock = advance(state, LOCK_DELAY_TICKS - 1);
    expect(beforeLock.active).not.toBeNull();
    const locked = advance(beforeLock, 1);
    expect(locked.active).toBeNull();
    expect(locked.board.flat().filter(Boolean)).toHaveLength(4);
  });
});

describe('hold, clear, score, and game state', () => {
  it('allows hold once per piece and preserves five previews', () => {
    const state = playing(83);
    const first = state.active!.type;
    const next = state.queue[0];
    const held = dispatch(state, { type: 'hold' }).state;
    expect(held.hold).toBe(first);
    expect(held.active?.type).toBe(next);
    expect(held.canHold).toBe(false);
    expect(held.queue).toHaveLength(5);
    expect(dispatch(held, { type: 'hold' }).state).toEqual(held);
  });

  it('clears a completed line atomically and awards classic line score', () => {
    let board = createBoard();
    for (let x = 0; x < 8; x += 1) board = setCell(board, x, 39, 'J');
    const state: GameState = {
      ...playing(),
      board,
      active: { type: 'O', rotation: 0, x: 8, y: 38 },
      score: 0,
      lines: 0,
      level: 0,
    };
    const locked = dispatch(state, { type: 'hard-drop' }).state;
    expect(locked.phase).toBe('line-clear');
    expect(locked.pendingClearRows).toEqual([39]);
    const cleared = advance(locked, LINE_CLEAR_DELAY_TICKS);
    expect(cleared.lines).toBe(1);
    expect(cleared.score).toBe(40);
    expect(cleared.board[39]?.filter(Boolean)).toHaveLength(2);
    expect(cleared.active).not.toBeNull();
  });

  it('freezes all canonical state while paused', () => {
    const state = playing();
    const paused = dispatch(state, { type: 'pause' }).state;
    const afterTicks = advance(paused, 100);
    expect(afterTicks).toEqual(paused);
    expect(dispatch(afterTicks, { type: 'resume' }).state.status).toBe('playing');
  });

  it('fails closed when a held piece cannot spawn', () => {
    let board = createBoard();
    for (const cell of cellsForPiece(createSpawnPiece('I'))) board = setCell(board, cell.x, cell.y, 'Z');
    const state: GameState = {
      ...playing(),
      board,
      active: { type: 'O', rotation: 0, x: 4, y: 30 },
      hold: 'I',
      canHold: true,
    };
    const transition = dispatch(state, { type: 'hold' });
    expect(transition.state.status).toBe('game-over');
    expect(transition.events.some((event) => event.type === 'game-over' && event.reason === 'block-out')).toBe(true);
  });
});

describe('replay', () => {
  it('produces the same state hash from the same seed and commands', () => {
    const commands: GameCommand[] = [
      { type: 'start' },
      { type: 'move', dx: -1 },
      { type: 'rotate', direction: 1 },
      ...Array.from({ length: 18 }, () => ({ type: 'tick' } as const)),
      { type: 'soft-drop' },
      { type: 'hard-drop' },
      ...Array.from({ length: 6 }, () => ({ type: 'tick' } as const)),
      { type: 'hold' },
    ];
    expect(stateHash(replay(4455, commands))).toBe(stateHash(replay(4455, commands)));
    expect(stateHash(replay(4455, commands))).not.toBe(stateHash(replay(4456, commands)));
  });
});
