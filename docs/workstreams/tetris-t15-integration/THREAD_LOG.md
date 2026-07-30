# T15 Phase 8 Integration Workstream Log

## TETRIS-T15-PHASE8-CONTRACT-001

- Status: `CONTRACT / PRODUCT FROZEN`.
- Pushed candidate: `4e4cca1e26554323d5712a2e28386c4a9fb4f7e2`.
- Accepted phase boundaries:
  - Phase 1–6 accepted and pushed;
  - fifty-level curriculum, v5 persistence and progressive unlock accepted and
    pushed;
  - direct ordinary-clear rollback accepted and pushed;
  - selector visual redesign explicitly excluded.
- Preserved rejected selector WIP:
  `codex/t15-selector-wip-20260730@dce331b`; it is not part of `main`.
- Static completion evidence before browser:
  - five schema-7 artifacts: 50 unique levels, 100 unique routes, tiers
    3/4/5/6/7 rows;
  - final clean gates: Renderer 39, route/QA 5, typecheck, full 26 files /
    235 tests, 753-module build;
  - Mutation re-audit: PASS, P0–P2/GAP zero, retained narrow ellipsis P3 only;
  - Phase-5 browser manifest: 34 captures, 38/38 hashes, 4/4 gate hashes,
    FIFO, actual Collapse columns, Renderer p95 0.3 ms, rAF p95 8.4 ms,
    final rAF/audio/Canvas zero.
- Open paths:
  - `docs/phases/phase 8.md`;
  - `docs/CURRENT_TASK.md`;
  - coordinator/integration workstream records;
  - `docs/qa/evidence/t15-phase8/**`;
  - final QA verdict documents and acceptance/changelog records.
- Product source, dependencies, config, Puzzle definitions/artifacts and selector
  UI remain closed unless fresh evidence proves a concrete defect.
- Resource boundary: one runner, one managed Vite tree, one Chrome tree and one
  browser batch at a time; no WMI/CIM, Serena, MCP, watcher, resident reader or
  new child agent during capture. Release ports 4178/5178/5179 and every owned
  temporary process before QA.
- Next action: author a fail-closed current-head integration harness, run the
  official web-game client and the managed batch, inspect all frames, then freeze
  raw evidence before manifest/index and serial independent QA.

## TETRIS-T15-PHASE8-HARNESS-002

- Status: `SOURCE-BOUND HARNESS / FROZEN`.
- Checkpoints:
  - initial harness `8044068`;
  - countdown-hidden-Next assertion repair `667cb54`;
  - legal active-piece handoff repair `aa1afe6`.
- Exact path:
  `docs/qa/evidence/t15-phase8/capture_phase8.py`.
- Both repairs changed evidence assertions only. They published no partial output,
  changed no product path, and released the managed 4178 lease.
- The successful run bound the committed harness blob at `aa1afe6` and frozen
  product `4e4cca1` before and after capture.

## TETRIS-T15-PHASE8-BROWSER-003

- Status: `RAW EVIDENCE / FROZEN`.
- Raw checkpoint: `94463de`.
- Published evidence:
  - 13 source-bound integration PNGs;
  - two official `develop-web-game` client PNGs plus two canonical state JSONs;
  - one 181,028-byte manifest;
  - 23-entry `SHA256SUMS.txt`;
  - empty browser/client stderr and source-bound Vite logs.
- Browser assertions:
  - Classic, Survival, Mutation, and Puzzle entered through visible UI;
  - Chinese desktop, 390x844 portrait, 844x390 short landscape, English, and
    reduced motion covered;
  - Settings/backdrop resume, pause/Enter, restart/arrow/Enter,
    Escape/arrow/Enter, gameplay arrows/Space, touch tap rotation, and direct
    Puzzle Z undo accepted;
  - every gameplay frame had one Canvas, zero DOM board cells, visible board/
    side/Next, no overflow, and zero console/page errors;
  - Puzzle showed semantic `1`/`2` previews; Mutation Next exposed a carrier item;
    Survival showed three accepted brown bedrock rows;
  - every unmount returned listener/rAF/open-audio/Canvas/QA state to baseline.
