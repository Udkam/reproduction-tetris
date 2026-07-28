# T15 Phase 3 HUD Workstream Log

## 2026-07-28 — contract and baseline checkpoint

- Task ID: `T15-PHASE3-HUD-CONTRACT`.
- Coordinator thread: `/root`.
- Rollback base: `6892f802c819015ed978cd24b714bbdf2d5a5caf`.
- Status: `CONTRACT`; no product source has changed and no candidate exists.
- Documentation paths:
  - `docs/CURRENT_TASK.md`
  - `docs/DESIGN.md`
  - `docs/phases/README.md`
  - `docs/phases/phase 3.md`
  - `docs/phases/phase 5.md`
  - `docs/workstreams/tetris-t15-coordinator/PHASE_MATRIX.md`
  - this log
- Read-only comparison work:
  - `/root/t15_hud_rules_preaudit` mapped responsive visibility, semantics, input,
    lifecycle, and direct-test gaps;
  - `/root/t15_hud_css_map` mapped the active DOM/CSS/renderer ownership and recommended
    one final `hud.css` authority layer after Mutation VFX;
  - the coordinator measured all four live modes at desktop, portrait, and short
    landscape and reproduced the real touch-hit failure.
- Baseline evidence remains ignored under
  `.local/audits/t15-phase3-baseline/`; it is diagnostic evidence only and may not be
  reused as final-candidate proof.
- Contract decision: split DOM/input/accessibility, spawn presentation, and final HUD
  CSS into separate checkpoints. Exclude Core, mode materials, Puzzle definitions and
  Puzzle selector composition.
- Later-phase addendum captured while this contract was written:
  - player-facing `冻结` becomes `冰冻`;
  - Ice auto-gravity is 1 second/cell for ten seconds, not a complete stop;
  - attachment recognition must work in active, locked, and Next states without
    relying on colour alone;
  - Collapse removes the ten-column/top horizontal strip and uses affected-column
    gravity feedback;
  - shared ordinary line-clear refinement is deferred to Phase 6, outside HUD scope.
- Commands actually run: read-only Git state/log inspection; UTF-8 reads of
  `AGENTS.md`, `docs/DESIGN.md`, `docs/CURRENT_TASK.md`, phase briefs, commit policy,
  latest changelog, and relevant T15 logs; `rg` terminology search.
- Tests/build: not run because this checkpoint changes documentation only.
- Blocker: none.
- Next action: commit this documentation-only contract, then implement the Phase 3
  DOM/input/accessibility checkpoint without entering Phase 4/5 product paths.

## 2026-07-28 — responsive HUD candidate

- Task ID: `T15-PHASE3-HUD-CANDIDATE`.
- Coordinator/writer: `/root`.
- Rollback base: `6892f802c819015ed978cd24b714bbdf2d5a5caf`.
- Candidate: `f27bb71` with review range
  `6892f802c819015ed978cd24b714bbdf2d5a5caf..f27bb71`.
- Status: `CANDIDATE`; targeted checks and development-browser evidence are green,
  while full gates, production-preview evidence and independent QA remain open.
- Source checkpoints:
  - `d8e83d2` — `src/App.tsx` and `src/App.test.ts`: transparent touch surface,
    mouse/touch focus, Canvas-localised accessible description, semantic live Next
    labels and direct pointer regression coverage;
  - `249e4ce` — `src/game/render/presentation.ts`,
    `src/game/render/presentation.test.ts`, and
    `src/game/render/TetrisRenderer.ts`: renderer-only spawn containment and corrected
    default Canvas label;
  - `f27bb71` — `src/main.tsx`, `src/styles/hud.css`, and
    `src/styles/hud.test.ts`: final live HUD authority layer, unified desktop/portrait/
    short-landscape topology and Mutation/Puzzle forecast accommodation.
