# T15 Phase 2 Settings Workstream Log

## Contract and ownership

- Task: replace the rejected stretched/compressed Settings compositions with one
  compact, natural-height, bilingual connected console.
- Rollback base: pushed `fd26652`.
- Coordinator/writer: primary Codex task as `t15_settings_writer`.
- Code/rules QA: `t15_settings_rules_qa` (read-only).
- Target/visual QA: `t15_settings_visual_qa` (read-only).
- Evidence-integrity QA: `t15_settings_evidence_qa` (read-only).
- User-owned exclusion: untracked `phase 1.md`.
- Product exclusions: Core, renderer, audio engine/runtime, leaderboard schema and
  sorting, dependencies, Puzzle definitions, and Puzzle selector composition.

## Independent pre-audits

Three read-only roles inspected pushed base `fd26652` before this contract:

1. `t15_settings_rules_preaudit` found the existing records, dates, sound-only
   controls, language switching, backdrop behavior, and most modal focus behavior
   correct. It identified countdown-to-running leakage behind Settings/Exit,
   DOM-index arrow routing, and a missing language prop on result leaderboards as
   product P1s. It also confirmed Survival's visible Settings row already omits score
   and piece count.
2. `t15_settings_visual_preaudit` rejected both prior visual extremes: unequal
   side-by-side cards with structural blank space, and a full-width compressed table
   with 9–10 px text / 28–34 px controls. It froze the 800 px connected-console,
   natural-height, 52 px rail, 12 px minimum text, and 44 px target geometry.
3. `t15_settings_mode_matrix` independently enumerated the four rules/record states,
   confirmed five-row/date and music-removal boundaries, and recommended structured
   rule facts plus content-driven layout rather than mode-specific ghost columns.

No pre-auditor modified, staged, committed, tested, built, or started a service.

## Checkpoint plan

1. `contract` — this docs-only target and rollback record.
2. `behavior-content` — typed rule facts, countdown sheet freeze/resume, explicit
   coordinate navigation, result-language correction, and direct tests.
3. `layout-style` — one authoritative connected Settings console and geometry tests;
   do not append another unbounded experimental layout.
4. `candidate` — immutable SHA after targeted tests.
5. `evidence` — final typecheck, full suite, build, desktop/portrait/short-landscape,
   Chinese/English, record-state, reduced-motion, and modal-compositor proof.
6. `qa-rules`, `qa-visual`, `qa-evidence` — three independent verdicts.
7. `correction-*` — same writer, fresh evidence, and all three audits if any relevant
   finding remains.
8. `acceptance`, resource cleanup, and non-force push.

## Frozen acceptance facts

- DOM and visual order: Controls → Keyboard → Rules → Records.
- Music remains absent; SFX and 0–100% volume remain.
- Keyboard is Gameplay first, Shortcuts second, and uses two readable item columns.
- Records stay top five with dates; Survival visibly contains only time/lines/date;
  Puzzle contains only current-level best or not-completed.
- Settings/Exit cannot let entry countdown start behind a sheet.
- Direction keys follow declared visual rows/columns; range keys remain native.
- Same one Pixi Canvas remains visible and dimmed under the opaque sheet.
- No Puzzle selector redesign.

Current state: `CONTRACT`; product source has not started.

## Behavior/content checkpoint

- Checkpoint task: `t15_settings_writer/behavior-content`.
- Implementation base: pushed `c4465ef`.
- Source candidate: `cc35738`.
- Exact changed paths:
  - `src/App.tsx`
  - `src/App.test.ts`
  - `src/ui/ActionSheet.tsx`
  - `src/ui/localization.ts`
- Delivered claims:
  - the entry countdown uses one cancellable one-second step and freezes behind the
    complete Settings/Restart/Exit sheet chain;
  - ready-state Settings disables its no-op Restart action and resumes the same digit
    without enabling input;
  - Settings controls declare semantic row/column coordinates while range arrows and
    legacy two-action sheets retain their existing behavior;
  - rule copy is a typed `RuleFact` matrix with stable bilingual IDs;
  - terminal leaderboards receive the active language;
  - ordinary leaderboard rows expose exact semantic fields and defensively render at
    most five real records.
- Commands actually run after the last source change:
  - `npm.cmd run test -- --run src/App.test.ts` — PASS, 1 file / 30 tests.
  - `npm.cmd run typecheck` — PASS.
  - `git diff --check` — PASS.
- Direct evidence includes a five-second open-sheet countdown freeze at digits 3 and
  2, one final runtime start, pending-timer unmount cancellation, all twenty Settings
  coordinate routes, native range arrows, all four rule-ID matrices in both languages,
  the English terminal call site, and exact five-row record fields for three scored
  modes.
- Blocker: none.
- Next action: create the separate `layout-style` checkpoint; do not alter the accepted
  behavior paths except for direct layout semantics/tests required by the frozen
  Settings composition.

## Layout/style checkpoint

- Checkpoint task: `t15_settings_writer/layout-style`.
- Implementation base: `99f5960`.
- Source candidate: `2f94d16`.
- Exact changed paths:
  - `src/App.tsx`
  - `src/App.test.ts`
  - `src/styles.css`
- Delivered claims:
  - the active Settings tree has its own `settings-console` namespace and no longer
    mounts the historical `.settings-sheet` class, so superseded layout generations
    cannot alter the live console;
  - one marked authoritative block owns an at-most-800 px, border-box sheet and four
    connected natural-height bands in the frozen Controls → Keyboard → Rules →
    Records order;
  - the sheet uses 52 px label rails, at least 12 px interface text, 44 px button
    targets, two-column Gameplay/Shortcut groups, content-driven rules/records, and
    internal scrolling on short viewports;
  - the portrait action row uses zero-minimum columns, preventing Restart/Continue
    from crossing the sheet or viewport edge;
  - the direct CSS contract rejects undersized text, undersized primary controls,
    equal-height stretching, and duplicate authoritative markers.
