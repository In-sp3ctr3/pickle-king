import { describe, expect, it } from "vitest";
import {
  quickShareFileName,
  quickShareHeading,
  quickShareTemplatePath,
} from "./quick-share-card";
import { quickWinnerLines } from "./quick-share-layout-helpers";

describe("quick result share geometry", () => {
  it("names every style and format distinctly", () => {
    expect(quickShareFileName("poster", "feed")).toBe(
      "pickle-king-score-result-poster-feed.png",
    );
    expect(quickShareFileName("frame", "story")).toBe(
      "pickle-king-score-result-frame-story.png",
    );
    expect(quickShareFileName("receipt", "feed")).toBe(
      "pickle-king-score-result-receipt-feed.png",
    );
  });

  it("preserves every word in a two-line winner treatment", () => {
    expect(quickWinnerLines("Ana Maria De La Cruz")).toEqual([
      "Ana Maria",
      "De La Cruz",
    ]);
    expect(quickWinnerLines("Samantha Elizabeth Richa")).toEqual([
      "Samantha",
      "Elizabeth Richa",
    ]);
  });

  it("splits an unbroken long first name without losing graphemes", () => {
    const lines = quickWinnerLines(
      "Alexandrianna",
      (line) => Array.from(line).length <= 7,
    );
    expect(lines).toHaveLength(2);
    expect(lines.join("")).toBe("Alexandrianna");
    expect(lines.every((line) => Array.from(line).length <= 7)).toBe(true);
  });

  it("keeps a sixteen-character first-name and initial complete", () => {
    expect(quickWinnerLines("Jean-Baptiste M.")).toEqual([
      "Jean-Baptiste",
      "M.",
    ]);
  });

  it("uses real format and date copy without inventing match ceremony", () => {
    expect(quickShareHeading("SINGLES", "AUG 22")).toEqual([
      "SINGLES",
      "AUG 22",
    ]);
    expect(quickShareHeading("DOUBLES", "AUG 22", "Semifinal")).toEqual([
      "DOUBLES",
      "SEMIFINAL · AUG 22",
    ]);
  });

  it("selects a distinct reference base for every treatment and format", () => {
    expect(quickShareTemplatePath("poster", "feed")).toBe(
      "/share/templates/quick-poster-feed.webp",
    );
    expect(quickShareTemplatePath("receipt", "story")).toBe(
      "/share/templates/quick-receipt-story.webp",
    );
  });
});
