import { describe, expect, it } from 'vitest';
import { RACE_TARGET_LINES, stateHash } from '../core';
import { replayRaceCompletion } from './qaScenario';

describe('Race browser QA replay', () => {
  it('reaches the canonical finish state from public commands only', () => {
    const first = replayRaceCompletion(0x51a1f00d);
    const second = replayRaceCompletion(0x51a1f00d);

    expect(first.commands[0]).toEqual({ type: 'start' });
    expect(first.commands.some((command) => command.type === 'hard-drop')).toBe(true);
    expect(first.commands.some((command) => command.type === 'tick')).toBe(true);
    expect(first.state.status).toBe('finished');
    expect(first.state.lines).toBeGreaterThanOrEqual(RACE_TARGET_LINES);
    expect(first.state.active).toBeNull();
    expect(stateHash(first.state)).toBe(stateHash(second.state));
    expect(first.commands).toEqual(second.commands);
  });
});
