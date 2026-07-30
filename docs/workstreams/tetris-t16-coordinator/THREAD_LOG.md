# T16 / Phase 9 Coordinator Thread Log

## 2026-07-31 — contract adoption

- Task: T16 Phase 9 cave pressure, ordinary feedback, and navigation correction.
- Base: `87121af42330ab9aea9456e28dfa42e5edc62536`.
- Git at adoption: `main...origin/main`, clean.
- Resources: CPU `17.16%`, available RAM `17633 MB`, disk queue `0.01`; GREEN.
- Ports checked: 4178, 5178, 5179 free.
- Readers: targeted `rg` and UTF-8 PowerShell only; no Serena, MCP, LSP, watcher,
  browser, server, Node helper, test, or build.
- Design comparison:
  - `survival_cave_brainstorm`: read-only; recommends rigid double rock and layered
    cavern with cell readability.
  - `landing_clear_brainstorm`: read-only; recommends support imprint and per-cell
    seam release without particles or geometry movement.
  - `selector_home_brainstorm`: read-only; recommends compact preview plus
    `10×5`/`5×10` matrix and a two-by-two mode home.
- Accepted direction: the synthesis recorded in `docs/DESIGN.md` and
  `docs/phases/phase 9.md`.
- Changed paths for this checkpoint: `docs/DESIGN.md`, `docs/CURRENT_TASK.md`,
  `docs/phases/README.md`, `docs/phases/phase 9.md`,
  `docs/workstreams/tetris-t16-coordinator/PHASE_MATRIX.md`,
  `docs/workstreams/tetris-t16-coordinator/THREAD_LOG.md`, `progress.md`.
- Commands actually run: read-only Git status/log, targeted `rg`, UTF-8 file reads,
  port/resource sample, and agent coordination. No product gate yet.
- Blocker: none.
- Next action: inspect this docs-only diff, commit the contract with exact staging,
  then open Survival Core paths only.

## 2026-07-31 — Survival Core checkpoint

- Task: one warned column, one rigid two-cell entity, exact `20 ticks/cell`.
- Base: contract recovery `7fc8c514118bee369295d80f325aa50eb419c413`.
- Product commit: `2a1fb3b`.
- Changed paths: `src/game/core/constants.ts`, `src/game/core/types.ts`,
  `src/game/core/engine.ts`, `src/game/core/race.test.ts`.
- Implementation: one RNG column draw; all-or-nothing two-cell entry; pair-derived
  collision; rigid motion/settlement; uniform clear mapping; bedrock-shift overflow;
  two-cell spawn/land events; exact integer 2× cadence.
- Commands actually run:
  - `npm.cmd run test -- src/game/core/race.test.ts --maxWorkers=1`
  - `npm.cmd run typecheck`
  - `git diff --check`
- Evidence: `18/18` focused tests pass; typecheck passes; one initial focused failure
  exposed a missing `BOARD_WIDTH` import and was corrected before the checkpoint.
- Blocker: none. Renderer still presents the new entity as the old single grey cell
  until the next bounded checkpoint; it is not yet a visual candidate.
- Next action: open only Survival theme/presentation/Renderer/direct UI copy and tests.

## 2026-07-31 — Survival cavern checkpoint

- Task: one readable cave family for rising bedrock and the rigid falling pair.
- Base: Survival Core recovery `731f178`.
- Product commit: `5215769`.
- Changed paths: `src/game/render/theme.ts`,
  `src/game/render/theme.test.ts`, `src/game/render/presentation.ts`,
  `src/game/render/presentation.test.ts`,
  `src/game/render/TetrisRenderer.ts`,
  `src/game/render/TetrisRenderer.test.ts`, `src/App.tsx`,
  `src/App.test.ts`, and `src/ui/localization.ts`.
- Implementation: both cells render as one interpolated pair; compacted bedrock
  gains deterministic strata while fresh rocks retain lighter fracture facets;
  the single warned column uses a fissure and pair silhouette; spawn, landing,
  and bedrock movement use short local cues with explicit reduced-motion behavior.
- Commands actually run:
  - `npm.cmd run test -- src/game/render/theme.test.ts src/game/render/presentation.test.ts src/game/render/TetrisRenderer.test.ts src/App.test.ts --maxWorkers=1`
  - `npm.cmd run typecheck`
  - `git diff --check`
- Evidence: `85/85` focused tests pass and typecheck passes. The first focused
  run found insufficient contrast in the dark bedrock face; the material was
  corrected to exceed the frozen `3:1` board contrast before checkpointing.
