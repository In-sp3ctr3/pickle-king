import { afterEach, describe, expect, it, vi } from "vitest";
import { canShareFiles, shareFile, shareFiles } from "./share-file";

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

  it("shares multiple files in one native request", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    const files = [
      file,
      new File(["image 2"], "score-2.png", { type: "image/png" }),
    ];
    vi.stubGlobal("navigator", { canShare, share });

    expect(canShareFiles(files)).toBe(true);
    await expect(shareFiles(files, "Receipts")).resolves.toBe("completed");
    expect(canShare).toHaveBeenCalledWith({ files });
    expect(share).toHaveBeenCalledWith({ files, title: "Receipts" });
  });

  it("rejects an unavailable multi-file share without opening the share sheet", async () => {
    const share = vi.fn();
    vi.stubGlobal("navigator", { canShare: () => false, share });

    await expect(shareFiles([file, file], "Receipts")).rejects.toThrow(
      "File sharing is not available in this browser.",
    );
    expect(share).not.toHaveBeenCalled();
  });
});
