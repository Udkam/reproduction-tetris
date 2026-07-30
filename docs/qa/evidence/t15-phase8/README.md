# T15 Phase 8 integration evidence

## Binding

- Frozen product candidate:
  `4e4cca1e26554323d5712a2e28386c4a9fb4f7e2`.
- Committed harness revision used by the successful run:
  `aa1afe6253e32fd759dd22a9cebce117805f421b`.
- Raw browser evidence checkpoint:
  `94463de`.
- `phase8-browser-evidence.json` records identical before/after candidate
  bindings, a clean product tree, the committed harness blob, and the official
  `develop-web-game` client hash.
- `SHA256SUMS.txt` contains 23 verified entries. A separate post-run verification
  recomputed all 23 hashes and accepted the manifest assertions.

No `src/**`, dependency, configuration, Puzzle definition/route, or selector UI
path changed in this evidence phase.

## Browser coverage

One strict-port Vite lease on `127.0.0.1:4178` ran two browser owners serially:

1. the official `develop-web-game` action client, which entered Classic and
   produced two gameplay frames/states;
2. one managed Chrome tree, which covered Chinese desktop home and all four
   gameplay modes, Classic portrait, Puzzle short landscape, English Settings,
   reduced-motion Mutation, keyboard, touch, modal focus, restart, exit, direct
   Puzzle undo, and two-upcoming-piece semantics.

Every gameplay state asserted:

- exactly one Canvas;
- zero DOM board cells;
- visible board, side rail, and Next region;
- no horizontal or vertical overflow;
- no console or page errors.

The Puzzle frame binds visible `1` and `2` labels to the next and following
pieces. The Mutation frame binds a four-item carrier value to the rendered Next
preview. Survival begins with three brown bedrock rows. Two mount/restart/unmount
cycles and every subsequent mode exit returned listeners, pending rAF, open
audio contexts, QA surface, and Canvas to the home baseline.

## Existing source-bound evidence reused

- Phase 5: 34 Mutation captures, 38 browser checksum entries, four gate checksum
  entries, four carriers, normal/reduced activation, FIFO, actual Collapse
  columns, responsive status layouts, performance, and lifecycle. All referenced
  checksums were recomputed by the Phase 8 harness.
- Puzzle: five schema-7 artifacts, 50 unique IDs, 100 unique command streams,
  exactly two routes per level, and ten levels in each 3/4/5/6/7-row tier.
  Full replay, anchor, divergence, progress, and migration assertions remain in
  the final test suite.

## Manual visual review

All 15 published PNGs were opened individually after the successful run:

- home;
- Classic countdown, desktop, portrait, pause, and restart;
- Chinese and English Settings;
- Survival;
- normal and reduced-motion Mutation;
- desktop and short-landscape Puzzle;
- both official-client frames.

The review found no blank frame, clipping, structural gap, misplaced overlay,
unlabelled Puzzle preview, unreadable Mutation carrier, or responsive overflow.
The visible Survival bedrock is the accepted original brown block treatment.

## Final gates

Run serially after raw evidence was committed:

- `npm.cmd run typecheck` — PASS;
- `npm.cmd run test` — PASS, 26/26 files and 235/235 tests;
- `npm.cmd run build` — PASS, 753 modules transformed.

Vite retained its existing informational chunk-size warning for the 511.26 kB
main JavaScript bundle; it produced a complete build and is not a new functional
or release-blocking error.

## Failed batches

Two pre-publication attempts stopped inside the harness and self-cleaned:

1. `667cb54` corrected a harness-only assertion that had incorrectly required
   Next to render during the input-gated countdown;
2. `aa1afe6` made the touch check wait through a legal no-active-piece handoff
   frame.

Neither attempt published evidence or changed product source. The successful
batch released 4178/5178/5179 and closed both browser owners.
