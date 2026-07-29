# T15 Phase 6 evidence-integrity review packet

Status: `PREPARED / CLOSED UNTIL RULES AND VISUAL QA ACCEPT`.

This packet defines a zero-runtime integrity audit of the corrected Phase-6 evidence.
It is not a verdict. The reviewer must use committed files only and must not start
Node, Serena, Vite, Chrome, Playwright, tests, a build, or a language server.

## Frozen chain

| Claim | Commit or artifact |
| --- | --- |
| Corrected product candidate | `90859760bc9b2163219a31eb9053fcd4e92869ce` |
| Product freeze record | `f0dea42` |
| Raw final gates | `2c9fd50` |
| Gate normalization | `0239231` |
| Gate index | `bee956a` |
| Source-bound browser harness | `4a7f95f` |
| Corrected raw frames/logs | `9f90ced` |
| Browser manifest/checksums | `ca80416` |

The coordinator's current static preflight reproduced 3/3 gate hashes and 19/19
browser/script/manifest/log hashes. That preflight is not independent QA.

## Mandatory integrity checks

1. **Candidate binding.** Both `candidate.before.sourceCandidate` and
   `candidate.after.sourceCandidate` in `phase6-browser-evidence.json` equal
   `9085976`, and both `productTreeMatchesCandidate` values are true.
2. **Product immutability.** No product/config path differs between `9085976` and the
   reviewed evidence/documentation head. Documentation, harness, raw evidence, and
   indexes must not be mistaken for product changes.
3. **Gate provenance.** `phase6-gate-evidence.json` names `9085976`, reports PASS,
   and records the exact commands: typecheck, one-worker full suite, and build.
   `typecheck.txt`, `test.txt`, and `build.txt` must match all three entries in
   `SHA256SUMS-gates.txt`.
4. **Browser artifact closure.** The manifest contains exactly 15 captures and its
   `artifactFiles` list agrees with the committed Phase-6 browser artifacts.
   `SHA256SUMS-browser.txt` must match all 19 named script/manifest/PNG/log files.
5. **State binding.** Every capture has a purpose, dimensions, SHA-256, provenance
   kind, and before/after renderer or product state sufficient to prove the claimed
   frame.
6. **Honest route coverage.** Public runtime/Core proves 1/2/3-row clears. The
   four-row route is explicitly absent and its frame is labelled
   `isolated-real-renderer-contract`; combo/speed/top-out isolated frames use the same
   honest label.
7. **Responsive and accessibility coverage.** Required viewports are 1440×900,
   390×844, and 844×390. Reduced-motion evidence exists for ordinary clear and
   Classic combo/speed feedback.
8. **Canvas and DOM invariants.** Product captures report exactly one gameplay
   Canvas, zero DOM board cells, visible Next, and no horizontal or vertical overflow.
9. **Lifecycle closure.** Listener counts return `17→28→17` after mount/unmount,
   repeat unmount and Puzzle exit retain 17, and final Canvas, open AudioContexts, and
   pending animation frames are all zero.
10. **Runtime cleanup.** The manifest reports browser closed, server released, zero
    browser errors, and no current listener on 4178. No partial publication or stale
    first-candidate artifact may be treated as current evidence.

## Allowed static operations

- read committed Markdown/JSON/text files as UTF-8;
- compare Git blobs and exact path lists;
- recompute SHA-256 with a one-shot native/PowerShell file hash;
- inspect the fifteen committed PNGs at original dimensions.

Do not rerun a gate or capture merely for reassurance. Any product change invalidates
the current gate and browser binding and must return to the complete source-bound
sequence.

## Verdict format and ordering

Evidence-integrity QA opens only after repeated rules and visual QA accept. Its
read-only response must state:

```text
VERDICT: ACCEPT | REJECT
P0:
P1:
P2:
P3:
GAP:
GATE HASHES: x/3
BROWSER HASHES: x/19
CAPTURES: x/15
REVIEWED CANDIDATE: 9085976
```

Every GAP or mismatch must name the file, expected value, actual value, and affected
claim. The reviewer must not fix or regenerate evidence. Acceptance requires empty
P0/P1/P2/P3/GAP and exact candidate/hash/artifact/lifecycle closure.

