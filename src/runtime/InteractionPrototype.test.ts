import { describe, expect, it } from "vitest";
import { Redo, Reset, Step, Undo } from "../core/commands";
import { commandFromKeyboardEvent } from "./InteractionPrototype";

describe("keyboard command mapping", () => {
  it("maps every arrow and WASD key into a public Step command", () => {
    const cases = [
      ["ArrowUp", "up"],
      ["w", "up"],
      ["ArrowDown", "down"],
      ["s", "down"],
      ["ArrowLeft", "left"],
      ["a", "left"],
      ["ArrowRight", "right"],
      ["d", "right"],
    ] as const;

    for (const [key, direction] of cases) {
      expect(commandFromKeyboardEvent({ key, shiftKey: false })).toEqual(Step(direction));
    }
  });

  it("retains public Undo, Redo, and Reset mappings", () => {
    expect(commandFromKeyboardEvent({ key: "z", shiftKey: false })).toEqual(Undo());
    expect(commandFromKeyboardEvent({ key: "Z", shiftKey: true })).toEqual(Redo());
    expect(commandFromKeyboardEvent({ key: "Backspace", shiftKey: false })).toEqual(Undo());
    expect(commandFromKeyboardEvent({ key: "y", shiftKey: false })).toEqual(Redo());
    expect(commandFromKeyboardEvent({ key: "r", shiftKey: false })).toEqual(Reset());
  });

  it("does not emit a directionless recursive command for E", () => {
    expect(commandFromKeyboardEvent({ key: "e", shiftKey: false })).toBeNull();
  });
});
