import { describe, expect, it } from "vitest";
import { Camera2D } from "./Camera2D";

describe("Camera2D controller samples", () => {
  it("interpolates only when handed controller progress", () => {
    const camera = new Camera2D();
    const target = camera.getFollowState(
      { width: 1000, height: 800 },
      { x: 0, y: 0, width: 960, height: 768 },
      { x: 520, y: 350, width: 90, height: 90 },
      { margin: 72, followStrength: 0.55, maxScale: 1.2 },
    );
    camera.beginFollowTransition(target);
    camera.applyProgress(0.5);
    expect(camera.current.x).not.toBe(target.x);
    camera.applyProgress(1);
    camera.settle();
    expect(camera.current).toEqual(target);
  });

  it("cancels effects without owning a completion callback", () => {
    const camera = new Camera2D();
    camera.beginFollowTransition({ x: 10, y: 20, scale: 1.5 });
    camera.beginImpact(12, -4);
    camera.cancelTransition();
    expect(camera.hasActiveEffects).toBe(false);
  });
});
