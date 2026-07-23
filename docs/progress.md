Original prompt: separate Tetris into E:\Proj\reproduction-tetris, diagnose the mixed Temple/Tetris history and local QA copies, then correct the tiny and overlapping Tetris presentation without changing accepted game rules.

## 2026-07-24 — T13.4 production-test discovery correction verified locally

- The current product candidate is clean and pushed, but the unqualified Vitest command
  scans ignored local archive material. A list-only probe isolated the stale
  `.local/audits/t12.6-walkthrough-legacy-20260724/generate-solution-walkthroughs.test.ts`
  import as the first discovery failure; it references the intentionally archived T12
  route artifact through a no-longer-valid relative path.
- Scope stayed configuration-only: `vite.config.ts` now declares the current source
  include pattern and imports `defineConfig` from `vitest/config`. The unqualified
  command now discovers 23 `src/` files and passes 138 tests in 11.40 seconds; it no
  longer discovers ignored/local or historical docs tests.
- Final candidate `dc9acca` also passes `npm.cmd run typecheck` and `npm.cmd run
  build` (746 modules). A real-time Playwright audit at 1440×900, 390×844, and
  844×390 confirms Collapse's real hard drops, all 20 open Puzzle controls, one canvas,
  zero DOM board cells, no overflow, reduced motion, and zero errors. The generic
  web-game client was invoked but cannot advance the product countdown without an
  `advanceTime` hook; it is not used as acceptance evidence.
- No Puzzle product source or surface changed. The remaining acceptance condition is
  an independent read-only Core and visual/browser QA disposition, not a known product
  or test-runner blocker.

## 2026-07-24 — T13.3 current walkthrough artifact recovery verified locally

- Archived the exact stale local T12 walkthroughs, screenshots, candidate scratch
  data, and retired helper scripts under
  `.local/audits/t12.6-walkthrough-legacy-20260724/`; nothing was deleted or staged.
  `Solutions/` is now exactly twenty current one-based Markdown walkthroughs plus
  their twenty SVG snapshot directories.
- Versioned `tools/generate-puzzle-walkthroughs.mjs`, which loads the schema-6 route
  artifact from disk, replays each primary public command route through the real Core,
  validates `finished` plus zero remaining original targets, and writes current
  snapshots after every automatic settlement. It makes no product startup, Puzzle
  rule, selector, queue, anchor, or visual change.
- Regeneration passed with 20 Markdown walkthroughs and 265 linked SVG snapshots; all
  links resolve and the replayed target-row distribution remains five each of 5, 6, 7,
  and 8 rows. `npm.cmd run typecheck`, `npm.cmd run build` (746 transformed modules),
  and the earlier desktop/portrait/landscape browser audit pass. The audit rechecks
  Collapse, all-open Puzzle access, one canvas, no DOM cells, no overflow, reduced
  motion, and zero errors. The preceding product source had passed the explicit
  45-file / 270-test single-worker matrix before this tools-only change; a post-change
  full Vitest attempt emitted no startup output and was stopped, so it is not counted
  as a passing suite.
- Candidate chain: `3fa71e0..41fbfec`. This is a coordinator recovery record, not an
  independent-QA acceptance.

## 2026-07-23 — T13.2 Collapse source candidate

- Source candidate `eaf88d0` replaces the rejected Sprint with **坍缩**: a 75-second
  score attack using fresh live seven-bags, steady brisk gravity, per-column collapse
  after every lock and after each clear, depth-squared clear scoring, and a clock-only
  finish. The renamed leaderboard ranks score, best chain, lines, then fewer pieces;
  incompatible v4 Sprint rows are deliberately excluded while Classic/Survival rows
  migrate with a zero chain.
- The candidate also records the quiet entry treatment, replaces legacy player-facing
  Sprint wording, and keeps the current Puzzle implementation untouched. The separate
  test-only replay-fixture correction is `8c51e8c`; it changes no Puzzle gameplay.
- Final gates pass: `npm.cmd run typecheck`; the explicit 45-file / 270-test
  single-worker Vitest matrix; `npm.cmd run build` (746 transformed modules); and a
  real-time Playwright audit at 1440×900, 390×844, and 844×390. The audit verifies
  two live hard drops, visible locked cells, one canvas, zero DOM board cells, no
  overflow, no console/page errors, 20 unchanged open Puzzle controls, and reduced
  motion. Local captures remain ignored under `.local/audits/t13-relay/`.
- The generic web-game client was invoked as required, but the app exposes no
  `advanceTime` hook for it to cross the opening countdown; the real-time audit above
  is the authoritative input proof. Next: commit the coordinator record/changelog and
  make the user-authorized recovery push without calling this candidate accepted.

## 2026-07-23 — T13.2 fourth-mode Collapse redesign opened

- User clarified that the rejected fourth mode is Sprint, not Puzzle. Puzzle is now
  explicitly closed to source and visual changes pending a separate future request.
- The replacement is **坍缩**: a 75-second score attack where ordinary cells settle
  separately in their columns after every locked piece and after every line clear,
  creating deterministic cascades from a single placement. Its rank uses score, best chain, lines, and fewer pieces;
  the prior excavation target/time-completion design is superseded.
- The prior landscape browser audit found a real 32/40 px control regression. The
  active stylesheet correction restores 44 px targets; it must be re-audited with the
  final Collapse surface rather than treated as resolved by source inspection alone.

## 2026-07-23 — T13.1 feedback correction opened

- User rejected the recent workbench ornament: background field lines, technical
  English, telemetry-like ordinals/counts, the footer strip, the five-cell rising
  cluster, and slanted pseudo-block marks are all now out of scope. The replacement
  keeps only useful copy, real four-cell glyphs, an ungridded selected endgame well,
  and restrained state motion.
- User also rejected the empty-board 40-line Sprint as too close to Classic. The
  authorized replacement is a fresh-seed **清障冲刺**: a low seven-row ordinary rubble
  field whose original opening cells must be cleared as quickly as possible. It keeps
  the live randomizer, fixed brisk fall, and time leaderboard but gains target-cell
  tracking and a clear/opening-read objective distinct from Classic, Survival, and
  fixed Puzzle endgames.
- The selected Puzzle preview is now explicitly a readability target: it must enlarge
  its actual board cells and use a cohesive, high-separation palette on the quiet dark
  well. The selector remains number-led; no decorative thumbnail system returns.
- Two prior final-suite attempts are explicitly inconclusive, not passes: default
  Vitest ended at 124 seconds without output, and a later single-worker run was
  deliberately stopped after an extended no-output wait. Existing targeted checks and
  browser audit evidence remain useful checkpoint evidence only.
- Next: commit this documentation boundary, then implement/test Core Sprint first and
  quiet the two entry surfaces as a separate visual checkpoint.

## 2026-07-23 — T13 baseline and active contract

