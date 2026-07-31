import { describe, expect, it } from 'vitest';
import {
  BOARD_HEIGHT,
  ENTRY_DELAY_TICKS,
  INITIAL_SURVIVAL_BEDROCK_ROWS,
  LINE_CLEAR_DELAY_TICKS,
  PROGRESSIVE_GRAVITY_TICKS,
  STANDARD_GRAVITY_TICKS,
  SURVIVAL_GRAVITY_TICKS,
  SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS,
  SURVIVAL_DEBRIS_MIN_INTERVAL_SECONDS,
  SURVIVAL_DEBRIS_WARNING_SECONDS,
  SURVIVAL_LINES_PER_BEDROCK,
  TICKS_PER_SECOND,
  VISIBLE_START_ROW,
  gravityForMode,
  survivalIntervalSeconds,
  survivalIntervalTicks,
} from './constants';
import { canPlace, clearRows, createBoard, fullRows, lowerBedrock, setCell } from './board';
import { createInitialState, dispatch, dropDistance, replay, stateHash } from './engine';
import { BEDROCK_CELL, SURVIVAL_STONE_CELL, type Board, type GameCommand, type GameState } from './types';

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
  it('uses ten-line Classic tiers and a faster fixed Survival cadence', () => {
    PROGRESSIVE_GRAVITY_TICKS.forEach((ticks, tier) => {
      expect(gravityForMode('marathon', 0, 0, tier * 10)).toBe(ticks);
    });
    expect(gravityForMode('marathon', 0, 0, 10_000)).toBe(3);
    expect(gravityForMode('race', 0, 0, 0)).toBe(SURVIVAL_GRAVITY_TICKS);
    expect(gravityForMode('race', 0, 50_000, 10_000)).toBe(SURVIVAL_GRAVITY_TICKS);
    expect(gravityForMode('puzzle', 99, 50_000, 10_000)).toBe(STANDARD_GRAVITY_TICKS);
  });

  it('starts at thirteen seconds, drops one second every three lines, and caps at six', () => {
    expect(survivalIntervalSeconds(0)).toBe(13);
    expect(survivalIntervalSeconds(2)).toBe(13);
    expect(survivalIntervalSeconds(3)).toBe(12);
    expect(survivalIntervalSeconds(21)).toBe(6);
    expect(survivalIntervalSeconds(10_000)).toBe(6);
    expect(survivalIntervalTicks(3)).toBe(12 * TICKS_PER_SECOND);
  });
});

