import { describe, expect, it } from "vitest";
import {
  createScoringState,
  scoringReducer,
  winnerComebackDeficit,
} from "./scoring";

describe("comeback tracking", () => {
  it("recalculates the deficit after undoing an erroneous point", () => {
    let current = createScoringState({
      sideA: { memberIds: ["a"] },
      sideB: { memberIds: ["b"] },
      labelA: "Alex",
      labelB: "Blair",
      targetScore: 11,
      durationMs: null,
    });
    current = scoringReducer(current, { type: "start", now: 0 });
    for (const team of ["B", "B", "B", "B", "A", "A"] as const) {
      current = scoringReducer(current, {
        type: "adjust",
        team,
        delta: 1,
        now: current.scoreA + current.scoreB + 1,
      });
    }
    current = scoringReducer(current, {
      type: "adjust",
      team: "B",
      delta: -1,
      now: 8,
    });
    while (current.status === "running") {
      current = scoringReducer(current, {
        type: "adjust",
        team: "A",
        delta: 1,
        now: current.scoreA + current.scoreB + 10,
      });
    }
    expect(current.scoreEvents.filter((team) => team === "B")).toHaveLength(3);
    expect(winnerComebackDeficit(current)).toBe(3);
  });
});
