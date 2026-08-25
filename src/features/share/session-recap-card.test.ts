import { describe, expect, it } from "vitest";
import {
  centeredRecapRasterTop,
  sessionRecapDateLayout,
  sessionRecapFileName,
  sessionRecapFooterLayout,
  sessionRecapLayoutRowCount,
  sessionRecapNote,
  sessionRecapTableLayout,
  sessionRecapTemplatePath,
} from "./session-recap-card";

describe("session recap filenames", () => {
  it("keeps every continuation page on the twelve-row composition", () => {
    expect(sessionRecapLayoutRowCount(1, 2)).toBe(12);
  });

  it("names every dated format page deterministically", () => {
    expect(sessionRecapFileName("AUG 22–23 RECEIPTS", "doubles", 1, 3)).toBe(
      "pickle-king-aug-22-23-doubles-receipts-2-of-3.png",
    );
  });

  it("selects the format-specific reference base", () => {
    expect(sessionRecapTemplatePath("singles", "feed")).toBe(
      "/share/templates/recap-singles-feed.webp",
    );
    expect(sessionRecapTemplatePath("doubles", "story")).toBe(
      "/share/templates/recap-doubles-story.webp",
    );
    expect(sessionRecapTemplatePath("doubles", "story", 8)).toBe(
      "/share/templates/recap-doubles-dense-story.webp",
    );
    expect(sessionRecapTemplatePath("singles", "feed", 12)).toBe(
      "/share/templates/recap-singles-compact-feed.webp",
    );
  });

  it("centers measured raster ink rather than trusting font-box estimates", () => {
    const destinationTop = centeredRecapRasterTop(100, 140, 8, 25);
    const translatedTop = destinationTop + 8;
    const translatedBottom = destinationTop + 25;
    expect(
      Math.abs(translatedTop - 100 - (140 - translatedBottom)),
    ).toBeLessThanOrEqual(1);
  });

  it("uses the regular Story profiles for one through six rows", () => {
    expect(sessionRecapTableLayout("singles", 5, "story")).toEqual({
      density: "regular",
      dense: false,
      headerFontSize: 34,
      headerTop: 1128,
      firstRuleY: 1208,
      noteY: 1669,
      pageY: 1720,
      rowFontSize: 54,
      rowPitch: 81,
      rowRules: [1208, 1289, 1370, 1451, 1532, 1613],
    });
    expect(sessionRecapTableLayout("doubles", 6, "story")).toEqual({
      density: "regular",
      dense: false,
      headerFontSize: 34,
      headerTop: 880,
      firstRuleY: 960,
      noteY: 1669,
      pageY: 1720,
      rowFontSize: 54,
      rowPitch: 82,
      rowRules: [960, 1042, 1124, 1206, 1288, 1370, 1452],
    });
  });

  it("gives six regular Post rows a spacious fixed grid", () => {
    expect(sessionRecapTableLayout("doubles", 6, "feed")).toEqual({
      density: "regular",
      dense: false,
      headerFontSize: 26,
      headerTop: 714,
      firstRuleY: 762,
      noteY: 1194,
      pageY: 1220,
      rowFontSize: 34,
      rowPitch: 64,
      rowRules: [762, 826, 890, 954, 1018, 1082, 1146],
    });
    expect(sessionRecapTableLayout("singles", 1, "feed")).toMatchObject({
      firstRuleY: 847,
      headerTop: 802,
      rowPitch: 64,
      rowRules: [847, 911],
    });
    expect(sessionRecapTableLayout("singles", 6, "feed")).toMatchObject({
      rowPitch: 52,
      rowRules: [847, 899, 951, 1003, 1055, 1107, 1159],
    });
    expect(sessionRecapTableLayout("singles", 6, "story")).toMatchObject({
      rowPitch: 70,
      rowRules: [1208, 1278, 1348, 1418, 1488, 1558, 1628],
    });
  });

  it("keeps every supported player count clear of the note band", () => {
    for (const section of ["singles", "doubles"] as const) {
      for (const format of ["feed", "story"] as const) {
        for (let rows = 1; rows <= 12; rows += 1) {
          const layout = sessionRecapTableLayout(section, rows, format);
          expect(layout.rowRules.at(-1)).toBeLessThan(layout.noteY);
          expect(layout.rowFontSize).toBeLessThan(layout.rowPitch);
        }
      }
    }
  });

  it("fits eight Story rows without shrinking below the readable rhythm", () => {
    const singles = sessionRecapTableLayout("singles", 8, "story");
    const doubles = sessionRecapTableLayout("doubles", 8, "story");

    expect(singles.rowRules).toEqual([
      930, 1008, 1086, 1164, 1242, 1320, 1398, 1476, 1554,
    ]);
    expect(doubles.rowRules).toEqual([
      930, 1008, 1086, 1164, 1242, 1320, 1398, 1476, 1554,
    ]);
    expect(singles).toMatchObject({
      density: "dense",
      dense: true,
      headerTop: 852,
      firstRuleY: 930,
      rowFontSize: 48,
      rowPitch: 78,
      noteY: 1620,
      pageY: 1660,
    });
    expect(singles.rowRules.at(-1)).toBeLessThan(singles.noteY);
    expect(doubles.rowRules.at(-1)).toBeLessThan(doubles.noteY);
  });

  it("uses the dense Post composition for seven and eight rows", () => {
    expect(sessionRecapTableLayout("singles", 7, "feed")).toMatchObject({
      density: "dense",
      dense: true,
      headerTop: 624,
      firstRuleY: 690,
      rowFontSize: 34,
      rowPitch: 64,
      rowRules: [690, 754, 818, 882, 946, 1010, 1074, 1138],
    });
    expect(sessionRecapTableLayout("singles", 8, "feed")).toMatchObject({
      rowPitch: 56,
      rowRules: [690, 746, 802, 858, 914, 970, 1026, 1082, 1138],
    });
  });

  it("fits twelve rows in the compact Story and Post bands", () => {
    expect(sessionRecapTableLayout("doubles", 12, "story")).toMatchObject({
      density: "compact",
      headerTop: 812,
      firstRuleY: 870,
      noteY: 1640,
      pageY: 1690,
      rowFontSize: 44,
      rowPitch: 60,
      rowRules: Array.from({ length: 13 }, (_, index) => 870 + index * 60),
    });
    expect(sessionRecapTableLayout("doubles", 12, "feed")).toMatchObject({
      density: "compact",
      headerTop: 552,
      firstRuleY: 600,
      noteY: 1178,
      pageY: 1212,
      rowFontSize: 32,
      rowPitch: 45,
      rowRules: Array.from({ length: 13 }, (_, index) => 600 + index * 45),
    });
    expect(sessionRecapTableLayout("doubles", 9, "feed")).toMatchObject({
      rowPitch: 60,
      rowRules: Array.from({ length: 10 }, (_, index) => 600 + index * 60),
    });
    expect(sessionRecapTableLayout("doubles", 9, "story")).toMatchObject({
      rowPitch: 72,
      rowRules: Array.from({ length: 10 }, (_, index) => 870 + index * 72),
    });
  });

  it("keeps continuation pages on the exact compact composition", () => {
    const storyRows = sessionRecapLayoutRowCount(1, 2);
    const feedRows = sessionRecapLayoutRowCount(1, 2);
    expect(
      sessionRecapTableLayout("singles", storyRows, "story"),
    ).toMatchObject({
      density: "compact",
      rowRules: Array.from({ length: 13 }, (_, index) => 870 + index * 60),
    });
    expect(sessionRecapTableLayout("singles", feedRows, "feed")).toMatchObject({
      density: "compact",
      rowRules: Array.from({ length: 13 }, (_, index) => 600 + index * 45),
    });
  });

  it("records the authority date and footer geometry", () => {
    expect(sessionRecapDateLayout("singles", "story")).toEqual({
      fontSize: 36,
      letterSpacing: 7,
      x: 547,
      y: 135,
    });
    expect(sessionRecapDateLayout("doubles", "story")).toEqual({
      fontSize: 30,
      letterSpacing: 6,
      x: 547,
      y: 135,
    });
    expect(sessionRecapFooterLayout("story")).toEqual({
      centerX: 540,
      centerY: 1815,
      width: 420,
    });
  });

  it("keeps Top Pair and mixed-rule notices on the same protected note band", () => {
    const layout = sessionRecapTableLayout("doubles", 6, "story");
    expect(layout.noteY).toBe(1669);
    expect(layout.rowRules.at(-1)).toBeLessThan(layout.noteY);
    const topPair = {
      differential: 8,
      gamesPlayed: 3,
      losses: 0,
      name: "Shevar + Kaodi",
      names: ["Shevar", "Kaodi"] as [string, string],
      pointsAgainst: 22,
      pointsFor: 30,
      wins: 3,
    };
    expect(sessionRecapNote({ showDifferential: true, topPair })).toBe(
      "TOP PAIR · SHEVAR + KAODI · 3–0",
    );
    expect(sessionRecapNote({ showDifferential: false, topPair })).toBe(
      "MIXED RULES · POINT DIFFERENTIAL OMITTED",
    );
  });
});
