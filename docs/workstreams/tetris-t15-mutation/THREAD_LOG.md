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

## 2026-07-28 — Renderer FIFO/timeline reliability checkpoint

- Task ID: `T15-PHASE5-MUTATION-RENDERER-1`.
- Writer: `/root`; base `0ef3b05`; candidate `2484b67`.
- Exact changed product/test paths:
  - `src/game/render/TetrisRenderer.ts`
  - `src/game/render/TetrisRenderer.test.ts`
- Delivered behavior:
  - Bomb fragments remain absent through warning/pulse and begin only when the
    impact phase starts;
  - a later item burst no longer clears active particles from an earlier activation,
    while the existing 120-slot pool remains the hard allocation bound;
  - changing reduced motion at runtime retains the current activation, FIFO, timed
    fields, previous board, active carrier, and Collapse endpoint instead of silently
    discarding Core feedback;
  - Collapse cannot distort unaffected columns through the world-wide displacement
    filter;
  - Mutation preview caching follows `mutationRandomizer`, not the ordinary seven-bag.
- Commands actually run:
  - `npm.cmd run typecheck` — PASS.
  - Initial focused Vitest attempt hit only the 10-second Pixi import hook timeout
    while sampled CPU was 86.6%; no assertion ran or failed.
  - `npm.cmd run test -- src/game/render/TetrisRenderer.test.ts
    src/animation/mutationTimeline.test.ts --hookTimeout=30000` — 2 files /
    17 tests PASS.
  - `git diff --check` — PASS before commit.
- Resource/lifecycle evidence: work was serialized because CPU exceeded the project
  60% admission threshold; no browser, Vite listener, build, or parallel auditor was
  started for this nonvisual reliability checkpoint.
- Blocker: none. This candidate is not Renderer acceptance.
- Next action: implement and directly test actual-column Collapse cues, stronger
  shape/edge/core carrier grammar, distinct four-family reduced-motion endpoints,
  and explicit persistent 2×/4× feedback without changing the ordinary shared
  line-clear effect owned by Phase 6.

## 2026-07-28 — Renderer carrier-language and actual-column candidate

- Task ID: `T15-PHASE5-MUTATION-RENDERER-2`.
- Writer: `/root`; base `4e3186d`; checkpoints `e66cbf8` and `8488dd2`; exact product
  candidate `8488dd2`.
- Exact changed product/test paths:
  - `src/game/render/TetrisRenderer.ts`
  - `src/game/render/TetrisRenderer.test.ts`
- `e66cbf8` delivers:
  - four item-specific carrier edge/surface grammars instead of one recoloured rim;
  - four distinct reduced-motion activation endpoints;
  - explicit persistent Multiplier 2× / 4× geometry and value feedback.
- `8488dd2` delivers:
  - no full-width top/bottom Collapse status bars or fixed fake column lanes;
  - a compact persistent gravity core, with activation wells bound to sorted unique
    carrier columns;
  - one fixed-array settlement scan that records existing and incoming moved cells,
    actual moved columns, and a bounded maximum-drop intensity;
  - settlement feedback even when the same lock also resolves a line, plus a static
    high-contrast reduced-motion endpoint.
- Commands actually run after the last source change:
  - `npm.cmd run test -- src/game/render/TetrisRenderer.test.ts
    src/animation/mutationTimeline.test.ts --maxWorkers=1` — 2 files / 24 tests PASS.
  - `npm.cmd run typecheck` — PASS.
  - `git diff --check` — PASS before each exact-path commit.
- Resource/lifecycle boundary: work and tests were serialized because sampled CPU
  remained above 60%; no browser, Vite server, build, or audit agent was started in
  parallel. The earlier working-tree browser diagnostic is not claimed as final
  candidate evidence because the final source changed afterward.
- Blocker: two independent read-only dispositions against exact product head
  `8488dd2` are required before opening UI/localization.
- Next action: run one visual-contract audit and one performance/lifecycle audit;
  correct any finding before accepting the Renderer boundary.

## 2026-07-28 — Renderer visual-contract audit correction

- Task ID: `T15-PHASE5-MUTATION-RENDERER-QA-R1`.
- Independent visual auditor: `t15_core_rules_r3`; product head `8488dd2`,
  documentation head `1bed679`.
- Disposition: product source static `PASS`, overall `GAP`; P0/P1 none.
- Actionable evidence findings:
  - paint options were serialized into carrier/reduced endpoint signatures, so
    palette-only regressions could produce false differences;
  - the persistent 2× / 4× test replaced the real vector-value method with a stub;
  - Collapse checked only `roundRect` widths and used `lines-cleared` instead of the
    real same-lock `piece-locked + clear-started` event batch.
