# T21 Coordinator Workstream Log

- Task ID: `TETRIS-T21-SURVIVAL-WALL-SHEET-001`
- Base SHA: `4505fb94e61ab5c883388d5bd21557349ddc6d10`
- Owner: primary coordinator, sole writer
- Status: contract frozen; product implementation pending
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
- Blocker: none
- Next action: implement and directly test the renderer-only wall/warning claim
