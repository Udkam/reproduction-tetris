import { getContainerComponent, getPosition } from "./components";
import { getSolidOccupantsAt } from "./collision";
import { nextPosition } from "./grid";
import { opposite } from "./validation";
import { getEntitiesInWorld, isPositionInsideWorld, resolveWorldAddress } from "./worldGraph";
import type {
  CellAddress,
  ContainerPort,
  Direction,
  EntityId,
  EntityOccurrenceAddress,
  PortOccurrenceAddress,
  Rejection,
  SimulationState,
  WorldAddress,
} from "./types";

export type PortSelection =
  | { readonly kind: "not-applicable" }
  | { readonly kind: "blocked"; readonly rejection: Rejection }
  | {
      readonly kind: "selected";
      readonly containerId: EntityId;
      readonly port: ContainerPort;
      readonly portAddress: PortOccurrenceAddress;
      readonly actorBefore: EntityOccurrenceAddress;
      readonly actorAfter: EntityOccurrenceAddress;
      readonly from: CellAddress;
      readonly to: CellAddress;
      readonly nextWorldAddress: WorldAddress;
    };

export function activeWorldAddress(state: SimulationState): WorldAddress | undefined {
  const resolved = resolveWorldAddress(state, state.focusPath);
  if (!resolved || resolved !== state.activeWorldId) {
    return undefined;
  }
  return { rootWorldId: state.rootWorldId, containerPath: [...state.focusPath] };
}

export function cellAddress(world: WorldAddress, x: number, y: number): CellAddress {
  return { world, x, y };
}

export function selectEntryPort(
  state: SimulationState,
  actorId: EntityId,
  actorPosition: { readonly worldId: string; readonly x: number; readonly y: number },
  direction: Direction,
): PortSelection {
  const active = activeWorldAddress(state);
  if (!active) {
    return { kind: "blocked", rejection: { code: "invalid-level-data", reason: { kind: "validation" }, rule: "enter" } };
  }
  const target = nextPosition(actorPosition, direction);
  const attemptedCell = cellAddress(active, target.x, target.y);
  const containers = getEntitiesInWorld(state, actorPosition.worldId).filter((entity) => {
    const position = getPosition(state, entity.id);
    return Boolean(getContainerComponent(state, entity.id) && position?.x === target.x && position.y === target.y);
  });
  if (containers.length === 0) {
    return { kind: "not-applicable" };
  }
  if (containers.length > 1) {
    return { kind: "blocked", rejection: portRejection("port-ambiguous", "enter", attemptedCell) };
  }
  const containerId = containers[0]?.id;
  const container = containerId ? getContainerComponent(state, containerId) : undefined;
  const table = containerId ? state.portTables.find((entry) => entry.containerId === containerId) : undefined;
  if (!containerId || !container || !table) {
    return { kind: "blocked", rejection: portRejection("port-absent", "enter", attemptedCell) };
  }
  const matches = table.ports.filter((port) => port.outerApproach === direction);
  if (matches.length !== 1) {
    return { kind: "blocked", rejection: portRejection(matches.length === 0 ? "port-absent" : "port-ambiguous", "enter", attemptedCell) };
  }
  const port = matches[0];
  const containerOccurrence: EntityOccurrenceAddress = { world: active, entityId: containerId };
  const portAddress: PortOccurrenceAddress = { container: containerOccurrence, portId: port.id };
  const childAddress: WorldAddress = { rootWorldId: state.rootWorldId, containerPath: [...state.focusPath, containerId] };
  const landing = { worldId: container.innerWorldId, x: port.innerLanding.x, y: port.innerLanding.y };
  if (!isPositionInsideWorld(state, landing)) {
    return { kind: "blocked", rejection: portRejection("port-landing-out-of-bounds", "enter", attemptedCell, portAddress) };
  }
  if (getSolidOccupantsAt(state, landing, actorId).length > 0) {
    return { kind: "blocked", rejection: portRejection("port-landing-occupied", "enter", attemptedCell, portAddress) };
  }
  return {
    kind: "selected",
    containerId,
    port,
    portAddress,
    actorBefore: { world: active, entityId: actorId },
    actorAfter: { world: childAddress, entityId: actorId },
    from: cellAddress(active, actorPosition.x, actorPosition.y),
    to: cellAddress(childAddress, port.innerLanding.x, port.innerLanding.y),
    nextWorldAddress: childAddress,
  };
}

