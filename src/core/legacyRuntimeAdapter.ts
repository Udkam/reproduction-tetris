import {
  Move,
  Redo,
  Reset,
  Undo,
  isPublicCommand,
  type PublicCommand,
  type SimulationCommand,
} from "./commands";
import {
  attachLatestPublicHistoryMetadata,
  withPublicTransactionSequence,
  type SimulationSession,
} from "./history";
import { hashState } from "./hash";
import type {
  AttemptOutcome,
  AttemptRule,
  CellAddress,
  CommandBlockedEvent,
  CommandResult,
  Direction,
  EntityMovedEvent,
  EntityOccurrenceAddress,
  EventDirection,
  InteractionRule,
  NonStepCommand,
  Rejection,
  RejectionCode,
  SemanticEvent,
  SimulationState,
  StateHash,
  Transaction,
  TransactionId,
  TransitionEvent,
  WorldAddress,
} from "./types";

/** The stable runtime-facing envelope consumed by the frontend I1 half. */
export interface PublicDispatchEnvelope {
  readonly session: SimulationSession;
  readonly result: CommandResult;
}

/** Structural legacy seam so this adapter does not import the reducer that calls it. */
export interface LegacyCommandDispatchResult {
  readonly accepted: boolean;
  readonly session: SimulationSession;
  readonly events: readonly TransitionEvent[];
  readonly reason?: string;
}

export type LegacyCommandDispatcher = (
  session: SimulationSession,
  command: SimulationCommand,
) => LegacyCommandDispatchResult;

/**
 * I1-only compatibility bridge. It translates public movement/history commands
 * to the existing legacy kernel; it never chooses a container, port, world, or
 * recursive destination.
 */
export function dispatchWithLegacyRuntimeAdapter(
  session: SimulationSession,
  command: PublicCommand,
  dispatchLegacy: LegacyCommandDispatcher,
): PublicDispatchEnvelope {
  if (!isPublicCommand(command)) {
    throw new TypeError("Invalid PublicCommand.");
  }

  if (command.type === "step") {
    const preflightRejection = validateStepPreflight(session.present);
    if (preflightRejection) {
      return rejectedStep(session, command, preflightRejection, [blockedAttempt("step-fallback", preflightRejection)]);
    }

    try {
      const legacy = dispatchLegacy(session, Move(command.direction));
      if (!legacy.accepted) {
        const rejection = rejectionFromLegacy(legacy, session.present, "step-fallback");
        return rejectedStep(session, command, rejection, rejectedStepAttempts(rejection));
      }

      if (!legacy.events.every((event) => event.type === "move" || event.type === "push")) {
        const rejection = makeRejection("invalid-level-data", { rule: "step-fallback" });
        return rejectedStep(session, command, rejection, rejectedStepAttempts(rejection));
      }

      const transactionId = nextTransactionId(session);
      const events = translateForwardEvents(legacy.events, session.present, transactionId);
      const transaction = makeTransaction(session, legacy.session, command, "pushOrWalk", transactionId, events);
      const nextSession = attachLatestPublicHistoryMetadata(
        withPublicTransactionSequence(legacy.session, transactionId.sequence),
        { transactionId, events },
      );
      const rule = transaction.rule as InteractionRule;
      const attempts = rule === "push"
        ? ([{ kind: "not-applicable", rule: "walk" }, acceptedAttempt("push", transaction)] as const)
        : ([acceptedAttempt("walk", transaction)] as const);

      return {
        session: nextSession,
        result: {
          kind: "accepted",
          command,
          transaction,
          attempts,
        },
      };
    } catch {
      const rejection = makeRejection("invalid-level-data", { rule: "step-fallback" });
      return rejectedStep(session, command, rejection, rejectedStepAttempts(rejection));
    }
  }

  return dispatchHistoryOrReset(session, command, dispatchLegacy);
}

