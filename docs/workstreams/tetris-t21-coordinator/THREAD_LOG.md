# T21 Coordinator Workstream Log

- Task ID: `TETRIS-T21-SURVIVAL-WALL-SHEET-001`
- Base SHA: `4505fb94e61ab5c883388d5bd21557349ddc6d10`
- Owner: primary coordinator, sole writer
- Status: wall/warning, gameplay-sheet, and Mutation source checkpoints green;
  Survival cadence and home-language/rules addendum contracted before browser acceptance
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
- Green verification before Mutation addendum: focused Renderer `43/43`, focused App
  `43/43`, typecheck, full `32 passed / 1 skipped` files (`298 passed / 3 skipped`
  tests), and 762-module build
- Blocker: none
- Next action: implement and directly test piece-count Survival stonefall, the sole
  home language switch, and rewritten bilingual rules before the final gate/browser batch
