export const DAS_TICKS = 10;
export const ARR_TICKS = 2;
export const SOFT_DROP_INITIAL_DELAY_TICKS = 3;
export const SOFT_DROP_REPEAT_TICKS = 1;

export type InputAction =
  | 'left'
  | 'right'
  | 'soft-drop'
  | 'hard-drop'
  | 'rotate-cw'
  | 'rotate-ccw'
  | 'pause'
  | 'restart'
  | 'undo';

type HeldAction = 'left' | 'right' | 'soft-drop';

interface HeldState {
  pressed: boolean;
  heldTicks: number;
  sequence: number;
}

const KEY_BINDINGS: Record<string, InputAction> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowDown: 'soft-drop',
  KeyS: 'soft-drop',
  Space: 'hard-drop',
  ArrowUp: 'rotate-cw',
  KeyW: 'rotate-cw',
  KeyX: 'rotate-cw',
  KeyQ: 'rotate-ccw',
  KeyZ: 'rotate-ccw',
  Escape: 'pause',
  KeyP: 'pause',
  KeyR: 'restart',
  KeyB: 'undo',
};

export class InputController {
  private readonly held: Record<HeldAction, HeldState> = {
    left: { pressed: false, heldTicks: 0, sequence: 0 },
    right: { pressed: false, heldTicks: 0, sequence: 0 },
    'soft-drop': { pressed: false, heldTicks: 0, sequence: 0 },
  };

  private sequence = 0;

  constructor(
    private readonly emit: (action: InputAction) => void,
    private readonly target: Window | null = typeof window === 'undefined' ? null : window,
    private readonly suspend?: () => void,
  ) {
    this.target?.addEventListener('keydown', this.onKeyDown, { passive: false });
    this.target?.addEventListener('keyup', this.onKeyUp, { passive: false });
    this.target?.addEventListener('blur', this.onBlur);
  }

  press(action: InputAction): void {
    if (action === 'left' || action === 'right' || action === 'soft-drop') {
      const state = this.held[action];
      if (state.pressed) return;
      state.pressed = true;
      state.heldTicks = 0;
      state.sequence = ++this.sequence;
      if (action === 'soft-drop' || this.horizontalPriority() === action) this.emit(action);
      return;
    }
    this.emit(action);
  }

  release(action: InputAction): void {
    if (action !== 'left' && action !== 'right' && action !== 'soft-drop') return;
    const wasPriority = action === this.horizontalPriority();
    const state = this.held[action];
    state.pressed = false;
    state.heldTicks = 0;
    if (wasPriority) {
      const fallback = this.horizontalPriority();
      if (fallback) {
        this.held[fallback].heldTicks = 0;
        this.held[fallback].sequence = ++this.sequence;
        this.emit(fallback);
      }
    }
  }

  step(): void {
    const horizontal = this.horizontalPriority();
    if (horizontal) {
      const state = this.held[horizontal];
      state.heldTicks += 1;
      if (state.heldTicks === DAS_TICKS || (state.heldTicks > DAS_TICKS && (state.heldTicks - DAS_TICKS) % ARR_TICKS === 0)) {
        this.emit(horizontal);
      }
    }

    const softDrop = this.held['soft-drop'];
    if (softDrop.pressed) {
      softDrop.heldTicks += 1;
      if (
        softDrop.heldTicks === SOFT_DROP_INITIAL_DELAY_TICKS
        || (
          softDrop.heldTicks > SOFT_DROP_INITIAL_DELAY_TICKS
          && (softDrop.heldTicks - SOFT_DROP_INITIAL_DELAY_TICKS) % SOFT_DROP_REPEAT_TICKS === 0
        )
      ) {
        this.emit('soft-drop');
      }
    }
  }

  clearHeld(): void {
    for (const state of Object.values(this.held)) {
      state.pressed = false;
      state.heldTicks = 0;
    }
  }

  destroy(): void {
    this.clearHeld();
    this.target?.removeEventListener('keydown', this.onKeyDown);
    this.target?.removeEventListener('keyup', this.onKeyUp);
    this.target?.removeEventListener('blur', this.onBlur);
  }

  private horizontalPriority(): 'left' | 'right' | null {
    const left = this.held.left;
    const right = this.held.right;
    if (!left.pressed && !right.pressed) return null;
    if (!left.pressed) return 'right';
    if (!right.pressed) return 'left';
    return left.sequence > right.sequence ? 'left' : 'right';
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const action = KEY_BINDINGS[event.code];
    if (!action) return;
    event.preventDefault();
    if (!event.repeat) this.press(action);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const action = KEY_BINDINGS[event.code];
    if (!action) return;
    event.preventDefault();
    this.release(action);
  };

  private readonly onBlur = (): void => {
    this.clearHeld();
    this.suspend?.();
  };
}
