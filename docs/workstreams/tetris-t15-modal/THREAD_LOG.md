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

## Source candidate

- Candidate SHA: `17ccc96` (`fix(ui): demote canvas beneath modal sheets`).
- Parent contract chain: `9995857` then corrected evidence contract `6cd2be8`.
- Exact product/test paths:
  - `src/styles.css`
  - `src/App.test.ts`
- Direct evidence after the last source change:
  - `npm.cmd run test -- src/App.test.ts`: 1 file / 25 tests passed.
  - `npm.cmd run typecheck`: passed.
- The direct test freezes both halves of the claim: the modal selector keeps the live
  canvas visible at `z-index: 0` with `transform: none`, and Settings preserves/refocuses
  the same canvas node.
- Full current-source suite, production build, clean-worktree dependency install, and
  browser matrix are still pending. CPU samples remained above the project 60% heavy
  workload threshold, so those jobs were deliberately not started in parallel.
- Candidate-bound browser preparation lives only under ignored
  `.local/audits/t15-modal-17ccc96/`. Primary screenshots precede two explicitly
  labelled calibration captures: one temporarily hides the backdrop to recover the
  exact live scene, and one temporarily hides the canvas to prove opaque sheet pixels
  are unchanged. Calibration state is never presented as product evidence.

Current state: `SOURCE CANDIDATE`; targeted gates pass; full gates, browser evidence,
dual final QA, coordinator acceptance, cleanup, and push remain pending.

## Browser rejection 1 — modal ownership focus race

- Main-tree gates before capture:
  - The first full suite attempt hit a one-time 10-second
    `TetrisRenderer.test.ts` `beforeAll` timeout; isolated rerun passed 11/11 in 1.44 s.
  - The single permitted diagnostic full rerun passed 25 files / 184 tests.
  - Main and clean detached-candidate production builds each passed with 752 modules.
  - The clean candidate completed a real `npm ci --ignore-scripts` (107 packages).
- Production preview source: clean detached worktree at exact source SHA `17ccc96`;
  DEV QA surfaces were explicitly forbidden by the browser audit.
- The first Settings-from-playing case passed its primary one-canvas/layer/focus
  assertions. An audit-only calibration initially lost focus by hiding its own backdrop;
  that script defect was corrected without changing product code.
- The repeated matrix then found a product P1 on
  `Canvas → KeyP → Pause → KeyS → Settings`: after 220 ms the only Settings dialog was
  visible and the canvas was correctly underneath it, but `activeElement` had returned
  to the original canvas and `dialog.contains(activeElement)` was false.
- Both independent auditors classify this as a Phase-1.5 acceptance blocker. Root cause:
  Pause cleanup schedules a two-frame previous-focus restore while Settings schedules
  one-frame autofocus, so the retired sheet steals ownership on the later frame.
- Accepted correction boundary:
  - retain `17ccc96` without amending history;
  - add one generic `src/ui/ActionSheet.tsx` arbitration rule that skips outgoing focus
    restoration whenever a successor `aria-modal` dialog is already mounted;
  - add queued-RAF App coverage for Pause → Settings and Settings → Restart ownership;
  - do not add App-specific delays, hide/disable the canvas, or relax focus assertions.
- Preview PID `17728` was verified as the candidate Vite preview, stopped, and port
  `53973` was confirmed released before correction work.

Current state: `P1 CORRECTION`; original pixel compositor claim remains the candidate
base, but no Phase-1.5 acceptance is possible until focus ownership is fixed and the
full production matrix plus both independent QA passes from the new source SHA.

## Browser rejection 2 — replacement chain final return

- Correction candidate: `646a475`
  (`fix(ui): hand modal focus to successor sheet`), preserving `17ccc96`.
- Exact correction paths:
  - `src/ui/ActionSheet.tsx`
  - `src/App.test.ts`
- Candidate gates after the last source change:
  - direct App test: 1 file / 26 tests passed;
  - typecheck: passed;
  - full suite: 25 files / 185 tests passed;
  - main and clean detached-candidate builds: 752 modules each.
- The production matrix passed 16 desktop/compact/reduced-motion cases and the pixel
  audit passed 14 live-sheet cases. During manifest generation the coordinator found
  that the first report had been labelled with a mistyped full SHA. That evidence was
  rejected rather than relabelled; the entire production matrix and pixel audit were
  rerun with exact candidate SHA
  `646a4750376a01d11c1b99a0fb0db0220d175183`.
- Independent rules QA identified one untested chain endpoint. A separate production
  Chromium probe then reproduced it exactly:
  `Canvas → Settings → Restart → Cancel → two animation frames` leaves zero dialogs,
  the same one Canvas restored at `z-index: 6` with its normal transform, and zero
  console/page errors, but `activeElement` is `body` instead of the Canvas. `KeyP`
  remains operational, so this is a focus-restoration P1 rather than a runtime failure.
- Accepted correction boundary:
  - add the existing semantic `focusBoard()` return to `cancelRestart` in `src/App.tsx`;
  - extend `src/App.test.ts` queued-frame coverage through Restart cancel and same-Canvas
    restoration;
  - extend production evidence with the same replacement-chain endpoint;
  - no fixed delay, ActionSheet special case, layout, copy, Core, renderer, or runtime
    rule change.

