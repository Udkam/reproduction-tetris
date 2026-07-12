import { describe, expect, it, vi } from "vitest";
import { Redo, Reset, Step, Undo } from "../core/commands";
import { createSimulationSession } from "../core/history";
import { createStage3BSimulationState } from "../core/worldGraph";
import type { AudioCue } from "../animation/transitions";

type ControllerHarness = {
  start(options: { durationMs: number; onProgress(progress: number, running: boolean): void; onComplete(): void }): void;
  cancel(): void;
  destroy(): void;
};
const harness = vi.hoisted(() => ({ controller: null as ControllerHarness | null, destroyed: 0 }));

vi.mock("../render/PixiApp", () => ({
  PixiApp: class {
    constructor(_host: HTMLElement, _projection: unknown, controller: { start(options: { durationMs: number; onProgress(progress: number, running: boolean): void; onComplete(): void }): void; cancel(): void; destroy(): void }) {
      harness.controller = controller;
    }
    async init() {}
    render() {}
    renderWithAnimation(_from: unknown, _to: unknown, plan: { durationMs: number }) {
      harness.controller!.start({
        durationMs: plan.durationMs,
        onProgress: () => undefined,
        onComplete: () => undefined,
      });
    }
    destroy() { harness.destroyed += 1; }
    getQaSnapshot() { return {}; }
  },
}));

vi.mock("./InteractionPrototype", () => ({
  InteractionPrototype: class {
    constructor(_options: unknown) {}
    start() {}
    destroy() {}
  },
}));

import { GameRuntime } from "./GameRuntime";

describe("GameRuntime visual transaction boundary", () => {
  it("dispatches audio only at actual command dispatch, not buffer/overflow, and drains once", async () => {
    const played: AudioCue[][] = [];
    const runtime = new GameRuntime({} as HTMLElement, {
      session: createSimulationSession(createStage3BSimulationState()),
      audio: { playAll: (cues) => played.push([...cues]) },
    });
    await runtime.start();

    expect(runtime.submit(Step("right"))).toEqual({ kind: "dispatched" });
    expect(runtime.submit(Undo())).toEqual({ kind: "buffered" });
    expect(runtime.submit(Redo())).toEqual({ kind: "input-buffer-full" });
    expect(runtime.submit(Reset())).toEqual({ kind: "input-buffer-full" });
    expect(played).toHaveLength(1);

    harness.controller?.cancel();
    expect(played).toHaveLength(2);
    runtime.destroy();
  });

  it("invalidates the controller before display teardown", async () => {
    const runtime = new GameRuntime({} as HTMLElement, { session: createSimulationSession(createStage3BSimulationState()) });
    await runtime.start();
    expect(runtime.submit(Step("right"))).toEqual({ kind: "dispatched" });
    runtime.destroy();
    harness.controller?.cancel();
    expect(runtime.submit(Undo())).toEqual({ kind: "destroyed" });
  });

  it("reserves A across reentrant audio so B buffers once and overflow stays local", async () => {
    const played: AudioCue[][] = [];
    const outcomes: unknown[] = [];
    let runtime: GameRuntime | null = null;
    let reentered = false;
    runtime = new GameRuntime({} as HTMLElement, {
      session: createSimulationSession(createStage3BSimulationState()),
      audio: {
        playAll: (cues) => {
          played.push([...cues]);
          if (!reentered) {
            reentered = true;
            outcomes.push(runtime?.submit(Undo()));
            outcomes.push(runtime?.submit(Redo()));
          }
        },
      },
    });
    await runtime.start();

    expect(runtime.submit(Step("right"))).toEqual({ kind: "dispatched" });
    expect(outcomes).toEqual([{ kind: "buffered" }, { kind: "input-buffer-full" }]);
    expect(played).toHaveLength(1);
    harness.controller?.cancel();
    expect(played).toHaveLength(2);
    runtime.destroy();
  });
});
