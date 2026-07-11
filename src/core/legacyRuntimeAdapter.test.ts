import { describe, expect, it } from "vitest";
import { Enter, Exit, Move, Redo, Reset, Step, Undo, isPublicCommand, type PublicCommand } from "./commands";
import { hashState } from "./hash";
import { createSimulationSession } from "./history";
import { dispatchWithLegacyRuntimeAdapter } from "./legacyRuntimeAdapter";
import { dispatchCommand, dispatchPublicCommand } from "./reducer";
import type { CommandResult, EntityId, SimulationState } from "./types";
import { getPosition } from "./components";
import { createSimulationState, createStage3BSimulationState } from "./worldGraph";

describe("I1 legacy runtime adapter", () => {
  it("translates a public Step movement into frozen transaction, event, and address values", () => {
    const session = createSimulationSession(createStage3BSimulationState());
    const beforeHash = hashState(session.present);
    const envelope = dispatchPublicCommand(session, Step("right"));
    const result = acceptedStep(envelope.result);

    expect(beforeHash).toBe("aeaaa2a1");
    expect(envelope.session.publicTransactionSequence).toBe(1);
    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0]?.kind).toBe("accepted");
    expect(result.transaction).toMatchObject({
      id: { initialStateHash: beforeHash, sequence: 1 },
      command: { type: "step", direction: "right" },
      rule: "walk",
      stateHashBefore: beforeHash,
      stateHashAfter: "dedf1068",
      activeAddressBefore: { rootWorldId: "world-a", containerPath: [] },
      activeAddressAfter: { rootWorldId: "world-a", containerPath: [] },
    });
    expect(result.transaction.events).toEqual([
      {
        type: "entity-moved",
        transactionId: { initialStateHash: beforeHash, sequence: 1 },
        eventIndex: 0,
        direction: "forward",
        occurrence: { world: { rootWorldId: "world-a", containerPath: [] }, entityId: "player-a" },
        from: { world: { rootWorldId: "world-a", containerPath: [] }, x: 2, y: 2 },
        to: { world: { rootWorldId: "world-a", containerPath: [] }, x: 3, y: 2 },
        cause: "walk",
      },
    ]);
    expect(envelope.session.history.past.at(-1)?.publicMetadata?.transactionId).toEqual(result.transaction.id);
  });

  it("translates a public Step push with ordered attempts and semantic push values", () => {
    const state = withPosition(createStage3BSimulationState(), "box-a", { worldId: "world-a", x: 3, y: 2 });
    const envelope = dispatchPublicCommand(createSimulationSession(state), Step("right"));
    const result = acceptedStep(envelope.result);

    expect(result.transaction.rule).toBe("push");
    expect(result.attempts.map((attempt) => [attempt.kind, attempt.rule])).toEqual([
      ["not-applicable", "walk"],
      ["accepted", "push"],
    ]);
    expect(result.transaction.events.map((event) => event.type)).toEqual(["push-resolved", "entity-moved"]);
    expect(result.transaction.events[0]).toMatchObject({
      type: "push-resolved",
      actor: { entityId: "player-a" },
      directionMoved: "right",
      moved: [{ occurrence: { entityId: "box-a" }, cause: "push" }],
    });
    expect(getPosition(envelope.session.present, "box-a")).toEqual({ worldId: "world-a", x: 4, y: 2 });
  });

  it("returns a total unchanged-state public Step rejection for an unpushable target", () => {
    const session = createSimulationSession(withSolidWall(createStage3BSimulationState(), "wall-a", { worldId: "world-a", x: 3, y: 2 }));
    const beforeHash = hashState(session.present);
    const envelope = dispatchPublicCommand(session, Step("right"));
    const result = rejectedStep(envelope.result);

    expect(envelope.session).toBe(session);
    expect(result.rejection).toEqual({
      code: "target-solid-not-pushable",
      reason: { kind: "target" },
      rule: "push",
      attemptedCell: { world: { rootWorldId: "world-a", containerPath: [] }, x: 3, y: 2 },
    });
    expect(result.stateHashBefore).toBe(beforeHash);
    expect(result.stateHashAfter).toBe(beforeHash);
    expect(result.activeAddressBefore).toEqual(result.activeAddressAfter);
    expect(result.attempts.map((attempt) => [attempt.kind, attempt.rule])).toEqual([
      ["not-applicable", "walk"],
      ["blocked", "push"],
    ]);
    expect(result.events).toEqual([
      {
        type: "command-blocked",
        transactionId: null,
        eventIndex: 0,
        direction: "forward",
        rejection: result.rejection,
      },
    ]);
    expect(envelope.session.history).toEqual(session.history);
  });

  it("returns the frozen actor preflight rejection without invoking legacy resolution", () => {
    const base = createStage3BSimulationState();
    const session = createSimulationSession({
      ...base,
      components: {
        ...base.components,
        players: {},
      },
    });
    const envelope = dispatchPublicCommand(session, Step("right"));
    const result = rejectedStep(envelope.result);

    expect(envelope.session).toBe(session);
    expect(result.rejection).toEqual({
      code: "actor-not-active",
      reason: { kind: "actor" },
      rule: "step-fallback",
    });
    expect(result.attempts).toEqual([
      { kind: "blocked", rule: "step-fallback", rejection: result.rejection },
    ]);
  });

  it("uses the frozen public Undo, Redo, and Reset attempt/event distinctions", () => {
    const initial = createSimulationSession(createStage3BSimulationState());
    const initialUndo = rejectedNonStep(dispatchPublicCommand(initial, Undo()).result);
    const initialRedo = rejectedNonStep(dispatchPublicCommand(initial, Redo()).result);
    const initialReset = rejectedNonStep(dispatchPublicCommand(initial, Reset()).result);

    expect(initialUndo.rejection).toMatchObject({ code: "history-empty", reason: { kind: "history" } });
    expect(initialRedo.rejection).toMatchObject({ code: "future-empty", reason: { kind: "history" } });
    expect(initialReset.rejection).toMatchObject({ code: "already-initial-state", reason: { kind: "reset" } });
    for (const result of [initialUndo, initialRedo, initialReset]) {
      expect(result.attempts).toEqual([]);
      expect(result.events[0]).toMatchObject({ transactionId: null, eventIndex: 0, direction: "forward" });
    }

    const moved = dispatchPublicCommand(initial, Step("right"));
    const movedResult = acceptedStep(moved.result);
    const undone = dispatchPublicCommand(moved.session, Undo());
    const undoneResult = acceptedNonStep(undone.result);
    const redone = dispatchPublicCommand(undone.session, Redo());
    const redoneResult = acceptedNonStep(redone.result);
    const reset = dispatchPublicCommand(moved.session, Reset());
    const resetResult = acceptedNonStep(reset.result);

    expect(undoneResult.transaction).toMatchObject({
      rule: "undo",
      sourceTransactionId: movedResult.transaction.id,
      id: { sequence: 2 },
    });
    expect(undoneResult.transaction.events[0]).toMatchObject({
      type: "entity-moved",
      direction: "reverse",
      from: { x: 3, y: 2 },
      to: { x: 2, y: 2 },
    });
    expect(redoneResult.transaction).toMatchObject({
      rule: "redo",
      sourceTransactionId: movedResult.transaction.id,
      id: { sequence: 3 },
    });
    expect(redoneResult.transaction.events[0]).toMatchObject({ type: "entity-moved", direction: "forward" });
    expect(resetResult.transaction).toMatchObject({ rule: "reset", id: { sequence: 2 } });
    expect(resetResult.transaction.events).toEqual([
      { type: "reset", transactionId: resetResult.transaction.id, eventIndex: 0, direction: "forward" },
    ]);
  });

  it("fails closed before legacy dispatch for forced legacy or unknown command values", () => {
    const initial = createSimulationSession(createStage3BSimulationState());
    const session = dispatchPublicCommand(initial, Step("right")).session;
    const stateHash = hashState(session.present);
    const history = session.history;
    const focusPath = session.present.focusPath;
    const transactionSequence = session.publicTransactionSequence;

    const invalidCommands = [
      Enter("legacy-container"),
      Exit("legacy-container"),
      { type: "unknown-command" },
    ];

    for (const invalidCommand of invalidCommands) {
      let legacyCalled = false;
      expect(isPublicCommand(invalidCommand)).toBe(false);
      expect(() => dispatchWithLegacyRuntimeAdapter(
        session,
        invalidCommand as unknown as PublicCommand,
        (legacySession, command) => {
          legacyCalled = true;
          return dispatchCommand(legacySession, command);
        },
      )).toThrowError(new TypeError("Invalid PublicCommand."));
      expect(legacyCalled).toBe(false);
      expect(hashState(session.present)).toBe(stateHash);
      expect(session.history).toBe(history);
      expect(session.present.focusPath).toBe(focusPath);
      expect(session.publicTransactionSequence).toBe(transactionSequence);
    }

    expect(isPublicCommand(Step("left"))).toBe(true);
  });

  it("converts a caught legacy exception after preflight into a complete unchanged Step rejection", () => {
    const session = createSimulationSession(createStage3BSimulationState());
    const beforeHash = hashState(session.present);
    const envelope = dispatchWithLegacyRuntimeAdapter(session, Step("right"), () => {
      throw new Error("legacy failure");
    });
    const result = rejectedStep(envelope.result);

    expect(envelope.session).toBe(session);
    expect(result.rejection).toMatchObject({ code: "invalid-level-data", reason: { kind: "validation" } });
    expect(result.attempts.map((attempt) => [attempt.kind, attempt.rule])).toEqual([
      ["not-applicable", "walk"],
      ["blocked", "step-fallback"],
    ]);
    expect(result.stateHashBefore).toBe(beforeHash);
    expect(result.stateHashAfter).toBe(beforeHash);
    expect(result.activeAddressBefore).toEqual(result.activeAddressAfter);
    expect(result.events).toEqual([
      {
        type: "command-blocked",
        transactionId: null,
        eventIndex: 0,
        direction: "forward",
        rejection: result.rejection,
      },
    ]);
    expect(envelope.session.history).toBe(session.history);
    expect(envelope.session.present.focusPath).toBe(session.present.focusPath);
    expect(envelope.session.publicTransactionSequence).toBe(session.publicTransactionSequence);
  });

  it("rejects unsupported accepted legacy events with the same complete Step invariants", () => {
    const session = createSimulationSession(createStage3BSimulationState());
    const beforeHash = hashState(session.present);
    const envelope = dispatchWithLegacyRuntimeAdapter(session, Step("right"), (legacySession) => {
      const moved = dispatchCommand(legacySession, Move("right"));
      return {
        ...moved,
        events: [{ type: "reset" }],
      };
    });
    const result = rejectedStep(envelope.result);

    expect(envelope.session).toBe(session);
    expect(result.rejection).toMatchObject({
      code: "invalid-level-data",
      reason: { kind: "validation" },
      rule: "step-fallback",
    });
    expect(result.attempts.map((attempt) => [attempt.kind, attempt.rule])).toEqual([
      ["not-applicable", "walk"],
      ["blocked", "step-fallback"],
    ]);
    expect(result.stateHashBefore).toBe(beforeHash);
    expect(result.stateHashAfter).toBe(beforeHash);
    expect(result.activeAddressBefore).toEqual(result.activeAddressAfter);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      type: "command-blocked",
      transactionId: null,
      eventIndex: 0,
      direction: "forward",
      rejection: result.rejection,
    });
    expect(envelope.session.history).toBe(session.history);
    expect(envelope.session.present.focusPath).toBe(session.present.focusPath);
    expect(envelope.session.publicTransactionSequence).toBe(session.publicTransactionSequence);
  });

  it("keeps the legacy dispatch surface compile-compatible during the first I1 half", () => {
    const result = dispatchCommand(createSimulationSession(createStage3BSimulationState()), Move("right"));
    expect(result.accepted).toBe(true);
  });
});

function acceptedStep(result: CommandResult) {
  if (result.kind !== "accepted" || result.command.type !== "step") {
    throw new Error("Expected an accepted Step result.");
  }
  return result;
}

function rejectedStep(result: CommandResult) {
  if (result.kind !== "rejected" || result.command.type !== "step") {
    throw new Error("Expected a rejected Step result.");
  }
  return result;
}

function acceptedNonStep(result: CommandResult) {
  if (result.kind !== "accepted" || result.command.type === "step") {
    throw new Error("Expected an accepted non-Step result.");
  }
  return result;
}

function rejectedNonStep(result: CommandResult) {
  if (result.kind !== "rejected" || result.command.type === "step") {
    throw new Error("Expected a rejected non-Step result.");
  }
  return result;
}

function withPosition(
  state: SimulationState,
  entityId: EntityId,
  position: SimulationState["components"]["positions"][string],
): SimulationState {
  return createSimulationState({
    ...state,
    components: {
      ...state.components,
      positions: {
        ...state.components.positions,
        [entityId]: position,
      },
    },
  });
}

function withSolidWall(
  state: SimulationState,
  entityId: EntityId,
  position: SimulationState["components"]["positions"][string],
): SimulationState {
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