- Commands actually run after the last product source change:
  - `npm.cmd run test -- --run src/App.test.ts` — PASS, 1 file / 31 tests.
  - `npm.cmd run typecheck` — PASS.
  - `git diff --check -- src/App.tsx src/App.test.ts src/styles.css` — PASS.
  - `.local/audits/t15-phase2-live/settings-live-audit.mjs` — PASS, 11 captures /
    zero browser errors.
- Browser loop:
  - desktop Chinese Classic/Survival/Mutation, English Classic/Puzzle;
  - 390 × 844 Chinese Classic and English Puzzle;
  - 844 × 390 Chinese Survival and 1056 × 480 English Mutation, including a
    scrolled-bottom proof that the final record band is fully reachable;
  - reduced-motion Chinese Puzzle;
  - one visible Canvas, no mounted legacy Settings class, no horizontal overflow,
    no clipped button, correct rule columns and record fields, and active-dialog
    focus in every scenario.
- Remaining review risk: historical `.settings-sheet` selectors still exist as
  unreachable legacy CSS. They are intentionally isolated rather than broadly
  deleted inside this layout checkpoint; independent QA must decide whether their
  removal is required before acceptance.
- Blocker: none.
- Next action: freeze the complete Phase-2 candidate, run full candidate-bound gates
  and production browser evidence, then request all three independent audits.

## Candidate rejection and bounded correction

- Initial layout/log tip: `2f8ee83`.
- The first visual and evidence reviews rejected the candidate because the 390 px
  portrait sheet used viewport-based width inside an already padded backdrop, clipping
  its right outer edge. Evidence binding also depended too heavily on injected state,
  and did not yet prove the same Canvas before/during/after the sheet.
- Correction source: `26e4db39dba1a0e43bd66d4bd4c48a0997bef40c`.
- Exact correction paths:
  - `src/styles.css`
  - `src/App.test.ts`
- The correction constrains Settings width to the backdrop's actual `100%` content
  box at desktop, portrait, and short-landscape breakpoints. The direct CSS contract
  rejects a return to `100vw`.
- No Settings behavior source or Puzzle source changed in the correction. Independent
  rules QA confirmed the Puzzle library was byte-identical across the correction.

## Final candidate gates and evidence

- Candidate/product source:
  `26e4db39dba1a0e43bd66d4bd4c48a0997bef40c`.
- Commands run after the final source change:
  - `npm.cmd run typecheck` — PASS.
  - `npm.cmd run test` — PASS, 25 files / 190 tests.
  - `npm.cmd run build` — PASS, 752 modules.
- Production preview:
  - URL: `http://127.0.0.1:5179`.
  - Verified owner before acceptance cleanup: PID `21744`, repository-local Vite
    `preview --host 127.0.0.1 --port 5179 --strictPort`.
- Prescribed game client:
  - `.local/audits/t15-phase2-live/web-game-client-candidate-final/shot-0.png`
    shows the one-Canvas live countdown.
  - `state-0.json` records `screen=game`, `mode=marathon`, `status=ready`,
    `countdown=1`.
- Production browser report:
  - `.local/audits/t15-phase2-live/settings/report.json`
  - `.local/audits/t15-phase2-live/settings/manifest.json`
  - 11 primary scenarios plus 3 scrolled-bottom frames cover four modes, Chinese and
    English, empty/full records, Puzzle fresh/complete, desktop, portrait,
    short-landscape, and reduced motion.
  - Every scenario has one Canvas, zero DOM cells, active-dialog focus, no page or
    console error, and the same Canvas identity before/during/after Settings.
  - The live app is visibly dimmed while Settings is open and restored on close.
  - 390 × 844 geometry is fully inside the viewport: x 16.9, right 373.1, viewport
    width 390. Short screens can reach the final content band.

## Independent final disposition

- Rules/code QA: ACCEPT; no P0–P2. It reran App 31/31, typecheck and diff check,
  confirmed the correction is limited to CSS/test, and confirmed Puzzle is unchanged.
- Target/visual QA: ACCEPT; no P0–P3. It inspected all 14 original-detail frames and
  closed the portrait-crop finding.
- Evidence-integrity QA: ACCEPT; no blocker. It independently recalculated all 24
  manifest entries and matched every byte count and SHA-256, verified the candidate,
  build outputs, production preview ownership, official client state, same Canvas,
  reversible dimming, and final gates.
- Non-blocking P3:
  - 107 unreachable historical `.settings-sheet` selectors remain; the active DOM and
    final report both show zero references.
  - Historical layout checkpoint `2f94d16` exceeded the default 500-line checkpoint
    budget. The cohesive namespace change remains accepted; shared history is not
    rewritten.
- Acceptance record: `092c91dd51f9b022a23560d7fb88b42832ffb44f`.
- Resource cleanup: verified repository Vite production preview PID `21744` was
  stopped; port 5179 was confirmed free.
- Push: `c4465ef..092c91d` was pushed non-force to `origin/main`; local HEAD and
  `origin/main` both resolved to `092c91dd51f9b022a23560d7fb88b42832ffb44f`.
- Current state: `PUSHED`.
- Next action: Phase 3 may open its HUD contract from recovery point `092c91d`.
