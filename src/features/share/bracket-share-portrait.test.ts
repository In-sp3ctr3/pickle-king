import { describe, expect, it } from "vitest";
import { portraitBracketGeometry } from "./bracket-share-portrait";

describe("portrait bracket geometry", () => {
  it("keeps Story podium medals and labels inside the central safe area", () => {
    const layout = portraitBracketGeometry("story");
    const medalTop = layout.podiumY - 54;
    const labelBottom = layout.podiumY + 84;

    expect(medalTop).toBeGreaterThanOrEqual(240);
    expect(labelBottom).toBeLessThanOrEqual(layout.safeBottom);
  });

  it("reserves a labelled gap between the final and third place", () => {
    const layout = portraitBracketGeometry("story");
    const finalBottom = layout.finalY + layout.cardHeight;

    expect(layout.bronzeY - finalBottom).toBeGreaterThanOrEqual(40);
  });

  it.each(["feed", "story"] as const)(
    "keeps every 16-player %s round vertically separated",
    (format) => {
      const layout = portraitBracketGeometry(format);
      const openingDistance = 3;
      const upperOpeningTop =
        layout.finalY -
        layout.branchGap -
        openingDistance * layout.layerGap -
        layout.cardHeight;
      const lowerOpeningBottom =
        layout.finalY +
        layout.cardHeight +
        layout.branchGap +
        openingDistance * layout.layerGap +
        layout.cardHeight;

      expect(layout.layerGap).toBeGreaterThanOrEqual(layout.cardHeight);
      expect(upperOpeningTop).toBeGreaterThanOrEqual(54);
      expect(lowerOpeningBottom).toBeLessThan(layout.podiumY - 54);
    },
  );
});
