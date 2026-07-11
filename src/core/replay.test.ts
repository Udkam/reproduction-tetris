import { describe, expect, it } from "vitest";
import { Redo, Reset, Step, Undo } from "./commands";
import { hashState } from "./hash";
import { createSimulationSession } from "./history";
import { dispatchPublicCommand } from "./reducer";
import { replayPublicCommands } from "./replay";
import { createStage3BSimulationState } from "./worldGraph";

describe("R1 replay", () => {
  it("replays public commands with equal result, hash, address, and semantic traces", () => {
    const initial = createStage3BSimulationState();
    const commands = [Step("right"), Step("down"), Undo(), Redo(), Reset()];
    const left = replayPublicCommands(initial, commands);
    const right = replayPublicCommands(initial, commands);
    expect(left).toEqual(right);

    let session = createSimulationSession(initial);
    const direct = commands.map((command) => {
      const result = dispatchPublicCommand(session, command);
      session = result.session;
      return result.result;
    });
    expect(left.results).toEqual(direct);
    expect(left.finalHash).toBe(hashState(session.present));
  });
});
