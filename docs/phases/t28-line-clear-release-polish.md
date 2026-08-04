# T28 — Ordinary Line-Clear Release Polish

Status: accepted on 2026-08-04 from
`main@17d4f82e0474f7417a261fea0aa6d41cd230fc9a` through candidate `9784b1b`.

## Product intent

Make an ordinary clear readable by feel before the player reads the score: one line is
precise, two resonate together, three cascade, and four deliver the sole signature
reconstruction moment. The family remains quiet enough for repeated play and uses the
active theme/material instead of assigning a new rainbow by count.

This is a finishing pass, not a new effects framework. It keeps deterministic Core,
the fixed 200 ms clear phase, current modes and Puzzle campaign, procedural WebAudio,
React/Pixi ownership, one Canvas, persisted reduced motion, and current themes.

## Phase A — contract and pure profiles

- Define valid count profiles for `1..4`, invalid-count refusal, fixed normal/reduced
  timing, fragment ceilings, and post-commit tail limits.
- Define the conflict order: Bomb, Mutation activation, Puzzle completion, four, three,
  two, one.
- Prove mappings and deterministic presentation helpers without touching Core.

## Phase B — board-local visual grammar

- Extend the current stationary face release into Precision Cut, Dual Resonance,
  Cascade Fracture, and TetraMorph profiles.
- Keep cells readable; use only inset faces, narrow glints, tiny deterministic chips,
  and a bounded low-alpha tail.
- Exclude anchors and permanent bedrock, cap live tail cues at four, and clear all cues
  on restart, undo, and renderer destruction.
- Reduced motion is simultaneous stationary brightness with no chips or tail.

## Phase C — clear-forward procedural audio

- Replace the rejected sparse clear chord with four rounded but present schedules whose
  onset, harmonic body, and release make every clear obvious without becoming harsh.
- Give 1/2/3/4 clears 2/3/4/5 bounded voices and an increasing consonant spread. Avoid
  noise, boom, distortion, metallic transients, alarm contours, and master-volume jumps.
- Rebalance the existing move, soft-drop, rotate, lock, hard-drop, countdown, system,
  Survival, and Mutation cues so they remain readable but do not mask resolution feedback.
- Suppress routine landing/lock audio when an ordinary clear owns the same batch; suppress
  ordinary clear audio when a Mutation activation owns it; refuse invalid counts without
  allocating a voice. Keep the total beneath the current 16-source ceiling.

## Phase D — conflict and lifecycle proof

- Verify Survival stone material, Mutation dim/suppression, Bomb non-triple behavior,
  Puzzle restraint/completion order, anchor exclusion, pause/restart/undo/destroy, and
  reduced motion.
- Correct only demonstrated integration gaps; do not broaden into Core or UI work.

## Phase E — final evidence and acceptance

- After the final source edit, run one typecheck, complete test suite, production build,
  and real browser evidence pass.
- Capture 1/2/3/4 clears at representative timing points in full motion, then reduced
  motion and Survival/Mutation/Bomb/Puzzle conflict states.
- Prove one Canvas, zero DOM board cells, zero console/page errors, bounded resources,
  and released browser/server ownership.
- Request independent read-only QA on the exact candidate range. Only the coordinator
  may then record acceptance, update the changelog, and push.

## Acceptance record

- Product source `2c4e4ae` closes the only independent-QA defect by ending every
  reduced-motion and Puzzle clear face exactly at its declared 100/117/133/133 ms
  boundary; direct renderer tests cover the frame before and the cutoff frame.
- Evidence commit `9784b1b` binds the live Classic run, four full-motion profiles, four
  reduced profiles, and Survival/Mutation/Bomb/Puzzle conflict frames to that source.
  Its audit reports one Canvas, zero DOM cells, zero browser errors, zero failures, and
  successful renderer teardown.
- Final gates pass: typecheck, complete Vitest suite (`359 passed / 3 skipped`), and the
  759-module production build. The existing large-chunk warning remains visible and was
  not hidden as part of this polish slice.
- Independent read-only QA accepted the final candidate with P0 0 / P1 0 / P2 0 / P3 0.
