# T20 Coordinator Thread Log

## 2026-08-01 — contract opened

- **Task ID:** T20 Survival material harmony correction
- **Base SHA:** `0e21365611d9bbaa8a59460bdaf1c10541e78cee`
- **Owner:** primary coordinator, sole writer
- **Declared contract paths:** `docs/CURRENT_TASK.md`, `docs/DESIGN.md`,
  `progress.md`, `docs/workstreams/tetris-t20-coordinator/THREAD_LOG.md`
- **Declared product boundary:** `src/game/render/TetrisRenderer.ts`,
  `src/game/render/TetrisRenderer.test.ts`, `src/game/render/theme.ts`,
  `src/game/render/theme.test.ts`
- **Player evidence:** the final bedrock reads as a pasted photographic grayscale
  texture beside simplified enamel pieces; the steady rockfall arrow is not obvious.
- **Commands run:** UTF-8 reads of the required project contracts; targeted `rg` and
  source-range inspection only. No test, build, server, browser, or product edit yet.
- **Current evidence:** direct screenshot review plus renderer/test inspection.
- **Blocker:** none.
- **Next action:** commit the contract checkpoint, then replace only the bedrock pixel
  language and rockfall warning presentation inside the declared renderer boundary.

## 2026-08-01 — frozen candidate and evidence

- **Task ID:** T20 Survival material harmony correction
- **Base SHA:** `0e21365611d9bbaa8a59460bdaf1c10541e78cee`
- **Contract checkpoints:** `2443ce3` opens the bounded correction; `eeccbad` records
  the final irregular mineral-plane contract after real-frame iteration.
- **Product checkpoints:** `a8e22ef`, `92337cb`, `243d5a9`, and final source
  `eadeac6`. The final renderer uses one deterministic cached cold blue-grey wall
  texture with Halton-distributed broad planes, neighbour blending, no row/column
  cadence, and a flat contact top. The rockfall signal keeps a source-column arrow
  and adds a short, high-contrast warm board/column flash; reduced motion is static.
- **Exact product paths changed:** `src/game/render/TetrisRenderer.ts` and
  `src/game/render/TetrisRenderer.test.ts`. No Core, rules, collision, cadence,
  scoring, replay, save, layout, theme, or dependency path changed.
- **Commands actually run:** focused renderer tests with
  `npm.cmd run test -- src/game/render/TetrisRenderer.test.ts --maxWorkers=1
  --no-file-parallelism`; final `npm.cmd run typecheck`; final
  `npm.cmd run test -- --maxWorkers=1 --no-file-parallelism`; final
  `npm.cmd run build`; one bounded Playwright capture through
  `.local/t20-early/capture-warning.cjs`; direct inspection of all four final PNGs;
  `netstat -ano` plus exact-PID process release for the owned Vite listener.
- **Gate results after the last source change:** typecheck passed; `32 passed / 1
  skipped` test files with `297 passed / 3 skipped` tests; production build passed
  with `762` transformed modules and only the existing chunk-size advisory.
- **Evidence:** the superseded exploratory evidence checkpoint is `a173998`; frozen
  final evidence is `b600ace` under `docs/qa/evidence/t20-survival-material/`.
  Its manifest binds to source `eadeac6`, reports one Canvas, zero DOM cells, no
  viewport overflow or browser errors, animated normal warning phases, and a static
  reduced-motion endpoint. All four committed PNG hashes match the manifest.
- **Resource disposition:** the capture browser closed itself; owned Vite PID `27484`
  was stopped after capture and inspection; port `5178` is free. No MCP, indexer,
  browser, test runner, build process, or development server is retained.
- **Independent QA:** `d1ad2e9` reports P0=0, P1=0, P2=1, P3=0, GAP=1. Product,
  visuals, scope, and frozen evidence pass. The sole blocker is this log having
  previously stopped at contract-open; this checkpoint supplies the missing durable
  provenance without altering source or evidence.
- **Blocker:** documentation provenance pending one bounded read-only QA retry.
- **Next action:** resubmit the frozen candidate plus this log for independent QA;
  if accepted, record changelog disposition, run the scoped pre-push secret scan,
  push `main` non-force, verify local/tracking/remote equality, and report release.

## 2026-08-01 — accepted

- **Independent retry:** provenance-only QA commit `1b0c64c` preserves the first-round
  failure history and reports P0=0, P1=0, P2=0, P3=0, GAP=0. Frozen product
  `eadeac6` and evidence `b600ace` are accepted without another implementation or
  browser pass.
- **Accepted claim:** the Survival bedrock is one game-native continuous cold mineral
  wall with a flat contact edge; the falling-stone warning combines one persistent
  source-column arrow with a short visible whole-well/column flash, and reduced motion
  stays static.
- **Resource disposition:** unchanged from the frozen-candidate record; no browser,
  server, test runner, build process, MCP, or indexer is retained, and port `5178`
  remains free.
- **Blocker:** none.
- **Next action:** commit final acceptance docs, run one scoped redacted gitleaks scan,
  push `main` non-force, and verify local, tracking, and remote tips are identical.
