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

## 2026-07-29 — UI semantics direct-proof correction and acceptance

- Task ID: `T15-PHASE5-MUTATION-UI-QA-R2`.
- Writer/coordinator: `/root`; product correction `287c426`; proof correction
  `65ffd19`; documentation head before this record `459a15e`.
- The first corrected re-audit accepted the upcoming-spawn formula and App integration,
  but returned one P3 direct-evidence gap: both Core entry/line-clear fixtures happened
  to draw `null`, so the historical `active === null` guard could still pass that test.
- Exact correction path: `src/game/core/sprint.test.ts`.
- Correction:
  - both delayed fixtures receive `createRandomizer(1)`, whose next chance draw
    deterministically creates a carrier;
  - each fixture asserts the prediction item is non-null before ticking through the
    real delay and comparing body/item with the spawned active carrier;
  - each fixture retains the independent pre-prediction `stateHash` assertion.
- Writer evidence:
  - `npm.cmd run test -- src/game/core/sprint.test.ts src/App.test.ts
    src/styles/hud.test.ts --maxWorkers=1` — 3 files / 61 tests PASS;
  - exact-path `git diff --check` — PASS before commit.
- Final independent auditor `t15_core_rules_r3`: `PASS`, P0–P3 none. It confirmed the
  old guard now fails immediately in both delayed states and that real spawn equality
  plus hash purity remain directly covered.
- UI semantics status: `ACCEPTED-LOCAL-STATIC`; responsive CSS may open. This is not
  Phase-5 acceptance and does not replace browser evidence.
- Next action: implement only the frozen responsive status paths.

## 2026-07-29 — Responsive Mutation status candidate

- Task ID: `T15-PHASE5-MUTATION-UI-RESPONSIVE`.
- Writer: `/root`; base `65ffd19`; candidate `d819d92`.
- Exact changed paths:
  - `src/styles/mutation-vfx.css`;
  - `src/styles/hud.css`;
  - `src/styles/hud.test.ts`.
- Delivered layout:
  - idle Mutation uses the same compact two-column stats/Next topology as other modes;
  - only a rendered timed status activates the three-column layout;
  - one, two, or three active timers create only real grid tracks;
  - the short-height horizontal ledger uses `auto-fit`;
  - obsolete high-specificity Mutation mobile rules no longer hide stats/Next or
    override the HUD authority layer.
- Commands actually run after the final CSS change:
  - `npm.cmd run test -- src/styles/hud.test.ts src/App.test.ts --maxWorkers=1` —
    2 files / 40 tests PASS;
  - `npm.cmd run typecheck` — PASS;
  - exact-path `git diff --check` — PASS before commit.
- Resource boundary: sampled CPU was 89.3% with 15 GB RAM available and 55.4% committed
  memory. No Vite, Chrome, build, or screenshot task was started; no browser evidence
  is claimed.
- Blocker: independent static responsive-layout disposition plus final-source browser
  evidence remain required.
- Next action: audit exact candidate `d819d92`, then perform the browser matrix only
  when the resource budget permits.

## 2026-07-29 — Responsive Mutation status static acceptance

- Task ID: `T15-PHASE5-MUTATION-UI-RESPONSIVE-QA`.
- Independent auditor: `t15_core_rules_r3`; exact product candidate `d819d92`,
  documentation head `b2b8878`.
- Disposition: `PASS`; P0–P3 none.
- Accepted evidence:
  - idle compact Mutation retains the ordinary two-column stats/Next layout because
    no inactive status DOM exists;
  - only `:has(.mutation-status)` opens the active three-column layout;
  - the old higher-specificity one-column/124 px/hide-stats override is absent;
  - compact one/two/three-state rows and short-height columns allocate from actual
    children rather than a fixed three-track template;
  - 12 px text floors, reduced-motion animation suppression, and Puzzle/other-mode
    isolation remain intact.
- Audit was read-only and did not claim browser, performance, lifecycle, test, or build
  evidence.
- Responsive status status: `ACCEPTED-LOCAL-STATIC`.
- Next action: wait for the machine resource budget, then run the final-source
  production browser matrix, dynamic frame/performance/lifecycle checks, full gates,
  repeated final QA, acceptance record, cleanup, and push.

## 2026-07-29 — Phase 5 final-source gate checkpoint

- Task ID: `T15-PHASE5-MUTATION-FINAL-GATES`.
- Coordinator: `/root`; exact product head `d819d92`; documentation head before this
  record `1c74565`.
- Commands actually run after the final product source change:
  - `npm.cmd run typecheck` — PASS;
  - `npm.cmd run test -- --maxWorkers=1` — 26 files / 223 tests PASS;
  - `npm.cmd run build` — PASS, 753 transformed modules.
