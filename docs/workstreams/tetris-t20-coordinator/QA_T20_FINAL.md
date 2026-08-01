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
