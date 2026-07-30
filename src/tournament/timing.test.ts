import { describe, expect, it } from "vitest";
import { calculateMatchCap, rebalanceRemainingCap } from "./timing";

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
