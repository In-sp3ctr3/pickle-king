import { describe, expect, it } from "vitest";
import type { SetupPlayerDraft } from "./setup-types";
import { validateSetup } from "./setup-validation";

const numbers = {
  bookingMinutes: "120",
  warmupMinutes: "10",
  transitionSeconds: "60",
  targetScore: "11",
};

function players(count: number): SetupPlayerDraft[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    name: `Player ${index + 1}`,
    rating: "3.5",
  }));
}

describe("setup format validation", () => {
  it.each([4, 5, 6])("accepts round robin + finals for %i players", (count) => {
    const result = validateSetup(
      players(count),
      numbers,
      "timed",
      "round-robin-finals",
    );

    expect(result.errors.form).toBeUndefined();
    expect(result.values?.players).toHaveLength(count);
  });

  it("accepts an untimed six-player round robin", () => {
    const result = validateSetup(
      players(6),
      numbers,
      "untimed",
      "round-robin-finals",
    );

    expect(result.errors.form).toBeUndefined();
  });

  it("rejects round robin + finals above the small-field limit", () => {
    const result = validateSetup(
      players(7),
      numbers,
      "timed",
      "round-robin-finals",
    );

    expect(result.errors.form).toBe(
      "Round robin + finals supports four to six players.",
    );
  });
});