- Blocker: none. Final source-bound browser frames and independent visual QA wait
  for the combined Phase-9 candidate.
- Next action: reopen only the shared Renderer/direct tests for ordinary landing
  imprint, bounded hard-drop trace, and per-cell seam release.

## 2026-07-31 — ordinary feedback checkpoint

- Task: short, natural support, hard-drop, and ordinary clear feedback.
- Base: cavern recovery `9fda3d9`.
- Product commit: `daa0a13`.
- Changed paths: `src/game/render/TetrisRenderer.ts`,
  `src/game/render/TetrisRenderer.test.ts`,
  `src/game/render/presentation.ts`,
  `src/game/render/presentation.test.ts`, `src/game/render/theme.ts`, and
  `src/game/render/theme.test.ts`.
- Implementation: all modes use true support cells for a six-tick imprint; hard
  drops render no more than four short column traces for three ticks; a clearing
  lock suppresses that trail and lowers the imprint to `55%`; ordinary clear
  renders two short material strokes per cell centre-out for nine ticks.
  Reduced motion keeps fixed support geometry and simultaneous six-tick seams.
- Commands actually run:
  - `npm.cmd run test -- src/game/render/presentation.test.ts src/game/render/theme.test.ts src/game/render/TetrisRenderer.test.ts --maxWorkers=1`
  - `npm.cmd run typecheck`
  - `git diff --check`
- Evidence: `51/51` focused tests pass and typecheck passes. One stale assertion
  for the removed Classic-only landing colour failed, was corrected to the
  remaining Classic cue contract, and the focused matrix was rerun green.
- Blocker: none. Final feel and timing remain subject to source-bound browser
  capture and independent visual QA at the combined candidate.
- Next action: reopen App/styles/style-order/localization/direct tests for the
  no-scroll fifty-level selector and two-by-two mode home.

## 2026-07-31 — direct visual rejection reopens cavern and ordinary clear

- Task: remove horizontal ordinary-clear marks, replace wood-like geology, and
  stage the canonical three-row Survival bedrock during the entry countdown.
- Base: pushed ordinary-feedback recovery `a1146b8`.
- Inherited dirty path: `src/App.tsx` contains the separate, uncommitted selector/
  home slice and must remain unstaged while these corrections are committed.
- Finding: the warm-brown palette plus long horizontal strata reads as wooden
  boards; the per-cell seam reads as an added line rather than a natural clear.
- Corrected contract: cold slate facets/chips and short diagonal fractures only;
  ordinary clear is fill-only inset face bloom with zero horizontal strokes;
  countdown `3 / 2 / 1` reveals and raises exactly `1 / 2 / 3` canonical bedrock
  rows in Renderer presentation without changing Core state.
- Resource state: no subagent, test runner, build, watcher, or project browser is
  started for the contract correction. The next action is one exact-path docs
  checkpoint, followed by the bounded Renderer/Runtime/App correction.

## 2026-07-31 — cold slate and stroke-free clear source correction

- Task: correct the two rejected Renderer surfaces without touching navigation.
- Base: correction-contract recovery `b9e336f`.
- Product commit: `d8e97e7`.
- Changed paths: `src/game/render/theme.ts`, `theme.test.ts`,
  `TetrisRenderer.ts`, and `TetrisRenderer.test.ts`.
- Implementation: replaces warm brown with cold slate; replaces long bedrock
  strata with coordinate-stable polygon facets, short diagonal fractures and a
  pit; replaces ordinary clear strokes with one fixed fill-only inset face per
  real cleared cell.
- Commands actually run:
  - `npm.cmd run test -- src/game/render/theme.test.ts src/game/render/TetrisRenderer.test.ts --maxWorkers=1`
  - `npm.cmd run typecheck`
  - `git diff --check`
- Evidence: `40/40` focused tests and typecheck pass. Direct draw-recording proves
  ten clear faces, zero clear segments, and no broad horizontal geometry.
- Blocker: browser appearance remains unaccepted until the combined source-bound
  capture. Countdown bedrock reveal/rise is not in this checkpoint.
- Next action: implement Renderer/Runtime/App countdown staging while preserving
  the separate uncommitted selector/home hunks in `src/App.tsx`.

## 2026-07-31 — Survival entry bedrock staging checkpoint

- Task: make the three-second Survival entry visually raise one bedrock row per
  second without changing Core.
