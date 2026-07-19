# T12 Frontend Workstream Log

## 2026-07-20 — TETRIS-T12.5-FRONTEND-042 source candidate

- Base: `69eec5f`; integrated source candidate: `d2469e3`.
- Exact paths: `src/App.tsx`, `src/App.test.ts`, `src/styles.css`,
  `src/game/render/TetrisRenderer.ts`, and `src/game/render/TetrisRenderer.test.ts`.
- Result: Puzzle now presents a seven-tier `解谜航图` rather than a flat card wall.
  It visibly states every unlock rule, keeps locked records readable/inert, contains
  no entry thumbnail/corner-dot system, and retains one selected canonical preview.
  The gameplay HUD reports target progress and placed pieces only; it has no budget or
  timeout copy. `B` is documented and a sixth touch key invokes the same runtime undo;
  renderer undo clears stale landing, trail, impact, rotation, and board-shift state.
- Commands run: `npm.cmd run typecheck`; focused `vitest run src/App.test.ts
  src/game/render/TetrisRenderer.test.ts --reporter=verbose` (2 files / 14 tests);
  live desktop, 390×844 portrait, and 844×390 landscape inspection.
- Evidence: the final coordinator browser matrix observes 3/20 initial opening,
  6/20 after two Tier-1 completions, full rule copy, no document overflow/console
  error, two visible Next pieces, and actual keyboard/touch rollback.
- Independent visual/browser QA accepted `69eec5f..d2469e3` with no P0–P2 finding;
  its disposition is recorded in `aa23394`. Next: coordinator publication only.
