# T35 Audio Rebuild — Run State

## Objective

Replace rejected T34 oscillator-note audio with an audition-led material gesture
system, generate playable proof, and stop before claiming acceptance without human
listening.

## Boundaries

- Repository: `E:\Proj\reproduction-tetris` only.
- Inherited dirty T27 evidence and `progress.md` are read-only and never staged.
- No persistent dev server, watcher, browser automation, indexer, or audio helper.
- At most one heavy command at a time; final full gates run once after the last source
  edit. Browser evidence owns and releases its temporary server.

## Current checkpoint

- Phase: final integration evidence.
- Base SHA: `31cbb13`.
- T35 commits: `a69f81e` contract, `97e8a7c` scheduler, `a781c29` palette,
  `7c40958` engine integration, `a2b424d` onset-click correction.
- Source paths: `src/game/audio/audioGesture.ts`, `src/game/audio/audioPalette.ts`,
  `src/game/audio/AudioEngine.ts`, and their direct tests.
- Focused result: 18/18 audio tests pass after the onset-click correction; the
  earlier post-integration typecheck passed.
- Audition evidence: five production-palette WAV suites at 48 kHz under
  `docs/evidence/t35`; every suite reports zero clipped samples. A one-sample
  Mutation onset spike was reproduced, traced to the default GainNode value before
  scheduled automation, and reduced from `0.8221` to a balanced `0.1696` peak by
  initializing every gesture gain at the inaudible floor.
- Resource evidence: the renderer used one temporary Vite/Playwright batch on port
  4187 and released the browser, server, and listener after each render.
- Inherited T27 evidence and `progress.md` remain dirty and unstaged.

## Next action

Commit the generated audition evidence, then run the single final full validation and
browser-interaction batch before independent read-only QA. Human listening remains a
required acceptance gate, so the candidate must not be labeled accepted automatically.