- Base: slate-feedback recovery `5c28ee6`.
- Product commit: `76ad7bf`.
- Changed paths: `src/game/render/TetrisRenderer.ts`,
  `TetrisRenderer.test.ts`, `src/game/runtime/GameRuntime.ts`,
  `GameRuntime.test.ts`, and countdown-only hunks in `src/App.tsx` plus
  `src/App.test.ts`.
- Implementation: a dedicated masked Pixi layer renders only the newly exposed
  row; App maps countdown `3 / 2 / 1` to visible row count `1 / 2 / 3`; Runtime
  forwards presentation state while Core retains the same board reference.
- Commands actually run:
  - `npm.cmd run test -- src/game/render/TetrisRenderer.test.ts src/game/runtime/GameRuntime.test.ts --maxWorkers=1`
  - `npm.cmd run test -- src/App.test.ts --maxWorkers=1 -t "reveals one, two, and three bedrock rows"`
  - `npm.cmd run typecheck`
  - `git diff --check`
- Evidence: Renderer/Runtime `46/46`, focused React `1/1`, and typecheck pass.
  Direct Renderer proof observes `10 / 20 / 30` visible cells, one-cell initial
  offset, eased halfway offset, board mask, and instantaneous reduced-motion row.
- Boundary: the pre-existing selector/home hunks in `src/App.tsx` remain
  unstaged and uncommitted.
- Next action: source-bound browser frames for digits `3 / 2 / 1`, settled slate
  bedrock, falling stone, and a real ordinary clear; then release the lease.

## 2026-07-31 — same-column variable stone and rule-sheet correction

- Direct correction: the prior fixed two-stone interpretation is superseded. Each
  event still contains a deterministic random one or two stones; all event cells use
  one random column, and a two-stone event remains vertically stacked.
- Rule-sheet correction: Chinese mode/rules titles have no inserted space; the
  first-entry subtitle and repeated inner heading are removed; the primary action is
  `好的 / Got it`.
- Recovery boundary: `2a1fb3b` remains a cadence/column rollback point but is not the
  accepted count contract. `d8e97e7` and `76ad7bf` remain source recovery points;
  the uncommitted selector/home App hunks remain preserved.
- Resources: no subagent, server, browser, watcher, build, or persistent Node helper
  is running for this correction.
- Next action: commit this exact docs contract, then update Core state/tests before
  adapting warning/flight presentation and localized first-entry sheets.

## 2026-07-31 — same-column variable stone Core checkpoint

- Base: correction contract `1f48c35`.
- Product commit: `b99bbed`.
- Changed paths: `src/game/core/types.ts`, `engine.ts`, `race.test.ts`,
  `src/game/render/presentation.ts`, `presentation.test.ts`,
  `TetrisRenderer.test.ts`, and the direct state fixture in `src/App.test.ts`.
- Implementation: warning-time column and `1 | 2` height draws from the isolated
  deterministic stream; one identity and one shared column; height-aware entry,
  collision, motion, settlement, clear mapping, bedrock shifting, overflow, events,
  state hash, and public presentation geometry.
- Commands actually run:
  - `npm.cmd run test -- src/game/core/race.test.ts src/game/render/presentation.test.ts --maxWorkers=1`
  - `npm.cmd run test -- src/game/render/TetrisRenderer.test.ts src/App.test.ts --maxWorkers=1`
  - focused App text-bridge rerun by exact test title
  - `npm.cmd run typecheck`
  - `git diff --check`
- Evidence: Core/presentation `30/30`, Renderer direct tests green, focused App bridge
  `1/1`, and typecheck pass. The broader App file has one known selector-WIP mismatch
  (`5` real target-row tiers versus its old `10` band expectation); no stone test
  failed.
- Blocker: none for Core. Warning art still draws a fixed two-cell silhouette until
  the next Renderer correction.
- Next action: adapt warning/snapshot geometry to the frozen event height, then
  implement the unified first-entry rules sheet.

## 2026-07-31 — cavern material, warning, and mount-race correction

- Base: variable-event record `ac074ce`.
- Product commit: `cb9356d`.
- Changed paths: `src/game/render/TetrisRenderer.ts`,
  `TetrisRenderer.test.ts`, `theme.ts`, `theme.test.ts`,
  `src/game/runtime/GameRuntime.ts`, `GameRuntime.test.ts`, and only the async-mount
  sequencing hunk in `src/App.tsx`.
- Implementation: smaller localized slate facets/cracks replace the rejected
  diamond-plate reading; one- and two-stone plans produce different exact warning
  silhouettes and snapshot height; Runtime preserves pre-mount staged rows; React
  begins its countdown only after the real Pixi mount resolves.
