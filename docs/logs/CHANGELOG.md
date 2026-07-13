# Changelog

## 2026-07-13 — New two-game branch sequence

- Created and pushed `codex/tetris` and `codex/temple-run` from the neutral `main` baseline.
- Began only the Tetris branch as required; the Temple Run branch remains untouched.
- Added branch boundaries, the Signal Foundry design contract, and the T1 implementation/acceptance scope.

## 2026-07-13 — Signal Foundry T1 implementation complete

- Built a deterministic 10 × 20 visible falling-block Marathon engine with hidden spawn rows, seven-bag generation, SRS kicks, hold, ghost, lock delay, scoring, levels, pause, restart, and top-out.
- Kept the simulation core serializable and independent from React, PixiJS, browser timing, storage, and audio.
- Added a fixed-step runtime, DAS/ARR keyboard input, responsive touch controls, procedural WebAudio, local settings/high-score persistence, reduced-motion support, and high-contrast rendering.
- Delivered the original Signal Foundry presentation across desktop, portrait, and landscape layouts without copied commercial art, branding, music, fonts, or screen composition.
- Added deterministic rule, replay, input, runtime, and QA-scenario tests.
- Browser QA passed 10 evidence contexts with one canvas, zero gameplay DOM cells, zero recorded console errors, deterministic four-line-clear midpoint evidence, real command-driven game over, and hashed screenshots.
- Mobile QA now drives the rendered controls with real Chromium touch events and verifies tap input, DAS long-hold, pointer-release cancellation, pause/resume, and reduced-motion behavior in portrait and landscape.
- Window blur and document visibility loss both suspend active play without accidentally resuming an already-paused session.
- Recorded a Pixi scene-preparation benchmark of 0.30 ms p95; headless rAF throttling remains explicitly diagnostic rather than acceptance evidence.
- Kept `codex/temple-run` unchanged; endless-runner work remains sequenced after the Tetris milestone is committed and pushed.
