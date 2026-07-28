# T15 Phase 3 HUD Workstream Log

## 2026-07-28 — contract and baseline checkpoint

- Task ID: `T15-PHASE3-HUD-CONTRACT`.
- Coordinator thread: `/root`.
- Rollback base: `6892f802c819015ed978cd24b714bbdf2d5a5caf`.
- Status: `CONTRACT`; no product source has changed and no candidate exists.
- Documentation paths:
  - `docs/CURRENT_TASK.md`
  - `docs/DESIGN.md`
  - `docs/phases/README.md`
  - `docs/phases/phase 3.md`
  - `docs/phases/phase 5.md`
  - `docs/workstreams/tetris-t15-coordinator/PHASE_MATRIX.md`
  - this log
- Read-only comparison work:
  - `/root/t15_hud_rules_preaudit` mapped responsive visibility, semantics, input,
    lifecycle, and direct-test gaps;
  - `/root/t15_hud_css_map` mapped the active DOM/CSS/renderer ownership and recommended
    one final `hud.css` authority layer after Mutation VFX;
  - the coordinator measured all four live modes at desktop, portrait, and short
    landscape and reproduced the real touch-hit failure.
- Baseline evidence remains ignored under
  `.local/audits/t15-phase3-baseline/`; it is diagnostic evidence only and may not be
  reused as final-candidate proof.
- Contract decision: split DOM/input/accessibility, spawn presentation, and final HUD
  CSS into separate checkpoints. Exclude Core, mode materials, Puzzle definitions and
  Puzzle selector composition.
- Later-phase addendum captured while this contract was written:
  - player-facing `冻结` becomes `冰冻`;
  - Ice auto-gravity is 1 second/cell for ten seconds, not a complete stop;
  - attachment recognition must work in active, locked, and Next states without
    relying on colour alone;
  - Collapse removes the ten-column/top horizontal strip and uses affected-column
    gravity feedback;
  - shared ordinary line-clear refinement is deferred to Phase 6, outside HUD scope.
- Commands actually run: read-only Git state/log inspection; UTF-8 reads of
  `AGENTS.md`, `docs/DESIGN.md`, `docs/CURRENT_TASK.md`, phase briefs, commit policy,
  latest changelog, and relevant T15 logs; `rg` terminology search.
- Tests/build: not run because this checkpoint changes documentation only.
- Blocker: none.
- Next action: commit this documentation-only contract, then implement the Phase 3
  DOM/input/accessibility checkpoint without entering Phase 4/5 product paths.
