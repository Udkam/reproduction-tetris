# T13 Coordinator Workstream Log

## 2026-07-25 — TETRIS-T13.14 second Settings macro-layout and live-overlay correction opened

- State change: player review rejects `fe6db5f..7ab0886` and its local evidence
  `e87b62f`. The top controls/keyboard grid still leaves a structural empty quadrant;
  local compactness measurements did not test this macro-layout failure. The interrupted
  renewed QA must not be used for acceptance.
- Added scope: Settings, pause, restart, and exit sheets must retain a visibly dimmed
  live Pixi board rather than hiding the canvas. Puzzle's detached `1/2` legend must
  become two individually bounded in-well labelled forecast segments, without changing
  queue order or Core simulation.
- Exact new product/test boundary: `src/App.tsx`, `src/App.test.ts`, `src/styles.css`,
  `src/game/render/TetrisRenderer.ts`, and only a directly necessary renderer test.
  The macro layout becomes full-width intrinsic bands (control, keyboard, rules,
  record), not equal-height columns or a spacer. `package-lock.json` remains inherited,
  unstaged, and untouched.
- Next: commit this contract, make the focused UI/renderer checkpoint and targeted
  tests, then repeat the full visual matrix with explicit assertions for visible modal
  board pixels and one label per preview segment before requesting a fresh read-only QA.

## 2026-07-25 — TETRIS-T13.14 post-QA Settings-density correction opened

- State change: coordinator read the independent **PASS — ACCEPT** task report and
  durable `abc0f25` log for frozen candidate `225aa1c..e9db541`. The following player
  screenshot then exposed a real visual acceptance defect: oversized Settings cards
  and structural whitespace in the controls/keyboard/rules/empty-record layout.
- Scope: pause release/push and reopen only `src/styles.css` plus directly necessary
  Settings markup/tests and the current task/design/progress/coordinator records. The
  repair must use content-sized shared bands, not merely shrink text or hide content;
  it must cover every mode, Chinese/English, desktop, portrait, landscape, and reduced
  motion. The accepted non-Settings mechanics and user-owned `package-lock.json`
  remain untouched.
- Next: commit this amended contract before source, make one focused UI checkpoint,
  repeat the final visual matrix and gates proportionate to the repair, then request a
  fresh independent read-only acceptance before any push.

## 2026-07-25 — TETRIS-T13.14 Settings-density candidate verified, QA pending

- Task/base/candidate: `TETRIS-T13.14-DIRECT-CLARITY-AND-SURVIVAL-STONES`; accepted
  pre-correction source `e9db541`, reopened contract `70c080d`, and focused source
  candidate `fe6db5f..7ab0886`. The reviewable source paths are exactly
  `src/App.tsx`, `src/App.test.ts`, and `src/styles.css`; the inherited user-owned
  `package-lock.json` remains modified but never staged or read as product evidence.
- Delivery: the first source checkpoint marks an empty Settings leaderboard explicitly,
  compresses controls/keyboard/rules to their real content, fixes Survival's former
  3 + 1 rule grid to 2 × 2, and preserves a normal populated table. The second catches
  and fixes a real 844 × 390 defect: the previous compact sheet placed its record edge
  at viewport y=389. Its short-landscape scale now keeps every Settings band visible.
- Commands actually run after the last source repair: focused `npm.cmd run test --
  src/App.test.ts` (22/22), `npm.cmd run typecheck`, full `npm.cmd run test` (22 files /
  165 tests), `npm.cmd run build` (746 modules), the prescribed
  `web_game_playwright_client.js`, and ignored local
  `.local/audits/t13.14/settings-density-audit.mjs`.
- Browser evidence reviewed: the final audit covers 21 Settings states—desktop
  Chinese/English across all four modes, one populated Classic record, reduced-motion
  Chinese across all four modes, and Chinese portrait/landscape across all four modes.
  It asserts zero console/page errors and horizontal overflow, content-bottom slack at
  most 3 px, correct rule grid dimensions, compact empty-record rows, modal canvas
  hide/restore, motionless reduced-motion sheets, and a bottom margin in short
  landscape. Representative Chinese Survival, English Mutation, portrait Puzzle,
  reduced-motion Survival, and short-landscape Survival captures were visually
  inspected. The skill-client screen also shows the restored count-2 overlay on the
  real Survival board.
- Blocker/next action: source and first-party evidence are frozen, but no renewed
  independent disposition exists. Request a read-only QA review of `70c080d..7ab0886`;
  do not update the acceptance changelog or push until that verdict is read.

## 2026-07-25 — TETRIS-T13.14 final evidence checkpoint

- Task/base/candidate: `TETRIS-T13.14-DIRECT-CLARITY-AND-SURVIVAL-STONES`; contract
  base `225aa1c`, source/evidence candidate `e9db541`. The source chain comprises the
  entry and rail UI, music removal, Mutation refresh/material/feedback work, the
  atomic typed Survival-stone bridge, and the two final modal/reduced-motion repairs.
  The user-owned `package-lock.json` remains the sole inherited dirty path and was
  neither modified nor staged.
- Commands actually run after the last source edit: `npm.cmd run typecheck`,
  `npm.cmd run test` (22 files / 165 tests), `npm.cmd run build` (746 modules),
  `web_game_playwright_client.js` against the project listener, plus ignored real
  Playwright audits for Settings/music, Mutation, Survival stones, Puzzle Next/Z undo,
  Puzzle detail alignment, and reduced motion.
- Evidence reviewed: the 16 settled Settings captures cover desktop Chinese/English
  and portrait/landscape Chinese for all four modes, with zero errors/overflow and no
  music controls; the modal canvas is hidden only during a sheet and returns after
  dismissal. Mutation captures cover every carrier and Freeze/Collapse/Bomb/Multiplier
  result. Survival captures show one chipped clearable stone spawning at y=20 then
  falling to y=21 at the 3:2 cadence over three chipped bedrock rows. Puzzle confirms
  visible 1/2 forecasts and one direct pre-spawn rollback. Reduced motion shows the
  still-visible countdown and no sheet/countdown animation.
- Blocker/next action: source is frozen. Obtain and read the independent QA log for
  `225aa1c..e9db541`, then make a coordinator-only acceptance/changelog checkpoint,
  release only the project Vite listener on 5176, verify that port is free, and perform
  the user-authorized non-force `main` push.

## 2026-07-24 — TETRIS-T13.13-MULTIPASS-031 acceptance and release record

- Base/contract: `fcd6fce`; accepted product candidate: `fcd6fce..3e2bcd9`. Exact
  product paths are `src/App.tsx`, `src/App.test.ts`, `src/styles.css`, Core mutation
  source/tests, and the bounded renderer/theme/audio source/tests declared by the
  contract. Coordinator-only documentation paths are `docs/DESIGN.md`,
  `docs/CURRENT_TASK.md`, `docs/progress.md`, this log, and the changelog. The
  inherited `package-lock.json` was neither changed nor staged.
- Result: completed Puzzle nodes replace their centered numeral with one centered SVG
  tick; all incomplete numerals retain their center. The selector preview/best row,
  paused Settings continuation, far-right record dates, rail gap/Next layering,
  carrier snapshotting, 2×→4× additive Multiplier, and four bounded Mutation
  visual/audio treatments are all repaired without changing Puzzle definitions,
  ordinary physics, dependencies, or packaging targets.
- Commands actually run after the final source repair: focused `src/App.test.ts` and
  typecheck; then `npm.cmd run typecheck`, `npm.cmd run test` (22 files / 159 tests),
  `npm.cmd run build` (746 modules), the prescribed web-game Playwright client, and
  the ignored local Playwright audit `.local/audits/t13.13/browser_audit.py`.
- Evidence: the final-candidate report and captures verify desktop, 390 × 844 portrait,
  844 × 390 landscape, and reduced-motion states; the tick and numeral centers,
  clean preview, direct Settings continue, one canvas/zero DOM cells, carrier evidence,
  no-dialog visible Next, no overflow, and zero console/page errors all hold. The first
  independent read-only review raised a valid final-artifact provenance P1; after a
  fresh final-candidate re-audit, the closure QA reported no P0–P2 and accepted the
  slice.
- Resource hygiene: exact project Vite listeners on port 5176 were verified and
  stopped after each evidence pass; final port check is empty. Blocker: none. Next:
  commit this coordinator record and make the user-authorized non-force `main` push.

## 2026-07-24 — TETRIS-T13.11-PALETTE-AND-KEYBOARD acceptance and release record

- Candidate: bounded product source `fc9cc3c`, reviewed as `25fa232..fc9cc3c`.
  Exact source paths are `src/App.tsx`, `src/App.test.ts`,
  `src/ui/localization.ts`, and `src/styles.css`; contract and coordinator record
  paths are limited to the declared T13.11 documentation set. No game rule, binding,
  Core, renderer, persistence, Puzzle definition, or package-lockfile behavior changed.
- Coordinator final gates passed after the last source edit: `npm.cmd run typecheck`,
  `npm.cmd run test` (22 files / 146 tests), and `npm.cmd run build` (746 modules).
  Browser evidence visually checked brighter teal/blue/amber/violet glyphs, Chinese
  and English group order, Puzzle-only Z within the first group, 390 × 844 width
  equality/no overflow, one canvas/zero DOM board cells, and zero console errors.
- Independent QA report and durable log `4457667` were read before acceptance. Its
  verdict is **PASS — ACCEPT**, no P0–P2 findings: it independently confirms the
  bright four-glyph surface, gameplay-before-shortcuts order, right-rail keyboard-guide
  removal, Puzzle Z, bilingual copy, narrow layout, and zero warnings/errors.
- Release hygiene: root temporary browser captures were explicitly removed after
  review. The user-owned `package-lock.json` remains the only out-of-slice worktree
  modification and is neither changed nor staged. Next: push accepted `main`, then
  release only the coordinator-owned port-5176 Vite listener and verify its release.

## 2026-07-24 — TETRIS-T13.10-TETRAMORPH-030 independent acceptance and release record

- Candidate acceptance: independent QA read and recorded `a1d8b16..b005a14` in
  `fa95cae` (`docs/workstreams/tetris-t13-independent-qa/THREAD_LOG.md`). Its verdict
  is **PASS — ACCEPT**, with no remaining P0–P2 issue. The coordinator read both the
  task report and that durable record before this acceptance checkpoint.
- The sole QA finding was a P1 at 390 × 844 reduced motion: the Puzzle clear objective
  ellipsized. Focused source checkpoint `b005a14` makes it span the mobile information
  width and preserve complete wrapped copy. Independent fresh 390 × 844 and 844 × 390
  captures show the complete Chinese target, no overflow, one canvas, zero DOM cells,
  and zero errors.
