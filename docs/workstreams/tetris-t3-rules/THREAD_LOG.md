# Tetris T3R Puzzle Rules Workstream Log

- Workstream: `TETRIS-T3-RULES`
- Coordinator thread: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Scope: design-only contract, campaign levels, command replays, and a workstream-local
  verifier. No production source, root document, existing evidence/log, QA log, or
  Temple path may be edited.
- Base: `0700faffe6f50aa49af2fef81f07f90113bd7c70` on `codex/tetris`.

## Recoverable report — TETRIS-T3R-001

REPORT TETRIS-T3-RULES TETRIS-T3R-001 READY
HEAD=0700faffe6f50aa49af2fef81f07f90113bd7c70; DIRTY=only pre-existing untracked `docs/screenshots/temple/`, untouched.
AUDIT=current Puzzle has three sparse-cell definitions, fixed finite queue, public SRS commands, immediate Puzzle line resolution, and disabled tick gravity.
SEMANTIC DELTA=current success is `lines >= puzzleTargetLines`, not visible-board empty; validator permits an empty authored board; canonical state has no explicit queue index, level progress, or campaign unlock.
LATER PRODUCTION DELTA=typed 20-row level schema plus level index/queue index/goal-empty/campaign completion state; empty-board predicate after normal clear; fail ordering for top-out/invalid spawn/queue exhaustion; hash/replay coverage.
NEXT=author a six-level clean-room campaign and a faithful workstream adapter/verifier using only current public core commands, then report a design-only candidate.
LOG=E:\Proj\Game-1\docs\workstreams\tetris-t3-rules\THREAD_LOG.md

## Verification iteration

- Targeted command first run: `npm.cmd run test -- docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts`.
- Exact result: 12 passed / 1 failed. The residual-completion negative fixture placed its residual
  cell in the I-piece descent channel, so current public core correctly returned `game-over`
  (`puzzle-budget`) before the intended legacy line-target branch.
- Safe correction: move that fixture's residual cell to the opposite edge; no production/core
  code or campaign fixture changed. One rerun of the same targeted verifier is required.

## Candidate preparation

- Verified base SHA: `0700faffe6f50aa49af2fef81f07f90113bd7c70` (`codex/tetris`).
- Added only workstream-local files: `PUZZLE_RULES_CONTRACT.md`, `LEVEL_SET.md`,
  `levels.json`, `REFERENCE_REPLAYS.json`, `VISUAL_DATA_HANDOFF.md`, and
  `tests/campaign.verifier.test.ts`.
- Targeted verifier (safe rerun after the fixture-only correction):
  `npm.cmd run test -- docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts`
  → `1 passed` file, `13 passed` tests. Coverage: six real command replays plus
  non-empty-board, queue mismatch, invalid spawn/top-out, exhausted budget, stale hash,
  and residual-cell false-positive rejection.
- No npm ci, full Vitest, build, browser, screenshot, production/root-doc, or Temple action.
- Remaining production delta: implement the proposed typed 20-row loader/validator,
  canonical level/queue-index/completion/unlock state, board-empty completion ordering,
  and production replay/hash tests. This workstream does not apply that source change.

## TETRIS-T3R-002 conditional-review correction

- Coordinator review kept the design-only boundary but rejected the former 3-piece levels
  4–6 and visible-only oracle as insufficient for the high-difficulty campaign contract.
- Replaced levels 4–6 with `t3r-shaft-04` (five unequal I shafts, five locks) and
  `t3r-cascade-05` / `t3r-cascade-06` (five-piece, distinct-queue cavity cascades).
  All authored boards remain non-empty 20 × 10 boards and contain no complete starting row.
- Strengthened the contract and verifier to require full canonical-board emptiness,
  hidden-buffer top-out detection, exact queue/budget consumption, valid command phases,
  effective rotations, distinct landing columns, event/command digests, conservation,
  terminal-tail rejection, and two fresh deterministic replays.
- Only the workstream Vitest file will be run after this fixture/verifier rewrite; no production
  source, root document, full suite, build, browser, push, or Temple path action is authorized.
- First targeted attempt after the rewrite: 4 passed / 14 failed before replay because the
  complete-row guard was inverted and rejected every non-empty row. The correction changes only
  that verifier predicate; no level, replay, production, or root file changed. One safe rerun of
  the same command is required.
- Safe rerun: 17 passed / 1 failed. The unused-tail negative reached a stale-initial-hash check
  before queue-consumption auditing. The verifier now audits exact locks, budget, piece count,
  and remaining queue before hashes, which proves the required failure cause. One final same-file
  rerun is required; no gameplay fixture changed.
- Final same-file rerun: `1 passed` test file, `18 passed` tests. This is the sole completed
  workstream test gate after the correction sequence; no full Vitest, build, browser, or source
  change was run.

## TETRIS-T3R-004 bounded QA correction

- QA-001 found one P1: the high-difficulty assertion allowed two distinct landing columns while
  the frozen invariant requires at least three. The existing replay data is already `5/4/3` for
  levels 4–6, so no level or replay artifact changed.
- The verifier now fails closed at `distinctLandingXs >= 3` for levels 4–6. A single same-file
  targeted run follows this last edit; no production, D5, Temple, package/config, root changelog,
  full suite, build, browser, npm ci, or push is authorized.
- Targeted result: `npm.cmd run test -- docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts`
  → `1 passed` file, `18 passed` tests. The verified high-difficulty landing counts remain
  level 4 = 5, level 5 = 4, level 6 = 3.
