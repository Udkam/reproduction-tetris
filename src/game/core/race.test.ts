import { describe, expect, it } from 'vitest';
import {
  BOARD_HEIGHT,
  ENTRY_DELAY_TICKS,
  LINE_CLEAR_DELAY_TICKS,
  STANDARD_GRAVITY_TICKS,
  SURVIVAL_LINES_PER_BEDROCK,
  gravityForMode,
  raceSpeedTier,
} from './constants';
import { canPlace, clearRows, createBoard, fullRows, setCell } from './board';
import { createInitialState, dispatch, replay, stateHash } from './engine';
import { BEDROCK_CELL, type Board, type GameCommand, type GameState } from './types';

function start(seed: number, mode: 'marathon' | 'race' | 'puzzle' = 'marathon'): GameState {
  return dispatch(createInitialState(seed, mode), { type: 'start' }).state;
}

function advance(state: GameState, ticks: number): GameState {
  let next = state;
  for (let index = 0; index < ticks; index += 1) next = dispatch(next, { type: 'tick' }).state;
  return next;
}

function singleClearBoard(bedrockRows = 0): { board: Board; active: GameState['active'] } {
  let board = createBoard();
  for (let offset = 0; offset < bedrockRows; offset += 1) {
    for (let x = 0; x < 10; x += 1) board = setCell(board, x, BOARD_HEIGHT - 1 - offset, BEDROCK_CELL);
  }
  const row = BOARD_HEIGHT - 1 - bedrockRows;
  for (let x = 0; x < 8; x += 1) board = setCell(board, x, row, 'J');
  return { board, active: { type: 'O', rotation: 0, x: 8, y: row - 1 } };
}

function resolveClear(state: GameState) {
  let transition = dispatch(state, { type: 'hard-drop' });
  expect(transition.state.phase).toBe('line-clear');
  for (let index = 0; index < LINE_CLEAR_DELAY_TICKS; index += 1) {
    transition = dispatch(transition.state, { type: 'tick' });
  }
  return transition;
}

describe('Survival rising-floor rules', () => {
  it('uses one fixed cadence in all three modes and retires the speed tier', () => {
    for (const mode of ['marathon', 'race', 'puzzle'] as const) {
      expect(gravityForMode(mode, 29, 10_000, 10_000)).toBe(STANDARD_GRAVITY_TICKS);
    }
    expect(raceSpeedTier(10_000, 10_000)).toBe(0);
  });

  it('raises the first permanent bedrock row when cleared lines move from four to five', () => {
    const setup = singleClearBoard();
    const transition = resolveClear({
      ...start(0x5005, 'race'),
      ...setup,
      lines: SURVIVAL_LINES_PER_BEDROCK - 1,
      score: 0,
      combo: 0,
    });

    expect(transition.state.status).toBe('playing');
    expect(transition.state.lines).toBe(5);
    expect(transition.state.score).toBe(40);
    expect(transition.state.combo).toBe(0);
    expect(transition.state.level).toBe(0);
    expect(transition.state.survivalBedrockRows).toBe(1);
    expect(transition.state.board.at(-1)).toEqual(Array(10).fill(BEDROCK_CELL));
    expect(transition.events).toContainEqual({ type: 'bedrock-raised', count: 1, height: 1 });
    expect(transition.events.some((event) => event.type === 'level-up')).toBe(false);
  });

  it('keeps earlier bedrock and raises a second stratum at ten cleared lines', () => {
    const setup = singleClearBoard(1);
    const transition = resolveClear({
      ...start(0x5010, 'race'),
      ...setup,
      lines: 9,
      survivalBedrockRows: 1,
    });

    expect(transition.state.survivalBedrockRows).toBe(2);
    expect(transition.state.board.slice(-2)).toEqual([
      Array(10).fill(BEDROCK_CELL),
      Array(10).fill(BEDROCK_CELL),
    ]);
  });

  it('never detects or removes bedrock as a clearable full row and blocks placement', () => {
    let board = createBoard();
    for (let x = 0; x < 10; x += 1) board = setCell(board, x, BOARD_HEIGHT - 1, BEDROCK_CELL);

    expect(fullRows(board)).toEqual([]);
    expect(clearRows(board, [BOARD_HEIGHT - 1])).toEqual(board);
    expect(canPlace(board, { type: 'O', rotation: 0, x: 4, y: BOARD_HEIGHT - 2 })).toBe(false);
  });

  it('fails closed before spawn when a catch-up rise would discard an occupied top row', () => {
    const setup = singleClearBoard();
    let board = setCell(setup.board, 0, 0, 'T');
    const transition = resolveClear({
      ...start(0x50ff, 'race'),
      ...setup,
      board,
      lines: 9,
      survivalBedrockRows: 0,
    });

    expect(transition.state.status).toBe('game-over');
    expect(transition.state.active).toBeNull();
    expect(transition.state.survivalBedrockRows).toBe(1);
    expect(transition.events).toContainEqual({ type: 'bedrock-raised', count: 1, height: 1 });
    expect(transition.events).toContainEqual({ type: 'game-over', reason: 'bedrock-overflow' });
  });

  it('keeps Survival replay deterministic and restart removes every bedrock row', () => {
    const commands: GameCommand[] = [
      { type: 'start' },
      { type: 'hard-drop' },
      ...Array.from({ length: ENTRY_DELAY_TICKS }, () => ({ type: 'tick' } as const)),
      { type: 'hard-drop' },
    ];
    const first = replay(0x5150, commands, 'race');
    const second = replay(0x5150, commands, 'race');
    expect(stateHash(first)).toBe(stateHash(second));
    expect(stateHash(first)).not.toBe(stateHash({ ...first, survivalBedrockRows: first.survivalBedrockRows + 1 }));

    const setup = singleClearBoard();
    const raised = resolveClear({ ...start(0x5150, 'race'), ...setup, lines: 4 }).state;
    const restarted = dispatch(raised, { type: 'restart' }).state;
    expect(restarted.mode).toBe('race');
    expect(restarted.survivalBedrockRows).toBe(0);
    expect(restarted.board.flat()).not.toContain(BEDROCK_CELL);
  });

  it('keeps Puzzle on base scoring with no Classic combo', () => {
    const setup = singleClearBoard();
    const transition = resolveClear({
      ...start(0x5151, 'puzzle'),
      ...setup,
      score: 0,
      combo: 7,
    });
    expect(transition.state.combo).toBe(0);
    expect(transition.state.score).toBe(40);
  });
});
