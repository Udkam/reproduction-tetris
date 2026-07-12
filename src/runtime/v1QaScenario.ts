import { Step, type PublicCommand } from "../core/commands";
import { createSimulationSession, type SimulationSession } from "../core/history";
import type { SimulationState } from "../core/types";

export type V1QaCase = "move" | "enter" | "exit";

export interface V1QaScenario {
  readonly kind: "scenario";
  readonly case: V1QaCase;
  readonly progress: 0 | 0.5 | 1;
  readonly session: SimulationSession;
  readonly command: PublicCommand;
}

export type V1QaQuery =
  | { readonly kind: "normal" }
  | V1QaScenario
  | { readonly kind: "invalid-query"; readonly reason: string };

/**
 * A deliberately narrow dev capture surface. The parser treats the query as a
 * complete tuple rather than accepting browser-normalized numeric spellings.
 */
export function parseV1QaQuery(search: string, isDev: boolean): V1QaQuery {
  const params = new URLSearchParams(search);
  const entries = [...params.entries()];
  const hasQaField = entries.some(([key]) => key === "qa" || key === "case" || key === "progress");
  if (!hasQaField) return { kind: "normal" };
  if (!isDev) return { kind: "invalid-query", reason: "qa-is-dev-only" };

  const allowed = new Set(["qa", "case", "progress"]);
  if (entries.length !== 3 || entries.some(([key]) => !allowed.has(key))) {
    return { kind: "invalid-query", reason: "qa-query-must-contain-only-one-qa-case-progress-tuple" };
  }

  const value = (key: string) => entries.filter(([entryKey]) => entryKey === key).map(([, entryValue]) => entryValue);
  const qa = value("qa");
  const captureCase = value("case");
  const progress = value("progress");
  if (qa.length !== 1 || captureCase.length !== 1 || progress.length !== 1) {
    return { kind: "invalid-query", reason: "qa-case-progress-must-each-appear-exactly-once" };
  }
  if (qa[0] !== "v1" || !isQaCase(captureCase[0])) {
    return { kind: "invalid-query", reason: "unknown-qa-case" };
  }
  if (!isExactProgress(captureCase[0], progress[0])) {
    return { kind: "invalid-query", reason: "invalid-qa-progress" };
  }

  return {
    kind: "scenario",
    case: captureCase[0],
    progress: Number(progress[0]) as 0 | 0.5 | 1,
    session: createSimulationSession(createQaState(captureCase[0])),
    command: captureCase[0] === "exit" ? Step("left") : Step("right"),
  };
}

function isQaCase(value: string | undefined): value is V1QaCase {
  return value === "move" || value === "enter" || value === "exit";
}

function isExactProgress(captureCase: V1QaCase, value: string | undefined) {
  if (captureCase === "move") return value === "0.5";
  return value === "0" || value === "0.5" || value === "1";
}

/** Inline synthetic states are QA composition data, never authored levels. */
function createQaState(captureCase: V1QaCase): SimulationState {
  const inChild = captureCase === "exit";
  return {
    version: 1,
    rootWorldId: "qa-root",
    activeWorldId: inChild ? "qa-inner" : "qa-root",
    playerId: "qa-actor",
    focusPath: inChild ? ["qa-aperture"] : [],
    ruleSet: {
      version: 1,
      cycleMode: "forbid",
      ruleEnablement: { push: "enabled", enter: "enabled", exit: "enabled" },
      interactionPriority: ["enter", "push", "exit"],
    },
    portTables: [{
      containerId: "qa-aperture",
      ports: [{ id: "qa-port", outerApproach: "right", innerLanding: { x: 0, y: 0 }, innerExit: "left" }],
    }],
    worlds: {
      "qa-root": { id: "qa-root", paletteId: "void-lab", size: { width: 7, height: 5 } },
      "qa-inner": { id: "qa-inner", paletteId: "inner-mint", size: { width: 5, height: 4 } },
    },
    entities: {
      "qa-actor": { id: "qa-actor" },
      "qa-aperture": { id: "qa-aperture" },
      "qa-crate": { id: "qa-crate" },
    },
    components: {
      positions: {
        "qa-actor": inChild
          ? { worldId: "qa-inner", x: 0, y: 0 }
          : captureCase === "enter" ? { worldId: "qa-root", x: 2, y: 2 } : { worldId: "qa-root", x: 1, y: 2 },
        "qa-aperture": { worldId: "qa-root", x: 3, y: 2 },
        "qa-crate": { worldId: "qa-inner", x: 3, y: 2 },
      },
      containers: { "qa-aperture": { innerWorldId: "qa-inner" } },
      solids: {
        "qa-actor": { blocksMovement: true },
        "qa-aperture": { blocksMovement: true },
        "qa-crate": { blocksMovement: true },
      },
      pushables: { "qa-crate": { pushable: true } },
      players: { "qa-actor": { controlled: true } },
      goals: {},
      visuals: {
        "qa-actor": { kind: "player", width: 1.1, height: 1.1 },
        "qa-aperture": { kind: "recursive-container", width: 1.5, height: 1.5 },
        "qa-crate": { kind: "box", width: 1.1, height: 1.1 },
      },
    },
  };
}
