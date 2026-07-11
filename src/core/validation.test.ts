import { describe, expect, it } from "vitest";
import { Step } from "./commands";
import { createSimulationSession } from "./history";
import { dispatchPublicCommand } from "./reducer";
import { loadSimulationState } from "./worldGraph";
import type { SimulationState } from "./types";
import { cloneSimulationState, createStage3BSimulationState } from "./worldGraph";
import { validateInitialSimulationState, validateSimulationState } from "./validation";

describe("R1 load validation", () => {
  it("accepts the canonical R1 fixture and rejects malformed identity, components, bounds, occupancy, focus, rules, and port tables", () => {
    expect(loadSimulationState(fixture()).kind).toBe("accepted");
    const mutations: readonly SimulationState[] = [
      { ...fixture(), rootWorldId: "missing" },
      { ...fixture(), components: { ...fixture().components, positions: { ...fixture().components.positions, "box-a": { worldId: "world-a", x: -1, y: 0 } } } },
      withWall(fixture(), "wall", { worldId: "world-a", x: 2, y: 2 }),
      { ...fixture(), activeWorldId: "world-c", focusPath: [] },
      { ...fixture(), ruleSet: { ...fixture().ruleSet, interactionPriority: ["push", "push"] as never } },
      { ...fixture(), portTables: [] },
    ];
    for (const invalid of mutations) {
      expect(loadSimulationState(invalid).kind).toBe("rejected");
    }
  });

  it("rejects every R1 port uniqueness, inverse, bounds, and occupancy branch", () => {
    const base = fixture();
    const mutations = [
      [{ id: "same", outerApproach: "down" as const, innerLanding: { x: 2, y: 2 }, innerExit: "up" as const }, { id: "same", outerApproach: "up" as const, innerLanding: { x: 3, y: 2 }, innerExit: "down" as const }],
      [{ id: "wrong", outerApproach: "down" as const, innerLanding: { x: 2, y: 2 }, innerExit: "down" as const }],
      [{ id: "outside", outerApproach: "down" as const, innerLanding: { x: 99, y: 2 }, innerExit: "up" as const }],
      [
        { id: "one", outerApproach: "down" as const, innerLanding: { x: 2, y: 2 }, innerExit: "up" as const },
        { id: "two", outerApproach: "up" as const, innerLanding: { x: 2, y: 2 }, innerExit: "down" as const },
      ],
    ];
    for (const ports of mutations) {
      expect(loadSimulationState({ ...base, portTables: [{ containerId: "container-b", ports }] }).kind).toBe("rejected");
    }
    const occupied = withPositions(base, { "box-c": { worldId: "world-c", x: 2, y: 2 } });
    expect(loadSimulationState(occupied).kind).toBe("rejected");
  });

  it("is total for untrusted load input and distinguishes initial from runtime landing occupancy", () => {
    const base = fixture();
    for (const malformed of [undefined, null, {}, { ...base, ruleSet: undefined }, { ...base, portTables: {} }, { ...base, worlds: [] }, { ...base, entities: [] }, { ...base, components: {} }]) {
      expect(() => loadSimulationState(malformed)).not.toThrow();
      expect(loadSimulationState(malformed).kind).toBe("rejected");
    }
    expect(loadSimulationState(createStage3BSimulationState()).kind).toBe("accepted");

    const entered: SimulationState = {
      ...base,
      activeWorldId: "world-c",
      focusPath: ["container-b"],
      components: { ...base.components, positions: { ...base.components.positions, "player-a": { worldId: "world-c", x: 2, y: 2 } } },
    };
    expect(validateSimulationState(entered).kind).toBe("valid");
    expect(validateInitialSimulationState(entered).kind).toBe("invalid");
    expect(loadSimulationState(entered).kind).toBe("rejected");

    const unrelated: SimulationState = {
      ...entered,
      entities: { ...entered.entities, "container-d": { id: "container-d" } },
      components: {
        ...entered.components,
        positions: { ...entered.components.positions, "player-a": { worldId: "world-c", x: 3, y: 2 }, "container-d": { worldId: "world-a", x: 7, y: 4 } },
        containers: { ...entered.components.containers, "container-d": { innerWorldId: "world-c" } },
        solids: { ...entered.components.solids, "container-d": { blocksMovement: true } },
      },
      portTables: [...entered.portTables, { containerId: "container-d", ports: [{ id: "unrelated", outerApproach: "down", innerLanding: { x: 3, y: 2 }, innerExit: "up" }] }],
    };
    expect(validateSimulationState(unrelated).kind).toBe("valid");
  });

  it("keeps initial landings empty but permits runtime occupancy so port selection reports it", () => {
    const base = withPositions(fixture(), { "player-a": { worldId: "world-a", x: 5, y: 3 }, "box-c": { worldId: "world-c", x: 2, y: 2 } });
    expect(validateInitialSimulationState(base).kind).toBe("invalid");
    expect(validateSimulationState(base).kind).toBe("valid");
    const entry = dispatchPublicCommand(createSimulationSession(base), Step("down"));
    expect(entry.result).toMatchObject({ kind: "rejected", rejection: { code: "port-landing-occupied" } });

    const focused: SimulationState = {
      ...fixture(),
      activeWorldId: "world-c",
      focusPath: ["container-b"],
      components: { ...fixture().components, positions: { ...fixture().components.positions, "player-a": { worldId: "world-c", x: 2, y: 4 }, "box-c": { worldId: "world-c", x: 2, y: 3 } } },
    };
    const pushed = dispatchPublicCommand(createSimulationSession(focused), Step("up"));
    expect(pushed.result).toMatchObject({ kind: "accepted", transaction: { rule: "push" } });
    expect(pushed.session.present.components.positions["box-c"]).toEqual({ worldId: "world-c", x: 2, y: 2 });
    const laterEntry = dispatchPublicCommand(createSimulationSession({ ...fixture(), components: { ...fixture().components, positions: { ...fixture().components.positions, "player-a": { worldId: "world-a", x: 5, y: 3 }, "box-c": { worldId: "world-c", x: 2, y: 2 } } } }), Step("down"));
    expect(laterEntry.result).toMatchObject({ kind: "rejected", rejection: { code: "port-landing-occupied" } });
  });

  it("isolates table, direction, world, and global-landing validation branches", () => {
    const base = fixture();
    const ports = base.portTables[0]!.ports;
    const cases: readonly SimulationState[] = [
      { ...base, portTables: [...base.portTables, { containerId: "container-b", ports }] },
      { ...base, portTables: [{ containerId: "unknown", ports }] },
      { ...base, portTables: [{ containerId: "container-b", ports: [{ ...ports[0]!, outerApproach: "sideways" as never }] }] },
      { ...base, portTables: [{ containerId: "container-b", ports: [{ ...ports[0]!, innerExit: "sideways" as never }] }] },
      { ...base, portTables: [{ containerId: "container-b", ports: [{ ...ports[0]!, innerLanding: { x: 1.5, y: 2 } }] }] },
      { ...base, components: { ...base.components, containers: { ...base.components.containers, "container-b": { innerWorldId: "missing" } } } },
    ];
    for (const value of cases) expect(loadSimulationState(value).kind).toBe("rejected");

    const duplicateLanding = addContainer(base, "alias", "world-a", "world-c", { x: 7, y: 4 });
    expect(loadSimulationState({ ...duplicateLanding, portTables: [...base.portTables, { containerId: "alias", ports } ] }).kind).toBe("rejected");
  });

  it("requires complete, exact enablement and priority coverage including every mask", () => {
    const base = fixture();
    for (let mask = 0; mask < 8; mask += 1) {
      const enabled = (["push", "enter", "exit"] as const).filter((_, index) => (mask & (1 << index)) !== 0);
      const valid = { ...base, ruleSet: { ...base.ruleSet, ruleEnablement: {
        push: enabled.includes("push") ? "enabled" as const : "disabled" as const,
        enter: enabled.includes("enter") ? "enabled" as const : "disabled" as const,
        exit: enabled.includes("exit") ? "enabled" as const : "disabled" as const,
      }, interactionPriority: enabled } };
      expect(validateSimulationState(valid).kind).toBe("valid");
    }
    expect(validateSimulationState({ ...base, ruleSet: { ...base.ruleSet, ruleEnablement: { push: "enabled", enter: "enabled" } as never } }).kind).toBe("invalid");
    expect(validateSimulationState({ ...base, ruleSet: { ...base.ruleSet, interactionPriority: ["push", "enter"] } }).kind).toBe("invalid");
    expect(validateSimulationState({ ...base, ruleSet: { ...base.ruleSet, interactionPriority: ["push", "enter", "exit", "push"] as never } }).kind).toBe("invalid");
  });

  it("returns stable exact diagnostics for malformed scalar, component, and rule payloads", () => {
    const base = fixture();
    const cases: readonly { readonly input: unknown; readonly message: string }[] = [
      { input: { ...base, focusPath: {} }, message: "missing or malformed focusPath" },
      { input: { ...base, components: { ...base.components, positions: undefined } }, message: "missing or malformed components.positions" },
      { input: { ...base, version: 2 }, message: "simulation version must equal 1" },
      { input: { ...base, worlds: { ...base.worlds, "world-a": { ...base.worlds["world-a"]!, id: 7 } } }, message: "world world-a has an inconsistent id" },
      { input: { ...base, worlds: { ...base.worlds, "world-a": { ...base.worlds["world-a"]!, size: { width: 0, height: 8 } } } }, message: "world world-a has an invalid size" },
      { input: { ...base, entities: { ...base.entities, "box-a": { id: "other" } } }, message: "entity box-a has an inconsistent id" },
      { input: { ...base, components: { ...base.components, positions: { ...base.components.positions, "box-a": { worldId: 3, x: 0, y: 0 } } } }, message: "position for box-a is malformed" },
      { input: { ...base, components: { ...base.components, solids: { ...base.components.solids, "box-a": { blocksMovement: false } } } }, message: "solid box-a must set blocksMovement to true" },
      { input: { ...base, components: { ...base.components, players: { ...base.components.players, "player-a": { controlled: false } } } }, message: "player player-a must set controlled to true" },
      { input: { ...base, components: { ...base.components, containers: { ...base.components.containers, "container-b": { innerWorldId: "world-c" } }, solids: { ...base.components.solids, "container-b": { blocksMovement: false } } } }, message: "container container-b must be solid" },
      { input: { ...base, ruleSet: { ...base.ruleSet, version: 2 } }, message: "rule set version must equal 1" },
      { input: { ...base, ruleSet: { ...base.ruleSet, cycleMode: "allow" } }, message: "rule set cycleMode must equal forbid" },
      { input: { ...base, ruleSet: { ...base.ruleSet, ruleEnablement: { ...base.ruleSet.ruleEnablement, push: "maybe" } } }, message: "rule enablement push has an unknown value" },
      { input: { ...base, ruleSet: { ...base.ruleSet, ruleEnablement: { ...base.ruleSet.ruleEnablement, mystery: "enabled" } } }, message: "rule enablement does not cover the complete R1 rule set" },
      { input: { ...base, portTables: [{ containerId: "container-b", ports: [{ id: "p", outerApproach: "down", innerExit: "up", innerLanding: { x: 1.5, y: 2 } }] }] }, message: "port container-b/p landing is out of bounds" },
    ];
    for (const entry of cases) {
      const result = validateSimulationState(entry.input);
      expect(result).toMatchObject({ kind: "invalid" });
      if (result.kind === "invalid") expect(result.diagnostics).toContainEqual({ code: "invalid-level-data", message: entry.message });
    }
  });

  it("sorts table and port diagnostics before validation", () => {
    const base = fixture();
    const tables = [
      { containerId: "container-b", ports: [{ id: "z", outerApproach: "down" as const, innerExit: "down" as const, innerLanding: { x: 2, y: 2 } }, { id: "a", outerApproach: "down" as const, innerExit: "up" as const, innerLanding: { x: 3, y: 2 } }] },
      { containerId: "container-b", ports: [] },
    ];
    const left = loadSimulationState({ ...base, portTables: tables });
    const right = loadSimulationState({ ...base, portTables: [...tables].reverse().map((table) => ({ ...table, ports: [...table.ports].reverse() })) });
    expect(left).toEqual(right);
  });

  it("finds self, two-world, three-world, and unreachable graph cycles with insertion-order-independent witnesses", () => {
    expect(cycleDiagnostics(addContainer(fixture(), "self", "world-a", "world-a", { x: 7, y: 6 }))).toContain("self");
    const two = addContainer(addContainer(fixture(), "left", "world-c", "world-a", { x: 3, y: 3 }), "right", "world-a", "world-c", { x: 7, y: 6 });
    expect(cycleDiagnostics(two)).toEqual(expect.arrayContaining(["container-b", "left"]));
    const threeBase = addWorld(fixture(), "world-d");
    const three = addContainer(addContainer(threeBase, "first", "world-c", "world-d", { x: 3, y: 3 }), "last", "world-d", "world-a", { x: 2, y: 2 });
    expect(cycleDiagnostics(three)).toEqual(expect.arrayContaining(["container-b", "first", "last"]));
    const disconnected = addWorld(addWorld(fixture(), "world-x"), "world-y");
    const unreachable = addContainer(addContainer(disconnected, "x-to-y", "world-x", "world-y", { x: 1, y: 1 }), "y-to-x", "world-y", "world-x", { x: 1, y: 1 });
    expect(cycleDiagnostics(unreachable)).toEqual(expect.arrayContaining(["x-to-y", "y-to-x"]));

    const forward = addContainer(addContainer(fixture(), "z", "world-c", "world-a", { x: 3, y: 3 }), "a", "world-a", "world-c", { x: 7, y: 6 });
    const reverse = addContainer(addContainer(fixture(), "a", "world-a", "world-c", { x: 7, y: 6 }), "z", "world-c", "world-a", { x: 3, y: 3 });
    expect(cycleDiagnostics(forward)).toEqual(cycleDiagnostics(reverse));
  });

  it("reports only the gray-edge cycle suffix and rejects cycle/invalid graph data before dispatch", () => {
    const withD = addWorld(fixture(), "world-d");
    const prefix = addContainer(withD, "b-to-c", "world-c", "world-d", { x: 3, y: 3 });
    const loop = addContainer(prefix, "c-to-b", "world-d", "world-c", { x: 3, y: 3 });
    expect(cycleDiagnostics(loop)).toEqual(["b-to-c", "c-to-b"]);
    expect(loadSimulationState({ ...fixture(), components: { ...fixture().components, containers: { ...fixture().components.containers, "container-b": { innerWorldId: "missing" } } } }).kind).toBe("rejected");
    expect(loadSimulationState({ ...fixture(), components: { ...fixture().components, containers: { ...fixture().components.containers, "container-b": { ...fixture().components.containers["container-b"]!, allowsRecursiveCycle: true } as never } } }).kind).toBe("rejected");
  });
});