- Verified candidate gates: `npm.cmd run typecheck`; final
  `npm.cmd exec -- vitest run --pool=threads --maxWorkers=1` (22 files / 146 tests);
  `npm.cmd run build` (746 modules); and ignored `delivery-audit.mjs`, all pass.
  Independent QA repeated its own typecheck, full suite, build, desktop/portrait/
  landscape checks, direct Undo, bilingual Settings, backdrop continue, and local-font
  checks. Product behavior is accepted: live Puzzle names/ordinals remain absent,
  selector names are concise, and Settings is keyboard- and pointer-complete.
- Release scope: this coordinator checkpoint owns only current status, design/progress,
  this log, and the root changelog. Next: push the accepted linear `main` chain, stop
  only coordinator-owned Vite on port 5176, verify the listener release, and report the
  result. Port 5173 and all unrelated processes remain outside scope.

## 2026-07-24 — TETRIS-T13.10-TETRAMORPH-029 interface and Puzzle refinement candidate

- Base: pushed T13.9 coordinator record `a1d8b16`; full pending candidate range
  `a1d8b16..8c76ee2`. This supersedes the narrower brand-only review request: every
  unpushed T13.10 checkpoint is in one independent-QA range, including identity,
  local-font, bilingual, Settings, direct-undo, and selector work.
- Exact changed product/test paths across that range: `index.html`, `package.json`,
  `package-lock.json`, `src/main.tsx`, `src/App.tsx`, `src/App.test.ts`,
  `src/ui/ActionSheet.tsx`, `src/ui/localization.ts`, `src/styles.css`,
  `src/game/core/puzzles.ts`, `src/game/core/puzzles.test.ts`,
  `src/game/core/types.ts`, `src/game/core/engine.ts`, and
  `src/game/core/puzzleUndo.test.ts`. Contract paths are `docs/DESIGN.md` and
  `docs/CURRENT_TASK.md`; no authored Puzzle geometry/queue, other mode rule,
  renderer, audio, or generated evidence path changed.
- User-visible result: the home keeps one bold locally bundled Playwrite wordmark and
  promotes local Space Grotesk/JetBrains Mono hierarchy elsewhere; full Chinese/English
  Settings has a backdrop **继续** action; live Puzzle hides level name/ordinal; its
  selector uses renamed concise levels; and direct `Z` undo restores the pre-spawn
  checkpoint then refalls the same piece without confirmation.
- Commands actually run after the final source edit: `npm.cmd run typecheck`; targeted
  `npm.cmd exec -- vitest run src/App.test.ts src/game/core/puzzleUndo.test.ts
  src/game/core/puzzles.test.ts --pool=threads --maxWorkers=1` (3 files / 27 tests);
  final one-worker full Vitest (22 files / 146 tests); and `npm.cmd run build`
  (746 modules), all pass. Ignored `delivery-audit.mjs` and the required web-game
  client pass at desktop/English/reduced-motion portrait with zero browser errors,
  no overflow, and one gameplay canvas/zero DOM cells; captures were visually checked.
- Resource state: Vite on `127.0.0.1:5176` is coordinator-owned and held only while
  independent QA completes. The unknown pre-existing 5173 listener remains untouched.
  Blocker: independent read-only QA of `a1d8b16..8c76ee2` is in progress. Next: read
  its verdict, make the coordinator acceptance/changelog checkpoint, release 5176, and
  push only the accepted chain.

## 2026-07-24 — TETRIS-T13.10-TETRAMORPH-028 brand candidate

- Base: accepted/pushed `6a1fd92`; candidate range `6a1fd92..f686dfc`. The chain keeps
  contracts separate from source: `e4f8066` defines an independent name and offline
  display-font boundary, `6900290` adds the initial identity surface, `67d34fa`
  responds to the no-duplicate-header / stronger-display feedback, and `f686dfc`
  implements the final **TetraMorph** wordmark with middle-capital `M`.
- Exact product/test paths: `index.html`, `package.json`, `package-lock.json`,
  `src/main.tsx`, `src/App.tsx`, `src/App.test.ts`, and `src/styles.css`. Exact contract
  paths are `docs/DESIGN.md` and `docs/CURRENT_TASK.md`. No Core, renderer, Puzzle,
  mode rule, persistence, or audio file changed.
- Result: live metadata, loader, accessible labels, and gameplay/library marks use
  `TetraMorph`. The homepage has no top-left duplicate name; its sole `h1` is a
  compact, two-tone, local-Google-Font Tektur wordmark in the dark field. It remains
  readable at 1440×900, reduced-motion 390×844, and 844×390, while cards retain only
  mode name, glyph, accent, and entry action.
- Commands actually run after the final source edit: `npm.cmd run typecheck`; targeted
  `npm.cmd run test -- src/App.test.ts` (1 file / 16 tests); default `npm.cmd run test`
  (22 files / 146 tests); and `npm.cmd run build` (745 transformed modules), all pass.
  The prescribed `web_game_playwright_client.js` captured the final home. Ignored
  `.local/audits/t13-10-brand/audit.mjs` then passed at desktop, reduced-motion
  portrait, and landscape: Tektur loads locally, the required title/casing is present,
  no duplicate brand or overflow exists, Classic still has one canvas/zero DOM cells,
  and no console/page error occurred. All final screenshots were visually inspected.
- Resource state: coordinator-owned Vite listener `73248` remains on 127.0.0.1:5176
  solely for the pending QA/review; the pre-existing unknown-owner 5173 listener is
  untouched. Blocker: independent read-only QA has not yet reviewed
  `6a1fd92..f686dfc`. Next: obtain that verdict, then update acceptance/changelog and
  release only 5176 before the user-authorized push.

## 2026-07-24 — TETRIS-T13.9-MUTATION-MODE-027 closure audit

- Base/state: pushed `a1d8b16` on `main`, with product candidate `ca8c7f6` unchanged.
  `git diff --name-only ca8c7f6..HEAD` contains only acceptance/QA/coordinator docs;
  no frozen Puzzle definition, queue, route, selector, or renderer path moved after
  independent acceptance.
- Commands actually rerun: `npm.cmd run test` passed with normal startup output
  (22 files / 146 tests, 15.37 s). The scoped route/definition, survival, 异变,
  leaderboard, App/Settings, and AudioEngine matrix passed (8 files / 60 tests).
  `vite.config.ts` still limits default discovery to current `src/` tests.
- Evidence re-read and visually inspected: schema-6 records two public Core-replayed
  routes for each of 20 fixed Puzzle levels; direct tests bind legal setup, fixed queues,
  target ownership, sparse anchors, and early route divergence. The ignored final
  browser report retains the seeded coral bomb carrier, one canvas, zero DOM cells,
  error-free desktop/portrait/landscape bounds, first-entry rules, Settings navigation,
  Escape return, and Puzzle entry. No source action is authorized or needed.
- Final local mapping is clean; `origin/main` matches `a1d8b16`. Port 5176 remains
  released; pre-existing unknown-owner 5173 is intentionally retained. This closes the
  T13.9 delivery verification unless a future user request opens a new bounded slice.

## 2026-07-24 — TETRIS-T13.9-MUTATION-MODE-026 acceptance and release record

- Coordinator read both independent verdicts and their durable log: `ce35cb1` correctly
  rejected the initial material candidate for the reduced-motion P2, and `d993e49`
  accepts repaired product candidate `ca8c7f6` over `59bc5ef..ca8c7f6` with no P0–P2
  findings. The accepted repair is limited to the static 240 ms item-coloured flash and
  its 16 ms draw regression; no Puzzle authoring path changed.
- Final evidence belongs to the repaired candidate: `npm.cmd run typecheck`, default
  `npm.cmd run test` (22 files / 146 tests, 18.25 s), `npm.cmd run build` (744 modules),
  and `.local/audits/t13-9-mutation/audit.mjs` at desktop, reduced-motion portrait, and
  landscape. Evidence confirms the coral bomb carrier/core/status state, rules and
  Settings surfaces, three-row Survival/13→6 copy, one canvas, zero DOM cells, no
  overflow, and zero browser errors.
- Resource release was independently verified: only the coordinator-owned Vite child
  `44016` at `127.0.0.1:5176` was stopped after audit; the unknown-owner 5173 listener
  remains. The user-authorized next action is to commit this final documentation and
  push `main` without rewriting history.

## 2026-07-24 — TETRIS-T13.9-MUTATION-MODE-024 reduced-motion repair candidate

- Base: independent QA failure verdict `ce35cb1` against product candidate `02b9ba9`.
  Exact source repair: `ca8c7f6`; refreshed product candidate range is
  `59bc5ef..ca8c7f6`. No Core, item, Puzzle, persistence, or user-copy behavior
  changed: this repair only makes the already-required reduced-motion trigger state
  paint reliably.
- Exact changed paths: `src/game/render/TetrisRenderer.ts` and
  `src/game/render/TetrisRenderer.test.ts`. Reduced motion formerly assigned a 1 ms
  mutation-flash duration, but effect advancement occurs before drawing; an ordinary
  frame therefore removed the state without a paint. The renderer now holds a static,
  item-coloured flash for 240 ms. It contains no continuous animation and still clears
  predictably.
- Regression proof: the direct renderer test enables reduced motion, consumes a Freeze
  activation, advances a realistic 16 ms frame, and spies the draw path for the exact
  ice-blue fill at static alpha 0.16. It then advances the remaining 224 ms and proves
  that the bounded state clears. Targeted typecheck plus renderer/theme tests passed
  (2 files / 10 tests).
- Final coordinator gates rerun after the repair: `npm.cmd run typecheck`; default
  `npm.cmd run test` (22 files / 146 tests, 18.25 s); and `npm.cmd run build`
  (744 transformed modules). Fresh `.local/audits/t13-9-mutation/audit.mjs` evidence
  again passed desktop 1440×900, reduced-motion portrait 390×844, and landscape
  844×390: deterministic coral bomb carrier, rule disclosure, Settings, three-row
  Survival/13→6 copy, one canvas, zero DOM cells, no overflow, and zero console/page
  errors.
- The earlier QA failure remains valid historical evidence and is not overwritten.
  Blocker: this repaired source candidate requires a fresh independent read-only
  verdict before acceptance, changelog, or push. Next: request that review.

## 2026-07-24 — TETRIS-T13.9-MUTATION-MODE-022 source candidate

- Base: `59bc5ef`; contract checkpoints `842dcce` and `af3d739`; source candidate
  range `59bc5ef..02b9ba9`. The work is deliberately split into `3429911` (Core),
  `fcdca83` (persistence), `1d9c90c` (visible interaction/audio/renderer), and
  `02b9ba9` (four item-specific carrier materials), so the state model, records, and
  player surface remain separately reviewable.
