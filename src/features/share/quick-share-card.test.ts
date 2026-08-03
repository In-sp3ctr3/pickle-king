import { describe, expect, it } from "vitest";
import { quickShareContextY } from "./quick-share-card";

describe("quick result share geometry", () => {
  it("keeps the Story result context inside the central safe area", () => {
    const baseline = quickShareContextY("story");

    expect(baseline - 24).toBeGreaterThanOrEqual(240);
    expect(baseline + 8).toBeLessThanOrEqual(1640);
  });
});