function fixture(): SimulationState {
  return cloneSimulationState(createStage3BSimulationState());
}

function withPositions(state: SimulationState, positions: Readonly<Record<string, { readonly worldId: string; readonly x: number; readonly y: number }>>): SimulationState {
  return { ...state, components: { ...state.components, positions: { ...state.components.positions, ...positions } } };
}

function withWall(state: SimulationState, id: string, position: { readonly worldId: string; readonly x: number; readonly y: number }): SimulationState {
  return {
    ...state,
    entities: { ...state.entities, [id]: { id } },
    components: { ...state.components, positions: { ...state.components.positions, [id]: position }, solids: { ...state.components.solids, [id]: { blocksMovement: true } } },
  };
}

function addWorld(state: SimulationState, id: string): SimulationState {
  return { ...state, worlds: { ...state.worlds, [id]: { id, paletteId: "inner-mint", size: { width: 5, height: 5 } } } };
}

function addContainer(state: SimulationState, id: string, parent: string, inner: string, position: { readonly x: number; readonly y: number }): SimulationState {
  return {
    ...state,
    entities: { ...state.entities, [id]: { id } },
    components: {
      ...state.components,
      positions: { ...state.components.positions, [id]: { worldId: parent, ...position } },
      containers: { ...state.components.containers, [id]: { innerWorldId: inner } },
      solids: { ...state.components.solids, [id]: { blocksMovement: true } },
    },
    portTables: [...state.portTables, { containerId: id, ports: [] }],
  };
}

function cycleDiagnostics(state: SimulationState): readonly string[] {
  const result = validateSimulationState(state);
  if (result.kind !== "invalid") return [];
  return result.diagnostics.filter((entry) => entry.code === "cycle-forbidden").flatMap((entry) => entry.witness ?? []);
}
