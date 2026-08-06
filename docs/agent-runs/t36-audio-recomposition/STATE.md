# T36 Audio Recomposition — Bounded State

## Objective

Replace the rejected T35 audible palette with the T36 kinetic-harmonic buffered
procedural instrument system, then provide source-bound playable evidence for human
listening.

## Immutable base and boundaries

- Base SHA: `052d9ec`.
- Branch: `main`.
- Preserve: five buses, priorities, master controls, sixteen-voice ceiling, event
  suppression, deterministic ownership, and teardown.
- Do not touch or stage inherited dirty `docs/evidence/t27/**`,
  `docs/evidence/t27-r1-followup/**`, or `progress.md`.
- No gameplay, renderer, layout, rule, level, or scoring changes.
- Companion visual scope is limited to removing the Mutation-status heading glow while
  preserving its text, placement, theme contrast, and active-state content.
- No persistent server, browser, watcher, Serena, or external audio dependency.

## Confirmed facts

- T35 passed automated gates and independent QA but failed human listening.
- Its audible `resonator + air` recipes are rejected; parameter-only adjustment is not
  an acceptable redesign.
- The new vocabulary is felt, impact, ribbon, glass, shimmer, and pulse, rendered into
  deterministic short AudioBuffers.
- Default continuous ambience is removed; the Ambient bus remains available.

## Checkpoints

1. `COMPLETE` — contract commits `ccd664d`, `6574b7e`, and `1cd3926`.
2. `COMPLETE` — buffered procedural instrument foundation + focused tests.
3. `COMPLETE` — complete procedural palette + silent-by-default engine integration.
4. `PENDING` — isolated Mutation-status heading-glow cleanup.
5. `PENDING` — WAV evidence + measurements.
6. `PENDING` — final gates, browser evidence, independent QA, docs, push.

## Verification state

- `npm.cmd run test -- src/game/audio/audioGesture.test.ts`: 5 tests passed.
- `npm.cmd run typecheck`: passed after the instrument foundation.
- `npm.cmd run test -- src/game/audio/audioGesture.test.ts src/game/audio/audioPalette.test.ts`: 10 tests passed after the complete procedural palette replacement.
- `npm.cmd run typecheck`: passed after the complete procedural palette replacement.
- `npm.cmd run test -- src/game/audio/AudioEngine.test.ts src/game/audio/audioGesture.test.ts src/game/audio/audioPalette.test.ts`: 20 tests passed after removing the persistent ambient bed and updating engine-level T36 contracts.
- `npm.cmd run typecheck`: passed after the silent-by-default engine integration.
- Human listening is the final acceptance boundary.

## Next exact action

Commit the silent-by-default engine checkpoint, then remove only the visual glow behind
the Mutation-status heading without changing its content or layout.

## Do not repeat

- Do not re-audit T35 infrastructure or replay its full logs.
- Do not rerun final suites before the final source change.
- Do not treat metrics, screenshots, or QA as listening acceptance.
