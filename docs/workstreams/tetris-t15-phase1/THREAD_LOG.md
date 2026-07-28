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

## Phase 1B next action

1. Add and lock exact local Noto Sans SC variable font in a dependency-only
   checkpoint.
2. Prove `npm ci`, focused tests, typecheck, full suite, build, and clean-candidate
   browser font loading.
3. Run code/rules and visual QA in parallel; record findings and correction SHA before
   coordinator acceptance.
