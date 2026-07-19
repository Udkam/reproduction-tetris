# T12 Coordinator Log

## 2026-07-20 — TETRIS-T12.5-COORDINATOR-040 source candidate

- Base: `69eec5f`; active contract checkpoints: `5f830d7`, `0f1ee20`, and
  `8bd9108`; integrated source candidate: `d2469e3`.
- Scope: replace the unaccepted T12.4 budget/anchor ordering with a twenty-level
  shallow curriculum, target-only success, a Core-owned Puzzle undo checkpoint, and
  the themed selected-preview-only campaign atlas. The candidate is one documented
  atomic migration because state, runtime, renderer, and UI contracts are coupled.
- Commands run: `npm.cmd run typecheck`; `npm.cmd run test` (44 passed files / 286
  tests; 1 skipped file / 2 skipped tests); `npm.cmd run build` (741 modules); the
  required `web_game_playwright_client.js`; and a fresh Playwright desktop/portrait/
  landscape/tier/keyboard-undo/touch-undo matrix.
- Evidence: `browser-evidence.json` names the exact candidate SHA and local capture
  paths. The real browser replay verifies level 08 keyboard and touch undo restore
  score 36→0, placed count 1→0, board/queue/targets, two Next pieces, one canvas,
  zero DOM cells, zero console errors, and no document overflow.
- Blocker: independent Core and visual/browser QA verdicts are pending. Next: record
  read-only dispositions, then integrate accepted progress/changelog metadata and push.
