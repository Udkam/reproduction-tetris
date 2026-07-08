import { describe, expect, it } from "vitest";
import { Enter, Exit } from "./commands";
import { getContainerComponent, getPosition } from "./components";
import { hashState } from "./hash";
import { createSimulationSession } from "./history";
import { dispatchCommand } from "./reducer";
import type { SimulationState } from "./types";
import { createSimulationState, createStage3BSimulationState, getEntitiesInWorld, getEntity } from "./worldGraph";

describe("Stage 3B simulation core", () => {
  it("creates a canonical world graph", () => {
    const state = createStage3BSimulationState();

    expect(state.rootWorldId).toBe("world-a");
    expect(state.activeWorldId).toBe("world-a");
    expect(Object.keys(state.worlds).sort()).toEqual(["world-a", "world-c"]);
    expect(getEntitiesInWorld(state, "world-a").map((entity) => entity.id)).toEqual([
      "box-a",
      "container-b",
      "goal-a",
      "player-a",
    ]);
  });

  it("looks up entities and positions without renderer state", () => {
    const state = createStage3BSimulationState();

    expect(getEntity(state, "player-a")).toEqual({ id: "player-a" });
    expect(getPosition(state, "player-a")).toEqual({ worldId: "world-a", x: 2, y: 2 });
    expect(state).not.toHaveProperty("camera");
    expect(state).not.toHaveProperty("pixi");
  });

  it("stores container relationships as graph references", () => {
    const state = createStage3BSimulationState();

    expect(getContainerComponent(state, "container-b")).toMatchObject({
      innerWorldId: "world-c",
      allowsRecursiveCycle: false,
    });
  });

  it("enters a recursive container through a command", () => {
    const session = createSimulationSession(createStage3BSimulationState());
    const result = dispatchCommand(session, Enter("container-b"));

    expect(result.accepted).toBe(true);
    expect(result.session.present.activeWorldId).toBe("world-c");
    expect(result.session.present.focusPath).toEqual(["container-b"]);
    expect(getPosition(result.session.present, "player-a")).toEqual({ worldId: "world-c", x: 2, y: 2 });
    expect(result.session.history.past[0].previousStateHash).toBe(hashState(session.present));
    expect(result.session.history.past[0].nextStateHash).toBe(hashState(result.session.present));
  });

  it("exits through the active parent container command", () => {
    const session = createSimulationSession(createStage3BSimulationState());
    const entered = dispatchCommand(session, Enter("container-b"));
    const exited = dispatchCommand(entered.session, Exit("container-b"));

    expect(exited.accepted).toBe(true);
    expect(exited.session.present.activeWorldId).toBe("world-a");
    expect(exited.session.present.focusPath).toEqual([]);
    expect(getPosition(exited.session.present, "player-a")).toEqual({ worldId: "world-a", x: 5, y: 4 });
  });

  it("rejects unknown recursive references", () => {
    const state = createStage3BSimulationState();

    expect(() =>
      createSimulationState({
        ...state,
        components: {
          ...state.components,
          containers: {
            ...state.components.containers,
            "container-b": {
              ...state.components.containers["container-b"],
              innerWorldId: "missing-world",
            },
          },
        },
      }),
    ).toThrow(/unknown inner world/);
  });

  it("rejects unsupported recursive cycles", () => {
    const state = createStage3BSimulationState();

    const cyclicState: SimulationState = {
      ...state,
      entities: {
        ...state.entities,
        "container-c": { id: "container-c" },
      },
      components: {
        ...state.components,
        positions: {
          ...state.components.positions,
          "container-c": { worldId: "world-c", x: 3, y: 2 },
        },
        containers: {
          ...state.components.containers,
          "container-c": {
            innerWorldId: "world-a",
            entrances: {},
            allowsRecursiveCycle: false,
          },
        },
        solids: {
          ...state.components.solids,
          "container-c": { blocksMovement: true },
        },
        visuals: {
          ...state.components.visuals,
          "container-c": { kind: "recursive-container", width: 1, height: 1 },
        },
      },
    };

    expect(() => createSimulationState(cyclicState)).toThrow(/unsupported recursive cycle/);
  });

  it("hashes state deterministically", () => {
    const left = createStage3BSimulationState();
    const right = createStage3BSimulationState();
    const entered = dispatchCommand(createSimulationSession(left), Enter("container-b"));

    expect(hashState(left)).toBe(hashState(right));
    expect(hashState(entered.session.present)).not.toBe(hashState(left));
  });

});