- New user objective supersedes the T12.7 target-floor campaign: every Puzzle board
  must become a five-through-eight-row legal mid-game endgame with meaningful fixed
  anchors, multiple Core-replayed routes, all entries open, and an improved selector.
- T13 additionally requires click-parity P/R/Enter controls, a pause sheet containing
  only Continue, a confirmation-gated R restart, a fourth 40-line Sprint mode, staged
  rollback commits, and final Git/local-artifact cleanup.
- Baseline: `main`/`origin/main` are clean at `550d77e`; versioned root contents already
  follow the project map. Local ignored historical material exists under sanctioned
  `Solutions/`, `output/`, `.playwright-mcp/`, and `.local/`; it will be archived or
  regenerated only through explicit T13 cleanup steps, never broadly deleted.
- Current next action: complete the contract checkpoint, then implement shortcut parity
  as the first independent source slice before touching Puzzle definitions.

## 2026-07-23 — T13 desktop-readiness addendum

- The user requires future application packaging compatibility, but explicitly does not
  authorize a package in T13. The browser-first Vite product remains the current
  deliverable; no Electron/Tauri/Capacitor/native dependency or binary is introduced.
- A later bounded platform-boundary checkpoint will make storage, visibility, timer,
  focus, and audio capability handling host-replaceable while preserving pure Core
  simulation, Vite-relative offline assets, current versioned save migration, and the
  one-canvas lifecycle. Final evidence must record this readiness disposition.

## 2026-07-23 — T13 direct-control checkpoint

- Source checkpoint `447ec1e` makes `R` page-level confirmation only, leaves `P` on
  the same Runtime pause action as the visible header control, lets `Enter` continue a
  pause or confirm a restart, and removes the pause-sheet exit action.
- Targeted App/input tests and typecheck pass. A real local browser audit confirms
  P-pause/Enter-resume, click-restart/Escape-cancel, R-restart/Enter-confirm, zero
  console errors, one canvas, no DOM cells, and no viewport overflow. Local evidence
  is under `.local/audits/t13-input/`.
- Next: use the explicit archive routes for legacy ignored material, then replace the
  target-floor curriculum with generated legal five-through-eight-row endgames.

## 2026-07-23 — T13 endgame Core checkpoint and open-workshop direction

- Source checkpoint `b789833` replaces all hand-shaped Puzzle starts with 20 legal
  zero-clear setup histories, ordered as five 5-row, five 6-row, five 7-row, and five
  8-row endgames. The schema-6 route record proves two divergent public-input Core
  routes for every level; six anchors are tested as consequential non-target release
  seams rather than decorative blocks.
- The next independent source step retires the old tier gate while preserving historic
  completions as history. The selector will use one illuminated relay line, four quiet
  row bands, and a single selected well; all 20 stops are available from a fresh save.
  Guides remain optional, compact, and non-spoiling.

## 2026-07-23 — T13 gravity-workbench presentation checkpoint

- Source checkpoint `ac25dba` replaces the rejected loose home cards and sparse relay
  canvas with a unified dark-well/mineral-paper entry system: four connected mode lanes
  on home and a compact selected-endgame console beside a dense 20-stop Puzzle matrix.
- Visual verification covers desktop, portrait, and short landscape: all four mode
  entries, 20 open levels, the one selected board preview, 44 px Puzzle targets,
  no page overflow, reduced motion, selected-level start into one canvas/zero DOM cells,
  and zero browser errors. A short-landscape label overlap was found during inspection
  and corrected by changing the lane internals from grid to flex alignment.
- Next: complete T13 local walkthrough/archive recovery and final whole-range gates;
  the user-visible redesign source is checkpointed but not yet a final publication.

## 2026-07-15

- Created standalone Tetris repository and retained QA clones under `.local/qa-archives`.
- Isolated stale pre-V1 `dist` outside the active repository.
- Confirmed `4c85828` is the last pure Tetris integration point; later commits are docs-only coordination changes.
- Confirmed the screenshots use the accepted V1 source, not an alternate version.
- Root cause: 718 px shell cap, 306 px board cap, 174 px three-mode rail, and five controls forced into 306 px.
- Implemented the bounded T4 desktop layout recovery: 380 × 760 at 1440 × 900,
  460 × 920 at 2048 × 1152, complete Chinese mode labels, stacked control
  glyphs/labels, and the corrected pause-height ratio.
- Final local gates passed once: typecheck, 36-file/234-test Vitest, build, and a
  19-capture browser matrix under `docs/qa/evidence/tetris-t4/`.
- Active TODO: independent QA, coordinator changelog integration, and one push.

## 2026-07-16 — T5 opened

- User rejected the T4 Mineral Shelf presentation and requested a full light cyan/light-blue rebuild with a dedicated three-mode entry page.
- Race changed from a 20-line finish to endless accelerating normal play; only explicit exit or top-out ends the run.
- Puzzle first changed to longer finite authored queues, then the user superseded that
  draft: current authority is normal automatic-gravity play on an authored starting
  board, a continuously replenishing deterministic seven-bag stream, no piece budget,
  and multiple valid solution routes per level.
- Root-cause audit found Puzzle soft drop can reach the floor but never lock because puzzle ticks return before grounded lock-delay handling.
- Preserved the rejected T4 follow-up on local branch `codex/tetris-t4-rejected-preservation` at `1362c664629b2a83f0659f836259b84c21750fee`, then returned to a clean `codex/tetris-recovery` tree.
- T5 uses the `4c85828` deterministic core/rule authority while retaining `dd7e31e` only as a historical ancestor.
- Core candidate `3bf170e` proved endless Race and repaired consecutive Puzzle locking,
  but independent QA rejected its live runtime replay-state injection. The injection
  deletion is retained uncommitted while the finite-queue Puzzle work is superseded.
- Revised Core candidate `630fb30` implements seeded normal play, twelve verified
  multi-route references, automatic gravity, continuous seven-bag input, and no budget
  terminal. Independent read-only QA accepted it after 22-file / 140-test focused
  verification and typecheck.
- Active TODO: implement and verify the original `青流方阵` Aqua Blueprint frontend,
  then one combined final gate/evidence pass and final QA.
- User removed `index.html` from the redesign scope; it remains unchanged as the Vite
  entry while page branding and accessibility copy are rebuilt under `src`.
- User clarified the product remains a browser HTML webpage, not a native app or PWA.
- Frontend candidate `b480e7d` and coordinator evidence child `9b7e552` passed the
  combined typecheck, 37-file / 237-test suite, build, five-viewport browser matrix,
  visible keyboard/touch scenarios, and visual review.
- Independent final QA rejected `9b7e552` on one fail-closed issue: DEV
  `__TETRIS_D4_QA__.collect()` exposes the runtime state object by reference. The
  bounded `TETRIS-T5-FINAL-QA-FIX-001` slice must return a detached snapshot, prove
  nested mutation isolation, and refresh final-SHA browser evidence before integration.

