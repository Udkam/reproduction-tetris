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

## 2026-07-28 — Core canonical warning checkpoint

- Task ID: `T15-PHASE4-SURVIVAL-CORE`; writer: coordinator acting as
  `t15_survival_core_writer`.
- Base SHA: `47b7b35b5b42726114b6087802baf720c1b906bd`.
- Candidate: `514c459407ad4d1136f62651191bd7df4dd107e3`.
- Exact changed paths: `src/game/core/constants.ts`, `engine.ts`, `race.test.ts`,
  and `types.ts`.
- Delivered claim: a deterministic two-second, one-or-two unique-column warning
  becomes canonical state, uses a separate RNG stream, drives the exact spawn plan,
  and stays due on the same columns while every announced entry is blocked.
- Verification retained by the final candidate: focused
  `npm.cmd run test -- --run src/game/core/race.test.ts` and
  `npm.cmd run typecheck`; the original per-commit stdout was not retained, which is
  why the corrected evidence later commits raw final-gate logs.
- Evidence: direct warning/spawn, RNG/hash/restart/pause, blocked-entry, interval,
  count, and 1.5× accumulator cases in `race.test.ts`.
- Blocker: none.
- Next action: hand only the canonical state/event surface to the renderer writer.

## 2026-07-28 — Renderer arrival checkpoint

- Task ID: `T15-PHASE4-SURVIVAL-RENDER`; writer:
  `t15_survival_render_writer`.
- Base SHA: `514c459407ad4d1136f62651191bd7df4dd107e3`.
- Candidate: `4d319945ef21d0881d561692dc6c57e369a0de88`.
- Exact changed paths: `src/game/render/TetrisRenderer.ts` and
  `src/game/render/TetrisRenderer.test.ts`.
- Delivered claim: existing brown bedrock and cracked slate stone materials remain;
  renderer snapshots expose canonical warning columns and stone ids, draw a local
  entry arrow, interpolate travel, and queue local spawn/landing cues. Reduced motion
  uses the same static endpoint.
- Verification retained by the final candidate: renderer direct tests plus the final
  26-file suite and browser warning/spawn/falling/landing matrix.
- Evidence: direct renderer assertions and corrected PNG/JSON evidence in
  `docs/qa/evidence/t15-phase4`.
- Blocker: none.
- Next action: hand the renderer snapshot fields to the HUD writer.

## 2026-07-28 — Four-card Survival HUD checkpoint

- Task ID: `T15-PHASE4-SURVIVAL-HUD`; writer: `t15_survival_ui_writer`.
- Base SHA: `4d319945ef21d0881d561692dc6c57e369a0de88`.
- Candidate: `f89c040ed8a208ef91750863381eef007af97cbb`.
- Exact changed paths: `src/App.tsx`, `src/App.test.ts`,
  `src/styles/hud.css`, and `src/ui/localization.ts`.
- Delivered claim: the accepted four-card rail shows Survival time, lines,
  bedrock rows plus rise clock, and the independent stone clock without a fifth
  card or explanatory clutter.
- Verification retained by the final candidate: direct App/HUD checks, English and
  Chinese browser captures, portrait and short-landscape checks, and the full suite.
- Evidence: `desktop-warning.png`, `portrait-warning.png`,
  `landscape-reduced-warning.png`, and `english-warning.png`.
- Blocker: none.
- Next action: narrow the persisted Survival record without changing the HUD topology.

## 2026-07-28 — Survival record isolation checkpoint

- Task ID: `T15-PHASE4-SURVIVAL-RECORDS`; writer:
  `t15_survival_ui_writer` under the sequential persistence slice.
- Base SHA: `f89c040ed8a208ef91750863381eef007af97cbb`.
- Candidate: `5c6a436d6a4e03eb92d1ed0a84728e4264d5b185`.
- Exact changed paths: `src/leaderboard.ts`, `src/leaderboard.test.ts`,
  `src/App.tsx`, and `src/App.test.ts`.
- Delivered claim: mode-discriminated v8 Survival rows retain only elapsed ticks,
  lines, completion date, mode, outcome, and schema metadata; v7 migration discards
  score, pieces, and chain.
- Verification retained by the final candidate: direct leaderboard/App tests and the
  final 26-file / 203-test suite.
- Evidence: strict object-shape assertions in `leaderboard.test.ts`; Settings and
  result rendering assertions in `App.test.ts`.
