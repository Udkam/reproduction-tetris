# Phase 8 visual QA

- Candidate: `a599f4c`
- Raw evidence: `94463de`
- Product baseline: `4e4cca1`
- Verdict: **ACCEPT**
- Findings: `P0=0 / P1=0 / P2=0 / P3=1 / GAP=0`
- Method: read-only image review; no npm command, browser, server, solver, or
  persistent Node process was started.

## Phase 8 image disposition

| Image | Result | Accepted claim |
| --- | --- | --- |
| `phase8-home-desktop.png` | PASS | One brand, four clear mode choices, consistent icons, dividers, type, and colour. |
| `phase8-classic-countdown.png` | PASS | Countdown `3` and board mask are visible; Next is intentionally hidden during the frozen countdown. |
| `phase8-classic-desktop.png` | PASS | Board remains primary; active piece, statistics, and Next are complete and aligned. |
| `phase8-classic-paused.png` | PASS | Pause hierarchy, mask, initial focus, and frozen game state are clear. |
| `phase8-restart-confirm.png` | PASS | Nested confirmation, choice hierarchy, and initial focus are clear. |
| `phase8-classic-portrait.png` | PASS | The 390x844 view has no horizontal overflow or clipped board, active piece, or Next preview. |
| `phase8-survival-desktop.png` | PASS | Accepted three-row original brown square bedrock and pressure statistics are preserved. |
| `phase8-mutation-desktop.png` | PASS | Multiplier carrier is identifiable in Next by gold core, star mark, and surface material. |
| `phase8-mutation-reduced.png` | PASS | Reduced-motion endpoint remains informative without residual strong motion or layout shift. |
| `phase8-puzzle-desktop.png` | PASS | Internal level name/index are absent; labels `1` and `2` map clearly to both previews. |
| `phase8-puzzle-landscape.png` | PASS | The 844x390 board, statistics, dual Next, and focus treatment fit without clipping. |
| `phase8-settings-zh.png` | PASS | Control, keyboard, rules, and records form a compact sequence without a structurally empty quadrant. |
| `phase8-settings-en.png` | PASS | English text fits without clipping, collision, or abnormal panel growth. |
| `official-client/shot-0.png` | PASS | Official-client initial board, Next, focus boundary, and top active piece are complete. |
| `official-client/shot-1.png` | PASS | Later active piece, ghost, stack, and Next geometry remain consistent and unclipped. |

## Phase 5 Mutation cross-check

- Freeze, Collapse, Bomb, and Multiplier activation frames and their
  reduced-motion endpoints retain distinct visual languages.
- Active and Next carrier samples distinguish all four effects through core
  shape, edge treatment, surface texture, and colour rather than colour alone.
- One-, two-, and three-status samples retain every status identity, order,
  timer, icon, and progress indication; no status effect disappears.

## Accepted low-severity note

- `P3`: in the 390px three-status Mutation HUD, the longest status and score
  strings can be ellipsized. Icons, colour systems, order, remaining seconds,
  Next, board, and controls remain readable, so this does not block acceptance.

The Puzzle selector library itself was excluded from scoring by the Phase 8
contract.