## 2026-07-17 — first T5 frontend rejected

- User rejected both the `青流方阵` name and the complete Aqua Blueprint page;
  candidate `b480e7d` and evidence child `9b7e552` remain local rejected history.
- The standalone snapshot-only fix was stopped before it changed any file. Its
  state-clone regression requirement moves into `TETRIS-T5-FRONTEND-REDESIGN-002`.
- Current frontend authority is plain-text `Tetris`, a clean light cyan/light-blue
  game interface, compact layered mode entrances, a non-overlapping Puzzle selector,
  one coherent game surface, and rounded ceramic cells. No commercial logo, font,
  product layout, or trade dress may be copied.

## 2026-07-17 — second T5 frontend rejected

- Candidate `c9135f3252abfa3bd6d7e94c5eb2e11fc3c72a18` completed typecheck,
  38 files / 238 tests, build, and bounded browser smoke, but the user rejected its
  full visual presentation rather than requesting a local polish pass.
- Independent review also found computed mobile statistic text at only 8–11 px and
  legacy player-facing `路线` copy. Those findings move into the replacement contract;
  the rejected rounded mode bands and ceramic cells are not repaired in place.
- Latest authority is light neo-tech minimal: one continuous 1+2 mode surface, precise
  thin edges, one cyan-to-blue phase seam, coherent Puzzle/game surfaces, and flat
  edge-lit plate cells. Grids, CAD/scanlines, decorative technical text, toy/glass
  styling, marketing heroes, settings lists, floating-card piles, and looping
  ornament are forbidden.
- The accepted endless Race, continuous seven-bag Puzzle, all-level access,
  lifecycle/accessibility behavior, and detached QA snapshot regression remain fixed.
- Next: commit the Slice E contract, authorize one bounded frontend writer, then route
  the exact candidate through independent QA before evidence, changelog, or push.

## 2026-07-17 — Slice E final evidence rejected with bounded fixes

- Neo-tech minimal candidate `f66c118` and compact-layout fix `f277c2a` passed writer
  gates and independent product QA. Coordinator evidence child `221c821` contains 16
  first-viewport captures and passed the final 38-file / 238-test suite and build.
- Final visual QA found one product defect: at 360 × 800 the Puzzle goal is visibly
  ellipsized as `清空完整棋...` instead of `清空完整棋盘`.
- Final static QA found one evidence-integrity defect: Windows CRLF bytes were hashed
  before Git normalized `browser-evidence.json` to LF, so raw Git-blob verification
  matched 17/18 entries even though the local working tree matched 18/18.
- All other reviewed visuals, five-viewport geometry, 44 px controls, 12/14/18 px
  type floors, lifecycle teardown, detached snapshots, normal-gravity Puzzle locks,
  public-keyboard success, endless Race, and evidence scope passed.
- Next: one CSS/log writer fixes only the narrow Puzzle statistic allocation; after
  independent product QA, the coordinator regenerates all formal evidence with
  explicit LF output and repeats final exact-commit QA before changelog or push.

## 2026-07-17 — fifteen-level multi-color direction opened

- Slice F candidate `56288cd` fixed the 360 × 800 Puzzle goal using only a 40/60
  narrow statistic-column allocation plus the frontend log. Independent browser QA
  accepted the exact SHA at 360/390/844: complete `清空完整棋盘`, 18 px value text,
  44 px controls, one canvas, zero DOM cells, no overflow, and no console errors.
- The user then extended the product target before release: player-facing `马拉松`
  becomes `经典`; pieces use a more varied original multi-hue palette; Puzzle grows
  from six to at least fifteen all-enabled levels; and every prefilled board uses
  multiple piece colors.
- Public descriptions of comparable falling-block products informed only the abstract
  split between continuous classic play and a larger level library. No external level
  mask, name, palette mapping, interface, or trade dress is copied.
- Core preflight confirmed that normal gravity, continuous seven-bag replenishment,
  board-empty success, top-out, and progress derivation are already level-count
  independent. Slice G therefore owns fifteen definitions, deterministic multi-color
  canonical boards, nine new original masks/seeds, and thirty public-dispatch route
  proofs without changing engine/random/runtime/frontend code.
- After independent Core QA, Slice H owns visible `经典` copy, the frozen original
  mineral-signal seven-color theme, and a responsive fifteen-entry library. Formal
  evidence and raw-blob LF correction are deferred until both new slices pass QA.
- No push is eligible from the rejected six-level evidence chain.

## 2026-07-17 — Slice G fifteen-level Core accepted

- Core candidate `48a229e` extends the production library to exactly fifteen levels,
  retains the first six IDs, seeds, normalized occupancy masks, and two placement
  streams, and adds nine original seeds/masks with thirty total production
  `createInitialState` plus public-`dispatch` solution routes.
- Every authored starting board now uses all seven piece types through a deterministic
  salted color pass that is independent from gameplay randomization. Independent QA
  confirmed the first 84 pieces remain twelve complete seven-bags for all fifteen
  seeds and that generation continues beyond that horizon.
- Independent Core QA accepted the exact candidate: new levels each use 10 occupied
  rows, 10 normalized row shapes, 4 density classes, 5–9 covered-cavity columns, and
  11–14 buried holes; pairwise new-mask Hamming distance is at least 24; routes use
  29–35 locks and every route pair diverges in an intermediate canonical board hash.
- Writer gates passed: typecheck, 38 files / 248 tests, 739-module production build,
  and the explicit 15-level / 30-route verifier. QA reran only bounded target tests,
  verified reference SHA-256
  `F1A05DB8CA31B6833FCF09F096A5C726E29D5B95274897A2A7E0259A5ED7696C`, and left the
  worktree clean.
- Slice H is now the sole active writer boundary: visible `经典`, the frozen original
  seven-color mineral-signal theme, and the responsive fifteen-entry level library.
  Core definitions, routes, engine, randomizer, `index.html`, and formal evidence stay
  read-only until frontend QA accepts its exact candidate.

## 2026-07-17 — Slice H functional candidate visually superseded

- Slice H candidate `248ca89` completed `经典`, dynamic fifteen-level binding, 3 × 5
  desktop/844 and two-column mobile selectors, canonical first/eighth/fifteenth UI
  starts, and seven-color Board/Next/silhouettes. Writer gates passed after its last
  source fix: typecheck, 40 files / 252 tests with one intentional skipped helper,
  739-module build, and the five-viewport browser matrix.
- The user rejected this finish before independent acceptance: the page must look more
  premium, the current blocks are specifically ugly, and every piece must use bright
  color. `248ca89` remains a clean fallback only; no evidence or push may use it.
- Read-only visual diagnosis found the ordinary feel came from table-wall repetition,
  empty detail space, repeated rounded HUD cards, generic segmented controls, and the
  muted double-outlined minos reading as plastic/candy at mobile scale.