export function selectExitPort(
  state: SimulationState,
  actorId: EntityId,
  actorPosition: { readonly worldId: string; readonly x: number; readonly y: number },
  direction: Direction,
): PortSelection {
  if (state.focusPath.length === 0) {
    return { kind: "not-applicable" };
  }
  const active = activeWorldAddress(state);
  const containerId = state.focusPath.at(-1);
  if (!active || !containerId) {
    return { kind: "blocked", rejection: { code: "invalid-level-data", reason: { kind: "validation" }, rule: "exit" } };
  }
  const parentPath = state.focusPath.slice(0, -1);
  const parentWorldId = resolveWorldAddress(state, parentPath);
  const parentAddress: WorldAddress = { rootWorldId: state.rootWorldId, containerPath: parentPath };
  const container = getContainerComponent(state, containerId);
  const containerPosition = getPosition(state, containerId);
  const table = state.portTables.find((entry) => entry.containerId === containerId);
  if (!parentWorldId || !container || !containerPosition || !table || actorPosition.worldId !== container.innerWorldId) {
    return { kind: "blocked", rejection: { code: "invalid-level-data", reason: { kind: "validation" }, rule: "exit" } };
  }
  const onLanding = table.ports.some((port) => port.innerLanding.x === actorPosition.x && port.innerLanding.y === actorPosition.y);
  const matches = table.ports.filter((port) =>
    port.innerLanding.x === actorPosition.x && port.innerLanding.y === actorPosition.y && port.innerExit === direction,
  );
  const containerOccurrence: EntityOccurrenceAddress = { world: parentAddress, entityId: containerId };
  if (matches.length === 0) {
    return onLanding
      ? { kind: "blocked", rejection: portRejection("port-absent", "exit", cellAddress(active, actorPosition.x, actorPosition.y)) }
      : { kind: "not-applicable" };
  }
  if (matches.length > 1) {
    return { kind: "blocked", rejection: portRejection("port-ambiguous", "exit", cellAddress(active, actorPosition.x, actorPosition.y)) };
  }
  const port = matches[0];
  const portAddress: PortOccurrenceAddress = { container: containerOccurrence, portId: port.id };
  const destination = nextPosition(containerPosition, opposite(port.outerApproach));
  const attemptedCell = cellAddress(parentAddress, destination.x, destination.y);
  if (!isPositionInsideWorld(state, destination)) {
    return { kind: "blocked", rejection: portRejection("port-parent-destination-out-of-bounds", "exit", attemptedCell, portAddress) };
  }
  if (getSolidOccupantsAt(state, destination, actorId).length > 0) {
    return { kind: "blocked", rejection: portRejection("port-parent-destination-occupied", "exit", attemptedCell, portAddress) };
  }
  return {
    kind: "selected",
    containerId,
    port,
    portAddress,
    actorBefore: { world: active, entityId: actorId },
    actorAfter: { world: parentAddress, entityId: actorId },
    from: cellAddress(active, actorPosition.x, actorPosition.y),
    to: attemptedCell,
    nextWorldAddress: parentAddress,
  };
}

function portRejection(
  code: Extract<Rejection["code"], "port-absent" | "port-ambiguous" | "port-landing-out-of-bounds" | "port-landing-occupied" | "port-parent-destination-out-of-bounds" | "port-parent-destination-occupied">,
  rule: "enter" | "exit",
  attemptedCell: CellAddress,
  port?: PortOccurrenceAddress,
): Rejection {
  return { code, reason: { kind: "port" }, rule, attemptedCell, ...(port ? { port } : {}) };
}
