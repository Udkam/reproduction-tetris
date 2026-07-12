import { describe, expect, it } from "vitest";
import { transitionProgressForDirection, visibilityPreservingProgress } from "./RecursiveTransitionRenderer";

describe("RecursiveTransitionRenderer progress sampling", () => {
  it("maps controller progress to enter/exit camera aperture continuity without a clock", () => {
    expect(transitionProgressForDirection("enter", 0)).toBe(0);
    expect(transitionProgressForDirection("enter", 0.5)).toBe(0.5);
    expect(transitionProgressForDirection("enter", 1)).toBe(1);
    expect(transitionProgressForDirection("exit", 0)).toBe(1);
    expect(transitionProgressForDirection("exit", 0.5)).toBe(0.5);
    expect(transitionProgressForDirection("exit", 1)).toBe(0);
  });

  it("uses the same visibility-preserving midpoint for enter and exit without rewriting semantic endpoints", () => {
    expect(visibilityPreservingProgress(0)).toBe(0);
    expect(visibilityPreservingProgress(0.5)).toBe(0.125);
    expect(visibilityPreservingProgress(1)).toBe(1);
    expect(visibilityPreservingProgress(transitionProgressForDirection("enter", 0.5))).toBe(
      visibilityPreservingProgress(transitionProgressForDirection("exit", 0.5)),
    );
  });
});
