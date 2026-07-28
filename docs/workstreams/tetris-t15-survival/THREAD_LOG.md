# T15 Phase 4 Survival Workstream Log

## 2026-07-28 — contract opened

- Task ID: `T15-PHASE4-SURVIVAL-CONTRACT`.
- Coordinator: `/root`.
- Pushed rollback base: `1383fca794cba150d373597a21d6686a02922b02`.
- Status: `CONTRACT`; no Phase-4 product source has changed and no candidate exists.
- Frozen behavior:
  - three rows of the accepted brown bedrock at session start;
  - bedrock rise interval `13→6` seconds and one-row removal per three cleared lines;
  - independent `20→10` second stone clock, one or two stones per event, approximately
    1.5× ordinary fall speed, clear/scoring participation, and seven-bag RNG isolation;
  - fair column warning, readable dual clocks, reduced-motion endpoint, and Survival
    records limited to survival time, cleared lines, and date.
- Required checkpoint order: Core/determinism → Pixi renderer/material → DOM HUD →
  final candidate/evidence. Later writers may not start before the prior checkpoint
  is committed and handed off.
- Excluded: Mutation, Classic, Puzzle selector/data, Settings, audio, dependencies,
  packaging, a second Canvas, and a DOM board.
- Commands run for this checkpoint: documentation consistency search and
  `git diff --check`; no product tests/build are required for a docs-only transition.
- Blocker: none.
- Next action: perform a read-only path and behavior audit, freeze exact writer-owned
  files, then begin the Core checkpoint.

## 2026-07-28 — three-way baseline pre-audit

- Core audit: the 3-row opening, 13→6 pressure, three-line reward, 20→10 stone clock,
  1–2 count, 1.5× speed, line-clear participation, isolated RNG, replay/hash,
  pause/restart, and bedrock overflow already exist and should not be rewritten.
- Renderer audit: accepted brown bedrock and slate cracked-stone materials already
  exist. Missing proof is canonical pre-entry columns, stone-id interpolation, and
  actually drawn local spawn/land cues; the current `impact` scalar is not rendered.
- UI/persistence audit: the visible rail lacks the stone clock; result/settings rows
  already show time/lines/date, but v7 still persists Survival score/pieces/chain.
- Frozen clarification:
  - preselect one or two unique columns two playing seconds before the event;
  - keep an all-blocked event due on the same announced columns until one can spawn;
  - retain four HUD cards: time, lines, bedrock/rise, stone clock;
  - migrate to a discriminated v8 Survival payload and drop forbidden v7 fields.
- Exact source checkpoint paths:
  - Core: `src/game/core/constants.ts`, `src/game/core/types.ts`,
    `src/game/core/engine.ts`, `src/game/core/race.test.ts`;
  - renderer: `src/game/render/TetrisRenderer.ts` and test,
    `src/game/render/presentation.ts` and test;
  - HUD: `src/App.tsx`, `src/App.test.ts`, `src/ui/localization.ts`,
    `src/styles/hud.css`, `src/styles/hud.test.ts`;
  - records: `src/leaderboard.ts`, `src/leaderboard.test.ts`, `src/App.tsx`,
    `src/App.test.ts`.
- Baseline targeted gate:
  `npm.cmd run test -- --run src/game/core/race.test.ts
  src/game/render/TetrisRenderer.test.ts src/game/render/theme.test.ts
  src/leaderboard.test.ts src/App.test.ts` — 5 files / 72 tests passed.
- Blocker: none.
- Next action: commit this docs-only clarification, then begin the Core checkpoint
  without touching renderer/UI/persistence paths.
