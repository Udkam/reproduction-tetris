Original prompt: 以“异变模式视觉反馈设计”对话中的流程为实现目标，分阶段实现并 push；允许重新实现效果不明显的 Phase 1，完成除 Puzzle 选关界面修改之外的全部流程；在当前基础上把 Puzzle 扩展到 50 个有逻辑、可验证、可学习的关卡，并继续强化异变模式 Freeze 与 Collapse 等画面反馈。

## Current phase

- Phase 1 and Phase 1.5 are accepted and pushed.
- Phase 2 Settings is accepted and pushed through recovery record `092c91d`.
- Phase 3 HUD final source `741d8a6` and acceptance/recovery record `1383fca` are
  accepted and pushed. Ports 4178/5178 and headless Chrome are released.
- Phase 4 candidate `2af2adf`, evidence `993dfc7`, and acceptance/recovery
  `fd7ef8d` are pushed.
- Phase 5 Mutation three-way baseline audits at documentation head `fae3c96` are
  complete and all return `GAP`. Exact Core → renderer → UI paths are frozen.
- Phase-5 Core candidate `f344f49..f2d51ca` is locally green: item RNG is isolated,
  body+item preview stays pure, Ice advances at tick 60, Collapse shares one board /
  carrier mapping, runtime FIFO has direct exactly-once proof, and Classic/Survival/
  Puzzle hashes and replays ignore the private item RNG. Focused Core/runtime tests
  pass 40/40 and typecheck passes.
- The first candidate audit found no P0/P1 product defect but rejected incomplete
  direct multi-carrier/empty-source/exactly-once evidence; `3ceb6c2` corrects it.
- Exact-head rules and performance/FIFO audits now both accept `f2d51ca` with no
  P0–P3. Core is accepted locally and Renderer/VFX is open; Phase 5 is not accepted.
- Renderer rollback points `2484b67`, `e66cbf8`, and `8488dd2` now preserve FIFO /
  impact timing, give all four attachments distinct carrier and reduced-motion
  language, keep 2× / 4× explicit, and bind Collapse activation/settlement to real
  columns without broad top/bottom bars.
- First visual-contract audit statically passed the product but rejected
  palette-sensitive / stubbed tests. Correction `e2858a2` now proves paint-independent
  geometry, three-state grammar reuse, real 2× / 4× glyphs, broad-span absence, and the
  real same-lock event batch. Focused tests pass 25/25 and typecheck passes; corrected
  re-audit plus a separate performance/lifecycle audit remain required before UI opens.

## Non-negotiable boundaries

- Do not redesign the Puzzle selector.
- Preserve one Pixi canvas, deterministic Core rules, bilingual input, reduced motion,
  touch-safe controls, and lifecycle cleanup.
- Keep Mutation as all seven ordinary shapes crossed with all four item attachments.
- Do not mark the overall T15 goal complete before every phase and the 50-level Puzzle
  curriculum have current-state evidence.

## Next verification

- Re-audit exact Renderer candidate `e2858a2` for visual-contract fidelity, then run
  a separate performance/lifecycle audit. Do not open UI paths until both pass.
- Keep Classic shared
  line-clear polish, Puzzle selector/data, Settings, audio, dependencies, and
  packaging outside Phase 5.

## 2026-07-28 Phase 5 Renderer visual candidate

- `e66cbf8` gives Freeze, Collapse, Bomb, and Multiplier different carrier edge /
  symbol treatments, four distinct reduced-motion endpoints, and explicit persistent
  2× / 4× feedback.
- `8488dd2` removes Collapse's board-wide activation and persistent bands, binds
  activation wells to carrier columns, and renders settlement only for columns and
  cells that actually move; maximum fall distance contributes only bounded intensity.
- `npm.cmd run test -- src/game/render/TetrisRenderer.test.ts
  src/animation/mutationTimeline.test.ts --maxWorkers=1` — 2 files / 24 tests PASS.
- `npm.cmd run typecheck` — PASS; `git diff --check` — PASS before both commits.
- Candidate `8488dd2` is not accepted. Final-source browser evidence, UI/localization,
  full gates, repeated QA, recovery recording, cleanup, and push remain open.
- First independent visual audit: product source PASS, overall `GAP`; it found that
  paint options could create false geometry differences, the 2× / 4× persistent test
  stubbed the real glyph, and Collapse did not scan every broad-shape primitive or use
  the real `clear-started` event batch.
- `e2858a2` corrects only `TetrisRenderer.test.ts`; focused renderer/timeline tests now
  pass 25/25 and typecheck passes. Corrected dual audit remains open.

## 2026-07-28 Phase 3 HUD acceptance

- Checkpoints `d8e83d2`, `249e4ce`, `f27bb71`, `c817739`, and `741d8a6` keep
  input/a11y, spawn presentation, unified HUD, semantic correction, and compact
  English correction independently revertible.
- Final production evidence covers Classic, Survival, Mutation, and Puzzle at four
  required viewports plus English Mutation and reduced-motion countdown.
- All cases retain one Canvas, zero DOM cells, visible stats/Next, no overflow and
  zero browser errors. Puzzle shows complete `1` / `2` forecasts; English Mutation
  shows complete `Freeze / Collapse / Double` labels.
- Independent input, code/rules, and visual QA accept the candidate. The overall T15
  goal remains active; Phase 4–8 and the fifty-level Puzzle curriculum are still open.

## 2026-07-28 Phase 2 layout iteration

- Replaced the active Settings DOM namespace with `settings-console`, so historical
  `.settings-sheet` generations can no longer affect the current console.