- Slice I now owns one bounded frontend/render replacement. It preserves all accepted
  behavior and responsive geometry while introducing the exact bright luminous-spectrum
  mapping, a flat precision-slab Pixi primitive, tighter premium hierarchy, coherent
  HUD/control surfaces, and a filled final mobile grid row. Core, dependencies,
  `index.html`, coordinator docs after this contract, and formal evidence remain
  read-only for the writer.
- The user then broadened the page palette itself: premium technology color is not
  restricted to light blue/green. Slice I therefore uses an ice-light spectral-glass
  system with controlled cyan, cobalt, violet, and small coral state accents while
  keeping the separate seven-piece bright mapping and avoiding a dark/random rainbow.

## 2026-07-17 — Slice I rejected; authored endgames and deep natural theme opened

- Slice I checkpoint `e552b3c` completed the bright spectral surface, renderer, and
  five-viewport writer gates immediately before the next user review. It remains clean
  and local, but is rejected as a release candidate and will not receive QA, evidence,
  changelog integration, or push.
- The user identified three replacement requirements: remove the plastic color feel
  in favor of a deeper, tenser, mutually compatible natural palette; rebuild Puzzle
  boards as rule-stacked endgames whose colors correspond to actual source
  tetrominoes; and remove redundant descriptions from the classic-game interface.
- Read-only Core audit confirmed the current generator randomly excavates occupancy
  masks and then independently assigns a salted seven-bag color to every occupied
  cell. It proves neither a legal stacking history nor four-cell color/shape
  provenance, so all fifteen masks and thirty solution references must be replaced.
- Slice J now owns frozen setup seeds plus explicit `{ type, rotation, x }` histories.
  Every landing row is derived by public-command hard drop from an empty board, setup
  performs zero line clears, and the derived Puzzle board must preserve each source
  tetromino as an exact four-cell same-material component.
- Official descriptions of ordinary falling/rotation, Perfect Clear, and
  multiple-solution Tetrimino puzzles informed only the abstract objective and
  validation principles. No external mask, color mapping, level name, UI composition,
  or route is copied.
- After independent Core QA, Slice K applies the exact `暮海矿物` tokens and coordinated
  garnet/sea-pine/ochre/storm/moss/rock-violet/lake piece mapping, removes BlurFilter
  aura and glass effects, and reduces visible copy to names, controls, statistics,
  completion, and the immediate board-clear objective.

## 2026-07-17 — authored endgames generated; stale QA replay isolated

- Slice J generated fifteen legal zero-clear setup histories and thirty successful
  public-dispatch routes. Its targeted production verifier passed 63 tests, with the
  reference JSON rebuilt from the new signed histories.
- The first complete suite passed 39 files / 251 tests and failed only the internal
  `PUZZLE_CHALLENGE_QA_ROUTE`, which still contained the rejected former first-level
  placements. Typecheck passed; build and the final complete reference verification
  correctly stopped pending the last source fix.
- Slice J-R is a separate exact-path migration for only `qaScenario.ts`, its direct
  test if required, and a runtime workstream log. It may update the frozen 35-lock
  public-command fixture but may not change Puzzle rules, runtime behavior, Core,
  frontend, or `index.html`.

## 2026-07-17 — authored mid-game endgames accepted; Slice K opened

- Final Core/runtime source SHA `26ef004` passed one complete post-fix sequence:
  typecheck, 39 files / 252 tests, 739-module production build, and the explicit
  15-setup / 30-route verifier with 49 tests.
- Independent read-only QA accepted `50be21d..676d804`. It confirmed every level is a
  frozen mid-game snapshot produced from an independent seeded seven-bag and 16–22
  legal placements, rather than a random mask; all source-piece shapes and colors are
  exact, pairwise board Hamming distance is at least 24, and all thirty routes satisfy
  the strengthened diversity thresholds.
- Reference SHA-256 is
  `4c8f9fac3451b2e888c5560126b75c5cd949c7e1a947f04274698e93c0171bec` at 263,980
  bytes with zero CRLF. The J-R first-level QA fixture exactly matches the signed
  35-placement route and changes no Race or production dispatch behavior.
- Slice K is now the sole active product boundary. It owns player-visible `经典`, the
  exact coordinated `暮海矿物` palette, matte anodized Board/Next cells, and concise
  names/controls/statistics/objective copy. Core, runtime, `index.html`, dependencies,
  coordinator docs, changelog, and formal evidence remain read-only to its writer.

## 2026-07-17 — Slice K rejected; typography and divider repair opened

- Slice K source `1b1bfdb` passed writer typecheck, 253 tests, build, action client,
  and a five-viewport matrix. Independent visual review accepted the deep mineral
  palette, matte cells, all fifteen distinct multi-color boards, geometry, contrast,
  lifecycle, and concise `经典` presentation.
- Independent QA rejected three frozen-contract deviations: portrait/narrow/844
  landscape hide visible `Next` and the keyboard map; `surface-in` travels 6 px rather
  than at most 4 px; and the renderer's line-clear sweep lasts the full 200 ms phase
  rather than 120–160 ms. ARIA does not replace required visible copy.
- The user's screenshot also proves the statistic grid's generic odd/even border rules
  produce a half horizontal divider and stray vertical segment. The repair freezes
  role-based Puzzle rows so level and objective span both columns around the middle
  placed/cleared pair.
- Slice K-R additionally adopts the open-source Google Fonts combination `Space
  Grotesk` + `Noto Sans SC` through CSS v2 with `display=swap` and system fallbacks.
  It keeps `Tetris` as plain text and leaves `index.html`, dependencies, Core,
  runtime, input/audio/storage, and formal evidence unchanged.

## 2026-07-17 — cohesive dimensional tetromino repair added

- The user's gameplay screenshot shows that the accepted colors are still rendered as
  isolated flat tiles: every mino retains a complete perimeter and a wide well gap,
  so a four-cell piece does not read as one shape.
- Slice K-R now also owns a renderer-only cohesive component pass. Same-material
  orthogonal neighbors bridge the gap, hide full internal outlines, and retain at most
  a hairline seam. Active/Next/Ghost use their exact canonical four-cell grouping;
  locked boards group same-material neighbors without adding ownership to Core.
- Dimensionality is limited to one directional mineral bevel: low-alpha signal on
  exposed top/left edges and the material dark edge on bottom/right edges. Exact colors
  remain frozen and plastic gloss, white highlights, glow, blur, glass, double rings,
  and detached unit shadows remain forbidden.
- Canonical Puzzle silhouettes close their old cell gaps while keeping at most one SVG
  path per piece type. The expanded allowlist adds only App silhouette source/tests and
  theme/renderer presentation paths; engine, board data, runtime, `index.html`,
  dependencies, coordinator evidence, and other product subsystems stay unchanged.

