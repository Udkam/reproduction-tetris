# Current Task

## Active slice: T1 — Complete Tetris

Branch: `codex/tetris`

Status: implementation and final local acceptance complete; awaiting coordinator review, commit, and push.

### Delivered outcome

- deterministic seven-piece bag and serializable simulation state
- complete 10 × 20 board, wall kicks, hold, one-piece next preview, ghost, lock delay, scoring, pause, restart, and top-out
- Marathon mode plus deterministic piece-count-driven Race mode
- responsive keyboard input with fast held soft drop and touch-safe controls
- continuous Pixi presentation separated from canonical simulation
- original measured-paper / graphite-well visual system with minimal Chinese UI
- system-driven reduced motion, procedural audio, and one audio preference
- fail-closed bounded local leaderboard
- desktop, portrait, and landscape browser evidence

### Non-goals

- multiplayer, accounts, backend, or online leaderboard
- copied commercial assets, music, fonts, logos, screens, or exact trade dress
- manual pattern/high-contrast or reduced-motion settings
- more than one next-piece preview
- Temple Run implementation on this branch

### Final verification gate

- TypeScript typecheck: passed.
- Vitest full suite: passed, 8 files / 41 tests.
- Production build: passed; main JS 374.56 kB before gzip.
- Browser QA: passed across 10 structured evidence entries.
- One canvas and zero gameplay DOM cells in every geometry capture.
- Zero recorded browser console errors.
- Desktop keyboard soft drop moved 11 rows during hold and stopped at release.
- Mobile touch soft drop moved 7 rows during hold and stopped at release.
- 390 × 844 DPR3 and 844 × 390 DPR3 have no horizontal overflow.
- Race mode selection and its first counted lock passed.
- Game over persisted exactly one valid local leaderboard record.
- Pixi scene-preparation benchmark: 0.20 ms p95 across 160 samples.

After coordinator commit and push, stop for the Tetris branch review before any Temple Run work.