- The suite was deliberately serialized at one worker. No product source changed after
  these gates.
- Resource boundary:
  - CPU samples remained above 80%, while approximately 14 GB RAM remained available;
  - an active headless Playwright tree belonged to `E:\Proj\personal-web`, not this
    repository, and was preserved;
  - TetraMorph ports 4178/5178/5179 remained free;
  - no TetraMorph Vite or browser process was started.
- Blocker: final-source browser matrix, dynamic Mutation states, FPS, lifecycle, and
  evidence-integrity checks still require an available browser/GPU slot.
- Next action: when that slot is free, run the prescribed game action client and the
  bounded production evidence capture without overlapping another GPU-heavy workload.

## 2026-07-29 — Final-evidence preflight GAP and observability repair boundary

- Task ID: `T15-PHASE5-MUTATION-EVIDENCE-PREFLIGHT`.
- Coordinator: `/root`; product candidate entering preflight `d819d92`;
  documentation head before this record `ae0e9bb`.
- The first uncommitted capture harness was rejected before evidence acceptance:
  - it trusted any service already listening on 4178 instead of owning the server bound
    to the clean candidate tree;
  - it named activation frames from Core's latest item without observing the renderer's
    current FIFO flash;
  - its Bomb wait could end before the actual impact/shockwave/fragment phase;
  - its performance assertion covered only renderer submission, not real rAF cadence;
  - its lifecycle proof exercised only one mount/unmount and lacked a home baseline.
- Local harness corrections already prepared but not yet accepted add grayscale Next,
  rAF mean/p95 bounds, a home lifecycle baseline, the correct `exit-game` selector, and
  the exact `d819d92` SHA. These remain uncommitted evidence work, not proof.
- Reopened writer paths are bounded to:
  - `src/game/render/TetrisRenderer.ts`;
  - `src/game/render/TetrisRenderer.test.ts`;
  - `docs/qa/evidence/t15-phase5/capture_phase5.py`.
- Required repair: add read-only renderer flash/queue/particle/Collapse-trail telemetry,
  make the harness own/stop a strict-port Vite process, capture Bomb from the observed
  impact interval, and repeat mount/unmount twice against the initial baseline.
- Resource boundary: a GPU-heavy Playwright session belonging to
  `E:\Proj\personal-web` is active and preserved. No TetraMorph browser is launched
  until that slot is free; source-bound static work remains serialized.
- Next action: checkpoint this contract, implement/test only the read-only snapshot,
  then correct the harness and hand the exact evidence candidate to independent audit.

## 2026-07-29 — Source-bound evidence harness candidate

- Task ID: `T15-PHASE5-MUTATION-EVIDENCE-HARNESS`.
- Base SHA: contract `19264f8`; product candidate
  `f6fa06ea1b123f54bffff1885741e3ffbd551569`.
- Product checkpoint `f6fa06e` changes only `TetrisRenderer.ts` and its direct test:
  the DEV snapshot exposes immutable current activation phases, queued items, active
  particle count, and Collapse trail; focused renderer tests pass 24/24 and typecheck
  passes.
- Current uncommitted evidence paths are
  `docs/qa/evidence/t15-phase5/capture_phase5.py` and root `.gitattributes`.
  The latter applies LF/binary attributes only to this evidence directory.
- Static harness proof completed:
  - Python compile passes and candidate binding reports a clean product tree exactly
    equal to `f6fa06e`;
  - a deliberately occupied 4178 rejects the run, removes its fresh partial directory,
    leaves the pre-existing PID 23856 untouched, and launches no browser;
  - fresh artifact names equal the manifest list, prior or foreign partials fail
    closed, and `SHA256SUMS.txt` publishes last as the completion marker;
  - manifest/checksum text uses explicit LF, preventing `core.autocrlf=true` hash drift.
- Browser evidence has not run. Two independent static auditors are rechecking the
  corrected harness; no dynamic visual, FPS, lifecycle, evidence, or Phase-5 acceptance
  claim is made.
- Next action: resolve any remaining static finding, checkpoint the harness, release
  the exact stale TetraMorph Vite process, then run the managed candidate-bound capture.

## 2026-07-29 — Evidence harness static acceptance

- Task ID: `T15-PHASE5-MUTATION-EVIDENCE-HARNESS-QA`.
- Ordered checkpoints:
  - contract/status `f3b68d6`;
  - managed source-bound harness `8c321ca`;
  - page-side Renderer FIFO witness correction `f8b31ed`.
- Exact harness correction path:
  `docs/qa/evidence/t15-phase5/capture_phase5.py`.