- Commands actually run:
  - `npm.cmd run test -- src/game/render/theme.test.ts src/game/render/TetrisRenderer.test.ts src/game/runtime/GameRuntime.test.ts --maxWorkers=1`
  - focused React countdown test by exact title
  - `npm.cmd run typecheck`
  - `git diff --check`
- Evidence: Renderer/theme/runtime `53/53`, focused React `1/1`, and typecheck pass.
- Boundary: all selector/home hunks remain unstaged in `src/App.tsx`.
- Blocker: final visual acceptance requires one managed real-browser batch.
- Next action: implement and test the unified first-entry rules sheets before opening
  that batch.

## 2026-07-31 — unified first-entry rule-sheet checkpoint

- Base: cavern correction record `9dd9fab`.
- Product commit: `e4d19ad`.
- Changed paths: rule-sheet-only hunks in `src/App.tsx`, direct assertions in
  `src/App.test.ts`, and `src/ui/localization.ts`.
- Implementation: Chinese titles directly join the mode label and `规则`; English
  titles retain natural spacing. The first-entry subtitle and repeated inner heading
  are absent, and the primary acknowledgement is `好的 / Got it`. Survival copy now
  describes a deterministic random one-or-two-stone event in one random column at
  twice normal-piece speed; it no longer implies a fixed double-stone event.
- Commands actually run:
  - focused `src/App.test.ts` run by the two exact rule-sheet/localization titles
  - `npm.cmd run typecheck`
  - `git diff --cached --check`
- Evidence: focused React/localization tests pass `2/2` with `36` unrelated tests
  skipped; typecheck passes. Exact staged-path inspection proves that selector/home
  work was not included in the checkpoint.
- Boundary: the preserved selector/home `src/App.tsx` hunks remain unstaged and
  uncommitted. No server, browser, subagent, watcher, or persistent Node helper was
  started.
- Blocker: real-frame browser acceptance is still required for the rule sheet and
  Survival countdown/cavern material.
- Next action: run one managed source-bound browser batch, release it, then resume the
  separate no-scroll selector/home checkpoint.

## 2026-07-31 — first real-browser batch rejects countdown compositing

- Candidate: rules record `c6d908f` over product `e4d19ad`.
- Managed resource: one Vite listener on `127.0.0.1:5178` and one in-app browser tab;
  the tab was finalized, listener PID `33348` was stopped, and the port listener was
  confirmed released before diagnosis continued.
- Accepted observation: `Survival Rules` has no first-entry subtitle or repeated inner
  heading, uses `Got it`, and states `1–2` clearable stones in one random column at
  `2×` normal speed. The live Chinese Settings rule uses the corresponding exact
  random-one-or-two same-column wording.
- Rejected observation: all three real countdown frames show the centered `3 / 2 / 1`
  but no staged bedrock. Source inspection identifies the late authoritative
  `.entry-countdown` background as fully opaque above the Pixi canvas, hiding the
  renderer-owned rows even though direct renderer/runtime state tests are green.
- Browser diagnostics: zero warning/error console entries; one canvas; no server or
  page crash.
- Blocker: Survival cavern remains browser-rejected until the veil is translucent and
  real frames visibly prove one / two / three rows.
- Next action: add one direct CSS contract and a narrow late-rule correction, rerun
  focused tests/typecheck, then repeat a single managed browser batch.

## 2026-07-31 — countdown compositing repair passes real frames

- Base: rejection record `770d078`.
- Product commit: `e041a1c`.
- Changed paths: `src/styles.css` and one direct source-style assertion in
  `src/App.test.ts`.
- Implementation: the authoritative board-local countdown veil keeps its centered
  digit, radial emphasis, inset edge, and input ownership, but its solid colour layer
  is now translucent so Pixi's staged bedrock remains visible underneath.
- Commands actually run:
  - focused `src/App.test.ts` CSS contract by exact test title
  - `npm.cmd run typecheck`
  - `git diff --cached --check`
- Real-browser evidence: the repeat managed batch shows one, two, and three bottom
  bedrock rows under digits `3`, `2`, and `1` respectively. The accepted page has one
  Canvas, zero DOM cells, no horizontal or vertical overflow, and zero warning/error
  console entries.
- Resource release: the single browser tab was finalized and its session reset;
  listener PID `11816` was stopped and port `5178` has no remaining listener.
- Boundary: Core, Renderer geometry, Runtime timing, other sheets, and the preserved
  selector/home App hunks are unchanged.
- Blocker: none for rule sheets or countdown compositing. Final independent Phase-9
  QA remains deferred until the navigation checkpoint is source-frozen.
