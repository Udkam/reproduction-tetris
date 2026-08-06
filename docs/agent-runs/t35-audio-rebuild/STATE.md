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

- Phase: candidate handoff; human listening pending.
- Base SHA: `31cbb13`.
- T35 commits: `a69f81e` contract, `97e8a7c` scheduler, `a781c29` palette,
  `7c40958` engine integration, `a2b424d` onset-click correction, `3fe677c`
  production audition evidence, `be951a4` browser acceptance harness, `0a04479`
  countdown-aware evidence correction, `ff17f83` final browser record, `f09620e`
  source-bound audition manifest, and `30501c3` regenerated bound evidence.
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
- Final source gates: `npm.cmd run typecheck` passed; the full `npm.cmd run test`
  batch passed 378 tests with 8 skips across 40 passed and 2 skipped files; the
  production `tsc -b && vite build` refreshed `dist` and all 10 HTML asset references
  resolve.
- Browser evidence: `docs/evidence/t35/browser/browser-audit.json` identifies source
  `0a04479`, Chromium 149, one running `AudioContext`, one gameplay canvas, zero DOM
  cells, the `deep-tide` theme, working audio enable/disable and 72% volume controls,
  and zero console/page errors. The first automation attempt was rejected during
  visual review because it captured the countdown before attachment; the corrected
  harness now requires the countdown to become visible and then detach. The final
  gameplay image shows the active board after countdown and input. Port 4188 has no
  remaining listener.
- Inherited T27 evidence and `progress.md` remain dirty and unstaged.
- Independent read-only QA reports no blocking finding and no P0/P1/P2 issue. Its one
  P3 finding requested a source SHA inside the portable audition manifest; `f09620e`
  and `30501c3` resolve that provenance gap without reopening product source.

## Next action

Ask the user to listen to the five candidate WAV suites, focusing on control fatigue,
drop/lock distinction, 1–4 clear escalation, Mutation identity, countdown cadence, and
mixed-cue masking. Record explicit acceptance or concrete rejection feedback; do not
label T35 accepted from automated evidence alone.
