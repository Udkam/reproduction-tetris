import { describe, expect, it } from 'vitest';
import {
  ENTRY_DELAY_TICKS,
  RACE_GRAVITY_TICKS,
  RACE_MIN_GRAVITY_TICKS,
  RACE_PIECES_PER_SPEED_STEP,
  gravityForMode,
  gravityForRace,
} from './constants';
import { createInitialState, dispatch, replay, stateHash } from './engine';
import type { GameCommand, GameState } from './types';

function start(seed: number, mode: 'marathon' | 'race' = 'marathon'): GameState {
  return dispatch(createInitialState(seed, mode), { type: 'start' }).state;
}

function advance(state: GameState, ticks: number): GameState {
  let next = state;
  for (let index = 0; index < ticks; index += 1) next = dispatch(next, { type: 'tick' }).state;
  return next;
}

describe('race speed curve', () => {
  it('accelerates monotonically by locked pieces and stops at the explicit cap', () => {
    let previous = gravityForRace(0);
    expect(previous).toBe(RACE_GRAVITY_TICKS[0]);

    const capStart = (RACE_GRAVITY_TICKS.length - 1) * RACE_PIECES_PER_SPEED_STEP;
    for (let pieceCount = 1; pieceCount <= capStart + 100; pieceCount += 1) {
      const current = gravityForRace(pieceCount);
      expect(current).toBeLessThanOrEqual(previous);
      expect(current).toBeGreaterThanOrEqual(RACE_MIN_GRAVITY_TICKS);
      previous = current;
    }

    expect(gravityForRace(capStart)).toBe(RACE_MIN_GRAVITY_TICKS);
    expect(gravityForRace(capStart + 10_000)).toBe(RACE_MIN_GRAVITY_TICKS);
  });

  it('uses piece count for race while marathon retains level gravity', () => {
    expect(gravityForMode('race', 29, 0)).toBe(RACE_GRAVITY_TICKS[0]);
    expect(gravityForMode('race', 0, RACE_PIECES_PER_SPEED_STEP)).toBe(RACE_GRAVITY_TICKS[1]);
    expect(gravityForMode('marathon', 29, 0)).toBe(1);
    expect(gravityForMode('marathon', 0, 10_000)).toBe(48);
  });

  it('applies the race cadence to gravity ticks in the simulation', () => {
    const pieceCount = RACE_PIECES_PER_SPEED_STEP * 3;
    const cadence = gravityForRace(pieceCount);
    const state: GameState = { ...start(0x7ace, 'race'), pieceCount, gravityTicks: 0 };
    const startY = state.active!.y;
    const beforeFall = advance(state, cadence - 1);

    expect(beforeFall.active?.y).toBe(startY);
    expect(dispatch(beforeFall, { type: 'tick' }).state.active?.y).toBe(startY + 1);
  });
});

describe('race state and deterministic replay', () => {
  it('counts every locked piece exactly once', () => {
    let state = start(0xace, 'race');

    for (let expected = 1; expected <= 3; expected += 1) {
      const transition = dispatch(state, { type: 'hard-drop' });
      expect(transition.events.filter((event) => event.type === 'piece-locked')).toHaveLength(1);
      expect(transition.state.pieceCount).toBe(expected);
      state = advance(transition.state, ENTRY_DELAY_TICKS);
      expect(state.pieceCount).toBe(expected);
    }
  });

  it('defaults to marathon and restarts in the current or explicitly selected mode', () => {
    expect(createInitialState(21).mode).toBe('marathon');

    const usedRace = dispatch(start(21, 'race'), { type: 'hard-drop' }).state;
    const preserved = dispatch(usedRace, { type: 'restart' }).state;
    expect(preserved.mode).toBe('race');
    expect(preserved.pieceCount).toBe(0);

    const switched = dispatch(usedRace, { type: 'restart', mode: 'marathon' }).state;
    expect(switched.mode).toBe('marathon');
    expect(switched.pieceCount).toBe(0);
  });

  it('includes mode and piece count in hashes and replays race commands identically', () => {
    const commands: GameCommand[] = [
      { type: 'start' },
      { type: 'hard-drop' },
      ...Array.from({ length: ENTRY_DELAY_TICKS }, () => ({ type: 'tick' } as const)),
      { type: 'move', dx: -1 },
      { type: 'hard-drop' },
    ];
    const raceA = replay(0x5150, commands, 'race');
    const raceB = replay(0x5150, commands, 'race');
    const marathon = replay(0x5150, commands);

    expect(raceA.mode).toBe('race');
    expect(raceA.pieceCount).toBe(2);
    expect(stateHash(raceA)).toBe(stateHash(raceB));
    expect(stateHash(raceA)).not.toBe(stateHash(marathon));
    expect(stateHash(raceA)).not.toBe(stateHash({ ...raceA, pieceCount: raceA.pieceCount + 1 }));
  });
});
