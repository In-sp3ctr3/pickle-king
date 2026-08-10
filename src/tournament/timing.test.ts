import { describe, expect, it } from "vitest";
import {
  calculateMatchCap,
  plannedMatchCount,
  rebalanceRemainingCap,
} from "./timing";

describe("tournament timing", () => {
  it.each(Array.from({ length: 13 }, (_, index) => index + 4))(
    "keeps a %i-player session inside the booking",
    (entrantCount) => {
      const result = calculateMatchCap({
        entrantCount,
        bookingMinutes: 120,
        warmupMinutes: 10,
        transitionSeconds: 60,
      });
      const used =
        result.capMs * result.totalMatches +
        result.transitionCount * 60_000 +
        10 * 60_000;
      expect(result.totalMatches).toBe(entrantCount);
      expect(used).toBeLessThanOrEqual(120 * 60_000);
    },
  );

  it("rejects a booking that cannot allocate a second per match", () => {
    expect(() =>
      calculateMatchCap({
        entrantCount: 16,
        bookingMinutes: 2,
        warmupMinutes: 1,
        transitionSeconds: 60,
      }),
    ).toThrow(/too short/i);
  });

  it.each([
    [4, 8],
    [5, 12],
    [6, 17],
  ])(
    "allocates every match and transition for %i-player round robin finals",
    (entrantCount, totalMatches) => {
      const result = calculateMatchCap({
        entrantCount,
        format: "round-robin-finals",
        bookingMinutes: 120,
        warmupMinutes: 10,
        transitionSeconds: 60,
      });
      expect(result.totalMatches).toBe(totalMatches);
      expect(result.transitionCount).toBe(totalMatches - 1);
      expect(plannedMatchCount(entrantCount, "round-robin-finals")).toBe(
        totalMatches,
      );
    },
  );

  it.each([3, 7])("rejects a %i-player round robin", (entrantCount) => {
    expect(() => plannedMatchCount(entrantCount, "round-robin-finals")).toThrow(
      /4 to 6/i,
    );
  });

  it("rejects negative values that would manufacture play time", () => {
    expect(() =>
      calculateMatchCap({
        entrantCount: 8,
        bookingMinutes: 120,
        warmupMinutes: -10,
        transitionSeconds: -60,
      }),
    ).toThrow(/invalid/i);
  });

  it("preserves an on-track cap and evenly reduces a delayed schedule", () => {
    expect(
      rebalanceRemainingCap({
        now: 0,
        sessionDeadline: 100_000,
        remainingMatches: 2,
        transitionSeconds: 10,
        currentCapMs: 30_000,
      }),
    ).toEqual({ capMs: 30_000, reduced: false });
    expect(
      rebalanceRemainingCap({
        now: 50_000,
        sessionDeadline: 100_000,
        remainingMatches: 2,
        transitionSeconds: 10,
        currentCapMs: 30_000,
      }),
    ).toEqual({ capMs: 20_000, reduced: true });
  });
});