- Exact changed paths: `docs/DESIGN.md`, `docs/CURRENT_TASK.md`; Core
  `src/game/core/constants.ts`, `engine.ts`, `index.ts`, `mutation.ts`, `random.ts`,
  `rules.test.ts`, `sprint.test.ts`, `sprint.ts`, `types.ts`, and
  `src/game/runtime/GameRuntime.test.ts`; persistence `src/leaderboard.ts` and its
  test; visible surface `src/App.tsx`, `src/App.test.ts`, `src/styles.css`,
  `src/ui/ActionSheet.tsx`, `src/game/input/InputController.ts` and its test,
  `src/game/render/TetrisRenderer.ts`, `src/game/render/theme.ts`, their direct tests,
  and `src/game/audio/AudioEngine.ts` and its test.
- Product result: Survival starts with three bedrock rows. The public fourth mode is
  **异变**, a fresh seeded seven-bag top-out run that increases gravity every six
  cleared-line equivalents. After two opening inputs, one marked carrier may attach to
  an incoming tetromino; clearing a carrier cell activates exactly one deterministic
  freeze/collapse/bomb/multiplier effect. Carrier metadata follows ordinary clears and
  temporary column collapse. Carrier bodies use item-specific ice-blue, violet, coral,
  or warm-gold materials; a bounded arrival pulse, core/halo, status label, and
  item-coloured activation flash make the carrier and its trigger legible. v7 preserves
  Classic/Survival records while resetting the incompatible fourth-mode table to the
  requested five date-stamped slots. Home has no
  rules; first entry and Settings show concise mode-specific rules. Existing Z-confirm
  Puzzle undo and Puzzle authoring remain intact.
- Commands passed: targeted Core `npm.cmd run test -- --run
  src/game/core/sprint.test.ts src/game/core/rules.test.ts src/game/core/race.test.ts
  src/game/core/core.test.ts` (4 files / 40 tests); leaderboard (1 / 6); UI/audio/
  renderer/input (4 / 31); and material/renderer `npm.cmd run test -- --run
  src/game/render/theme.test.ts src/game/render/TetrisRenderer.test.ts
  src/game/core/sprint.test.ts` (3 files / 16 tests). Final coordinator gates then
  passed: `npm.cmd run typecheck`; default `npm.cmd run test` (22 files / 145 tests,
  19.35 s); and `npm.cmd run build` (744 transformed modules).
- Browser evidence: `.local/audits/t13-9-mutation/audit.mjs` passed desktop 1440×900,
  reduced-motion portrait 390×844, and landscape 844×390. It proved clean home copy,
  complete first-entry rules, a seeded bomb-carrier after two locks, its coral full
  carrier material plus core mark and rail status, Settings record/rules/keyboard arrow
  control, Escape return, Puzzle library entry, one canvas/zero DOM cells, no overflow
  or clipped dialog, and zero console/page errors. Direct renderer tests cover all four
  materials and the bounded item-coloured flash lifecycle. Captures `desktop-home.png`,
  `desktop-mutation-rules.png`, `desktop-mutation-carrier.png`, `desktop-settings.png`,
  and the responsive frames were visually inspected.
- Resource check before validation found Vite listeners on 5176 (coordinator-owned,
  `E:\Proj\reproduction-tetris`, 164.2 MB) and pre-existing 5173 (same project path,
  unknown owner, 296.6 MB). No shared/unknown process was terminated. Blocker:
  independent QA has not yet reviewed `59bc5ef..02b9ba9`. Next: obtain read-only Core
  and browser/visual verdicts, then add the coordinator changelog record and push.

## 2026-07-24 — TETRIS-T13.9-MUTATION-MODE-021 contract checkpoint

- The user rejects Collapse as a full fourth mode and replaces it with **异变**. Its
  top-out run retains a fresh Classic-like bag but increases gravity only every six
  cleared-line equivalents. Marked, deterministic item carriers begin after the first
  two inputs; clearing any cell belonging to the locked carrier invokes its one effect.
- Required first effects: ten-second freeze, ten-second temporary column collapse,
  immediate bottom-three-row bomb with score/three line equivalents, and ten-second
  score multiplier. Carrier identity must survive clears/collapse without duplicate
  triggering; the right rail shows an active timer or instant result, the renderer
  shows a special core/halo, and activation has bounded visual/audio feedback. Existing
  Collapse records are reset while Classic/Survival valid records survive the new
  top-five schema.
- Survival opening height changes from seven to three bedrock rows; its fixed gravity,
  13→6 pressure, and three-line-removal reward remain unchanged. Puzzle authoring,
  queue, anchor, target, route, selector matrix, preview, and win condition remain
  frozen; only the already-authorized Z confirmation and selected-start best display
  may move there.
- New Core/render/runtime/leaderboard source boundary and final verification matrix are
  recorded in `CURRENT_TASK.md`/`DESIGN.md`. This contract supersedes all live
  Collapse-facing scope; no product source has been changed under it yet. Next: revise
  data model and direct tests before the App/renderer integration.

## 2026-07-24 — TETRIS-T13.8-RAIL-UNDO-020 contract checkpoint

- User extension to the open T13.7 source slice: all four live modes will use one
  coherent right-rail card grammar; Settings retains only a date-stamped top five per
  live mode; and Puzzle's visible undo changes from `B` to `Z`.
- Puzzle authoring stays frozen. `Z` or the touch-safe undo action opens exactly
  **确认** and **取消**; confirmation calls the existing Core pre-lock rollback and
  therefore returns to the state in which the last input piece had just appeared.
  Cancellation preserves the current run. A solved selected level shows `最少 N 步`
  immediately above its **开始** action. This is the only authorized Puzzle selector
  adjustment; definitions, queue, anchor, target, route, preview, matrix, and win
  condition remain closed.
- Added exact source/test boundary: `src/game/input/InputController.ts` and
  `src/game/input/InputController.test.ts` may remove the old `B` mapping so the React
  confirmation owns `Z`; `src/App.tsx`, `src/App.test.ts`, and `src/styles.css` own the
  visible interaction, unified rail, and CTA. `src/leaderboard.ts` and its direct test
  own the five-entry persistence cap. Audio remains original procedural code only;
  authenticated music-service browsing is read-only reference research, never a
  shipping asset.
- Required proof: focused App/input/leaderboard/audio tests, typecheck, current-source
  full suite, build, route replay, and desktop/portrait/landscape browser evidence
  proving the two-action undo sheet, exact rollback, start-adjacent best count,
  top-five dates, rail consistency, no overflow/errors, one canvas, and teardown.
  A new independent read-only review is still required after the source candidate.

## 2026-07-24 — TETRIS-T13.7-SETTINGS-AUDIO-019 contract checkpoint

- User follow-up opens one bounded Settings/audio slice after the `6411b5e` product
  candidate and the pre-slice isolated audit. Settings gains the current non-Puzzle
  mode's compact date-stamped **本模式排行**, persisting only the top five live-mode
  results. Puzzle stays separate: it shows only the selected cleared level's minimum
  locked-piece count or `尚未通关`, never a Puzzle leaderboard, history, hint, or
  selector change.
- Audio contract: after a valid in-game user gesture, enabled original music must be
  genuinely audible at 100% rather than only represented by low-gain/suspended Web
  Audio nodes. Preserve the user-gesture gate, separate toggle, bounded original
  lifecycle, and non-electrical physical landing character, but replace the rejected
  electronic bed with an original wordless piano-like accompaniment—soft note attacks,
  short resonance, restrained melody, and no sample/external/copyrighted track.
- Settings interaction extension: `←`/`→` roves visible actionable control selection,
  `↑`/`↓` moves control rows, and `Enter` invokes the selected button. Its concise
  visible **键盘** keycap strip promotes `S`, `P`, `R`, `Esc` return,
  selection/confirm, and Puzzle-only `B`; a focused volume range keeps native arrow
  adjustment. In play, `Esc` invokes the same confirmation as the visible return
  button, and that confirmation is arrow-selectable and Enter-confirmable.
- Homepage extension: hover/focus/selection must not recolor a mode's **开始**/**选关**
  key blue. Its own accent remains stable while the selected card, border, glyph, and
  accent surface become stronger. Keep card text at a fixed rendered weight through
  the transition. Replace ranking/personal-record copy with concise real rules; in
  particular, 坍缩 must say that every lock independently settles columns and may
  chain clears until top-out.
- Planned source/test paths: `src/App.tsx`, `src/App.test.ts`, `src/styles.css`,
  `src/leaderboard.ts`, `src/leaderboard.test.ts`, `src/ui/ActionSheet.tsx`,
  `src/game/audio/AudioEngine.ts`, and `src/game/audio/AudioEngine.test.ts`; runtime
  glue may be added only if a direct user-gesture path cannot otherwise be proven.
  Frozen exclusions: `src/game/core/puzzles.ts`, Puzzle definition/route artifacts,
  queues, anchors, `PuzzleLibrary`, selector layout, and Puzzle preview/visual files.
- Required proof: targeted UI/persistence and audio tests, typecheck, full suite,
  build, and a fresh desktop/portrait browser pass that visibly opens Settings and
  exercises a user-gesture music start. The independent pre-slice audit remains a
  baseline only; after source changes, a new read-only review is required. Blocker:
  none. Next: implement this exact slice.

## 2026-07-24 — TETRIS-T13.7-READONLY-REPRO-018 coordinator audit record

- Product candidate: `6411b5efaead87c91138285305b3ce7e9c48988e` on `main`; no product
  source, Puzzle definitions, queues, anchors, routes, selector, or visual surface was
  modified by this audit. A fresh detached worktree at the exact candidate received
  one `npm.cmd ci --no-audit --no-fund` before all reproducibility checks.
- Gates: `npm.cmd run typecheck` passed; default `npm.cmd run test` passed 22 files /
  138 tests in 32.38 s; `npm.cmd run build` passed with 743 modules in 883 ms. A
  separately streamed default test command emitted first stdout at 294 ms, had no
  stderr, and exited 0, so the reported silent-start symptom is not reproducible on a
  clean current candidate.
- Read-only Core review covers the schema-6 artifact and the current tests for all 20
  Puzzle route pairs, public `dispatch()` terminal replay, immutable anchors, fixed
  Puzzle queues, fresh random normal-play bags, Survival 7 bedrock / fixed 40 ticks /
  13→6 pressure, and endless Collapse top-ten ordering.
