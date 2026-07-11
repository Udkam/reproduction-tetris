import type { Direction, EntityId, Rejection, SimulationState, WorldId } from "./types";
import { R1_PRIORITIZED_RULES } from "./types";

export interface ValidationDiagnostic {
  readonly code: "invalid-level-data" | "cycle-forbidden";
  readonly message: string;
  readonly witness?: readonly string[];
}

export type ValidationResult =
  | { readonly kind: "valid" }
  | { readonly kind: "invalid"; readonly diagnostics: readonly ValidationDiagnostic[] };

export type SimulationLoadResult =
  | { readonly kind: "accepted"; readonly state: SimulationState }
  | { readonly kind: "rejected"; readonly diagnostics: readonly ValidationDiagnostic[] };

const COMPONENT_STORES = ["positions", "containers", "solids", "pushables", "players", "goals", "visuals"] as const;
const VISUAL_KINDS = ["player", "box", "recursive-container", "goal"] as const;
const PALETTES = ["void-lab", "inner-mint"] as const;

/** Validates a runtime snapshot. Legal solid occupancy of a port landing is allowed. */
export function validateSimulationState(input: unknown): ValidationResult {
  return validateState(input, "runtime");
}

/** Validates a loadable initial state. Every port landing starts without a solid occupant. */
export function validateInitialSimulationState(input: unknown): ValidationResult {
  return validateState(input, "initial");
}

export function validationRejection(result: ValidationResult): Rejection | undefined {
  if (result.kind === "valid") return undefined;
  return result.diagnostics.some((entry) => entry.code === "cycle-forbidden")
    ? { code: "cycle-forbidden", reason: { kind: "cycle" } }
    : { code: "invalid-level-data", reason: { kind: "validation" } };
}

function validateState(input: unknown, mode: "initial" | "runtime"): ValidationResult {
  const diagnostics: ValidationDiagnostic[] = [];
  const state = structuralState(input, diagnostics);
  if (!state) return { kind: "invalid", diagnostics };
  validateTopLevel(state, diagnostics);
  validateWorldsAndEntities(state, diagnostics);
  validateComponents(state, diagnostics);
  validateRuleSet(state.ruleSet, diagnostics);
  validateFocus(state, diagnostics);
  validatePorts(state, diagnostics, mode);
  validateContainmentGraph(state, diagnostics);
  return diagnostics.length === 0 ? { kind: "valid" } : { kind: "invalid", diagnostics };
}

function structuralState(input: unknown, diagnostics: ValidationDiagnostic[]): RawState | undefined {
  if (!record(input)) return missing("state", diagnostics);
  if (!record(input.worlds)) return missing("worlds", diagnostics);
  if (!record(input.entities)) return missing("entities", diagnostics);
  if (!record(input.components)) return missing("components", diagnostics);
  if (!record(input.ruleSet)) return missing("ruleSet", diagnostics);
  if (!Array.isArray(input.portTables)) return missing("portTables", diagnostics);
  if (!Array.isArray(input.focusPath)) return missing("focusPath", diagnostics);
  const components = input.components;
  for (const name of COMPONENT_STORES) if (!record(components[name])) return missing(`components.${name}`, diagnostics);
  if (Object.keys(components).some((name) => !COMPONENT_STORES.includes(name as (typeof COMPONENT_STORES)[number]))) {
    diagnostics.push(invalid("components contains an unknown store"));
  }
  const ruleSet = input.ruleSet;
  if (!record(ruleSet.ruleEnablement)) return missing("ruleSet.ruleEnablement", diagnostics);
  if (!Array.isArray(ruleSet.interactionPriority)) return missing("ruleSet.interactionPriority", diagnostics);
  for (const [worldId, world] of sortedEntries(input.worlds)) {
    if (!record(world) || !record(world.size)) return missing(`world ${worldId}`, diagnostics);
  }
  for (const [entityId, entity] of sortedEntries(input.entities)) if (!record(entity)) return missing(`entity ${entityId}`, diagnostics);
  for (const storeName of COMPONENT_STORES) {
    const store = components[storeName] as Record<string, unknown>;
    for (const [entityId, component] of sortedEntries(store)) if (!record(component)) return missing(`${storeName}.${entityId}`, diagnostics);
  }
  for (const table of input.portTables) {
    if (!record(table) || !Array.isArray(table.ports)) return missing("port table", diagnostics);
    for (const port of table.ports) if (!record(port) || !record(port.innerLanding)) return missing("port", diagnostics);
  }
  return input as RawState;
}

