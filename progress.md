Original prompt: separate Tetris into E:\Proj\Game-1-tetris, diagnose the mixed Temple/Tetris history and local QA copies, then correct the tiny and overlapping Tetris presentation without changing accepted game rules.

## 2026-07-15

- Created standalone Tetris repository and retained QA clones under `.local/qa-archives`.
- Isolated stale pre-V1 `dist` outside the active repository.
- Confirmed `4c85828` is the last pure Tetris integration point; later commits are docs-only coordination changes.
- Confirmed the screenshots use the accepted V1 source, not an alternate version.
- Root cause: 718 px shell cap, 306 px board cap, 174 px three-mode rail, and five controls forced into 306 px.
- Implemented the bounded T4 desktop layout recovery: 380 × 760 at 1440 × 900,
  460 × 920 at 2048 × 1152, complete Chinese mode labels, stacked control
  glyphs/labels, and the corrected pause-height ratio.
- Final local gates passed once: typecheck, 36-file/234-test Vitest, build, and a
  19-capture browser matrix under `docs/qa/evidence/tetris-t4/`.
- Active TODO: independent QA, coordinator changelog integration, and one push.

## 2026-07-16 — T5 opened

- User rejected the T4 Mineral Shelf presentation and requested a full light cyan/light-blue rebuild with a dedicated three-mode entry page.
- Race changed from a 20-line finish to endless accelerating normal play; only explicit exit or top-out ends the run.
- Puzzle changed to all levels available, no numeric-difficulty gating, longer non-obvious authored queues, and a hard requirement that consecutive pieces continue.
- Root-cause audit found Puzzle soft drop can reach the floor but never lock because puzzle ticks return before grounded lock-delay handling.
- Preserved the rejected T4 follow-up on local branch `codex/tetris-t4-rejected-preservation` at `1362c664629b2a83f0659f836259b84c21750fee`, then returned to a clean `codex/tetris-recovery` tree.
- T5 uses the `4c85828` deterministic core/rule authority while retaining `dd7e31e` only as a historical ancestor.
- Active TODO: implement and independently verify T5 core, then Aqua Blueprint frontend, then one combined final gate/evidence pass and final QA.
