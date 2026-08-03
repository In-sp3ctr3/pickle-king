import { afterEach, describe, expect, it, vi } from "vitest";
import { shareFile } from "./share-file";

const file = new File(["image"], "score.png", { type: "image/png" });

afterEach(() => vi.unstubAllGlobals());

describe("shareFile", () => {
  it("reports only that native sharing completed", async () => {
    vi.stubGlobal("navigator", {
      canShare: () => true,
      share: vi.fn().mockResolvedValue(undefined),
    });
    await expect(shareFile(file, "Result")).resolves.toBe("completed");
  });

  it("treats a dismissed share sheet as a silent cancellation", async () => {
    vi.stubGlobal("navigator", {
      canShare: () => true,
      share: vi
        .fn()
        .mockRejectedValue(new DOMException("Closed", "AbortError")),
    });
    await expect(shareFile(file, "Result")).resolves.toBe("cancelled");
  });
});