function validateTopLevel(state: RawState, diagnostics: ValidationDiagnostic[]): void {
  if (state.version !== 1) diagnostics.push(invalid("simulation version must equal 1"));
  for (const field of ["rootWorldId", "activeWorldId", "playerId"] as const) {
    if (!id(state[field])) diagnostics.push(invalid(`${field} must be a non-empty string`));
  }
  for (const [index, value] of state.focusPath.entries()) if (!id(value)) diagnostics.push(invalid(`focusPath[${index}] must be a non-empty string`));
}

function validateWorldsAndEntities(state: RawState, diagnostics: ValidationDiagnostic[]): void {
  for (const [worldId, world] of sortedEntries(state.worlds)) {
    if (!id(worldId) || !id(world.id) || world.id !== worldId) diagnostics.push(invalid(`world ${worldId} has an inconsistent id`));
    if (!positiveInteger(world.size.width) || !positiveInteger(world.size.height)) diagnostics.push(invalid(`world ${worldId} has an invalid size`));
    if (!PALETTES.includes(world.paletteId as (typeof PALETTES)[number])) diagnostics.push(invalid(`world ${worldId} has an unknown palette`));
  }
  if (!id(state.rootWorldId) || !state.worlds[state.rootWorldId]) diagnostics.push(invalid("root world is absent"));
  if (!id(state.activeWorldId) || !state.worlds[state.activeWorldId]) diagnostics.push(invalid("active world is absent"));
  for (const [entityId, entity] of sortedEntries(state.entities)) {
    if (!id(entityId) || !id(entity.id) || entity.id !== entityId) diagnostics.push(invalid(`entity ${entityId} has an inconsistent id`));
  }
}

