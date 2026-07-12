import { describe, expect, it } from "vitest";
import { createStage3BSimulationState } from "../core/worldGraph";
import { createProjectionFromSimulationState } from "./simulationProjection";

describe("simulation projection handoff", () => {
  it("projects the injected simulation snapshot with a complete root-plus-path address", () => {
    const projection = createProjectionFromSimulationState(createStage3BSimulationState());
    const recursiveContainer = projection.entities.find((entity) => entity.occurrence.entityId === "container-b");
    const player = projection.entities.find((entity) => entity.occurrence.entityId === "player-a");

    expect(projection.address).toEqual({ rootWorldId: "world-a", containerPath: [] });
    expect(projection.activeAddress).toEqual({ rootWorldId: "world-a", containerPath: [] });
    expect(projection.projectionId).toBe('["world-a"]');
    expect(player?.occurrence).toEqual({ world: projection.address, entityId: "player-a" });
    expect(recursiveContainer?.childWorld?.address).toEqual({ rootWorldId: "world-a", containerPath: ["container-b"] });
  });

  it("copies canonical focus into every recursive projection rather than inferring it from draw order", () => {
    const base = createStage3BSimulationState();
    const focused = { ...base, activeWorldId: "world-c", focusPath: ["container-b"] };
    const projection = createProjectionFromSimulationState(focused);
    const child = projection.entities.find((entity) => entity.occurrence.entityId === "container-b")?.childWorld;
    expect(projection.activeAddress).toEqual({ rootWorldId: "world-a", containerPath: ["container-b"] });
    expect(child?.activeAddress).toEqual(projection.activeAddress);
  });
});