- Added one T15 authoritative CSS block: 800 px maximum width, four connected bands,
  52 px label rails, 12 px minimum interface text, 44 px controls, content scrolling
  in short viewports, and no equal-height/space-between stretching.
- Direct result: `src/App.test.ts` 31/31 PASS; `npm.cmd run typecheck` PASS.
- Source checkpoint `2f94d16` freezes the isolated compact console after the visual
  loop. A portrait-only content-box defect that clipped Continue was corrected with
  an explicit border-box sheet and zero-minimum action columns.
- The refreshed browser audit covers eleven Chinese/English, empty/full record,
  Puzzle record, desktop, portrait, short-landscape, and reduced-motion scenarios
  with zero errors. Buttons must be fully inside the viewport; short screens must
  scroll to a completely reachable final record band.
- The prescribed game client also captured the live one-Canvas countdown state.
- Final candidate `26e4db3` passed typecheck, 25 files / 190 tests, the 752-module
  build, and the immutable production evidence matrix.
- The first audit round correctly rejected portrait cropping and weak candidate
  binding. The corrected evidence keeps the 390 px dialog fully inside the viewport,
  proves same-Canvas identity and reversible dimming, binds the official client
  state, and independently re-hashes 24/24 manifest files.
- Final rules, visual, and evidence auditors all ACCEPT with no P0–P2. The remaining
  unreachable `.settings-sheet` selectors and an earlier oversized checkpoint are
  recorded as non-blocking P3 maintenance/process debt.

## 2026-07-28 Phase 4 corrected candidate

- Checkpoints preserve canonical warning Core (`514c459`), Pixi stone arrival
  (`4d31994`), four-card pressure HUD (`f89c040`), strict Survival records
  (`5c6a436`), compact live clock (`cc8c71f`), and direct stone-clear scoring proof
  (`2af2adf`) as separate rollback claims.
- The first rules audit rejected missing writer records and two evidence assertions;
  the first UI/evidence audit rejected missing lifecycle, English, raw-gate, and
  independently verified candidate proof. The visual audit accepted the product.
- Corrected evidence `993dfc7` binds full SHA `2af2adf`, fixed-seed warning/spawn
  column `[4]`, three-row opening, real 13-second rise, falling/landing states,
  portrait, reduced motion, English, countdown/settings freeze, pause, same-Canvas
  restart, two unmount/remount cycles, listener/RAF/audio cleanup, and 14/14 hashes.
- Final gates after the last source change: typecheck PASS; 26 files / 203 tests
  PASS; build PASS with 753 transformed modules. Raw stdout is committed with the
  evidence.
- Next: complete writer handoff records, rerun all three independent audits, resolve
  any new finding, then accept, clean the listener/browser resources, and push.

## 2026-07-28 Phase 4 local acceptance

- Repeated rules QA: ACCEPT, P0–P3 none.
- Repeated visual QA: ACCEPT, P0–P2 none; P3 only for the readable split of `上升`
  and the expected Settings modal covering the countdown digit in its static frame.
- Repeated UI/evidence QA: ACCEPT, P0–P2 none; the same label wrap is P3 only.
- Both evidence auditors independently recomputed 14/14 manifest hashes and 9/9
  JSON-to-PNG hashes. No source or evidence drift exists after `2af2adf` / `993dfc7`.
- Next: commit this acceptance record, release PID 11560 / port 4178 and the
  temporary browser tab, verify worktree/resources, then push before opening Phase 5.

## 2026-07-28 Phase 4 recovery published

- `origin/main` advanced non-force from `8cbd623` through acceptance `fd7ef8d`.
- Verified Vite PID 11560 was stopped; ports 4178/5178/5179 are free.
- The temporary in-app browser tab was finalized; no repository/Playwright/headless
  browser process remains.
- Phase 5 Mutation is open from `fd7ef8d`; its first action is read-only error mapping
  for Core/performance, Renderer/VFX, and UI/Next, not immediate source editing.

## 2026-07-28 Phase 5 baseline audit

- Three independent read-only audits of `fae3c96` all return `GAP`; historical T14
  visuals were not treated as current acceptance.
- Core must isolate item RNG, replace stopped Ice with a 60-tick cadence, share one
  Collapse compaction mapping, and strengthen direct FIFO/retrigger/coexistence tests.
- Renderer must remove global Collapse bands, bind response to moved columns, delay
  Bomb fragments until impact, retain explicit 2×/4× fields, and preserve FIFO when
  reduced motion changes.
- UI must use `冰冻`, content-size idle/active status rows, announce body plus
  attachment in Next, and preserve all same-transition live announcements.
- Exact checkpoint paths and sequencing are frozen in `docs/phases/phase 5.md`.

## 2026-07-28 Phase 5 Core RNG/Ice checkpoint

- Source `f344f49` introduces a salted canonical attachment RNG independent from the
  ordinary seven-bag and keeps immediate body-plus-item lookahead pure.
- Ice no longer stops gravity: ticks 1–59 preserve the row, tick 60 moves one cell,
  its final active tick still uses the Ice interval, then the current 6-tick floor or
  slower Mutation cadence resumes. Move, rotate, soft drop, and hard drop remain live.
- Partial retrigger tests prove exact reset to 600 ticks without erasing concurrent
  timed effects.
- Focused Core tests pass 25/25; typecheck passes. The prescribed action client
  entered real Mutation play, screenshots/state were inspected, and port 4178 plus
  its temporary browser processes were released.
