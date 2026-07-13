import { AudioEngine } from '../audio/AudioEngine';
import { createInitialState, dispatch, type GameCommand, type GameEvent, type GameState } from '../core';
import { InputController, type InputAction } from '../input/InputController';
import { TetrisRenderer, type RendererSnapshot } from '../render/TetrisRenderer';
import { createFourLineClearScenario } from './qaScenario';

const FIXED_STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;

export interface RuntimeOptions {
  seed?: number;
  highContrast?: boolean;
  reducedMotion?: boolean;
  audioEnabled?: boolean;
  onState?: (state: GameState, events: readonly GameEvent[]) => void;
}

export interface RuntimeQaSurface {
  getState: () => GameState;
  getRendererSnapshot: () => RendererSnapshot;
  action: (action: InputAction) => void;
  release: (action: InputAction) => void;
  advanceTicks: (ticks: number) => void;
  loadScenario: (name: 'four-line-clear') => void;
  setFrozen: (frozen: boolean) => void;
  benchmarkRender: (iterations?: number) => { meanMs: number; p95Ms: number; maxMs: number };
}

declare global {
  interface Window {
    __SIGNAL_FOUNDRY_QA__?: RuntimeQaSurface;
  }
}

export class GameRuntime {
  private state: GameState;
  private readonly renderer = new TetrisRenderer();
  private readonly audio = new AudioEngine();
  private input: InputController | null = null;
  private accumulator = 0;
  private pendingEvents: GameEvent[] = [];
  private destroyed = false;
  private qaFrozen = false;
  private readonly onState?: RuntimeOptions['onState'];

  constructor(private readonly options: RuntimeOptions = {}) {
    this.state = createInitialState(options.seed);
    this.onState = options.onState;
    this.audio.setEnabled(options.audioEnabled ?? true);
  }

  async mount(host: HTMLElement): Promise<void> {
    await this.renderer.init(host);
    if (this.destroyed) {
      this.renderer.destroy();
      return;
    }
    this.renderer.setOptions({
      highContrast: this.options.highContrast ?? false,
      reducedMotion: this.options.reducedMotion ?? false,
    });
    this.renderer.setFrameCallback(this.frame);
    this.input = new InputController(this.handleAction, window, this.onWindowBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.onState?.(this.state, []);
    this.renderer.render(this.state, [], 0);

    if (import.meta.env.DEV) {
      window.__SIGNAL_FOUNDRY_QA__ = {
        getState: () => structuredClone(this.state),
        getRendererSnapshot: () => this.renderer.getSnapshot(),
        action: (action) => this.handleAction(action),
        release: (action) => this.input?.release(action),
        advanceTicks: (ticks) => {
          for (let index = 0; index < ticks; index += 1) this.fixedStep();
          this.flushRender(0);
        },
        loadScenario: (name) => {
          if (name !== 'four-line-clear') return;
          this.state = createFourLineClearScenario(this.state.seed);
          this.accumulator = 0;
          this.pendingEvents = [];
          this.input?.clearHeld();
          this.onState?.(this.state, []);
          this.renderer.render(this.state, [], 0);
        },
        setFrozen: (frozen) => {
          this.qaFrozen = frozen;
          this.accumulator = 0;
        },
        benchmarkRender: (iterations) => this.renderer.benchmark(this.state, iterations),
      };
    }
  }

  press(action: InputAction): void {
    void this.audio.prime();
    this.input?.press(action);
  }

  start(): void {
    void this.audio.prime();
    this.apply({ type: 'start' });
  }

  togglePause(): void {
    this.handleAction('pause');
  }

  restart(seed = this.state.seed): void {
    void this.audio.prime();
    this.apply({ type: 'restart', seed });
    this.input?.clearHeld();
  }

  release(action: InputAction): void {
    this.input?.release(action);
  }

  setAudioEnabled(enabled: boolean): void {
    this.audio.setEnabled(enabled);
    if (enabled) void this.audio.prime();
  }

  setHighContrast(enabled: boolean): void {
    this.renderer.setOptions({ highContrast: enabled });
  }

  setReducedMotion(enabled: boolean): void {
    this.renderer.setOptions({ reducedMotion: enabled });
  }

  getState(): GameState {
    return this.state;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.input?.destroy();
    this.input = null;
    this.renderer.destroy();
    this.audio.destroy();
    this.pendingEvents = [];
    delete window.__SIGNAL_FOUNDRY_QA__;
  }

  private readonly frame = (deltaMs: number): void => {
    if (this.destroyed) return;
    if (this.qaFrozen) {
      this.flushRender(deltaMs);
      return;
    }
    this.accumulator += deltaMs;
    let steps = 0;
    while (this.accumulator >= FIXED_STEP_MS && steps < MAX_STEPS_PER_FRAME) {
      this.fixedStep();
      this.accumulator -= FIXED_STEP_MS;
      steps += 1;
    }
    this.flushRender(deltaMs);
  };

  private fixedStep(): void {
    this.input?.step();
    this.apply({ type: 'tick' });
  }

  private flushRender(deltaMs: number): void {
    const events = this.pendingEvents;
    this.pendingEvents = [];
    this.renderer.render(this.state, events, deltaMs);
  }

  private apply(command: GameCommand): void {
    const transition = dispatch(this.state, command);
    if (transition.state === this.state && transition.events.length === 0) return;
    this.state = transition.state;
    this.pendingEvents.push(...transition.events);
    this.audio.play(transition.events);
    this.onState?.(this.state, transition.events);
  }

  private readonly handleAction = (action: InputAction): void => {
    void this.audio.prime();
    if (action === 'pause') {
      if (this.state.status === 'paused') this.apply({ type: 'resume' });
      else if (this.state.status === 'playing') this.apply({ type: 'pause' });
      this.input?.clearHeld();
      return;
    }
    if (action === 'restart') {
      if (this.state.status === 'game-over' || this.state.status === 'paused' || this.state.status === 'ready') {
        this.apply({ type: 'restart', seed: this.state.seed });
        this.input?.clearHeld();
      }
      return;
    }
    if (this.state.status === 'ready') this.apply({ type: 'start' });
    if (this.state.status !== 'playing') return;

    const command: Record<Exclude<InputAction, 'pause' | 'restart'>, GameCommand> = {
      left: { type: 'move', dx: -1 },
      right: { type: 'move', dx: 1 },
      'soft-drop': { type: 'soft-drop' },
      'hard-drop': { type: 'hard-drop' },
      'rotate-cw': { type: 'rotate', direction: 1 },
      'rotate-ccw': { type: 'rotate', direction: -1 },
      hold: { type: 'hold' },
    };
    this.apply(command[action]);
  };

  private readonly onVisibilityChange = (): void => {
    if (document.hidden && this.state.status === 'playing') {
      this.apply({ type: 'pause' });
      this.input?.clearHeld();
      this.audio.suspend();
    }
  };

  private readonly onWindowBlur = (): void => {
    if (this.state.status !== 'playing') return;
    this.apply({ type: 'pause' });
    this.audio.suspend();
  };
}
