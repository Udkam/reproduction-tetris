import { describe, expect, it } from "vitest";
import { Step } from "./commands";
import { createSimulationSession } from "./history";
import { selectEntryPort, selectExitPort } from "./ports";
import { dispatchPublicCommand } from "./reducer";
import type { SimulationState } from "./types";
import { cloneSimulationState, createStage3BSimulationState } from "./worldGraph";

describe("R1 port selection", () => {
  it("selects a center-anchor entry by exact direction and produces addressed values", () => {
    const state = withPositions(fixture(), { "player-a": { worldId: "world-a", x: 5, y: 3 } });
    const selected = selectEntryPort(state, "player-a", state.components.positions["player-a"]!, "down");
    expect(selected).toMatchObject({
      kind: "selected",
      containerId: "container-b",
      portAddress: { container: { world: { rootWorldId: "world-a", containerPath: [] }, entityId: "container-b" }, portId: "port-b-south" },
      from: { world: { rootWorldId: "world-a", containerPath: [] }, x: 5, y: 3 },
      to: { world: { rootWorldId: "world-a", containerPath: ["container-b"] }, x: 2, y: 2 },
    });
  });

  it("rejects wrong-side, missing, ambiguous, and occupied entry mappings without selection heuristics", () => {
    const base = withPositions(fixture(), { "player-a": { worldId: "world-a", x: 5, y: 3 } });
    const wrongSide = withPositions(base, { "player-a": { worldId: "world-a", x: 4, y: 4 } });
    const wrong = selectEntryPort(wrongSide, "player-a", wrongSide.components.positions["player-a"]!, "right");
    expect(wrong).toMatchObject({ kind: "blocked", rejection: { code: "port-absent" } });

    const absent = { ...base, portTables: [{ containerId: "container-b", ports: [] }] };
    expect(selectEntryPort(absent, "player-a", absent.components.positions["player-a"]!, "down")).toMatchObject({ kind: "blocked", rejection: { code: "port-absent" } });

    const duplicated = {
      ...base,
      portTables: [{ containerId: "container-b", ports: [
        ...base.portTables[0]!.ports,
        { id: "duplicate", outerApproach: "down" as const, innerLanding: { x: 3, y: 2 }, innerExit: "up" as const },
      ] }],
    };
    expect(selectEntryPort(duplicated, "player-a", duplicated.components.positions["player-a"]!, "down")).toMatchObject({ kind: "blocked", rejection: { code: "port-ambiguous" } });
    const invalidDispatch = dispatchPublicCommand(createSimulationSession(duplicated), Step("down"));
    expect(invalidDispatch.result).toMatchObject({ kind: "rejected", rejection: { code: "invalid-level-data" } });

    const occupied = withPositions(base, { "box-c": { worldId: "world-c", x: 2, y: 2 } });
    expect(selectEntryPort(occupied, "player-a", occupied.components.positions["player-a"]!, "down")).toMatchObject({ kind: "blocked", rejection: { code: "port-landing-occupied" } });
  });

  it("uses the focused container occurrence for aliased inner worlds", () => {
    const base = fixture();
    const alias: SimulationState = {
      ...base,
      activeWorldId: "world-c",
      focusPath: ["container-d"],
      entities: { ...base.entities, "container-d": { id: "container-d" } },
      components: {
        ...base.components,
        positions: {
          ...base.components.positions,
          "player-a": { worldId: "world-c", x: 3, y: 2 },
          "container-d": { worldId: "world-a", x: 7, y: 4 },
        },
        containers: { ...base.components.containers, "container-d": { innerWorldId: "world-c" } },
        solids: { ...base.components.solids, "container-d": { blocksMovement: true } },
      },
      portTables: [
        ...base.portTables,
        { containerId: "container-d", ports: [{ id: "alias", outerApproach: "left", innerLanding: { x: 3, y: 2 }, innerExit: "right" }] },
      ],
    };
    const selected = selectExitPort(alias, "player-a", alias.components.positions["player-a"]!, "right");
    expect(selected).toMatchObject({
      kind: "selected",
      containerId: "container-d",
      portAddress: { container: { world: { rootWorldId: "world-a", containerPath: [] }, entityId: "container-d" }, portId: "alias" },
      actorBefore: { world: { rootWorldId: "world-a", containerPath: ["container-d"] }, entityId: "player-a" },
    });
  });

  it("covers exit no-focus, non-landing, wrong-direction, ambiguity, parent occupancy, bounds, and invalid focus defensively", () => {
    const base = fixture();
    const noFocus = selectExitPort(base, "player-a", base.components.positions["player-a"]!, "up");
    expect(noFocus).toEqual({ kind: "not-applicable" });

    const focused = focusedState(base, { x: 2, y: 2 });
    const nonLanding = focusedState(base, { x: 1, y: 2 });
    expect(selectExitPort(nonLanding, "player-a", nonLanding.components.positions["player-a"]!, "up")).toEqual({ kind: "not-applicable" });
    expect(selectExitPort(focused, "player-a", focused.components.positions["player-a"]!, "right")).toMatchObject({ kind: "blocked", rejection: { code: "port-absent" } });

    const ambiguous = { ...focused, portTables: [{ containerId: "container-b", ports: [
      ...focused.portTables[0]!.ports,
      { id: "duplicate", outerApproach: "up" as const, innerLanding: { x: 2, y: 2 }, innerExit: "up" as const },
    ] }] };
    expect(selectExitPort(ambiguous, "player-a", ambiguous.components.positions["player-a"]!, "up")).toMatchObject({ kind: "blocked", rejection: { code: "port-ambiguous" } });

    const occupied = withPositions(focused, { "box-a": { worldId: "world-a", x: 5, y: 3 } });
    expect(selectExitPort(occupied, "player-a", occupied.components.positions["player-a"]!, "up")).toMatchObject({ kind: "blocked", rejection: { code: "port-parent-destination-occupied" } });

    const atEdge = withPositions(focused, { "container-b": { worldId: "world-a", x: 5, y: 0 } });
    expect(selectExitPort(atEdge, "player-a", atEdge.components.positions["player-a"]!, "up")).toMatchObject({ kind: "blocked", rejection: { code: "port-parent-destination-out-of-bounds" } });

    const invalid = { ...focused, focusPath: ["missing"] };
    expect(selectExitPort(invalid, "player-a", invalid.components.positions["player-a"]!, "up")).toMatchObject({ kind: "blocked", rejection: { code: "invalid-level-data" } });
  });
});

function fixture(): SimulationState {
  return cloneSimulationState(createStage3BSimulationState());
}

function withPositions(state: SimulationState, positions: Readonly<Record<string, { readonly worldId: string; readonly x: number; readonly y: number }>>): SimulationState {
  return { ...state, components: { ...state.components, positions: { ...state.components.positions, ...positions } } };
}

function focusedState(base: SimulationState, position: { readonly x: number; readonly y: number }): SimulationState {
  return {
    ...base,
    activeWorldId: "world-c",
    focusPath: ["container-b"],
    components: { ...base.components, positions: { ...base.components.positions, "player-a": { worldId: "world-c", ...position } } },
  };
}
