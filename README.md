# Driftbox

Driftbox is being rebuilt in `v7-loop-20260623-195154-f683` as a 2D sci-fi Sokoban-variant puzzle game.

## Current status

- The previous v6 2.5D direction is retired from the user-facing mainline.
- The public runtime currently exposes the remaining 2D catalog while v7 is rebuilt.
- The target v7 release is a complete 70-level 2D sci-fi game with new screens, new visual identity, new mechanisms, richer level metadata, replay validation, visual smoke tests, and level/content/UI audits.

The v7 process log is under:

```text
docs/v7-loop/v7-loop-20260623-195154-f683/
```

## Development

```bash
npm install
npm run dev
npm run dev:server
```

## Verification

Current baseline commands:

```bash
npm run typecheck
npm run verify
npm run smoke:api
npm run smoke:ui
npm run build
```

Planned v7 gates:

```bash
npm run smoke:visual
npm run audit:levels
npm run audit:ui
npm run audit:content
```

These planned commands will be added during the v7 loop before final acceptance.
