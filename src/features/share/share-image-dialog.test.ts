import { describe, expect, it } from "vitest";
import { initialShareFormat, thumbnailQueue } from "./share-image-dialog";

describe("ShareImageDialog orchestration", () => {
  it("opens portrait composers on Story and full draws on landscape", () => {
    expect(initialShareFormat(["feed", "story"])).toBe("story");
    expect(initialShareFormat(["landscape", "feed", "story"])).toBe("story");
    expect(
      initialShareFormat(["landscape", "feed", "story"], "landscape"),
    ).toBe("landscape");
  });

  it("builds only alternate thumbnails after the selected preview", () => {
    expect(thumbnailQueue(["poster", "frame", "receipt"], "poster")).toEqual([
      "frame",
      "receipt",
    ]);
    expect(thumbnailQueue(["poster", "frame", "receipt"], "frame")).toEqual([
      "poster",
      "receipt",
    ]);
  });
});
