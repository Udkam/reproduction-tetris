# T15 Phase 6 source-bound evidence

The refreshed final gate set in this directory is bound to corrected product candidate
`90859760bc9b2163219a31eb9053fcd4e92869ce`. The browser files still describe the
rejected first candidate until the complete source-bound browser batch is regenerated;
they are historical evidence, not acceptance evidence for `9085976`.

- `typecheck.txt` records the final TypeScript project check.
- `test.txt` records the complete one-worker Vitest run: 26 files and 232 tests.
- `build.txt` records the production build: 753 transformed modules.
- `phase6-gate-evidence.json` binds commands, results, commits, and file hashes.
- `SHA256SUMS-gates.txt` contains hashes of the normalized raw logs.
- `capture_phase6.py` is the committed fail-closed browser harness.
- `phase6-*.png` contains fifteen original-detail product or explicitly labelled
  isolated-Renderer frames.
- `phase6-browser-evidence.json` binds every frame to public runtime/Core or isolated
  real Renderer state before and after capture.
- `SHA256SUMS-browser.txt` contains nineteen browser/script/manifest/log hashes.

The corrected-candidate raw gate logs were committed at `2c9fd50`. Evidence-only
normalization `0239231` removed one Vite-emitted trailing space and final blank lines
after `git diff --check` exposed them. No product source changed and the gate commands
were not repeated. The prior browser harness is `1b9c85f`; its raw frames and managed
Vite logs are `a231fda`; its manifest/checksums are `d7fb4fa`. Those browser artifacts
must be replaced before Phase 6 can return to QA.

The browser run replays every current verified Puzzle route through public Core
commands before selecting the shortest real 1/2/3-row witnesses. No current verified
route clears four rows at once, so the four-row PNG is explicitly an isolated
real-Renderer contract frame rather than fabricated runtime evidence. The batch also
captures one-row confirmation/contraction/afterglow, the safe next active piece,
reduced motion, Classic landing, coexisting combo plus ten-line speed feedback,
top-out, desktop/portrait/short-landscape layouts, one Canvas/zero DOM cells, and
restart/remount/unmount lifecycle. Browser console/page errors are empty.

The first mechanically passing batch was rejected during original-detail inspection
because the isolated Renderer queue allowed a Next piece to enter the board crop.
`db3423b` removes that unrelated preview. Two later runs failed closed before
publication until landing action, zero-tick Renderer event flush, snapshot and Pixi
extraction became one deterministic transaction in `8ff34d5` / `1b9c85f`. Rejected
generated files were removed and are not evidence.
