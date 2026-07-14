# Tetris T2 Workstream Log

Workstream owner: `/root`

Coordinator: primary task `019f4deb-7e83-7583-8cd5-8e6f075bc331`

Branch/worktree: `codex/tetris` / `E:\Proj\Game-1`

## 2026-07-14 — T2 implementation opened

- Authorized baseline: `0a28a1f4efad72296e46b0a91d859c45cc300edf`, the accepted and pushed
  T1 release.
- Scope: remove Hold end-to-end; distinguish Marathon top-out and score-first rules
  from Race 20-line completion and fixed-tick ranking; build a board-led ready
  surface; version and harden local leaderboard persistence; preserve the accepted
  renderer architecture and input responsiveness.
- Contract state: `DESIGN.md`, `CURRENT_TASK.md`, and
  `docs/qa/TETRIS_ACCEPTANCE.md` have been updated to **in progress** before source
  work. No completion or verification result is claimed by this entry.
- Boundary: `E:\Proj\Game-1-temple` and untracked `docs/screenshots/temple/` are
  explicitly out of scope and must remain untouched.

## 2026-07-14 — Ready visual gate rejected; composition reset in progress

- Coordinator rejected the previous ready composition after screenshot review. Formal
  browser evidence, build, full-suite verification, and commit are paused pending a
  new visual gate.
- Preserved work: Hold removal and the distinct Marathon/Race deterministic rules
  remain in place; this correction is limited to ready-state App, CSS, and renderer
  composition.
- New contract: quiet warm paper with one jade registration line; desktop header plus
  180–220 px mode rail and central board; board-local unboxed ready copy; no ready
  stats, leaderboard, Next, pause, state duplicate, dark modal, cards, mode table,
  or dense explanatory text.
- Mobile contract: two text tabs directly below the header, then the board-local
  ready content without a floating blocker or horizontal overflow.
- Next action: make only 1440 × 900 and 390 × 844 development screenshots with
  structured geometry for coordinator visual review. No formal evidence or commit
  will be produced before approval.

- 2026-07-14: Coordinator pause received. Dirty work is preserved unchanged; no
  further source, visual, verification, evidence, commit, push, or revert action is
  authorized until an approved design artifact SHA/path is supplied.

## 2026-07-14 — D4 production implementation resumed

- Coordinator supplied the approved read-only Offset Drop design artifact
  `7fc81433736e3279f7a7075f0d9054ec31d5c67f` (parent
  `2aea0a0d4a0a33b88f726c76ae1a30ac9276af3`). The design worktree was read only;
  nothing has been cherry-picked or copied as a commit.
- Root `DESIGN.md`, `CURRENT_TASK.md`, and `docs/qa/TETRIS_ACCEPTANCE.md` now mark
  D4 production work **in progress** before source edits. Existing dirty Hold
  removal, Marathon/Race rules, leaderboard work, Puzzle scaffolding, and layout
  corrections remain preserved.
- This resumes only the production D4 scope: complete typed deterministic Puzzle,
  Offset Drop ready/playing/pause/mode-switch layouts, and development visual-gate
  material. Full suite, build, formal evidence, commit, and push remain blocked until
  coordinator visual acceptance.

## 2026-07-14 — D4 development visual-gate material ready for coordinator review

- Implemented the Offset Drop D4 shell on the preserved dirty T2 work: one Pixi canvas
  now uses real board/Next DOM bounds; board-only scrim geometry; board-contained
  pause strip; external frozen mode switch; full three-mode names; and the five
  touch-zone rail. No T. mark, Hold/暂存 surface, visible Z/X help, DOM cells, card,
  modal, glass, jade grid, or fake telemetry was introduced.
- Added typed canonical Puzzle definitions `offset-01` through `offset-03` and
  deterministic public-command coverage for validation, no gravity, rotation success,
  two-piece success, budget failure, and restart/mode identity. Puzzle records remain
  presentation-local storage only.
- Development images and structured bounds are under
  `docs/screenshots/tetris/d4-dev/`; `geometry-summary.json` records 1:2 boards,
  zero reported non-nested intersections, 1 canvas, 0 DOM cells, no overflow, zero
  captured console errors, pause ratios 7.60% / 10.73% / 16.08%, and 58 px / 46 px
  mobile touch zones. The live Puzzle rotation replay hash is `e6936c36`.
- Validation so far is intentionally bounded: `npm.cmd run typecheck`; 44 selected
  core/input/render/leaderboard tests; and 3 runtime/QA tests. Full suite, build,
  formal evidence, commit, push, root changelog, and QA notification remain blocked
  pending coordinator visual approval.

## Recoverable report — TETRIS-T2-001

REPORT TETRIS-T2-001 READY
HEAD 0a28a1f4efad72296e46b0a91d859c45cc300edf; dirty T2/D4 production work, no candidate or commit.
evidence: `E:\Proj\Game-1\docs\screenshots\tetris\d4-dev\geometry-summary.json` plus the ten development PNGs in the same directory.
rules: typed three-Puzzle canonical state/replay; rotation replay hash `e6936c36`; targeted tests 47/47 and typecheck passed.
visual: 1:2 boards; board-contained pause 7.60%/10.73%/16.08%; 1 canvas, 0 DOM cells, no overflow, 0 captured console errors.
blocker: coordinator visual ACK is required; full suite/build/formal evidence/commit remain prohibited.
next: wait for `ACK TETRIS-T2-001` or a bounded correction request.
log: `E:\Proj\Game-1\docs\workstreams\tetris-t2\THREAD_LOG.md`.

## 2026-07-14 — D4 visual ACK; TETRIS-T2 finalization frozen