- Browser evidence against the isolated candidate Vite server passed at 1440×900,
  390×844, 844×390, and reduced motion. It verifies Settings, all four modes,
  Survival's visible seven rows and 13-second pressure, untimed Collapse, Puzzle's
  all-open selector, no visible row caption/checkmark, `B` undo, two Next pieces, one
  canvas during play, zero DOM cells, no overflow, and zero errors. The seven fresh
  frames were visually inspected.
- Resource audit: only the isolated port-5174 Vite `cmd`/`npm`/`node` tree was stopped;
  the exact temporary QA worktree was then removed. The pre-existing port-5173 VS Code
  listener remains untouched. Technical disposition: **PASS**. External independent
  QA disposition: **PENDING** — this is a coordinator-run isolated read-only audit,
  not a substitute for an independent reviewer. Next: preserve this record and await
  an independent disposition before claiming formal acceptance.

## 2026-07-24 — TETRIS-T13.6-PUZZLE-SELECTOR-017 source checkpoint

- Base: `509765d`; candidates: `88fbbab` and corrective CSS follow-up `8cab0e4`.
  Exact source paths: `src/App.tsx`, `src/App.test.ts`, and `src/styles.css`.
  The selected preview no longer renders `X 行残局` or a completion glyph; level nodes
  no longer render checkmarks either. A completed selected level renders its structural
  name with the completion color, while the compact best-piece and anchor facts remain.
- Verification: targeted `npm.cmd run test -- src/App.test.ts --no-file-parallelism
  --maxWorkers=1` passes 13 tests; `npm.cmd run typecheck` passes. The final full
  gates pass: typecheck, `npm.cmd run test` (22 files / 138 tests, 39.94 seconds), and
  `npm.cmd run build` (743 transformed modules, 190 ms). The generic web-game client
  and `.local/audits/t13-6-selector.mjs` both pass against the coordinator-started
  Vite server. The latter seeds a real completion record, checks the computed title
  color for two completed levels, confirms no obsolete caption/glyph, no overflow, and
  no console/page errors; its screenshot was visually inspected.
- Resource audit: the coordinator-started Vite `npm`/`cmd`/`node` tree on port 5173
  was stopped after evidence. A follow-up check confirms no port-5173 listener and no
  Tetris-owned development process remains. Blocker: independent read-only QA has not
  issued a disposition. Next: add the changelog/coordinator record and perform the
  delayed user-authorized `main` push without claiming acceptance.

## 2026-07-24 — TETRIS-T13.6-PUZZLE-SELECTOR-017 contract checkpoint

- Base: `66f8ff5`; user review reopens only the selected Puzzle-preview completion
  treatment. The row-count caption (`X 行残局`) and visible checkmarks are redundant
  and must disappear from the selected preview and level nodes alike. Completion is
  instead communicated by the selected level name's color. The compact minimum-piece
  record and fixed-anchor fact remain; no Puzzle board, queue, route, hint, unlock,
  record semantics, or other mode may change.
- Exact planned paths: `docs/CURRENT_TASK.md`, `docs/DESIGN.md`, `docs/progress.md`,
  this log, `src/App.tsx`, `src/App.test.ts`, and `src/styles.css`. No renderer,
  Core, persistence, dependency, asset, or package path is in scope.
- Required proof: direct PuzzleLibrary test for absent caption/checkmarks and completed
  name color; one fresh browser screenshot showing an existing record; then typecheck,
  the affected UI test, coordinator log/changelog, and the delayed user-authorized
  push. Blocker: none. Next: implement this one visual slice.

## 2026-07-24 — TETRIS-T13.5-COORDINATOR-016 verified candidate

- Base: `b6b2d3f`; product-source candidate: `6c65150`
  (`fix(brand): align visible title with Tetris`). The ordered local range is
  `a8f183f..6c65150`: persistent Collapse/Survival corrections, puzzle-anchor
  reconciliation, hint removal, personal-best storage, confirmation selection,
  Settings/audio/music, and the final plain-text title alignment.
- Exact product and contract paths in that range are
  `docs/CURRENT_TASK.md`, `docs/DESIGN.md`, `docs/progress.md`, this log,
  `docs/workstreams/tetris-t13-core/puzzle-endgame-results.json`, `index.html`,
  `src/App.tsx`, `src/App.test.ts`, `src/styles.css`,
  `src/game/core/constants.ts`, `src/game/core/engine.ts`,
  `src/game/core/puzzles.ts`, `src/game/core/puzzles.test.ts`,
  `src/game/core/race.test.ts`, `src/game/core/sprint.ts`,
  `src/game/core/sprint.test.ts`, `src/game/core/types.ts`,
  `src/game/audio/AudioEngine.ts`, `src/game/audio/AudioEngine.test.ts`,
  `src/game/input/InputController.ts`, `src/game/input/InputController.test.ts`,
  `src/game/runtime/GameRuntime.ts`, `src/game/runtime/GameRuntime.test.ts`,
  `src/game/runtime/qaScenario.test.ts`, `src/game/render/TetrisRenderer.ts`,
  `src/leaderboard.ts`, `src/leaderboard.test.ts`, `src/puzzleProgress.ts`,
  `src/puzzleProgress.test.ts`, `src/ui/ActionSheet.tsx`, and `src/main.tsx`.
  `src/puzzleHints.ts` and `src/puzzleHints.test.ts` are intentionally deleted.
- Outcome: Collapse is endless and lines-first ranked; Survival starts with seven
  bedrock rows and applies 13→6-second pressure; all twenty fixed Puzzle boards keep
  legal, sparse above-band anchors and internal route evidence but no player-facing
  hints; each solved level retains the real minimum locked-piece count. Puzzle uses
  `重来`; other modes retain `再来一局`. The header exposes only Settings (`S`), whose
  sheet owns effects/music/volume/continue/restart. Two-action sheets select with
  `←`/`→` and confirm the selected action with Enter. The page-facing title is the
  plain-text `Tetris`.
- Commands/evidence: targeted route, persistence, input, runtime, audio, and App
  checks passed during their checkpoints. Final `npm.cmd run typecheck` passed;
  `npm.cmd run test` passed 22 files / 138 tests in 38.99 seconds; and
  `npm.cmd run build` passed with 743 transformed modules in 291 ms. The required
  generic web-game Playwright client exited successfully against a live Classic run.
  The final ignored audit `.local/audits/t13-final-browser.mjs` then passed at
  1440×900, 390×844, and 844×390: zero console/page errors or overflow, one game
  canvas, zero DOM board cells, compact Puzzle best persistence, and no returned hint
  surface. Its settings and three Puzzle screenshots were visually inspected.
- Resource audit: no pre-existing Tetris listener was found. The final browser check
  used only the coordinator-started Vite tree (`npm`/`cmd`/`node`, port 5173); it was
  stopped after evidence. A follow-up check confirms port 5173 is released and no
  Tetris-owned Vite/npm/web-game process remains. Codex-owned shared tooling was not
  touched.
- Blocker: independent read-only Core and visual QA has not issued a disposition.
  This is a coordinator-verified recovery candidate, not an acceptance claim. Next:
  add the coordinator changelog record and perform the user-authorized `main` push.

## 2026-07-24 — TETRIS-T13.5-PERSISTENT-COLLAPSE-015 contract checkpoint

- Base: `b6b2d3f`; no product source is changed in this contract checkpoint. User
  feedback supersedes the pending acceptance route: Collapse is retained but its
  75-second end condition and ruled side rail are rejected; Survival pressure changes
  from 15→8 to 13→6 seconds; and Puzzle's anchor/name authoring boundary is reopened.
- Follow-up clarification supersedes the one-row reading: Collapse's local leaderboard
  retains its top ten top-outs and orders them by lines, then score, chain, and fewer
  pieces.
- New finishing requirement: audit the existing Web Audio event layer and add optional,
  original procedural background music in a separate bounded audio checkpoint. It must
  remain controllable, use no external/copyrighted media, and stop cleanly with the
  runtime lifecycle.
- Follow-up UI direction: the game header should show one `设置` control at right; its
  `S` shortcut opens the same sheet for effects/music/volume, pause, and restart.
  Promote the active mode name and keep all player-facing mode explanations concise,
  factual, and free of decorative copy.
- Open-goal reconciliation: source acceptance is pending for six migrated Puzzle route
  pairs and their schema/guidance/walkthrough evidence; Collapse's endless top-ten
  persistence/rail and Survival's 13→6 pressure need final direct and browser proof;
  the audio/music and Settings pass is not yet implemented; then final gates, log,
  changelog, and push remain. This list is the coordinator's complete live ledger.
- Latest Puzzle UX scope: do not create or regenerate local `Solutions/` images in
  this delivery. Persist/show a per-level minimum successful locked-piece record in
  the selector, and change the Puzzle result primary action to `重来`.
- Latest Puzzle guidance direction: remove the currently exposed hint trigger, unlock
  state, cue, strategy, and step UI. Keep paired routes only as internal Core evidence;
  do not author a new player-facing guidance system in this delivery.
- Confirmation follow-up: add visible `←`/`→` selection to every two-action sheet;
  `Enter` activates the focused/selected action rather than a hidden fixed default.
- Resource audit (2026-07-24): no Tetris dev server/test process or known local web
  listener was present. The observed Playwright MCP trees are direct children of the
  active Codex app and have no listener, so they remain untouched. Repeat this scoped
  audit before/after long validation phases and release only clearly Tetris-owned idle
  processes.
- Exact future source boundary: Collapse constants/types/engine/sprint/direct tests,
  leaderboard/persistence, App/App tests/styles; Survival constants/race/runtime
  tests; and the coupled Puzzle definitions, hints/progress/direct tests, and schema
  route artifact. No renderer primitive,
  package/dependency, unrelated game repository, or desktop package target is allowed.
- Read-only anchor diagnosis: all six current anchors occupy the bottom initial target
  row, while current validation forbids any anchor outside the target band. That is
  incompatible with the user’s stated rule. A real-Core provisional search already
  found above-band, structurally active two-route candidates for `t3r-shaft-01`; it
  will be used as a method, not a reason to move an anchor without a route proof.
- Acceptance: do not call the previous T13 candidate accepted. Each new Core/UI
  checkpoint needs targeted tests; the final range needs current-source full tests,
  typecheck, build, all Puzzle route replays/walkthroughs, and desktop/portrait/
  landscape browser evidence. Next: complete candidate search and author the coupled
  Collapse, Survival, and Puzzle corrections.

## 2026-07-24 — TETRIS-T13.4-TEST-DISCOVERY-014 contract checkpoint

- Base: `f86a64e`; exact planned source boundary: `vite.config.ts` only, plus this
  T13 documentation record and the final changelog. No game or Puzzle source is in
  scope.
