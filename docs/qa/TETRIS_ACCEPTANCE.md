# Tetris Acceptance Matrix

Result: **passed locally on 2026-07-14**, pending coordinator commit and push.

## Deterministic rules

- Seven-bag, movement, collision, wall kicks, hold, hard drop, lock, clear, scoring, pause, restart, and top-out are renderer-independent.
- Marathon mode uses the established line-level gravity curve.
- Race mode advances one tier per five locked pieces and caps at two ticks per cell.
- `mode` and `pieceCount` participate in hash and replay.
- Every actual lock, including lock-out, increments `pieceCount` exactly once.
- Restart resets the piece count and preserves or explicitly selects mode.

## Input and presentation

- Fixed-step simulation is independent of display refresh rate.
- Left/right use deterministic DAS/ARR and most-recent direction priority.
- Soft drop fires immediately, waits three ticks, then repeats every fixed tick.
- Renderer presentation approaches canonical positions monotonically without overshoot.
- Entry delay is three ticks and routine React-facing state updates are coalesced without slowing Pixi frames.
- Window blur and document hiding suspend active play.
- Restart/unmount cleanup remains covered by runtime tests.

## Interface

- Formal game name is `Tetris`; other player-facing copy is concise Chinese.
- Desktop has one data rail and one board stage, with no settings/card column.
- Hold and Next each render one piece; Next appears below Hold.
- Pattern/high-contrast and manual reduced-motion preferences are absent.
- `prefers-reduced-motion` remains automatic.
- Pause appears as a labelled header action and a large board-local `已暂停` state.
- Local leaderboard validates corrupted data fail-closed, sorts deterministically, and caps at eight records.

## Browser evidence

- Manifest: `docs/qa/tetris-browser-evidence.json`
- 1440 × 900 DPR1: ready, live play, four-line midpoint, paused, race, and game-over states.
- 390 × 844 DPR3: complete board, stats rail, six controls, real touch holds and release cancellation.
- 844 × 390 DPR3: complete board-left / controls-right landscape composition without overflow.
- Reduced-motion context uses the system media preference and exposes no manual controls.
- Exactly one canvas, zero gameplay DOM cells, and zero console errors.
- Keyboard soft drop: Y `19 → 30`, remained `30` after release.
- Touch soft drop: Y `19 → 26`, remained `26` after release.
- Race evidence: selected mode `race`, first lock produced `pieceCount = 1`.
- Game-over evidence: persisted one record matching score, lines, piece count, mode, and timestamp schema.
- Pixi preparation benchmark: mean 0.136 ms, p95 0.20 ms, max 3.00 ms over 160 samples.

## Build gates

- `npm.cmd run typecheck`: passed.
- `npm.cmd run test`: 8 files / 41 tests passed.
- `npm.cmd run build`: passed; main JS 374.56 kB before gzip.
