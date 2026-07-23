# T13 Coordinator Workstream Log

## 2026-07-23 — TETRIS-T13-CONTRACT-001 active scope

- Base: `550d77e` on `main`; no product source is changed in this checkpoint.
- Exact paths: `docs/DESIGN.md`, `docs/CURRENT_TASK.md`, `docs/progress.md`, and this
  log. The contract records the user's five requirements as distinct reversible
  checkpoints: repository cleanup/push, direct P/R/Enter behavior, five-through-eight
  row legal multi-route endgames with impactful anchors, all-open workshop selection,
  and a fourth 40-line Sprint mode.
- Baseline evidence: `git status --short --branch` reports `main...origin/main` clean
  at `550d77e`. The versioned root follows `docs/PROJECT_STRUCTURE.md`; ignored local
  artifacts are confined to project-sanctioned paths but include stale prior captures
  and duplicate pre-T13 walkthroughs that require archival/regeneration before final
  local cleanup.
- Commands run: read `AGENTS.md`, `docs/DESIGN.md`, `docs/CURRENT_TASK.md`, latest
  changelog entry, `docs/progress.md`, commit policy, project structure map, ignore
  rules, current Core/input/runtime/UI code, and prior in-repository legal-endgame
  authoring history. No test/build/browser run is claimed for this docs-only scope.
- Blocker: none. Next: implement and test the bounded input confirmation checkpoint;
  commit it before beginning Core endgame authoring.

## 2026-07-23 — TETRIS-T13-INPUT-002 source checkpoint

- Base: `220f8df`; candidate: `447ec1e`
  (`fix(input): align restart shortcut with confirmation`). Exact paths are
  `src/App.tsx`, `src/App.test.ts`, `src/game/input/InputController.ts`, and
  `src/game/input/InputController.test.ts`.
- Result: `P` remains the same Runtime pause/resume action as the header control;
  `R` is removed from the low-level game-input map and is instead handled by the page
  with the same confirmation request as a click on **重新开始**. A live request pauses
  once, disables gameplay input behind the confirmation, and `Enter` confirms the
  focused action. The pause dialog contains exactly one visible **继续游戏** button and
  now accepts `Enter`; cancelling a restart restores only the previously live run.
- Commands run: targeted `npm.cmd run test -- src/game/input/InputController.test.ts
  src/App.test.ts` (4 files / 32 tests passed); `npm.cmd run typecheck`; attempted the
  prescribed Web-game action client, which timed out in its legacy virtual-time layer;
  then ran the cached-Playwright replacement against the live Vite page. The direct
  browser audit clicked Classic, used `P` and `Enter`, clicked restart then cancelled,
  pressed `R` then confirmed with `Enter`, and checked a playing zero-piece new run,
  one canvas, zero DOM cells, no document overflow, and zero console/page errors.
- Evidence: ignored screenshots and report are under `.local/audits/t13-input/`;
  `p-pause.png` and `r-restart-confirm.png` were visually inspected. Blocker: none.
  Next: archive local-only legacy material by route, then start the atomic endgame Core
  authoring checkpoint from this candidate.

## 2026-07-23 — TETRIS-T13-DESKTOP-READINESS-003 contract addendum

- Base: `447ec1e`; this record changes only the T13 contract/documentation while the
  independent endgame-Core authoring work remains uncommitted. Exact paths:
  `docs/DESIGN.md`, `docs/CURRENT_TASK.md`, `docs/progress.md`, and this log.
- User direction: prepare the browser game for a later application package, but do not
  package it now. The bounded follow-up must keep Core platform-free, isolate browser
  storage/lifecycle/timer/focus/audio boundaries behind safe capability adapters, retain
  Vite-relative offline assets, and prove remount/capability-loss cleanup. Electron,
  Tauri, Capacitor, native dependencies, installers, signing, and binaries are out of
  scope for T13.
- Commands run: inspected current `package.json`, Vite config, browser-global callers,
  and the active commit policy. Blocker: none. Next: finish and checkpoint the atomic
  endgame Core/route evidence before beginning this separate platform-boundary slice.

## 2026-07-23 — TETRIS-T13-WORKSHOP-DIRECTION-005 contract addendum

- Base: `a08f132`; exact paths: `docs/DESIGN.md`, `docs/CURRENT_TASK.md`,
  `docs/progress.md`, and this log. This is a visual/access contract only; no product
  source is changed here.
- Direction: retire the T12 tier gate as a separate access/guidance checkpoint, retain
  historic completions as player history, and make every T13 endgame selectable on a
  fresh save. The replacement selector is a sparse four-band relay line with 20 numeric
  stops and one selected real well—not a card grid, thumbnail wall, lock narrative, or
  telemetry panel. The selected surface contains only identity, row/anchor fact, a
  structural cue, and start; a short scan gives selection motion and is disabled under
  reduced motion.
