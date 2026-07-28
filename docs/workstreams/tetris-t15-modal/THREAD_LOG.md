# T15 Phase 1.5 Modal Compositor Workstream Log

## Contract and ownership

- Task: isolate and either adopt or correct the inherited T13.16 modal-compositor
  delta before Settings acquires `src/styles.css`.
- Rollback base: `dfeb2c9`.
- Coordinator/writer: primary Codex task as `t15_modal_writer`.
- Target/visual pre-audit and final QA: `t15_modal_target` (read-only).
- Code/rules pre-audit and final QA: `t15_modal_rules_preaudit` (read-only).
- Exact product scope: the existing five-line delta inside
  `.play-shell:has(.sheet-backdrop) .canvas-host` in `src/styles.css`, plus a direct
  test only if the auditors identify a missing enforceable contract.
- Explicit exclusions: Settings layout/content, Core, renderer, canvas count,
  `phase 1.md`, all Puzzle work, and every other game repository.

## Acceptance matrix

The same one live Pixi canvas remains present and visible beneath the dimmer while
each live-game opaque sheet owns the complete foreground:

1. Settings opened from playing and paused state.
2. Pause sheet.
3. Restart confirmation.
4. Exit confirmation.
5. Puzzle completion result.

The first-entry rules sheet is a separate pre-session state: zero canvas is correct.
It must preserve the mode page beneath an opaque foreground sheet and retain the same
focus/keyboard contract.

For each relevant state, desktop and compact evidence must show no WebGL surface
painting over the sheet, no empty background caused by hiding the canvas, correct
backdrop coverage, no horizontal overflow, zero console/page errors, and unchanged
keyboard/focus operation. Reduced motion must keep the same static layer order.

## Checkpoint and rollback plan

1. Contract/log checkpoint.
2. One exact CSS/test source checkpoint.
3. Candidate-bound production browser evidence.
4. Independent code/rules and target/visual verdicts.
5. Correction/re-evidence/re-audit if any user-relevant finding remains.
6. Coordinator acceptance, changelog, resource cleanup, and non-force push.

## Pre-audit findings

- Code/rules: retain the two declarations but add a direct `App.test.ts` contract for
  the modal CSS block and stable canvas node/focus path. The original matrix
  incorrectly required a canvas before `GameSession`; that P1 contract contradiction
  is corrected above.
- Target/visual: adopt the existing five-line delta unchanged as the first candidate.
  Static CSS is not proof because `filter`/`contain: paint` may still promote a layer;
  final production-preview screenshots must use pixel probes inside the sheet and
  visual review outside it. Settings from playing/paused, Pause, Restart, Exit, Puzzle
  result, and first-entry rules are required at 1440 × 900 and 390 × 844; reduced
  motion repeats Settings and Puzzle result.
- The final report records canvas identity/count, modal and restored canvas z-index/
  transform, full viewport backdrop, opaque sheet background, focus restoration,
  overflow/errors, outside-sheet dimmed-board edge correlation, and three inside-sheet
  surface probes.

Current state: `PREAUDIT PASS`; contract corrected; source candidate not yet created.
