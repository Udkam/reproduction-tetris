# Current Task

## Active slice: T1 — Complete Signal Foundry Marathon

Branch: `codex/tetris`

Status: implementation and local acceptance complete; ready for the branch milestone handoff.

### Required outcome

Deliver one complete, polished falling-block Marathon game with:

- deterministic seven-piece bag and serializable simulation state
- 10 × 20 visible board plus hidden spawn rows
- movement, soft drop, hard drop, clockwise/counter-clockwise rotation with wall kicks
- ghost piece and one-use-per-turn hold
- line clears, score, level progression, gravity progression, pause, restart, and game over
- five-piece next queue
- keyboard and touch controls with DAS/ARR behavior
- procedural audio, audio toggle, reduced motion, and high-contrast mode
- responsive desktop/portrait/landscape layout
- local high-score persistence outside the simulation core
- unit tests, deterministic replay test, production build, and browser QA evidence

### Non-goals

- multiplayer
- online leaderboards
- accounts or backend
- copied Tetris logos, music, fonts, art, screens, or exact commercial trade dress
- additional game modes before Marathon acceptance
- any Temple Run implementation on this branch

### Verification gate

T1 is complete only after typecheck, full tests, build, desktop browser interaction, mobile viewport interaction, console inspection, screenshot review, and lifecycle cleanup pass.

After T1 is committed and pushed, stop for the Tetris stage report before beginning `codex/temple-run`.

### Final local evidence

- TypeScript typecheck: passed.
- Vitest full suite: passed, 5 files / 28 tests.
- Production build: passed.
- Browser QA: passed across 10 desktop/mobile/accessibility/performance captures.
- Mobile input: real Chromium touch events passed tap, DAS long-hold, release-stop, pause, and resume gates in portrait and landscape.
- Rendering boundary: one Pixi canvas and zero gameplay DOM cells.
- Browser console errors: zero in every captured interactive context.
- Deterministic four-line clear and real command-driven game-over scenarios: passed.
- Pixi scene-preparation benchmark: 0.30 ms p95 across 160 samples.
- Headless Chromium rAF timing is retained as non-authoritative diagnostic data because the environment throttled it.
