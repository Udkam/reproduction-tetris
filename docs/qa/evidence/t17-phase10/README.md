# T17 Phase 10 browser evidence

Source-bound evidence for `7f45c55ccfea1cdf50a785bf249d1cec831473ac`.

## Scope

- Home: Chinese/English typography, four-mode composition, hover reset, desktop and landscape layout.
- Classic: normal play, visible Next behind the leave dialog, restart confirmation and restarted countdown, ranked and unranked results.
- Survival: continuous three-step bedrock entry, hidden countdown preview, one- and two-stone natural events, cave materials, time-first result.
- Mutation: item-bearing Next piece, simultaneous Ice/Supergravity/multiplier states, Supergravity settlement, expiry restoration, score-first English result.
- Puzzle: deterministic six-piece completion, first-clear, new-record and slower-replay outcomes, persisted completion/best count, square 25-card pages, keyboard page switching, portrait and landscape layout.
- Fonts: packaged local resources only, all expected families loaded, stable geometry after `document.fonts.ready`.

The machine-readable observations are in `browser-evidence.json`. `MANIFEST.sha256` binds every screenshot and metadata file in this directory.

## Capture contract

- The browser batch used one local Vite server and one headless Chrome instance.
- Gameplay used visible controls and the public runtime QA command surface only; no state replacement or fabricated result state was used.
- Reduced-motion behavior was included in the portrait Puzzle outcome capture.
- Browser console errors and page errors were both zero.
- After capture, Chrome was closed and ports `4178`, `5178`, and `5179` were released.

## Result

The captured candidate meets the Phase 10 interaction, responsive-layout, persistence, renderer, typography, and resource-lifecycle acceptance criteria. Independent QA disposition is recorded separately in the workstream log and changelog after review.