- Exact correction path: `src/game/render/TetrisRenderer.test.ts`.
- Correction candidate: `e2858a2`.
- Corrected evidence:
  - geometry signatures exclude fill/stroke paint options;
  - Surface/Core/Rim geometry is distinct for all four families, while locked,
    active, and Next directly share Surface/Core entry points;
  - reduced endpoints and persistent 2× / 4× fields compare actual geometry and
    actual vector multiplier glyphs;
  - Collapse scans broad `rect`, `roundRect`, and segment spans and uses the real
    same-lock event batch.
- Commands actually run:
  - `npm.cmd run test -- src/game/render/TetrisRenderer.test.ts
    src/animation/mutationTimeline.test.ts --maxWorkers=1` — 2 files / 25 tests PASS.
  - `npm.cmd run typecheck` — PASS.
  - `git diff --check` — PASS before exact-path commit.
- Blocker: corrected visual re-audit and one separate performance/lifecycle audit
  remain required; UI paths remain closed.
- Next action: re-audit exact candidate `e2858a2`, then run the second independent
  Renderer audit without dynamic work while the machine remains resource-constrained.

## 2026-07-28 — Renderer visual-contract audit correction R2

- Task ID: `T15-PHASE5-MUTATION-RENDERER-QA-R2`.
- Independent visual auditor: `t15_core_rules_r3`; candidate `e2858a2`,
  documentation head `161ff8b`.
- Disposition: product source static `PASS`, overall `GAP`; P0/P1/P3 none, one P2
  test-evidence finding.
- Finding: Core signature capture still included the Core method's internal Rim call,
  so Rim differences could hide a common Core regression. The route test also stubbed
  Core entirely and therefore did not prove locked/active/Next reached Rim.
- Exact correction path: `src/game/render/TetrisRenderer.test.ts`.
- Correction candidate: `6599764`.
- Corrected evidence:
  - Core signature capture temporarily isolates Rim, then Rim is independently
    captured, so all three layers must each retain four paint-independent geometries;
  - the route proof wraps rather than replaces real Core and separately records Rim,
    requiring Surface/Core/Rim exactly three times per item across
    locked/active/Next.
- Commands actually run:
  - focused Renderer/timeline tests — 2 files / 25 tests PASS;
  - `npm.cmd run typecheck` — PASS;
  - `git diff --check` — PASS before exact-path commit.
- Blocker: final visual re-audit plus the separate performance/lifecycle audit remain;
  UI paths remain closed.
- Next action: re-audit exact candidate `6599764`; only a full PASS allows the second
  independent Renderer audit.

## 2026-07-28 — Renderer visual-contract acceptance

- Task ID: `T15-PHASE5-MUTATION-RENDERER-QA-R3`.
- Independent visual auditor: `t15_core_rules_r3`; exact candidate `6599764`,
  documentation head `fd3380d`.
- Disposition: `PASS`; P0–P3 none.
- Accepted static evidence: Core and Rim are independently sampled, real Core reaches
  Rim from locked/active/Next, all earlier paint-free/reduced/2×-4×/Collapse span and
  real event-batch guards remain intact.
- Dynamic browser items remain explicitly open and are not claimed by this static
  acceptance.
- Blocker: independent performance/lifecycle disposition remains required.
- Next action: run the second Renderer audit before opening UI/localization.

## 2026-07-28 — Renderer performance/lifecycle audit correction

- Task ID: `T15-PHASE5-MUTATION-RENDERER-QA-PERF-R1`.
- Independent auditor: `t15_core_perf_fifo_candidate_qa`; candidate `6599764`.
- Disposition: implementation static `PASS`, overall `GAP`; P0/P1 none, one P2 and
  one P3 evidence finding.
- Findings:
  - the fixed-pool test did not prove a later Freeze burst leaves active Bomb
    particles alive;
  - Collapse trail tests did not prove exact-duration release.
- Accepted static boundaries: 120-slot ring pool, impact-gated Bomb, retained
  reduced-motion FIFO/fields, fixed 40 × 10 trail scan, no hot-path string/Set/sort,
  bounded 10 × 400 actual-column draw comparisons, and unchanged
  filter/ticker/listener/canvas lifecycle.
- Exact correction path: `src/game/render/TetrisRenderer.test.ts`.
- Correction candidate: `69730a1`.
- New assertions require active Bomb particles after Freeze emits and require the
  Collapse trail at 259 ms followed by release at 260 ms.
- Commands actually run:
  - focused Renderer/timeline tests — 2 files / 25 tests PASS;
  - `npm.cmd run typecheck` — PASS;
  - `git diff --check` — PASS before exact-path commit.