## 2026-07-17 — T5 cohesive mineral release candidate accepted

- Final source `effb353` presents plain-text `Tetris`, player-facing `经典`, endless
  accelerating Race, and fifteen all-enabled legal mid-game Puzzle endgames with a
  continuous seeded seven-bag and two verified public-command routes per level.
- Board, active, Next, Ghost, silhouettes, and locked stacks now use cohesive mineral
  components with suppressed internal borders and one restrained directional bevel;
  the exact deep natural seven-material mapping remains fixed.
- Space Grotesk and Noto Sans SC load through Google Fonts with a geometry-safe system
  fallback. Statistic dividers use explicit semantic roles, and every required mobile
  view retains visible Next, keyboard context, complete goals, and 44 px controls.
- Final post-source gates passed: typecheck; 40 test files with 39 passed / 1 skipped;
  258 tests with 256 passed / 2 skipped; 739-module build; action client; loaded-font
  and blocked-font five-viewport matrices.
- Independent source QA accepted candidate tip `ba5d387`. Formal evidence `c0832e4`
  contains 23 captures tied to source `effb353`; evidence QA inspected 23/23 at original
  detail and reproduced 25/25 raw Git blob hashes with zero CRLF manifest drift.
- `index.html`, dependencies, historical T3/T4 evidence, and other game repositories
  were not changed by the final frontend/evidence repairs. Next action: coordinator
  push of `codex/tetris-recovery`.

## 2026-07-18 — bright divided-facet refinement and entry countdown accepted

- Preserved the mature T5 composition while making each tetromino read as one cohesive
  silhouette with a larger gap between pieces, a narrower internal groove, visible
  per-cell facets, and restrained directional depth. Renderer geometry source is
  `acaf405`.
- Retoned only page/state/piece colors, shadow, `color-scheme`, and action ink into the
  exact light `雾昼矿物` system at `fd5f901`. Layout, typography scale, dividers,
  controls, copy, phase motion, and renderer geometry did not change.
- Shortened the shared grounded lock delay from 30 to 18 fixed ticks at `f0ec47c`.
  Direct tests prove tick 17 remains movable and resets the timer while tick 18 locks;
  independent Core QA confirmed Classic, Race, and Puzzle share the same deterministic
  branch and that the 15-reset cap and all other rules remain unchanged.
- Added one board-local `3 / 2 / 1` countdown on initial mode entry at `7f0b766`.
  Each digit lasts exactly one second; canonical state stays `ready`, input is disabled,
  and the runtime starts exactly once after `1`. Repair `48176fe` also fail-closes the
  public and DEV-QA restart/mode/Puzzle-selection paths during the gate.
- Final post-repair gates passed: typecheck; 40 files with 39 passed / 1 skipped;
  262 tests with 260 passed / 2 skipped; 739-module build; prescribed action client;
  and a five-viewport exact-source browser matrix.
- Independent Core and frontend/browser cross-QA both accepted with no open finding.
  Evidence `7d37418` binds 24 captures to source `48176fe` and log tip `d292b15`, with
  26/26 matching checksums, one canvas, zero DOM cells, zero unexpected browser errors,
  and explicit digit-3 / ready / zero-piece / disabled-input countdown proof.
- `index.html`, dependencies, Puzzle boards/routes, and every separate game repository
  remain unchanged. The branch is eligible for coordinator push.

## 2026-07-18 — T6 three independent modes accepted

- Replaced the overlapping Classic/Race progression with three separate objectives:
  Classic is fixed-speed chain scoring, player-facing `生存` is fixed-speed endurance
  against permanent rising bedrock, and Puzzle remains fifteen authored board-clearing
  endgames with continuous seeded seven-bag play.
- Classic now exposes `连消`: consecutive clearing pieces score the fixed base table
  plus `50 × (combo - 1)`, while a non-clearing lock breaks the chain. Classic and
  Survival remain at 48 ticks per automatic cell with no player-facing level system.
- Survival retains internal key `race` only for compatibility. Every five cumulative
  cleared lines resolves normally, then shifts the board up and appends one full
  `BEDROCK_CELL` row. Bedrock blocks pieces, never clears, renders through its own
  coordinated mineral material, and accumulates until top-out.
- Final source is `5a3c35a`; Core source is `34184cb`; formal evidence is `a26d989`.
  Final gates passed typecheck, 261 passed / 2 skipped tests across 40 files, the
  739-module build, and one 24-capture browser matrix.
- Independent Core, combined browser, and evidence QA all accepted with no finding.
  Public-command browser replay reached 24 lines / 4 bedrock rows on desktop and
  portrait; formal evidence has zero browser errors and 26/26 matching checksums.
- `index.html`, dependencies, Puzzle definitions/references, and separate game
  repositories were not changed. Next action: coordinator push of
  `codex/tetris-recovery`.

## 2026-07-18 — Survival bedrock recolor accepted

- Product source `4b27a98` changes only the permanent bedrock material to a restrained
  warm rock-brown, separating it from the cool blue/teal playable pieces without
  changing geometry or rules.
- Both face colors retain 5.455291:1 / 3.248488:1 contrast against the board well.
- Final typecheck, 261 passed / 2 skipped tests, 739-module build, action client, and
  24-capture browser matrix passed. Independent static and visual/evidence QA accepted
  with no finding; evidence `367a443` reproduced 26/26 checksums and zero errors.

## 2026-07-18 — T7 timed Survival and motion accepted

- Final product source `356440c` replaces five-line bedrock generation with timed
  pressure: 40 seconds initially, minus two seconds every five lines, ten-second floor;
  each five-line reward removes one existing bottom bedrock row and resets the timer.
- Classic and Survival use the same ten-line progressive gravity curve; Puzzle keeps
  its accepted fixed cadence and all fifteen levels / thirty references unchanged.
- Removed the mode and action-sheet decorative bars, added concise complete rules,
  direct fall/countdown statistics, restrained entry/focus feedback, and brief
  rise/removal stack motion with explicit reduced-motion suppression.
- Final gates passed typecheck, 267 passed / 2 skipped tests, the 739-module build, and
  a 25-capture browser matrix with zero unexpected errors. Evidence `9ef2708` proves
  rise at 2763 ticks / one `BBBBBBBBBB` row and reward at five lines / zero rows /
  zero pressure / 38 seconds; 27/27 hashes match.
- Independent static and visual QA accepted with no P0–P3 finding. `index.html`,
  dependencies, Puzzle data, ordinary material tokens, and separate repositories did
  not change. Next action: coordinator push of `codex/tetris-recovery`.

## 2026-07-18 — T8 interface and Survival refinement complete

- Replaced the home 1+2 table with a responsive stepped mode field and replaced the
  Puzzle stair glyph with a stable T tetromino.
- Rebuilt Puzzle selection with a prominent return action, canonical per-level board
  thumbnails, a larger selected-board preview, and no library/home `目标：清空棋盘`.
