# T18 Coordinator Workstream Log

## 2026-07-31 — Phase 11 contract checkpoint

- Task ID: `T18-P11.0`
- Base SHA: `a2d6670f6e1c6cfbf61eee232c3d4468c38dc65e`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `docs/CURRENT_TASK.md`
  - `docs/DESIGN.md`
  - `docs/phases/phase 11.md`
  - `docs/progress.md`
  - `progress.md`
  - `docs/workstreams/tetris-t18-coordinator/THREAD_LOG.md`
- Commands actually run: targeted UTF-8 Git, contract, current source, skill, resource,
  and official font-license inspection only. No test, build, server, browser, or
  persistent helper started.
- Evidence: `main`, tracking, and `origin/main` matched at the clean accepted Phase-10
  tip. The player's nine findings are frozen as explicit material, interaction,
  typography, information, and deterministic Puzzle-analysis outcomes. Space
  Grotesk Variable and Geist Mono Variable are selected as locally packaged UI/data
  candidates; browser acceptance remains mandatory before they can be accepted.
- Resource note: work remains single-writer. No project listener or browser exists;
  heavy gates and managed browser evidence are deferred to the final candidate.
- Blocker: none.
- Next action: commit this docs-only checkpoint, then open P11.1 palette and geology.

## 2026-07-31 — P11.1 bright enamel and connected geology checkpoint

- Task ID: `T18-P11.1`
- Base SHA: `e184dc513aae96e006e4e04f881dd1c250425737`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `src/game/render/theme.ts`
  - `src/game/render/theme.test.ts`
  - `src/game/render/TetrisRenderer.ts`
  - `src/game/render/TetrisRenderer.test.ts`
  - `docs/workstreams/tetris-t18-coordinator/THREAD_LOG.md`
  - `progress.md`
- Commands actually run:
  - focused Renderer/theme test, first run: `43/45` passed; one intended old
    per-cell-decal count and one too-dark material endpoint failed
  - corrected focused Renderer/theme test: `45/45` passed
  - `npm.cmd run typecheck`: passed
  - `git diff --check`: passed
- Evidence: all seven ordinary materials use brighter faces and signal edges while
  retaining dark perimeters and contrast floors. Bedrock now limits large mineral
  planes, fractures, chip, and pit counts at component scale rather than stamping
  every cell; internal seams are subdued. A vertical one/two-stone event owns a
  joined boulder treatment distinct from the permanent shelf.
- Blocker: real-frame visual acceptance is deliberately deferred to the immutable
  candidate; this is a source-green recovery point, not final visual acceptance.
- Next action: commit P11.1, then open P11.2 Mutation atmosphere and projection.

## 2026-07-31 — P11.1 visual rejection and corrective boundary

- Task ID: `T18-P11.1R`
- Rejected checkpoint: `74e3720`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `docs/CURRENT_TASK.md`
  - `docs/DESIGN.md`
  - `docs/phases/phase 11.md`
  - `docs/workstreams/tetris-t18-coordinator/THREAD_LOG.md`
  - `progress.md`
- Evidence: direct player review correctly rejected component-scale decals as an
  insufficient material change. Reducing decal repetition still leaves the ordinary
  square body and therefore cannot make bedrock or falling events read as rock.
- Corrective boundary: the next renderer slice must bypass the ordinary-cell body for
  both geology roles. Bedrock owns a continuous no-grid rock shelf; falling events own
  irregular vector boulders with real lit/shadow faces. An early real Survival frame
  is required before P11.2 may open.
- Blocker: P11.1 is reopened; `74e3720` is a recovery point, not an accepted visual.
- Next action: commit this docs-only correction, replace geology geometry, run focused
  proof, then inspect one managed real frame and release the browser/server.

## 2026-08-01 — P11.1R no-grid rock geometry checkpoint

- Task ID: `T18-P11.1R-SOURCE`
- Base SHA: `0abae4838424c6159b6bdf389514eca1d4d8b767`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `src/game/render/TetrisRenderer.ts`
  - `src/game/render/TetrisRenderer.test.ts`
  - `docs/workstreams/tetris-t18-coordinator/THREAD_LOG.md`
  - `progress.md`
