# T20 final independent QA

Date: 2026-08-01

Reviewer: `tetris-t20 / final-readonly-qa`

Verdict: **FAIL**

## Reviewed boundary

- Base: `0e21365611d9bbaa8a59460bdaf1c10541e78cee`.
- Product source: `eadeac6fbd5885be9b7ed4c6405cc2ee3dad2688`.
- Final evidence: `b600ace37c1ade1fc0028adb91a06908ed3996b5`.
- Review was static and evidence-only. No server, browser, test, build, indexer, or subagent was started.

## Findings

- P0: none.
- P1: none.
- P2: **one release-blocking provenance inconsistency.** `docs/workstreams/tetris-t20-coordinator/THREAD_LOG.md` ends at the contract-open checkpoint and still states that no product edit, test, build, server, or browser work has run, with implementation as its next action. That directly contradicts the same candidate range, the final gate claims, and the committed browser evidence. It does not provide the required final changed paths, commands actually run, evidence checkpoint, resource disposition, blocker, and next action before independent QA.
- P3: none.
- Evidence Gap: **one.** The mandatory durable writer report is absent/stale, so the candidate cannot be traced from implementation through gates and evidence using its authoritative workstream record. This gap blocks acceptance even though the inspected product and browser artifacts pass their visual and structural checks.

## Passing product and evidence checks

- The range changes only the declared documents, renderer/tests, and `docs/qa/evidence/t20-survival-material/**`; no Core, collision, cadence, scoring, replay, save, or layout mechanism path changed.
- The renderer uses a deterministic cold blue-grey mineral ramp with Halton-distributed broad planes and neighbour blending. It does not load a photographic asset or use a row/column site grid. The bedrock remains one continuous rectangular body with a mathematically flat contact segment.
- Browser inspection shows a game-native continuous cool-grey low-poly mineral wall without a brick grid, photographic grain, masonry courses, or visible cell cadence.
- The warning keeps one clear downward arrow. Normal motion shows a short, strong warm whole-well and source-column flash; the two committed normal-motion frames have different hashes and visibly different intensity. The reduced-motion frame is a steady high-contrast endpoint, matching the static renderer-test contract.
- `browser-evidence.json` binds to source `eadeac6`, reports one Canvas, zero DOM board cells, no horizontal or vertical overflow at both recorded viewports, and an empty console-error list. All four referenced PNG SHA-256 values match the committed files.
- `git diff --check` for the complete candidate range returns no finding.

## Required retry boundary

Keep product source `eadeac6` and evidence `b600ace` frozen. Add a bounded documentation checkpoint that updates the T20 writer log with the actual implementation/evidence history and aligns any still-open progress wording with the current candidate state. Then resubmit the resulting contiguous range for independent read-only QA; no product repair or browser recapture is requested by this verdict.

## Provenance-only retry — PASS

Retry candidate: `0e21365611d9bbaa8a59460bdaf1c10541e78cee..534e78e0b3fc95da7427bdcfe773777a22d6eaf7`.

- Frozen product remains `eadeac6fbd5885be9b7ed4c6405cc2ee3dad2688`.
- Frozen evidence remains `b600ace37c1ade1fc0028adb91a06908ed3996b5`.
- Provenance checkpoint `534e78e0b3fc95da7427bdcfe773777a22d6eaf7` changes only `docs/CURRENT_TASK.md`, `progress.md`, and `docs/workstreams/tetris-t20-coordinator/THREAD_LOG.md`. It does not alter source, tests, screenshots, or the evidence manifest.
- The writer log now records the exact changed product paths, actual focused/final commands, final gate results, evidence checkpoint and binding, owned browser/Vite release, free port, prior QA blocker, and coordinator-owned next action.
- `docs/CURRENT_TASK.md` and `progress.md` now identify the source/evidence as frozen, preserve QA as pending until this retry, and no longer claim that implementation, gates, or evidence remain unperformed.
- `git diff --check b600ace..534e78e` returns no finding.

Retry findings:

- P0: none.
- P1: none.
- P2: none; the original provenance inconsistency is resolved.
- P3: none.
- Evidence Gap: none.

**Final retry verdict: PASS.** The first-round FAIL remains above as durable history; this bounded re-review accepts the unchanged product/evidence candidate after the sole documentation provenance gap was closed. Changelog disposition, scoped pre-push scanning, non-force push, and local/tracking/remote equality remain coordinator-owned.