- Commands run: read the current T13 Core checkpoint/log, existing App, progress,
  hint, selector, and stylesheet contracts before amending the source boundary.
  Blocker: none. Next: update all-open progression and schema-6 guide binding as its
  own source/test checkpoint before changing the React/CSS presentation.

## 2026-07-23 — TETRIS-T13-OPEN-ACCESS-006 source checkpoint

- Base: `b2ddd3f`; candidate: `cf1ee73`
  (`feat(puzzle): open workshop access and refresh guidance`). Exact paths:
  `src/puzzleProgress.ts`, `src/puzzleProgress.test.ts`, and `src/puzzleHints.ts`.
- Result: all 20 Puzzle specimens are selectable on a fresh save. The retained campaign
  bands are now 5/6/7/8-row presentation groups only; completion records still migrate,
  normalize, and display as player history, but no longer unlock or block a level.
  The retired v2/v1 import routes remain fail-closed.
- Guidance now reads the schema-6 T13 evidence, verifies its full 20-level shape at
  module load, and replaces stale target-floor / wrong-anchor copy with structural
  opening cues and paired non-command approaches for the actual legal endgames. The
  existing two-piece-or-20-second reveal and player-owned `B` experimentation remain.
- Commands run: `npm.cmd run typecheck`; targeted
  `npm.cmd run test -- src/puzzleProgress.test.ts src/puzzleHints.test.ts`
  (4 files / 15 tests passed). Blocker: none. Next: add Sprint mechanics and its
  leaderboard as a separate source checkpoint, then connect the all-open relay UI.

## 2026-07-23 — TETRIS-T13-SPRINT-007 source checkpoint

- Base: `3cd093f`; candidate: `3485568`
  (`feat(sprint): add 40-line time trial mode`). Exact source paths are the declared
  Sprint integration set in `docs/CURRENT_TASK.md`: Core mode/state/constants/engine
  and direct tests, runtime direct test, versioned leaderboard/persistence tests, and
  the visible home/game/result/style bindings.
- Result: `sprint` starts from an empty ordinary board with a fresh run seed, fixed
  36-tick gravity, no bedrock or special pieces, and a Core-owned 40-line target. A
  normal line-clear that reaches 40 produces `status: finished` plus an explicit
  `sprintCompletion: finished` state, distinct from Puzzle success. Classic and
  Survival retain top-out records; a v4 leaderboard migrates valid v3 Classic/Survival
  rows, fails closed otherwise, and ranks Sprint by lower time, then fewer pieces,
  then score.
- Commands run: `npm.cmd run typecheck`; full targeted
  `npm.cmd run test -- src/game/core/sprint.test.ts src/game/core/rules.test.ts
  src/game/runtime/GameRuntime.test.ts src/leaderboard.test.ts`
  (10 files / 53 tests passed); targeted App Sprint binding tests (5 passed).
  Blocker: none. Next: replace the remaining retired locked-sector selector with the
  all-open four-band relay presentation and perform its browser loop.

## 2026-07-23 — TETRIS-T13-RELAY-008 visual-exception addendum

- Base: `f55fef5`. Exact future source/test paths are `src/App.tsx`,
  `src/App.test.ts`, and `src/styles.css`. The T13 contract already fixes the visual
  goal as an all-open four-band relay; this addendum explicitly authorizes the one
  responsive UI/test unit to exceed the normal 500-line checkpoint budget.
- Reason: semantic station markup, its direct DOM contract, desktop/portrait/landscape
  layouts, focus well, selection scan, and reduced-motion fallback are one inseparable
  replacement for the retired locked-sector selector. Splitting it would temporarily
  regress the open-workshop presentation or leave a non-functional motion contract.
- Required proof: direct typecheck and `src/App.test.ts` now; after the final source
  slice, the T13 whole range receives the complete suite, production build, and live
  desktop/portrait/landscape browser review. No Core, storage, or packaging behavior
  belongs to this exception.
- Blocker: none. Next: create the bounded presentation candidate, inspect it in the
  browser, then begin the separate desktop-boundary implementation.

## 2026-07-23 — TETRIS-T13-RELAY-008 source checkpoint

- Base: `8bda126`; candidate: `299ba74`
  (`feat(puzzle): present all-open relay workshop`). Exact source/test paths are
  `src/App.tsx`, `src/App.test.ts`, and `src/styles.css`; the documented visual
  exception applies only to this three-path selector replacement.