describe('timed Survival pressure and three-line reward', () => {
  it('opens and restarts with the configured three unbreakable bedrock rows', () => {
    const opened = createInitialState(0x5000, 'race');
    expect(opened.survivalBedrockRows).toBe(INITIAL_SURVIVAL_BEDROCK_ROWS);
    expect(opened.board.slice(-INITIAL_SURVIVAL_BEDROCK_ROWS).every((row) => row.every((cell) => cell === BEDROCK_CELL))).toBe(true);

    const restarted = dispatch({ ...opened, survivalBedrockRows: 1, board: createBoard() }, { type: 'restart' }).state;
    expect(restarted.survivalBedrockRows).toBe(INITIAL_SURVIVAL_BEDROCK_ROWS);
    expect(restarted.board.slice(-INITIAL_SURVIVAL_BEDROCK_ROWS).every((row) => row.every((cell) => cell === BEDROCK_CELL))).toBe(true);
  });
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
      survivalBedrockRows: 0,
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
    expect(transition.state.survivalBedrockRows).toBe(INITIAL_SURVIVAL_BEDROCK_ROWS + 1);
    expect(transition.state.survivalPressureTicks).toBe(0);
    expect(transition.events).toContainEqual({ type: 'bedrock-raised', count: 1, height: INITIAL_SURVIVAL_BEDROCK_ROWS + 1 });
  });

  it('orders ordinary clear, pending rise, and one three-line bedrock removal', () => {
    const setup = singleClearBoard(1);
    const transition = resolveClear({
      ...start(0x5005, 'race'),
      ...setup,
      lines: SURVIVAL_LINES_PER_BEDROCK - 1,
      survivalBedrockRows: 1,
      survivalPressureTicks: survivalIntervalTicks(2),
      survivalRisePending: true,
      score: 0,
    });

    expect(transition.state.lines).toBe(3);
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

  it('resets under the shorter interval at three lines even when no bedrock exists', () => {
    const setup = singleClearBoard();
    const transition = resolveClear({
      ...start(0x5038, 'race'),
      ...setup,
      lines: 2,
      survivalBedrockRows: 0,
      survivalPressureTicks: 0,
    });
    expect(transition.state.lines).toBe(3);
    expect(transition.state.survivalBedrockRows).toBe(0);
    expect(transition.state.survivalPressureTicks).toBe(0);
    expect(transition.events.some((event) => event.type === 'bedrock-lowered')).toBe(false);
    expect(survivalIntervalTicks(transition.state.lines)).toBe(12 * TICKS_PER_SECOND);
  });

  it('fails closed on pressure overflow before the next spawn', () => {
    let board = createBoard();
    board = setCell(board, 0, 0, 'T');
    const transition = dispatch({
      ...start(0x50ff, 'race'),
      board,
      survivalBedrockRows: 0,
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

  it('keeps replay deterministic, hashes pressure state, and restart restores the configured three-row opening', () => {
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
    expect(restarted.survivalBedrockRows).toBe(INITIAL_SURVIVAL_BEDROCK_ROWS);
    expect(restarted.survivalPressureTicks).toBe(0);
    expect(restarted.survivalRisePending).toBe(false);
    expect(restarted.board.slice(-INITIAL_SURVIVAL_BEDROCK_ROWS).every((row) => row.every((cell) => cell === BEDROCK_CELL))).toBe(true);
  });
});

describe('independent Survival stone stream', () => {
  function isolatedStoneState(seed = 0x5a0e): GameState {
    return {
      ...start(seed, 'race'),
      // Keep the player piece stationary while this suite isolates the
      // independent stone clock; it must not change the normal seven-bag.
      active: { type: 'O', rotation: 0, x: 4, y: 24 },
      gravityTicks: -10_000,
      survivalRisePending: true,
    };
  }

  it('uses a separate seeded stream, emits after twenty seconds, and floors the next interval at ten', () => {
    const initial = isolatedStoneState();
    const initialBag = initial.randomizer;
    const warningStart = (
      SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS - SURVIVAL_DEBRIS_WARNING_SECONDS
    ) * TICKS_PER_SECOND;
    const beforeWarning = advance(initial, warningStart - 1);
    expect(beforeWarning.survivalDebrisWarningColumns).toEqual([]);
    expect(beforeWarning.survivalDebrisRandomizer).toEqual(initial.survivalDebrisRandomizer);

    const warning = dispatch(beforeWarning, { type: 'tick' });
    const warningEvent = warning.events.find((event) => event.type === 'survival-stones-warned');
    expect(warningEvent).toEqual({
      type: 'survival-stones-warned',
      columns: warning.state.survivalDebrisWarningColumns,
      height: warning.state.survivalDebrisWarningHeight,
      leadSeconds: SURVIVAL_DEBRIS_WARNING_SECONDS,
    });
    expect(warning.state.survivalDebrisWarningColumns).toHaveLength(1);
    expect([1, 2]).toContain(warning.state.survivalDebrisWarningHeight);
    expect(warning.state.randomizer).toEqual(initialBag);

    const paused = dispatch(warning.state, { type: 'pause' }).state;
    expect(dispatch(paused, { type: 'tick' }).state).toEqual(paused);
    const restarted = dispatch(paused, { type: 'restart' }).state;
    expect(restarted.survivalDebrisWarningColumns).toEqual([]);
    expect(restarted.survivalDebrisWarningHeight).toBeNull();

    const justBefore = advance(
      warning.state,
      SURVIVAL_DEBRIS_WARNING_SECONDS * TICKS_PER_SECOND - 1,
    );
    expect(justBefore.survivalDebris).toEqual([]);
    expect(justBefore.survivalDebrisIntervalTicks).toBe(SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS * TICKS_PER_SECOND - 1);

    const first = dispatch(justBefore, { type: 'tick' });
    expect(first.events).toContainEqual(expect.objectContaining({
      type: 'survival-stones-spawned',
      intervalSeconds: SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS,
      nextIntervalSeconds: SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS - 1,
    }));
    const height = warning.state.survivalDebrisWarningHeight!;
    const spawnY = VISIBLE_START_ROW - (height - 1);
    expect(first.state.survivalDebris).toEqual([{
      id: 1,
      x: warning.state.survivalDebrisWarningColumns[0],
      y: spawnY,
      height,
    }]);
    expect(first.events).toContainEqual(expect.objectContaining({
      type: 'survival-stones-spawned',
      cells: Array.from({ length: height }, (_, offset) => ({
        x: warning.state.survivalDebrisWarningColumns[0],
        y: spawnY + offset,
      })),
    }));
    expect(first.state.survivalDebrisWarningColumns).toEqual([]);
    expect(first.state.survivalDebrisWarningHeight).toBeNull();
    expect(first.state.survivalDebrisIntervalSeconds).toBe(SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS - 1);
    expect(first.state.randomizer).toEqual(initialBag);

    const nearFloor = {
      ...first.state,
      survivalDebris: [],
      survivalDebrisIntervalSeconds: SURVIVAL_DEBRIS_MIN_INTERVAL_SECONDS + 1,
      survivalDebrisIntervalTicks: (SURVIVAL_DEBRIS_MIN_INTERVAL_SECONDS + 1) * TICKS_PER_SECOND - 1,
      survivalDebrisFallProgress: 0,
    };
    const floor = dispatch(nearFloor, { type: 'tick' });
    expect(floor.state.survivalDebrisIntervalSeconds).toBe(SURVIVAL_DEBRIS_MIN_INTERVAL_SECONDS);
    const staysAtFloor = dispatch({
      ...floor.state,
      survivalDebris: [],
      survivalDebrisIntervalTicks: SURVIVAL_DEBRIS_MIN_INTERVAL_SECONDS * TICKS_PER_SECOND - 1,
      survivalDebrisFallProgress: 0,
    }, { type: 'tick' });
    expect(staysAtFloor.state.survivalDebrisIntervalSeconds).toBe(SURVIVAL_DEBRIS_MIN_INTERVAL_SECONDS);

    const replayed = advance(isolatedStoneState(), SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS * TICKS_PER_SECOND);
    expect(stateHash(first.state)).toBe(stateHash(replayed));
    expect(stateHash(first.state)).not.toBe(stateHash({
      ...first.state,
      survivalDebrisIntervalTicks: first.state.survivalDebrisIntervalTicks + 1,
    }));
    expect(stateHash(first.state)).not.toBe(stateHash({
      ...first.state,
      survivalDebris: [],
    }));
    expect(stateHash(warning.state)).not.toBe(stateHash({
      ...warning.state,
      survivalDebrisWarningColumns: [],
      survivalDebrisWarningHeight: null,
    }));
    expect(stateHash(warning.state)).not.toBe(stateHash({
      ...warning.state,
      survivalDebrisWarningHeight: warning.state.survivalDebrisWarningHeight === 1 ? 2 : 1,
    }));
  });

  it('freezes both one- and two-stone plans in one shared random column', () => {
    const heights = new Set<number>();
    const warningStart = (
      SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS - SURVIVAL_DEBRIS_WARNING_SECONDS
    ) * TICKS_PER_SECOND;

    for (let seed = 1; seed <= 32; seed += 1) {
      const warning = dispatch({
        ...isolatedStoneState(seed),
        survivalDebrisIntervalTicks: warningStart - 1,
      }, { type: 'tick' }).state;
      expect(warning.survivalDebrisWarningColumns).toHaveLength(1);
      expect([1, 2]).toContain(warning.survivalDebrisWarningHeight);
      heights.add(warning.survivalDebrisWarningHeight!);
    }

    expect([...heights].sort()).toEqual([1, 2]);

    const singleColumn = 4;
    const singleBoard = setCell(createBoard(), singleColumn, VISIBLE_START_ROW - 1, 'I');
    const single = dispatch({
      ...isolatedStoneState(0x5a14),
      board: singleBoard,
      survivalBedrockRows: 0,
      survivalDebrisWarningColumns: [singleColumn],
      survivalDebrisWarningHeight: 1,
      survivalDebrisIntervalTicks: SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS * TICKS_PER_SECOND - 1,
    }, { type: 'tick' });
    expect(single.state.survivalDebris).toEqual([{
      id: 1,
      x: singleColumn,
      y: VISIBLE_START_ROW,
      height: 1,
    }]);
    expect(single.events).toContainEqual(expect.objectContaining({
      type: 'survival-stones-spawned',
      cells: [{ x: singleColumn, y: VISIBLE_START_ROW }],
    }));
  });

  it('keeps a blocked warned event due until one announced entry column opens', () => {
    let board = createBoard();
    board = setCell(board, 2, VISIBLE_START_ROW, 'J');
    board = setCell(board, 2, VISIBLE_START_ROW - 1, 'L');
    const intervalTicks = SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS * TICKS_PER_SECOND;
    const due = dispatch({
      ...isolatedStoneState(0x5a12),
      board,
      survivalBedrockRows: 0,
      survivalDebrisWarningColumns: [2],
      survivalDebrisWarningHeight: 2,
      survivalDebrisIntervalTicks: intervalTicks - 1,
    }, { type: 'tick' });

    expect(due.state.survivalDebris).toEqual([]);
    expect(due.state.survivalDebrisWarningColumns).toEqual([2]);
    expect(due.state.survivalDebrisWarningHeight).toBe(2);
    expect(due.state.survivalDebrisIntervalTicks).toBe(intervalTicks);
    expect(due.state.survivalDebrisIntervalSeconds).toBe(SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS);
    expect(due.events.some((event) => event.type === 'survival-stones-spawned')).toBe(false);

    const stillBlocked = dispatch({
      ...due.state,
      board: setCell(due.state.board, 2, VISIBLE_START_ROW, null),
    }, { type: 'tick' });
    expect(stillBlocked.state.survivalDebris).toEqual([]);
    expect(stillBlocked.state.survivalDebrisWarningColumns).toEqual([2]);
    expect(stillBlocked.state.survivalDebrisWarningHeight).toBe(2);

    const opened = dispatch({
      ...stillBlocked.state,
      board: setCell(stillBlocked.state.board, 2, VISIBLE_START_ROW - 1, null),
    }, { type: 'tick' });
    expect(opened.state.survivalDebris).toEqual([{
      id: 1,
      x: 2,
      y: VISIBLE_START_ROW - 1,
      height: 2,
    }]);
    expect(opened.state.survivalDebrisWarningColumns).toEqual([]);
    expect(opened.state.survivalDebrisWarningHeight).toBeNull();
    expect(opened.state.survivalDebrisIntervalTicks).toBe(0);
    expect(opened.state.survivalDebrisIntervalSeconds).toBe(
      SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS - 1,
    );
  });

  it('falls at exactly four times the fixed Survival cadence while preserving the rigid pair', () => {
    const state: GameState = {
      ...start(0x5a0f, 'race'),
      board: createBoard(),
      survivalBedrockRows: 0,
      active: { type: 'O', rotation: 0, x: 4, y: 24 },
      survivalDebris: [{ id: 1, x: 0, y: VISIBLE_START_ROW - 1, height: 2 }],
      survivalDebrisFallProgress: 0,
    };
    const quarter = advance(state, SURVIVAL_GRAVITY_TICKS / 4);
    expect(quarter.active).toMatchObject({ y: 24 });
    expect(quarter.survivalDebris).toEqual([{
      id: 1,
      x: 0,
      y: VISIBLE_START_ROW,
      height: 2,
    }]);

    const advanced = advance(state, SURVIVAL_GRAVITY_TICKS);
    expect(advanced.active).toMatchObject({ y: 25 });
    expect(advanced.survivalDebris).toEqual([{
      id: 1,
      x: 0,
      y: VISIBLE_START_ROW + 3,
      height: 2,
    }]);
  });

  it('admits a due stone and the next ordinary piece in the same entry footprint without false block-out', () => {
    const base = start(0x5a1a, 'race');
    const intervalTicks = SURVIVAL_DEBRIS_INITIAL_INTERVAL_SECONDS * TICKS_PER_SECOND;
    const entered = dispatch({
      ...base,
      board: createBoard(),
      survivalBedrockRows: 0,
      active: null,
      phase: 'entry',
      phaseTicks: ENTRY_DELAY_TICKS - 1,
      queue: ['O', ...base.queue],
      survivalDebrisWarningColumns: [4],
      survivalDebrisWarningHeight: 2,
      survivalDebrisIntervalTicks: intervalTicks - 1,
      survivalDebrisFallProgress: 0,
    }, { type: 'tick' });

    expect(entered.state.status).toBe('playing');
    expect(entered.state.active).toMatchObject({ type: 'O', x: 4, y: VISIBLE_START_ROW - 1 });
    expect(entered.state.survivalDebris).toEqual([{
      id: 1,
      x: 4,
      y: VISIBLE_START_ROW - 1,
      height: 2,
    }]);
    expect(entered.events.some((event) => event.type === 'game-over')).toBe(false);
    expect(dropDistance(entered.state)).toBe(0);

    const blockedDrop = dispatch(entered.state, { type: 'hard-drop' });
    expect(blockedDrop.state).toEqual(entered.state);
    expect(blockedDrop.events).toEqual([]);

    const escaped = dispatch(entered.state, { type: 'move', dx: 1 });
    expect(escaped.state.active).toMatchObject({ type: 'O', x: 5, y: VISIBLE_START_ROW - 1 });
    expect(escaped.events).toContainEqual(expect.objectContaining({
      type: 'piece-moved',
      dx: 1,
      dy: 0,
    }));
  });

  it('carries a supported ordinary piece down atomically with the faster falling stone', () => {
    const state: GameState = {
      ...start(0x5a1b, 'race'),
      board: createBoard(),
      survivalBedrockRows: 0,
      active: { type: 'O', rotation: 0, x: 4, y: 28 },
      survivalDebris: [{ id: 7, x: 4, y: 30, height: 1 }],
      survivalDebrisFallProgress: SURVIVAL_GRAVITY_TICKS - 4,
      gravityTicks: 17,
      lockTicks: 12,
    };

    const first = dispatch(state, { type: 'tick' }).state;
    const repeated = dispatch(state, { type: 'tick' }).state;
    expect(first.active).toMatchObject({ type: 'O', x: 4, y: 29 });
    expect(first.survivalDebris).toEqual([{ id: 7, x: 4, y: 31, height: 1 }]);
    expect(first.gravityTicks).toBe(1);
    expect(first.lockTicks).toBe(0);
    expect(stateHash(first)).toBe(stateHash(repeated));

    const betweenStoneSteps = dispatch(first, { type: 'tick' }).state;
    expect(betweenStoneSteps.active).toEqual(first.active);
    expect(betweenStoneSteps.survivalDebris).toEqual(first.survivalDebris);
    expect(betweenStoneSteps.lockTicks).toBe(0);

    const second = dispatch({
      ...first,
      survivalDebrisFallProgress: SURVIVAL_GRAVITY_TICKS - 4,
    }, { type: 'tick' }).state;
    expect(second.active).toMatchObject({ type: 'O', x: 4, y: 30 });
    expect(second.survivalDebris).toEqual([{ id: 7, x: 4, y: 32, height: 1 }]);
  });

  it('waits instead of moving or settling when a falling stone would create a new active-piece overlap', () => {
    const state: GameState = {
      ...start(0x5a1c, 'race'),
      board: createBoard(),
      survivalBedrockRows: 0,
      active: { type: 'O', rotation: 0, x: 4, y: 30 },
      survivalDebris: [{ id: 3, x: 4, y: 29, height: 1 }],
      survivalDebrisFallProgress: SURVIVAL_GRAVITY_TICKS - 4,
    };

    const waited = dispatch(state, { type: 'tick' }).state;
    expect(waited.active).toEqual(state.active);
    expect(waited.survivalDebris).toEqual(state.survivalDebris);
    expect(waited.board[29]![4]).toBe(null);
    expect(waited.status).toBe('playing');
  });

  it('treats a falling stone as a real collision while it is still in the air', () => {
    const state: GameState = {
      ...start(0x5a10, 'race'),
      board: createBoard(),
      survivalBedrockRows: 0,
      active: { type: 'O', rotation: 0, x: 4, y: 28 },
      survivalDebris: [{ id: 1, x: 4, y: 30, height: 2 }],
      survivalRisePending: true,
    };
    const attempted = dispatch(state, { type: 'soft-drop' });
    expect(attempted.state.active).toEqual(state.active);
    expect(attempted.events).toEqual([]);
    expect(dropDistance(state)).toBe(0);
  });

  it('hard-drops onto dynamic stone support without locking the ordinary piece', () => {
    const state: GameState = {
      ...start(0x5a1d, 'race'),
      board: createBoard(),
      survivalBedrockRows: 0,
      active: { type: 'O', rotation: 0, x: 4, y: 24 },
      survivalDebris: [{ id: 8, x: 4, y: 34, height: 1 }],
      pieceCount: 0,
      lockTicks: 17,
    };

    const dropped = dispatch(state, { type: 'hard-drop' });
    expect(dropped.state.active).toMatchObject({ type: 'O', x: 4, y: 32 });
    expect(dropped.state.survivalDebris).toEqual(state.survivalDebris);
    expect(dropped.state.pieceCount).toBe(0);
    expect(dropped.state.lockTicks).toBe(0);
    expect(dropped.events).toEqual([{
      type: 'piece-moved',
      piece: 'O',
      dx: 0,
      dy: 8,
      cause: 'hard-drop',
    }]);
    expect(dropped.events.some((event) => event.type === 'hard-dropped')).toBe(false);
  });

  it('starts ordinary lock delay only after dynamic stone support settles', () => {
    const base: GameState = {
      ...start(0x5a1e, 'race'),
      board: createBoard(),
      survivalBedrockRows: 0,
      active: { type: 'O', rotation: 0, x: 4, y: 36 },
      survivalDebris: [{ id: 9, x: 4, y: 38, height: 1 }],
      survivalDebrisFallProgress: SURVIVAL_GRAVITY_TICKS - 4,
      lockTicks: 21,
    };

    const carried = dispatch(base, { type: 'tick' }).state;
    expect(carried.active).toMatchObject({ type: 'O', y: 37 });
    expect(carried.survivalDebris).toEqual([{ id: 9, x: 4, y: 39, height: 1 }]);
    expect(carried.lockTicks).toBe(0);

    const settled = dispatch({
      ...carried,
      survivalDebrisFallProgress: SURVIVAL_GRAVITY_TICKS - 4,
    }, { type: 'tick' }).state;
    expect(settled.survivalDebris).toEqual([]);
    expect(settled.board[39]![4]).toBe(SURVIVAL_STONE_CELL);
    expect(settled.active).toMatchObject({ type: 'O', y: 37 });
    expect(settled.lockTicks).toBe(1);
  });

  it('locks a stone as a clearable cell, scores its clear, and preserves the active player piece', () => {
    let board = createBoard();
    for (let x = 0; x < 9; x += 1) board = setCell(board, x, BOARD_HEIGHT - 1, 'J');
    let transition = dispatch({
      ...start(0x5a11, 'race'),
      board,
      survivalBedrockRows: 0,
      active: { type: 'O', rotation: 0, x: 3, y: 30 },
      survivalDebris: [{ id: 1, x: 9, y: BOARD_HEIGHT - 1, height: 1 }],
      survivalDebrisFallProgress: SURVIVAL_GRAVITY_TICKS - 4,
      pieceCount: 0,
    }, { type: 'tick' });

    expect(transition.state.phase).toBe('line-clear');
    expect(transition.state.board[BOARD_HEIGHT - 1]![9]).toBe(SURVIVAL_STONE_CELL);
    expect(transition.events).toContainEqual({
      type: 'survival-stones-landed',
      cells: [
        { x: 9, y: BOARD_HEIGHT - 1 },
      ],
    });
    expect(transition.events).toContainEqual({ type: 'clear-started', rows: [BOARD_HEIGHT - 1] });

    for (let index = 0; index < LINE_CLEAR_DELAY_TICKS; index += 1) transition = dispatch(transition.state, { type: 'tick' });
    expect(transition.state.phase).toBe('active');
    expect(transition.state.lines).toBe(1);
    expect(transition.state.score).toBe(40);
    expect(transition.events).toContainEqual({
      type: 'lines-cleared',
      rows: [BOARD_HEIGHT - 1],
      count: 1,
      score: 40,
    });
    expect(transition.state.pieceCount).toBe(0);
    expect(transition.state.active).toMatchObject({ type: 'O', x: 3, y: 31 });
    expect(transition.state.board[BOARD_HEIGHT - 1]![9]).toBe(null);
    expect(transition.state.board[BOARD_HEIGHT - 2]![9]).toBe(null);
  });

  it('settles both cells together and can complete two ordinary rows in one impact', () => {
    let board = createBoard();
    for (let y = BOARD_HEIGHT - 2; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < 9; x += 1) board = setCell(board, x, y, 'S');
    }
    let transition = dispatch({
      ...start(0x5a13, 'race'),
      board,
      survivalBedrockRows: 0,
      active: { type: 'O', rotation: 0, x: 3, y: 30 },
      survivalDebris: [{ id: 1, x: 9, y: BOARD_HEIGHT - 2, height: 2 }],
      survivalDebrisFallProgress: SURVIVAL_GRAVITY_TICKS - 4,
      pieceCount: 0,
    }, { type: 'tick' });

    expect(transition.state.pendingClearRows).toEqual([BOARD_HEIGHT - 2, BOARD_HEIGHT - 1]);
    expect(transition.events).toContainEqual({
      type: 'survival-stones-landed',
      cells: [
        { x: 9, y: BOARD_HEIGHT - 2 },
        { x: 9, y: BOARD_HEIGHT - 1 },
      ],
    });
    expect(transition.events).toContainEqual({
      type: 'clear-started',
      rows: [BOARD_HEIGHT - 2, BOARD_HEIGHT - 1],
    });

    for (let index = 0; index < LINE_CLEAR_DELAY_TICKS; index += 1) {
      transition = dispatch(transition.state, { type: 'tick' });
    }
    expect(transition.state.lines).toBe(2);
    expect(transition.state.score).toBe(100);
    expect(transition.state.board.slice(-2)).toEqual([
      Array(10).fill(null),
      Array(10).fill(null),
    ]);
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
