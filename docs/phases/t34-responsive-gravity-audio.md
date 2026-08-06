# T34 — Responsive Gravity Instrument Audio

Status: active from `main@4593acf`.

## Product intent

Turn the existing procedural cue collection into one authored sound world: a calm,
responsive gravity instrument. The mix should feel soft-edged and precise during
continuous control, physically grounded at contact, and harmonically wider when the
player earns a larger result. It must remain recognizably TetraMorph without music or
borrowed commercial audio.

## Phase A — architecture and proof surface

- Introduce Gameplay, Reward, Mutation, Ambient, and UI buses beneath the current
  effects/master/compressor path.
- Add reusable layered-cue primitives for a primary oscillator, secondary harmonic,
  deterministic filtered texture, and quiet delayed spatial tail.
- Keep sixteen transient voices as a hard ceiling; ambient sources are separately
  owned, bounded, and stopped on disable/destroy.
- Add direct observability for routing, schedules, bus gain, and cleanup without
  weakening production encapsulation.

Rollback: revert the foundation source checkpoint; no event palette, renderer, Core,
or UI behavior belongs in this commit.

## Phase B — priority feedback palette

- Recompose single, double, triple, and four-line clears with unmistakable contours and
  increasing duration/harmonic width.
- Separate hard-drop body from ordinary lock settle resonance.
- Recompose Ice, Supergravity, Bomb, x2, and x4 activation as short one-shot material
  gestures; preserve canonical activation ordering and no sustained Mutation sound.
- Prove same-frame suppression, unique-item deduplication, reward hierarchy, and bounded
  dense batches.

Rollback: revert the priority-palette source checkpoint while retaining the bus
foundation.

## Phase C — secondary cues, ambience, and runtime bridge

- Align move, rotate, soft drop, pause/resume, Survival rise/warning/landing, and UI
  confirmation/modal cues to the same soft-material grammar.
- Add three extremely quiet procedural ambient profiles: Deep Tide low breath, Mineral
  Mist airy haze, and Sunstone warm harmonic bed. These are room tones, not songs.
- Synchronize the already-selected visual theme through the smallest GameRuntime bridge
  and prove that switching, muting, restarting, and unmounting cannot leak sources or
  AudioContexts.

Rollback: revert the secondary/runtime checkpoint without changing event semantics or
theme persistence.

## Phase D — acceptance and publication

- After the final source edit: run exactly one final typecheck, one full suite, and one
  production build.
- Run one bounded browser-evidence batch against the final candidate; verify one Canvas,
  zero console errors, audio enable/volume, all three themes, and teardown.
- Obtain independent read-only QA for the complete candidate range, resolve any finding
  in a new bounded source checkpoint, then record evidence, changelog, acceptance, and
  push `main`.

## Explicit exclusions

- No licensed/sample-pack content, music, renderer effect redesign, gameplay rule
  change, scoring change, new Mutation item, Puzzle curriculum change, or Survival
  timing change.
- No watcher, persistent index, browser kept open after evidence, or unrelated cleanup.
- Inherited T27 evidence and `progress.md` remain untouched and unstaged.
