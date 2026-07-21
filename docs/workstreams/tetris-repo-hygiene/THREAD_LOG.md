# Repository Hygiene Workstream Log

## 2026-07-22 — TETRIS-REPO-HYGIENE-001 local artifact classification

- Base: `969825b`. Scope is restricted to root-level local-artifact routing and its
  documentation; no product source, test, build, or formal QA evidence changes.
- Tracked paths: `.gitignore`, `README.md`, `docs/PROJECT_STRUCTURE.md`, and this log.
  Local-only moves: seventeen ignored root screenshots into
  `.local/audits/legacy-root/` and the ignored root `debug.log` into `.local/logs/`.
- Evidence: root audit confirmed `src/`, `docs/`, `scripts/`, and `tools/` are already
  correctly separated; the loose captures and log are ignored by existing root rules.
  The new `.local/` and `output/` rules make that local-only boundary reproducible.
  Exact non-recursive moves leave zero matching screenshots or logs at the root; the
  archive contains 17 screenshots and one log. `git check-ignore` confirms the
  archived captures, log, `output/web-game/`, and `Solutions/` all remain local-only.
- Blocker: none. Next: commit the documentation-only hygiene checkpoint and publish it
  with the existing user authorization for recoverable updates.