- Browser inspection found compact SVGs were inheriting the later large-preview size;
  the small container clipped most of each board. A higher-specificity compact size
  now renders the complete canonical board.
- Changed Survival pressure to 20 seconds initially, minus one second per five lines,
  with a ten-second floor. Targeted core/runtime tests pass.
- Rebound the v3 local result leaderboard: Classic ranks by score and Survival by
  cleared lines. Duplicate terminal callbacks are suppressed per run.
- Added an `index.html` Tetris Loading screen with reduced-motion behavior and a
  post-paint handoff.
- Final exact-source gates pass: 39 test files passed / 1 skipped, 268 tests passed /
  2 skipped, TypeScript plus a 741-module production build, and the prescribed web-game
  action client.
- Browser checks passed at 1280 × 720, 390 × 844, and 844 × 390 with no console or
  page errors, no viewport overflow, visible 44 px return/start actions, correct full
  Puzzle previews, reduced-motion suppression, post-paint Loading removal, and real
  Classic/Survival top-out records rendered with their correct primary metric.
- No open implementation TODO remains for this request. Generated browser captures are
  local QA artifacts only and are not product source.

## 2026-07-19 — T9 candidate: Survival descent and Puzzle archive

- Survival now opens with five warm-mineral bedrock rows; restart restores the same
  canonical opening. Pressure is `15 → 8` seconds and both the pressure interval and
  gravity table advance once per three cleared lines. Each boundary removes one bottom
  bedrock row when available, while Puzzle remains at 48 ticks and Classic retains its
  ten-line progression.
- The home `Tetris` heading is now the primary identity. The Puzzle selector is rebuilt
  as a compact `解谜档案` board with colored canonical thumbnails and a dark selected
  preview; all fifteen levels remain enabled.
- Candidate range: contract `502f978`, core/runtime `0ebb0cb`, frontend `7910e91`.
  Final gates: typecheck PASS; 40 files / 269 tests passed with 2 skipped; 741-module
  production build PASS. Browser inspection has zero error output and visibly proves
  the home title, archive layout, and a live Survival state with 5 bedrock rows,
  15-second interval, and 48 ticks per cell.
- Next action: independent Core and visual/browser QA of `502f978..7910e91`; do not
  push before its acceptance.

## 2026-07-19 — T9 Puzzle archive cleanup candidate

- Removed the selection-dot ornament and all fifteen list thumbnails. The selected
  canonical board remains the sole preview, preserving focus, touch size, and all
  enabled level selection behavior.
- Source checkpoint `15e6412` follows contract `575a81c`. Typecheck, the full 269
  passed / 2 skipped suite, and the 741-module build passed. Browser inspection shows
  no tile dots or miniatures and retains the selected large preview with no errors.
- Candidate is now `502f978..15e6412`; independent Core and visual/browser QA remain
  required before push. The proposed immutable-cell and expiring-piece Puzzle redesign
  remains intentionally unimplemented pending a precise rule decision.

## 2026-07-19 — T10 Puzzle anchors and post-lock expiry candidate

- Superseded the deferred Puzzle-mechanics note with deterministic sparse anchors and
  post-lock volatile inputs. Anchors remain after a completed row while ordinary cells
  clear; Puzzle success now requires only that removable tetromino cells are gone.
- Reauthored levels 13–15 as low-pressure one-lock vertical-I trials with two seeded
  anchors each. The legacy twelve-level reference routes and their historical hashes
  remain valid; the three replacement trials have focused public-command coverage.
- A volatile piece locks normally, then expires after 600 playing ticks. Its removal
  performs a deterministic whole-component support fall: components that can descend
  together fall, while blocked components remain fixed. Pause freezes the counter.
- Source checkpoints: `1ffe8fd feat(puzzle): add anchors and volatile locks` and
  `4427d7a feat(ui): surface puzzle anchors and timers`. Typecheck, full suite
  (40 files, 270 passed / 2 skipped), and 741-module build passed. Browser inspection at 1440 × 900 shows the
  selected level-15 anchor preview and a real locked volatile piece at `限时 10 秒`,
  with 2 anchors, 590 ticks remaining, and zero console/page errors.
- Next: exact-path source checkpoints, then independent Core and visual/browser QA of
  the extended `502f978..` candidate. Do not push before acceptance.

## 2026-07-19 — T10 anchor distribution and five-second visual correction candidate

- Restored levels 13–15 to their previous full, legal generated endgames; no trial
  board, seed, setup history, or seven-bag sequence was substituted. The anchor
  overlay now spans seven deterministic archive entries: levels 3, 6, 9, and 12
  receive one anchor, while levels 13–15 receive two. Every anchor is a
  pre-existing empty visible cell, so the two mechanics can combine without
  adding blockers to every level.
- Volatile locks now last 300 playing ticks (5 seconds). The Pixi board renders
  active, ghost, and locked volatile cells in a distinct warm-signal material;
  the puzzle status reads `限时块 / 落定后 5 秒` before lock and exact remaining
  seconds after lock.
- Verification: focused 9 files / 82 tests PASS; typecheck PASS; full suite 39
  passed / 1 skipped, 272 passed / 2 skipped; 741-module production build PASS.
  Browser review at 996 × 934 has zero console errors and visibly confirms a
  level-9 original-board preview with one anchor plus a real warm volatile state
  and `落定后 5 秒` status. Candidate SHA pending exact-path checkpoints.
- Next: independent Core and visual/browser QA; changelog integration and push
  remain prohibited until both accept.

## 2026-07-19 — T10 volatile-resolution and audio-control correction candidate

- Reworked volatile expiry resolution to begin only from cells opened by the
  disappeared volatile piece. A complete component directly above one of those
  cells falls as a normal whole component to its resting position; unrelated
  floating components do not move. This corrects the former global gravity pass.
- Increased feedback clarity and coverage through the Web Audio engine: stronger
  move/rotate/drop/lock/clear/terminal voices plus start, pause/resume, volatile
  expiry, and Survival rise/lower cues. The top bar now exposes `声音开/关` and
  a 0–100% master-volume slider immediately beside Pause; core state remains
  audio-free.
- Candidate checkpoints: `ea04f6c fix(puzzle): constrain volatile expiry fallout`,
  `d480c9a feat(ui): clarify volatile blocks and audio`, and
  `07c974e fix(ui): place audio controls beside pause`. Final typecheck,
  full suite (39 passed / 1 skipped, 274 passed / 2 skipped), and 741-module
  production build PASS. Browser review proves the mute toggle and 0% slider are
  clickable beside Pause, with zero console errors. Independent Core plus
  visual/browser QA remain required before changelog or push.

## 2026-07-19 — Recovery publication authorization