- Existing evidence revalidated:
  - Phase 5: 34 PNGs, browser/gate checksum files, zero manifest errors;
  - Puzzle: five schema-7 artifacts, 50 IDs, 100 unique routes, ten entries per
    3/4/5/6/7-row tier.
- Manual review opened all 15 PNGs individually and found no blank, clipping,
  structural-gap, overlay, label, carrier-legibility, or responsive-overflow
  defect.
- Resource release: 4178/5178/5179 free; managed server released; official-client
  browser and Chrome browser closed; no watcher or resident reader started.

## TETRIS-T15-PHASE8-GATES-004

- Status: `PASS`.
- Commands actually run serially after raw evidence:
  - `npm.cmd run typecheck` — PASS;
  - `npm.cmd run test` — PASS, 26 files / 235 tests;
  - `npm.cmd run build` — PASS, 753 modules.
- Build retained the existing informational 511.26 kB main-chunk warning; no
  dependency or product source changed.
- Next action: freeze this index checkpoint, then run rules, visual, and
  evidence-integrity QA serially against one exact documentation tip.

## TETRIS-T15-PHASE8-QA-005

- Status: `THREE-WAY ACCEPT`.
- Rules QA record `e7fc800`:
  `P0=0 / P1=0 / P2=0 / P3=1 / GAP=0`.
  It confirmed zero product drift, the restored stationary nine-tick ordinary
  sweep, complete Mutation rules, 50 schema-7 Puzzle levels with two routes,
  progressive unlock/migration and direct `Z` undo.
- Visual QA record `78c0664`:
  `P0=0 / P1=0 / P2=0 / P3=1 / GAP=0`.
  All 15 Phase 8 frames and the Phase 5 Mutation cross-check passed. The only
  retained P3 is narrow three-status text ellipsis; iconography, material,
  order, timer and progress remain legible.
- Evidence-integrity QA record `7f45db5`:
  `P0=0 / P1=0 / P2=0 / P3=0 / GAP=0`.
  It recomputed Phase 8 23/23 and manifest 18/18 hashes, Phase 5 38/38 browser
  and 4/4 gate hashes, all five Puzzle artifact hashes, lifecycle equivalence,
  candidate ancestry and recorded gate totals.
- All reviews were read-only. They started no npm command, browser, server,
  solver, resident Node, WMI/CIM, Serena, MCP or LSP.

## TETRIS-T15-PHASE8-ACCEPTANCE-006

- Status: `ACCEPTED / READY FOR NON-FORCE PUSH`.
- Frozen product: `4e4cca1`; successful harness `aa1afe6`; raw evidence
  `94463de`; browser index `a599f4c`; three QA records through `7f45db5`.
- The rejected selector experiment remains only at
  `codex/t15-selector-wip-20260730@dce331b` and is not an ancestor of the
  accepted line.
- Product, public assets, dependencies, configuration, Puzzle definitions and
  selector composition are unchanged throughout Phase 8.
- Ports 4178/5178/5179 are free and every Phase 8-owned browser/server/runner
  resource has been released.
- Next action: commit this coordinator acceptance, run one scoped redacted
  gitleaks scan, push `main` non-force, and verify exact local/tracking/remote
  equality.

## TETRIS-T15-PHASE8-PUSH-007

- Status: `ACCEPTED / PUSHED / CLOSED`.
- Coordinator acceptance `c77790b` was pushed to `origin/main` non-force.
- Scoped redacted gitleaks 8.30.1 covered the ten commits
  `4e4cca1..c77790b`, scanned approximately 258.30 kB, and found no leaks.
- This final recovery record is documentation-only and changes no frozen
  product, evidence file, hash manifest, gate result, or QA disposition.
- After this record is separately scanned and pushed, the coordinator verifies
  that local `HEAD`, `origin/main`, and remote `refs/heads/main` resolve to the
  same commit.
