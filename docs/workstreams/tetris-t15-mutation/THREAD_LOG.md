# T15 Phase 5 Mutation Workstream Log

## 2026-07-28 — contract opened

- Task ID: `T15-PHASE5-MUTATION-CONTRACT`.
- Coordinator: `/root`.
- Pushed rollback base: `fd7ef8d`.
- Status: `CONTRACT`; no Phase-5 product source has changed and no candidate exists.
- Frozen behavior:
  - all seven ordinary tetromino bodies independently cross all four item attachments;
  - active, locked, and immediate-Next carriers share one body-plus-attachment grammar
    with at least three non-colour recognition cues per family;
  - player-facing `冰冻` uses 1 second/cell automatic gravity for ten seconds and
    resets to ten seconds when retriggered; ordinary Mutation floors at 0.1 s/cell;
  - Collapse removes the ten-column and board-top bars in favour of affected-column
    gravity wells, compression, downward motes, edge refraction, and settlement;
  - Bomb remains one-shot visual information; Multiplier progresses 2×→4×; timed
    statuses may coexist and retriggers reset their own clocks;
  - a FIFO preserves every short activation when one Core transition emits multiple
    effects; Collapse computation must meet the explicit performance budget.
- First checkpoint order: Core/performance → Pixi renderer/VFX → DOM status/Next.
  Each writer receives exact paths only after the three read-only baseline audits.
- Excluded: Survival, Classic shared line-clear polish, Puzzle selector/data,
  Settings composition, music, dependencies, packaging, a second Canvas, and a DOM
  board.
- Commands run for this transition: Phase-4 resource/Git verification and non-force
  push; no Phase-5 test, build, browser, or source command is claimed.
- Blocker: none.
- Next action: independently map Core/performance, Renderer/VFX, and UI/Next gaps
  against `docs/phases/phase 5.md`, then freeze exact writer-owned paths.
