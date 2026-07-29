# T15 Phase 6 repeated rules-review packet

Status: `READ-ONLY PACKET / NOT A QA VERDICT`.

This packet lets a future independent reviewer inspect the corrected Phase-6
candidate without starting Node, Serena, a browser, a dev server, a test worker, or a
build. It records the frozen boundary and the exact questions that remain open. The
coordinator's preparation of this packet is not independent QA and cannot accept the
phase.

## Frozen boundary

| Role | Commit |
| --- | --- |
| Accepted Phase-5 base | `4f871ac3706f95c2a57679dd0162071c89363ecb` |
| Rejected first Phase-6 candidate | `eaed1ac0962ec014866972763f7e89891afeffb4` |
| Landing-support correction contract | `308e49c` |
| Corrected product candidate | `90859760bc9b2163219a31eb9053fcd4e92869ce` |
| Corrected gate index | `bee956a` |
| Corrected browser harness | `4a7f95f` |
| Corrected raw browser evidence | `9f90ced` |
| Corrected browser manifest/index | `ca80416` |

Only these product paths differ from the accepted base:

- `src/game/render/presentation.ts`;
- `src/game/render/presentation.test.ts`;
- `src/game/render/TetrisRenderer.ts`;
- `src/game/render/TetrisRenderer.test.ts`.

The product/config tree is byte-identical from corrected candidate `9085976` through
this packet. The current branch also contains documentation, gate, harness, and
evidence commits; those are not additional product changes.

## Mandatory review questions

1. **Ordinary-clear timing and ownership.** Confirm that
   `ordinaryLineClearFrame` and `ordinaryLineClearStrength` remain renderer-only,
   finish inside Core's existing 12-tick delay, retain recognisable cell material,
   keep translation below one quarter-cell, and use a stationary reduced-motion
   endpoint.
2. **Ordinary-clear geometry.** Confirm that one through four rows share the same
   confirmation → contraction/dissolve → afterglow family, remain clipped to the
   Pixi well, and never add a DOM board, screen-wide flash, or gameplay wait.
3. **Classic-only event gating.** Confirm that landing, combo, ten-line speed-boundary,
   and top-out cues are enqueued only in `marathon`, coexist in a six-entry bounded
   queue, and do not alter Core state, score, input, audio, Next, or other modes.
4. **Landing correction.** At `piece-locked`, confirm that
   `classicLandingSupportCells` excludes piece-internal lower edges and retains only
   external lower edges touching the floor or a non-null post-lock board cell. The
   resulting cue must be copied immediately so later board mutation cannot change it.
5. **Clear/top-out suppression.** Confirm that a lock batch containing
   `clear-started` or `game-over` does not also emit the ordinary landing cue.
6. **Speed and combo derivation.** Confirm that the previous line count is derived
   from the post-event total minus `event.count`, every crossed ten-line tier produces
   one bounded speed cue, and only a consecutive clear produces combo brackets.
7. **Lifecycle and accessibility.** Confirm that cue lifetimes expire, restart,
   Puzzle undo, and renderer destroy clear their state, and reduced motion preserves
   location while removing travel/expansion/debris.
8. **Regression scope.** Confirm no unlisted product path, Puzzle definition/selector,
   Survival pressure, Mutation item/VFX, dependency, persistence, localization, or
   React/CSS behavior changed.

The one-support overhang regression is in
`src/game/render/TetrisRenderer.test.ts`; it builds a horizontal `I` one row above the
floor with one old board support, expects exactly that supported cell in the frozen
cue, then mutates the source board and expects the cue to remain unchanged.

## Frozen evidence integrity

The coordinator performed one low-overhead PowerShell hash check on 2026-07-30; it did
not execute project code:

- `phase6-gate-evidence.json` names `9085976`, reports PASS, and all 3/3 raw gate
  hashes match `SHA256SUMS-gates.txt`;
- `phase6-browser-evidence.json` names `9085976` before and after capture, reports
  product-tree equality, 15 captures, zero browser errors, released Vite, closed
  browser, final zero Canvas, and final zero open AudioContexts;
- all 19/19 entries in `SHA256SUMS-browser.txt` match.

The current four-row witness is explicitly an isolated real-Renderer contract frame;
the manifest states that no verified public runtime route clears four rows. A reviewer
must treat that label as an evidence limitation, not as runtime proof.

## Verdict format and resource boundary

The independent response must be read-only and state:

```text
VERDICT: ACCEPT | REJECT
P0:
P1:
P2:
P3:
GAP:
REVIEWED RANGE: 4f871ac..9085976
```

Every finding needs a file/line pointer and a reproducible state or reasoning chain.
`ACCEPT` requires empty P0/P1/P2/GAP; any accepted P3 remains explicit debt.

Do not start a helper for this static pass. In particular, do not start Node,
`node_repl`, Serena, a language server, Vite, Chrome, Vitest, or a build. Before and
after review, retain no resident helper and verify zero listener on 4178. If a
transport bridge is strictly required, admit one server/stdin pair for that review
only and close it before the verdict is recorded. If independent review cannot be
provided inside that boundary, return `GAP` and leave Phase 6 frozen.
