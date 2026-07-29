# T15 Phase 6 gate evidence

This directory binds the one final source gate sequence to product candidate
`eaed1ac0962ba7256b44136f7bd4f0faef603970`.

- `typecheck.txt` records the final TypeScript project check.
- `test.txt` records the complete one-worker Vitest run: 26 files and 231 tests.
- `build.txt` records the production build: 753 transformed modules.
- `phase6-gate-evidence.json` binds commands, results, commits, and file hashes.
- `SHA256SUMS-gates.txt` contains hashes of the normalized raw logs.

The raw logs were first committed at `55e5a7b`. A follow-up evidence-only correction
`fb9ccc2` removed one Vite-emitted trailing space and two final blank lines after
`git diff --check` exposed them. No product source changed and the gate commands were
not repeated. Browser evidence and its checksums are recorded separately after this
gate checkpoint.
