# TETRIS-T18 Phase 11 browser evidence

- Candidate source: `12fb0ae0b6e373ff856ca48d0187485232c4db99`
- Capture date: 2026-08-01
- Method: one bounded Vite server and one headless Chromium instance, driven through visible controls plus the public development QA command surface. No state replacement or fabricated terminal state was used.
- Resource closure: Chromium closed, the owned Vite process tree terminated, and TCP port 5178 released.

## Accepted observations

- Home: Chinese desktop and English short-landscape layouts have complete card borders, no left accent rails, no overflow, and no persistent pointer highlight after the cursor leaves the mode surface.
- Settings and exit: the four Settings sections retain their hierarchy; the English short-landscape panel has no clipped text and its leaderboard is reachable through the panel's internal scroll. The exit dialog defaults to **返回首页**, and the Next preview remains visible behind it.
- Survival: the three-row entry rise is staged before play; the bedrock is one continuous irregular basalt shelf rather than tiled cells; deterministic one- and two-stone events use irregular boulder silhouettes, with the two-stone event sharing one column.
- Mutation: carrier styling remains visible in Next. Ice, Supergravity, and Bomb were additionally captured in isolated deterministic runs. Ice uses a continuous upper gradient with no scan bands; Supergravity uses distributed pressure traces and a per-column landing projection; Bomb uses a radial impact and fragments rather than a 3×10 range rectangle.
- Puzzle: the two-page 25-level library is visible without page scrolling. Three board states across desktop, portrait, and short landscape each expose four deterministic board metrics and two queue-role cues; the samples produce two distinct strategy messages.
- Rendering and responsiveness: gameplay captures contain exactly one canvas and zero DOM game cells, with no browser console or page errors in the asserted paths.

## Final gates

- Typecheck: passed.
- Tests: 31 files, 288 tests passed with one worker and file parallelism disabled.
- Production build: passed; 758 modules transformed. The existing bundle-size advisory remains non-blocking.

`browser-evidence.json` contains the machine-readable assertions and `MANIFEST.sha256` binds every evidence file by SHA-256.
