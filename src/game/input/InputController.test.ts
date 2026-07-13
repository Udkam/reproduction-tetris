import { describe, expect, it } from 'vitest';
import { ARR_TICKS, DAS_TICKS, InputController, SOFT_DROP_TICKS, type InputAction } from './InputController';

describe('InputController', () => {
  it('fires immediately, then follows deterministic DAS and ARR ticks', () => {
    const actions: InputAction[] = [];
    const input = new InputController((action) => actions.push(action), null);
    input.press('left');
    for (let tick = 1; tick < DAS_TICKS; tick += 1) input.step();
    expect(actions).toEqual(['left']);
    input.step();
    expect(actions).toEqual(['left', 'left']);
    for (let tick = 0; tick < ARR_TICKS; tick += 1) input.step();
    expect(actions).toEqual(['left', 'left', 'left']);
  });

  it('gives horizontal priority to the most recently pressed direction', () => {
    const actions: InputAction[] = [];
    const input = new InputController((action) => actions.push(action), null);
    input.press('left');
    input.press('right');
    expect(actions).toEqual(['left', 'right']);
    input.release('right');
    expect(actions).toEqual(['left', 'right', 'left']);
  });

  it('repeats soft drop independently and clears held state', () => {
    const actions: InputAction[] = [];
    const input = new InputController((action) => actions.push(action), null);
    input.press('soft-drop');
    for (let tick = 0; tick < SOFT_DROP_TICKS * 2; tick += 1) input.step();
    expect(actions.filter((action) => action === 'soft-drop')).toHaveLength(3);
    input.clearHeld();
    for (let tick = 0; tick < SOFT_DROP_TICKS * 2; tick += 1) input.step();
    expect(actions.filter((action) => action === 'soft-drop')).toHaveLength(3);
  });

  it('clears held input and requests suspension on window blur', () => {
    const actions: InputAction[] = [];
    const target = new EventTarget() as Window;
    let suspensions = 0;
    const input = new InputController((action) => actions.push(action), target, () => { suspensions += 1; });
    input.press('left');
    target.dispatchEvent(new Event('blur'));
    for (let tick = 0; tick < DAS_TICKS + ARR_TICKS; tick += 1) input.step();
    expect(actions).toEqual(['left']);
    expect(suspensions).toBe(1);
    input.destroy();
  });
});