- Result: the retired locked-sector observatory is now a sparse 5/6/7/8-row relay.
  All twenty numeric stops are immediately enabled; a quiet completion check and an
  optional anchor notch are the only per-stop detail. The selected specimen is the
  single large preview, with its ordinal, row/anchor facts, one structural cue, and
  one start action. Selection motion uses a scan and glow without transiently shrinking
  the 44 px target; reduced motion renders the final state directly.
- Commands run: `npm.cmd run typecheck`; `npm.cmd run test -- src/App.test.ts`
  (1 file / 15 tests passed); prescribed web-game action client; and an ignored local
  Playwright audit at desktop 1440×900, portrait 390×844, and landscape 844×390.
  The final audit selected level 08, verified all 20 enabled stops, one focus preview,
  no route preview, 44 px minimum library control, no page overflow, reduced-motion
  suppression, a real selected-level start into exactly one canvas / zero DOM cells,
  and zero console or page errors. Latest captures and `summary.json` are under
  `.local/audits/t13-relay/` and remain ignored.
- Blocker: none. Next: implement the separate browser platform adapter required for
  future desktop-host packaging readiness, without adding a package target.

## 2026-07-23 — TETRIS-T13-PLATFORM-009 contract addendum

- Base: `a336eba`. This checkpoint changes only the T13 contract and coordinator log.
  The authorized implementation set is `src/platform/browserPlatform.ts` plus direct
  tests; the smallest App, Puzzle hint persistence, ActionSheet, GameRuntime, and
  AudioEngine consumers plus their direct tests. No Core rules, Puzzle artifact,
  renderer primitive, dependency, or package target is included.
- Direction: retain the browser-first Vite delivery while establishing one replaceable
  capability boundary for local storage, media queries, timeout/frame ownership,
  document/window visibility and keyboard listeners, focus, and AudioContext creation.
  Missing or denied capabilities must fail closed to inert UI persistence/lifecycle
  behavior, never alter a deterministic game state, and leave no listener/timer/audio
  leak after runtime destroy or React unmount.
- Commands run: reviewed the current direct browser-global callers and their existing
  tests. Blocker: none. Next: implement the adapter and targeted safety tests, then
  record a source checkpoint before final whole-range validation.

## 2026-07-23 — TETRIS-T13-PLATFORM-009 source checkpoint

- Base: `c040f3f`; candidate: `e7c9567`
  (`feat(platform): isolate browser host capabilities`). Exact paths are
  `src/platform/browserPlatform.ts`, its direct test, and the authorized App, Puzzle
  hint, ActionSheet, AudioEngine, and GameRuntime consumers/tests.
- Result: one injectible BrowserPlatform owns guarded storage, media subscription,
  timeout/frame cancellation, window/document listener cleanup, focus deferral,
  monotonic clock access, and AudioContext construction. Storage denial/no host,
  unavailable media/timer/DOM/audio APIs, and a no-window Runtime mount now degrade to
  inert presentation behavior without changing a game state. Runtime destroy releases
  the visibility listener; React restart keys, countdown, saves, dialog focus, hint
  saves, and audio all route through the boundary. No packaging target, native
  dependency, Core rule, route artifact, or renderer primitive changed.
- Commands run: `npm.cmd run typecheck`; `npm.cmd run test --
  src/platform/browserPlatform.test.ts src/game/runtime/GameRuntime.test.ts
  src/game/audio/AudioEngine.test.ts src/puzzleHints.test.ts src/App.test.ts`
  (7 files / 40 tests passed); cached diff check and exact-path staging. Blocker: none.
  Next: replace the rejected interim home/relay presentation using the new
  gravity-workbench visual contract, then perform final whole-range validation.

## 2026-07-23 — TETRIS-T13-GRAVITY-WORKBENCH-010 direction addendum

- Base: `e7c9567`; exact future source/test paths are `src/App.tsx`,
  `src/App.test.ts`, and `src/styles.css`. The user rejected the interim loose
  mode-card stack and the Puzzle relay's broad unused left route canvas.
- Direction: make the two entry pages one visual family. Home becomes a unified
  four-lane gravity field rather than four floating cards. Puzzle becomes a compact
  endgame console: one selected real well with sparse facts, beside a dense 5/6/7/8
  all-open numeric control matrix. Motion is a bounded lane settle / coordinate pulse,
  with a complete reduced-motion final state. The existing routes, all-open access,
  completion indicators, semantic labels, and 44 px controls remain intact.
- Commands run: reviewed the active T13 design/task contract, current relay markup,
  responsive stylesheet, and App semantic tests before authorizing this replacement.
  Blocker: none. Next: implement the three-path visual checkpoint and inspect it at
  desktop, portrait, and landscape before final coordinator validation.