function validateComponents(state: RawState, diagnostics: ValidationDiagnostic[]): void {
  for (const storeName of COMPONENT_STORES) {
    for (const entityId of Object.keys(state.components[storeName]).sort(compareCodePoints)) {
      if (!state.entities[entityId]) diagnostics.push(invalid(`${storeName} references an absent entity ${entityId}`));
    }
  }
  for (const [entityId, position] of sortedEntries(state.components.positions)) {
    if (!id(position.worldId) || !state.worlds[position.worldId] || !integer(position.x) || !integer(position.y)) {
      diagnostics.push(invalid(`position for ${entityId} is malformed`));
      continue;
    }
    const world = state.worlds[position.worldId];
    if (!positiveInteger(world.size.width) || !positiveInteger(world.size.height)) continue;
    if (position.x < 0 || position.y < 0 || position.x >= world.size.width || position.y >= world.size.height) diagnostics.push(invalid(`position for ${entityId} is out of bounds`));
  }
  const occupied = new Map<string, EntityId>();
  for (const [entityId, solid] of sortedEntries(state.components.solids)) {
    if (solid.blocksMovement !== true) diagnostics.push(invalid(`solid ${entityId} must set blocksMovement to true`));
    const position = state.components.positions[entityId];
    if (!position) {
      diagnostics.push(invalid(`solid ${entityId} has no position`));
      continue;
    }
    const key = cellKey(position.worldId, position.x, position.y);
    const previous = occupied.get(key);
    if (previous) diagnostics.push(invalid(`solid occupancy overlaps ${previous} and ${entityId}`));
    else occupied.set(key, entityId);
  }
  for (const [entityId, container] of sortedEntries(state.components.containers)) {
    if (!id(container.innerWorldId) || !state.worlds[container.innerWorldId]) diagnostics.push(invalid(`container ${entityId} has an invalid world reference`));
    if (!state.components.positions[entityId]) diagnostics.push(invalid(`container ${entityId} has no position`));
    if (state.components.solids[entityId]?.blocksMovement !== true) diagnostics.push(invalid(`container ${entityId} must be solid`));
    if (container.allowsRecursiveCycle === true) diagnostics.push(cycle(`container ${entityId} requests a forbidden cycle mode`));
  }
  for (const [entityId, pushable] of sortedEntries(state.components.pushables)) {
    if (pushable.pushable !== true) diagnostics.push(invalid(`pushable ${entityId} must set pushable to true`));
    if (!state.components.positions[entityId]) diagnostics.push(invalid(`pushable ${entityId} has no position`));
    if (state.components.solids[entityId]?.blocksMovement !== true) diagnostics.push(invalid(`pushable ${entityId} must be solid`));
  }
  const controlled = sortedEntries(state.components.players).filter(([, player]) => player.controlled === true).map(([entityId]) => entityId);
  for (const [entityId, player] of sortedEntries(state.components.players)) if (player.controlled !== true) diagnostics.push(invalid(`player ${entityId} must set controlled to true`));
  if (controlled.length !== 1) diagnostics.push(invalid("exactly one controlled player is required"));
  if (!id(state.playerId) || controlled[0] !== state.playerId) diagnostics.push(invalid("playerId must name the controlled player"));
  if (id(state.playerId)) {
    if (!state.components.positions[state.playerId]) diagnostics.push(invalid("controlled player has no position"));
    if (state.components.solids[state.playerId]?.blocksMovement !== true) diagnostics.push(invalid("controlled player must be solid"));
  }
  for (const [entityId, goal] of sortedEntries(state.components.goals)) {
    if (goal.acceptsVisualKind !== undefined && !VISUAL_KINDS.includes(goal.acceptsVisualKind as (typeof VISUAL_KINDS)[number])) diagnostics.push(invalid(`goal ${entityId} has an invalid acceptsVisualKind`));
    if (!state.components.positions[entityId]) diagnostics.push(invalid(`goal ${entityId} has no position`));
    if (state.components.solids[entityId]) diagnostics.push(invalid(`goal ${entityId} must be non-solid`));
  }
  for (const [entityId, visual] of sortedEntries(state.components.visuals)) {
    if (!VISUAL_KINDS.includes(visual.kind as (typeof VISUAL_KINDS)[number])) diagnostics.push(invalid(`visual ${entityId} has an invalid kind`));
    if (!finitePositive(visual.width) || !finitePositive(visual.height)) diagnostics.push(invalid(`visual ${entityId} has invalid dimensions`));
    if ((visual.offsetX !== undefined && !finite(visual.offsetX)) || (visual.offsetY !== undefined && !finite(visual.offsetY))) diagnostics.push(invalid(`visual ${entityId} has invalid offsets`));
  }
}

