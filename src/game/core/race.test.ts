import { describe, expect, it } from 'vitest';
import {
  BOARD_HEIGHT,
  ENTRY_DELAY_TICKS,
  LINE_CLEAR_DELAY_TICKS,
  PROGRESSIVE_GRAVITY_TICKS,
  STANDARD_GRAVITY_TICKS,
  SURVIVAL_LINES_PER_BEDROCK,
  TICKS_PER_SECOND,
  gravityForMode,
  raceSpeedTier,
  survivalIntervalSeconds,
  survivalIntervalTicks,
} from './constants';
import { canPlace, clearRows, createBoard, fullRows, lowerBedrock, setCell } from './board';
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

describe('progressive gravity and Survival intervals', () => {
  it('uses the exact shared ten-line gravity table with a final cap while Puzzle stays fixed', () => {
    PROGRESSIVE_GRAVITY_TICKS.forEach((ticks, tier) => {
      const lines = tier * 10;
      expect(gravityForMode('marathon', 0, 0, lines)).toBe(ticks);
      expect(gravityForMode('race', 0, 50_000, lines + 9)).toBe(ticks);
      expect(raceSpeedTier(50_000, lines)).toBe(tier);
    });
    expect(gravityForMode('marathon', 0, 0, 10_000)).toBe(3);
    expect(gravityForMode('race', 0, 0, 10_000)).toBe(3);
    expect(gravityForMode('puzzle', 99, 50_000, 10_000)).toBe(STANDARD_GRAVITY_TICKS);
  });

  it('starts at forty seconds, drops two seconds every five lines, and caps at ten', () => {
    expect(survivalIntervalSeconds(0)).toBe(40);
    expect(survivalIntervalSeconds(4)).toBe(40);
    expect(survivalIntervalSeconds(5)).toBe(38);
    expect(survivalIntervalSeconds(75)).toBe(10);
    expect(survivalIntervalSeconds(10_000)).toBe(10);
    expect(survivalIntervalTicks(5)).toBe(38 * TICKS_PER_SECOND);
  });
});