- Received `ACK TETRIS-T2-001`: coordinator manually reviewed all ten D4 development
  PNGs and `geometry-summary.json`. Offset Drop presentation is approved for the
  final-candidate gate.
- Presentation, copy, layout, color, and gameplay are now frozen. No product source
  correction is authorized or required; the already-passing typecheck and 47 targeted
  tests will be reused.
- Finalization sequence is exactly one full Vitest run, one build, one official
  Playwright evidence capture, rules/replay evidence audit, dirty-path audit, then a
  local unpushed candidate commit. `npm ci` is skipped unless dependency state blocks
  the mandated gates; root changelog and `docs/screenshots/temple/` remain out of
  scope.

## Recoverable report — TETRIS-T2-001A

REPORT TETRIS-T2 TETRIS-T2-001A READY
HEAD=0a28a1f4efad72296e46b0a91d859c45cc300edf; DIRTY=T2/D4 plus 001A, no candidate or commit; pre-existing `docs/screenshots/temple/` untouched.
FIX=Mode-switch now hides the renderer Next layer and clears its prior preview graphics in the same draw; QA snapshot exposes preview-layer/clear bounds and capture pixel-checks the former O region.
TARGETED EVIDENCE=`npm.cmd run typecheck` passed; `npx.cmd vitest run src/game/render/presentation.test.ts src/game/runtime/GameRuntime.test.ts` passed 2 files/5 tests; capture exited 0 (non-blocking Pillow `Image.Image.getdata` deprecation warning only).
SCREENSHOTS=`E:\Proj\Game-1\docs\screenshots\tetris\d4-dev\desktop-mode-switch-1440x900.png`; `E:\Proj\Game-1\docs\screenshots\tetris\d4-dev\landscape-mode-switch-844x390.png`; matching `geometry-summary.json` entries assert `previewLayerHidden=true`, `previewCanvasResidue=false`, `next=null`, 1 canvas, 0 DOM cells, no overflow, and zero console errors.
STATUS=The superseded finalization's full Vitest/build had completed before withdrawal; formal browser capture, rules audit, dirty audit, and commit never started and remain stopped.
BLOCKER=visual re-ACK required; finalization authorization remains withdrawn.
NEXT=await visual re-ACK
LOG=E:\Proj\Game-1\docs\workstreams\tetris-t2\THREAD_LOG.md

## 2026-07-14 — TETRIS-T2-002 superseded; candidate prepared for independent QA

- Coordinator confirmed that the prior `TETRIS-T2-002 BLOCKED` report sampled the
  in-flight formal capture after a tool yield. It is superseded, not a product or
  evidence failure: the existing `browser-evidence.json` completed with
  `result: "passed"`, 16 captures, complete input proof, the Race/Marathon/Puzzle
  terminal captures, puzzle rotation hash `e6936c36`, and zero console/page errors.
- Read-only recomputation found every one of the 16 PNG SHA-256 values in
  `browser-evidence.json` matches its referenced file; no image was recaptured.
  `rules-replay.json` also proves public-command Marathon top-out, 20-line Race,
  all three Puzzle completions, Puzzle budget failure, and mode-separated records.
  `docs/qa/evidence/tetris-t2/SHA256SUMS.md` records both JSON and all PNG hashes.
- Manual review covered desktop/portrait/landscape mode-switch and paused PNGs plus
  Race-finished, Marathon-top-out, and Puzzle-rotation-finished. The mode-switch
  images have no Next/O residue; paused strips remain board-contained.
- Candidate contents intentionally exclude the pre-existing untracked
  `docs/screenshots/temple/` and the independent QA-owned
  `docs/workstreams/tetris-qa/THREAD_LOG.md`. Root `docs/logs/CHANGELOG.md` is
  untouched. This workstream awaits a local, unpushed candidate commit and then
  independent QA; it does not claim release acceptance.

## Recoverable report — TETRIS-T2-002

REPORT TETRIS-T2 TETRIS-T2-002 BLOCKED
HEAD/PARENT/CANDIDATE=0a28a1f4efad72296e46b0a91d859c45cc300edf / c13961d9a079c7d6928471b7cb32ee0700d408c0 / none; T2/D4 dirty work remains uncommitted and `docs/screenshots/temple/` untouched.
EXACT PATHS=`E:\Proj\Game-1\docs\qa\evidence\tetris-t2\rules-replay.json`; `capture-browser-final.py`; partial PNGs `desktop|portrait|landscape-{ready,playing,paused,mode-switch}.png` in that directory.
RULE EVIDENCE=`rules-replay.json` passed: public-command Marathon top-out, Race 20-line finish, `offset-01..03` completion, Puzzle budget game-over, and mode-separated leaderboard records; final browser rotation-hash proof is absent because capture did not complete.
BROWSER EVIDENCE=the one formal capture reached and wrote exactly 12 viewport/state PNGs (including all three mode-switch states, manually rechecked without Next/O residue) but produced no `browser-evidence.json`, no input evidence, and no Race/Marathon/Puzzle terminal PNGs.
GATES=pre-fix same-worktree full Vitest 47/47 and one build passed; post-fix typecheck and renderer/runtime 2 files/5 tests passed; no npm ci, repeat full test, or repeat build.
FAILURE=the sole capture invocation emitted only `DeprecationWarning: Image.Image.getdata is deprecated`; its missing required JSON proves the capture stopped after the 12 state screenshots and before input/terminal evidence. It was not rerun.
BLOCKER=official browser-evidence completeness gate failed; no dirty-path audit, candidate commit, push, or further capture was performed.
NEXT=await coordinator direction
LOG=E:\Proj\Game-1\docs\workstreams\tetris-t2\THREAD_LOG.md