Current state: `P1 CORRECTION 2`; `646a475` is rejected as a Phase-1.5 acceptance
candidate. The next candidate must repeat targeted/full gates, clean build, the
production matrix and pixel audit, then both independent QA.

## Browser rejection 3 — paused-origin successor ownership

- Correction candidate: `8f3b72f`
  (`fix(ui): restore board after restart cancel`), with contract checkpoint `aafb005`.
- Exact correction paths:
  - `src/App.tsx`
  - `src/App.test.ts`
- Candidate gates and source-bound evidence:
  - direct App test: 1 file / 26 tests passed;
  - typecheck: passed;
  - full suite: 25 files / 185 tests passed;
  - main and clean detached-candidate builds: 752 modules each;
  - exact-SHA production matrix: 18 cases passed;
  - pixel audit: 16 live-sheet cases passed;
  - generic final-candidate client capture completed without browser errors;
  - manifest candidate/report/pixel SHAs and their SHA-256 hashes matched.
- Target/visual QA accepted the candidate with no product P0/P1: all compositor,
  desktop/390 px/reduced-motion, focus-return, opacity, overflow, and error evidence
  passed for the matrix that existed.
- Code/rules QA rejected it after identifying an omitted state origin. A separate
  production probe reproduced:
  `Canvas → Pause → Settings → Restart → Cancel → 250 ms + two frames`.
  The run remains paused and one Pause dialog/backdrop correctly remounts over the same
  Canvas at modal layer values, but unconditional `focusBoard()` moves
  `activeElement` to the Canvas outside the active `aria-modal`. Console/page errors
  remain zero and `KeyP` can recover, so this is a P1 focus-ownership defect.
- Accepted correction boundary:
  - in `src/App.tsx`, call the existing board-focus return only when
    `restartWasPlayingRef` proves cancellation returns to playing;
  - for a paused origin, do not focus the Canvas and let the remounted Pause
    ActionSheet own autofocus;
  - extend queued-frame `src/App.test.ts` coverage and production evidence through the
    paused-origin chain;
  - no timer, layout, copy, Core, renderer, or runtime-rule change.

Current state: `P1 CORRECTION 3`; `8f3b72f` is rejected as a Phase-1.5 acceptance
candidate. The next candidate must repeat targeted/full gates, clean build, expanded
production matrix/pixel audit, manifest verification, and both independent QA.

## Accepted correction — state-dependent board return

- Final source candidate: `5ab9e7d`
  (`fix(ui): preserve paused modal focus`).
- Exact correction paths:
  - `src/App.tsx`
  - `src/App.test.ts`
- The restart-cancel transaction now snapshots whether it returns to playing. Only
  that branch resumes and calls the existing board-focus route. A paused origin leaves
  the board paused and lets the remounted Pause ActionSheet own autofocus.
- The queued-frame App test covers the complete paused-origin chain and asserts one
  Pause dialog, focus inside it, and the same one Canvas. Direct App tests pass 26/26;
  typecheck, the full 25-file / 185-test suite, and both 752-module builds pass.
- The first expanded production matrix reported a final `body` focus after closing the
  returned Pause sheet. Three fresh independent Chromium contexts could not reproduce
  a product defect: after 250 ms plus two frames all three restored the exact original
  Canvas with zero dialogs/errors. The evidence sampler was therefore corrected to
  observe the documented two-frame restoration boundary instead of an 80 ms
  intermediate state; no product assertion or timing rule was relaxed.
- Final exact-SHA evidence:
  - 20 browser cases, including desktop and 390 px
    `restart-from-paused-settings`;
  - 18 live-sheet pixel cases with zero failures;
  - one generic final-candidate browser capture;
  - one Canvas / zero DOM cells, zero console/page errors, no overflow;
  - manifest hashes match 5 source files, 122 clean-build files, and 77 evidence files.
- Independent comparison verdicts:
  - `t15_modal_rules_preaudit`: ACCEPT, P0/P1 none;
  - `t15_modal_target`: ACCEPT, P0/P1 none after fresh review of all 20 primary frames;
  - `t15_modal_evidence_integrity`: ACCEPT, P0/P1/P2 none; SHA, timestamps, hashes,
    report sets, clean worktree, and stale-evidence exclusion all close.
- Coordinator disposition: ACCEPT `5ab9e7d`. The three earlier rejected candidates
  remain preserved as narrow rollback checkpoints. Preview/worktree cleanup and the
  non-force remote recovery push remain before Settings may acquire shared paths.

Current state: `ACCEPTED / PUSH PENDING`.

## Resource cleanup and recovery push

- Verified PID `2300` as the exact clean-candidate Vite preview command listening on
  `127.0.0.1:53973`, stopped only that process, and confirmed the port was released.
- Verified
  `C:\Users\Alex Chen\AppData\Local\Temp\tetramorph-modal-17ccc96` as a registered,
  clean detached worktree at exact source `5ab9e7d`, then removed that exact Temp
  worktree. The first removal attempt stopped before deletion because Git and Windows
  path separators differed; the normalized retry repeated all path, HEAD, and status
  checks before removing it.
- Main retained only the user-owned untracked `phase 1.md`; no unrelated path was
  staged. The linear range `dfeb2c9..6b1b76f` was pushed non-force to
  `origin/main`.
- Next action: open the Phase 2 Settings contract from remote recovery point
  `6b1b76f`; do not reopen Phase 1.5 unless a new regression is reproduced.

Current state: `PUSHED / CLOSED`.
