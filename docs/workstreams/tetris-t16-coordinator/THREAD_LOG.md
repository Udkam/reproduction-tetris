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
