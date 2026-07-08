# Current Project Status

Status: Stage 4 recursive gameplay kernel implemented and verified after the
Stage 3B simulation core.

The current workspace is runnable as a React/Vite/PixiJS v8 visual-spatial
prototype backed by a deterministic TypeScript recursive gameplay kernel. It
intentionally contains no React gameplay UI, level packs, level editor, menus,
polish UI, large content, or renderer redesign.

## Current Workspace

- Current branch: `main`
- Implementation files in the working tree: Stage 4 recursive gameplay kernel
  plus prior renderer/prototype stages
- Required records in the working tree: present
- Draft approval documents in the working tree:
  - `ARCHITECTURE.md`
  - `DESIGN_REFERENCE.md`
  - `IMPLEMENTATION_PLAN.md`
- Approval status: approved through Stage 4 only
- Local cleanup state: no generated build output retained; dev server stopped

## Preserved Records

- `docs/logs/CHANGELOG.md`
- `docs/reboot/FAILED_ROUND.md`
- `docs/reboot/CURRENT_STATUS.md`

## Do Not Continue

Do not continue future work from:

- `feature/recursive-box-lab`
- `reboot/parabox-worldline-v8-reboot-parabox-worldline-20260624-023038-2a151f`

Those branches represent failed implementation rounds. The next attempt should
start from a fresh plan and should not copy implementation files from either
failed round.

## Current Gate

Do not extend beyond the Stage 4 gameplay kernel into React gameplay UI, level
packs, a level editor, menus, polish UI, large content, renderer redesign, or
Stage 5 work without explicit review.

The current aligned action has been completed as Stage 4:

- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `index.html`
- `src/main.tsx`
- `src/app/GameCanvasHost.tsx`
- `src/runtime/GameRuntime.ts`
- `src/styles/app.css`
- `package-lock.json`
- `docs/screenshots/stage1-canvas.png`
- `src/render/PixiApp.ts`
- `src/render/Camera2D.ts`
- `src/render/layers.ts`
- `src/render/palette.ts`
- `src/render/primitives/worldFrame.ts`
- `src/render/primitives/entityPrimitives.ts`
- `src/projection/types.ts`
- `src/projection/worldProjection.ts`
- `docs/screenshots/stage2-renderer.png`
- `src/animation/TransitionTimeline.ts`
- `src/animation/easing.ts`
- `src/render/RecursiveTransitionRenderer.ts`
- `src/runtime/InteractionPrototype.ts`
- `docs/screenshots/stage3a-enter-transition.png`
- `src/render/materials/worldMaterial.ts`
- `src/render/materials/index.ts`
- `docs/screenshots/stage3a-refined.png`
- `src/core/types.ts`
- `src/core/worldGraph.ts`
- `src/core/components.ts`
- `src/core/commands.ts`
- `src/core/reducer.ts`
- `src/core/movement.ts`
- `src/core/recursiveTransitions.ts`
- `src/core/history.ts`
- `src/core/hash.ts`
- `src/core/win.ts`
- `src/core/core.test.ts`
- `src/projection/simulationProjection.ts`
- `docs/qa/STAGE3B_CORE.md`
- `docs/screenshots/stage3b-core-no-ui.png`
- `docs/recursive-box-lab/GAME_RULES.md`
- `src/core/collision.ts`
- `src/core/movementResolver.ts`
- `src/core/recursiveMovement.ts`
- `src/core/systems.ts`
- `docs/qa/STAGE4_PLAYABLE_CORE.md`
- `docs/screenshots/stage4-playable-core.png`

## Retained For Audit

- `backup/pre-reboot-v8-reboot-parabox-worldline-20260624-023038-2a151f`
- `backup-pre-reboot-v8-reboot-parabox-worldline-20260624-023038-2a151f`

These are historical backup refs only.
