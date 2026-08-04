# T29 — Complete SFX Remaster

Status: accepted from `main@dfb9fbb7ea49e8a28938ee385a60406d46e65b19`
through candidate `abce548`.

## Product intent

Make TetraMorph's complete procedural feedback mix legible by feel. High-frequency
controls should be concise; physical interactions should have body; clears, mutations,
and terminal outcomes should deliver increasingly strong positive or cautionary
feedback. The repair is not a blanket volume increase and does not add music or samples.

## Phase A — freeze the mix contract

- Inventory every event currently routed through `AudioEngine`.
- Define control, state/hazard, and reward/resolution tiers plus same-frame ownership.
- Keep the existing AudioContext, volume setting, sixteen-voice limit, deterministic
  procedural sources, and lifecycle contract.

## Phase B — remaster schedules and dynamics

- Restore transient contrast in the master/compressor path without clipping.
- Give move, drop, rotate, lock, undo, pause/resume, and countdown concise identities.
- Build monotonic 1/2/3/4-line reward profiles and distinct level/finish/game-over cues.
- Rework Survival and Mutation materials while preserving their deterministic event
  mapping and the single bounded Supergravity ambience.
- Add direct tests for schedules, relative energy, priority, rate limiting, and cleanup.

## Phase C — focused correction and final gates

- Run the direct AudioEngine suite and typecheck; correct only demonstrated audio gaps.
- After the last source edit run one typecheck, full suite, and production build.
- Run one bounded browser audit of live routing, enable/volume behavior, countdown
  ownership, one-Canvas topology, zero browser errors, and teardown.

## Phase D — independent acceptance and publication

- Obtain read-only QA for the complete candidate range.
- Resolve any P0/P1/P2 finding with a separate audio-only correction checkpoint.
- Record final evidence and changelog status, scan the scoped range for secrets, push
  `main` without rewriting history, and release all task-owned resources.

## Rollback

The contract, source/test, evidence, and closure are separate exact-path commits. The
audio source commit can be reverted without touching T28 visuals, Core, UI, themes, or
the inherited T27 evidence tree.

## Accepted outcome

- Product source `ca5da48` remasters the complete procedural SFX hierarchy while
  preserving the sixteen-voice ceiling, event ownership, volume path, and lifecycle.
- Evidence `abce548` binds to that source and proves 2/3/4/5 clear voices, a 12-voice
  dense Mutation batch, live enable/volume/suspend routing, one Canvas, zero browser
  errors, and all 31 observed AudioContexts closed exactly once.
- Focused audio tests pass `29/29`; final typecheck, the complete suite (`365 passed / 3
  skipped`), and the 759-module production build pass with only the existing bundle-size
  advisory.
- Independent read-only QA accepts `dfb9fbb7..abce548` with P0 0 / P1 0 / P2 0 / P3 0
  and confirms inherited T27 evidence is absent from the candidate.
