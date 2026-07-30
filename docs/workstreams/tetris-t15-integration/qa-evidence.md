# Phase 8 evidence-integrity QA

- Audit head: `78c0664`
- Browser candidate: `a599f4c`
- Raw evidence: `94463de`
- Successful harness head: `aa1afe6`
- Product baseline: `4e4cca1`
- Verdict: **ACCEPT**
- Findings: `P0=0 / P1=0 / P2=0 / P3=0 / GAP=0`
- Method: read-only Git, UTF-8 document, and SHA-256 inspection; no npm
  command, browser, server, solver, or persistent Node process was started.

## Verified integrity

- `4e4cca1..78c0664` contains only Phase 8 documentation, capture harness,
  evidence, and QA records. There is no product, public-asset, dependency, or
  configuration drift. Rejected selector WIP `dce331b` is not an ancestor.
- All 23 entries in `docs/qa/evidence/t15-phase8/SHA256SUMS.txt` recompute
  exactly. The set contains 13 Phase 8 PNGs, two official-client PNGs, two
  state JSON files, the manifest, four logs, and the capture script.
- The manifest's 18 embedded screenshot, state, and script hashes also
  recompute exactly. Product, harness, raw-evidence, browser-candidate, and
  audit-head bindings form one consistent chain.
- All 13 capture lifecycle snapshots have equal before/after baselines.
  Every mounted mode returns to the baseline listener map, zero pending rAF,
  zero open audio, zero Canvas, and no QA surface. Browser and client error
  collections are empty.
- The manifest covers all four modes, desktop/portrait/short-landscape,
  Chinese/English, reduced motion, keyboard, touch, settings/backdrop,
  pause/restart/escape confirmation paths, direct Puzzle `Z` undo, Puzzle
  Next `1`/`2`, a Mutation carrier preview, and three-row brown Survival
  bedrock.
- Phase 5 bindings remain intact: 38/38 browser checksums and 4/4 gate
  checksums recompute, all four carrier families retain active/Next/locked/
  activation/reduced evidence, and the Phase 5 manifest has zero errors.
- The five Puzzle artifacts recompute, use schema 7, cover 50 unique levels,
  contain 100 routes, and divide evenly across the 3/4/5/6/7-row tiers.
- Recorded final gates agree across the evidence index and workstream log:
  typecheck passed, 26/26 test files and 235/235 tests passed, and the
  production build completed with 753 modules. The 511.26 kB chunk notice is
  informational and unchanged.

The previously accepted narrow three-status visual `P3` remains recorded in
the rules and visual QA files; it is not an evidence-integrity finding.
