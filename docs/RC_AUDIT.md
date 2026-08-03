# TetraMorph v1.0 RC Requirement Audit

Status: product requirements complete; test-runner recheck pending independent QA on
2026-08-03. A phase is `VERIFIED` only when
the current source, automated gates, and (for visible behavior) source-bound browser
evidence all support the same claim.

| Phase | Requirement | Current evidence | Status / next proof |
| --- | --- | --- | --- |
| A | TetraMorph identity, compatibility migrations, public README | Accepted source and tests are recorded in T26; active source/package scan has no Signal Foundry identity. | `VERIFIED` |
| B | Home wordmark plus one positioning line | Source `2198b92` and desktop/narrow frames show exactly one wordmark plus the localized line. | `VERIFIED` |
| B | First-entry Goal / Mechanic / Challenge under 100 Chinese body characters | Evidence `96b8854` shows three facts in every audited layout; the inspected Chinese Mutation body is 48 characters. | `VERIFIED` |
| B | `3`, `2`, `1`, `Start` without added input delay | Direct timing tests pass; the source-bound Start frame already contains one Canvas and a populated Next label. | `VERIFIED` |
| C | Brand/UI/data/Chinese typography | Browser evidence binds Playwrite NZ Basic / Space Grotesk / Geist Mono / Noto Sans SC to the accepted source. | `VERIFIED` — retain the direct-player-approved Geist Mono data role. |
| C | Responsive Settings, HUD, results, and leaderboards | Evidence `a062799` binds desktop, portrait, short-landscape, four HUDs, two results/leaderboards, Pause, and Leave to source `06bd8b9`; no clipping, overlap, overflow, wrong font role, extra Canvas/DOM cells, console error, or teardown residue is reported. | `VERIFIED` |
| C | Settings tabs: settings, controls, rules | The persisted `tetramorph:reduced-motion:v1 = on|off` preference follows the OS while unset and drives CSS/Pixi together; Controls exposes the implemented gesture contract after the two keyboard groups. | `VERIFIED` |
| D | Classic feedback clarity | Evidence `c83b156` drives a real public-command clear and observes the corresponding score/line update without adding a system. | `VERIFIED` |
| D | Survival 800 ms danger warning plus concise warning sound | Source `fcabe49` owns a 48-playing-tick minimum lead and one 65 ms chirp; evidence shows no rock at tick 47 and the planned rockfall on the next tick. | `VERIFIED` |
| D | Five Mutation abilities recognizable at carrier, activation, and active-state stages | Evidence `c83b156` captures Next, carrier, and activation/active state for Freeze, Supergravity, Bomb, Double, and Reshape; the synchronized Bomb board export contains the real 72-fragment impact. | `VERIFIED` |
| D | Puzzle copy/guidance/visual consistency with frozen boards/order | Current-source evidence preserves the three authored curriculum bands, existing board order, and the accepted technique copy. | `VERIFIED` |
| E | Final gates and clean lifecycle teardown | Source `6af5403` and product-bound evidence `323d01d` retain zero Canvas/RAF, four baseline listeners, one closed AudioContext, and no QA bridge after return Home. Recheck checkpoint `c8ceb70` caps Vitest at two workers after default parallel resource contention caused a setup-hook timeout; the official command then passes `318 passed / 3 skipped`. | `VERIFIED`; test-only checkpoint awaits independent QA. |
| E | Bundle, font, dependency, and unused-asset inspection | Source `4d37d59` emits only 13 required WOFF2 faces, removes 57.6% of font payload, removes proven dead legacy font assets, retains the measured 546.62 kB main warning, and has a clean direct dependency tree plus scoped OSV result. | `VERIFIED` |
| F | Current-source final frames and 30–60 second capture plan | Evidence `6d2255a` binds the six final frames and capture plan to corrected source `85a3431`; its runner imports pinned repository Playwright and releases ports 4191/4192. | `VERIFIED` |
| F | GitHub, resume, portfolio copy and RC Release Notes | README, Showcase, and Release Notes are present; npm metadata and committed lockfile agree on `1.0.0-rc.1`. | `VERIFIED` |
| Final | Independent read-only QA and coordinator acceptance | The portable RC candidate received P0 0 / P1 0 / P2 0 / P3 0. A later full recheck found only the bounded test-worker correction `c8ceb70`; current typecheck, official complete suite, build, lock synchronization, and OSV scan pass without a product-source delta. | `RECHECK QA PENDING` |

## Current bounded slice

Phase F remains closed on the corrected portable `1.0.0-rc.1` candidate. Gameplay,
Puzzle content/order, presentation design, ranking, persistence schemas, and browser
evidence stay frozen. The only open path is the two-worker Vitest cap plus these truthful
status records; independent QA must accept that exact range before coordinator closure.