- The first performance/FIFO review found that a non-empty Renderer queue was not
  mandatory. The first correction added a witness but external-loop sampling could
  confuse consecutive same-item requests; a second review also found stale
  post-drain activation and screenshot-time races.
- Final correction stops autoplay after a fixed witness, observes every Renderer frame,
  derives instance identity from exact queue length, requires the live queue to equal
  the witness suffix, and rejects append/reorder/drop/skip. The PNG is accepted only
  when pre- and post-screenshot Renderer state plus observer index still identify the
  initial current/queue. Drain completion then refreshes the snapshot before ordinary
  activation capture resumes.
- Commands actually run:
  - Python source compile — PASS;
  - candidate binding to product `f6fa06e` with clean runtime paths — PASS;
  - extracted observer JavaScript syntax check — PASS;
  - pure observer simulation for `collapse → collapse → freeze`, skipped instance,
    and appended request — PASS / expected fail-closed cases;
  - `git diff --check` — PASS.
- Two independent final static reviews return `PASS`, P0=0, P1=0, P2=0, P3=0.
  Neither auditor ran the browser, tests, build, or benchmark.
- The exact stale TetraMorph Vite PID 23856 and parent command PID 5664 were stopped;
  port 4178 and Chrome are free. Current machine CPU remained above 90%; the user's
  default Edge profile was also active and was preserved.
- Blocker: a trustworthy 60 Hz browser smoke cannot start while system CPU remains
  above the documented resource threshold. No product or evidence acceptance is
  claimed.
- Next action: when the CPU budget permits, run final gates serially and execute the
  managed harness, then inspect every generated frame and submit exact artifacts to
  fresh visual/evidence QA.

## 2026-07-29 — Rollback density and Phase-5 pause boundary

- Player instruction: increase rollback density; after Phase 5 is accepted and pushed,
  pause before Phase 6.
- Current evidence: `git rev-list --count fd7ef8d..HEAD` reports 38 Phase-5 commits;
  `origin/main..HEAD` reports 37 local commits not yet visible remotely.
- No existing checkpoint will be squashed, amended, rebased away, or force-pushed.
- Remaining commits are split into final gate logs/manifest, raw browser output,
  browser manifest/checksum, each independent QA verdict, each correction/re-evidence,
  and coordinator acceptance/cleanup.
- Phase 6 and Puzzle 50 remain unstarted after the Phase-5 push until explicit resume.

## 2026-07-29 — Temporary Phase-5 evidence pause

- Task ID: `T15-PHASE5-TEMPORARY-PAUSE`.
- Player instruction: pause now and record the exact point. This supersedes continued
  waiting in the current turn but does not accept Phase 5.
- Exact rollback state:
  - Phase-4 pushed recovery base: `fd7ef8d`;
  - Phase-5 product source: `f6fa06ea1b123f54bffff1885741e3ffbd551569`;
  - source-bound final gates: `96a3841`;
  - current committed evidence harness: `3d01e9feeffa222e02c9492f3298439aa0d792be`;
  - this pause record yields 43 linear commits after `fd7ef8d`, 42 local commits
    ahead of `origin/main`.
- Final gates actually run after the last product source change:
  - `npm.cmd run typecheck` — PASS;
  - `npm.cmd run test -- --maxWorkers=1` — 26 files / 224 tests PASS;
  - `npm.cmd run build` — PASS, 753 transformed modules.
  Raw UTF-8/LF logs, a source-bound manifest, and gate checksums are committed at
  `96a3841`.
- Dynamic evidence attempts:
  1. the pre-correction run failed closed because carrier screenshots advanced the
     Renderer before the old FIFO witness was installed;
  2. the corrected run at `3d01e9f` immediately bound the FIFO but failed the exact
     post-screenshot current-item gate while system CPU remained about 80%–90%.
  Neither run published PNGs, browser JSON, or `SHA256SUMS.txt`.
- Independent static re-audit of `3d01e9f`:
  - performance/FIFO auditor — PASS, P0=P1=P2=P3=0;
  - rules/evidence auditor — PASS, P0=P1=P2=P3=0.
  Both confirm immediate/one-frame FIFO probing covers the 300 ms Collapse case,
  fixed expected/suffix checking remains fail-closed, and post-drain snapshots are
  refreshed.
- Cleanup at pause:
  - worktree clean before this record;
  - Chrome count 0;
  - ports 4178, 5178 and 5179 have no listener;
  - no `docs/qa/evidence/t15-phase5/.partial-*` directory remains.
- Disposition: **PAUSED / OPEN / UNPUSHED**. No browser visual, rAF, lifecycle, final
  visual/evidence QA, coordinator acceptance, changelog, or push claim is made.
