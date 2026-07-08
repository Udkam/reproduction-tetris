import { describe, expect, it } from "vitest";
import { Enter, Exit, Move, Redo, Undo } from "./commands";
import { getContainerComponent, getPosition } from "./components";
import { hashState } from "./hash";
import { createSimulationSession } from "./history";
import { dispatchCommand } from "./reducer";
import type { EntityId, SimulationState } from "./types";
import { isWinSatisfied } from "./win";
import {
  createSimulationState,
  createStage3BSimulationState,
  getEntitiesInWorld,
  getEntity,
  getWorldParentContainers,
} from "./worldGraph";

describe("Stage 4 recursive gameplay kernel", () => {
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
    expect(getWorldParentContainers(state, "world-c")).toEqual([
      { entityId: "container-b", parentWorldId: "world-a" },
    ]);
  });

  it("moves the player normally", () => {
    const session = createSimulationSession(createStage3BSimulationState());
    const result = dispatchCommand(session, Move("right"));

    expect(result.accepted).toBe(true);
    expect(getPosition(result.session.present, "player-a")).toEqual({ worldId: "world-a", x: 3, y: 2 });
    expect(result.events).toEqual([
      {
        type: "move",
        entityId: "player-a",
        from: { worldId: "world-a", x: 2, y: 2 },
        to: { worldId: "world-a", x: 3, y: 2 },
      },
    ]);
  });

  it("blocks movement into unpushable solids without history", () => {
    const state = withSolidWall(createStage3BSimulationState(), "wall-a", { worldId: "world-a", x: 3, y: 2 });
    const session = createSimulationSession(state);
    const result = dispatchCommand(session, Move("right"));

    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("target-solid-not-pushable");
    expect(result.session).toBe(session);
    expect(result.session.history.past).toEqual([]);
    expect(result.events[0]).toMatchObject({
      type: "blocked",
      actorId: "player-a",
      direction: "right",
    });
  });

  it("pushes one box", () => {
    const state = createSimulationState({
      ...createStage3BSimulationState(),
      components: {
        ...createStage3BSimulationState().components,
        positions: {
          ...createStage3BSimulationState().components.positions,
          "box-a": { worldId: "world-a", x: 3, y: 2 },
        },
      },
    });
    const result = dispatchCommand(createSimulationSession(state), Move("right"));

    expect(result.accepted).toBe(true);
    expect(getPosition(result.session.present, "player-a")).toEqual({ worldId: "world-a", x: 3, y: 2 });
    expect(getPosition(result.session.present, "box-a")).toEqual({ worldId: "world-a", x: 4, y: 2 });
    expect(result.events[0]).toMatchObject({
      type: "push",
      actorId: "player-a",
      pushed: [
        {
          entityId: "box-a",
          from: { worldId: "world-a", x: 3, y: 2 },
          to: { worldId: "world-a", x: 4, y: 2 },
        },
      ],
    });
  });

  it("pushes multiple boxes in a chain", () => {
    const base = createStage3BSimulationState();
    const state = createSimulationState({
      ...base,
      components: {
        ...base.components,
        positions: {
          ...base.components.positions,
          "box-a": { worldId: "world-a", x: 3, y: 2 },
          "box-c": { worldId: "world-a", x: 4, y: 2 },
        },
      },
    });
    const result = dispatchCommand(createSimulationSession(state), Move("right"));

    expect(result.accepted).toBe(true);
    expect(getPosition(result.session.present, "player-a")).toEqual({ worldId: "world-a", x: 3, y: 2 });
    expect(getPosition(result.session.present, "box-a")).toEqual({ worldId: "world-a", x: 4, y: 2 });
    expect(getPosition(result.session.present, "box-c")).toEqual({ worldId: "world-a", x: 5, y: 2 });
  });

  it("enters a recursive container through a command", () => {
    const session = createSimulationSession(createStage3BSimulationState());
    const result = dispatchCommand(session, Enter("container-b"));

    expect(result.accepted).toBe(true);
    expect(result.session.present.activeWorldId).toBe("world-c");
    expect(result.session.present.focusPath).toEqual(["container-b"]);
    expect(getPosition(result.session.present, "player-a")).toEqual({ worldId: "world-c", x: 2, y: 2 });
    expect(result.events[0]).toMatchObject({ type: "enterWorld", containerId: "container-b" });
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
    expect(getPosition(exited.session.present, "player-a")).toEqual({ worldId: "world-a", x: 5, y: 5 });
    expect(exited.events[0]).toMatchObject({ type: "exitWorld", containerId: "container-b" });
  });

  it("moves a container entity while preserving its contained world reference", () => {
    const base = createStage3BSimulationState();
    const state = createSimulationState({
      ...base,
      components: {
        ...base.components,
        positions: {
          ...base.components.positions,
          "container-b": { worldId: "world-a", x: 3, y: 2 },
        },
      },
    });
    const result = dispatchCommand(createSimulationSession(state), Move("right"));

    expect(result.accepted).toBe(true);
    expect(getPosition(result.session.present, "container-b")).toEqual({ worldId: "world-a", x: 4, y: 2 });
    expect(getContainerComponent(result.session.present, "container-b")?.innerWorldId).toBe("world-c");
    expect(getWorldParentContainers(result.session.present, "world-c")).toEqual([
      { entityId: "container-b", parentWorldId: "world-a" },
    ]);
  });

  it("undoes and redoes with matching deterministic hashes", () => {
    const session = createSimulationSession(createStage3BSimulationState());
    const initialHash = hashState(session.present);
    const moved = dispatchCommand(session, Move("right"));
    const movedHash = hashState(moved.session.present);
    const undone = dispatchCommand(moved.session, Undo());
    const redone = dispatchCommand(undone.session, Redo());

    expect(undone.accepted).toBe(true);
    expect(hashState(undone.session.present)).toBe(initialHash);
    expect(redone.accepted).toBe(true);
    expect(hashState(redone.session.present)).toBe(movedHash);
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

  it("rejects impossible out-of-bounds and overlapping solid positions", () => {
    const state = createStage3BSimulationState();

    expect(() =>
      createSimulationState({
        ...state,
        components: {
          ...state.components,
          positions: {
            ...state.components.positions,
            "box-a": { worldId: "world-a", x: 10, y: 2 },
          },
        },
      }),
    ).toThrow(/invalid position/);

    expect(() => withSolidWall(state, "wall-overlap", { worldId: "world-a", x: 2, y: 2 })).toThrow(
      /Impossible position/,
    );
  });

  it("hashes state deterministically", () => {
    const left = createStage3BSimulationState();
    const right = createStage3BSimulationState();
    const entered = dispatchCommand(createSimulationSession(left), Enter("container-b"));

    expect(hashState(left)).toBe(hashState(right));
    expect(hashState(entered.session.present)).not.toBe(hashState(left));
  });

  it("detects multi-world goal completion", () => {
    const base = createStage3BSimulationState();
    const unsolved = createSimulationState({
      ...base,
      components: {
        ...base.components,
        positions: {
          ...base.components.positions,
          "box-a": { worldId: "world-a", x: 1, y: 5 },
        },
      },
    });
    const solved = createSimulationState({
      ...unsolved,
      components: {
        ...unsolved.components,
        positions: {
          ...unsolved.components.positions,
          "box-c": { worldId: "world-c", x: 1, y: 1 },
        },
      },
    });

    expect(isWinSatisfied(base)).toBe(false);
    expect(isWinSatisfied(unsolved)).toBe(false);
    expect(isWinSatisfied(solved)).toBe(true);
  });
});

function withSolidWall(state: SimulationState, entityId: EntityId, position: SimulationState["components"]["positions"][string]) {
  return createSimulationState({
    ...state,
    entities: {
      ...state.entities,
      [entityId]: { id: entityId },
    },
    components: {
      ...state.components,
      positions: {
        ...state.components.positions,
        [entityId]: position,
      },
      solids: {
        ...state.components.solids,
        [entityId]: { blocksMovement: true },
      },
    },
  });
}
