import { describe, expect, it } from "vitest";
import { Move, Redo, Step, Undo } from "./commands";
import { hashState } from "./hash";
import { replayCommands, replayPublicCommands } from "./replay";
import { createStage4PlayableCoreState } from "./systems";
import { createStage3BSimulationState } from "./worldGraph";

describe("command replay", () => {
  it("replays command arrays into the expected deterministic final hash", () => {
    const result = replayCommands(createStage3BSimulationState(), [
      Move("right"),
      Move("right"),
      Move("right"),
      Move("right"),
    ]);

    expect(result.acceptedCount).toBe(4);
    expect(result.finalHash).toBe(hashState(createStage4PlayableCoreState()));
  });

  it("replays the public bridge with deterministic results and transaction metadata", () => {
    const commands = [Step("right"), Step("right"), Undo(), Redo()];
    const left = replayPublicCommands(createStage3BSimulationState(), commands);
    const right = replayPublicCommands(createStage3BSimulationState(), commands);

    expect(left).toEqual(right);
    expect(left.acceptedCount).toBe(4);
    expect(left.results.map((result) => result.kind)).toEqual(["accepted", "accepted", "accepted", "accepted"]);
  });
});
