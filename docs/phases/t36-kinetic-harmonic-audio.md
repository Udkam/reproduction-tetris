# T36 — Kinetic Harmonic Audio Recomposition

Status: **IN PROGRESS**
Base: `052d9ec`
Owner: coordinator
Human acceptance owner: user

## Why this phase exists

T35 passed engineering and evidence gates but failed listening. T36 must replace the
audible recipes while preserving only the mixer, event ownership, priority, volume,
voice ceiling, and lifecycle foundations that already proved reliable.

## Bounded checkpoints

1. Contract and run state only.
2. Deterministic buffered procedural instruments and direct tests.
3. Complete cue palette, AudioEngine integration, and focused hierarchy/lifecycle
   tests.
4. Source-bound WAV audition matrix and measurement manifest.
5. One final typecheck, complete suite, build, and browser evidence pass.
6. Independent read-only QA, coordinator disposition, and push.

## In scope

- All current audio cue recipes and production scheduling.
- Removal of default continuous ambience.
- Playable listening evidence generated from production recipes.
- Tests and evidence needed to prove coverage, determinism, safety, and lifecycle.

## Out of scope

- Gameplay, scoring, controls, rendering, layout, themes, rules, levels, persistence,
  or unrelated visual effects.
- Licensed samples, downloaded music, external audio services, background servers,
  watchers, or permanent browser processes.
- Inherited T27 evidence and `progress.md` changes.

## Acceptance

Automated verification may prove a safe, complete candidate. Only explicit listening
acceptance may close T36. A rejection requires another bounded audio phase; it may not
be relabelled accepted because tests passed.
