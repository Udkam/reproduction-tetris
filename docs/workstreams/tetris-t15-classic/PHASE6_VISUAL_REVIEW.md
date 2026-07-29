# T15 Phase 6 visual-review packet

Status: `CORRECTED AFTER VISUAL QA GAP / RE-REVIEW REQUIRED`.

This is a zero-runtime review map for the already frozen Phase-6 images. It does not
reopen visual QA before rules QA, does not replace original-detail inspection, and is
not a verdict. A future independent reviewer must inspect the committed PNG bytes at
their original dimensions without launching the game, Vite, Chrome, Playwright, Node,
Serena, or a language server.

## Frozen candidate and target

- accepted base: `4f871ac3706f95c2a57679dd0162071c89363ecb`;
- corrected product: `90859760bc9b2163219a31eb9053fcd4e92869ce`;
- browser manifest/index: `ca80416`;
- product/config tree after `9085976`: unchanged;
- source of truth for appearance:
  `docs/DESIGN.md` Phase-6 ordinary-clear and Classic-feedback paragraphs.

The target is an original board-local TetraMorph presentation. Commercial logos,
fonts, layouts, sound, sprites, or trade dress are not comparison references.

## Original-detail frame matrix

### Responsive product views

| Frame | Dimensions | Inspect |
| --- | ---: | --- |
| [Classic desktop](../../qa/evidence/t15-phase6/phase6-classic-desktop.png) | 1440×900 | Board dominance, visible HUD/Next, no overflow or modal residue. |
| [Classic portrait](../../qa/evidence/t15-phase6/phase6-classic-portrait.png) | 390×844 | Complete board and controls, readable hierarchy, no clipped spawn/Next. |
| [Classic short landscape](../../qa/evidence/t15-phase6/phase6-classic-landscape.png) | 844×390 | No structural collision, clipping, scroll, or hidden mandatory state. |

### Ordinary-clear sequence

| Frame | Provenance | Inspect |
| --- | --- | --- |
| [One-row confirmation](../../qa/evidence/t15-phase6/phase6-clear-1-confirmation.png) | public runtime/Core | Narrow row-local light; locked materials still read as themselves. |
| [One-row contraction](../../qa/evidence/t15-phase6/phase6-clear-1-contraction.png) | public runtime/Core | Cells contract inward by less than one quarter-cell while remaining recognisable. |
| [One-row afterglow](../../qa/evidence/t15-phase6/phase6-clear-1-afterglow.png) | public runtime/Core | Restrained debris/residual silhouette at the cleared row only. |
| [Two-row matrix](../../qa/evidence/t15-phase6/phase6-clear-2-matrix.png) | public runtime/Core | Same family and timing, bounded increase in intensity. |
| [Three-row matrix](../../qa/evidence/t15-phase6/phase6-clear-3-matrix.png) | public runtime/Core | Same family and timing, no screen-wide wash or HUD obstruction. |
| [Four-row contraction contract](../../qa/evidence/t15-phase6/phase6-clear-4-renderer-contract.png) | isolated real Renderer | Four-row contraction at `phaseTicks: 5`; never mislabel this as an endpoint or public runtime route. |
| [Reduced motion](../../qa/evidence/t15-phase6/phase6-clear-reduced-motion.png) | isolated real Renderer | Stationary thin confirmation/fade; no translation, scaling, or debris. |
| [Safe next decision](../../qa/evidence/t15-phase6/phase6-clear-safe-next.png) | public product viewport | New active piece, board and Next are unobscured after resolution. |

### Classic board-local feedback

| Frame | Provenance | Inspect |
| --- | --- | --- |
| [Ordinary landing](../../qa/evidence/t15-phase6/phase6-classic-landing.png) | public runtime/Pixi extract | Contact echo appears only under true floor/stack support and stays inside the cell/floor boundary. |
| [Combo plus speed](../../qa/evidence/t15-phase6/phase6-classic-combo-speed.png) | isolated real Renderer | Side brackets and descending rail ticks coexist without overwrite or banner geometry. |
| [Top-out](../../qa/evidence/t15-phase6/phase6-classic-top-out.png) | isolated real Renderer | Four short spawn-zone corner marks sit over the existing terminal scrim. |
| [Reduced Classic feedback](../../qa/evidence/t15-phase6/phase6-classic-feedback-reduced.png) | isolated real Renderer | Same event locations, stationary short strokes, no travel/oscillation. |

## Acceptance questions

1. Does every cue remain clipped to the one Pixi well and avoid a second Canvas or
   DOM-cell board?
2. Is the three-stage ordinary-clear sequence visible as one coherent family rather
   than three unrelated effects?
3. Do one through four rows differ only by bounded intensity, contraction distance,
   and debris count?
4. Are locked-cell materials readable at confirmation and contraction, with a faint
   endpoint before canonical removal?
5. Are the HUD, Next, active decision, input target, and board geometry unobscured?
6. Do landing, combo, speed, and top-out cues communicate distinct events without
   text, camera movement, full-screen flash, or wide banner?
7. Is reduced motion a deliberate stationary endpoint rather than a missing effect?
8. At 1440×900, 390×844, and 844×390, is all mandatory state visible with no
   clipping, overflow, accidental font fallback, or structural blank region?
9. Are isolated Renderer frames visually credible but clearly separated from public
   runtime evidence?

## Verdict format and ordering

Visual QA may begin only after an independent repeated rules verdict accepts
`4f871ac..9085976`. Its read-only response must state:

```text
VERDICT: ACCEPT | REJECT
P0:
P1:
P2:
P3:
GAP:
REVIEWED CANDIDATE: 9085976
REVIEWED FRAMES: 15/15
```

Every finding needs the frame name, exact visible region, target mismatch, and
severity. A reviewer must not repair the candidate. Any P0/P1/P2/GAP returns the
phase to its owning source or evidence checkpoint; accepted P3 remains explicit debt.
