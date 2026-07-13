import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type GameEvent, type GameState, createInitialState } from './game/core';
import { type InputAction } from './game/input/InputController';
import { GameRuntime } from './game/runtime/GameRuntime';

const HIGH_SCORE_KEY = 'signal-foundry:high-score';
const AUDIO_KEY = 'signal-foundry:audio';
const CONTRAST_KEY = 'signal-foundry:contrast';
const MOTION_KEY = 'signal-foundry:reduced-motion';

function readBoolean(key: string, fallback: boolean): boolean {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === 'true';
  } catch {
    return fallback;
  }
}

function readNumber(key: string, fallback: number): number {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function formatScore(value: number): string {
  return Math.max(0, value).toString().padStart(7, '0');
}

function statusCopy(state: GameState): { eyebrow: string; title: string; body: string } | null {
  if (state.status === 'ready') {
    return {
      eyebrow: 'SYSTEM READY',
      title: 'Begin calibration',
      body: 'Build clean signals. Hold a piece, read the queue, and keep the matrix below the skyline.',
    };
  }
  if (state.status === 'paused') {
    return {
      eyebrow: 'FLOW SUSPENDED',
      title: 'Instrument paused',
      body: 'The simulation and input repeat clocks are frozen. Resume when you are ready.',
    };
  }
  if (state.status === 'game-over') {
    return {
      eyebrow: 'SIGNAL SATURATED',
      title: 'Matrix overflow',
      body: `Final score ${formatScore(state.score)} · ${state.lines} lines resolved.`,
    };
  }
  return null;
}

interface TouchButtonProps {
  action: InputAction;
  label: string;
  glyph: string;
  runtime: GameRuntime | null;
  primary?: boolean;
  disabled?: boolean;
}

function TouchButton({ action, label, glyph, runtime, primary = false, disabled = false }: TouchButtonProps) {
  const release = useCallback(() => runtime?.release(action), [action, runtime]);
  return (
    <button
      className={`touch-key${primary ? ' touch-key--primary' : ''}`}
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        runtime?.press(action);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span aria-hidden="true">{glyph}</span>
      <small>{label}</small>
    </button>
  );
}

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const [state, setState] = useState<GameState>(() => createInitialState(0x51a1f00d));
  const [highScore, setHighScore] = useState(() => readNumber(HIGH_SCORE_KEY, 0));
  const [audioEnabled, setAudioEnabled] = useState(() => readBoolean(AUDIO_KEY, true));
  const [highContrast, setHighContrast] = useState(() => readBoolean(CONTRAST_KEY, false));
  const [reducedMotion, setReducedMotion] = useState(() => {
    const system = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    return readBoolean(MOTION_KEY, system);
  });
  const [liveMessage, setLiveMessage] = useState('Signal Foundry ready.');
  const focusBoard = useCallback(() => {
    requestAnimationFrame(() => hostRef.current?.querySelector('canvas')?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    const nextRuntime = new GameRuntime({
      seed: 0x51a1f00d,
      audioEnabled,
      highContrast,
      reducedMotion,
      onState: (nextState, events) => {
        if (disposed) return;
        setState(structuredClone(nextState));
        const notable = [...events].reverse().find((event) =>
          event.type === 'lines-cleared' || event.type === 'level-up' || event.type === 'paused' || event.type === 'resumed' || event.type === 'game-over',
        );
        if (notable) setLiveMessage(eventMessage(notable));
        setHighScore((current) => {
          if (nextState.score <= current) return current;
          try { localStorage.setItem(HIGH_SCORE_KEY, String(nextState.score)); } catch { /* storage is optional */ }
          return nextState.score;
        });
      },
    });
    runtimeRef.current = nextRuntime;
    setRuntime(nextRuntime);
    void nextRuntime.mount(host);
    return () => {
      disposed = true;
      nextRuntime.destroy();
      if (runtimeRef.current === nextRuntime) runtimeRef.current = null;
      setRuntime(null);
    };
    // Runtime is intentionally mounted once. Settings are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    runtimeRef.current?.setAudioEnabled(audioEnabled);
    try { localStorage.setItem(AUDIO_KEY, String(audioEnabled)); } catch { /* optional */ }
  }, [audioEnabled]);

  useEffect(() => {
    runtimeRef.current?.setHighContrast(highContrast);
    try { localStorage.setItem(CONTRAST_KEY, String(highContrast)); } catch { /* optional */ }
  }, [highContrast]);

  useEffect(() => {
    runtimeRef.current?.setReducedMotion(reducedMotion);
    try { localStorage.setItem(MOTION_KEY, String(reducedMotion)); } catch { /* optional */ }
  }, [reducedMotion]);

  const overlay = statusCopy(state);
  const levelProgress = useMemo(() => `${state.lines % 10} / 10`, [state.lines]);
  const elapsed = Math.floor(state.elapsedTicks / 60);
  const elapsedLabel = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div className={`app${highContrast ? ' is-high-contrast' : ''}${reducedMotion ? ' is-reduced-motion' : ''}`}>
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <div>
            <p className="kicker">PRECISION MATRIX / SF–01</p>
            <h1>SIGNAL FOUNDRY</h1>
          </div>
        </div>
        <div className="system-state" aria-label={`Game status: ${state.status}`}>
          <span className={`status-light status-light--${state.status}`} />
          <div>
            <strong>{state.status === 'playing' ? 'FLOW ACTIVE' : state.status.replace('-', ' ').toUpperCase()}</strong>
            <small>MARATHON · LEVEL {String(state.level).padStart(2, '0')}</small>
          </div>
        </div>
      </header>

      <main id="game" className="game-layout">
        <aside className="instrument-panel instrument-panel--stats" aria-label="Session statistics">
          <p className="panel-label">LIVE TELEMETRY</p>
          <div className="score-block">
            <span>Score</span>
            <strong>{formatScore(state.score)}</strong>
          </div>
          <div className="stat-grid">
            <article><span>Level</span><strong>{String(state.level).padStart(2, '0')}</strong></article>
            <article><span>Lines</span><strong>{String(state.lines).padStart(3, '0')}</strong></article>
            <article><span>Time</span><strong>{elapsedLabel}</strong></article>
            <article><span>Best</span><strong>{formatScore(highScore)}</strong></article>
          </div>
          <div className="level-rail" aria-label={`Level progress ${levelProgress}`}>
            <div className="level-rail__header"><span>NEXT PHASE</span><strong>{levelProgress}</strong></div>
            <div className="level-rail__track"><i style={{ width: `${(state.lines % 10) * 10}%` }} /></div>
          </div>
          <div className="keyboard-map" aria-label="Keyboard controls">
            <p>MOVE <kbd>←</kbd><kbd>→</kbd></p>
            <p>ROTATE <kbd>Z</kbd><kbd>X</kbd></p>
            <p>DROP <kbd>↓</kbd><kbd>SPACE</kbd></p>
            <p>HOLD <kbd>C</kbd></p>
          </div>
        </aside>

        <section className="game-stage" aria-label="Game instrument">
          <div className="stage-corners" aria-hidden="true"><i /><i /><i /><i /></div>
          <div ref={hostRef} className="canvas-host" data-testid="canvas-host" />
          {overlay && (
            <div className="game-overlay" data-testid="game-overlay">
              <p>{overlay.eyebrow}</p>
              <h2>{overlay.title}</h2>
              <span>{overlay.body}</span>
              <div className="overlay-actions">
                {state.status === 'ready' && <button type="button" onClick={() => { runtime?.start(); focusBoard(); }}>Initialize run</button>}
                {state.status === 'paused' && <button type="button" onClick={() => { runtime?.togglePause(); focusBoard(); }}>Resume flow</button>}
                {state.status === 'game-over' && <button type="button" onClick={() => { runtime?.restart(); focusBoard(); }}>Reforge matrix</button>}
              </div>
            </div>
          )}
        </section>

        <aside className="instrument-panel instrument-panel--settings" aria-label="Instrument settings">
          <p className="panel-label">SIGNAL CONTROL</p>
          <button className="setting-toggle" type="button" aria-pressed={audioEnabled} onClick={() => setAudioEnabled((value) => !value)}>
            <span><i className="setting-icon">◉</i> Audio</span><strong>{audioEnabled ? 'ON' : 'OFF'}</strong>
          </button>
          <button className="setting-toggle" type="button" aria-pressed={highContrast} onClick={() => setHighContrast((value) => !value)}>
            <span><i className="setting-icon">◫</i> Cell codes</span><strong>{highContrast ? 'ON' : 'OFF'}</strong>
          </button>
          <button className="setting-toggle" type="button" aria-pressed={reducedMotion} onClick={() => setReducedMotion((value) => !value)}>
            <span><i className="setting-icon">≈</i> Quiet motion</span><strong>{reducedMotion ? 'ON' : 'OFF'}</strong>
          </button>
          <div className="session-note">
            <span>SESSION SEED</span>
            <code>{state.seed.toString(16).toUpperCase().padStart(8, '0')}</code>
            <p>One seed, one command stream, one reproducible matrix.</p>
          </div>
          <button className="pause-button" type="button" onClick={() => runtime?.togglePause()} disabled={state.status === 'ready' || state.status === 'game-over'}>
            {state.status === 'paused' ? 'Resume session' : 'Pause session'}
          </button>
        </aside>
      </main>

      <section className="touch-deck" aria-label="Touch controls">
        <div className="touch-deck__cluster">
          <TouchButton action="left" label="Move left" glyph="←" runtime={runtime} />
          <TouchButton action="right" label="Move right" glyph="→" runtime={runtime} />
          <TouchButton action="soft-drop" label="Soft drop" glyph="↓" runtime={runtime} />
          <TouchButton
            action="pause"
            label={state.status === 'paused' ? 'Resume' : 'Pause'}
            glyph={state.status === 'paused' ? '▶' : 'Ⅱ'}
            runtime={runtime}
            disabled={state.status === 'ready' || state.status === 'game-over'}
          />
        </div>
        <div className="touch-deck__cluster">
          <TouchButton action="rotate-ccw" label="Rotate left" glyph="↺" runtime={runtime} />
          <TouchButton action="rotate-cw" label="Rotate right" glyph="↻" runtime={runtime} />
          <TouchButton action="hold" label="Hold piece" glyph="◇" runtime={runtime} />
          <TouchButton action="hard-drop" label="Hard drop" glyph="⇣" runtime={runtime} primary />
        </div>
      </section>

      <footer className="footer-note">
        <span>ORIGINAL CLEAN-ROOM FALLING-BLOCK STUDY</span>
        <span>REACT · TYPESCRIPT · PIXIJS</span>
      </footer>
      <div className="sr-only" aria-live="polite">{liveMessage}</div>
    </div>
  );
}

function eventMessage(event: GameEvent): string {
  if (event.type === 'lines-cleared') return `${event.count} ${event.count === 1 ? 'line' : 'lines'} cleared.`;
  if (event.type === 'level-up') return `Level ${event.level}.`;
  if (event.type === 'paused') return 'Game paused.';
  if (event.type === 'resumed') return 'Game resumed.';
  if (event.type === 'game-over') return 'Matrix overflow. Game over.';
  return '';
}
