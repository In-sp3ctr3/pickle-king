import { describe, expect, it } from "vitest";
import { victoryContext } from "./victory-context";

describe("victoryContext", () => {
  it.each([
    ["target", 11, 6, "Won by 5"],
    ["golden-point", 8, 7, "Golden point"],
    ["buzzer", 6, 4, "Buzzer win"],
    ["ended-early", 5, 2, "Ended early"],
    ["operator-selection", 5, 5, "Operator selected"],
  ] as const)(
    "describes a %s finish",
    (finishReason, scoreA, scoreB, expected) => {
      expect(
        victoryContext({ finishReason, scoreA, scoreB, winner: "A" }),
      ).toBe(expected);
    },
  );

  it("uses the score margin when a completed legacy result has no reason", () => {
    expect(
      victoryContext({ finishReason: null, scoreA: 3, scoreB: 7, winner: "B" }),
    ).toBe("Won by 4");
  });
});
