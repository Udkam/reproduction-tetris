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

## 2026-07-28 — Core RNG/Ice checkpoint

- Task ID: `T15-PHASE5-MUTATION-CORE-1`.
- Writer: `/root`; base `c5ef6e2`; candidate `f344f49`.
- Exact changed paths:
  - `src/game/core/constants.ts`
  - `src/game/core/types.ts`
  - `src/game/core/engine.ts`
  - `src/game/core/sprint.test.ts`
- Delivered behavior:
  - a salted `mutationRandomizer` is canonical only for Mutation and never perturbs
    the ordinary seven-bag;
  - immediate Next predicts `{body,item}` without consuming either stream;
  - Ice uses the effect active at tick start, advances one cell on tick 60, remains
    active on its final tick, then resumes the current Mutation cadence;
  - move, rotate, soft drop, and hard drop remain available;
  - partial retriggers reset only their target timer to 600 while concurrent timers
    continue normally.
- Commands actually run:
  - `npm.cmd run test -- src/game/core/sprint.test.ts src/game/core/rules.test.ts`
    — 2 files / 25 tests PASS.
  - `npm.cmd run typecheck` — PASS.
  - prescribed `web_game_playwright_client.js` against temporary Vite port 4178 —
    Mutation countdown/live play captured with state `mode=sprint`,
    `status=playing`; both screenshots manually inspected.
- Resource/lifecycle evidence: PID 20804 stopped; port 4178 free; no Chrome,
  Chromium, Playwright, or headless process remained. Client artifacts are temporary
  and outside the repository.
- Blocker: none; checkpoint awaits independent rules review.
- Next action: implement one-pass Collapse board/carrier settlement mapping and its
  deterministic correctness/performance evidence.

## 2026-07-28 — Core Collapse shared-mapping checkpoint

- Task ID: `T15-PHASE5-MUTATION-CORE-2`.
- Writer: `/root`; base `e110430`; candidate `2e10789`.
- Exact changed paths:
  - `src/game/core/sprint.ts`
  - `src/game/core/mutation.ts`
  - `src/game/core/engine.ts`
  - `src/game/core/sprint.test.ts`
- Delivered behavior:
  - one fixed 40 × 10 bottom-up scan produces the collapsed board and an
    `Int16Array` source-to-settled-row mapping;
  - Engine hands that exact mapping to carrier settlement, which performs array
    indexing only and never rescans the board;
  - 96 deterministic sparse/medium/dense samples match an independent reference;
    a Proxy proof observes exactly 400 source-cell reads before carrier settlement.
- Commands actually run:
  - `npm.cmd run test -- src/game/core/sprint.test.ts` — 18/18 PASS.
  - `npm.cmd run typecheck` — PASS.
  - prescribed action client against temporary Vite port 4178 — real Mutation
    countdown, board, rail, and Next frame inspected.
- Resource/lifecycle evidence: Vite PID 31512 stopped; the exact temporary
  `playwright_chromiumdev_profile-9qMZlb` process tree was identified by parent,
  command line, and creation time before its root was stopped; port 4178 and
  Playwright Chrome count both returned zero.
- Blocker: none.
- Next action: add a direct Runtime same-transition FIFO handoff proof without
  changing runtime production code.

## 2026-07-28 — Runtime FIFO proof checkpoint

- Task ID: `T15-PHASE5-MUTATION-RUNTIME-FIFO`.
- Writer: `/root`; base `2e10789`; candidate `94c2d66`.
- Exact changed path: `src/game/runtime/GameRuntime.test.ts`.
- Delivered evidence: one legitimate nested Bomb → Ice line-clear transition reaches
  Renderer in order, while the next render receives an empty event list and cannot
  replay the activation.
- Commands actually run:
  - `npm.cmd run test -- src/game/runtime/GameRuntime.test.ts` — 11/11 PASS.
  - `npm.cmd run typecheck` — PASS.
- Blocker: none.
- Next action: independently audit the exact Core/performance/FIFO range before
  opening Renderer paths.

## 2026-07-28 — Core candidate audit correction

- Task ID: `T15-PHASE5-MUTATION-CORE-QA-R1`.
- Coordinator/writer: `/root`; audit head `94c2d66`; corrected candidate `3ceb6c2`.
- Independent auditor `t15_core_perf_fifo_candidate_qa` returned `GAP` with no P0/P1
  product defect. Its actionable evidence gaps were:
  - no fixed multi-carrier / empty-source mapping fixture;
  - runtime FIFO proof did not lock total Renderer call count;
  - workstream evidence did not yet name `2e10789` and `94c2d66`.