function dispatchHistoryOrReset(
  session: SimulationSession,
  command: NonStepCommand,
  dispatchLegacy: LegacyCommandDispatcher,
): PublicDispatchEnvelope {
  const sourceRecord = command.type === "undo"
    ? session.history.past.at(-1)
    : command.type === "redo"
      ? session.history.future[0]
      : undefined;

  if (command.type === "undo" && !sourceRecord) {
    return rejectedNonStep(session, command, makeRejection("history-empty"));
  }
  if (command.type === "redo" && !sourceRecord) {
    return rejectedNonStep(session, command, makeRejection("future-empty"));
  }
  if (command.type === "reset" && hashState(session.present) === hashState(session.initialState)) {
    return rejectedNonStep(session, command, makeRejection("already-initial-state"));
  }
  if ((command.type === "undo" || command.type === "redo") && !sourceRecord?.publicMetadata) {
    return rejectedNonStep(session, command, makeRejection("invalid-level-data"));
  }

  try {
    const legacyCommand = toLegacyHistoryCommand(command);
    const legacy = dispatchLegacy(session, legacyCommand);
    if (!legacy.accepted) {
      const rejection = command.type === "undo"
        ? makeRejection("history-empty")
        : command.type === "redo"
          ? makeRejection("future-empty")
          : makeRejection("already-initial-state");
      return rejectedNonStep(session, command, rejection);
    }

    const transactionId = nextTransactionId(session);
    const sourceTransactionId = sourceRecord?.publicMetadata?.transactionId;
    const events = command.type === "reset"
      ? ([{ type: "reset", transactionId, eventIndex: 0, direction: "forward" }] as const)
      : rebindEvents(
          sourceRecord?.publicMetadata?.events ?? [],
          transactionId,
          command.type === "undo" ? "reverse" : "forward",
        );
    const transaction = makeTransaction(
      session,
      legacy.session,
      command,
      command.type,
      transactionId,
      events,
      sourceTransactionId,
    );
    const nextWithSequence = withPublicTransactionSequence(legacy.session, transactionId.sequence);
    const nextSession = command.type === "reset"
      ? attachLatestPublicHistoryMetadata(nextWithSequence, { transactionId, events })
      : nextWithSequence;

    return {
      session: nextSession,
      result: {
        kind: "accepted",
        command,
        transaction,
        attempts: [],
      },
    };
  } catch {
    return rejectedNonStep(session, command, makeRejection("invalid-level-data"));
  }
}

function toLegacyHistoryCommand(command: NonStepCommand): SimulationCommand {
  if (command.type === "undo") {
    return Undo();
  }
  if (command.type === "redo") {
    return Redo();
  }
  if (command.type === "reset") {
    return Reset();
  }

  const exhaustive: never = command;
  throw new TypeError(`Invalid PublicCommand: ${String(exhaustive)}`);
}

function rejectedStep(
  session: SimulationSession,
  command: Extract<PublicCommand, { readonly type: "step" }>,
  rejection: Rejection,
  attempts: readonly [AttemptOutcome, ...AttemptOutcome[]],
): PublicDispatchEnvelope {
  const hashes = unchangedStateHashes(session);
  const address = activeAddress(session.present);
  const event = blockedEvent(rejection);

  return {
    session,
    result: {
      kind: "rejected",
      command,
      rejection,
      stateHashBefore: hashes.before,
      stateHashAfter: hashes.after,
      activeAddressBefore: address,
      activeAddressAfter: address,
      attempts,
      events: [event],
    },
  };
}

function rejectedNonStep(
  session: SimulationSession,
  command: NonStepCommand,
  rejection: Rejection,
): PublicDispatchEnvelope {
  const hashes = unchangedStateHashes(session);
  const address = activeAddress(session.present);
  const event = blockedEvent(rejection);

  return {
    session,
    result: {
      kind: "rejected",
      command,
      rejection,
      stateHashBefore: hashes.before,
      stateHashAfter: hashes.after,
      activeAddressBefore: address,
      activeAddressAfter: address,
      attempts: [],
      events: [event],
    },
  };
}

function makeTransaction(
  session: SimulationSession,
  nextSession: SimulationSession,
  command: PublicCommand,
  legacyRule: "pushOrWalk" | "undo" | "redo" | "reset",
  id: TransactionId,
  events: readonly SemanticEvent[],
  sourceTransactionId?: TransactionId,
): Transaction {
  const rule = legacyRule === "pushOrWalk"
    ? (events.some((event) => event.type === "push-resolved") ? "push" : "walk")
    : legacyRule;

  return {
    id,
    command,
    rule,
    ...(sourceTransactionId ? { sourceTransactionId } : {}),
    stateHashBefore: hashState(session.present),
    stateHashAfter: hashState(nextSession.present),
    activeAddressBefore: activeAddress(session.present),
    activeAddressAfter: activeAddress(nextSession.present),
    events,
  };
}

