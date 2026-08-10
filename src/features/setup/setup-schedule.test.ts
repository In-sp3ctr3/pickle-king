import { describe, expect, it } from "vitest";
import { setupScheduleCopy } from "./setup-schedule";

const numbers = {
  bookingMinutes: "120",
  warmupMinutes: "10",
  transitionSeconds: "60",
  targetScore: "11",
};

describe("round-robin setup schedule copy", () => {
  it.each([
    [4, "8 matches · 4 per player · 12 min 52 sec cap each"],
    [5, "12 matches · 4–5 per player · 8 min 15 sec cap each"],
    [6, "17 matches · 5–6 per player · 5 min 31 sec cap each"],
  ])("summarizes a timed %i-player schedule", (playerCount, summary) => {
    expect(
      setupScheduleCopy({
        format: "round-robin-finals",
        numbers,
        playerCount,
        timingMode: "timed",
      }).summary,
    ).toBe(summary);
  });

  it("warns only when a timed cap is below eight minutes", () => {
    expect(
      setupScheduleCopy({
        format: "round-robin-finals",
        numbers,
        playerCount: 5,
        timingMode: "timed",
      }).advisory,
    ).toBeUndefined();
    expect(
      setupScheduleCopy({
        format: "round-robin-finals",
        numbers,
        playerCount: 6,
        timingMode: "timed",
      }).advisory,
    ).toContain("Tight timed schedule · 5 min 31 sec per match.");
  });

  it("never warns or mentions duration when untimed", () => {
    expect(
      setupScheduleCopy({
        format: "round-robin-finals",
        numbers,
        playerCount: 6,
        timingMode: "untimed",
      }),
    ).toEqual({ summary: "17 matches · 5–6 per player" });
  });
});
