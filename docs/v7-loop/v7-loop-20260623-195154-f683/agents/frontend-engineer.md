# Agent Log: frontend-engineer

Agent: frontend-engineer
Task clarity: clear
Capability fit: good
Questions needed: none
Assumptions: keep the plain TypeScript DOM stack unless the existing app becomes harder to maintain than replacing it.
Proceed decision: proceed

## Responsibility

Own UI shell, routes, board rendering, transitions, responsive layout, and visual smoke hooks.

## Decisions made

- Retire user-facing `IsoRenderer` path.
- Keep server and engine APIs as the source of truth for level/replay data.
- Add DOM landmarks/classes for `audit:ui`.
- Stage 2 removed the visible dev demo entry and runtime 3D catalog exposure.

## Files touched

- `src/web/ui.ts`
- `src/engine/levels.ts`
- `README.md`
- `claude.md`
- `package.json`
- Stage docs and `codex.md`

## Risks

- Current `src/web/ui.ts` is too large and mixes routing, input, rendering, modals, and camera behavior.

## Review notes

- Split by screen/component enough to keep v7 maintainable.
- Stage 2 leaves old 2.5D code unused as history. Later stages should remove or archive it when the v7 shell replaces the legacy UI.

## Next handoff

- Engine and art deliver data/state contracts; frontend wires screens and renderer.