- Commands actually run:
  - focused Renderer/theme test: `45/45` passed
  - `npm.cmd run typecheck`: passed
  - official web-game client: two bounded Survival inspections, including a live
    two-stone event; no console-error artifact emitted
  - exact listener release for owned Node PIDs `31300` and `30340`; port `5178`
    verified without a listener after each batch
- Evidence: geology now exits the ordinary-cell path before rounded rectangles,
  cell seams, or cell relief are painted. A rectangular bedrock component becomes
  one jagged continuous silhouette with one lit ridge, three connected structural
  planes, and four non-grid fracture branches. Falling one/two-stone components use
  irregular octagonal bodies with integral light/shadow faces and an overlapping
  vertical join. Real frames verified the absence of the old square bedrock grid and
  showed the two descending bodies as boulders rather than textured tiles.
- Blocker: final palette/geology acceptance still depends on the integrated browser
  comparison round; the temporary frames are diagnostic and remain outside Git.
- Next action: commit this corrective source recovery point, then open P11.2.

## 2026-08-01 — P11.2a truthful Supergravity projection checkpoint

- Task ID: `T18-P11.2A`
- Base SHA: `cb6051227c17e9c154fc3b27146ae6cb87b1072a`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `src/game/render/presentation.ts`
  - `src/game/render/presentation.test.ts`
  - `src/game/render/TetrisRenderer.ts`
  - `src/game/render/TetrisRenderer.test.ts`
  - `docs/workstreams/tetris-t18-coordinator/THREAD_LOG.md`
  - `progress.md`
- Commands actually run:
  - focused presentation/Renderer test: `51/51` passed
  - first typecheck exposed readonly snapshot and test-spy typing only; corrected
  - repeated focused test: `51/51` passed
  - repeated `npm.cmd run typecheck`: passed
- Evidence: one pure renderer query clones the settled board, places the rigid hard-
  drop body, applies Core's existing `collapseSprintColumns`, and maps every source
  cell to its real independently settled row. Both drawn ghost and public renderer
  snapshot use that result. Direct proof covers asymmetric support, the ordinary
  rigid projection when inactive, repeated determinism, and zero board mutation.
- Blocker: none for projection. Atmosphere and activation visuals remain open.
- Next action: commit P11.2a, then implement the Ice/Supergravity/Bomb visual grammar.

## 2026-08-01 — P11.2b physical Mutation feedback checkpoint

- Task ID: `T18-P11.2B`
- Base SHA: `526a4e5cc0f87b3360953552a5de793fb47ffca3`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `src/game/render/TetrisRenderer.ts`
  - `src/game/render/TetrisRenderer.test.ts`
  - `docs/workstreams/tetris-t18-coordinator/THREAD_LOG.md`
  - `progress.md`
- Commands actually run:
  - first focused presentation/Renderer test: `50/52` passed; one Chai assertion
    typo and one outdated Graphics stub were corrected without product changes
  - second focused test: `51/52` passed; the visible-state assertion still named
    the retired Supergravity edge color and was corrected to the new pressure fill
  - final focused presentation/Renderer test: `52/52` passed
  - final checkpoint `npm.cmd run typecheck`: passed
- Evidence: Ice now occupies a continuous forty-slice upper fade with overlapping
  fills and no terminal glint line. Supergravity replaces the central glyph, long
  wells, chevrons, and support bars with sparse tapered pressure traces bound to
  actual trigger or settled columns. Bomb warning/impact uses an irregular heated
  floor silhouette and rising embers; neither phase draws a rectangular three-row
  range or full-board rectangular flash. Direct geometry assertions reject the old
  symbols, bars, wells, and `3×10` box while retaining reduced-motion visibility.
- Blocker: real-frame acceptance remains part of the immutable integrated browser
  comparison; this checkpoint proves source geometry and state ownership only.
- Next action: commit P11.2b, then open P11.3 information architecture.

## 2026-08-01 — P11.3 compact information architecture checkpoint

