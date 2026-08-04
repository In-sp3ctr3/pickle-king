import { describe, expect, it } from "vitest";
import {
  portraitBracketGeometry,
  portraitRoundBands,
} from "./bracket-share-portrait";

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
      const layout = portraitBracketGeometry(format);

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

  it.each([2, 3, 4])(
    "uses the Story canvas height for a %s-round tree",
    (roundCount) => {
      const layout = portraitBracketGeometry("story");
      const bands = portraitRoundBands(layout, roundCount);

      expect(bands).toHaveLength(roundCount - 1);
      expect(bands.at(-1)?.top).toBeLessThan(layout.final.y);
      expect(layout.final.y - bands[0].top).toBeGreaterThanOrEqual(700);
      for (let index = 1; index < bands.length; index += 1) {
        expect(bands[index].top).toBeGreaterThan(
          bands[index - 1].top + bands[index - 1].height,
        );
      }
    },
  );
});
