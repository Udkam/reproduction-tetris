# T21 Coordinator Workstream Log

- Task ID: `TETRIS-T21-SURVIVAL-WALL-SHEET-001`
- Base SHA: `4505fb94e61ab5c883388d5bd21557349ddc6d10`
- Owner: primary coordinator, sole writer
- Status: accepted; source, evidence, final gates, and independent read-only QA green
- Authorized contract paths: `docs/CURRENT_TASK.md`, `docs/DESIGN.md`, `progress.md`,
  this log
- Authorized renderer paths: `src/game/render/TetrisRenderer.ts`,
  `src/game/render/TetrisRenderer.test.ts`
- Authorized gameplay-sheet paths: `src/App.tsx`, `src/App.test.ts`,
  `src/ui/ActionSheet.tsx`, and inspected authoritative HUD/style paths only
- Evidence required: live Survival wall, arrow-only warning, pause and restart sheets
  with visible unobscured Next; one Canvas, zero DOM board cells, zero console errors,
  no overflow
- Commands run: read-only Git, targeted `rg`, and UTF-8 source/document inspection
- Green checkpoints: `b5e9180` (wall + arrow), `90d14c8` (gameplay sheets + Next)
- Green addendum checkpoints: `3da4caa` (Bomb-first compact Mutation cues and sustained
  Supergravity field), `1271979` (readable gameplay-sheet preview)
- Green final checkpoints: `614c7a6` (piece-count, visible-entry Survival Core),
  `a11ae20` (actual Next visibility, home language, bilingual rules), `7d5e944`
  (public QA replay recalibration), and `ca3d571` (browser evidence)
- Green verification before Mutation addendum: focused Renderer `43/43`, focused App
  `43/43`, typecheck, full `32 passed / 1 skipped` files (`298 passed / 3 skipped`
  tests), and 762-module build
- Final commands: targeted Core/App/Renderer tests (`112 passed`), public QA replay
  tests (`2 passed`), `npm.cmd run typecheck`, complete `npm.cmd run test`
  (`300 passed / 3 skipped`), `npm.cmd run build`, prescribed action client, and one
  bounded Playwright browser-evidence pass
- Final evidence: `docs/qa/evidence/tetris-t21/browser/evidence.json` plus full-page and
  Next crops for Home, live Survival, pause, restart, leave, and first rockfall frame;
  one Canvas, zero console errors, and fully visible rockfall entry confirmed
- Independent QA: exact range `4505fb9..ca3d571`, P0-P3 zero; PNGs were independently
  path/manifest checked and coordinator-inspected at original detail
- Resource disposition: owned Vite PID 30444 stopped; port 4178 released
- Blocker: none
- Next action: changelog checkpoint, scoped pre-push scan, and non-force push of `main`
- Direct clarification (2026-08-02): the piece-count HUD is exactly `距离落石` / `X块`;
  the first stone frame must contain the complete one- or two-cell body inside the
  visible board, never clipped by or descending through the hidden spawn buffer.
