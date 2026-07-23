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