- The user explicitly authorized publication of the existing committed `main`
  candidate to `origin/main` as a recoverable remote checkpoint. This is a
  recovery record only: the candidate remains pending independent Core and
  visual/browser QA, and no changelog acceptance claim is made.

## 2026-07-19 — T10 recovery follow-up: audible feedback, restart, and Next repair

- Raised the Web Audio default to 100%, placed the master gain behind a compressor
  safety stage, and retuned the distinct move, rotation, soft-drop, lock, clear,
  terminal, volatile, and Survival cues. Core simulation remains audio-free.
- Added the separate `重新开始` header control beside Pause. It uses the same
  deterministic restart path as `R`, works from active play, pause, and terminal
  states, clears held input, preserves the selected mode/level and seed, and resumes
  immediately without a second entry countdown.
- Repaired the Next preview regression: the mobile information band's opaque raised
  background was masking the canvas-owned preview. Pixi now paints the Next well and
  the DOM slot is transparent; the compact band is layered beneath the canvas.
- Source checkpoints: `7707c56 feat(audio): amplify feedback and active restart` and
  `e3aeed9 fix(ui): restore next preview and header restart`.
- Final gates: `npm.cmd run typecheck` PASS; full suite 39 passed / 1 skipped,
  276 passed / 2 skipped; 741-module production build PASS; prescribed browser
  action client PASS. Browser inspection verified matching canonical/renderer Next
  values after a lock, `R` returning an active run to zero placed pieces, one canvas,
  no DOM cells, no overflow, and zero console errors at 1440 × 900, 390 × 844, and
  844 × 390. Captures are local ignored artifacts only.
- This is still a recovery candidate pending independent Core and visual/browser QA;
  no changelog acceptance entry is made.

## 2026-07-19 — T10 restart confirmation correction

- The Pause sheet now intentionally contains only `继续游戏` and `离开本局`.
- Clicking the header `重新开始` pauses a live run and opens a confirmation sheet;
  its primary action receives focus and Enter confirms. Escape/cancel restores a run
  that had been playing and leaves an already-paused run paused. `R` remains the
  immediate deterministic keyboard restart.
- Source checkpoint: `a05f8ab fix(ui): confirm header restart separately`.
- Verification: focused App test PASS (11 tests); final typecheck PASS; full suite
  39 passed / 1 skipped, 276 passed / 2 skipped; 741-module build PASS; action-client
  capture inspected. Browser verification proves the pause sheet has no restart
  action, the confirmation sheet is visible and Enter resets the live run to zero
  placed pieces, Escape returns a live run to `playing`, and the console has zero
  errors. This remains a recovery checkpoint pending independent QA.

## 2026-07-19 — T10 hard-drop and leaderboard metric correction

- Replaced the hard-drop triangle sweep with a short paired sine landing thump,
  retaining the event timing while removing the electrical-sounding waveform.
  The deterministic core remains free of browser audio.
- Classic now ranks and presents cleared lines first. Survival now ranks and
  presents elapsed survival time first, longest run first; saved v3 rows are
  re-sorted on read, so no data migration is required.
- Source checkpoint: `526f394 fix(gameplay): refine hard drop and leaderboard ranks`.
- Verification: focused audio, leaderboard, and App tests PASS (5 files / 21 tests);
  final `npm.cmd run typecheck` PASS; final `npm.cmd run test` PASS (40 passed /
  1 skipped; 277 passed / 2 skipped); final `npm.cmd run build` PASS (741 modules).
  Browser review plays and tops out both modes with one canvas and zero console
  errors: Classic visibly orders 12 lines above 8 lines, while Survival visibly
  orders 15 seconds above 10 seconds despite fewer lines.
- Blocker: independent Core and visual/browser QA remains required. This is a
  recovery checkpoint, not an acceptance or changelog entry. Next: coordinator
  commits the documentation record and may publish it under the existing recovery
  authorization.

## 2026-07-19 — T11 target-budget, Survival baseline, and result feedback candidate

- Candidate source range: `1c91bbf..c1c262e` on `main`; maintenance checkpoint
  `4ba5903` ignores local T11 browser captures. The range implements original-target
  Puzzle clearance with a per-level solver budget plus ten locks, sparse safe anchors,
  Puzzle countdown, ten-row fixed-cadence Survival, fresh Classic/Survival seeds,
  fixed Puzzle seeds, sine-only event feedback, restart copy, and retained-rank
  highlighting/non-qualification feedback.
- Visual refinement: original targets keep their own material and now use a restrained
  warm-gold upper-left inset corner bracket, replacing the prior dot-and-tail marker.
- Verification: final `npm.cmd run typecheck` PASS; final `npm.cmd run test` PASS
  (40 files / 288 tests; 1 file / 2 tests skipped); final `npm.cmd run build` PASS
  (741 modules). Focused theme coverage passes (1 file / 7 tests). Live browser review
  of Puzzle level 2 shows target brackets, original-target and remaining-lock stats,
  a visible Next piece, one canvas, and zero console errors; the prescribed Survival
  action capture shows 10 initial bedrock rows and fixed 40-tick gravity.
- Blocker: independent Core and visual/browser QA remain required. The user-authorized
  `origin/main` push is a recoverable checkpoint only, not a changelog acceptance.

## 2026-07-19 — T12 progressive Puzzle curriculum opened

- Original prompt: make full-volume feedback audibly stronger; fix Puzzle anchors that
  move after unrelated line clears; remove timed Puzzle blocks; expand the campaign to
  twenty progressive levels with only the first three initially available.
- Contract decision: anchors are coordinate-pinned and split ordinary post-clear
  settlement into vertical segments; volatile input state, material, HUD, event, and
  audio are removed; every distinct canonical completion opens one next locked level.
- Next: generate five original late-campaign definitions, then implement the core and
  progression checkpoints with targeted deterministic tests before the final browser
  evidence pass.

## 2026-07-19 — T12 coupled Puzzle campaign candidate

- Historical T12 candidate, superseded for Puzzle ordering, budgets, anchors, and
  unlock rules by the T12.4 Core-replayed campaign recalibration below.
- Candidate source checkpoint: `95c7da7 feat(t12): deliver coupled Puzzle campaign
  migration`, preceded by the T12 contract checkpoints through `e770279`.
- Puzzle now has 20 deterministic authored levels, only 01–03 initially open, one
  additional sequential unlock per distinct canonical completion, and visible
  difficulty/complete/locked semantics. The five extension histories were generated
  as legal zero-clear setups and retain accepted route budgets of 40, 43, 43, 44, and
  52 locks (including fixed +10 slack).
- Anchors are coordinate-pinned across both lower-row and same-row clears; volatile
  inputs, expiry events, renderer material, HUD timer, audio route, and settlement
  logic are removed. Survival starts at seven bedrock rows with fixed 40-tick gravity.
- Player-facing brand is the short plain-text `Tetra`; no Chinese companion name is
  rendered. Full volume uses a 1.35 bounded master gain with less aggressive
  compression and a short descending sine landing cue.
