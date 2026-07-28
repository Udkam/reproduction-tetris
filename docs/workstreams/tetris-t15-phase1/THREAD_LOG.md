# T15 Phase 1 Workstream Log

## Contract and ownership

- Task: T15 Phase 1A/1B design-system foundation.
- Coordinator/writer: primary Codex task.
- Code/rules QA: `t14_readonly_qa` (read-only).
- Target/visual QA: `phase1_visual_delta` (read-only).
- Rollback base: `ed36ab3`.
- Contract checkpoints: `5ac6437`, followed by the Phase 1B contract checkpoint.
- Excluded inherited paths: `src/styles.css` modal-compositor delta and untracked
  `phase 1.md`.

## Phase 1A checkpoints

- `35e4e35` — typed colour/type/spacing/radius/component/motion tokens, CSS bridge,
  Pixi shell palette, and direct tests.
- `babf3e8` — archive stale T14 status and bind the authored Playwrite weight.
- `e266280` — request the real Playwrite 400 face and give the wordmark restrained
  stroke weight.
- `378826b` — raise selector specificity so Chromium actually uses that face.
- `7ff656c` — add exact local Noto Sans SC Variable dependency and adopt the
  regenerated, clean-installable lock.
- `54fd260` — import the local Chinese face and bind its actual Fontsource family in
  typed/CSS role contracts.
- `99e5a0f` — bind the actual Space Grotesk Variable and JetBrains Mono Variable
  family names after target/visual QA exposed silent fallback.

## Verification and self-correction

- Initial focused tests: 2 files / 12 tests passed.
- Typecheck passed.
- First full run under 94% machine CPU timed out only in the renderer's 10-second
  setup hook; it was not counted as a pass.
- Serial rerun after load fell: 25 files / 182 tests passed; production build
  transformed 751 modules.
- Code QA found an AA regression: requested soft `#627D98` was incorrectly used by
  12–14 px text and the test threshold had been lowered. The writer introduced
  readable `#52677F`, retained `#627D98` only as a soft accent, and restored two 4.5
  contrast assertions.
- Candidate browser review found Playwrite was declared at nonexistent weight 700,
  producing a Space Grotesk fallback. The writer changed it to the authored 400 face
  plus a restrained stroke and corrected selector specificity.
- Clean detached candidate `378826b` was production-built and served by Vite Preview
  to avoid junction-only development-font errors. Evidence:
  `.local/audits/phase1-378826b-preview/candidate/report.json`.
  It records the exact source SHA, a clean worktree, screenshot hashes, Playwrite
  loaded at weight 400, requested/accessible palette roles, one canvas, zero DOM
  cells, no horizontal overflow, and zero browser errors.

## Phase 1B candidate, audit correction, and fresh evidence

- Corrected candidate: `99e5a0f`; rejected candidate: `54fd260`; rollback base:
  `ed36ab3`.
- A newly created detached worktree at exactly `54fd260` passed a real
  `npm.cmd ci --ignore-scripts`, `npm.cmd run typecheck`, and the focused 2-file /
  12-test token/theme contract; that disposable worktree was then removed.
- Final source gates: typecheck passed; full suite passed 25 files / 182 tests;
  production build transformed 752 modules.
- First target/visual verdict: reject `54fd260` with one P1. Fontsource registered
  `Space Grotesk Variable` and `JetBrains Mono Variable`, while token/CSS families
  requested the non-Variable names. The evidence showed both intended faces unloaded
  and an invisible fallback to Noto. The audit also identified the
  `playwrite700Loaded` field as a fallback-positive P2.
- Writer correction `99e5a0f`: use both actual variable family names, freeze them in
  the token contract, remove the invalid Playwrite 700 proof, and explicitly load/
  enumerate the intended Latin UI/data faces in browser evidence. Focused tests,
  typecheck, full 25-file / 182-test suite, and 752-module build all pass after the
  correction.
- Required generic game client captured the live Classic entry state. A separate clean
  production-preview audit is bound to `99e5a0f` at
  `.local/audits/phase1-99e5a0f-preview/candidate/report.json`; Home and Classic
  screenshots prove loaded Playwrite 400, Space Grotesk Variable 500, JetBrains Mono
  Variable 700, Noto Sans SC Variable 500/700 Chinese coverage, four modes, one
  canvas, zero DOM cells, no overflow, zero errors, and the completed countdown
  transition.
- Resource closure: Vite Preview listener 53972 was stopped and verified free. The
  clean candidate worktree remains only for the current independent visual/code
  review; it is not a running service.
- Current status: both auditors must repeat against corrected candidate `99e5a0f`.
  No coordinator acceptance or push claim exists until both final verdicts are
  recorded.
