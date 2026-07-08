import { describe, expect, it } from "vitest";
import { createStage3BSimulationState } from "../core/worldGraph";
import { createProjectionFromSimulationState } from "./simulationProjection";

describe("simulation projection handoff", () => {
  it("projects a simulation snapshot for the existing renderer", () => {
    const projection = createProjectionFromSimulationState(createStage3BSimulationState());
    const recursiveContainer = projection.entities.find((entity) => entity.entity.id === "container-b");

    expect(projection.world.id).toBe("world-a");
    expect(recursiveContainer?.childWorld?.world.id).toBe("world-c");
  });
});