describe('timed Survival pressure and five-line reward', () => {
  it('advances only while playing, becomes pending exactly at zero, and then stops', () => {
    const ready = createInitialState(0x5040, 'race');
    expect(dispatch(ready, { type: 'tick' }).state.survivalPressureTicks).toBe(0);

    let state = dispatch(ready, { type: 'start' }).state;
    state = advance(state, survivalIntervalTicks(0) - 1);
    expect(state.survivalPressureTicks).toBe(survivalIntervalTicks(0) - 1);
    expect(state.survivalRisePending).toBe(false);
    state = dispatch(state, { type: 'tick' }).state;
    expect(state.survivalPressureTicks).toBe(survivalIntervalTicks(0));
    expect(state.survivalRisePending).toBe(true);
    expect(dispatch(state, { type: 'tick' }).state.survivalPressureTicks).toBe(survivalIntervalTicks(0));

    const paused = dispatch(state, { type: 'pause' }).state;
    expect(dispatch(paused, { type: 'tick' }).state).toEqual(paused);
  });

  it('raises one row at the next non-clearing lock, resets the timer, and waits to spawn', () => {
    const transition = dispatch({
      ...start(0x5001, 'race'),
      board: createBoard(),
      active: { type: 'O', rotation: 0, x: 4, y: 38 },
      survivalPressureTicks: survivalIntervalTicks(0),
      survivalRisePending: true,
    }, { type: 'hard-drop' });

    expect(transition.state.phase).toBe('entry');
    expect(transition.state.active).toBeNull();
    expect(transition.state.survivalBedrockRows).toBe(1);
    expect(transition.state.survivalPressureTicks).toBe(0);
    expect(transition.state.survivalRisePending).toBe(false);
    expect(transition.state.board.at(-1)).toEqual(Array(10).fill(BEDROCK_CELL));
    expect(transition.events.at(-1)).toEqual({ type: 'bedrock-raised', count: 1, height: 1 });

    const spawned = advance(transition.state, ENTRY_DELAY_TICKS);
    expect(spawned.active).not.toBeNull();
  });

  it('resolves a pressure row that becomes pending during entry before spawning', () => {
    const state: GameState = {
      ...start(0x5002, 'race'),
      active: null,
      phase: 'entry',
      phaseTicks: ENTRY_DELAY_TICKS - 1,
      survivalPressureTicks: survivalIntervalTicks(0) - 1,
    };
    const transition = dispatch(state, { type: 'tick' });
    expect(transition.state.active).not.toBeNull();
    expect(transition.state.survivalBedrockRows).toBe(1);
    expect(transition.state.survivalPressureTicks).toBe(0);
    expect(transition.events).toContainEqual({ type: 'bedrock-raised', count: 1, height: 1 });
  });

  it('orders ordinary clear, pending rise, and one five-line bedrock removal', () => {
    const setup = singleClearBoard(1);
    const transition = resolveClear({
      ...start(0x5005, 'race'),
      ...setup,
      lines: SURVIVAL_LINES_PER_BEDROCK - 1,
      survivalBedrockRows: 1,
      survivalPressureTicks: survivalIntervalTicks(4),
      survivalRisePending: true,
      score: 0,
    });

    expect(transition.state.lines).toBe(5);
    expect(transition.state.score).toBe(40);
    expect(transition.state.survivalBedrockRows).toBe(1);
    expect(transition.state.survivalPressureTicks).toBe(0);
    expect(transition.state.board.at(-1)).toEqual(Array(10).fill(BEDROCK_CELL));
    expect(transition.events.map((event) => event.type)).toEqual([
      'lines-cleared',
      'bedrock-raised',
      'bedrock-lowered',
    ]);
  });

  it('resets under the shorter interval at five lines even when no bedrock exists', () => {
    const setup = singleClearBoard();
    const transition = resolveClear({
      ...start(0x5038, 'race'),
      ...setup,
      lines: 4,
      survivalPressureTicks: 777,
    });
    expect(transition.state.lines).toBe(5);
    expect(transition.state.survivalBedrockRows).toBe(0);
    expect(transition.state.survivalPressureTicks).toBe(0);
    expect(transition.events.some((event) => event.type === 'bedrock-lowered')).toBe(false);
    expect(survivalIntervalTicks(transition.state.lines)).toBe(38 * TICKS_PER_SECOND);
  });

  it('fails closed on pressure overflow before the next spawn', () => {
    let board = createBoard();
    board = setCell(board, 0, 0, 'T');
    const transition = dispatch({
      ...start(0x50ff, 'race'),
      board,
      active: { type: 'O', rotation: 0, x: 4, y: 38 },
      survivalPressureTicks: survivalIntervalTicks(0),
      survivalRisePending: true,
    }, { type: 'hard-drop' });

    expect(transition.state.status).toBe('game-over');
    expect(transition.state.active).toBeNull();
    expect(transition.state.survivalBedrockRows).toBe(1);
    expect(transition.events).toContainEqual({ type: 'bedrock-raised', count: 1, height: 1 });
    expect(transition.events).toContainEqual({ type: 'game-over', reason: 'bedrock-overflow' });
  });

  it('keeps replay deterministic, hashes pressure state, and restart clears all pressure', () => {
    const commands: GameCommand[] = [
      { type: 'start' },
      ...Array.from({ length: 30 }, () => ({ type: 'tick' } as const)),
      { type: 'hard-drop' },
      ...Array.from({ length: ENTRY_DELAY_TICKS }, () => ({ type: 'tick' } as const)),
    ];
    const first = replay(0x5150, commands, 'race');
    const second = replay(0x5150, commands, 'race');
    expect(stateHash(first)).toBe(stateHash(second));
    expect(stateHash(first)).not.toBe(stateHash({ ...first, survivalPressureTicks: first.survivalPressureTicks + 1 }));
    expect(stateHash(first)).not.toBe(stateHash({ ...first, survivalRisePending: !first.survivalRisePending }));

    const withBedrock = {
      ...first,
      survivalBedrockRows: 1,
      survivalPressureTicks: 999,
      survivalRisePending: true,
      board: Array.from({ length: BOARD_HEIGHT }, (_, row) => row === BOARD_HEIGHT - 1
        ? Array(10).fill(BEDROCK_CELL)
        : Array(10).fill(null)) as Board,
    };
    const restarted = dispatch(withBedrock, { type: 'restart' }).state;
    expect(restarted.mode).toBe('race');
    expect(restarted.survivalBedrockRows).toBe(0);
    expect(restarted.survivalPressureTicks).toBe(0);
    expect(restarted.survivalRisePending).toBe(false);
    expect(restarted.board.flat()).not.toContain(BEDROCK_CELL);
  });
});

describe('bedrock board invariants', () => {
  it('never clears bedrock normally, blocks placement, and lowers only the bottom stratum', () => {
    let board = createBoard();
    for (let x = 0; x < 10; x += 1) board = setCell(board, x, BOARD_HEIGHT - 1, BEDROCK_CELL);
    board = setCell(board, 2, BOARD_HEIGHT - 2, 'T');

    expect(fullRows(board)).toEqual([]);
    expect(clearRows(board, [BOARD_HEIGHT - 1])).toEqual(board);
    expect(canPlace(board, { type: 'O', rotation: 0, x: 4, y: BOARD_HEIGHT - 2 })).toBe(false);

    const lowered = lowerBedrock(board, 1);
    expect(lowered.removed).toBe(1);
    expect(lowered.board[0]).toEqual(Array(10).fill(null));
    expect(lowered.board.at(-1)?.[2]).toBe('T');
    expect(lowerBedrock(lowered.board, 1).removed).toBe(0);
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
