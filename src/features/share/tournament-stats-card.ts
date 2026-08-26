import {
  calculateTournamentResult,
  tournamentHighlights,
  type TournamentHighlight,
  type TournamentBracket,
} from "../../tournament";
import {
  type BrandLockupAssets,
  drawBrandLockup,
  fitCanvasText,
  shareCanvasSurface,
  shareColors,
  shareFittedText,
  shareText,
} from "./share-canvas";
import {
  DEFAULT_SHARE_FORMAT,
  shareDimensions,
  type ShareFormat,
} from "./share-format";
import { drawRasterCenteredRecapText } from "./session-recap-layout";
import {
  playerName,
  tournamentFormatLabel,
  tournamentNames,
} from "./tournament-share-data";

const INK = "#090b08";
const CREAM = "#f5f1e8";

export function tournamentStatsTableGeometry(
  format: ShareFormat,
  playerCount: number,
) {
  const story = format === "story";
  const density =
    playerCount <= 6 ? "regular" : playerCount <= 12 ? "dense" : "compact";
  const slabTop = story ? 520 : 370;
  const profile = story
    ? density === "regular"
      ? { firstRuleY: 630, rowFontSize: 46, rowHeight: 76 }
      : density === "dense"
        ? { firstRuleY: 610, rowFontSize: 36, rowHeight: 56 }
        : { firstRuleY: 590, rowFontSize: 28, rowHeight: 44 }
    : density === "regular"
      ? { firstRuleY: 450, rowFontSize: 34, rowHeight: 56 }
      : density === "dense"
        ? { firstRuleY: 430, rowFontSize: 28, rowHeight: 40 }
        : { firstRuleY: 420, rowFontSize: 22, rowHeight: 32 };
  const rowsTop = profile.firstRuleY;
  const tableBottom = rowsTop + profile.rowHeight * playerCount;
  const highlightsTop = Math.max(story ? 1200 : 790, tableBottom + 28);
  const highlightsBottom = highlightsTop + (story ? 230 : 180);
  return {
    density,
    firstRuleY: profile.firstRuleY,
    footerTop: story ? 1790 : 1240,
    highlightsBottom,
    highlightsTop,
    rowFontSize: profile.rowFontSize,
    rowHeight: profile.rowHeight,
    rowsTop,
    slabTop,
    tableBottom,
  };
}

export async function tournamentStatsCanvas(
  bracket: TournamentBracket,
  format: ShareFormat = DEFAULT_SHARE_FORMAT,
) {
  const result = calculateTournamentResult(bracket);
  const names = tournamentNames(bracket);
  const highlights = tournamentHighlights(bracket, result);
  const { height, width } = shareDimensions(format);
  const { element, context, lockup } = await shareCanvasSurface(width, height);
  const geometry = tournamentStatsTableGeometry(
    format,
    result.standings.length,
  );

  drawPaper(context, width, height);
  drawHeader(context, bracket);
  context.fillStyle = shareColors.lime;
  context.fillRect(
    0,
    geometry.slabTop,
    width,
    geometry.footerTop - geometry.slabTop - 40,
  );
  drawStandings(context, result.standings, names, geometry);
  drawHighlights(context, highlights, geometry.highlightsTop, format);
  drawReceiptBrand(context, lockup, width, height);
  return element;
}

function drawPaper(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.fillStyle = CREAM;
  context.fillRect(0, 0, width, height);
  const wash = context.createRadialGradient(
    width * 0.48,
    height * 0.35,
    width * 0.05,
    width * 0.48,
    height * 0.35,
    height * 0.8,
  );
  wash.addColorStop(0, "rgba(255,255,255,0.34)");
  wash.addColorStop(1, "rgba(172,157,132,0.08)");
  context.fillStyle = wash;
  context.fillRect(0, 0, width, height);
}