- Next action: push this recovery chain, then resume the separate no-scroll Puzzle
  selector and mode-home checkpoint.

## 2026-07-31 — final navigation candidate rejected by independent QA

- Reviewed source candidate: `9c515f6`; evidence checkpoint `a67fb00` is now
  superseded pending correction.
- Finding: P1. `src/styles/navigation.css` owns the intended two-by-two matrix but
  does not reset legacy responsive `grid-column`, `grid-row`, and `justify-self`
  placement from `src/styles.css`.
- Reproduction boundary: at 360×800 the four cards retain single-column rows 1–4;
  at 844×390 they can retain columns 1–4 and the legacy action span, producing
  implicit tracks instead of the contracted two-by-two matrix.
- Second P1: at 844×390 the short-landscape route leaves 232 px for a matrix that
  needs 234 px (`5×44` rows + `4×3` gaps + a 2 px top inset). Because the bands own
  `overflow:hidden`, the fifth row is clipped.
- First correction browser measurement: removing the 2 px inset is insufficient
  because legacy `.console-route .console-node > button` has higher specificity than
  the new `.console-node button` rule and retains `min-height: 48px`. The real
  844×390 matrix reports `scrollHeight 237` and `clientHeight 233`, with a 48 px
  final button extending below its 44.16 px band.
- Correction boundary: only `src/styles/navigation.css` and its direct cross-layer
  and budget regression test may change. Product rules, Puzzle content/progress,
  Survival, renderer, Core, records, localization, dependencies, and other visual
  systems remain frozen.
- Next action: commit this rejection record, add authoritative placement resets,
  rerun final gates, replace affected browser evidence, and return the corrected
  candidate to independent QA.

## 2026-07-31 — latest four-surface direct review

- Base: corrected navigation recovery `693f3d4`.
- Inherited paths: regenerated Phase-9 PNGs under
  `docs/qa/evidence/t16-phase9/`; they remain unstaged and are superseded until a new
  final source candidate exists.
- Direct requirements:
  - hide ready active/ghost/Next content while Survival raises one bedrock row per
    countdown second;
  - replace non-Puzzle generic result sheets with meaningful mode-colored ledgers;
  - replace the fifty-cell one-page Puzzle dashboard with a two-page `25 + 25`
    gallery centered on preview/name/best/Start;
  - clear pointer emphasis when the pointer leaves the home mode region.
- Read-only comparisons:
  - countdown audit traced the leak to Renderer’s explicit ready-state ghost branch
    and requires the public snapshot to match the empty rendered state;
  - result audit selected a mineral-white ledger with mode accents, two real metrics,
    current-run rank, and top-five history;
  - selector/home comparison selected a two-page `5×5` gallery and pure hover plus
    independent keyboard focus.
- Exact design boundaries are frozen in `docs/DESIGN.md`,
  `docs/CURRENT_TASK.md`, and `docs/phases/phase 9.md`.
- Commands actually run: read-only Git status/log, targeted UTF-8 source/docs reads,
  and bounded agent coordination. No product test, build, browser restart, new
  listener, or product edit was run before this contract.
- Resource boundary: one existing Vite lease remains solely for later final evidence;
  no new server, watcher, persistent reader, Serena, WMI/CIM, or extra agent was
  started.
- Next action: commit this docs-only contract with exact staging, then open only the
  Renderer ready-visibility slice.

## 2026-07-31 — ready-state preview checkpoint

- Task: hide all pre-play tetromino information while retaining staged Survival
  bedrock.
- Base: four-surface contract `27777c7`.
- Product commit: `6a47926`.
- Changed paths: `src/game/render/TetrisRenderer.ts` and its direct test only.
- Implementation: derives one `drawableActive` from authoritative `state.status`;
  `ready` draws neither active nor ghost/carrier material and its public snapshot
  reports empty active/ghost arrays. Core active/queue and Runtime start timing are
  unchanged. The first `playing` state restores four active and four ghost cells.
- Commands actually run:
  - `npm.cmd run test -- src/game/render/TetrisRenderer.test.ts --maxWorkers=1`
  - `npm.cmd run typecheck`
  - exact-path diff/cached checks and commit.
- Evidence: focused Renderer suite passes `35/35`; typecheck passes; the direct
  regression keeps exactly ten staged locked cells during the first Survival digit
  and proves zero active-piece draw calls before start.
- Blocker: final real-frame `3 / 2 / 1` and first-playing-frame proof remains pending
  until all source slices are complete.
- Next action: open only the structured result-ledger slice.