function translateForwardEvents(
  events: readonly TransitionEvent[],
  before: SimulationState,
  transactionId: TransactionId,
): readonly SemanticEvent[] {
  const translated: SemanticEvent[] = [];
  const actorPushes = new Set(events.filter((event) => event.type === "push").map((event) => event.actorId));

  for (const event of events) {
    const eventIndex = translated.length;
    if (event.type === "push") {
      translated.push({
        type: "push-resolved",
        transactionId,
        eventIndex,
        direction: "forward",
        actor: occurrence(
          before,
          event.actorId,
          before.components.positions[event.actorId]?.worldId ?? before.activeWorldId,
        ),
        directionMoved: event.direction,
        moved: event.pushed.map((pushed) => ({
          type: "entity-moved",
          transactionId,
          eventIndex,
          direction: "forward",
          occurrence: occurrence(before, pushed.entityId, pushed.from.worldId),
          from: cellAddress(before, pushed.from),
          to: cellAddress(before, pushed.to),
          cause: "push",
        })),
      });
      continue;
    }

    if (event.type === "move") {
      translated.push({
        type: "entity-moved",
        transactionId,
        eventIndex,
        direction: "forward",
        occurrence: occurrence(before, event.entityId, event.from.worldId),
        from: cellAddress(before, event.from),
        to: cellAddress(before, event.to),
        cause: actorPushes.has(event.entityId) ? "push" : "walk",
      });
    }
  }

  return translated;
}

function rebindEvents(
  sourceEvents: readonly SemanticEvent[],
  transactionId: TransactionId,
  direction: EventDirection,
): readonly SemanticEvent[] {
  const ordered = direction === "reverse" ? [...sourceEvents].reverse() : sourceEvents;
  return ordered.map((event, eventIndex) => rebindEvent(event, transactionId, eventIndex, direction));
}

function rebindEvent(
  event: SemanticEvent,
  transactionId: TransactionId,
  eventIndex: number,
  direction: EventDirection,
): SemanticEvent {
  const reverse = direction === "reverse";

  if (event.type === "entity-moved") {
    return {
      ...event,
      transactionId,
      eventIndex,
      direction,
      from: reverse ? event.to : event.from,
      to: reverse ? event.from : event.to,
    };
  }
  if (event.type === "push-resolved") {
    return {
      ...event,
      transactionId,
      eventIndex,
      direction,
      directionMoved: reverse ? opposite(event.directionMoved) : event.directionMoved,
      moved: event.moved.map((moved) => ({
        ...moved,
        transactionId,
        eventIndex,
        direction,
        from: reverse ? moved.to : moved.from,
        to: reverse ? moved.from : moved.to,
      })),
    };
  }
  if (event.type === "portal-traversed") {
    return {
      ...event,
      transactionId,
      eventIndex,
      direction,
      mode: reverse ? (event.mode === "enter" ? "exit" : "enter") : event.mode,
      actorBefore: reverse ? event.actorAfter : event.actorBefore,
      actorAfter: reverse ? event.actorBefore : event.actorAfter,
      from: reverse ? event.to : event.from,
      to: reverse ? event.from : event.to,
    };
  }
  if (event.type === "focus-changed") {
    return {
      ...event,
      transactionId,
      eventIndex,
      direction,
      before: reverse ? event.after : event.before,
      after: reverse ? event.before : event.after,
    };
  }
  if (event.type === "command-blocked") {
    return {
      ...event,
      transactionId: null,
      eventIndex,
      direction,
    };
  }

  return {
    ...event,
    transactionId,
    eventIndex,
    direction,
  };
}

function rejectedStepAttempts(rejection: Rejection): readonly [AttemptOutcome, ...AttemptOutcome[]] {
  const blockedRule = rejection.code === "target-solid-not-pushable" || rejection.code === "push-chain-out-of-bounds"
    ? "push"
    : rejection.code === "target-out-of-bounds"
      ? "walk"
      : "step-fallback";
  const terminal = blockedAttempt(blockedRule, rejection);
  if (blockedRule === "walk") {
    return [terminal];
  }

  return [{ kind: "not-applicable", rule: "walk" }, terminal];
}

function acceptedAttempt(rule: InteractionRule, transaction: Transaction): AttemptOutcome {
  return { kind: "accepted", rule, transaction };
}

function blockedAttempt(rule: AttemptRule, rejection: Rejection): AttemptOutcome {
  return { kind: "blocked", rule, rejection };
}

