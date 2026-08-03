# TetraMorph v1.0 Release Candidate Plan

Status: complete 2026-08-03. Phases A-F are verified on corrected source `85a3431` and
evidence `6d2255a`. Final independent read-only QA accepted synchronization `d700ca3`
with P0 0 / P1 0 / P2 0 / P3 0. `docs/CURRENT_TASK.md` records the accepted disposition;
this file owns the completed ordered programme.

## Product guardrails

- Preserve the deterministic Core, PixiJS renderer boundary, one gameplay canvas, four
  modes, local-only persistence, replay system, and procedural audio.
- Do not add a fifth mode, online leaderboard, account, cloud save, server dependency,
  large story system, growth tree, or broad architecture rewrite.
- Accept a change only when it improves onboarding, showcase value, or maintenance.

## Phase A — project cleanup

- Replace active Signal Foundry identity with TetraMorph in package metadata, README,
  QA globals, active storage keys, comments, and visible copy.
- Preserve every historic storage key as a tested one-way migration source.
- Publish a concise README with Features, Technical Highlights, Controls, Development,
  and Screenshots.

## Phase B — first experience

- Keep the four-mode Home and add no more than the wordmark plus the positioning line
  `Transform the way blocks fall.` / `重新定义下落方块`.
- Rewrite each first-entry sheet into Goal / Mechanic / Challenge, under 100 Chinese
  characters for the mode body.
- Present the entry sequence as `3`, `2`, `1`, `Start` without delaying control beyond
  the existing countdown contract.

Verified checkpoint: product `2198b92`, evidence `96b8854`. English desktop, Chinese
narrow, English reduced-motion short-landscape, countdown, and Start frames pass with
zero clipping, overflow, browser errors, extra Canvas, or DOM board cells. The Start
frame already exposes the live Next forecast, and all four mode mechanics remain
unchanged.

## Phase C — final UI system

- Brand: Playwrite NZ Basic. UI: Space Grotesk. Data: Geist Mono. Chinese: Noto Sans SC.
- Audit Settings, HUD, results, and leaderboards for overlap, undersized copy, truncation,
  and structural whitespace at supported desktop, portrait, and short-landscape sizes.
- Recompose Settings into three tabs: Settings (language, SFX, volume, reduced motion),
  Controls (keyboard, touch), and Rules (current rules, leaderboard).

Verified correction checkpoint: product `310d83a`, evidence `32b4457`. The accepted
implementation uses Playwrite NZ Basic only for the wordmark, Space Grotesk for English
UI, Geist Mono for data, and Noto Sans SC for Chinese UI; it also proves responsive
Settings tabs and Pause-time Back/Settings pointer reachability. This checkpoint does
not close Phase B or the complete release candidate.

Verified phase checkpoint: final product source `06bd8b9`, evidence `a062799`. The
persisted OS-aware motion preference, touch guidance, responsive Settings/HUD/result/
leaderboard matrix, Pause-time top actions, visible live Next, and responsive Pixi
backing geometry all pass current-source browser proof. This closes Phase C only.

## Phase D — bounded mode polish

- Classic: verify score, fall speed, and combo feedback; add no system.
- Survival: preserve pressure/rock rules; make the existing danger column obvious for
  800 ms before entry and pair it with a concise warning sound.
- Mutation: preserve the existing five abilities; improve carrier recognition,
  activation, and state feedback so the first activation is a showcase moment.
- Puzzle: keep boards and order; change only copy, guidance, and visual consistency.

## Phase E — engineering closure

- Run final typecheck, complete tests, and production build.
- Prove zero browser console errors, deterministic replay, and clean Pixi, listener,
  timer, animation-frame, and AudioContext teardown after restart and unmount.
- Inspect bundle composition, font size, dependencies, and unused assets without trading
  maintainability for marginal compression.

## Phase F — showcase package

- Capture source-bound final frames for Home, Classic, Survival danger, Mutation effect,
  Puzzle campaign, and Settings.
- Prepare a 30–60 second capture sequence: logo, normal play, Mutation peak, four modes.
- Publish concise GitHub, resume, and portfolio descriptions plus RC Release Notes.

## Final acceptance

The release report must include changed files, tests, build, performance/lifecycle
results, inspected screenshots, and Release Notes. Only after independent read-only QA
and coordinator acceptance may the project be called `TetraMorph v1.0 Release Candidate`.

Correction gate: version both npm metadata files as `1.0.0-rc.1`, declare and pin the
Playwright evidence dependency in-repository, remove personal absolute paths from the
active evidence toolchain, regenerate Phase-E/Phase-F proof, rerun every release gate,
and synchronize all status documents before requesting the second QA decision.

Accepted: every correction gate passed, and final read-only QA reported no P0-P3
finding on `d700ca3`.
