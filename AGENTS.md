# Game-1 Working Agreement

## Active branch boundary

- `codex/tetris` owns the falling-block puzzle implementation.
- `codex/temple-run` is reserved for the endless-runner implementation and must remain unchanged until the Tetris branch is reviewed and pushed.
- Never merge gameplay code between these branches. Shared ideas must be re-evaluated for the target game instead of copied automatically.

## Delivery order

1. Finish, verify, commit, and push the Tetris game.
2. Record the Tetris acceptance evidence.
3. Only then switch to `codex/temple-run` and begin its design contract.

Parallel implementation of the two games is prohibited.

## Product boundary

- This repository contains clean-room studies of game mechanics.
- Do not copy commercial logos, music, fonts, sprites, level layouts, text, or trade dress.
- The Tetris branch uses an original title and visual system while reproducing the familiar falling-block rules.
- Core simulation is deterministic and renderer-independent. PixiJS, React, DOM, audio, storage, and browser timing must not enter `src/game/core`.
- React owns page composition and lifecycle. PixiJS owns the board, pieces, particles, and frame rendering. Do not create a DOM cell grid.

## Quality gates

Every implementation slice must preserve:

- `npm.cmd run typecheck`
- `npm.cmd run test`
- `npm.cmd run build`
- exactly one gameplay canvas
- zero browser console errors
- keyboard and touch-safe controls
- `prefers-reduced-motion` support
- deterministic seeded replay tests
- no listener, ticker, audio, or canvas leaks after restart/unmount

Do not accept a nonblank screenshot as visual proof. Browser evidence must verify the board geometry, visible state, controls, and responsive layout.

## Encoding and file editing

- Use UTF-8 for all source and documentation.
- Prefer `apply_patch` for edits.
- Python scripts that read or write text must specify `encoding="utf-8"`.
- Do not rewrite Chinese-facing files through an implicit Windows PowerShell encoding.

## Git and destructive actions

- Keep changes on the current game branch.
- Do not force-push or rewrite shared history.
- Ordinary verified edits, installs, tests, builds, commits, and pushes do not require confirmation.
- Ask before recursive or wildcard deletion, `git clean`, `git reset --hard`, or deleting sensitive files. Small explicit temporary build artifacts may be removed after their exact path is verified.
