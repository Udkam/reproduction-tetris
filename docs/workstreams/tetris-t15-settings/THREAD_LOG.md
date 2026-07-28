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
