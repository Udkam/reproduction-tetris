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

- Phase: contract freeze.
- Base SHA: `31cbb13`.
- Planned first source paths: `src/game/audio/audioPalette.ts`,
  `src/game/audio/audioRenderer.ts`, and their direct tests.
- Last verified state: `main` matches `origin/main`; only inherited paths are dirty.

## Next action

Commit the T35 contract checkpoint, then implement the deterministic gesture recipe
and renderer foundation without editing AudioEngine integration yet.
