import { describe, expect, it } from 'vitest';
import { LINE_CLEAR_DELAY_TICKS, dispatch } from '../core';
import { createFourLineClearScenario } from './qaScenario';

describe('four-line browser QA scenario', () => {
  it('reaches a real four-line clear through the public hard-drop command', () => {
    let state = createFourLineClearScenario();
    state = dispatch(state, { type: 'hard-drop' }).state;
    expect(state.phase).toBe('line-clear');
    expect(state.pendingClearRows).toEqual([36, 37, 38, 39]);
    for (let tick = 0; tick < LINE_CLEAR_DELAY_TICKS; tick += 1) state = dispatch(state, { type: 'tick' }).state;
    expect(state.lines).toBe(4);
    expect(state.score).toBe(1234);
  });
});
