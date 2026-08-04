import { describe, expect, it } from "vitest";
import { portraitBracketGeometry } from "./bracket-share-portrait";

describe("portrait bracket geometry", () => {
  it("keeps Story podium medals and labels inside the central safe area", () => {
    const layout = portraitBracketGeometry("story");
    const medalTop = layout.podiumY - 72;
    const labelBottom = layout.podiumY + 84;

    expect(medalTop).toBeGreaterThanOrEqual(240);
    expect(labelBottom).toBeLessThanOrEqual(layout.safeBottom);
  });

  it("reserves a labelled gap between the final and third place", () => {
    const layout = portraitBracketGeometry("story");
    const finalBottom = layout.final.y + layout.final.height;

    expect(layout.bronze.y - finalBottom).toBeGreaterThanOrEqual(36);
  });

  it.each(["feed", "story"] as const)(
    "keeps every 16-player %s round vertically separated",
    (format) => {
      const layout = portraitBracketGeometry(format, 4);

      expect(layout.roundStartY).toBeGreaterThanOrEqual(250);
      expect(layout.final.y).toBeGreaterThan(layout.roundStartY);
      expect(layout.bronze.y).toBeGreaterThan(
        layout.final.y + layout.final.height,
      );
      expect(layout.bronze.y + layout.bronze.height).toBeLessThan(
        layout.podiumY - 54,
      );
    },
  );
});
