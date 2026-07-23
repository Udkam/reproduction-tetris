import { describe, expect, it } from 'vitest';
import {
  ARR_TICKS,
  DAS_TICKS,
  InputController,
  SOFT_DROP_INITIAL_DELAY_TICKS,
  SOFT_DROP_REPEAT_TICKS,
  type InputAction,
} from './InputController';

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

  it('soft drops immediately, pauses briefly, then repeats every simulation tick until release', () => {
    const actions: InputAction[] = [];
    const input = new InputController((action) => actions.push(action), null);
    input.press('soft-drop');
    expect(actions).toEqual(['soft-drop']);

    for (let tick = 1; tick < SOFT_DROP_INITIAL_DELAY_TICKS; tick += 1) input.step();
    expect(actions).toEqual(['soft-drop']);

    input.step();
    expect(actions).toEqual(['soft-drop', 'soft-drop']);
    for (let tick = 0; tick < SOFT_DROP_REPEAT_TICKS * 3; tick += 1) input.step();
    expect(actions.filter((action) => action === 'soft-drop')).toHaveLength(5);

    input.release('soft-drop');
    for (let tick = 0; tick < SOFT_DROP_INITIAL_DELAY_TICKS + 3; tick += 1) input.step();
    expect(actions.filter((action) => action === 'soft-drop')).toHaveLength(5);
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

  it('maps ArrowUp to the visible clockwise rotation action', () => {
    const actions: InputAction[] = [];
    const target = new EventTarget() as Window;
    const input = new InputController((action) => actions.push(action), target);
    const event = new Event('keydown') as KeyboardEvent;
    Object.defineProperty(event, 'code', { value: 'ArrowUp' });
    target.dispatchEvent(event);
    expect(actions).toEqual(['rotate-cw']);
    input.destroy();
  });

  it('maps B to the Puzzle undo action without treating it as a held control', () => {
    const actions: InputAction[] = [];
    const target = new EventTarget() as Window;
    const input = new InputController((action) => actions.push(action), target);
    const event = new Event('keydown') as KeyboardEvent;
    Object.defineProperty(event, 'code', { value: 'KeyB' });
    target.dispatchEvent(event);
    expect(actions).toEqual(['undo']);
    input.destroy();
  });

  it('maps P to the visible pause action while leaving R to the page-level confirmation flow', () => {
    const actions: InputAction[] = [];
    const target = new EventTarget() as Window;
    const input = new InputController((action) => actions.push(action), target);
    const pause = new Event('keydown') as KeyboardEvent;
    Object.defineProperty(pause, 'code', { value: 'KeyP' });
    target.dispatchEvent(pause);
    const restart = new Event('keydown') as KeyboardEvent;
    Object.defineProperty(restart, 'code', { value: 'KeyR' });
    target.dispatchEvent(restart);
    expect(actions).toEqual(['pause']);
    input.destroy();
  });
});
