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
  it("accepts round robin + finals for exactly four players", () => {
    const result = validateSetup(
      players(4),
      numbers,
      "timed",
      "round-robin-finals",
    );

    expect(result.errors.form).toBeUndefined();
    expect(result.values?.players).toHaveLength(4);
  });

  it("rejects round robin + finals for any other field size", () => {
    const result = validateSetup(
      players(5),
      numbers,
      "timed",
      "round-robin-finals",
    );

    expect(result.errors.form).toBe(
      "Round robin + finals requires exactly four players.",
    );
  });
});
