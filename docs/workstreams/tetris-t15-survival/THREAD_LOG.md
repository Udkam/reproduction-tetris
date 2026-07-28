# T15 Phase 4 Survival Workstream Log

## 2026-07-28 — contract opened

- Task ID: `T15-PHASE4-SURVIVAL-CONTRACT`.
- Coordinator: `/root`.
- Pushed rollback base: `1383fca794cba150d373597a21d6686a02922b02`.
- Status: `CONTRACT`; no Phase-4 product source has changed and no candidate exists.
- Frozen behavior:
  - three rows of the accepted brown bedrock at session start;
  - bedrock rise interval `13→6` seconds and one-row removal per three cleared lines;
  - independent `20→10` second stone clock, one or two stones per event, approximately
    1.5× ordinary fall speed, clear/scoring participation, and seven-bag RNG isolation;
  - fair column warning, readable dual clocks, reduced-motion endpoint, and Survival
    records limited to survival time, cleared lines, and date.
- Required checkpoint order: Core/determinism → Pixi renderer/material → DOM HUD →
  final candidate/evidence. Later writers may not start before the prior checkpoint
  is committed and handed off.
- Excluded: Mutation, Classic, Puzzle selector/data, Settings, audio, dependencies,
  packaging, a second Canvas, and a DOM board.
- Commands run for this checkpoint: documentation consistency search and
  `git diff --check`; no product tests/build are required for a docs-only transition.
- Blocker: none.
- Next action: perform a read-only path and behavior audit, freeze exact writer-owned
  files, then begin the Core checkpoint.
