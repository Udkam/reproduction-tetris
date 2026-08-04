# T30 Final Independent QA

- Candidate range: `dc2aaad..2da8a37`.
- Review mode: independent and read-only.
- Result: **ACCEPT**.
- Findings: P0 0 / P1 0 / P2 0 / P3 0.

## Verified claims

- Each new active generation assembles over approximately 204 ms in deterministic
  top-to-bottom, left-to-right order at in-well safe coordinates.
- The ghost is delayed; move, rotate, and pause do not restart the arrival.
- Home, Puzzle library, and gameplay own exactly one transition surface. Push, pop,
  native View Transition, CSS fallback, and reduced-motion paths are covered, while
  page-local Puzzle selection does not create a route transition.
- Source-bound evidence reports one Canvas, zero DOM board cells, zero browser errors,
  zero failures, and complete renderer teardown after evidence frames.
- Inherited T27 evidence is outside the reviewed candidate and remains unstaged.

## Primary evidence

- `docs/evidence/t30/audit.json`
- `docs/evidence/t30/arrival-early.png`
- `docs/evidence/t30/arrival-middle.png`
- `docs/evidence/t30/arrival-complete.png`
- `docs/evidence/t30/home-final.png`
- `docs/evidence/t30/puzzle-route-final.png`
