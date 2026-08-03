# T26 Phase F final showcase evidence

This final frame set binds to source
`85a343106125ef78e3f55203d032a635e92b63c1` and Chromium
`149.0.7827.55`. The capture used one short-lived Vite server on
`127.0.0.1:4192` and one headless browser. PID `5944` closed in the runner's
`finally` block; post-run inspection found no listening socket on port 4192.

## Inspected frames

- `home.png` — one centered TetraMorph wordmark, one positioning line, and the
  four mode cards with their distinct color families;
- `classic.png` — a real public-command line clear with score, line, combo,
  fall-speed, board, ghost, and Next feedback visible together;
- `survival-danger.png` — the deterministic 48-tick rockfall warning, source
  column arrow, rising bedrock, current piece, and live Next forecast;
- `mutation-bomb.png` — a real Bomb impact with 72 renderer fragments and the
  post-impact score, board, active carrier treatment, and live Next forecast;
- `puzzle-campaign.png` — the authored board silhouette, selected lesson,
  three curriculum tabs, and Intro level set;
- `settings.png` — one compact active Settings panel with language, sound,
  motion, and run actions while the live board and Next stay mounted.

The six full-page frames were inspected at 1440 x 900. Their automated audit
reports zero clipped labels, wrong data faces, wrong English UI faces,
horizontal overflow, DOM board cells, console errors, or page errors. Game
frames contain exactly one Canvas and a visible Next well; Home and Puzzle use
no gameplay Canvas. Final navigation cleanup leaves zero Canvas, zero DOM board
cells, and no QA global.

## Reproduction

Run the bounded owner script from the repository root:

```powershell
npm.cmd ci
npx.cmd playwright install chromium
node docs/evidence/t26/phase-f/run-phase-f-evidence.mjs
```

The first two commands install the committed dependency graph and pinned Chromium
runtime for a clean clone. The capture script imports the repository-declared
Playwright package, uses deterministic seeds and only the public QA command surface to
reach the Classic clear, Survival warning, and Mutation Bomb impact. It does not inject
a board state or leave a persistent server/browser process.