- Task ID: `T18-P11.3`
- Base SHA: `0807588e6ff654719ca330f9eb6d5989a5a6ae1a`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `src/App.tsx`
  - `src/App.test.ts`
  - `src/main.tsx`
  - `src/styles/hud.css`
  - `src/styles/navigation.css`
  - `src/styles/navigation.test.ts`
  - `src/styles/settings.css`
  - `src/styles/settings.test.ts`
  - `docs/workstreams/tetris-t18-coordinator/THREAD_LOG.md`
  - `docs/progress.md`
  - `progress.md`
- Commands actually run:
  - focused App/HUD/navigation/Settings test: `54/54` passed
  - `npm.cmd run typecheck`: passed
  - one bounded in-app-browser desktop review of Home and Classic Settings; zero
    browser console errors
  - exact owned Vite PID `25820` stopped; port `5178` verified released
- Evidence: Settings now has one continuous rules → controls → keyboard → record
  reading order, content-sized sections, independent section signals, and no unequal
  side-by-side cards that manufacture blank regions. The live dialog measured four
  adjacent content-height sections inside one `860 × 460.4` sheet. The right HUD is
  content-height instead of stretching to board height. Home removes decorative left
  rails, separates pointer hover from keyboard focus, and restores the Classic card's
  complete top edge against a higher-specificity legacy first-child override. The
  leave sheet defaults to `返回首页`; arrow navigation can still choose either action.
- Blocker: final responsive and bilingual acceptance remains part of the integrated
  immutable-candidate browser rounds; this checkpoint is not Phase 11 acceptance.
- Next action: commit P11.3, then open P11.4 local typography and bilingual fit.

## 2026-08-01 — P11.4 local typography and bilingual-fit checkpoint

- Task ID: `T18-P11.4`
- Base SHA: `8b6e09ddfc701adb2cfff95e168b08f4b7464ebf`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `package.json`
  - `package-lock.json`
  - `src/main.tsx`
  - `src/styles/tokens.css`
  - `src/styles/settings.css`
  - `src/design/tokens/typography.ts`
  - `src/design/tokens/tokens.test.ts`
  - `index.html`
  - `src/game/render/TetrisRenderer.ts`
  - `THIRD_PARTY_NOTICES.md`
  - `licenses/fonts/SpaceGrotesk-OFL.txt`
  - `licenses/fonts/GeistMono-OFL.txt`
  - retired `licenses/fonts/Sora-OFL.txt`
  - retired `licenses/fonts/IBMPlexMono-OFL.txt`
  - `docs/workstreams/tetris-t18-coordinator/THREAD_LOG.md`
  - `docs/progress.md`
  - `progress.md`
- Commands actually run:
  - installed pinned `@fontsource-variable/space-grotesk@5.3.0` and
    `@fontsource-variable/geist-mono@5.3.0`; removed Sora and IBM Plex Mono
  - focused token/App/Settings test: `50/50` passed; final token recheck: `6/6`
  - checkpoint `npm.cmd run typecheck`: passed
  - scoped `osv-scanner scan source --lockfile package-lock.json`: 158 packages,
    no known issues
  - one bounded browser batch at default desktop, `844×390`, and `390×844`;
    zero console errors; owned Vite PID `11748` stopped and port `5178` released
- Evidence: English UI resolves to locally packaged Space Grotesk Variable, numeric/
  tabular roles resolve to Geist Mono Variable, the Playwrite wordmark remains
  isolated, and no remote stylesheet is present after `document.fonts.ready`. Narrow
  Settings track widths and the portrait stack were corrected until bounded DOM
  inspection reported zero horizontal-overflow elements. Home and the game HUD retain
  zero document overflow at the tested viewports. A scoped non-document scan reports
  no remaining Sora/IBM font configuration outside excluded historical docs and build
  dependencies; notices and repository license copies now match the installed pair.
- Blocker: final evidence still requires the immutable integrated candidate and its
  full bilingual/reduced-motion comparison matrix.
- Next action: commit P11.4, then open P11.5 deterministic Puzzle guidance.

## 2026-08-01 — P11.5 deterministic Puzzle guidance checkpoint