function validateRuleSet(ruleSet: RawRuleSet, diagnostics: ValidationDiagnostic[]): void {
  if (ruleSet.version !== 1) diagnostics.push(invalid("rule set version must equal 1"));
  if (ruleSet.cycleMode !== "forbid") diagnostics.push(invalid("rule set cycleMode must equal forbid"));
  const expected = [...R1_PRIORITIZED_RULES].sort(compareCodePoints);
  const keys = Object.keys(ruleSet.ruleEnablement).sort(compareCodePoints);
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) diagnostics.push(invalid("rule enablement does not cover the complete R1 rule set"));
  for (const key of keys) if (!expected.includes(key as (typeof R1_PRIORITIZED_RULES)[number])) diagnostics.push(invalid(`rule enablement contains unknown rule ${key}`));
  for (const rule of R1_PRIORITIZED_RULES) {
    const value = ruleSet.ruleEnablement[rule];
    if (value !== "enabled" && value !== "disabled") diagnostics.push(invalid(`rule enablement ${rule} has an unknown value`));
  }
  const priority = ruleSet.interactionPriority;
  for (const rule of priority) if (!R1_PRIORITIZED_RULES.includes(rule as (typeof R1_PRIORITIZED_RULES)[number])) diagnostics.push(invalid(`interaction priority contains unknown rule ${String(rule)}`));
  const enabled = R1_PRIORITIZED_RULES.filter((rule) => ruleSet.ruleEnablement[rule] === "enabled");
  if (priority.length !== enabled.length || new Set(priority).size !== priority.length || priority.some((rule) => !enabled.includes(rule as (typeof R1_PRIORITIZED_RULES)[number])) || enabled.some((rule) => !priority.includes(rule))) {
    diagnostics.push(invalid("interaction priority must contain every and only enabled rules"));
  }
}

function validateFocus(state: RawState, diagnostics: ValidationDiagnostic[]): void {
  if (!id(state.rootWorldId) || !id(state.activeWorldId) || !state.worlds[state.rootWorldId] || !state.worlds[state.activeWorldId]) return;
  let worldId = state.rootWorldId;
  for (const containerId of state.focusPath) {
    if (!id(containerId)) continue;
    const position = state.components.positions[containerId];
    const container = state.components.containers[containerId];
    if (!position || !container || position.worldId !== worldId) {
      diagnostics.push(invalid(`focus path cannot resolve ${containerId}`));
      return;
    }
    if (!id(container.innerWorldId)) {
      diagnostics.push(invalid(`focus path cannot resolve ${containerId}`));
      return;
    }
    worldId = container.innerWorldId;
  }
  if (worldId !== state.activeWorldId) diagnostics.push(invalid("focus path does not resolve to the active world"));
}

function validatePorts(state: RawState, diagnostics: ValidationDiagnostic[], mode: "initial" | "runtime"): void {
  const tableIds = new Set<string>();
  const landings = new Set<string>();
  const tables = [...state.portTables].sort((left, right) => compareCodePoints(tableKey(left), tableKey(right)));
  for (const table of tables) {
    if (!id(table.containerId) || tableIds.has(table.containerId) || !state.components.containers[table.containerId]) {
      diagnostics.push(invalid(`port table ${sortString(table.containerId)} has no unique container`));
      continue;
    }
    tableIds.add(table.containerId);
    const container = state.components.containers[table.containerId];
    if (!id(container.innerWorldId)) continue;
    const portIds = new Set<string>();
    const approaches = new Set<string>();
    const exits = new Set<string>();
    const ports = [...table.ports].sort((left, right) => compareCodePoints(portKey(left), portKey(right)));
    for (const port of ports) validatePort(state, table.containerId, container.innerWorldId, port, portIds, approaches, exits, landings, diagnostics, mode);
  }
  for (const containerId of Object.keys(state.components.containers).sort(compareCodePoints)) if (!tableIds.has(containerId)) diagnostics.push(invalid(`container ${containerId} has no port table`));
}