- Read-only diagnosis: `node node_modules/vitest/vitest.mjs list` reaches ignored
  `.local/audits/t12.6-walkthrough-legacy-20260724/generate-solution-walkthroughs.test.ts`
  and fails to import its retired relative T12 artifact path. The default recursive
  discovery also includes historical `docs/workstreams/` test artifacts, while the
  current product suite lives wholly beneath `src/`.
- Decision: configure Vitest to discover current `src/` tests only. Historical
  workstream and local recovery checks remain archived/readable but must not define the
  `npm.cmd run test` quality gate. Blocker: none. Next: implement the configuration
  change and run the unqualified suite once.

## 2026-07-24 — TETRIS-T13.4-TEST-DISCOVERY-014 source checkpoint

- Candidate: `dc9acca` (`test(t13): scope default discovery to product sources`).
  Exact source path: `vite.config.ts`; it uses Vitest's config helper and scopes
  default discovery to `src/**/*.{test,spec}.?(c|m)[jt]s?(x)`. No game, Puzzle,
  renderer, persistence, package, or browser-runtime source changed.
- Verification: `vitest list` reports current `src/` cases only. The unqualified
  `npm.cmd run test` completes: 23 files / 138 tests passed in 11.40 seconds;
  `npm.cmd run typecheck` passes; `npm.cmd run build` passes (746 transformed modules).
  This resolves the archive-import discovery failure without deleting its recovery
  material.
- Browser evidence: reran `.local/audits/t13-relay/audit.mjs` against `dc9acca` at
  1440×900, 390×844, and 844×390. It verifies the live 75-second 坍缩 state, two
  hard-drop locks, all-open Puzzle access, one selected preview, one canvas/zero DOM
  cells, no overflow, reduced motion, and zero errors. The desktop Collapse and
  Puzzle-library screenshots were visually inspected. The required generic web-game
  client was invoked but timed out at the app countdown because this product lacks a
  deterministic `advanceTime` hook; the real-time audit is the valid evidence.
- Blocker: no product/test failure remains. Independent read-only Core and visual QA
  has not yet issued a disposition, so this is a coordinator-verified candidate rather
  than an acceptance. Next: preserve the clean candidate range for that review.

## 2026-07-23 — TETRIS-T13-CONTRACT-001 active scope

- Base: `550d77e` on `main`; no product source is changed in this checkpoint.
- Exact paths: `docs/DESIGN.md`, `docs/CURRENT_TASK.md`, `docs/progress.md`, and this
  log. The contract records the user's five requirements as distinct reversible
  checkpoints: repository cleanup/push, direct P/R/Enter behavior, five-through-eight
  row legal multi-route endgames with impactful anchors, all-open workshop selection,
  and a fourth 40-line Sprint mode.
- Baseline evidence: `git status --short --branch` reports `main...origin/main` clean
  at `550d77e`. The versioned root follows `docs/PROJECT_STRUCTURE.md`; ignored local
  artifacts are confined to project-sanctioned paths but include stale prior captures
  and duplicate pre-T13 walkthroughs that require archival/regeneration before final
  local cleanup.
- Commands run: read `AGENTS.md`, `docs/DESIGN.md`, `docs/CURRENT_TASK.md`, latest
  changelog entry, `docs/progress.md`, commit policy, project structure map, ignore
  rules, current Core/input/runtime/UI code, and prior in-repository legal-endgame
  authoring history. No test/build/browser run is claimed for this docs-only scope.
- Blocker: none. Next: implement and test the bounded input confirmation checkpoint;
  commit it before beginning Core endgame authoring.

## 2026-07-23 — TETRIS-T13-INPUT-002 source checkpoint

- Base: `220f8df`; candidate: `447ec1e`
  (`fix(input): align restart shortcut with confirmation`). Exact paths are
  `src/App.tsx`, `src/App.test.ts`, `src/game/input/InputController.ts`, and
  `src/game/input/InputController.test.ts`.
- Result: `P` remains the same Runtime pause/resume action as the header control;
  `R` is removed from the low-level game-input map and is instead handled by the page
  with the same confirmation request as a click on **重新开始**. A live request pauses
  once, disables gameplay input behind the confirmation, and `Enter` confirms the
  focused action. The pause dialog contains exactly one visible **继续游戏** button and
  now accepts `Enter`; cancelling a restart restores only the previously live run.
- Commands run: targeted `npm.cmd run test -- src/game/input/InputController.test.ts
  src/App.test.ts` (4 files / 32 tests passed); `npm.cmd run typecheck`; attempted the
  prescribed Web-game action client, which timed out in its legacy virtual-time layer;
  then ran the cached-Playwright replacement against the live Vite page. The direct
  browser audit clicked Classic, used `P` and `Enter`, clicked restart then cancelled,
  pressed `R` then confirmed with `Enter`, and checked a playing zero-piece new run,
  one canvas, zero DOM cells, no document overflow, and zero console/page errors.
- Evidence: ignored screenshots and report are under `.local/audits/t13-input/`;
  `p-pause.png` and `r-restart-confirm.png` were visually inspected. Blocker: none.
  Next: archive local-only legacy material by route, then start the atomic endgame Core
  authoring checkpoint from this candidate.

## 2026-07-23 — TETRIS-T13-DESKTOP-READINESS-003 contract addendum

- Base: `447ec1e`; this record changes only the T13 contract/documentation while the
  independent endgame-Core authoring work remains uncommitted. Exact paths:
  `docs/DESIGN.md`, `docs/CURRENT_TASK.md`, `docs/progress.md`, and this log.
- User direction: prepare the browser game for a later application package, but do not
  package it now. The bounded follow-up must keep Core platform-free, isolate browser
  storage/lifecycle/timer/focus/audio boundaries behind safe capability adapters, retain
  Vite-relative offline assets, and prove remount/capability-loss cleanup. Electron,
  Tauri, Capacitor, native dependencies, installers, signing, and binaries are out of
  scope for T13.
- Commands run: inspected current `package.json`, Vite config, browser-global callers,
  and the active commit policy. Blocker: none. Next: finish and checkpoint the atomic
  endgame Core/route evidence before beginning this separate platform-boundary slice.

## 2026-07-23 — TETRIS-T13-WORKSHOP-DIRECTION-005 contract addendum

- Base: `a08f132`; exact paths: `docs/DESIGN.md`, `docs/CURRENT_TASK.md`,
  `docs/progress.md`, and this log. This is a visual/access contract only; no product
  source is changed here.
- Direction: retire the T12 tier gate as a separate access/guidance checkpoint, retain
  historic completions as player history, and make every T13 endgame selectable on a
  fresh save. The replacement selector is a sparse four-band relay line with 20 numeric
  stops and one selected real well—not a card grid, thumbnail wall, lock narrative, or
  telemetry panel. The selected surface contains only identity, row/anchor fact, a
  structural cue, and start; a short scan gives selection motion and is disabled under
  reduced motion.
- Commands run: read the current T13 Core checkpoint/log, existing App, progress,
  hint, selector, and stylesheet contracts before amending the source boundary.
  Blocker: none. Next: update all-open progression and schema-6 guide binding as its
  own source/test checkpoint before changing the React/CSS presentation.

## 2026-07-23 — TETRIS-T13-OPEN-ACCESS-006 source checkpoint

- Base: `b2ddd3f`; candidate: `cf1ee73`
  (`feat(puzzle): open workshop access and refresh guidance`). Exact paths:
  `src/puzzleProgress.ts`, `src/puzzleProgress.test.ts`, and `src/puzzleHints.ts`.
- Result: all 20 Puzzle specimens are selectable on a fresh save. The retained campaign
  bands are now 5/6/7/8-row presentation groups only; completion records still migrate,
  normalize, and display as player history, but no longer unlock or block a level.
  The retired v2/v1 import routes remain fail-closed.
- Guidance now reads the schema-6 T13 evidence, verifies its full 20-level shape at
  module load, and replaces stale target-floor / wrong-anchor copy with structural
  opening cues and paired non-command approaches for the actual legal endgames. The
  existing two-piece-or-20-second reveal and player-owned `B` experimentation remain.
- Commands run: `npm.cmd run typecheck`; targeted
  `npm.cmd run test -- src/puzzleProgress.test.ts src/puzzleHints.test.ts`
  (4 files / 15 tests passed). Blocker: none. Next: add Sprint mechanics and its
  leaderboard as a separate source checkpoint, then connect the all-open relay UI.

## 2026-07-23 — TETRIS-T13-SPRINT-007 source checkpoint

- Base: `3cd093f`; candidate: `3485568`
  (`feat(sprint): add 40-line time trial mode`). Exact source paths are the declared
  Sprint integration set in `docs/CURRENT_TASK.md`: Core mode/state/constants/engine
  and direct tests, runtime direct test, versioned leaderboard/persistence tests, and
  the visible home/game/result/style bindings.
- Result: `sprint` starts from an empty ordinary board with a fresh run seed, fixed
  36-tick gravity, no bedrock or special pieces, and a Core-owned 40-line target. A
  normal line-clear that reaches 40 produces `status: finished` plus an explicit
  `sprintCompletion: finished` state, distinct from Puzzle success. Classic and
  Survival retain top-out records; a v4 leaderboard migrates valid v3 Classic/Survival
  rows, fails closed otherwise, and ranks Sprint by lower time, then fewer pieces,
  then score.
- Commands run: `npm.cmd run typecheck`; full targeted
  `npm.cmd run test -- src/game/core/sprint.test.ts src/game/core/rules.test.ts
  src/game/runtime/GameRuntime.test.ts src/leaderboard.test.ts`
  (10 files / 53 tests passed); targeted App Sprint binding tests (5 passed).
  Blocker: none. Next: replace the remaining retired locked-sector selector with the
  all-open four-band relay presentation and perform its browser loop.

## 2026-07-23 — TETRIS-T13-RELAY-008 visual-exception addendum

- Base: `f55fef5`. Exact future source/test paths are `src/App.tsx`,
  `src/App.test.ts`, and `src/styles.css`. The T13 contract already fixes the visual
  goal as an all-open four-band relay; this addendum explicitly authorizes the one
  responsive UI/test unit to exceed the normal 500-line checkpoint budget.
- Reason: semantic station markup, its direct DOM contract, desktop/portrait/landscape
  layouts, focus well, selection scan, and reduced-motion fallback are one inseparable
  replacement for the retired locked-sector selector. Splitting it would temporarily
  regress the open-workshop presentation or leave a non-functional motion contract.
- Required proof: direct typecheck and `src/App.test.ts` now; after the final source
  slice, the T13 whole range receives the complete suite, production build, and live
  desktop/portrait/landscape browser review. No Core, storage, or packaging behavior
  belongs to this exception.
