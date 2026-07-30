# T16 / Phase 9 Collaboration and Recovery Matrix

Base: `main@87121af42330ab9aea9456e28dfa42e5edc62536`

| Checkpoint | Writer | Independent comparison | Exact product boundary | Status |
| --- | --- | --- | --- | --- |
| Contract | coordinator | three read-only design brainstorms | current/design/phase/matrix/log/progress docs | FROZEN |
| Survival Core | coordinator | later rules QA | Core constants/types/engine/race tests and direct state consumers | GREEN `b99bbed`; final rules QA pending |
| Survival cavern | coordinator | later visual + rules QA | Survival theme/Renderer/presentation/runtime/App and direct tests/copy | BROWSER GREEN `e041a1c`; final independent QA pending |
| Ordinary feedback | coordinator | later visual + rules QA | shared Renderer/presentation/theme and direct tests | SOURCE CORRECTED `d8e97e7`; browser feel QA pending |
| Rules + Puzzle + home | coordinator | visual + input QA | App/styles/style order/localization/direct tests | RULE SHEET BROWSER-ACCEPTED; cascade corrected at `693f3d4`; visual superseded |
| Ready visibility | coordinator | countdown visibility audit + final visual QA | Renderer/snapshot/direct tests only | SOURCE GREEN `6a47926`; browser proof pending |
| Result ledger | coordinator | result hierarchy audit + final visual/input QA | App/localization/result.css/direct tests | OPEN |
| Puzzle gallery + home hover | coordinator | selector/home comparison + final visual/input QA | App/navigation/puzzle-library.css/direct tests | OPEN |
| Candidate evidence | coordinator | evidence QA | final gates plus source-bound browser artifacts only | `a67fb00` superseded by navigation rejection |
| Superseded correction | same coordinator | repeat relevant QA | navigation CSS/tests only | GREEN `2c199d2..693f3d4`; retained recovery |
| Acceptance/push | coordinator | three final verdicts | changelog/log/acceptance evidence | PENDING |

Only the coordinator writes. Design brainstorm agents are read-only and finished before
the contract checkpoint. QA agents remain read-only until a candidate SHA is declared.
Each source row must become a separate exact-path commit and remote recovery point only
after its bounded claim is green.