function validatePort(
  state: RawState,
  containerId: string,
  innerWorldId: string,
  port: RawPort,
  portIds: Set<string>,
  approaches: Set<string>,
  exits: Set<string>,
  landings: Set<string>,
  diagnostics: ValidationDiagnostic[],
  mode: "initial" | "runtime",
): void {
  const portId = sortString(port.id);
  if (!id(port.id)) diagnostics.push(invalid(`port ${containerId}/${portId} has an invalid id`));
  if (!isDirection(port.outerApproach) || !isDirection(port.innerExit)) diagnostics.push(invalid(`port ${containerId}/${portId} has an unknown direction`));
  if (id(port.id) && portIds.has(port.id)) diagnostics.push(invalid(`port ${containerId}/${portId} duplicates an id`));
  if (isDirection(port.outerApproach) && approaches.has(port.outerApproach)) diagnostics.push(invalid(`port ${containerId}/${portId} duplicates an outer approach`));
  if (isDirection(port.innerExit) && exits.has(port.innerExit)) diagnostics.push(invalid(`port ${containerId}/${portId} duplicates an inner exit`));
  if (id(port.id)) portIds.add(port.id);
  if (isDirection(port.outerApproach)) approaches.add(port.outerApproach);
  if (isDirection(port.innerExit)) exits.add(port.innerExit);
  if (isDirection(port.outerApproach) && isDirection(port.innerExit) && opposite(port.outerApproach) !== port.innerExit) diagnostics.push(invalid(`port ${containerId}/${portId} is not inverse`));
  const world = id(innerWorldId) ? state.worlds[innerWorldId] : undefined;
  if (!world || !positiveInteger(world.size.width) || !positiveInteger(world.size.height) || !integer(port.innerLanding.x) || !integer(port.innerLanding.y) || port.innerLanding.x < 0 || port.innerLanding.y < 0 || port.innerLanding.x >= world.size.width || port.innerLanding.y >= world.size.height) {
    diagnostics.push(invalid(`port ${containerId}/${portId} landing is out of bounds`));
    return;
  }
  const landingKey = cellKey(innerWorldId, port.innerLanding.x, port.innerLanding.y);
  if (landings.has(landingKey)) diagnostics.push(invalid(`port ${containerId}/${portId} landing is duplicated`));
  landings.add(landingKey);
  if (mode === "initial" && solidAt(state, innerWorldId, port.innerLanding.x, port.innerLanding.y)) diagnostics.push(invalid(`port ${containerId}/${portId} landing is occupied`));
}

function validateContainmentGraph(state: RawState, diagnostics: ValidationDiagnostic[]): void {
  const edges = sortedEntries(state.components.containers)
    .flatMap(([containerId, container]) => {
      const position = state.components.positions[containerId];
      return position && id(position.worldId) && id(container.innerWorldId) ? [{ source: position.worldId, containerId, target: container.innerWorldId }] : [];
    })
    .sort((left, right) => compareCodePoints(left.source, right.source) || compareCodePoints(left.containerId, right.containerId) || compareCodePoints(left.target, right.target));
  const bySource = new Map<WorldId, typeof edges>();
  for (const edge of edges) {
    const existing = bySource.get(edge.source) ?? [];
    existing.push(edge);
    bySource.set(edge.source, existing);
  }
  const colors = new Map<WorldId, "gray" | "black">();
  const stack: typeof edges = [];
  const visit = (worldId: WorldId): void => {
    colors.set(worldId, "gray");
    for (const edge of bySource.get(worldId) ?? []) {
      if (edge.source === edge.target || colors.get(edge.target) === "gray") {
        let index = stack.length - 1;
        while (index >= 0 && stack[index]?.source !== edge.target) index -= 1;
        diagnostics.push({ code: "cycle-forbidden", message: "containment graph contains a cycle", witness: [...(index >= 0 ? stack.slice(index) : []), edge].map((item) => item.containerId) });
        continue;
      }
      if (!colors.has(edge.target)) {
        stack.push(edge);
        visit(edge.target);
        stack.pop();
      }
    }
    colors.set(worldId, "black");
  };
  for (const worldId of Object.keys(state.worlds).sort(compareCodePoints)) if (!colors.has(worldId)) visit(worldId);
}