- Task ID: `T18-P11.5`
- Base SHA: `ebf9036752f4a690d029ec0368107ec8a23ce650`
- Owner: primary coordinator; one production writer
- Exact paths:
  - `src/game/core/puzzleGuidance.ts`
  - `src/game/core/puzzleGuidance.test.ts`
  - `src/game/core/puzzleRouteSearch.ts`
  - `src/game/core/index.ts`
  - `src/App.tsx`
  - `src/App.test.ts`
  - `src/ui/localization.ts`
  - `src/styles/hud.css`
  - `src/styles/hud.test.ts`
  - `docs/workstreams/tetris-t18-coordinator/THREAD_LOG.md`
  - `docs/progress.md`
  - `progress.md`
- Commands actually run:
  - focused Puzzle/Core/App/HUD test: `56/56` passed with one worker and no file
    parallelism
  - checkpoint `npm.cmd run typecheck`: passed
  - `git diff --check`: passed apart from the repository's existing LF/CRLF
    checkout warnings
  - one bounded Playwright development review at desktop, portrait, and short
    landscape; the exact owned Vite PID `29548` was stopped and port `5178` was
    verified released
- Evidence: Puzzle now computes a deterministic, non-mutating analysis from the
  current board, active piece, and fixed two-piece queue. Four compact quantities
  expose direct target-reducing landings, safe minimum-burden landings, buried holes,
  and minimum added burden. One concise strategy sentence and two queue-role chips
  explain what those quantities imply without revealing a scripted solution. Fixed
  anchors are excluded from false roof/burden readings, transient pause/entry frames
  retain the last valid analysis instead of changing panel height, and non-Puzzle or
  non-live states remain silent. Desktop and portrait frames have no document
  overflow; the short-landscape correction uses a readable `2×2` metric matrix and
  keeps one canvas, zero DOM board cells, and zero browser console errors.
- Blocker: this is a source checkpoint, not Phase 11 acceptance. The final integrated
  source gates, bilingual/reduced-motion browser matrix, immutable-candidate evidence,
  and independent read-only QA remain open.
- Next action: commit P11.5, then run the single final integrated gate sequence after
  the last source change.

## 2026-08-01 — P11.6–P11.8 immutable acceptance candidate

- Task ID: `T18-P11.6-P11.8`
- Base SHA: `01ed3969c90362b74d850c8dac88d530af098cca`
- Owner: primary coordinator; one production writer. Independent QA was read-only.
- Final source correction:
  - `src/game/render/TetrisRenderer.ts`
  - `src/game/render/TetrisRenderer.test.ts`
  - Ice now uses one cached four-stop Pixi gradient over the upper `62%` of the well;
    it no longer assembles visible horizontal bands.
- Recovery points:
  - source `12fb0ae0b6e373ff856ca48d0187485232c4db99`
  - evidence `d1656a1c1499cc1034e61e01316808339e4294a0`
- Commands actually run after the final source edit:
  - `npm.cmd run typecheck`: passed
  - `npm.cmd run test -- --maxWorkers=1 --no-file-parallelism --hookTimeout=30000`:
    `31` files / `288` tests passed
  - `npm.cmd run build`: passed across `758` modules; existing chunk-size advisory only
  - redacted `gitleaks 8.30.1` Git range scan from the Phase 10 base through the
    evidence candidate: zero findings
- Evidence:
  - `docs/qa/evidence/t18-phase11/` contains 24 final-candidate PNGs, structured
    browser assertions, README, and `26/26` matching manifest entries
  - browser assertions cover all nine outcomes, Chinese/English, desktop/portrait/
    short landscape, reduced motion, one Canvas, zero DOM board cells, and zero
    console/page errors
  - manual comparison accepts the continuous faceted basalt shelf, irregular joined
    one/two-boulder events, smooth Ice front, pressure-based Supergravity with split
    ghost, non-box Bomb, compact surfaces, typography, Home interactions, and Puzzle
    analysis
- Independent QA: `ACCEPT`; P0/P1/P2/P3/GAP all zero. It recomputed all 26 evidence
  hashes, verified evidence/source binding, and left the worktree/index unchanged.
- Resources: the owned browser batch and Vite process are closed; port `5178` is
  released. No watcher, indexer, development server, managed browser, or running
  subagent remains.
- Blocker: none. Next action: commit acceptance docs and publish `main` non-force.
