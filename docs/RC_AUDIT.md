# TetraMorph v1.0 RC Requirement Audit

Status: active, fail-closed audit started 2026-08-03. A phase is `VERIFIED` only when
the current source, automated gates, and (for visible behavior) source-bound browser
evidence all support the same claim.

| Phase | Requirement | Current evidence | Status / next proof |
| --- | --- | --- | --- |
| A | TetraMorph identity, compatibility migrations, public README | Accepted source and tests are recorded in T26; active source/package scan has no Signal Foundry identity. | `VERIFIED` |
| B | Home wordmark plus one positioning line | Home currently renders the wordmark only. | `OPEN` — add the bilingual positioning line and inspect all required viewports. |
| B | First-entry Goal / Mechanic / Challenge under 100 Chinese body characters | Entry sheet currently reuses the longer Settings rules. | `OPEN` — add a separate concise intro contract and direct character-count tests. |
| B | `3`, `2`, `1`, `Start` without added input delay | Current sequence ends after `1`; no Start cue is rendered. | `OPEN` — show a short non-blocking Start cue while control begins at the existing boundary. |
| C | Brand/UI/data/Chinese typography | Browser evidence binds Playwrite NZ Basic / Space Grotesk / Geist Mono / Noto Sans SC to the accepted source. | `VERIFIED` — retain the direct-player-approved Geist Mono data role. |
| C | Responsive Settings, HUD, results, and leaderboards | T26 proves Settings and selected HUD states; final results/leaderboard/current-source matrix is incomplete. | `PARTIAL` — complete final cross-surface browser audit. |
| C | Settings tabs: settings, controls, rules | Three tabs exist, but Settings lacks a player reduced-motion control and Controls lacks visible touch guidance. | `OPEN` — add both without structural whitespace or runtime reconstruction. |
| D | Classic feedback clarity | Existing score, speed, combo implementation has historical tests/evidence. | `PENDING CURRENT PROOF` — audit without adding a system. |
| D | Survival 800 ms danger warning plus concise warning sound | The existing warning is scheduled one player piece ahead and renders a flashing arrow; exact visible lead time/audio contract is not yet proven. | `OPEN` — reconcile timing with 800 ms acceptance and capture the actual warning. |
| D | Five Mutation abilities recognizable at carrier, activation, and active-state stages | Five items exist with renderer/audio tests and historical evidence. | `PENDING CURRENT PROOF` — capture all recognition stages, repair only demonstrated gaps. |
| D | Puzzle copy/guidance/visual consistency with frozen boards/order | Current lessons and campaign exist. | `PENDING CURRENT PROOF` — do not edit puzzle definitions or ordering. |
| E | Final gates and clean lifecycle teardown | Previous source passed typecheck, full tests, build, and bounded browser checks. | `OPEN` — rerun only after final source edit; add explicit teardown/bundle audit. |
| E | Bundle, font, dependency, and unused-asset inspection | Local font packages and build output exist; no final RC composition report exists. | `OPEN` — measure current output and document decisions. |
| F | Current-source final frames and 30–60 second capture plan | Historical evidence exists, but no complete RC showcase package binds to the final candidate. | `OPEN` |
| F | GitHub, resume, portfolio copy and RC Release Notes | README exists; dedicated final showcase copy and release notes are absent. | `OPEN` |
| Final | Independent read-only QA and coordinator acceptance | Not yet requested because the candidate is not frozen. | `BLOCKED BY OPEN WORK`, not a product blocker. |

## Current bounded slice

The next product checkpoint is Phase B only. It may change `src/App.tsx`,
`src/ui/localization.ts`, the smallest authoritative style paths, and direct tests.
It must not alter Core rules, renderer primitives, persistence schemas, puzzle content,
leaderboard ordering, or mode mechanics. Focused tests and typecheck precede a single
source-bound browser pass. The Settings accessibility gaps remain documented for the
next separate Phase C checkpoint.