function drawHeader(
  context: CanvasRenderingContext2D,
  bracket: TournamentBracket,
) {
  shareText(context, tournamentFormatLabel(bracket), 540, 82, {
    align: "center",
    color: INK,
    font: "900 17px Manrope, sans-serif",
  });
  shareFittedText(context, "STANDINGS", 54, 246, {
    color: INK,
    maxSize: 110,
    minSize: 72,
    maxWidth: 972,
  });
  shareText(context, "PLAYER STANDINGS", 540, 316, {
    align: "center",
    color: INK,
    font: "700 19px Manrope, sans-serif",
  });
  context.strokeStyle = INK;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(88, 309);
  context.lineTo(350, 309);
  context.moveTo(730, 309);
  context.lineTo(992, 309);
  context.stroke();
}

function drawStandings(
  context: CanvasRenderingContext2D,
  standings: ReturnType<typeof calculateTournamentResult>["standings"],
  names: Map<string, string>,
  geometry: ReturnType<typeof tournamentStatsTableGeometry>,
) {
  const headerTop = geometry.slabTop + 16;
  const headerBottom = geometry.firstRuleY;
  for (const [label, x, align] of [
    ["PLAYER", 72, "left"],
    ["W–L", 694, "right"],
    ["PTS", 850, "right"],
    ["+/−", 1008, "right"],
  ] as const) {
    drawRasterCenteredRecapText(
      context,
      label,
      `700 ${Math.min(24, geometry.rowFontSize)}px 'Roboto Condensed', sans-serif`,
      Math.min(24, geometry.rowFontSize),
      x,
      headerTop,
      headerBottom,
      align,
    );
  }
  context.strokeStyle = INK;
  context.lineWidth = 2;
  standings.forEach((standing, index) => {
    const top = geometry.rowsTop + index * geometry.rowHeight;
    const bottom = top + geometry.rowHeight;
    context.beginPath();
    context.moveTo(64, top);
    context.lineTo(1016, top);
    context.stroke();
    const fontSize = geometry.rowFontSize;
    context.font = `700 ${fontSize}px 'Roboto Condensed', sans-serif`;
    const name = fitCanvasText(
      context,
      playerName(names, standing.playerId),
      510,
    );
    drawRasterCenteredRecapText(
      context,
      name,
      `700 ${fontSize}px 'Roboto Condensed', sans-serif`,
      fontSize,
      72,
      top,
      bottom,
      "left",
    );
    for (const [value, x] of [
      [`${standing.wins}–${standing.losses}`, 694],
      [`${standing.pointsFor}–${standing.pointsAgainst}`, 850],
      [signed(standing.differential), 1008],
    ] as const) {
      drawRasterCenteredRecapText(
        context,
        value,
        `700 ${fontSize}px 'Roboto Condensed', sans-serif`,
        fontSize,
        x,
        top,
        bottom,
        "right",
      );
    }
  });
  context.beginPath();
  context.moveTo(64, geometry.tableBottom);
  context.lineTo(1016, geometry.tableBottom);
  context.stroke();
}

function drawHighlights(
  context: CanvasRenderingContext2D,
  highlights: TournamentHighlight[],
  top: number,
  format: ShareFormat,
) {
  shareText(context, "MATCH FACTS", 540, top + 22, {
    align: "center",
    color: INK,
    font: "900 16px Manrope, sans-serif",
  });
  const rowHeight = format === "story" ? 92 : 68;
  highlights.forEach((highlight, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 78 + column * 480;
    const y = top + 56 + row * rowHeight;
    shareText(context, highlight.label.toUpperCase(), x, y, {
      color: INK,
      font: "900 13px Manrope, sans-serif",
    });
    shareFittedText(context, highlight.value, x, y + 29, {
      color: INK,
      family: "Manrope, sans-serif",
      weight: 900,
      maxSize: 21,
      minSize: 14,
      maxWidth: 420,
    });
  });
}

function drawReceiptBrand(
  context: CanvasRenderingContext2D,
  lockup: BrandLockupAssets,
  width: number,
  height: number,
) {
  drawBrandLockup(context, lockup, width / 2, height - 85, 330);
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}