type RawRecord = Record<string, unknown>;
type RawState = RawRecord & {
  readonly version: unknown;
  readonly rootWorldId: unknown;
  readonly activeWorldId: unknown;
  readonly playerId: unknown;
  readonly focusPath: readonly unknown[];
  readonly ruleSet: RawRuleSet;
  readonly portTables: readonly RawPortTable[];
  readonly worlds: Record<string, RawWorld>;
  readonly entities: Record<string, RawEntity>;
  readonly components: RawComponents;
};
type RawWorld = RawRecord & { readonly id: unknown; readonly size: RawRecord & { readonly width: unknown; readonly height: unknown }; readonly paletteId: unknown };
type RawEntity = RawRecord & { readonly id: unknown };
type RawPosition = RawRecord & { readonly worldId: unknown; readonly x: unknown; readonly y: unknown };
type RawContainer = RawRecord & { readonly innerWorldId: unknown; readonly allowsRecursiveCycle?: unknown };
type RawSolid = RawRecord & { readonly blocksMovement: unknown };
type RawPushable = RawRecord & { readonly pushable: unknown };
type RawPlayer = RawRecord & { readonly controlled: unknown };
type RawGoal = RawRecord & { readonly acceptsVisualKind?: unknown };
type RawVisual = RawRecord & { readonly kind: unknown; readonly width: unknown; readonly height: unknown; readonly offsetX?: unknown; readonly offsetY?: unknown };
type RawComponents = RawRecord & {
  readonly positions: Record<string, RawPosition>;
  readonly containers: Record<string, RawContainer>;
  readonly solids: Record<string, RawSolid>;
  readonly pushables: Record<string, RawPushable>;
  readonly players: Record<string, RawPlayer>;
  readonly goals: Record<string, RawGoal>;
  readonly visuals: Record<string, RawVisual>;
};
type RawRuleSet = RawRecord & { readonly version: unknown; readonly cycleMode: unknown; readonly ruleEnablement: Record<string, unknown>; readonly interactionPriority: readonly unknown[] };
type RawPortTable = RawRecord & { readonly containerId: unknown; readonly ports: readonly RawPort[] };
type RawPort = RawRecord & { readonly id: unknown; readonly outerApproach: unknown; readonly innerExit: unknown; readonly innerLanding: RawRecord & { readonly x: unknown; readonly y: unknown } };

function missing(name: string, diagnostics: ValidationDiagnostic[]): undefined {
  diagnostics.push(invalid(`missing or malformed ${name}`));
  return undefined;
}
function invalid(message: string): ValidationDiagnostic { return { code: "invalid-level-data", message }; }
function cycle(message: string): ValidationDiagnostic { return { code: "cycle-forbidden", message }; }
function record(value: unknown): value is RawRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function id(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function integer(value: unknown): value is number { return typeof value === "number" && Number.isInteger(value); }
function positiveInteger(value: unknown): value is number { return integer(value) && value > 0; }
function finite(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
function finitePositive(value: unknown): value is number { return finite(value) && value > 0; }
function isDirection(value: unknown): value is Direction { return value === "up" || value === "down" || value === "left" || value === "right"; }
function solidAt(state: RawState, worldId: string, x: number, y: number): boolean { return Object.keys(state.components.solids).some((entityId) => { const position = state.components.positions[entityId]; return position?.worldId === worldId && position.x === x && position.y === y; }); }
function cellKey(worldId: unknown, x: unknown, y: unknown): string { return `${String(worldId)}\u0000${String(x)}\u0000${String(y)}`; }
function sortString(value: unknown): string { return typeof value === "string" ? value : ""; }
function portKey(port: RawPort): string { return JSON.stringify([sortString(port.id), sortString(port.outerApproach), sortString(port.innerExit), String(port.innerLanding.x), String(port.innerLanding.y)]); }
function tableKey(table: RawPortTable): string { return JSON.stringify([sortString(table.containerId), [...table.ports].map(portKey).sort(compareCodePoints)]); }
function sortedEntries<T>(value: Record<string, T>): [string, T][] { return Object.entries(value).sort(([left], [right]) => compareCodePoints(left, right)); }
function compareCodePoints(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }

export function opposite(direction: Direction): Direction {
  if (direction === "up") return "down";
  if (direction === "down") return "up";
  if (direction === "left") return "right";
  return "left";
}
