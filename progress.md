Original prompt: 以“异变模式视觉反馈设计”对话中的流程为实现目标，分阶段实现并 push；允许重新实现效果不明显的 Phase 1，完成除 Puzzle 选关界面修改之外的全部流程；在当前基础上把 Puzzle 扩展到 50 个有逻辑、可验证、可学习的关卡，并继续强化异变模式 Freeze 与 Collapse 等画面反馈。

## Current phase

- Phase 1 and Phase 1.5 are accepted and pushed.
- Phase 2 Settings is accepted and pushed through recovery record `092c91d`.
- Phase 3 HUD final source `741d8a6` and acceptance/recovery record `1383fca` are
  accepted and pushed. Ports 4178/5178 and headless Chrome are released.
- Current coordinator task: open Phase 4 Survival from pushed rollback `1383fca`;
  product-source work has not started.

## Non-negotiable boundaries

- Do not redesign the Puzzle selector.
- Preserve one Pixi canvas, deterministic Core rules, bilingual input, reduced motion,
  touch-safe controls, and lifecycle cleanup.
- Keep Mutation as all seven ordinary shapes crossed with all four item attachments.
- Do not mark the overall T15 goal complete before every phase and the 50-level Puzzle
  curriculum have current-state evidence.

## Next verification

- Audit the existing Survival Core, renderer, UI, persistence, and direct tests against
  `docs/phases/phase 4.md`.
- Freeze exact Core → renderer → UI writer paths before the first source checkpoint.
- Keep Mutation, Classic, Puzzle selector/data, Settings, audio, dependencies, and
  packaging outside the Phase-4 write scope.

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
