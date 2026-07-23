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

## 2026-07-23 — TETRIS-T13-GRAVITY-WORKBENCH-010 source checkpoint

- Base: `a1b7ad9`; candidate: `ac25dba`
  (`feat(ui): compose gravity workbench entry surfaces`). Exact paths are
  `src/App.tsx`, `src/App.test.ts`, and `src/styles.css`; the documented visual
  exception applies only to this responsive semantic/layout unit.
- Result: Home is no longer a loose, staggered card pile. It is one dark board-well
  masthead and four connected gravity lanes with ordinal, glyph, concise rule, original
  cell mark, and action. The selected/focused lane receives a bounded accent beam and
  lateral settle. Puzzle is no longer a sparse route canvas: it is one compact dark
  endgame console with a single real selected well and a dense four-band 20-stop matrix.
  All 20 levels remain open, only the focus surface owns a board preview, completion and
  anchor indicators remain quiet, and the 44 px route targets/reduced-motion fallback
  remain intact. The short-landscape lane alignment was corrected from grid placement
  to a stable flex rail after direct browser inspection found clipped label geometry.
- Commands run: `npm.cmd run typecheck`; `npm.cmd run test -- src/App.test.ts`
  (1 file / 15 tests passed); prescribed `web_game_playwright_client.js`; and the
  ignored Playwright audit under `.local/audits/t13-relay/` at 1440×900, 390×844, and
  844×390. The final matrix verifies four Home entries, no viewport overflow, all 20
  enabled Puzzle controls, one focus preview/no route preview, 44 px minimum Puzzle
  control, selection of level 08, one canvas/zero DOM cells after start, reduced-motion
  suppression, and zero console/page errors. Captures were visually inspected.
- Blocker: none. Next: regenerate/archive local walkthrough material, run final
  whole-range gates, update the coordinator record/changelog, and push only the
  reviewed `main` history.

## 2026-07-23 — TETRIS-T13.1-QUIET-EXCAVATION-011 direction addendum

- Base: `046a19b`; this is a documentation-only correction boundary. Exact paths are
  `docs/DESIGN.md`, `docs/CURRENT_TASK.md`, `docs/progress.md`, and this coordinator
  log. No source behavior is claimed complete here.
- User feedback: the workbench's background lines, technical `GRAVITY FIELD` label,
  decorative numbers, redundant footer/count copy, five-cell rising cluster, and
  slanted pseudo-block motifs read as arbitrary decoration rather than gameplay. The
  visual replacement must be quiet, flat, and useful: only connected four-cell glyphs
  and real selected-board cells remain.
- Sprint is also superseded: the empty-board 40-line time trial feels too close to
  Classic. The bounded Core/UI follow-up becomes fresh-seed **清障冲刺**, with a
  deterministic seven-row ordinary rubble opening and a target set of those original
  cells. Normal line clearing removes targets; completion is fastest full excavation,
  while top-out is a failed attempt. Classic, Survival, fixed Puzzle boards, and Sprint
  leaderboard ranking remain otherwise closed.
- Commands run: reviewed the active T13 contract/task/log, current App/Core Sprint
  implementation/tests, responsive styles, and the user-provided desktop/portrait
  captures. Final-suite status is intentionally recorded as inconclusive: one
  124-second default run and one stopped single-worker run produced no result.
  Blocker: none. Next: implement and directly test the isolated Sprint Core change,
  then quiet the App/CSS visual surface before fresh browser evidence.

### TETRIS-T13.1 preview-readability amendment

- User additionally requires the Puzzle selector's sole selected preview to become
  clearer, more pattern-legible, and color-coherent after the decorative cleanup. It
  remains the real authored setup, not a generated symbol: enlarge the cells, preserve
  their material differences on the dark well, use a quiet anchor accent, and keep the
  numeric matrix sparse so it does not compete with the preview. This remains inside
  the existing `src/App.tsx` / `src/App.test.ts` / `src/styles.css` visual boundary.

## 2026-07-23 — TETRIS-T13.2-COLLAPSE-012 scope correction

- Base: `0d45113`. The immediately preceding direction was based on a coordinator
  misread. The user clarified that the rejected fourth mode is Sprint, not Puzzle.
  No Puzzle source or visual edit was made after that mistaken direction; it is now
  superseded and Puzzle is closed pending a separate request.
- Direction: replace excavation Sprint with **坍缩**, a 75-second deterministic
  score-attack where every locked piece, and then every normal line clear, trigger
  independent-column settling; any resulting full rows resolve as a multi-stage cascade. The primary score/rank measure
  becomes score plus best chain, not fastest completion. The renamed mode may change
  its existing Core, App, leaderboard, direct-test, and required small renderer/event
  paths only; Classic, Survival, Puzzle, dependencies, and package targets are closed.
- Required proof: direct Core cascade/countdown/replay tests, relevant Runtime/App and
  leaderboard tests, typecheck, full suite, build, and new desktop/portrait/landscape
  browser evidence. The evidence must show a live 75-second Collapse state, no legacy
  `冲刺`/`清障` labels, visible chain HUD, 44 px controls, one canvas, no overflow, and
  zero console/page errors.

## 2026-07-23 — TETRIS-T13.2-COLLAPSE-012 source checkpoint

- Base: `a26f929`; source candidate: `eaf88d0`
  (`feat(t13): rebuild Sprint as Collapse`). The related test-only retained Puzzle
  replay correction is the preceding `8c51e8c` (`test(qa): refresh Puzzle replay
  fixture`); it refreshes a schema-6 public route and next-unlock expectation only.
