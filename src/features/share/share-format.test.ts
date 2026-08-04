import { describe, expect, it } from "vitest";
import {
  bracketShareDimensions,
  bracketShareFormatLabel,
  shareFormatLabel,
} from "./share-format";

describe("share formats", () => {
  it("uses production Post and Story / Reel labels", () => {
    expect(shareFormatLabel("feed")).toBe("Post");
    expect(shareFormatLabel("story")).toBe("Story / Reel");
  });

  it("contracts every bracket canvas dimension", () => {
    expect(bracketShareDimensions("landscape")).toEqual({
      height: 1200,
      width: 1600,
    });
    expect(bracketShareDimensions("feed")).toEqual({
      height: 1350,
      width: 1080,
    });
    expect(bracketShareDimensions("story")).toEqual({
      height: 1920,
      width: 1080,
    });
    expect(bracketShareFormatLabel("landscape")).toBe("Full draw");
  });
});