- Targeted commands actually run:
  - `npm.cmd run test -- --run src/App.test.ts` — 32/32 passed;
  - `npm.cmd run test -- --run src/game/render/presentation.test.ts src/game/render/TetrisRenderer.test.ts`
    — 21/21 passed;
  - `npm.cmd run test -- --run src/styles/hud.test.ts src/App.test.ts src/game/render/presentation.test.ts src/game/render/TetrisRenderer.test.ts`
    — 57/57 passed;
  - `npm.cmd run test -- --run src/styles/hud.test.ts` — 4/4 passed after the final CSS edit;
  - `npm.cmd run typecheck` — passed after every source checkpoint;
  - `git diff --check` and staged-path inspection — passed.
- Development-browser evidence:
  - ignored captures live under `.local/audits/t15-phase3-iteration/`;
  - measured all four modes at `1440×900`, `390×844`, `844×390` and `1056×480`;
  - within each viewport all modes share identical board and side-rail bounds;
  - every measured screen has one Canvas, zero DOM cells, no horizontal or vertical
    overflow and no captured console/page errors;
  - actual touch context verified tap rotation, horizontal swipe movement and downward
    hard drop, with focus returning to the Canvas;
  - reduced-motion context retains the visible `3–2–1` mask while disabling countdown
    animation.
- Boundary held: no Puzzle selector, Core rules, level data, material identity, Settings
  composition, Mutation gameplay or line-clear VFX were changed.
- Blocker: none.
- Next action: run the single final full-gate/build/production-browser pass, freeze the
  resulting evidence, then dispatch independent rules and visual QA against the exact
  candidate range.

## 2026-07-28 — final HUD candidate accepted locally

- Task ID: `T15-PHASE3-HUD-ACCEPTANCE`.
- Coordinator/writer: `/root`.
- Rollback base: `6892f802c819015ed978cd24b714bbdf2d5a5caf`.
- Final candidate: `741d8a64ee1151894920163285769417663e6464`.
- Status: `ACCEPTED LOCAL`; non-force recovery push remains open.
- Correction checkpoints after the initial candidate:
  - `c817739` restores ordinary Next semantics, keeps all explicit HUD text at or
    above 12 px, and lets Puzzle `1` / `2` labels escape the transparent Canvas rail
    without hiding their two real previews;
  - `741d8a6` removes the final English `844×390` Mutation truncation while retaining
    12 px labels and the three-column compact status ledger.
- Commands actually run after the last source change:
  - `npm.cmd run test -- --run src/styles/hud.test.ts src/App.test.ts` —
    2 files / 37 tests passed;
  - `npm.cmd run typecheck` — passed;
  - `npm.cmd run test` — 26 files / 198 tests passed;
  - `npm.cmd run build` — 753 modules transformed and production build passed;
  - the prescribed web-game action client entered a real Mutation countdown and
    produced a one-Canvas state/screenshot with no remaining headless Chrome.
- Final production evidence:
  - exact candidate preview at `http://127.0.0.1:4178/`;
  - ignored manifest `.local/audits/t15-phase3-final/741d8a6-browser-evidence.json`;
  - four modes × `1440×900`, `390×844`, `844×390`, `1056×480`;
  - additional English Mutation `844×390` and reduced-motion countdown cases;
  - 18/18 scenarios report one Canvas, zero DOM cells, no horizontal or vertical
    overflow, no active dialog, and no console/page error.
- Independent QA:
  - input/accessibility QA accepts countdown `3→2→1`, keyboard, real touch tap/
    horizontal/downward/cancel paths, same-Canvas focus restoration and three
    mount/unmount lifecycle cycles;
  - rules/code QA accepts `6892f80..741d8a6` with no P0–P2 and confirms the final
    English correction is CSS-only;
  - visual QA accepts `741d8a6` with no P0–P3, including full English labels,
    Puzzle `1` / `2`, reduced-motion mask geometry, and the screenshot-backend
    one-pixel evidence boundary.
- Boundary held: no Core, mode rules, Puzzle selector/data, Survival pressure,
  Mutation attachment/VFX, ordinary line-clear effect, Settings composition, audio,
  dependency, or packaging path changed.
- Blocker: none.
- Next action: commit the coordinator acceptance record, stop preview/dev services,
  verify ports and browser children are released, then push `main` non-force.
