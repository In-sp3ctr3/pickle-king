import {
  calculateTournamentResult,
  tournamentHighlights,
  type TournamentHighlight,
  type TournamentBracket,
} from "../../tournament";
import {
  drawBrandLockup,
  fitCanvasText,
  shareCanvasSurface,
  shareColors,
  shareFittedText,
  shareText,
} from "./share-canvas";
import { shareDimensions, type ShareFormat } from "./share-format";
import {
  championStanding,
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
  const slabTop = story ? 520 : 370;
  const rowsTop = story ? 620 : 446;
  const maxHighlightsTop = story ? 1480 : 990;
  const rowHeight = Math.min(
    story ? 52 : 48,
    (maxHighlightsTop - rowsTop) / Math.max(1, playerCount),
  );
  const tableBottom = rowsTop + rowHeight * playerCount;
  const highlightsTop = Math.min(
    maxHighlightsTop,
    Math.max(story ? 1300 : 780, tableBottom + 34),
  );
  const highlightsBottom = highlightsTop + (story ? 230 : 180);
  return {
    footerTop: story ? 1790 : 1240,
    highlightsBottom,
    highlightsTop,
    rowHeight,
    rowsTop,
    slabTop,
    tableBottom,
  };
}

export async function tournamentStatsCanvas(
  bracket: TournamentBracket,
  format: ShareFormat = "feed",
) {
  const result = calculateTournamentResult(bracket);
  const names = tournamentNames(bracket);
  const champion = championStanding(result);
  const highlights = tournamentHighlights(bracket, result);
  const { height, width } = shareDimensions(format);
  const { element, context, lockup } = await shareCanvasSurface(width, height);
  const geometry = tournamentStatsTableGeometry(
    format,
    result.standings.length,
  );

  drawPaper(context, width, height);
  drawHeader(context, bracket, result.championId, names, champion);
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
  championId: string,
  names: Map<string, string>,
  champion: ReturnType<typeof championStanding>,
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
  shareFittedText(
    context,
    `${playerName(names, championId, "Champion").toUpperCase()} · CHAMPION · ${champion.wins}–${champion.losses} · ${signed(champion.differential)} DIFF`,
    58,
    316,
    {
      color: INK,
      family: "Manrope, sans-serif",
      weight: 900,
      maxSize: 22,
      minSize: 16,
      maxWidth: 964,
    },
  );
}

function drawStandings(
  context: CanvasRenderingContext2D,
  standings: ReturnType<typeof calculateTournamentResult>["standings"],
  names: Map<string, string>,
  geometry: ReturnType<typeof tournamentStatsTableGeometry>,
) {
  const headerY = geometry.rowsTop - 28;
  for (const [label, x, align] of [
    ["PLAYER", 72, "left"],
    ["W–L", 694, "right"],
    ["PTS", 850, "right"],
    ["+/−", 1008, "right"],
  ] as const) {
    shareText(context, label, x, headerY, {
      align,
      color: INK,
      font: "900 18px Manrope, sans-serif",
    });
  }
  context.strokeStyle = INK;
  context.lineWidth = 2;
  standings.forEach((standing, index) => {
    const top = geometry.rowsTop + index * geometry.rowHeight;
    const baseline = top + geometry.rowHeight * 0.68;
    context.beginPath();
    context.moveTo(64, top);
    context.lineTo(1016, top);
    context.stroke();
    const fontSize = Math.max(16, Math.min(27, geometry.rowHeight * 0.52));
    context.font = `900 ${fontSize}px Manrope, sans-serif`;
    const name = fitCanvasText(
      context,
      playerName(names, standing.playerId),
      510,
    );
    shareText(context, name, 72, baseline, {
      color: INK,
      font: `900 ${fontSize}px Manrope, sans-serif`,
    });
    shareText(context, `${standing.wins}–${standing.losses}`, 694, baseline, {
      align: "right",
      color: INK,
      font: `900 ${fontSize}px Manrope, sans-serif`,
    });
    shareText(
      context,
      `${standing.pointsFor}–${standing.pointsAgainst}`,
      850,
      baseline,
      {
        align: "right",
        color: INK,
        font: `800 ${Math.max(15, fontSize - 1)}px Manrope, sans-serif`,
      },
    );
    shareText(context, signed(standing.differential), 1008, baseline, {
      align: "right",
      color: INK,
      font: `900 ${fontSize}px Manrope, sans-serif`,
    });
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
  lockup: HTMLImageElement,
  width: number,
  height: number,
) {
  drawBrandLockup(context, lockup, width / 2, height - 85, 330);
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}
