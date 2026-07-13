# Tetris Acceptance Matrix

Result: **passed locally on 2026-07-13**, pending the final branch commit and push.

## Core rules

- Seven-bag emits every piece exactly once per bag and replays identically from the same seed.
- Pieces cannot pass through walls, floor, or settled cells.
- Clockwise/counter-clockwise rotations use deterministic piece-specific kick attempts.
- Hold is available once per active piece and restores after lock.
- Hard drop locks at the ghost landing row and awards distance points.
- Completed rows collapse exactly once; score, lines, and level update atomically.
- Spawn collision produces game over without corrupting the board.
- Paused ticks cannot advance simulation state.

## Runtime and input

- Fixed-step simulation is independent of display refresh rate.
- Left/right DAS and ARR do not conflict; the most recently pressed direction wins.
- Window blur and document hidden state pause the game.
- Restart resets runtime clocks, held keys, presentation events, and audio voices.
- Unmount removes keyboard, pointer, ticker, resize, and visibility listeners.

## Browser evidence

- 1440 × 900 DPR1: menu/ready state and live mid-game state.
- 390 × 844: portrait game state with complete board and touch controls.
- 844 × 390: landscape state without overflow.
- pause and game-over overlays.
- reduced-motion and high-contrast state.
- exactly one canvas, no gameplay DOM cells, no console errors.

## Recorded evidence

- Browser evidence manifest: `docs/qa/tetris-browser-evidence.json`
- Desktop ready, playing, four-line midpoint, paused, high-contrast, and game-over captures
- Mobile portrait, mobile landscape, and reduced-motion captures
- 10 total evidence entries with SHA-256 hashes
- Four-line clear exercised through the public hard-drop action from a deterministic QA state
- Game over reached through repeated public hard-drop actions rather than a renderer-only fixture
- Mobile portrait, landscape, and reduced-motion contexts use real Chromium touch events for tap, DAS long-hold, pointer release, pause, and resume
- Reduced-motion evidence asserts the control remains enabled under `prefers-reduced-motion: reduce`
- Pixi scene-preparation benchmark: mean 0.179 ms, p95 0.30 ms, maximum 1.10 ms over 160 samples

Headless Chromium reported throttled rAF timing. It is preserved in the manifest as diagnostic context and is not used as the performance acceptance gate.