- Blocker: none. Next: create the bounded presentation candidate, inspect it in the
  browser, then begin the separate desktop-boundary implementation.

## 2026-07-23 — TETRIS-T13-RELAY-008 source checkpoint

- Base: `8bda126`; candidate: `299ba74`
  (`feat(puzzle): present all-open relay workshop`). Exact source/test paths are
  `src/App.tsx`, `src/App.test.ts`, and `src/styles.css`; the documented visual
  exception applies only to this three-path selector replacement.
- Result: the retired locked-sector observatory is now a sparse 5/6/7/8-row relay.
  All twenty numeric stops are immediately enabled; a quiet completion check and an
  optional anchor notch are the only per-stop detail. The selected specimen is the
  single large preview, with its ordinal, row/anchor facts, one structural cue, and
  one start action. Selection motion uses a scan and glow without transiently shrinking
  the 44 px target; reduced motion renders the final state directly.
- Commands run: `npm.cmd run typecheck`; `npm.cmd run test -- src/App.test.ts`
  (1 file / 15 tests passed); prescribed web-game action client; and an ignored local
  Playwright audit at desktop 1440×900, portrait 390×844, and landscape 844×390.
  The final audit selected level 08, verified all 20 enabled stops, one focus preview,
  no route preview, 44 px minimum library control, no page overflow, reduced-motion
  suppression, a real selected-level start into exactly one canvas / zero DOM cells,
  and zero console or page errors. Latest captures and `summary.json` are under
  `.local/audits/t13-relay/` and remain ignored.
- Blocker: none. Next: implement the separate browser platform adapter required for
  future desktop-host packaging readiness, without adding a package target.

## 2026-07-23 — TETRIS-T13-PLATFORM-009 contract addendum

- Base: `a336eba`. This checkpoint changes only the T13 contract and coordinator log.
  The authorized implementation set is `src/platform/browserPlatform.ts` plus direct
  tests; the smallest App, Puzzle hint persistence, ActionSheet, GameRuntime, and
  AudioEngine consumers plus their direct tests. No Core rules, Puzzle artifact,
  renderer primitive, dependency, or package target is included.
- Direction: retain the browser-first Vite delivery while establishing one replaceable
  capability boundary for local storage, media queries, timeout/frame ownership,
  document/window visibility and keyboard listeners, focus, and AudioContext creation.
  Missing or denied capabilities must fail closed to inert UI persistence/lifecycle
  behavior, never alter a deterministic game state, and leave no listener/timer/audio
  leak after runtime destroy or React unmount.
- Commands run: reviewed the current direct browser-global callers and their existing
  tests. Blocker: none. Next: implement the adapter and targeted safety tests, then
  record a source checkpoint before final whole-range validation.

## 2026-07-23 — TETRIS-T13-PLATFORM-009 source checkpoint

- Base: `c040f3f`; candidate: `e7c9567`
  (`feat(platform): isolate browser host capabilities`). Exact paths are
  `src/platform/browserPlatform.ts`, its direct test, and the authorized App, Puzzle
  hint, ActionSheet, AudioEngine, and GameRuntime consumers/tests.
- Result: one injectible BrowserPlatform owns guarded storage, media subscription,
  timeout/frame cancellation, window/document listener cleanup, focus deferral,
  monotonic clock access, and AudioContext construction. Storage denial/no host,
  unavailable media/timer/DOM/audio APIs, and a no-window Runtime mount now degrade to
  inert presentation behavior without changing a game state. Runtime destroy releases
  the visibility listener; React restart keys, countdown, saves, dialog focus, hint
  saves, and audio all route through the boundary. No packaging target, native
  dependency, Core rule, route artifact, or renderer primitive changed.
- Commands run: `npm.cmd run typecheck`; `npm.cmd run test --
  src/platform/browserPlatform.test.ts src/game/runtime/GameRuntime.test.ts
  src/game/audio/AudioEngine.test.ts src/puzzleHints.test.ts src/App.test.ts`
  (7 files / 40 tests passed); cached diff check and exact-path staging. Blocker: none.
  Next: replace the rejected interim home/relay presentation using the new
  gravity-workbench visual contract, then perform final whole-range validation.

## 2026-07-23 — TETRIS-T13-GRAVITY-WORKBENCH-010 direction addendum

- Base: `e7c9567`; exact future source/test paths are `src/App.tsx`,
  `src/App.test.ts`, and `src/styles.css`. The user rejected the interim loose
  mode-card stack and the Puzzle relay's broad unused left route canvas.
- Direction: make the two entry pages one visual family. Home becomes a unified
  four-lane gravity field rather than four floating cards. Puzzle becomes a compact
  endgame console: one selected real well with sparse facts, beside a dense 5/6/7/8
  all-open numeric control matrix. Motion is a bounded lane settle / coordinate pulse,
  with a complete reduced-motion final state. The existing routes, all-open access,
  completion indicators, semantic labels, and 44 px controls remain intact.
- Commands run: reviewed the active T13 design/task contract, current relay markup,
  responsive stylesheet, and App semantic tests before authorizing this replacement.
  Blocker: none. Next: implement the three-path visual checkpoint and inspect it at
  desktop, portrait, and landscape before final coordinator validation.

## 2026-07-23 — TETRIS-T13-GRAVITY-WORKBENCH-010 source checkpoint

- Base: `a1b7ad9`; candidate: `ac25dba`
  (`feat(ui): compose gravity workbench entry surfaces`). Exact paths are
  `src/App.tsx`, `src/App.test.ts`, and `src/styles.css`; the documented visual
  exception applies only to this responsive semantic/layout unit.
- Result: Home is no longer a loose, staggered card pile. It is one dark board-well
  masthead and four connected gravity lanes with ordinal, glyph, concise rule, original
  cell mark, and action. The selected/focused lane receives a bounded accent beam and
  lateral settle. Puzzle is no longer a sparse route canvas: it is one compact dark
  endgame console with a single real selected well and a dense four-band 20-stop matrix.
  All 20 levels remain open, only the focus surface owns a board preview, completion and
  anchor indicators remain quiet, and the 44 px route targets/reduced-motion fallback
  remain intact. The short-landscape lane alignment was corrected from grid placement
  to a stable flex rail after direct browser inspection found clipped label geometry.
- Commands run: `npm.cmd run typecheck`; `npm.cmd run test -- src/App.test.ts`
  (1 file / 15 tests passed); prescribed `web_game_playwright_client.js`; and the
  ignored Playwright audit under `.local/audits/t13-relay/` at 1440×900, 390×844, and
  844×390. The final matrix verifies four Home entries, no viewport overflow, all 20
  enabled Puzzle controls, one focus preview/no route preview, 44 px minimum Puzzle
  control, selection of level 08, one canvas/zero DOM cells after start, reduced-motion
  suppression, and zero console/page errors. Captures were visually inspected.
- Blocker: none. Next: regenerate/archive local walkthrough material, run final
  whole-range gates, update the coordinator record/changelog, and push only the
  reviewed `main` history.

## 2026-07-23 — TETRIS-T13.1-QUIET-EXCAVATION-011 direction addendum

- Base: `046a19b`; this is a documentation-only correction boundary. Exact paths are
  `docs/DESIGN.md`, `docs/CURRENT_TASK.md`, `docs/progress.md`, and this coordinator
  log. No source behavior is claimed complete here.
- User feedback: the workbench's background lines, technical `GRAVITY FIELD` label,
  decorative numbers, redundant footer/count copy, five-cell rising cluster, and
  slanted pseudo-block motifs read as arbitrary decoration rather than gameplay. The
  visual replacement must be quiet, flat, and useful: only connected four-cell glyphs
  and real selected-board cells remain.
- Sprint is also superseded: the empty-board 40-line time trial feels too close to
  Classic. The bounded Core/UI follow-up becomes fresh-seed **清障冲刺**, with a
  deterministic seven-row ordinary rubble opening and a target set of those original
  cells. Normal line clearing removes targets; completion is fastest full excavation,
  while top-out is a failed attempt. Classic, Survival, fixed Puzzle boards, and Sprint
  leaderboard ranking remain otherwise closed.
- Commands run: reviewed the active T13 contract/task/log, current App/Core Sprint
  implementation/tests, responsive styles, and the user-provided desktop/portrait
  captures. Final-suite status is intentionally recorded as inconclusive: one
  124-second default run and one stopped single-worker run produced no result.
  Blocker: none. Next: implement and directly test the isolated Sprint Core change,
  then quiet the App/CSS visual surface before fresh browser evidence.

### TETRIS-T13.1 preview-readability amendment

- User additionally requires the Puzzle selector's sole selected preview to become
  clearer, more pattern-legible, and color-coherent after the decorative cleanup. It
  remains the real authored setup, not a generated symbol: enlarge the cells, preserve
  their material differences on the dark well, use a quiet anchor accent, and keep the
  numeric matrix sparse so it does not compete with the preview. This remains inside
  the existing `src/App.tsx` / `src/App.test.ts` / `src/styles.css` visual boundary.

## 2026-07-23 — TETRIS-T13.2-COLLAPSE-012 scope correction

- Base: `0d45113`. The immediately preceding direction was based on a coordinator
  misread. The user clarified that the rejected fourth mode is Sprint, not Puzzle.
  No Puzzle source or visual edit was made after that mistaken direction; it is now
  superseded and Puzzle is closed pending a separate request.
- Direction: replace excavation Sprint with **坍缩**, a 75-second deterministic
  score-attack where every locked piece, and then every normal line clear, trigger
  independent-column settling; any resulting full rows resolve as a multi-stage cascade. The primary score/rank measure
  becomes score plus best chain, not fastest completion. The renamed mode may change
  its existing Core, App, leaderboard, direct-test, and required small renderer/event
  paths only; Classic, Survival, Puzzle, dependencies, and package targets are closed.
- Required proof: direct Core cascade/countdown/replay tests, relevant Runtime/App and
  leaderboard tests, typecheck, full suite, build, and new desktop/portrait/landscape
  browser evidence. The evidence must show a live 75-second Collapse state, no legacy
  `冲刺`/`清障` labels, visible chain HUD, 44 px controls, one canvas, no overflow, and
  zero console/page errors.

## 2026-07-23 — TETRIS-T13.2-COLLAPSE-012 source checkpoint

- Base: `a26f929`; source candidate: `eaf88d0`
  (`feat(t13): rebuild Sprint as Collapse`). The related test-only retained Puzzle
  replay correction is the preceding `8c51e8c` (`test(qa): refresh Puzzle replay
  fixture`); it refreshes a schema-6 public route and next-unlock expectation only.
