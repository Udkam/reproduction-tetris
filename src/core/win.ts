import type { SimulationState } from "./types";
import { getEntitiesInWorld } from "./worldGraph";

export function isWinSatisfied(state: SimulationState): boolean {
  const goalEntries = Object.entries(state.components.goals);
  if (goalEntries.length === 0) {
    return false;
  }

  return goalEntries.every(([goalEntityId, goal]) => {
    const goalPosition = state.components.positions[goalEntityId];
    if (!goalPosition) {
      return false;
    }
    const candidates = getEntitiesInWorld(state, goalPosition.worldId).filter((entity) => {
      const position = state.components.positions[entity.id];
      return position?.x === goalPosition.x && position.y === goalPosition.y && !state.components.goals[entity.id];
    });
    return candidates.some((entity) => !goal.acceptsVisualKind || state.components.visuals[entity.id]?.kind === goal.acceptsVisualKind);
  });
}
