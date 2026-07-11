import { describe, expect, it } from "vitest";
import { Redo, Reset, Step, Undo, type PublicCommand } from "./commands";
import { hashState } from "./hash";
import { createSimulationSession } from "./history";
import { dispatchPublicCommand } from "./reducer";
import type { SemanticEvent, SimulationState, TransactionId } from "./types";
import { isWinSatisfied } from "./win";
import { cloneSimulationState, createStage3BSimulationState } from "./worldGraph";

describe("R1 deterministic public dispatch", () => {
  it("walks through the stable public boundary with one addressed transaction", () => {
    const session = createSimulationSession(fixture());
    const before = hashState(session.present);
    const envelope = dispatchPublicCommand(session, Step("right"));

    expect(envelope.result.kind).toBe("accepted");
    if (envelope.result.kind === "accepted") {
      expect(envelope.result.transaction.rule).toBe("walk");
      expect(envelope.result.attempts.map((entry) => entry.kind)).toEqual(["accepted"]);
      expect(envelope.result.transaction.id).toEqual({ initialStateHash: before, sequence: 1 });
      expect(envelope.result.transaction.events).toMatchObject([
        { type: "entity-moved", occurrence: { world: { rootWorldId: "world-a", containerPath: [] }, entityId: "player-a" } },
      ]);
    }
    expect(envelope.session.publicTransactionSequence).toBe(1);
  });

  it("rejects an unpushable target without state, focus, history, or sequence mutation", () => {
    const state = withWall(fixture(), "wall", { worldId: "world-a", x: 3, y: 2 });
    const session = createSimulationSession(state);
    const before = snapshot(session);
    const envelope = dispatchPublicCommand(session, Step("right"));

    expect(envelope.session).toBe(session);
    expect(envelope.result).toMatchObject({ kind: "rejected", rejection: { code: "target-solid-not-pushable" } });
    if (envelope.result.kind === "rejected") {
      expect(envelope.result.attempts.map((entry) => [entry.kind, entry.rule])).toEqual([
        ["not-applicable", "walk"],
        ["not-applicable", "enter"],
        ["blocked", "push"],
      ]);
      expect(envelope.result.events).toHaveLength(1);
    }
    expect(snapshot(session)).toEqual(before);
  });

  it("uses the frozen all-not-applicable fallback and keeps failed preflight distinct", () => {
    const base = withWall(fixture(), "wall", { worldId: "world-a", x: 3, y: 2 });
    const noRules: SimulationState = {
      ...base,
      ruleSet: { ...base.ruleSet, ruleEnablement: { push: "disabled", enter: "disabled", exit: "disabled" }, interactionPriority: [] },
    };
    const fallback = dispatchPublicCommand(createSimulationSession(noRules), Step("right")).result;
    expect(fallback).toMatchObject({ kind: "rejected", rejection: { code: "no-enabled-rule-applies" } });
    if (fallback.kind === "rejected") {
      expect(fallback.attempts.map((entry) => [entry.kind, entry.rule])).toEqual([["not-applicable", "walk"], ["blocked", "step-fallback"]]);
    }

    const actorMissing = dispatchPublicCommand(createSimulationSession({ ...fixture(), components: { ...fixture().components, players: {} } }), Step("right")).result;
    expect(actorMissing).toMatchObject({ kind: "rejected", rejection: { code: "actor-not-active" } });
    if (actorMissing.kind === "rejected") expect(actorMissing.attempts.map((entry) => entry.rule)).toEqual(["step-fallback"]);

    const focusMissing = dispatchPublicCommand(createSimulationSession({ ...fixture(), activeWorldId: "world-c", focusPath: [] }), Step("right")).result;
    expect(focusMissing).toMatchObject({ kind: "rejected", rejection: { code: "focus-invalid" } });
  });

  it("resolves normal single and chained pushes deterministically", () => {
    const one = withPositions(fixture(), { "box-a": { worldId: "world-a", x: 3, y: 2 } });
    const oneResult = dispatchPublicCommand(createSimulationSession(one), Step("right"));
    expect(oneResult.result).toMatchObject({ kind: "accepted", transaction: { rule: "push" } });
    expect(oneResult.session.present.components.positions["box-a"]).toEqual({ worldId: "world-a", x: 4, y: 2 });

    const chain = withPositions(fixture(), {
      "box-a": { worldId: "world-a", x: 3, y: 2 },
      "box-c": { worldId: "world-a", x: 4, y: 2 },
    });
    const chainResult = dispatchPublicCommand(createSimulationSession(chain), Step("right"));
    expect(chainResult.session.present.components.positions["box-a"]).toEqual({ worldId: "world-a", x: 4, y: 2 });
    expect(chainResult.session.present.components.positions["box-c"]).toEqual({ worldId: "world-a", x: 5, y: 2 });

    const edge = withPositions(fixture(), { "player-a": { worldId: "world-a", x: 8, y: 2 }, "box-a": { worldId: "world-a", x: 9, y: 2 } });
    expect(dispatchPublicCommand(createSimulationSession(withRules(edge, ["push", "enter", "exit"])), Step("right")).result).toMatchObject({
      kind: "rejected",
      rejection: { code: "push-chain-out-of-bounds" },
    });

    const push = dispatchPublicCommand(createSimulationSession(withRules(one, ["push", "enter", "exit"])), Step("right"));
    expect(push.result.kind === "accepted" && push.result.transaction.events).toMatchObject([
      { type: "push-resolved", eventIndex: 0, direction: "forward", moved: [{ cause: "push", eventIndex: 0 }] },
      { type: "entity-moved", eventIndex: 1, direction: "forward", cause: "push" },
    ]);
    const undone = dispatchPublicCommand(push.session, Undo());
    expect(undone.result.kind === "accepted" && undone.result.transaction.events).toMatchObject([
      { type: "entity-moved", eventIndex: 0, direction: "reverse", cause: "push" },
      { type: "push-resolved", eventIndex: 1, direction: "reverse", moved: [{ cause: "push", direction: "reverse" }] },
    ]);

    const multiPush = dispatchPublicCommand(createSimulationSession(withRules(chain, ["push", "enter", "exit"])), Step("right"));
    expect(multiPush.result.kind === "accepted" && multiPush.result.transaction.events).toMatchObject([
      { type: "push-resolved", eventIndex: 0, direction: "forward", directionMoved: "right", moved: [{ occurrence: { entityId: "box-a" }, from: { x: 3 }, to: { x: 4 } }, { occurrence: { entityId: "box-c" }, from: { x: 4 }, to: { x: 5 } }] },
      { type: "entity-moved", eventIndex: 1, direction: "forward", cause: "push", from: { x: 2 }, to: { x: 3 } },
    ]);
    const multiUndo = dispatchPublicCommand(multiPush.session, Undo());
    expect(multiUndo.result.kind === "accepted" && multiUndo.result.transaction).toMatchObject({
      sourceTransactionId: multiPush.result.kind === "accepted" ? multiPush.result.transaction.id : undefined,
      events: [
        { type: "entity-moved", eventIndex: 0, direction: "reverse", cause: "push", from: { x: 3 }, to: { x: 2 } },
        { type: "push-resolved", eventIndex: 1, direction: "reverse", directionMoved: "left", moved: [{ from: { x: 4 }, to: { x: 3 } }, { from: { x: 5 }, to: { x: 4 } }] },
      ],
    });
    const multiRedo = dispatchPublicCommand(multiUndo.session, Redo());
    expect(multiRedo.result.kind === "accepted" && multiRedo.result.transaction.events).toMatchObject([
      { type: "push-resolved", eventIndex: 0, direction: "forward", directionMoved: "right" },
      { type: "entity-moved", eventIndex: 1, direction: "forward", cause: "push" },
    ]);
  });

  it("uses literal priority for a pushable container and preserves its contained world", () => {
    const state = withPositions(fixture(), { "player-a": { worldId: "world-a", x: 5, y: 3 } });
    const pushed = dispatchPublicCommand(createSimulationSession(withRules(state, ["push", "enter", "exit"])), Step("down"));
    expect(pushed.result).toMatchObject({ kind: "accepted", transaction: { rule: "push" } });
    expect(pushed.session.present.components.positions["container-b"]).toEqual({ worldId: "world-a", x: 5, y: 5 });
    expect(pushed.session.present.components.containers["container-b"]?.innerWorldId).toBe("world-c");
    expect(pushed.session.present.activeWorldId).toBe("world-a");
    expect(pushed.session.present.focusPath).toEqual([]);

    const entered = dispatchPublicCommand(createSimulationSession(withRules(state, ["enter", "push", "exit"])), Step("down"));
    expect(entered.result).toMatchObject({ kind: "accepted", transaction: { rule: "enter" } });
    expect(entered.session.present.activeWorldId).toBe("world-c");
  });

  it("blocks an ordinary non-pushable solid container when push is first", () => {
    const base = withPositions(fixture(), { "player-a": { worldId: "world-a", x: 5, y: 3 } });
    const state: SimulationState = {
      ...withRules(base, ["push", "enter", "exit"]),
      components: { ...base.components, pushables: { ...base.components.pushables, "container-b": undefined as never } },
    };
    const { ["container-b"]: _removed, ...pushables } = state.components.pushables;
    const result = dispatchPublicCommand(createSimulationSession({ ...state, components: { ...state.components, pushables } }), Step("down"));
    expect(result.result).toMatchObject({ kind: "rejected", rejection: { code: "target-solid-not-pushable" } });
  });

  it("keeps exit after walk and exits only after walk is not applicable", () => {
    const base = fixture();
    const state = withRules({
      ...base,
      ruleSet: { ...base.ruleSet, ruleEnablement: { push: "disabled", enter: "enabled", exit: "enabled" } },
      portTables: [{ containerId: "container-b", ports: [{ id: "top", outerApproach: "down", innerLanding: { x: 2, y: 0 }, innerExit: "up" }] }],
    }, ["enter", "exit"]);
    const positioned = withPositions(state, { "player-a": { worldId: "world-a", x: 5, y: 3 } });
    const inWorld = dispatchPublicCommand(createSimulationSession(positioned), Step("down"));
    expect(inWorld.result).toMatchObject({ kind: "accepted", transaction: { rule: "enter" } });
    const walked = dispatchPublicCommand(inWorld.session, Step("right"));
    expect(walked.result).toMatchObject({ kind: "accepted", transaction: { rule: "walk" } });
    const reset = dispatchPublicCommand(walked.session, Reset());
    const reentered = dispatchPublicCommand(reset.session, Step("down"));
    const exited = dispatchPublicCommand(reentered.session, Step("up"));
    expect(exited.result).toMatchObject({ kind: "accepted", transaction: { rule: "exit" } });
  });

  it("treats a boundary push as not-applicable and lets exact exit follow literal priority", () => {
    const base = focusedExitState(0);
    for (const priority of [["push", "exit", "enter"], ["exit", "push", "enter"]] as const) {
      const result = dispatchPublicCommand(createSimulationSession(withRules(base, priority)), Step("up")).result;
      expect(result).toMatchObject({ kind: "accepted", transaction: { rule: "exit" } });
    }
  });

  it("lets a matching pushable blocker or exact exit win according to declared priority", () => {
    const base = withPositions(focusedExitState(1), { "box-c": { worldId: "world-c", x: 2, y: 0 } });
    const pushFirst = dispatchPublicCommand(createSimulationSession(withRules(base, ["push", "exit", "enter"])), Step("up")).result;
    expect(pushFirst).toMatchObject({ kind: "rejected", rejection: { code: "push-chain-out-of-bounds" } });
    const exitFirst = dispatchPublicCommand(createSimulationSession(withRules(base, ["exit", "push", "enter"])), Step("up")).result;
    expect(exitFirst).toMatchObject({ kind: "accepted", transaction: { rule: "exit" } });
  });

  it("gives Undo, Redo, and Reset their empty-attempt distinctions and reversible traces", () => {
    const initial = createSimulationSession(fixture());
    for (const [command, code] of [[Undo(), "history-empty"], [Redo(), "future-empty"], [Reset(), "already-initial-state"]] as const) {
      const result = dispatchPublicCommand(initial, command).result;
      expect(result).toMatchObject({ kind: "rejected", rejection: { code }, attempts: [] });
    }
    const moved = dispatchPublicCommand(initial, Step("right"));
    const undone = dispatchPublicCommand(moved.session, Undo());
    const redone = dispatchPublicCommand(undone.session, Redo());
    expect(undone.result).toMatchObject({ kind: "accepted", transaction: { rule: "undo", sourceTransactionId: { sequence: 1 } }, attempts: [] });
    expect(undone.result.kind === "accepted" && undone.result.transaction.events[0]).toMatchObject({ type: "entity-moved", direction: "reverse", from: { x: 3 }, to: { x: 2 } });
    expect(redone.result).toMatchObject({ kind: "accepted", transaction: { rule: "redo", sourceTransactionId: { sequence: 1 } }, attempts: [] });
  });

  it("emits win changes only when the canonical predicate changes and reverses them", () => {
    const base = fixture();
    const state = withPositions({
      ...base,
      components: { ...base.components, goals: { "goal-a": { acceptsVisualKind: "box" } } },
    }, {
      "player-a": { worldId: "world-a", x: 1, y: 5 },
      "box-a": { worldId: "world-a", x: 2, y: 5 },
      "goal-a": { worldId: "world-a", x: 3, y: 5 },
    });
    const moved = dispatchPublicCommand(createSimulationSession(withRules(state, ["push", "enter", "exit"])), Step("right"));
    expect(moved.result.kind === "accepted" && moved.result.transaction.events.at(-1)).toMatchObject({ type: "win-changed", solved: true });
    const undone = dispatchPublicCommand(moved.session, Undo());
    expect(undone.result.kind === "accepted" && undone.result.transaction.events[0]).toMatchObject({ type: "win-changed", solved: false, direction: "reverse" });
    const redone = dispatchPublicCommand(undone.session, Redo());
    expect(redone.result.kind === "accepted" && redone.result.transaction.events.at(-1)).toMatchObject({ type: "win-changed", solved: true });
  });

  it("fails closed for a malformed supplied session and for an out-of-domain command", () => {
    const base = fixture();
    const malformed = createSimulationSession({ ...base, ruleSet: { ...base.ruleSet, interactionPriority: ["push", "push"] as never } });
    const before = snapshot(malformed);
    const result = dispatchPublicCommand(malformed, Step("right"));
    expect(result.result).toMatchObject({ kind: "rejected", rejection: { code: "invalid-level-data" } });
    expect(snapshot(malformed)).toEqual(before);
    expect(() => dispatchPublicCommand(malformed, { type: "other" } as unknown as PublicCommand)).toThrow("Invalid PublicCommand.");

    const forged = { ...createSimulationSession(fixture()), present: {} as SimulationState };
    expect(dispatchPublicCommand(forged, Step("right")).result).toMatchObject({ kind: "rejected", rejection: { code: "invalid-level-data" } });
  });

  it("validates Undo, Redo, and Reset candidate snapshots before committing", () => {
    const moved = dispatchPublicCommand(createSimulationSession(fixture()), Step("right"));
    const invalidPrevious = { ...moved.session, history: { ...moved.session.history, past: moved.session.history.past.map((record) => ({ ...record, previousState: invalidState(record.previousState) })) } };
    const undo = dispatchPublicCommand(invalidPrevious, Undo());
    expect(undo.result).toMatchObject({ kind: "rejected", command: { type: "undo" }, rejection: { code: "invalid-level-data" }, attempts: [] });
    expect(undo.session).toBe(invalidPrevious);

    const undone = dispatchPublicCommand(moved.session, Undo());
    const invalidNext = { ...undone.session, history: { ...undone.session.history, future: undone.session.history.future.map((record) => ({ ...record, nextState: invalidState(record.nextState) })) } };
    const redo = dispatchPublicCommand(invalidNext, Redo());
    expect(redo.result).toMatchObject({ kind: "rejected", command: { type: "redo" }, rejection: { code: "invalid-level-data" }, attempts: [] });
    expect(redo.session).toBe(invalidNext);

    const invalidInitial = { ...moved.session, initialState: invalidState(moved.session.initialState) };
    const reset = dispatchPublicCommand(invalidInitial, Reset());
    expect(reset.result).toMatchObject({ kind: "rejected", command: { type: "reset" }, rejection: { code: "invalid-level-data" }, attempts: [] });
    expect(reset.session).toBe(invalidInitial);

    const landingInitial = {
      ...moved.session,
      initialState: withPositions(moved.session.initialState, { "box-c": { worldId: "world-c", x: 2, y: 2 } }),
    };
    const landingBefore = snapshot(landingInitial);
    const landingReset = dispatchPublicCommand(landingInitial, Reset());
    expect(landingReset.result).toMatchObject({ kind: "rejected", command: { type: "reset" }, rejection: { code: "invalid-level-data" }, attempts: [], events: [{ type: "command-blocked", transactionId: null }] });
    expect(landingReset.session).toBe(landingInitial);
    expect(snapshot(landingInitial)).toEqual(landingBefore);
  });

  it("rejects forged selected history metadata and semantic events without changing the session", () => {
    const moved = dispatchPublicCommand(createSimulationSession(fixture()), Step("right"));
    const record = moved.session.history.past[0]!;
    const variants = [
      { ...record, transaction: { ...record.transaction, events: [{ type: "unknown", transactionId: record.transaction.id, eventIndex: 0, direction: "forward" }] } },
      { ...record, transaction: { ...record.transaction, stateHashAfter: "forged" } },
      { ...record, transaction: { ...record.transaction, activeAddressAfter: { rootWorldId: "wrong", containerPath: [] } } },
      { ...record, transaction: { ...record.transaction, id: { ...record.transaction.id, sequence: 0 } } },
      { ...record, transaction: { ...record.transaction, command: Undo(), rule: "undo" } },
      { ...record, transaction: { ...record.transaction, events: [{ ...record.transaction.events[0]!, from: { ...((record.transaction.events[0] as Extract<typeof record.transaction.events[number], { readonly type: "entity-moved" }>).from), x: 0 } }] } },
      { ...record, transaction: { ...record.transaction, events: [{ type: "reset", transactionId: record.transaction.id, eventIndex: 0, direction: "forward" }] } },
      { ...record, transaction: { ...record.transaction, events: [{ ...record.transaction.events[0]!, from: { world: {}, x: 0, y: 0 } }] } },
    ];
    for (const forgedRecord of variants) {
      const forged = { ...moved.session, history: { ...moved.session.history, past: [forgedRecord as typeof record] } };
      const before = snapshot(forged);
      const result = dispatchPublicCommand(forged, Undo());
      expect(result.session).toBe(forged);
      expect(result.result).toMatchObject({ kind: "rejected", command: { type: "undo" }, rejection: { code: "invalid-level-data" }, attempts: [], events: [{ type: "command-blocked", transactionId: null, eventIndex: 0, direction: "forward" }] });
      expect(snapshot(forged)).toEqual(before);
    }
  });

  it("fails closed for forged source sequences and malformed session sequence metadata", () => {
    const moved = dispatchPublicCommand(createSimulationSession(fixture()), Step("right"));
    const source = moved.session.history.past[0]!;
    const forgedId: TransactionId = { ...source.transaction.id, sequence: 999 };
    const forgedRecord = { ...source, transaction: { ...source.transaction, id: forgedId, events: reidentifyEvents(source.transaction.events, forgedId) } };
    const forgedUndo = { ...moved.session, history: { ...moved.session.history, past: [forgedRecord] } };
    const undoBefore = snapshot(forgedUndo);
    const undo = dispatchPublicCommand(forgedUndo, Undo());
    expect(undo.session).toBe(forgedUndo);
    expect(undo.result).toMatchObject({ kind: "rejected", command: { type: "undo" }, rejection: { code: "invalid-level-data" }, attempts: [], events: [{ type: "command-blocked", transactionId: null, eventIndex: 0, direction: "forward" }] });
    expect(snapshot(forgedUndo)).toEqual(undoBefore);

    const undone = dispatchPublicCommand(moved.session, Undo());
    const futureSource = undone.session.history.future[0]!;
    const forgedFutureId: TransactionId = { ...futureSource.transaction.id, sequence: 999 };
    const forgedRedo = { ...undone.session, history: { ...undone.session.history, future: [{ ...futureSource, transaction: { ...futureSource.transaction, id: forgedFutureId, events: reidentifyEvents(futureSource.transaction.events, forgedFutureId) } }] } };
    const redoBefore = snapshot(forgedRedo);
    const redo = dispatchPublicCommand(forgedRedo, Redo());
    expect(redo.session).toBe(forgedRedo);
    expect(redo.result).toMatchObject({ kind: "rejected", command: { type: "redo" }, rejection: { code: "invalid-level-data" }, attempts: [] });
    expect(snapshot(forgedRedo)).toEqual(redoBefore);

    for (const sequence of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const bad = { ...createSimulationSession(fixture()), publicTransactionSequence: sequence };
      const before = snapshot(bad);
      const step = dispatchPublicCommand(bad, Step("right"));
      expect(step.session).toBe(bad);
      expect(step.result).toMatchObject({ kind: "rejected", command: { type: "step" }, rejection: { code: "invalid-level-data" }, attempts: [{ kind: "not-applicable", rule: "walk" }, { kind: "blocked", rule: "step-fallback" }], events: [{ type: "command-blocked", transactionId: null }] });
      expect(snapshot(bad)).toEqual(before);
      const nonStep = dispatchPublicCommand(bad, Undo());
      expect(nonStep.session).toBe(bad);
      expect(nonStep.result).toMatchObject({ kind: "rejected", command: { type: "undo" }, rejection: { code: "invalid-level-data" }, attempts: [], events: [{ type: "command-blocked", transactionId: null }] });
      expect(snapshot(bad)).toEqual(before);
    }

    expect(undone.session.publicTransactionSequence).toBe(2);
    const legitimateRedo = dispatchPublicCommand(undone.session, Redo());
    expect(legitimateRedo.result).toMatchObject({ kind: "accepted", transaction: { sourceTransactionId: { sequence: 1 }, id: { sequence: 3 } } });
  });

  it("rejects known-shaped forged portal roots and outer-approach cells before history traversal", () => {
    const entered = dispatchPublicCommand(createSimulationSession(withPositions(fixture(), { "player-a": { worldId: "world-a", x: 5, y: 3 } })), Step("down"));
    const record = entered.session.history.past[0]!;
    const portal = record.transaction.events.find((event) => event.type === "portal-traversed")!;
    const wrongRootEvents = record.transaction.events.map((event) => event.type === "portal-traversed" ? { ...event, port: { ...event.port, container: { ...event.port.container, world: { ...event.port.container.world, rootWorldId: "forged-root" } } } } : event);
    const wrongRoot = { ...entered.session, history: { ...entered.session.history, past: [{ ...record, transaction: { ...record.transaction, events: wrongRootEvents } }] } };
    const wrongOuterPrevious = withPositions(record.previousState, { "player-a": { worldId: "world-a", x: 5, y: 2 } });
    const wrongOuterEvents = record.transaction.events.map((event) => event.type === "portal-traversed" ? { ...event, from: { ...event.from, y: 2 } } : event);
    const wrongOuter = {
      ...entered.session,
      history: {
        ...entered.session.history,
        past: [{
          ...record,
          previousState: wrongOuterPrevious,
          transaction: { ...record.transaction, stateHashBefore: hashState(wrongOuterPrevious), events: wrongOuterEvents },
        }],
      },
    };
    for (const forged of [wrongRoot, wrongOuter]) {
      const before = snapshot(forged);
      const result = dispatchPublicCommand(forged, Undo());
      expect(result.session).toBe(forged);
      expect(result.result).toMatchObject({ kind: "rejected", rejection: { code: "invalid-level-data" }, attempts: [] });
      expect(snapshot(forged)).toEqual(before);
    }
    expect(portal.type).toBe("portal-traversed");
  });

  it("requires a non-goal candidate for every goal and searches all overlays deterministically", () => {
    const base = fixture();
    const goalOnly: SimulationState = {
      ...base,
      components: {
        ...base.components,
        positions: { ...base.components.positions, "goal-a": { worldId: "world-a", x: 1, y: 5 }, "goal-c": { worldId: "world-a", x: 1, y: 5 } },
        goals: { "goal-a": {}, "goal-c": {} },
      },
    };
    expect(isWinSatisfied(goalOnly)).toBe(false);

    const withOverlays: SimulationState = {
      ...goalOnly,
      entities: { ...goalOnly.entities, decoy: { id: "decoy" }, matching: { id: "matching" } },
      components: {
        ...goalOnly.components,
        positions: { ...goalOnly.components.positions, decoy: { worldId: "world-a", x: 1, y: 5 }, matching: { worldId: "world-a", x: 1, y: 5 } },
        visuals: { ...goalOnly.components.visuals, decoy: { kind: "player", width: 1, height: 1 }, matching: { kind: "box", width: 1, height: 1 } },
        goals: { "goal-a": { acceptsVisualKind: "box" }, "goal-c": {} },
      },
    };
    expect(isWinSatisfied(withOverlays)).toBe(true);
    const reversed: SimulationState = { ...withOverlays, entities: Object.fromEntries(Object.entries(withOverlays.entities).reverse()) };
    expect(isWinSatisfied(reversed)).toBe(true);

    const multiWorld: SimulationState = {
      ...withOverlays,
      components: {
        ...withOverlays.components,
        positions: { ...withOverlays.components.positions, "goal-c": { worldId: "world-c", x: 1, y: 1 }, matching: { worldId: "world-a", x: 1, y: 5 } },
        goals: { "goal-a": { acceptsVisualKind: "box" }, "goal-c": { acceptsVisualKind: "box" } },
      },
    };
    expect(isWinSatisfied(multiWorld)).toBe(false);
    const allSolved = { ...multiWorld, components: { ...multiWorld.components, positions: { ...multiWorld.components.positions, matching: { worldId: "world-c", x: 1, y: 1 }, "box-a": { worldId: "world-a", x: 1, y: 5 } } } };
    expect(isWinSatisfied(allSolved)).toBe(true);
  });

  it("reverses portal and focus event order with full depth-two occurrence addresses", () => {
    const nested = depthTwoState();
    const enteredOuter = dispatchPublicCommand(createSimulationSession(nested), Step("down"));
    expect(enteredOuter.result.kind === "accepted" && enteredOuter.result.transaction.events).toMatchObject([
      { type: "portal-traversed", mode: "enter", actorAfter: { world: { containerPath: ["container-b"] } } },
      { type: "focus-changed", before: { containerPath: [] }, after: { containerPath: ["container-b"] } },
    ]);
    const enteredInner = dispatchPublicCommand(enteredOuter.session, Step("down"));
    expect(enteredInner.result.kind === "accepted" && enteredInner.result.transaction.events).toMatchObject([
      { type: "portal-traversed", mode: "enter", actorBefore: { world: { containerPath: ["container-b"] } }, actorAfter: { world: { containerPath: ["container-b", "container-e"] } } },
      { type: "focus-changed", before: { containerPath: ["container-b"] }, after: { containerPath: ["container-b", "container-e"] } },
    ]);
    const undo = dispatchPublicCommand(enteredInner.session, Undo());
    expect(undo.result.kind === "accepted" && undo.result.transaction.events).toMatchObject([
      { type: "focus-changed", eventIndex: 0, direction: "reverse", before: { containerPath: ["container-b", "container-e"] }, after: { containerPath: ["container-b"] } },
      { type: "portal-traversed", eventIndex: 1, direction: "reverse", mode: "exit", actorBefore: { world: { containerPath: ["container-b", "container-e"] } }, actorAfter: { world: { containerPath: ["container-b"] } } },
    ]);
    const redo = dispatchPublicCommand(undo.session, Redo());
    expect(redo.result).toMatchObject({ kind: "accepted", transaction: { sourceTransactionId: enteredInner.result.kind === "accepted" ? enteredInner.result.transaction.id : undefined } });
    const exited = dispatchPublicCommand(enteredInner.session, Step("up"));
    expect(exited.result.kind === "accepted" && exited.result.transaction.rule).toBe("exit");
    expect(exited.result.kind === "accepted" && exited.result.transaction.activeAddressAfter).toEqual({ rootWorldId: "world-a", containerPath: ["container-b"] });
    expect(exited.result.kind === "accepted" && exited.result.transaction.events[0]).toMatchObject({ type: "portal-traversed", mode: "exit", actorBefore: { world: { containerPath: ["container-b", "container-e"] } }, actorAfter: { world: { containerPath: ["container-b"] } } });
    const undoExit = dispatchPublicCommand(exited.session, Undo());
    expect(undoExit.result.kind === "accepted" && undoExit.result.transaction.events).toMatchObject([
      { type: "focus-changed", eventIndex: 0, direction: "reverse", before: { containerPath: ["container-b"] }, after: { containerPath: ["container-b", "container-e"] } },
      { type: "portal-traversed", eventIndex: 1, direction: "reverse", mode: "enter", actorBefore: { world: { containerPath: ["container-b"] } }, actorAfter: { world: { containerPath: ["container-b", "container-e"] } } },
    ]);
  });

  it("keeps reset distinct from win and clears future only after a new accepted command", () => {
    const initial = createSimulationSession(fixture());
    const moved = dispatchPublicCommand(initial, Step("right"));
    const reset = dispatchPublicCommand(moved.session, Reset());
    expect(reset.result.kind === "accepted" && reset.result.transaction.events).toMatchObject([{ type: "reset", direction: "forward" }]);
    const undoReset = dispatchPublicCommand(reset.session, Undo());
    expect(undoReset.session.present.components.positions["player-a"]).toEqual({ worldId: "world-a", x: 3, y: 2 });
    const redoReset = dispatchPublicCommand(undoReset.session, Redo());
    expect(redoReset.session.present.components.positions["player-a"]).toEqual({ worldId: "world-a", x: 2, y: 2 });

    const undoMove = dispatchPublicCommand(moved.session, Undo());
    expect(undoMove.session.history.future).toHaveLength(1);
    const fresh = dispatchPublicCommand(undoMove.session, Step("down"));
    expect(fresh.result.kind).toBe("accepted");
    expect(fresh.session.history.future).toEqual([]);
  });

  it("preserves independent portal and reset history event identities", () => {
    const entered = dispatchPublicCommand(createSimulationSession(withPositions(fixture(), { "player-a": { worldId: "world-a", x: 5, y: 3 } })), Step("down"));
    expect(entered.result.kind === "accepted" && entered.result.transaction.events).toMatchObject([
      { type: "portal-traversed", eventIndex: 0, direction: "forward", mode: "enter", port: { portId: "port-b-south" } },
      { type: "focus-changed", eventIndex: 1, direction: "forward", after: { containerPath: ["container-b"] } },
    ]);
    const undoEnter = dispatchPublicCommand(entered.session, Undo());
    expect(undoEnter.result.kind === "accepted" && undoEnter.result.transaction).toMatchObject({ sourceTransactionId: entered.result.kind === "accepted" ? entered.result.transaction.id : undefined, events: [{ type: "focus-changed", eventIndex: 0, direction: "reverse" }, { type: "portal-traversed", eventIndex: 1, direction: "reverse", mode: "exit" }] });
    const redoEnter = dispatchPublicCommand(undoEnter.session, Redo());
    expect(redoEnter.result.kind === "accepted" && redoEnter.result.transaction.events).toMatchObject([{ type: "portal-traversed", eventIndex: 0, direction: "forward", mode: "enter" }, { type: "focus-changed", eventIndex: 1, direction: "forward" }]);

    const moved = dispatchPublicCommand(createSimulationSession(fixture()), Step("right"));
    const reset = dispatchPublicCommand(moved.session, Reset());
    expect(reset.result.kind === "accepted" && reset.result.transaction.events).toMatchObject([{ type: "reset", eventIndex: 0, direction: "forward" }]);
    const undoReset = dispatchPublicCommand(reset.session, Undo());
    expect(undoReset.result.kind === "accepted" && undoReset.result.transaction).toMatchObject({ sourceTransactionId: reset.result.kind === "accepted" ? reset.result.transaction.id : undefined, events: [{ type: "reset", eventIndex: 0, direction: "reverse" }] });
    const redoReset = dispatchPublicCommand(undoReset.session, Redo());
    expect(redoReset.result.kind === "accepted" && redoReset.result.transaction.events).toMatchObject([{ type: "reset", eventIndex: 0, direction: "forward" }]);
  });

  it("replays exit and solved-reset history with exact portal, focus, win, and source identities", () => {
    const exitInitial = createSimulationSession(focusedExitState(0));
    const exited = dispatchPublicCommand(exitInitial, Step("up"));
    const undoneExit = dispatchPublicCommand(exited.session, Undo());
    const redoneExit = dispatchPublicCommand(undoneExit.session, Redo());
    expect(redoneExit.result.kind === "accepted" && redoneExit.result.transaction).toMatchObject({
      rule: "redo",
      sourceTransactionId: exited.result.kind === "accepted" ? exited.result.transaction.id : undefined,
      events: [
        { type: "portal-traversed", eventIndex: 0, direction: "forward", mode: "exit", from: { world: { rootWorldId: "world-a", containerPath: ["container-b"] }, x: 2, y: 0 }, to: { world: { rootWorldId: "world-a", containerPath: [] }, x: 5, y: 3 }, port: { container: { world: { rootWorldId: "world-a", containerPath: [] }, entityId: "container-b" }, portId: "exit" } },
        { type: "focus-changed", eventIndex: 1, direction: "forward", before: { rootWorldId: "world-a", containerPath: ["container-b"] }, after: { rootWorldId: "world-a", containerPath: [] } },
      ],
    });

    const base = fixture();
    const solvedState = withPositions({ ...base, components: { ...base.components, goals: { "goal-a": { acceptsVisualKind: "box" } } } }, { "player-a": { worldId: "world-a", x: 1, y: 5 }, "box-a": { worldId: "world-a", x: 2, y: 5 }, "goal-a": { worldId: "world-a", x: 3, y: 5 } });
    const solved = dispatchPublicCommand(createSimulationSession(withRules(solvedState, ["push", "enter", "exit"])), Step("right"));
    const reset = dispatchPublicCommand(solved.session, Reset());
    expect(reset.result.kind === "accepted" && reset.result.transaction.events).toMatchObject([{ type: "reset", eventIndex: 0, direction: "forward" }, { type: "win-changed", eventIndex: 1, direction: "forward", solved: false }]);
    const undoReset = dispatchPublicCommand(reset.session, Undo());
    expect(undoReset.result.kind === "accepted" && undoReset.result.transaction).toMatchObject({
      sourceTransactionId: reset.result.kind === "accepted" ? reset.result.transaction.id : undefined,
      events: [{ type: "win-changed", eventIndex: 0, direction: "reverse", solved: true }, { type: "reset", eventIndex: 1, direction: "reverse" }],
    });
    const redoReset = dispatchPublicCommand(undoReset.session, Redo());
    expect(redoReset.result.kind === "accepted" && redoReset.result.transaction).toMatchObject({
      sourceTransactionId: reset.result.kind === "accepted" ? reset.result.transaction.id : undefined,
      events: [{ type: "reset", eventIndex: 0, direction: "forward" }, { type: "win-changed", eventIndex: 1, direction: "forward", solved: false }],
    });
  });

  it("uses distinct focus paths for aliased canonical inner worlds through public dispatch", () => {
    const base = fixture();
    const aliased: SimulationState = {
      ...base,
      ruleSet: { ...base.ruleSet, interactionPriority: ["enter", "push", "exit"] },
      entities: { ...base.entities, "container-d": { id: "container-d" } },
      components: {
        ...base.components,
        positions: { ...base.components.positions, "player-a": { worldId: "world-a", x: 7, y: 3 }, "container-d": { worldId: "world-a", x: 7, y: 4 } },
        containers: { ...base.components.containers, "container-d": { innerWorldId: "world-c" } },
        solids: { ...base.components.solids, "container-d": { blocksMovement: true } },
      },
      portTables: [...base.portTables, { containerId: "container-d", ports: [{ id: "d", outerApproach: "down", innerLanding: { x: 3, y: 2 }, innerExit: "up" }] }],
    };
    const entered = dispatchPublicCommand(createSimulationSession(aliased), Step("down"));
    expect(entered.result.kind === "accepted" && entered.result.transaction.activeAddressAfter).toEqual({ rootWorldId: "world-a", containerPath: ["container-d"] });
    expect(entered.result.kind === "accepted" && entered.result.transaction.events[0]).toMatchObject({ type: "portal-traversed", actorAfter: { world: { containerPath: ["container-d"] } } });
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
    components: {
      ...state.components,
      positions: { ...state.components.positions, [id]: position },
      solids: { ...state.components.solids, [id]: { blocksMovement: true } },
    },
  };
}

function withRules(state: SimulationState, interactionPriority: readonly ("push" | "enter" | "exit")[]): SimulationState {
  return { ...state, ruleSet: { ...state.ruleSet, interactionPriority } };
}

function snapshot(session: ReturnType<typeof createSimulationSession>) {
  return { hash: hashState(session.present), history: session.history, focus: session.present.focusPath, sequence: session.publicTransactionSequence };
}

function focusedExitState(landingY: number): SimulationState {
  const base = fixture();
  return {
    ...base,
    activeWorldId: "world-c",
    focusPath: ["container-b"],
    portTables: [{ containerId: "container-b", ports: [{ id: "exit", outerApproach: "down", innerLanding: { x: 2, y: landingY }, innerExit: "up" }] }],
    components: { ...base.components, positions: { ...base.components.positions, "player-a": { worldId: "world-c", x: 2, y: landingY } } },
  };
}

function invalidState(state: SimulationState): SimulationState {
  return { ...state, ruleSet: { ...state.ruleSet, interactionPriority: ["push", "push"] as never } };
}

function reidentifyEvents(events: readonly SemanticEvent[], transactionId: TransactionId): readonly SemanticEvent[] {
  return events.map((event) => event.type === "push-resolved"
    ? { ...event, transactionId, moved: event.moved.map((moved) => ({ ...moved, transactionId })) }
    : { ...event, transactionId });
}

function depthTwoState(): SimulationState {
  const base = fixture();
  return {
    ...base,
    ruleSet: { ...base.ruleSet, interactionPriority: ["enter", "push", "exit"] },
    worlds: { ...base.worlds, "world-d": { id: "world-d", paletteId: "inner-mint", size: { width: 4, height: 4 } } },
    entities: { ...base.entities, "container-e": { id: "container-e" } },
    components: {
      ...base.components,
      positions: { ...base.components.positions, "player-a": { worldId: "world-a", x: 5, y: 3 }, "container-e": { worldId: "world-c", x: 2, y: 3 } },
      containers: { ...base.components.containers, "container-e": { innerWorldId: "world-d" } },
      solids: { ...base.components.solids, "container-e": { blocksMovement: true } },
      pushables: { ...base.components.pushables, "container-e": { pushable: true } },
    },
    portTables: [...base.portTables, { containerId: "container-e", ports: [{ id: "e", outerApproach: "down", innerLanding: { x: 1, y: 0 }, innerExit: "up" }] }],
  };
}
