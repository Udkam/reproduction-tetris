# T35 — Audition-Led Material Gesture Audio Rebuild

Status: **CANDIDATE / LISTENING REQUIRED**

## Why this phase exists

T34 met every automated and structural gate but failed the only test that determines
whether a sound design works: listening. Its layered sine/triangle schedules still
read as generic notes, chords, and notifications. T35 therefore treats T34 as a safe
engineering baseline only and replaces its audible language end to end.

## Product claim

TetraMorph sounds like one quiet gravity instrument whose materials respond to force.
Controls are felted and precise, contact has damped mass, rewards open spectral space,
and Mutation effects reshape pressure or texture. No cue should sound pasted in from a
phone UI, retro arcade pack, orchestral jingle, or commercial game reference.

## Implementation slices

1. Define pure, deterministic gesture recipes for modal tap, air sweep, damped impact,
   pressure release, and spatial bloom. Schedule them through the existing five buses.
2. Replace the complete AudioEngine event palette and the pitched theme drone while
   preserving event priority, rate limits, user controls, voice cap, and lifecycle.
3. Render a representative cue matrix to WAV from the production recipes and emit a
   compact measurement manifest. Include control repetition and conflict-resolution
   examples, not only isolated showcase cues.
4. Run one final typecheck, full suite, build, and bounded browser interaction capture.
   Independent QA reviews correctness and evidence provenance.

## Acceptance checklist

- [x] No primary cue identity is an exposed single oscillator note or tonal chord stack.
- [x] Move/rotate/drop remain comfortable under rapid repetition and do not click in
  waveform regression checks; subjective fatigue remains in the listening gate.
- [x] Lock and hard drop use distinct mass envelopes without measured clipping.
- [x] One through four-line clears use distinct contours and increasing spatial scale.
- [x] Ice, Supergravity, Bomb, x2, and x4 are distinct concise cues without sustained loops.
- [x] Survival, UI, countdown, completion, and failure cues share the material language.
- [x] Theme ambience has no stable audible pitch and tears down exactly.
- [x] Playable cue files and measurements are bound to source SHA `f09620e`.
- [x] Typecheck, full suite, build, browser evidence, and independent QA pass.
- [ ] Human listening explicitly accepts the candidate.

Until the final checkbox is satisfied, the correct status is **LISTENING REQUIRED**, not
accepted or complete.
