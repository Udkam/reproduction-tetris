# T15 Collaboration and Recovery Matrix

This register is the coordinator-owned execution map for the complete T15 goal. A
phase remains `OPEN` until its candidate has fresh evidence, two independent read-only
verdicts, correction/retest where required, a coordinator acceptance record, resource
cleanup, and a successful non-force push.

## Fixed team topology

| Role | Responsibility | Write authority |
| --- | --- | --- |
| Coordinator | Freeze scope, sequence shared paths, integrate logs/changelog, resolve conflicting QA, clean resources, push. | Contract, coordinator logs, changelog only; product edits only when acting as the declared phase writer. |
| Writer | Implement one bounded subsystem/checkpoint and run targeted gates. | Only the exact paths named in that phase contract. |
| Code/rules QA | Compare `base..candidate`, deterministic behavior, tests, lifecycle, and scope. | None. |
| Target/visual QA | Compare actual candidate frames and geometry against the frozen target at required viewports. | None. |
| Tie-break QA | Reproduce only a disputed finding when the two primary verdicts conflict. | None. |

At most one writer owns a shared path at a time. QA begins only after the writer
stops. A failed candidate returns to the same writer; correction never moves into a
QA task.

## Ordered phase teams

| Phase | Declared writer team | Independent QA team | Rollback granularity | Status |
| --- | --- | --- | --- | --- |
| 1. Design foundation | coordinator as `t15_phase1_writer` | `t14_readonly_qa` + `phase1_visual_delta` | contract, dependency, token/font source, evidence, QA, acceptance | `PUSHED`; source `99e5a0f`, acceptance/recovery `fcd612e` |
| 1.5 Modal compositor closure | coordinator as `t15_modal_writer` | `t15_modal_rules_preaudit` + `t15_modal_target` | one narrow CSS/test source checkpoint, then evidence/QA | `SOURCE CANDIDATE 17ccc96`; direct App test/typecheck pass; full gates/evidence/dual QA pending |
| 2. Settings | `t15_settings_writer` | `t15_settings_rules_qa` + `t15_settings_visual_qa` | behavior/focus and layout/style are separate checkpoints | `OPEN` |
| 3. HUD | `t15_hud_writer` | `t15_hud_rules_qa` + `t15_hud_visual_qa` | DOM composition and renderer geometry remain separately revertible | `OPEN` |
| 4. Survival | sequential `t15_survival_core_writer`, `t15_survival_render_writer`, `t15_survival_ui_writer` | `t15_survival_rules_qa` + `t15_survival_visual_qa` | Core, renderer, and UI each receive their own candidate SHA | `OPEN` |
| 5. Mutation | sequential `t15_mutation_core_writer`, `t15_mutation_vfx_writer`, `t15_mutation_ui_writer` | `t15_mutation_rules_qa` + `t15_mutation_visual_qa` | Core/performance, renderer/VFX, and UI each remain independently revertible | `OPEN` |
| 6. Classic | `t15_classic_writer` | `t15_classic_rules_qa` + `t15_classic_visual_qa` | UI micro-polish separated from any renderer feedback checkpoint | `OPEN` |
| 7. Puzzle 50 | sequential schema writer, five ten-level batch writers, then progress/UI writer | `t15_puzzle_rules_qa` + `t15_puzzle_visual_qa` | schema, levels 01–10/11–20/21–30/31–40/41–50, migration, UI/evidence | `OPEN` |
| 8. Integration | coordinator | `t15_final_rules_qa` + `t15_final_visual_qa`; tie-break if needed | final docs/evidence only; product findings return to their owning phase | `OPEN` |

Canonical task names describe roles and may be fulfilled by newly spawned agents when
a slot opens. The exact agent ID, base SHA, paths, commands, findings, evidence hashes,
correction SHA, accepted SHA, pushed SHA, and next action are recorded in that phase's
`THREAD_LOG.md`.

## Required checkpoint chain per phase

1. `contract` — docs only; target, exclusions, writer, paths, gates, and rollback base.
2. `source-*` — one green reviewable claim per commit; exact-path staging only.
3. `candidate` — immutable SHA handed to both auditors.
4. `evidence` — source-bound screenshots/reports/hashes; no product edits.
5. `qa-rules` and `qa-visual` — independent verdicts.
6. `correction-*` — only when findings require it, followed by fresh evidence and both
   audits again.
7. `acceptance` — coordinator changelog/log disposition.
8. `push` — accepted SHA pushed to `main` as the remote recovery point.

No phase may borrow a later phase's acceptance, silently bundle inherited dirty paths,
or call a static screenshot proof of an interaction. The next phase cannot acquire a
shared source path until the preceding accepted SHA has been pushed.