- Blocker: corrected performance/lifecycle re-audit remains; UI paths stay closed.
- Next action: re-audit exact candidate `69730a1`.

## 2026-07-28 — Renderer dual static acceptance

- Task ID: `T15-PHASE5-MUTATION-RENDERER-QA-PERF-R2`.
- Independent performance/lifecycle auditor:
  `t15_core_perf_fifo_candidate_qa`; exact candidate `69730a1`, documentation head
  `a36f9a8`.
- Disposition: `PASS`; P0–P3 none.
- Direct corrections accepted:
  - a later Freeze burst must leave active Bomb particles in the fixed pool;
  - Collapse trail must remain at 259 ms and release at 260 ms.
- Prior static PASS boundaries did not change: impact-gated Bomb, retained
  reduced-motion FIFO/fields, fixed 120-slot pool, bounded Collapse scan/draw, and
  unchanged filter/ticker/listener/canvas lifecycle.
- Renderer status: `ACCEPTED-LOCAL-STATIC`. This does not replace the final-source
  browser frame, 60 FPS, console, reduced-motion, compact-layout, or lifecycle checks.
- Blocker: none for opening the frozen UI semantics/localization paths. Phase 5 remains
  open and unpushed.
- Next action: implement `冰冻` copy/rules, active-only status rows, attachment-aware
  Next accessibility, and source-order same-transition announcements.

## 2026-07-29 — UI semantics and localization candidate

- Task ID: `T15-PHASE5-MUTATION-UI-1`.
- Writer: `/root`; base `2356615`; candidate `7968bb1`.
- Exact changed product/test paths:
  - `src/App.tsx`
  - `src/App.test.ts`
  - `src/ui/localization.ts`
- Delivered behavior:
  - Chinese player-facing item and rules now use `冰冻`; Chinese and English both
    state that automatic gravity is fixed at 1 second per cell;
  - an idle Mutation run renders no status surface or placeholder rows, while active
    timed effects render only their identity, remaining time, and progress;
  - immediate Mutation Next exposes the pure predicted body and optional attachment
    through its accessible name without consuming state;
  - every notable event from one Core transition is announced in source order through
    the real `GameSession` `onState` path instead of discarding all but the last;
  - Bomb remains a terse one-shot announcement with no persistent status row.
- Commands actually run:
  - `npm.cmd run test -- src/App.test.ts --maxWorkers=1` — 1 file / 34 tests PASS.
  - `npm.cmd run typecheck` — PASS.
  - `git diff --check` — PASS before exact-path commit.
- Resource boundary: the prescribed browser diagnostic was deferred after two samples
  reported 90.0% and 76.9% CPU. No Vite, Chrome, or screenshot process was started,
  and no dynamic evidence is claimed for this checkpoint.
- Blocker: independent UI semantics/localization disposition remains required.
- Next action: after static PASS, open only `src/styles/mutation-vfx.css`,
  `src/styles/hud.css`, and `src/styles/hud.test.ts` for responsive active-state layout.

## 2026-07-29 — UI semantics audit correction

- Task ID: `T15-PHASE5-MUTATION-UI-QA-R1`.
- Independent auditor: `t15_core_rules_r3`; candidate `7968bb1`, documentation head
  `3c5d74d`.
- Disposition: `GAP`; P0/P1/P3 none, one P2.
- Finding: during entry or line-clear, `nextPreviewPieces()` still exposed the real
  `queue[0]` body but `nextMutationPreviewItem()` returned `null` solely because
  `active` was null. From the third spawn onward, Core would then attach a deterministic
  item to that same body, so the temporary ARIA label contradicted the actual spawn.
- Exact correction paths:
  - `src/game/core/engine.ts`
  - `src/game/core/sprint.test.ts`
  - `src/App.test.ts`
- Correction candidate: `287c426`.
- Corrected evidence:
  - preview eligibility now uses `pieceCount + (active ? 1 : 0)` at the upcoming
    spawn, preserving the two unmarked opening pieces while covering later delays;
  - entry and line-clear fixtures each prove predicted body/item equals actual spawn
    and that prediction leaves `stateHash` unchanged;
  - the GameSession Next ARIA test now binds an `active=null` delayed state carrying
    a deterministic predicted item.
- Commands actually run:
  - `npm.cmd run test -- src/game/core/sprint.test.ts src/App.test.ts
    --maxWorkers=1` — 2 files / 55 tests PASS.
  - `npm.cmd run typecheck` — PASS.
  - `git diff --check` — PASS before exact-path commit.
- Blocker: corrected independent static re-audit remains required.
- Next action: re-audit exact correction `287c426`; only PASS opens responsive CSS.
