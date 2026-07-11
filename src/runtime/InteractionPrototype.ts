import { Redo, Reset, Step, Undo, type PublicCommand } from "../core/commands";

export interface InteractionPrototypeOptions {
  onCommand: (command: PublicCommand) => void;
}

export class InteractionPrototype {
  private enabled = false;
  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) {
      return;
    }

    const command = commandFromKeyboardEvent(event);
    if (!command) {
      return;
    }

    event.preventDefault();
    this.options.onCommand(command);
  };

  constructor(private readonly options: InteractionPrototypeOptions) {}

  start() {
    if (this.enabled) {
      return;
    }

    window.addEventListener("keydown", this.handleKeyDown);
    this.enabled = true;
  }

  destroy() {
    if (!this.enabled) {
      return;
    }

    window.removeEventListener("keydown", this.handleKeyDown);
    this.enabled = false;
  }
}

export function commandFromKeyboardEvent(
  event: Pick<KeyboardEvent, "key" | "shiftKey">,
): PublicCommand | null {
  const key = event.key.toLowerCase();

  if (key === "arrowup" || key === "w") {
    return Step("up");
  }
  if (key === "arrowdown" || key === "s") {
    return Step("down");
  }
  if (key === "arrowleft" || key === "a") {
    return Step("left");
  }
  if (key === "arrowright" || key === "d") {
    return Step("right");
  }
  if (key === "z") {
    return event.shiftKey ? Redo() : Undo();
  }
  if (key === "backspace") {
    return Undo();
  }
  if (key === "y") {
    return Redo();
  }
  if (key === "r") {
    return Reset();
  }
  return null;
}
