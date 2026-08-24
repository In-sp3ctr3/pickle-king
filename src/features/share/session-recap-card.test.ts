import { describe, expect, it } from "vitest";
import { sessionRecapFileName } from "./session-recap-card";

describe("session recap filenames", () => {
  it("names every dated format page deterministically", () => {
    expect(sessionRecapFileName("AUG 22–23 RECEIPTS", "doubles", 1, 3)).toBe(
      "pickle-king-aug-22-23-doubles-receipts-2-of-3.png",
    );
  });
});
