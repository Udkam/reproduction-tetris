import { describe, expect, it } from "vitest";
import { Redo, Reset, Step, Undo, type PublicCommand } from "../core/commands";
import { VisualTransactionController } from "./VisualTransactionController";

describe("VisualTransactionController", () => {
  it("uses one FIFO slot for every public command and never dispatches overflow", () => {
    const controller = new VisualTransactionController();
    const dispatched: PublicCommand[] = [];
    const completions: boolean[] = [];
    const dispatch = (command: PublicCommand) => {
      dispatched.push(command);
      controller.start({
        durationMs: 100,
        onProgress: () => undefined,
        onComplete: () => completions.push(controller.isActive),
      });
    };

    expect(controller.submit(Step("right"), dispatch)).toEqual({ kind: "dispatched" });
    expect(controller.submit(Undo(), dispatch)).toEqual({ kind: "buffered" });
    expect(controller.submit(Redo(), dispatch)).toEqual({ kind: "input-buffer-full" });
    expect(controller.submit(Reset(), dispatch)).toEqual({ kind: "input-buffer-full" });
    expect(dispatched).toEqual([Step("right")]);

    controller.advance(1_000);
    expect(completions).toEqual([true]);
    expect(dispatched).toEqual([Step("right"), Undo()]);
    controller.cancel();
    expect(dispatched).toEqual([Step("right"), Undo()]);
  });

  it("commits no-presentation synchronously and ignores invalid elapsed values", () => {
    const controller = new VisualTransactionController();
    const samples: number[] = [];
    let completed = 0;
    controller.start({ durationMs: Number.NaN, onProgress: (progress) => samples.push(progress), onComplete: () => completed += 1 });
    expect(samples).toEqual([0, 1]);
    expect(completed).toBe(1);
    expect(controller.isActive).toBe(false);

    controller.start({ durationMs: 100, onProgress: (progress) => samples.push(progress), onComplete: () => completed += 1 });
    controller.advance(Number.POSITIVE_INFINITY);
    expect(controller.progress).toBe(0);
  });

  it("cancels through p=1 but destroy aborts without p=1, completion, or drain", () => {
    const cancelled = new VisualTransactionController();
    const cancelledSamples: number[] = [];
    cancelled.start({ durationMs: 100, onProgress: (progress) => cancelledSamples.push(progress), onComplete: () => undefined });
    cancelled.cancel();
    expect(cancelledSamples).toEqual([0, 1]);

    const destroyed = new VisualTransactionController();
    const samples: number[] = [];
    let completed = 0;
    let drained = 0;
    destroyed.start({ durationMs: 100, onProgress: (progress) => samples.push(progress), onComplete: () => completed += 1 });
    destroyed.submit(Undo(), () => drained += 1);
    destroyed.destroy();
    destroyed.advance(1_000);
    expect(samples).toEqual([0]);
    expect(completed).toBe(0);
    expect(drained).toBe(0);
  });

  it("does not drain when a completion callback destroys the runtime owner", () => {
    const controller = new VisualTransactionController();
    let drained = 0;
    controller.start({ durationMs: 1, onProgress: () => undefined, onComplete: () => controller.destroy() });
    controller.submit(Undo(), () => drained += 1);
    controller.advance(1);
    expect(drained).toBe(0);
    expect(controller.isActive).toBe(false);
  });

  it("keeps dispatch reserved through synchronous completion and drains only after callback return", () => {
    const controller = new VisualTransactionController();
    const order: string[] = [];
    const dispatch = (command: PublicCommand) => {
      order.push(`dispatch:${command.type}`);
      if (command.type === "step") {
        expect(controller.submit(Undo(), dispatch)).toEqual({ kind: "buffered" });
        expect(controller.submit(Redo(), dispatch)).toEqual({ kind: "input-buffer-full" });
        controller.start({
          durationMs: 0,
          onProgress: () => undefined,
          onComplete: () => order.push("complete:step"),
        });
        order.push("returned:step");
      } else {
        order.push(`drained:${command.type}`);
      }
    };

    controller.submit(Step("right"), dispatch);
    expect(order).toEqual(["dispatch:step", "complete:step", "returned:step", "dispatch:undo", "drained:undo"]);
  });

  it("drains a reentrant command when dispatch returns without starting a presentation", () => {
    const controller = new VisualTransactionController();
    const order: string[] = [];
    const dispatch = (command: PublicCommand) => {
      order.push(`dispatch:${command.type}`);
      if (command.type === "step") {
        expect(controller.submit(Undo(), dispatch)).toEqual({ kind: "buffered" });
        order.push("returned:step-without-presentation");
      }
    };

    expect(controller.submit(Step("right"), dispatch)).toEqual({ kind: "dispatched" });
    expect(order).toEqual([
      "dispatch:step",
      "returned:step-without-presentation",
      "dispatch:undo",
    ]);
    expect(controller.hasBufferedCommand).toBe(false);
  });

  it("buffers a command submitted from onComplete and drains it after completion returns", () => {
    const controller = new VisualTransactionController();
    const order: string[] = [];
    const dispatch = (command: PublicCommand) => order.push(`dispatch:${command.type}`);

    controller.start({
      durationMs: 10,
      onProgress: () => undefined,
      onComplete: () => {
        order.push("complete:start");
        expect(controller.submit(Undo(), dispatch)).toEqual({ kind: "buffered" });
        order.push("complete:end");
      },
    });
    controller.advance(10);

    expect(order).toEqual(["complete:start", "complete:end", "dispatch:undo"]);
    expect(controller.hasBufferedCommand).toBe(false);
  });

  it("drains Undo, Redo, and Reset uniformly when each occupies the one slot", () => {
    for (const buffered of [Undo(), Redo(), Reset()] as const) {
      const controller = new VisualTransactionController();
      const dispatched: PublicCommand[] = [];
      const dispatch = (command: PublicCommand) => {
        dispatched.push(command);
        controller.start({ durationMs: 20, onProgress: () => undefined, onComplete: () => undefined });
      };
      controller.submit(Step("right"), dispatch);
      expect(controller.submit(buffered, dispatch)).toEqual({ kind: "buffered" });
      controller.cancel();
      expect(dispatched).toEqual([Step("right"), buffered]);
    }
  });
});