- Exact Collapse paths: `src/App.tsx`, `src/App.test.ts`, `src/styles.css`,
  `src/game/core/constants.ts`, `src/game/core/engine.ts`, `src/game/core/index.ts`,
  `src/game/core/sprint.ts`, `src/game/core/sprint.test.ts`,
  `src/game/core/types.ts`, `src/game/render/theme.test.ts`,
  `src/game/runtime/GameRuntime.test.ts`, `src/leaderboard.ts`, and
  `src/leaderboard.test.ts`. This is the authorized cross-boundary exception recorded
  in `CURRENT_TASK.md`; no Puzzle source or visual file is included.
- Result: 坍缩 starts on an empty ordinary board with a fresh seven-bag and fixed
  36-tick gravity. Every locked piece compacts ordinary cells by independent columns;
  a clear compacts again, discovers resulting rows, and resolves their depth-squared
  score chain. The fixed 75-second clock is the only successful finish. HUD/result
  text exposes score, current/best chain, and remaining time. v5 persistence ranks
  score, chain, lines, fewer pieces; obsolete v4 Sprint rows are intentionally not
  migrated because they encode incompatible excavation-time semantics.
- Commands passed after the final source edit:
  `npm.cmd run typecheck`; `npm.cmd run test -- src\\puzzleProgress.test.ts
  src\\puzzleHints.test.ts src\\platform\\browserPlatform.test.ts
  src\\leaderboard.test.ts src\\App.test.ts src\\game\\runtime\\qaScenario.test.ts
  src\\game\\runtime\\GameRuntime.test.ts src\\game\\render\\theme.test.ts
  src\\game\\render\\TetrisRenderer.test.ts src\\game\\render\\presentation.test.ts
  src\\game\\input\\InputController.test.ts src\\game\\audio\\AudioEngine.test.ts
  src\\game\\core\\core.test.ts src\\game\\core\\board.test.ts
  src\\game\\core\\puzzleCampaign.test.ts src\\game\\core\\puzzleRouteSearch.test.ts
  src\\game\\core\\puzzleFlow.test.ts src\\game\\core\\sprint.test.ts
  src\\game\\core\\rules.test.ts src\\game\\core\\race.test.ts
  src\\game\\core\\puzzleUndo.test.ts src\\game\\core\\puzzleSolverResults.test.ts
  src\\game\\core\\puzzles.test.ts --no-file-parallelism --maxWorkers=1`
  (45 files / 270 tests); and `npm.cmd run build` (746 transformed modules).
- Browser proof: `.local/audits/t13-relay/audit.mjs` passes at 1440×900, 390×844,
  and 844×390. It visibly opens 坍缩, waits through its real countdown, performs
  left/hard-drop then right/hard-drop, verifies at least two locked pieces remain on
  the board, all chain/clock fields, no legacy copy, one canvas/zero DOM cells,
  no overflow, no console/page errors, and unchanged 20-entry Puzzle access. Latest
  captures are ignored local files under `.local/audits/t13-relay/` and were inspected.
- The local web-game client was also invoked, but its deterministic action loop cannot
  advance this app's opening countdown because no `window.advanceTime` hook exists;
  its idle snapshot is not used as evidence. The real-time browser audit is the
  authoritative interaction proof. `--no-verify` was used only for the two local
  commits because the pre-commit runner's default suite is already recorded as
  non-terminating; the explicit full matrix above completed successfully.
- Blocker: no independent Core or visual/browser QA disposition exists, so this is a
  verified candidate rather than an acceptance. Next: commit the coordinator
  changelog/record and make the user-authorized recovery push.

## 2026-07-24 — TETRIS-T13.3-WALKTHROUGH-013 contract checkpoint

- Base: `d288453`. Live inventory proves the versioned repository is clean and pushed,
  but ignored `Solutions/` is not semantically clean: it mixes stale T12 three-row
  walkthroughs/images, local selector audits, authoring scratch material, and obsolete
  helper scripts with the requested player-facing solution files.
- Scope: no product source or Puzzle behavior may change. Exact versioned paths are
  `docs/DESIGN.md`, `docs/CURRENT_TASK.md`, `docs/progress.md`, this log, the final
  changelog record, and `tools/generate-puzzle-walkthroughs.mjs`. The local moves are
  exact existing `Solutions/` targets only; they preserve recovery material beneath
  `.local/audits/t12.6-walkthrough-legacy-20260724/` rather than deleting it.
- Contract: the generator replays only schema-6 T13 primary public routes through the
  real Core, validates terminal completion/zero targets, writes one current
  `Solution-1.md` through `Solution-20.md` plus linked SVG snapshots, and labels each
  route as feasible evidence rather than a unique or optimum answer.
- Commands/evidence so far: focused Core/UI/control coverage passed 22 files / 130
  tests; real browser audits passed the P/Enter pause path, click/R/Enter restart path,
  current 20-entry Puzzle selector, Collapse hard drops, one canvas, no DOM cells,
  no overflow, and zero errors. Full explicit single-worker matrix later passed 45
  files / 270 tests; typecheck and build passed. The default Vitest invocation was
  stopped after a no-output runner startup hang and is not reported as passing.
- Blocker: none. Next: commit this boundary, then execute the local archive and
  generator slice with fresh output verification.

## 2026-07-24 — TETRIS-T13.3-WALKTHROUGH-013 output checkpoint

- Base: `d288453`; contract checkpoint: `3fa71e0`; durable generator checkpoints:
  `5f1cd33` and `41fbfec`. Exact versioned source path:
  `tools/generate-puzzle-walkthroughs.mjs`. The second small checkpoint replaces an
  unsupported `file:` fetch with explicit UTF-8 disk loading; the tool otherwise has
  no product-runtime import or Puzzle-facing effect.
- Local output map: `Solutions/` has exactly `Solution-1.md` through
  `Solution-20.md` and their matching image directories. The generator replayed the
  current schema-6 primary routes through the real Core, wrote 265 SVG snapshots, and
  checked all 20 terminal states, target counts, route lock counts, immutable-anchor
  counts, and 5/6/7/8-row source bands. Markdown links were verified against every
  SVG path.
  Legacy ignored material remains recoverable under
  `.local/audits/t12.6-walkthrough-legacy-20260724/`; no local output was staged.
- Commands passed after the final tool edit: `node --check
  tools\\generate-puzzle-walkthroughs.mjs`; `node
  tools\\generate-puzzle-walkthroughs.mjs`; `npm.cmd run typecheck`; and `npm.cmd run
  build` (746 transformed modules). The unchanged product source had passed the
  explicit `npm.cmd run test -- … --no-file-parallelism --maxWorkers=1` matrix (45
  files / 270 tests) before this tools-only edit. A post-edit full Vitest attempt
  remained outputless during startup and was stopped, so it is not represented as a
  pass.
- Browser evidence: `.local/audits/t13-relay/audit.mjs` reran at 1440×900, 390×844,
  and 844×390. It confirms the 75-second 坍缩 state, two visible real hard-drop locks,
  score/chain/clock HUD, no legacy Sprint labels, four reachable modes, 20 open
  Puzzle controls, one selected preview, 44 px Puzzle targets, one gameplay canvas,
  zero DOM cells, no overflow, reduced motion, and zero browser errors.
- Blocker: no independent Core or visual/browser QA disposition exists. Next:
  coordinator record commit and the already user-authorized `main` recovery push; do
  not claim acceptance.

## 2026-07-24 — TETRIS-T13.12-EXPRESSION-026 acceptance record

- Base: pushed T13.11 `9b6188f`; contract checkpoint `369c8fa`; UI/interaction source
  checkpoint `a6d0baa`; Mutation materials/effects/audio checkpoint `165f91b`; and
  final contrast assertion checkpoint `ec36924`. Exact source paths are the contract's
  authorized App/localization/styles, renderer/theme/audio, and direct test paths.
  The QA-only blocker record `d3c4302` remains historical; recovered independent QA
  `d7fc929` accepts the unchanged product candidate `9b6188f..ec36924`.
- Delivered: stable Puzzle best text and selected preview; completed `√` states;
  responsive Settings with compact itemised rules; Back/Settings usable through entry
  countdown; direct board gestures with no touch-key deck; and role-coloured action
  controls. Mutation now has full-cell special materials/emblems, Classic-like live
  metrics, a timed effect ledger, bounded local renderer cues, and newest-item-owned
  audio; no Core rule, seed, queue, storage, or Puzzle definition was changed.
- Coordinator commands passed after the last source repair: `npm.cmd run typecheck`,
  `npm.cmd run test` (22 files / 146 tests), and `npm.cmd run build` (746 modules).
  First-party real browser review and independent local-Playwright evidence verify
  desktop/390px no-overflow, visible selector/settings surfaces, countdown `S`/`Esc`,
  one canvas/zero DOM cells, no touch rail, real Freeze carrier evidence, and zero
  console/page errors. QA evidence remains ignored under
  `.local/audits/t13-12-independent-qa/browser/`.
- Resource cleanup complete: the coordinator's exact Vite process `32312` was verified
  as `reproduction-tetris` port 5176, then force-stopped after evidence; process and
  listener are both absent. No `chrome`/`chromium` audit process remains. Existing Edge
  and unrelated Codex MCP processes were not targeted, and the user-owned lockfile
  remains untouched. Next: push accepted `main` and report the retained lockfile.

## 2026-07-24 — T13.14 entry overlay source checkpoint

- Task: restore the player-visible 3 → 2 → 1 entry overlay before progressing to the
  compact Settings pass. Base: `689bbf7`; source checkpoint: `6a0fb8a`.
- Exact changed product path: `src/styles.css`. A late generic `.board-frame` cascade
  had overwritten the countdown frame's z-index, leaving the live Pixi canvas above
  its digit and mask. The dedicated countdown frame now owns the temporary top layer;
  its masked field stays input-transparent and is removed after the existing three
  second timer.
- Commands/evidence: `npm.cmd run test -- src/App.test.ts` (1 file / 20 tests), the
  required web-game Playwright client, and a direct local Playwright run against the
  project-owned Vite listener. The browser reports `3`, `2`, `1`, then no overlay with
  `status: playing`; inspected local captures show the full board mask and centred
  digits. The current user-confirmed selector numeral/tick replacement was left alone.
- Blocker: none for the entry overlay itself. Next: T13.14 Settings composition, rail
  terminology/forecast, and Survival leaderboard display; `package-lock.json` remains
  inherited and unstaged.

## 2026-07-24 — T13.14 Settings density and Survival record checkpoint

