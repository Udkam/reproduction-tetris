# T36 Kinetic-Harmonic Audio Audition

These mono 48 kHz WAV suites are rendered directly from the production `audioPalette` and deterministic procedural PCM instruments.
The one-shot renderer applies production bus and master gains plus the production compressor threshold and ratio as a static offline transfer. It starts no server, browser, watcher, or audio device.
Source SHA: `39216d18bdf079d676879a0ddde6c5811b70189b`

| File | Duration | Peak | RMS | Clipped samples | Density | Listen for |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 01-controls-fast-repeat.wav | 1.80 s | 0.0387 | 0.0044 | 0 | 5.00 cues/s | Rapid repeated movement, rotation, and soft-drop input; listen for separation without clicky fatigue. |
| 02-contact-and-clear-hierarchy.wav | 6.52 s | 0.2763 | 0.0337 | 0 | 1.23 cues/s | Contact and reward ladder from lock through four-row clear, level-up, and completion. |
| 03-mutation-signatures.wav | 4.43 s | 0.2587 | 0.0387 | 0 | 1.13 cues/s | Short state signatures only: Freeze, Supergravity, Bomb, Double, and Super Double; no sustained loops. |
| 04-survival-and-ui.wav | 6.00 s | 0.1513 | 0.0199 | 0 | 1.50 cues/s | Survival pressure and restrained interface feedback without an ambient bed. |
| 05-countdown-three-pulse.wav | 3.21 s | 0.0937 | 0.0108 | 0 | 0.93 cues/s | Exactly three related countdown pulses; the final pulse is longer and no cover-exit sound follows it. |
| 06-interaction-mix.wav | 6.56 s | 0.2763 | 0.0292 | 0 | 2.59 cues/s | Representative play cadence for masking, stacking, hierarchy, and peak-control review. |

## Cue boundaries

- **01-controls-fast-repeat.wav:** move 0.16-0.21 s; move 0.24-0.29 s; move 0.32-0.37 s; move 0.40-0.45 s; rotate 0.60-0.68 s; soft-drop 0.86-0.91 s; soft-drop 0.98-1.03 s; move 1.18-1.23 s; rotate 1.36-1.44 s
- **02-contact-and-clear-hierarchy.wav:** lock 0.16-0.27 s; hard-drop 0.58-0.77 s; clear-1 1.05-1.27 s; clear-2 1.78-2.05 s; clear-3 2.62-2.98 s; clear-4 3.56-4.28 s; level-up 4.54-4.98 s; finished 5.42-6.16 s
- **03-mutation-signatures.wav:** freeze 0.16-0.64 s; supergravity 1.02-1.50 s; bomb 1.88-2.31 s; multiplier-2 2.78-3.20 s; multiplier-4 3.52-4.07 s
- **04-survival-and-ui.wav:** stone-warning 0.16-0.41 s; stone-spawn 0.72-0.87 s; stone-land 1.18-1.41 s; bedrock-rise 1.72-2.38 s; bedrock-lower 2.72-3.24 s; pause 3.68-3.79 s; resume 4.12-4.24 s; puzzle-undo 4.62-4.75 s; game-over 5.22-5.64 s
- **05-countdown-three-pulse.wav:** countdown-tick 0.20-0.37 s; countdown-tick 1.20-1.37 s; countdown-resolve 2.20-2.49 s
- **06-interaction-mix.wav:** move 0.16-0.21 s; move 0.25-0.30 s; rotate 0.39-0.47 s; soft-drop 0.55-0.60 s; hard-drop 0.78-0.97 s; clear-1 1.18-1.40 s; move 1.72-1.77 s; rotate 1.86-1.94 s; hard-drop 2.08-2.27 s; clear-2 2.46-2.73 s; stone-warning 3.12-3.37 s; stone-spawn 3.48-3.63 s; stone-land 3.82-4.05 s; freeze 4.22-4.70 s; move 4.82-4.87 s; hard-drop 5.08-5.27 s; clear-4 5.48-6.20 s

Human listening remains the acceptance boundary. Measurements verify render integrity, not whether the direction is approved.
