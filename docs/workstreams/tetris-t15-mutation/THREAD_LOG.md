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

## 2026-07-28 — three-way baseline audit and writer freeze

- Task ID: `T15-PHASE5-MUTATION-BASELINE-AUDIT`.
- Coordinator: `/root`; audit head `fae3c96`; rollback base `fd7ef8d`.
- Independent read-only auditors:
  - `t15_mutation_core_reaudit`: `GAP` for shared seven-bag/item RNG, stopped Ice
    gravity, weak retrigger/coexistence coverage, and duplicate Collapse scans.
  - `t15_mutation_render_reaudit`: `GAP` for broad Collapse bars/lanes, pre-impact
    Bomb fragments, indistinguishable persistent 2×/4× endpoints, and FIFO loss when
    reduced motion changes at runtime.
  - `t15_mutation_ui_reaudit`: `GAP` for fixed idle rows, stale “冻结/停落” copy,
    attachment-blind Next accessibility, and last-event-only announcements.
- Preserved evidence: the 7 × 4 carrier cross-product, pure immediate-Next item
  prediction, independent timed fields, one-shot Bomb, 2×→4× scoring, renderer FIFO,
  bounded particle pool, and reused filters are valid starting structures, not final
  acceptance.
- Frozen checkpoint order and paths are recorded in `docs/phases/phase 5.md`:
  Core RNG/Ice → Core shared Collapse mapping/performance → runtime FIFO proof →
  renderer carrier/timeline/actual-column VFX → UI semantics/localization →
  responsive status layout.
- Commands: read-only source/docs/Git inspection only. No product test, build,
  browser, or source edit is claimed for this audit checkpoint.
- Blocker: none.
- Next action: create the Core RNG/Ice checkpoint and direct deterministic tests.
