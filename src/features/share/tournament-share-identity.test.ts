import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bracketMatchPalette } from "./bracket-share-match";
import { shareColors } from "./share-canvas";
import { tournamentStatsTableGeometry } from "./tournament-stats-card";

const rendererSources = [
  "tournament-recap-card.ts",
  "tournament-stats-card.ts",
  "bracket-share-card.ts",
  "bracket-share-extras.ts",
  "bracket-share-match.ts",
  "bracket-share-portrait.ts",
].map((file) =>
  readFileSync(new URL(file, import.meta.url), { encoding: "utf8" }),
);

describe("tournament share poster identity", () => {
  it("uses paper-and-ink nodes with lime reserved for winners", () => {
    expect(bracketMatchPalette("waiting", false)).toEqual({
      accent: "#090b08",
      border: "#090b08",
      fill: "#090b08",
      loser: "#827f75",
      text: "#f5f1e8",
      winner: shareColors.lime,
    });
    expect(bracketMatchPalette("complete", true)).toMatchObject({
      accent: shareColors.lime,
      border: shareColors.lime,
      fill: "#090b08",
    });
  });

  it("removes the legacy arena, glow, fragment, and medal treatments", () => {
    const source = rendererSources.join("\n");

    expect(source).not.toMatch(
      /drawExportBackdrop|drawEdgeFragments|drawLimeGlow|drawMedalBadge/,
    );
  });

  it("keeps a mascot and PICKLE KING wordmark in every export family", () => {
    const [champion, stats, bracket, extras, match, portrait] = rendererSources;
    const source = rendererSources.join("\n");

    expect(champion).toContain("tournament-champion-${format}.webp");
    expect(champion).toContain("drawBrandLockup");
    expect(champion).toContain("drawPosterBrand(context, lockup");
    expect(stats).toContain("drawBrandLockup");
    expect(bracket + extras + match).toContain("drawBrandLockup");
    expect(portrait + extras).toContain("drawBracketBrandFooter");
    expect(source).not.toContain('"PICKLE KING"');
  });

  it.each(["feed", "story"] as const)(
    "fits sixteen standings plus the factual highlights in the %s receipt",
    (format) => {
      const geometry = tournamentStatsTableGeometry(format, 16);

      expect(geometry.rowHeight).toBeGreaterThanOrEqual(32);
      expect(geometry.tableBottom).toBeLessThanOrEqual(geometry.highlightsTop);
      expect(geometry.footerTop).toBeGreaterThan(geometry.highlightsBottom);
    },
  );
});