- Exact Collapse paths: `src/App.tsx`, `src/App.test.ts`, `src/styles.css`,
  `src/game/core/constants.ts`, `src/game/core/engine.ts`, `src/game/core/index.ts`,
  `src/game/core/sprint.ts`, `src/game/core/sprint.test.ts`,
  `src/game/core/types.ts`, `src/game/render/theme.test.ts`,
  `src/game/runtime/GameRuntime.test.ts`, `src/leaderboard.ts`, and
  `src/leaderboard.test.ts`. This is the authorized cross-boundary exception recorded
  in `CURRENT_TASK.md`; no Puzzle source or visual file is included.
- Result: 坍缩 starts on an empty ordinary board with a fresh seven-bag and fixed
  36-tick gravity. Every locked piece compacts ordinary cells by independent columns;
  a clear compacts again, discovers resulting rows, and resolves their depth-squared
  score chain. The fixed 75-second clock is the only successful finish. HUD/result
  text exposes score, current/best chain, and remaining time. v5 persistence ranks
  score, chain, lines, fewer pieces; obsolete v4 Sprint rows are intentionally not
  migrated because they encode incompatible excavation-time semantics.
- Commands passed after the final source edit:
  `npm.cmd run typecheck`; `npm.cmd run test -- src\\puzzleProgress.test.ts
  src\\puzzleHints.test.ts src\\platform\\browserPlatform.test.ts
  src\\leaderboard.test.ts src\\App.test.ts src\\game\\runtime\\qaScenario.test.ts
  src\\game\\runtime\\GameRuntime.test.ts src\\game\\render\\theme.test.ts
  src\\game\\render\\TetrisRenderer.test.ts src\\game\\render\\presentation.test.ts
  src\\game\\input\\InputController.test.ts src\\game\\audio\\AudioEngine.test.ts
  src\\game\\core\\core.test.ts src\\game\\core\\board.test.ts
  src\\game\\core\\puzzleCampaign.test.ts src\\game\\core\\puzzleRouteSearch.test.ts
  src\\game\\core\\puzzleFlow.test.ts src\\game\\core\\sprint.test.ts
  src\\game\\core\\rules.test.ts src\\game\\core\\race.test.ts
  src\\game\\core\\puzzleUndo.test.ts src\\game\\core\\puzzleSolverResults.test.ts
  src\\game\\core\\puzzles.test.ts --no-file-parallelism --maxWorkers=1`
  (45 files / 270 tests); and `npm.cmd run build` (746 transformed modules).
- Browser proof: `.local/audits/t13-relay/audit.mjs` passes at 1440×900, 390×844,
  and 844×390. It visibly opens 坍缩, waits through its real countdown, performs
  left/hard-drop then right/hard-drop, verifies at least two locked pieces remain on
  the board, all chain/clock fields, no legacy copy, one canvas/zero DOM cells,
  no overflow, no console/page errors, and unchanged 20-entry Puzzle access. Latest
  captures are ignored local files under `.local/audits/t13-relay/` and were inspected.
- The local web-game client was also invoked, but its deterministic action loop cannot
  advance this app's opening countdown because no `window.advanceTime` hook exists;
  its idle snapshot is not used as evidence. The real-time browser audit is the
  authoritative interaction proof. `--no-verify` was used only for the two local
  commits because the pre-commit runner's default suite is already recorded as
  non-terminating; the explicit full matrix above completed successfully.
- Blocker: no independent Core or visual/browser QA disposition exists, so this is a
  verified candidate rather than an acceptance. Next: commit the coordinator
  changelog/record and make the user-authorized recovery push.

## 2026-07-24 — TETRIS-T13.3-WALKTHROUGH-013 contract checkpoint

- Base: `d288453`. Live inventory proves the versioned repository is clean and pushed,
  but ignored `Solutions/` is not semantically clean: it mixes stale T12 three-row
  walkthroughs/images, local selector audits, authoring scratch material, and obsolete
  helper scripts with the requested player-facing solution files.
- Scope: no product source or Puzzle behavior may change. Exact versioned paths are
  `docs/DESIGN.md`, `docs/CURRENT_TASK.md`, `docs/progress.md`, this log, the final
  changelog record, and `tools/generate-puzzle-walkthroughs.mjs`. The local moves are
  exact existing `Solutions/` targets only; they preserve recovery material beneath
  `.local/audits/t12.6-walkthrough-legacy-20260724/` rather than deleting it.
- Contract: the generator replays only schema-6 T13 primary public routes through the
  real Core, validates terminal completion/zero targets, writes one current
  `Solution-1.md` through `Solution-20.md` plus linked SVG snapshots, and labels each
  route as feasible evidence rather than a unique or optimum answer.
- Commands/evidence so far: focused Core/UI/control coverage passed 22 files / 130
  tests; real browser audits passed the P/Enter pause path, click/R/Enter restart path,
  current 20-entry Puzzle selector, Collapse hard drops, one canvas, no DOM cells,
  no overflow, and zero errors. Full explicit single-worker matrix later passed 45
  files / 270 tests; typecheck and build passed. The default Vitest invocation was
  stopped after a no-output runner startup hang and is not reported as passing.
- Blocker: none. Next: commit this boundary, then execute the local archive and
  generator slice with fresh output verification.
