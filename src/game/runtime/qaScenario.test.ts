import { describe, expect, it } from 'vitest';
import { raceSpeedTier, stateHash } from '../core';
import { RACE_ENDURANCE_QA_LINES, replayPuzzleChallenge, replayRaceEndurance } from './qaScenario';

describe('Endless Race browser QA replay', () => {
  it('reaches a deterministic live endurance milestone from public commands only', () => {
    const first = replayRaceEndurance(0x51a1f00d);
    const second = replayRaceEndurance(0x51a1f00d);

    expect(first.commands[0]).toEqual({ type: 'start' });
    expect(first.commands.some((command) => command.type === 'hard-drop')).toBe(true);
    expect(first.commands.some((command) => command.type === 'tick')).toBe(true);
    expect(first.state.status).toBe('playing');
    expect(first.state.lines).toBeGreaterThanOrEqual(RACE_ENDURANCE_QA_LINES);
    expect(first.state.active).not.toBeNull();
    expect(raceSpeedTier(first.state.pieceCount, first.state.lines)).toBeGreaterThan(0);
    expect(stateHash(first.state)).toBe(stateHash(second.state));
    expect(first.commands).toEqual(second.commands);
  });
});

describe('T5 puzzle browser QA replay', () => {
  it('completes the full first challenge through public commands only', () => {
    const first = replayPuzzleChallenge(0x51a1f00d);
    const second = replayPuzzleChallenge(0x51a1f00d);

    expect(first.commands[0]).toEqual({ type: 'start' });
    expect(first.commands.some((command) => command.type === 'rotate')).toBe(true);
    expect(first.commands.filter((command) => command.type === 'hard-drop')).toHaveLength(11);
    expect(first.state.status).toBe('finished');
    expect(first.state.puzzleId).toBe('t3r-shaft-01');
    expect(first.state.puzzleCompletion).toBe('finished');
    expect(first.state.completedLevelId).toBe('t3r-shaft-01');
    expect(first.state.nextUnlockedLevelId).toBe('t3r-shaft-02');
    expect(first.state.pieceCount).toBe(11);
    expect(first.state.lines).toBe(8);
    expect(first.hash).toBe(second.hash);
    expect(first.commands).toEqual(second.commands);
  });
});
