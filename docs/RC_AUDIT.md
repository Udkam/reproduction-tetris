# TetraMorph v1.0 RC Requirement Audit

Status: active, fail-closed audit started 2026-08-03. A phase is `VERIFIED` only when
the current source, automated gates, and (for visible behavior) source-bound browser
evidence all support the same claim.

| Phase | Requirement | Current evidence | Status / next proof |
| --- | --- | --- | --- |
| A | TetraMorph identity, compatibility migrations, public README | Accepted source and tests are recorded in T26; active source/package scan has no Signal Foundry identity. | `VERIFIED` |
| B | Home wordmark plus one positioning line | Source `2198b92` and desktop/narrow frames show exactly one wordmark plus the localized line. | `VERIFIED` |
| B | First-entry Goal / Mechanic / Challenge under 100 Chinese body characters | Evidence `96b8854` shows three facts in every audited layout; the inspected Chinese Mutation body is 48 characters. | `VERIFIED` |
| B | `3`, `2`, `1`, `Start` without added input delay | Direct timing tests pass; the source-bound Start frame already contains one Canvas and a populated Next label. | `VERIFIED` |
| C | Brand/UI/data/Chinese typography | Browser evidence binds Playwrite NZ Basic / Space Grotesk / Geist Mono / Noto Sans SC to the accepted source. | `VERIFIED` — retain the direct-player-approved Geist Mono data role. |
| C | Responsive Settings, HUD, results, and leaderboards | T26 proves Settings and selected HUD states; final results/leaderboard/current-source matrix is incomplete. | `PARTIAL` — complete final cross-surface browser audit. |
| C | Settings tabs: settings, controls, rules | Three tabs exist, but Settings lacks a player reduced-motion control and Controls lacks visible touch guidance. | `OPEN` — follow the OS until an explicit persisted `on|off` choice, drive CSS and Pixi together, and add one inline gesture note without structural whitespace or runtime reconstruction. |
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

The next product checkpoint is the remaining Phase C accessibility and surface audit.
It may change `src/App.tsx`, localization, authoritative Settings/HUD/result styles,
the smallest persistence path required for the player motion preference, and direct
tests. It must not alter Core rules, renderer primitives, puzzle content, leaderboard
ordering, or mode mechanics. Implement the reduced-motion control and visible touch
guidance first; then use one current-source browser batch to identify rather than assume
HUD/result/leaderboard defects.
