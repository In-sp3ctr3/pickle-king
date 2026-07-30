import { describe, expect, it, vi } from "vitest";
import { promptForCorrection } from "./correction-prompt";

const sides = {
  sideA: { id: "a", label: "Alex" },
  sideB: { id: "b", label: "Blair" },
};

describe("correction prompt", () => {
  it("treats cancellation as no correction", () => {
    expect(
      promptForCorrection({
        ...sides,
        currentScoreA: 11,
        currentScoreB: 5,
        currentWinnerId: "a",
        prompt: vi.fn().mockReturnValue(null),
      }),
    ).toBeNull();
  });

  it("requires an explicit participant for a corrected tie", () => {
    const prompt = vi
      .fn()
      .mockReturnValueOnce("5")
      .mockReturnValueOnce("5")
      .mockReturnValueOnce("Blair");
    expect(
      promptForCorrection({
        ...sides,
        currentScoreA: 11,
        currentScoreB: 5,
        currentWinnerId: "a",
        prompt,
      }),
    ).toEqual({ scoreA: 5, scoreB: 5, winnerIdOverride: "b" });
  });
});
