import { describe, expect, it } from "vitest";
import { championCopy } from "./champion-copy";

const base = {
  championName: "Maya",
  comebackCount: 0,
  differential: 8,
  seedKey: "maya:8",
  upsetCount: 0,
  winningMargins: [4, 4],
};

describe("champion copy", () => {
  it("prioritizes a real comeback over generic celebration", () => {
    expect(championCopy({ ...base, comebackCount: 1 })).toMatchObject({
      headline: "Never counted out.",
    });
  });

  it("calls out upset and dominant runs truthfully", () => {
    expect(championCopy({ ...base, upsetCount: 2 }).headline).toBe(
      "Seedings, settled.",
    );
    expect(championCopy({ ...base, differential: 15 }).headline).toBe(
      "Left no doubt.",
    );
  });

  it("keeps fallback copy deterministic", () => {
    expect(championCopy(base)).toEqual(championCopy(base));
  });
});