function rejectionFromLegacy(
  legacy: LegacyCommandDispatchResult,
  state: SimulationState,
  rule: "step-fallback",
): Rejection {
  const blocked = legacy.events.find((event) => event.type === "blocked");
  const code = toRejectionCode(legacy.reason ?? blocked?.reason);
  const attemptRule = code === "target-solid-not-pushable" || code === "push-chain-out-of-bounds"
    ? "push"
    : code === "target-out-of-bounds"
      ? "walk"
      : rule;
  return makeRejection(code, {
    rule: attemptRule,
    ...(blocked?.attemptedPosition ? { attemptedCell: cellAddress(state, blocked.attemptedPosition) } : {}),
  });
}

function toRejectionCode(reason: string | undefined): RejectionCode {
  if (
    reason === "target-out-of-bounds" ||
    reason === "target-solid-not-pushable" ||
    reason === "push-chain-out-of-bounds"
  ) {
    return reason;
  }

  return "invalid-level-data";
}

function validateStepPreflight(state: SimulationState): Rejection | undefined {
  const actorPosition = state.components.positions[state.playerId];
  if (
    !state.entities[state.playerId] ||
    !state.components.players[state.playerId] ||
    !actorPosition ||
    actorPosition.worldId !== state.activeWorldId
  ) {
    return makeRejection("actor-not-active", { rule: "step-fallback" });
  }

  if (!state.worlds[state.rootWorldId] || !state.worlds[state.activeWorldId]) {
    return makeRejection("focus-invalid", { rule: "step-fallback" });
  }

  let currentWorldId = state.rootWorldId;
  for (const containerId of state.focusPath) {
    const container = state.components.containers[containerId];
    const position = state.components.positions[containerId];
    if (!container || !position || position.worldId !== currentWorldId || !state.worlds[container.innerWorldId]) {
      return makeRejection("focus-invalid", { rule: "step-fallback" });
    }
    currentWorldId = container.innerWorldId;
  }

  return currentWorldId === state.activeWorldId
    ? undefined
    : makeRejection("focus-invalid", { rule: "step-fallback" });
}

function makeRejection(
  code: RejectionCode,
  context: { readonly rule?: "walk" | "push" | "enter" | "exit" | "step-fallback"; readonly attemptedCell?: CellAddress } = {},
): Rejection {
  const kind = code === "actor-not-active"
    ? "actor"
    : code === "focus-invalid"
      ? "focus"
      : code === "target-out-of-bounds" || code === "target-solid-not-pushable"
        ? "target"
        : code === "push-chain-out-of-bounds"
          ? "push"
          : code === "history-empty" || code === "future-empty"
            ? "history"
            : code === "already-initial-state"
              ? "reset"
              : code === "no-enabled-rule-applies"
                ? "step-fallback"
                : code === "cycle-forbidden"
                  ? "cycle"
                  : code.startsWith("port-")
                    ? "port"
                    : "validation";

  return { ...context, code, reason: { kind } } as Rejection;
}

function unchangedStateHashes(session: SimulationSession): { readonly before: StateHash; readonly after: StateHash } {
  const hash = hashState(session.present);
  return { before: hash, after: hash };
}

function blockedEvent(rejection: Rejection): CommandBlockedEvent {
  return {
    type: "command-blocked",
    transactionId: null,
    eventIndex: 0,
    direction: "forward",
    rejection,
  };
}

function nextTransactionId(session: SimulationSession): TransactionId {
  return {
    initialStateHash: hashState(session.initialState),
    sequence: session.publicTransactionSequence + 1,
  };
}

function activeAddress(state: SimulationState): WorldAddress {
  return {
    rootWorldId: state.rootWorldId,
    containerPath: [...state.focusPath],
  };
}

function addressForWorld(state: SimulationState, worldId: string): WorldAddress {
  return worldId === state.activeWorldId
    ? activeAddress(state)
    : { rootWorldId: state.rootWorldId, containerPath: [] };
}

function occurrence(state: SimulationState, entityId: string, worldId: string): EntityOccurrenceAddress {
  return {
    world: addressForWorld(state, worldId),
    entityId,
  };
}

function cellAddress(state: SimulationState, position: { readonly worldId: string; readonly x: number; readonly y: number }): CellAddress {
  return {
    world: addressForWorld(state, position.worldId),
    x: position.x,
    y: position.y,
  };
}

function opposite(direction: Direction): Direction {
  if (direction === "up") {
    return "down";
  }
  if (direction === "down") {
    return "up";
  }
  if (direction === "left") {
    return "right";
  }
  return "left";
}
