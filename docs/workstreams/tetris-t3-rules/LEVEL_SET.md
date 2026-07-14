# Tetris T3R Verified Puzzle Level Set

All six levels are original, clean-room authored fixtures. Their exact 20 rows, fixed queue, budget, and mechanic are machine-readable in [levels.json](./levels.json). A `.` is empty and letters are initial locked cell types; every level begins with visible locked cells and has no random draw.

| # | ID / Chinese name | Difficulty | Queue | Budget | Initial cells | Intended mechanic |
| --- | --- | ---: | --- | ---: | ---: | --- |
| 1 | `t3r-shaft-01` / 三井初鸣 | 4 | I I I | 3 | 28 | Edge-to-edge SRS rotation into three offset vertical shafts. |
| 2 | `t3r-shaft-02` / 四井错拍 | 5 | I I I I | 4 | 24 | Four unequal shafts; the intermediate landing order changes the remaining routes. |
| 3 | `t3r-shaft-03` / 偏置立柱 | 5 | I I I I | 4 | 24 | Alternating side shafts require boundary correction after rotation. |
| 4 | `t3r-shaft-04` / 五井精裁 | 6 | I I I I I | 5 | 20 | Five unequal shafts demand five distinct landing columns and five effective rotations. |
| 5 | `t3r-cascade-05` / 左岸级联 | 7 | I I I O O | 5 | 20 | Three vertical columns establish a cavity; the two O pieces perform the clear cascade. |
| 6 | `t3r-cascade-06` / 右岸回流 | 8 | I I O I O | 5 | 20 | A right-edge cavity interleaves O and I placement, with late rotations and two dependent clears. |

Every verified reference route locks its entire authored queue, clears four normal lines, ends with zero occupied cells across the full canonical board (hidden buffer included), and uses only effective public movement/rotation/drop commands. Levels 4–6 each lock five pieces, use at least three footprint-changing rotations, and choose at least three distinct lateral landing columns. `expectedClearedLines` is a real replay conservation assertion only. The future success predicate is full-board empty; the current adapter supplies this value to the legacy core solely so it can complete its existing line-target transition while the external oracle rejects any residual cells or hidden occupancy.

## Reference results

| Level | Commands | Locks | Effective rotations | Distinct landings | Cleared lines | Final full-board occupied | Current engine hash |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 三井初鸣 | 21 | 3 | 3 | 3 | 4 | 0 | `68f86f9f` |
| 四井错拍 | 28 | 4 | 4 | 4 | 4 | 0 | `f839a801` |
| 偏置立柱 | 26 | 4 | 4 | 4 | 4 | 0 | `f839a801` |
| 五井精裁 | 34 | 5 | 5 | 5 | 4 | 0 | `83201ff5` |
| 左岸级联 | 29 | 5 | 3 | 4 | 4 | 0 | `48ce7474` |
| 右岸回流 | 29 | 5 | 3 | 3 | 4 | 0 | `48ce7474` |

The result table's middle columns are locks, effective rotations, and distinct lateral landing columns; all rows use their full fixed queue. The duplicate current-engine hashes are expected evidence of the present semantic gap: current canonical Puzzle state does not contain a T3R level identity or queue index after the queue is consumed. The production delta in [PUZZLE_RULES_CONTRACT.md](./PUZZLE_RULES_CONTRACT.md) makes those fields canonical, so future hashes distinguish these levels without a presentation-side workaround.

## Generation and difficulty evidence

The fixtures progress from introductory three- and four-shaft precision (1–3), to five-piece multi-landing dependency (4), to five-piece left/right cavity cascades with different fixed queues (5–6). A bounded deterministic search then loaded each authored 20-row board through the workstream initializer, enumerated only current public `move`, clockwise/counter-clockwise `rotate`, `hard-drop`, and required entry `tick` commands, and retained routes that reached a full canonical-board empty state. The search depth was capped at nine placement actions per piece; it did not mutate a state after initialization and did not use a browser state override.

This demonstrates a route for each authored level, validates normal current-core line resolution, and gives concrete movement/rotation evidence. It is not an exhaustive uniqueness proof; no level is claimed to have a unique solution.