- Verification: targeted matrix PASS (14 files / 109 tests); final
  `npm.cmd run typecheck` PASS; full `npm.cmd run test` PASS (41 files / 292 tests,
  1 file / 2 tests skipped); final `npm.cmd run build` PASS (741 modules). Browser
  review at 1280×720 shows Tetra home, 7-layer Survival, all 20 archive rows with only
  the first three enabled, selected preview only, a fixed-anchor Puzzle board, target/
  budget HUD, one canvas, and zero console errors. Local captures are in `%TEMP%` and
  the temporary Vite server was stopped.
- Blocker: independent Core and visual/browser QA disposition remains required before
  changelog acceptance or publication; this is a recoverable local candidate only.

## 2026-07-19 — T12.1 archive worktable and visible-board candidate

- Contract checkpoint: `91e9c0f docs(t12): define archive and viewport correction`.
  Candidate sources: `7ae1190 fix(t12): contain active piece presentation` and
  `b0889c7 feat(t12): refine puzzle archive worktable`.
- The archive is now a text-first worktable: one continuous opened-count rail, semantic
  open/complete/sealed labels, a catalog that contains no thumbnails, and exactly one
  selected canonical-board preview/start action at every breakpoint. Sealed entries keep
  readable solid surfaces and remain inert.
- Active-piece rendering now clamps stale interpolation at both visible vertical board
  edges without changing hidden spawn coordinates, Core collision, seeds, queues,
  replays, or Puzzle setups. Edge contact suppresses the transient rotation scale for
  that frame. A direct presentation test covers the screenshot case (top-row O with a
  negative one-cell request), an interior interpolation, and the bottom boundary.
- Verification: targeted App/presentation matrix PASS (27 tests); final typecheck PASS;
  full suite PASS (41 files / 293 tests, 1 file / 2 tests skipped); final build PASS
  (741 modules). Browser review has zero console errors: desktop 1280×720, portrait
  390×844, and landscape 844×390 all have no horizontal overflow; the archive exposes
  20 rows, no catalog miniature, exactly one selected preview, and `3 / 20` semantic
  progress. A frozen real Survival state has core active `J@3,20` with stale presentation
  `offsetY:-0.457…`; its visible purple J remains inside the well's top edge.
- Blocker: independent renderer and visual/browser QA are still required. Next: review
  `91e9c0f..b0889c7`, then integrate the formal changelog and publish only after both
  dispositions accept the candidate.

## 2026-07-19 — T12.4 replay-verified Puzzle curriculum candidate

- Candidate range: `f98423a..69eec5f`; contract correction `9f5a38c`, calibrated
  Core order/budgets `4fc52a0`, offline candidate finder `4615706`, replay artifact
  `896a18a`, tiered progress `67c9e64`, archive gate `8cdfedc`, and the stale-fixture
  correction `69eec5f`.
- All twenty fixed-seed Puzzle command streams now Core-replay to `finished` with zero
  targets remaining. These are verified playable route upper bounds, not mathematical
  optimum certificates. Campaign order is the recorded ascending tuple `(locks,
  anchors, soft drops, command count, id)`; public allowances are exactly `2 × locks`.
  Unsupported anchor coverage was reduced to levels 01/03/11 by ID, while authored
  boards, setups, and seeds remain unchanged.
- The new campaign opens the first three sorted levels: `深湾阈门` (24 locks,
  allowance 48), `棱湾交错` (24, 48), and `静弧深槽` (26, 52). Every later tier
  opens after two distinct completions in the immediately preceding tier; v1/v2
  completion records migrate to v3 canonical IDs without granting a false cascade.
- Verification: focused solver/campaign/progress/App coverage PASS (11 files / 91
  tests); final `npm.cmd run typecheck` PASS; full `npm.cmd run test` PASS (42 files /
  297 tests, 1 file / 2 tests skipped); final `npm.cmd run build` PASS (741 modules).
  Browser matrix at 1280×720, 390×844, and 844×390 found zero console errors and no
  horizontal/document overflow; it confirms three initial opens, a six-open tier after
  two canonical completions, Puzzle `Next · 2`, one canvas/zero DOM cells during play,
  and a top-spawn Survival piece contained within the well. Local screenshots remain
  under `%TEMP%`; compact details are in the T12.4 coordinator evidence record.
- Local-only player walkthrough `Solutions/Solution-1.md` contains all 24 stable
  post-lock snapshots for the newly sorted Level 01 and is confirmed ignored by
  `.gitignore`; it is intentionally absent from the candidate.
- Blocker: fresh independent Core and visual/browser QA dispositions are still required
  before changelog integration or push. Next: review the exact range and evidence.

## 2026-07-19 — T12.5 low-pressure Puzzle curriculum accepted

- T12.5 supersedes the unaccepted T12.4 source outcome for campaign order, deep
  anchor boards, public piece budgets, and solver-derived player limits. The accepted
  source is `d2469e3f66072d5edc905981200d0df90b06780f`; the supporting contract chain
  is `5f830d7`, `0f1ee20`, and `8bd9108`.
- The twenty fixed-seed Puzzle levels are now a gentle authored sequence: obvious
  near-floor gaps, one normal rotation, then clear vertical two- through four-row I
  channels. Puzzle wins only by clearing all original targets; it has no anchors,
  timed inputs, usable-piece cap, or budget failure. The Core-dispatched route fixture
  is clearability evidence, never a player constraint or optimum claim.
- Puzzle-local `B` undo and the matching touch control restore the exact pre-lock
  checkpoint. It covers hard-drop score, board, target ownership, active block,
  queue/randomizer, timers, lines, and placed count; it remains a no-op for Classic and
  Survival. The renderer clears discarded landing/clear presentation on rollback.
- The library is a seven-tier themed `解谜航图`: levels 01–03 open immediately, every
  next three-level tier opens after any two completions in its predecessor, and 19–20
  open after any two of 16–18. The full rule remains visible; entries have no thumbnail
  or corner dot and only the selected record has a preview.
- Final gates: `npm.cmd run typecheck` PASS; `npm.cmd run test` PASS (44 files / 286
  tests, 1 skipped file / 2 skipped tests); `npm.cmd run build` PASS (741 modules).
  Fresh browser evidence at 1280×720, 390×844, and 844×390 reports no document
  overflow or console error, one gameplay canvas/zero DOM cells, two Puzzle Next
  pieces, and keyboard/touch undo score 36→0 with placed count 1→0.
- Independent Core and visual/browser QA both accepted `69eec5f..d2469e3` with no
  P0–P2 finding; their disposition is recorded in
  `docs/workstreams/tetris-t12-coordinator/QA_T12_5.md`. `Solutions/Solution-1.md`
  remains local-only and is confirmed ignored by the existing `Solutions/` rule.