- Resume action: wait for a trustworthy resource window, rerun the unchanged managed
  harness, inspect every frame, commit raw browser output and the manifest/checksum
  separately, complete rules/visual/evidence QA, then accept, clean and non-force push.
  Phase 6 and Puzzle 50 must remain unopened until then.

## 2026-07-29 — Resume and dynamic FIFO-evidence correction boundary

- Task ID: `T15-PHASE5-MUTATION-EVIDENCE-DYNAMIC-R1`.
- Player explicitly resumed Phase 5. Product source remains `f6fa06e`; no product,
  renderer-geometry, UI, CSS, localization, Phase-6, or Puzzle-50 path reopened.
- Resource preflight sampled CPU `38/51/51/48/54%`, 14.67 GiB available RAM, 75.3%
  committed memory and disk queue 0. Browser admission was deferred because committed
  memory was marginally above the 75% limit.
- During a read-only CLI inspection, `capture_phase5.py --help` unexpectedly ran the
  entire script because no argument parser existed. The run failed closed at the same
  post-screenshot current-item assertion. It published no browser PNG, JSON manifest,
  or `SHA256SUMS.txt`; post-run verification found zero project process, known-port
  listener, Chrome process, or `.partial-*` directory.
- Dynamic conclusion: a full-viewport PNG does not belong in the 300 ms FIFO
  correctness gate. The already accepted rAF observer remains the authoritative FIFO
  proof through fixed expected items, exact queue suffix, derived instance index and
  complete observed sequence. Four item-specific activation PNGs remain the visual
  proof.
- Opened writer path: only
  `docs/qa/evidence/t15-phase5/capture_phase5.py`. First add argument parsing that
  exits before resource creation; then remove only the ambiguous FIFO PNG while
  retaining the observer trace and all other coverage.
- Next action: commit this contract checkpoint with exact paths, implement the two
  harness corrections as separate rollback commits, obtain fresh static audits, then
  rerun the managed capture only inside the resource budget.

## 2026-07-29 — Dynamic correction static audit findings

- Task ID: `T15-PHASE5-MUTATION-EVIDENCE-DYNAMIC-QA-R1`.
- Ordered checkpoints:
  - contract `da1eaa7`;
  - resource-safe argparse entry `74a67fe`;
  - FIFO/PNG decoupling `bfc3198`.
- Three auditors remained strictly read-only and ran no browser, product tests, or
  build. Product source tree remains exactly `f6fa06e`.
- FIFO/performance auditor: `GAP`, P2×1. It supplied a same-kind counterexample where
  queue shrink advances the derived index although the old `collapse` activation
  continues and the queued `collapse` was dropped. Adjacent equal labels therefore
  require a strict elapsed-time reset; unchanged instances require monotonic elapsed
  time and stable duration.
- Target/visual auditor: product/scope PASS, evidence `GAP`, P2×2 and P3×1. Mandatory
  missing proofs are one non-empty actual-column Collapse settlement PNG and four
  item-specific reduced-motion activation PNGs. It also noted the now-corrected stale
  paused status.
- Evidence-integrity auditor: harness `PASS`, P0–P2 none, P3 stale commit counts. Its
  file-set/publication/lifecycle checks remain useful, but its permissive same-kind
  simulation and 29-PNG expectation do not override the two reproducible stricter
  findings.
- Coordinator disposition: do not average conflicting verdicts. Accept all stricter
  user-relevant P2 findings and reopen only
  `docs/qa/evidence/t15-phase5/capture_phase5.py`.
- Next action: commit this finding/status checkpoint, add same-label FIFO identity
  proof and visual coverage as separate harness commits, then obtain fresh audits.

## 2026-07-29 — Dynamic evidence writer checkpoint before browser

- Task ID: `T15-PHASE5-MUTATION-EVIDENCE-DYNAMIC-R2`.
- Base SHA: `588488b`.
- Ordered harness checkpoints:
  - `40b5c03` — distinguish consecutive equal FIFO instances by stable duration,
    monotonic elapsed time and a required elapsed reset;
  - `19679fb` — require one actual-column Collapse settlement frame and four
    item-specific reduced-motion activation frames;
  - `db0141d` — bind every transient board crop to pre/post live Renderer state,
    actual board bounds, file hash and a non-reset activation/trail timeline.
- Exact changed path for all three harness checkpoints:
  `docs/qa/evidence/t15-phase5/capture_phase5.py`.