- Exact correction paths:
  - `src/game/core/sprint.test.ts`
  - `src/game/runtime/GameRuntime.test.ts`
- Correction evidence:
  - one fixed board now proves two full carriers, one partially surviving carrier,
    one fully removed carrier, stable IDs/order, and `-1` for every empty source;
  - runtime now proves zero delivery before flush, exactly one call at the first
    flush, exactly two calls after the empty follow-up flush, and exactly one call
    containing Mutation events;
  - `npm.cmd run test -- src/game/core/sprint.test.ts
    src/game/runtime/GameRuntime.test.ts` — 2 files / 30 tests PASS;
  - `npm.cmd run typecheck` — PASS;
  - `git diff --check` — PASS.
- Resource note: a second rules audit was interrupted and is not counted as evidence
  after machine CPU remained above 95%; sampling identified Mineradio rendering/GPU
  and the active Codex session rather than Chrome or a project browser.
- Blocker: two fresh read-only dispositions against exact head `3ceb6c2` are still
  required. This candidate is not Core acceptance and does not open Renderer paths.
- Next action: when the resource budget allows, run independent rules and
  performance/FIFO audits against exact `3ceb6c2`; only dual acceptance opens the
  renderer/timeline checkpoint.

## 2026-07-28 — Core cross-mode hash/replay hardening

- Task ID: `T15-PHASE5-MUTATION-CORE-QA-HARDENING`.
- Coordinator/writer: `/root`; prior product candidate `3ceb6c2`; new product
  candidate `f2d51ca`.
- Exact changed path: `src/game/core/sprint.test.ts`.
- Evidence review confirmed the candidate already directly covers all 28 body/item
  pairs with a 4,096-seed sweep and the Mutation 6-tick gravity floor. The missing
  direct boundary was non-Mutation hash/replay isolation.
- New parameterized regression:
  - perturbs only `mutationRandomizer` in Classic, Survival, and Puzzle;
  - proves each non-Mutation initial hash and post-command replay hash remains equal;
  - proves active piece, queue, and ordinary seven-bag randomizer remain identical;
  - proves the same field still changes a Mutation hash.
- Commands actually run:
  - `npm.cmd run test -- src/game/core/sprint.test.ts src/game/core/rules.test.ts
    src/game/runtime/GameRuntime.test.ts` — 3 files / 40 tests PASS.
  - `npm.cmd run typecheck` — PASS.
  - `git diff --check` — PASS.
- Blocker: two complete independent read-only dispositions against exact product head
  `f2d51ca` remain required. The interrupted evidence-only rules audit is not counted.
- Next action: run full static rules and performance/FIFO audits without prematurely
  interrupting them; only dual acceptance opens Renderer/timeline source.

## 2026-07-28 — Core exact-head dual acceptance

- Task ID: `T15-PHASE5-MUTATION-CORE-QA-R2`.
- Product candidate: `f2d51ca`; documentation head reviewed: `3204022`.
- Independent rules auditor `t15_core_rules_r3`: `PASS`, P0–P3 none.
  - Fully read every required contract/log and the complete candidate product/test
    range.
  - Accepted isolated attachment RNG, three non-Mutation hash/replay domains,
    pure body+item Next, exact Ice tick semantics/manual controls, per-state
    retriggers/coexistence, 6-tick floor, 28 combinations, cross-mode guards, and
    the fixed multi-carrier/empty-source fixture.
- Independent performance/FIFO auditor `t15_core_perf_fifo_candidate_qa`: `PASS`,
  P0–P3 none.
  - Accepted one fixed 400-cell source scan, shared `Int16Array` mapping, no board
    rescan/string key/temp Set in settlement, independent 96-board reference,
    bounded allocations, full/partial carrier mapping, Runtime source-order FIFO,
    and exactly one Bomb → Ice non-empty Renderer handoff.
- Both audits were strictly read-only under the high-resource boundary and did not
  rerun dynamic gates; writer evidence remains 3 files / 40 tests PASS plus
  typecheck PASS.
- Core status: `ACCEPTED-LOCAL`. This is not Phase-5 acceptance and is not a push
  authorization.
- Blocker: none.
- Next action: open only the frozen Renderer carrier/timeline/actual-column VFX
  paths; keep UI, Classic shared line clear, Puzzle, Settings, audio, dependencies,
  evidence, changelog, and push closed.
