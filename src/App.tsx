import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type GameEvent, type GameMode, type GameState, createInitialState } from './game/core';
import { type InputAction } from './game/input/InputController';
import { GameRuntime } from './game/runtime/GameRuntime';
import {
  LEADERBOARD_KEY,
  insertScoreRecord,
  parseLeaderboard,
  type ScoreRecord,
} from './leaderboard';

const AUDIO_KEY = 'stack-order:audio';

function readBoolean(key: string, fallback: boolean): boolean {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === 'true';
  } catch {
    return fallback;
  }
}

function readLeaderboard(): ScoreRecord[] {
  try {
    return parseLeaderboard(localStorage.getItem(LEADERBOARD_KEY));
  } catch {
    return [];
  }
}

function formatScore(value: number): string {
  return Math.max(0, value).toString().padStart(7, '0');
}

function modeLabel(mode: GameMode): string {
  return mode === 'race' ? '竞速' : '马拉松';
}

function statusLabel(state: GameState): string {
  if (state.status === 'ready') return '准备';
  if (state.status === 'playing') return '进行中';
  if (state.status === 'paused') return '已暂停';
  return '本局结束';
}

function statusCopy(state: GameState): { eyebrow: string; title: string; summary?: string } | null {
  if (state.status === 'ready') {
    return {
      eyebrow: modeLabel(state.mode),
      title: 'Tetris',
    };
  }
  if (state.status === 'paused') {
    return {
      eyebrow: '暂停',
      title: '已暂停',
    };
  }
  if (state.status === 'game-over') {
    return {
      eyebrow: '本局结束',
      title: '本局结束',
      summary: `${formatScore(state.score)} 分 · ${state.lines} 行 · ${state.pieceCount} 块`,
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
}

function TouchButton({ action, label, glyph, runtime, primary = false }: TouchButtonProps) {
  const release = useCallback(() => runtime?.release(action), [action, runtime]);
  return (
    <button
      className={`touch-key${primary ? ' touch-key--primary' : ''}`}
      type="button"
      aria-label={label}
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
  const lastRecordedRunRef = useRef<string | null>(null);
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const [state, setState] = useState<GameState>(() => createInitialState(0x51a1f00d));
  const [leaderboard, setLeaderboard] = useState<ScoreRecord[]>(readLeaderboard);
  const [audioEnabled, setAudioEnabled] = useState(() => readBoolean(AUDIO_KEY, true));
  const [liveMessage, setLiveMessage] = useState('Tetris 已准备好。');
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
      reducedMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
      onState: (nextState, events) => {
        if (disposed) return;
        setState(nextState);
        const notable = [...events].reverse().find((event) =>
          event.type === 'lines-cleared' || event.type === 'level-up' || event.type === 'paused' || event.type === 'resumed' || event.type === 'game-over',
        );
        if (notable) setLiveMessage(eventMessage(notable));

        if (nextState.status === 'ready') lastRecordedRunRef.current = null;
        if (nextState.status === 'game-over') {
          const runKey = `${nextState.seed}:${nextState.mode}:${nextState.elapsedTicks}:${nextState.pieceCount}:${nextState.score}`;
          if (lastRecordedRunRef.current !== runKey) {
            lastRecordedRunRef.current = runKey;
            const record: ScoreRecord = {
              score: nextState.score,
              lines: nextState.lines,
              pieces: nextState.pieceCount,
              mode: nextState.mode,
              completedAt: new Date().toISOString(),
            };
            setLeaderboard((current) => {
              const next = insertScoreRecord(current, record);
              try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next)); } catch { /* storage is optional */ }
              return next;
            });
          }
        }
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
    // Runtime is intentionally mounted once. Preferences are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    runtimeRef.current?.setAudioEnabled(audioEnabled);
    try { localStorage.setItem(AUDIO_KEY, String(audioEnabled)); } catch { /* optional */ }
  }, [audioEnabled]);

  const overlay = statusCopy(state);
  const levelProgress = useMemo(() => `${state.lines % 10} / 10`, [state.lines]);
  const speed = state.mode === 'race' ? Math.min(17, Math.floor(state.pieceCount / 5) + 1) : state.level + 1;
  const showLeaderboard = state.status === 'ready' || state.status === 'game-over';

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><b>T</b><i>■</i></span>
          <h1>Tetris</h1>
        </div>

        <div className="topbar-tools" aria-label="快捷设置">
          <button type="button" aria-label={audioEnabled ? '关闭声音' : '打开声音'} aria-pressed={audioEnabled} onClick={() => setAudioEnabled((value) => !value)}>
            <span aria-hidden="true">{audioEnabled ? '♪' : '×'}</span>
          </button>
          <button
            className="header-pause"
            type="button"
            onClick={() => runtime?.togglePause()}
            disabled={state.status === 'ready' || state.status === 'game-over'}
            aria-label={state.status === 'paused' ? '继续游戏' : '暂停游戏'}
          >
            {state.status === 'paused' ? '继续' : '暂停'}
          </button>
        </div>

        <div className="system-state" aria-label={`游戏状态：${statusLabel(state)}`}>
          <span className={`status-light status-light--${state.status}`} />
          <div>
            <strong>{statusLabel(state)}</strong>
            <small>{modeLabel(state.mode)} · 等级 {String(state.level).padStart(2, '0')}</small>
          </div>
        </div>
      </header>

      <main id="game" className="game-layout">
        <aside className="instrument-panel instrument-panel--stats" aria-label="本局数据">
          <p className="panel-label">{modeLabel(state.mode)}</p>
          <div className="score-block">
            <span>得分</span>
            <strong>{formatScore(state.score)}</strong>
          </div>
          <div className="stat-grid">
            <article><span>等级</span><strong>{String(state.level).padStart(2, '0')}</strong></article>
            <article><span>消行</span><strong>{String(state.lines).padStart(3, '0')}</strong></article>
            <article><span>速度</span><strong>{String(speed).padStart(2, '0')}</strong></article>
          </div>
          <div className="level-rail" aria-label={`升级进度 ${levelProgress}`}>
            <div className="level-rail__header"><span>距离升级</span><strong>{levelProgress}</strong></div>
            <div className="level-rail__track"><i style={{ width: `${(state.lines % 10) * 10}%` }} /></div>
          </div>
          <div className="keyboard-map" aria-label="键盘操作">
            <p>移动 <kbd>←</kbd><kbd>→</kbd></p>
            <p>旋转 <kbd>Z</kbd><kbd>X</kbd></p>
            <p>下落 <kbd>↓</kbd><kbd>空格</kbd></p>
            <p>暂存 <kbd>C</kbd></p>
          </div>
        </aside>

        <section className="game-stage" aria-label="Tetris 棋盘">
          <div ref={hostRef} className="canvas-host" data-testid="canvas-host" />
          {overlay && (
            <div className={`game-overlay game-overlay--${state.status}`} data-testid="game-overlay">
              <div className="overlay-sheet">
                <p>{overlay.eyebrow}</p>
                <h2>{overlay.title}</h2>
                {overlay.summary && <span>{overlay.summary}</span>}
                {state.status === 'ready' && (
                  <div className="mode-choice" aria-label="游戏模式">
                    <button type="button" aria-pressed={state.mode === 'marathon'} onClick={() => runtime?.selectMode('marathon')}>马拉松</button>
                    <button type="button" aria-pressed={state.mode === 'race'} onClick={() => runtime?.selectMode('race')}>竞速</button>
                  </div>
                )}
                <div className="overlay-actions">
                  {state.status === 'ready' && <button type="button" onClick={() => { runtime?.start(); focusBoard(); }}>开始</button>}
                  {state.status === 'paused' && <button type="button" onClick={() => { runtime?.togglePause(); focusBoard(); }}>继续</button>}
                  {state.status === 'game-over' && <button type="button" onClick={() => { runtime?.restart(); focusBoard(); }}>再来一局</button>}
                </div>
                {showLeaderboard && <Leaderboard records={leaderboard} />}
              </div>
            </div>
          )}
        </section>
      </main>

      <section className="touch-deck" aria-label="触控操作">
        <div className="touch-deck__cluster">
          <TouchButton action="left" label="左移" glyph="←" runtime={runtime} />
          <TouchButton action="right" label="右移" glyph="→" runtime={runtime} />
          <TouchButton action="rotate-cw" label="旋转" glyph="↻" runtime={runtime} />
        </div>
        <div className="touch-deck__cluster">
          <TouchButton action="soft-drop" label="快速下落" glyph="↓" runtime={runtime} />
          <TouchButton action="hold" label="暂存" glyph="◇" runtime={runtime} />
          <TouchButton action="hard-drop" label="直接落底" glyph="⇣" runtime={runtime} primary />
        </div>
      </section>

      <div className="sr-only" aria-live="polite">{liveMessage}</div>
    </div>
  );
}

function Leaderboard({ records }: { records: readonly ScoreRecord[] }) {
  return (
    <section className="leaderboard" aria-label="本地记录">
      <div className="leaderboard__head"><span>本地记录</span><small>前 {Math.min(5, records.length || 5)} 局</small></div>
      {records.length === 0 ? (
        <p className="leaderboard__empty">暂无记录</p>
      ) : (
        <ol>
          {records.slice(0, 5).map((record, index) => (
            <li key={`${record.completedAt}:${record.mode}:${record.score}:${index}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{formatScore(record.score)}</strong>
              <small>{modeLabel(record.mode)} · {record.lines} 行 · {record.pieces} 块</small>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function eventMessage(event: GameEvent): string {
  if (event.type === 'lines-cleared') return `消除了 ${event.count} 行。`;
  if (event.type === 'level-up') return `进入等级 ${event.level}。`;
  if (event.type === 'paused') return '游戏已暂停。';
  if (event.type === 'resumed') return '继续游戏。';
  if (event.type === 'game-over') return '堆叠到顶，本局结束。';
  return '';
}
