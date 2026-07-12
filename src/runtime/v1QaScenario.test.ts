import { describe, expect, it } from "vitest";
import { EventPipeline } from "./EventPipeline";
import { parseV1QaQuery } from "./v1QaScenario";

describe("V1 QA query", () => {
  it("accepts only the exact dev tuple and creates a real public command scenario", () => {
    const scenario = parseV1QaQuery("?qa=v1&case=enter&progress=0.5", true);
    expect(scenario).toMatchObject({ kind: "scenario", case: "enter", progress: 0.5, command: { type: "step", direction: "right" } });
    if (scenario.kind !== "scenario") throw new Error("Expected QA scenario.");
    const result = new EventPipeline().dispatch(scenario.session, scenario.command);
    expect(result.result).toMatchObject({ kind: "accepted", transaction: { rule: "enter" } });
  });

  it("fails closed for repeat, extras, numeric aliases, empty values, and non-dev access", () => {
    for (const search of [
      "?qa=v1&qa=v1&case=move&progress=0.5",
      "?qa=v1&case=move&progress=0.50",
      "?qa=v1&case=enter&progress=1.0",
      "?qa=v1&case=&progress=0.5",
      "?qa=v1&case=unknown&progress=0.5",
      "?qa=v1&case=move&progress=0.5&extra=x",
    ]) {
      expect(parseV1QaQuery(search, true).kind).toBe("invalid-query");
    }
    expect(parseV1QaQuery("?qa=v1&case=move&progress=0.5", false)).toMatchObject({ kind: "invalid-query", reason: "qa-is-dev-only" });
  });

  it("routes move, enter, and exit through real public dispatches", () => {
    for (const [captureCase, progress, rule] of [["move", "0.5", "walk"], ["enter", "0", "enter"], ["exit", "1", "exit"]] as const) {
      const scenario = parseV1QaQuery(`?qa=v1&case=${captureCase}&progress=${progress}`, true);
      if (scenario.kind !== "scenario") throw new Error("Expected QA scenario.");
      expect(new EventPipeline().dispatch(scenario.session, scenario.command).result).toMatchObject({ kind: "accepted", transaction: { rule } });
    }
  });
});