- Blocker: none.
- Next action: inspect browser readability before freezing the source candidate.

## 2026-07-28 — Live clock readability correction

- Task ID: `T15-PHASE4-SURVIVAL-CLOCK`; writer: coordinator.
- Base SHA: `5c6a436d6a4e03eb92d1ed0a84728e4264d5b185`.
- Candidate: `cc8c71fcde25f586cb48b1d9f9695009a0134c65`.
- Exact changed paths: `src/App.tsx` and `src/App.test.ts`.
- Delivered claim: the live endurance card uses compact `M:SS`, while leaderboard
  rows keep localized long-form duration.
- Commands actually run: focused App tests (33 passed) and
  `npm.cmd run typecheck`, followed by the first source-bound browser matrix.
- Evidence: the corrected portrait frame displays a complete `0:18` rather than a
  clipped localized sentence.
- Blocker: none.
- Next action: freeze the source and produce candidate-bound evidence.

## 2026-07-28 — First evidence and independent QA

- Task ID: `T15-PHASE4-SURVIVAL-EVIDENCE-R1`; base
  `cc8c71fcde25f586cb48b1d9f9695009a0134c65`; evidence checkpoint `ced5950`.
- Exact evidence paths: initial generator, JSON, six PNGs, README, and checksums under
  `docs/qa/evidence/t15-phase4`.
- Visual QA: `ACCEPT`, no P0–P2.
- Rules QA: `REJECT` on process/evidence only—missing writer handoffs, wrong JSON
  field for the bedrock clock, and no direct score/event assertion for a
  stone-assisted clear.
- UI/evidence QA: `REJECT` on evidence completeness—no countdown/settings,
  pause/restart, unmount/remount and listener/ticker/audio proof; no English frame,
  raw gate logs, or independently verified candidate binding.
- Blocker: first evidence was insufficient and could not be accepted.
- Next action: return to the same writer, add the direct score proof, rebuild the
  evidence matrix, retain raw gates, and repeat every independent audit.

## 2026-07-28 — Scoring proof correction

- Task ID: `T15-PHASE4-SURVIVAL-CORRECTION-SCORE`.
- Base SHA: `ced59500fc119c943cde10e79db0f6fc0fb02f55`.
- Candidate: `2af2adfc1640b2d5be2197ec1bf92db8637f70ef`.
- Exact changed path: `src/game/core/race.test.ts`.
- Delivered claim: a stone-assisted single-line clear directly asserts one line,
  total score `40`, and the matching `lines-cleared` event score while preserving
  the active player piece.
- Commands actually run:
  `npm.cmd run test -- --run src/game/core/race.test.ts` (17/17) and
  `npm.cmd run typecheck`, both passed.
- Blocker: none.
- Next action: regenerate every source-bound artifact from this exact SHA.

## 2026-07-28 — Corrected candidate/evidence checkpoint

- Task ID: `T15-PHASE4-SURVIVAL-EVIDENCE-R2`.
- Source/test candidate: `2af2adfc1640b2d5be2197ec1bf92db8637f70ef`.
- Evidence checkpoint: `993dfc7`.
- Exact changed paths: the generator, README, checksum manifest, JSON, nine PNGs,
  and three raw gate logs under `docs/qa/evidence/t15-phase4`.
- Candidate proof: the generator resolves `HEAD`, verifies all declared product
  paths are clean and tree-equal to `2af2adf`, then records those assertions.
- Browser proof: fixed seed `0x5A0E`; warning/spawn column `[4]`; three-row opening;
  real 13-second rise; falling and landing; Chinese/English, portrait and reduced
  motion; countdown digit frozen in Settings; pause/resume; same-Canvas restart;
  two exit/remount cycles; global listeners 28→17, RAF 3→0, audio 2 created/2
  closed, Canvas 1→0, QA surface removed; zero browser/page errors.
- Commands actually run after the last source change:
  `npm.cmd run typecheck`; `npm.cmd run test` (26 files / 203 tests);
  `npm.cmd run build` (753 modules); the prescribed web-game client for three live
  Survival iterations; and `capture_phase4.py`. All passed.
- Evidence integrity: 14/14 manifest hashes independently recomputed and matched.
- Blocker: none.
- Next action: repeat rules, visual, and evidence audits against
  `2af2adf` + `993dfc7`; no acceptance or push before all return `ACCEPT`.
