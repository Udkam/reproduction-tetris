# T15 Phase 1 Independent QA and Coordinator Disposition

## Reviewed boundary

- Rollback base: `ed36ab3`.
- Corrected product candidate: `99e5a0f`.
- Candidate coordination record: `fb0545a`.
- Excluded inherited paths: `src/styles.css` T13.16 compositor delta and untracked
  `phase 1.md`.

## Verification evidence

- Focused contract: 2 files / 12 tests passed.
- Typecheck: passed.
- Full suite after the final source correction: 25 files / 182 tests passed.
- Production build after the final source correction: 752 modules.
- A disposable detached worktree at `54fd260` completed
  `npm.cmd ci --ignore-scripts`, typecheck, and the focused contract; the lock did not
  change in the later family-name-only correction.
- Clean production-preview report:
  `.local/audits/phase1-99e5a0f-preview/candidate/report.json`.

| Local evidence | SHA-256 |
| --- | --- |
| `report.json` | `2AC5E48141A36EC38A8AC94C81F5B48FFA6FF7E066B411396B8051142F4AB695` |
| `home-1440x960.png` | `6D4431E357DF8A2DF430F42E51530A9BCA67C05888E1AFCFDCA296FE43533363` |
| `classic-1440x960.png` | `3C76E4B899170DEB0E2FC6FA8E08F01A7605219797AD37FA95026A91B8B3B1C1` |
| generic live-client entry frame | `B72F9C64C839E7153FFC99338EC466FB8D00D5680467249A9C849E17AA089DFD` |

The bound report records loaded Playwrite 400, Space Grotesk Variable 500,
JetBrains Mono Variable 700, and Noto Sans SC Variable Chinese faces; exact palette
roles; one `h1`; four mode entries; one canvas; zero DOM board cells; no horizontal
overflow; and zero console/page errors.

## Finding and correction history

1. Initial code/rules review found stale T14 state and an AA regression where soft
   `#627D98` was used as normal supporting text. Documentation was archived; readable
   `#52677F` was introduced and the 4.5 contrast assertions restored.
2. Candidate-bound review found the authored Playwrite face was requested at
   nonexistent weight 700. It was changed to the real 400 face and verified in a clean
   production preview.
3. First final target/visual review rejected `54fd260` with one P1: Fontsource
   registered `Space Grotesk Variable` and `JetBrains Mono Variable`, but the token
   families requested their non-Variable aliases, silently falling back to Noto.
   Correction `99e5a0f` binds the real names, extends the direct test, refreshes all
   evidence, and removes the fallback-positive Playwrite 700 field.

## Final independent verdicts

- Code/rules QA (`t14_readonly_qa`): accepts `99e5a0f` plus post-candidate
  coordination record `fb0545a`; no open P0/P1/P2.
- Target/visual QA (`phase1_visual_delta`): accepts `99e5a0f`; no open P0/P1/P2.
- Non-blocking handoff: historical direct font aliases and component-level
  spacing/radius/button/motion consumption remain for their explicitly assigned
  Settings and HUD phases.

## Coordinator disposition

Accepted. Phase 1A/1B is an additive design foundation, not a claim that Settings or
HUD has already been recomposed. It changes no Core rule, piece material, Mutation
attachment semantics, or Puzzle campaign. Port 53972 is released; the disposable
npm-ci worktree is removed; the detached visual-review worktree contains no running
service. Coordinator acceptance checkpoint `fcd612e` was successfully pushed to
`origin/main` without a force push or history rewrite.