- Commands actually run:
  - Python AST parse and `--help` early-exit check — PASS;
  - extracted same-label FIFO simulations, including the prior dropped-equal-item
    counterexample — expected PASS/fail-closed results;
  - direct activation/trail capture-window guard simulations — expected
    PASS/fail-closed results;
  - `git diff --check` and exact-path cached-path review before each commit — PASS.
- Product source remains exactly `f6fa06e`; no `src`, package, Phase-6 or Puzzle-50
  path changed. Existing source-bound gates remain `96a3841`.
- Resource admission sample before the browser batch: CPU
  `43/20/16/45/37%` (average 32.2%, maximum 45%), 11.31 GiB available RAM,
  72% committed memory, disk queue 0, no known-port listener and no Chrome process.
- Static re-audit of `db0141d` is still running. No browser PNG, performance,
  lifecycle or Phase-5 acceptance claim is made by this checkpoint.
- Next action: accept only a clean final static verdict, execute the one managed
  browser batch, inspect every generated frame, then commit raw output and its
  manifest/checksum separately.

## 2026-07-29 — First resumed browser batch failed closed

- Task ID: `T15-PHASE5-MUTATION-EVIDENCE-DYNAMIC-R3`.
- Candidate at run start: `32ec87c`; evidence harness: `db0141d`; product source:
  `f6fa06e`.
- Three independent static reviewers accepted the FIFO and transient pre/post binding
  with P0=P1=P2=P3=0 after the writer checkpoint removed the earlier record debt.
- The managed browser run reached real Collapse settlement capture, then rejected the
  PNG because the 260 ms trail had expired before the post-screenshot snapshot.
  No PNG, browser manifest, checksum or Vite log was published.
- Cleanup proof after failure: zero `.partial-*` directory, zero generated browser
  artifact, zero listener on 4178/5178/5179 and zero Chrome process.
- Root cause: the loop collected longer-lived carrier/Next/locked screenshots before
  attempting the short Collapse endpoint. The strict continuity assertion was
  correct and remains unchanged.
- Correction checkpoint `d5b6af8` moves Collapse and ordinary activation captures
  ahead of carrier/status screenshots and accepts a Collapse attempt only in the
  first quarter of its 260 ms lifetime. It does not extend product VFX duration,
  bypass the post-screenshot snapshot or alter product source.
- Static commands after correction: Python AST parse, `--help`, `git diff --check`
  and exact-path staged review — PASS.
- Next action: re-enter only after a fresh resource sample, rerun the managed batch,
  and preserve fail-closed publication behavior.

## 2026-07-29 — Second resumed batch and atomic-capture contract

- Task ID: `T15-PHASE5-MUTATION-EVIDENCE-DYNAMIC-R4`.
- Candidate at run start: `3ea9884`; ordering correction: `d5b6af8`.
- Two independent static reviews accepted `d5b6af8` with P0=P1=P2=P3=0. Resource
  preflight reported CPU maximum 37%, 14.53 GiB available RAM, 60.1% committed memory,
  disk queue 0, no known-port listener and no Chrome.
- The corrected run again failed only because the post-capture Collapse trail was
  null. Starting in the first 25% of a 260 ms trail was still insufficient for a
  SwiftShader DevTools screenshot. It published zero artifact and released every
  owned partial, listener and Chrome process.
- Conclusion: another timing-window retry would be unjustified. The product duration
  and strict same-instance proof remain frozen. Only transient board PNG generation
  changes to a synchronous in-page Canvas copy/PNG encode with atomic pre/post
  Renderer state and pixel nonblank checks.
- Next action: implement and statically validate the atomic evidence helper, run a
  bounded diagnostic that proves its PNG is nonblank, then rerun the full managed
  batch once.

## 2026-07-29 — WebGL copy diagnostic rejected

- Task ID: `T15-PHASE5-MUTATION-EVIDENCE-EXTRACT-R1`.
- Harness-only candidate `9f424b4` passed JavaScript/Python syntax, pure continuity
  simulations and three read-only static audits, but the prescribed live diagnostic
  failed its nonblank pixel gate: `drawImage` from the presented Pixi WebGL Canvas
  produced zero nontransparent samples.
- The dynamic result overrides the static assumption. No diagnostic file was
  published; temporary Vite, Chrome and log resources were released.
- Exact reopened source paths are Renderer export + direct test and Runtime DEV QA
  bridge + direct test. The export uses Pixi `ExtractSystem`, returns no retained
  Canvas, and remains state-preserving. Harness consumption follows in its own commit.
- Because source reopens after `96a3841`, final typecheck, full tests and build must be
  rerun and re-bound before browser evidence.
- Next action: implement Renderer extract/test first; do not edit runtime or harness
  until that checkpoint is green and committed.
