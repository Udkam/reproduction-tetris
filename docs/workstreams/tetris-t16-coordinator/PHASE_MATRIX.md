# T16 / Phase 9 Collaboration and Recovery Matrix

Base: `main@87121af42330ab9aea9456e28dfa42e5edc62536`

| Checkpoint | Writer | Independent comparison | Exact product boundary | Status |
| --- | --- | --- | --- | --- |
| Contract | coordinator | three read-only design brainstorms | current/design/phase/matrix/log/progress docs | FROZEN |
| Survival Core | coordinator | later rules QA | Core constants/types/engine/race tests and direct state consumers | GREEN `2a1fb3b`; final QA pending |
| Survival cavern | coordinator | later visual + rules QA | Survival theme/Renderer/presentation/runtime/App and direct tests/copy | SOURCE CORRECTED `d8e97e7`; countdown rise + browser QA pending |
| Ordinary feedback | coordinator | later visual + rules QA | shared Renderer/presentation/theme and direct tests | SOURCE CORRECTED `d8e97e7`; browser feel QA pending |
| Puzzle + home | coordinator | later visual + input QA | App/styles/style order/localization/direct tests | PENDING |
| Candidate evidence | coordinator | evidence QA | final gates plus source-bound browser artifacts only | PENDING |
| Correction | same coordinator | repeat relevant QA | only paths reopened by accepted findings | PENDING |
| Acceptance/push | coordinator | three final verdicts | changelog/log/acceptance evidence | PENDING |

Only the coordinator writes. Design brainstorm agents are read-only and finished before
the contract checkpoint. QA agents remain read-only until a candidate SHA is declared.
Each source row must become a separate exact-path commit and remote recovery point only
after its bounded claim is green.