- Base: `9a867f0`; source checkpoints `ce14ba7`, `40c0385`, `d1afaeb`, and
  `0fb2b88`. Exact product paths are `src/styles.css`, `src/leaderboard.ts`,
  `src/ui/localization.ts`, `src/App.test.ts`, and `src/leaderboard.test.ts`.
- Delivered so far: the Settings sheet now uses a deliberately aligned two-column
  control/reference composition, intrinsic keyboard/rule rows, compact bilingual key
  groups, and a full-width record footer. No fractional grid row or unmatched card
  bottom is used to manufacture whitespace. Survival ranking now compares duration,
  then cleared lines only; its Settings record line visibly omits piece count.
- Commands/evidence: `npm.cmd run test -- src/App.test.ts` passed 20/20, then
  `npm.cmd run test -- src/App.test.ts src/leaderboard.test.ts` passed 26/26.
  Local Playwright desktop Chinese and English checks show no overflow and confirm
  aligned top-card bottoms, readable shortcut labels, and duration-plus-lines-only
  Survival records. The required web-game client was attempted for the interim
  Settings state, but its timed-out child browser was explicitly released; final
  visual evidence came from direct local Playwright against the existing project Vite
  listener.
- Blocker: none for the bounded visual/record work. The setting composition must be
  revisited after the separate music-removal slice because it deliberately removes one
  current control. Next: Puzzle terminology and dual in-panel forecast, then music
  removal and the remaining T13.14 mechanics. `package-lock.json` remains inherited
  and unstaged.

## 2026-07-24 — T13.14 Puzzle rail clarity checkpoint

- Base: `659fb18`; source checkpoint: `c381b9e`. Exact product paths are
  `src/App.tsx`, `src/App.test.ts`, `src/ui/localization.ts`,
  `src/game/render/TetrisRenderer.ts`, and `src/styles.css`.
- Delivered: Puzzle now shows only original-block and operation counters; the redundant
  objective card is absent. Its forecast introduces two compact named lanes inside the
  Next instrument—`1 / 下一个方块` and `2 / 后一个方块`—and the canvas well has a matching
  divider between the actual two queued pieces. Classic and Mutation gravity use
  `下落速度/格` / `Fall speed / cell`. Live values use restrained tabular mono treatment
  while labels retain the readable bilingual UI face; the wordmark remains untouched.
- Commands/evidence: `npm.cmd run test -- src/App.test.ts
  src/game/render/TetrisRenderer.test.ts` passed 27/27; `npm.cmd run typecheck` passed.
  An inspected local browser capture at
  `.local/audits/t13.14/rail/puzzle-rail.png` shows the two labelled forecast lanes,
  both real previews, the divider, and the renamed Puzzle counter. No Core/Puzzle route
  data changed.
- Blocker: none for this bounded rail checkpoint. Next: remove the current music and
  rerun the all-mode Settings density audit because its controls will change.

## 2026-07-25 — T13.14 detail stability and music-free Settings checkpoints

- Base: `49e445d`; source checkpoints: `c8e4546` and `076417c`. The first owns
  `src/App.tsx`, `src/App.test.ts`, `src/ui/localization.ts`, and `src/styles.css`.
  The second owns `src/game/audio/AudioEngine.ts`,
  `src/game/audio/AudioEngine.test.ts`, `src/game/runtime/GameRuntime.ts`, and
  `src/game/runtime/GameRuntime.test.ts`. No Core, Puzzle definition, or renderer path
  changed; inherited `package-lock.json` remains unstaged.
- Scope/delivery: selected Puzzle details reserve their optional best-result slot, so
  the preview/copy boundary is invariant whether a level has history or not. Settings
  now targets its four actual direct children rather than the retired reference wrapper:
  desktop is controls + keyboard, then rules, then records; portrait stacks those same
  bands. The visible music control and all procedural music lifecycle, bus, phrase, and
  timeout code are removed while original SFX and volume remain.
- Commands passed: `npm.cmd run test -- src/App.test.ts` (20/20),
  `npm.cmd run test -- src/game/audio/AudioEngine.test.ts
  src/game/runtime/GameRuntime.test.ts` (18/18), and `npm.cmd run typecheck` after
  both checkpoints. `git diff --check` passed before each commit. The required
  web-game Playwright client ran successfully with the Puzzle-entry action.
- Browser evidence: `.local/audits/t13.14/puzzle-alignment/audit.mjs` captures both
  history states at 1538 × 1092 and 390 × 844: desktop divider y=917 in both states;
  portrait divider y=376 in both states; zero page/console errors. The all-mode,
  bilingual `.local/audits/t13.14/settings-music-removal/audit.mjs` waits through the
  real countdown, then captures 12 Settings surfaces; each has no music UI/copy, no
  horizontal overflow, and zero page/console errors. Representative desktop Classic,
  English Survival/Mutation, Puzzle, and portrait captures were visually inspected.
- Blocker: none for these two source claims. Next: implement the deterministic Mutation
  refresh/visual-effects source checkpoint, then audit its real material and active
  state. Do not mark the overall T13.14 goal complete before the required Survival
  debris stream, final full gates, and independent QA.

## 2026-07-25 — T13.14 Mutation refresh and semantic-feedback checkpoints

- Base: `9e36965`; source checkpoints `51c08aa`, `d5597c3`, `663f261`, and
  `8d67af3`. Exact product/test paths are `src/game/core/engine.ts`,
  `src/game/core/sprint.test.ts`, `src/game/render/theme.ts`,
  `src/game/render/TetrisRenderer.ts`, `src/game/render/TetrisRenderer.test.ts`,
  `src/App.tsx`, `src/App.test.ts`, `src/ui/localization.ts`, and `src/styles.css`.
  The inherited `package-lock.json` is explicitly excluded and remains unstaged.
- Delivered: every timed carrier recollection resets to exactly 600 deterministic
  ticks; Multiplier retains 2×→4× only as its strength progression. Carriers now use
  distinct ice-crystal, dense-gravity, ember-core, and star-mineral construction;
  Freeze frosts the frame, Collapse applies bounded pressure lanes, Bomb has a local
  blast, and Multiplier has score-light. The status rail uses three labelled timer
  instruments and removes the visual Bomb-clear explanation.
- Commands/evidence: `npm.cmd run test -- src/game/core/sprint.test.ts` passed 11/11;
  `npm.cmd run test -- src/game/render/TetrisRenderer.test.ts` passed 8/8;
  `npm.cmd run test -- src/App.test.ts src/game/render/TetrisRenderer.test.ts` passed
  28/28; all listed checkpoints passed `npm.cmd run typecheck` and `git diff --check`.
  The mandatory web-game client ran before and after the status fix. Ignored local
  `.local/audits/t13.14/mutation-live-audit.mjs` exercised real seeded drops, captured
  all four carrier and activation states, and reported one canvas, zero DOM cells, no
  overflow, and no console/page errors; the coordinator visually inspected the final
  carrier, Bomb, and Multiplier frames.
- Blocker: none for Mutation source behavior. Next: implement the deterministic
  Survival stone/debris stream, then run the final T13.14 full quality gates and a
  cross-mode desktop/portrait/landscape/reduced-motion browser batch before asking for
  independent read-only QA.

## 2026-07-25 — T13.14 readable Puzzle Next numeral correction

- Task: correct the player-reported malformed left `1` in Puzzle's shared two-row
  Next well without reopening Puzzle queue semantics, Settings composition, or Core.
  Accepted-source base: `e9db541`; corrective UI/contract sequence:
  `a58b98b..866ef0a`, with current source checkpoint `866ef0a`. Exact product/test
  paths for the final correction are `src/game/render/TetrisRenderer.ts`,
  `src/game/render/TetrisRenderer.test.ts`, and `src/styles.css`; the separate
  contract checkpoint `e09cd21` updates `docs/CURRENT_TASK.md` and `docs/DESIGN.md`.
  The user-owned `package-lock.json` remains explicitly excluded.
- Delivery: Pixi no longer draws a custom, partial-stroke numeral. The same ordinary
  dark Next well retains its two physical rows and canonical previews, while each row
  now overlays a readable, loaded JetBrains Mono `1` or `2` at the left edge. The
  DOM marker stays transparent to input, uses tabular digits, and rises above only the
  canvas-owned well instead of creating a second card or label strip. Responsive Puzzle
  rail stacking preserves the markers at desktop, short landscape, and portrait widths.
- Focused commands: `npm.cmd run typecheck`; `npm.cmd run test --
  src/App.test.ts src/game/render/TetrisRenderer.test.ts` (**2 files / 31 tests**);
  and the required `web_game_playwright_client.js` Puzzle-entry run all passed.
  Inspected captures include `.local/audits/t13.14/modal-background-next/puzzle-live.png`,
  `puzzle-short-landscape.png`, and `puzzle-portrait.png`; the portrait report confirms
  two 44 px forecast rows and no overflow.
- Final gates after the last source edit: `npm.cmd run typecheck`; `npm.cmd run test`
  (**22 files / 165 tests**); and `npm.cmd run build` (**746 modules**) all passed.
  Fresh local browser audits passed: `modal-background-next-audit.mjs` (two labelled
  rows, desktop/landscape/portrait, live board behind four modals),
  `settings-music-removal-audit.mjs` (16 captures, zero errors),
  `reduced-motion-audit.mjs` (single visible canvas and no animation/overflow),
  `mutation-live-audit.mjs` (four carrier/effect states), and
  `survival-stone-audit.mjs` (visible y=20 to y=21 stone fall, one canvas, zero DOM
  cells, no overflow). Representative final frames were visually inspected.
- Blocker: none in the implementation. Next: independent read-only QA reviews the
  exact `e9db541..866ef0a` corrective range and its fresh evidence before any
  T13.14 acceptance/changelog/push claim.

## 2026-07-25 — T13.14 final coordinator acceptance

- Read the independent report and its committed record `b60511e`. It accepts the full
  corrective candidate `e9db541..0bb2ba9` (final product source `866ef0a`) with no
  P0–P2 finding. Its independent typecheck, 22-file / 165-test suite, and 746-module
  build passed.
- QA independently checked the shared Puzzle well at 2040 × 986, 1056 × 480, and
  390 × 844. Each surface has one canvas, one dark two-row well, standard readable
  JetBrains Mono `1` / `2` glyphs, no overflow, and no page error. It also rechecked
  the final compact Settings/no-music, reduced-motion, Mutation, and Survival-stone
  evidence. This resolves the only player-reported malformed numeral issue without
  reopening gameplay state.
- Coordinator disposition: accept T13.14 after documentation integration and resource
  cleanup. Next: release only the coordinator-owned audit listener after verifying its
  exact owner, confirm the inherited `package-lock.json` remains the sole local dirty
  path, then push the accepted `main` chain.
