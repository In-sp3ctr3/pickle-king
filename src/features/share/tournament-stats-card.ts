import {
  calculateTournamentResult,
  tournamentHighlights,
  type TournamentHighlight,
  type TournamentBracket,
} from "../../tournament";
import {
  drawBrandMark,
  drawShareFooter,
  fitCanvasText,
  shareCanvasSurface,
  shareColors,
  shareFittedText,
  shareText,
} from "./share-canvas";
import { shareDimensions, type ShareFormat } from "./share-format";
import { drawExportBackdrop } from "./share-scene";
import {
  championStanding,
  playerName,
  tournamentNames,
} from "./tournament-share-data";

export async function tournamentStatsCanvas(
  bracket: TournamentBracket,
  format: ShareFormat = "feed",
) {
  const result = calculateTournamentResult(bracket);
  const names = tournamentNames(bracket);
  const champion = championStanding(result);
  const highlights = tournamentHighlights(bracket, result);
  const { height, width } = shareDimensions(format);
  const { arena, element, context, mark } = await shareCanvasSurface(
    width,
    height,
  );

  drawExportBackdrop(context, width, height, arena, 290);
  shareText(context, "PICKLE KING", 54, 66, {
    color: shareColors.lime,
    font: "900 24px 'Archivo Black', sans-serif",
  });
  shareText(context, `${bracket.players.length} PLAYER TOURNAMENT`, 1026, 66, {
    align: "right",
    color: shareColors.mist,
    font: "800 18px Manrope, sans-serif",
  });
  drawBrandMark(context, mark, 920, 82, 116);
  shareText(context, "TOURNAMENT STANDINGS", 56, 128, {
    color: shareColors.mist,
    font: "900 18px Manrope, sans-serif",
  });
  shareFittedText(
    context,
    playerName(names, result.championId, "Champion").toUpperCase(),
    56,
    218,
    { color: shareColors.lime, maxSize: 68, minSize: 42, maxWidth: 760 },
  );
  shareText(
    context,
    `CHAMPION  ·  ${champion.wins}–${champion.losses}  ·  ${signed(champion.differential)} DIFF`,
    58,
    264,
    { color: shareColors.chalk, font: "900 21px Manrope, sans-serif" },
  );

  const tableEnd = drawStandings(context, result.standings, names);
  drawHighlights(
    context,
    highlights,
    Math.min(height - 430, Math.max(680, tableEnd + 40)),
    height - 122,
  );
  drawShareFooter(context, width, height - 60);
  return element;
}

function drawStandings(
  context: CanvasRenderingContext2D,
  standings: ReturnType<typeof calculateTournamentResult>["standings"],
  names: Map<string, string>,
) {
  const top = 326;
  const rowHeight = Math.min(52, 570 / standings.length);
  for (const [label, x, align] of [
    ["PLAYER", 70, "left"],
    ["W–L", 702, "right"],
    ["PTS", 848, "right"],
    ["DIFF", 1006, "right"],
  ] as const) {
    shareText(context, label, x, top, {
      align,
      color: shareColors.mist,
      font: "900 15px Manrope, sans-serif",
    });
  }
  standings.forEach((standing, index) => {
    const y = top + 32 + index * rowHeight;
    context.fillStyle =
      index === 0
        ? "rgba(41, 54, 30, 0.96)"
        : index % 2
          ? "rgba(21, 27, 19, 0.9)"
          : "rgba(27, 34, 24, 0.88)";
    context.fillRect(56, y, 968, rowHeight - 4);
    context.font = "900 19px Manrope, sans-serif";
    const name = fitCanvasText(
      context,
      `${String(index + 1).padStart(2, "0")}  ${playerName(names, standing.playerId)}`,
      520,
    );
    shareText(context, name, 72, y + rowHeight * 0.65, {
      color: index === 0 ? shareColors.lime : shareColors.chalk,
      font: "900 19px Manrope, sans-serif",
    });
    shareText(
      context,
      `${standing.wins}–${standing.losses}`,
      702,
      y + rowHeight * 0.65,
      {
        align: "right",
        font: "900 19px Manrope, sans-serif",
      },
    );
    shareText(
      context,
      `${standing.pointsFor}–${standing.pointsAgainst}`,
      848,
      y + rowHeight * 0.65,
      {
        align: "right",
        font: "800 18px Manrope, sans-serif",
      },
    );
    shareText(
      context,
      signed(standing.differential),
      1006,
      y + rowHeight * 0.65,
      {
        align: "right",
        color: standing.differential > 0 ? shareColors.lime : shareColors.chalk,
        font: "900 19px Manrope, sans-serif",
      },
    );
  });
  return top + 32 + standings.length * rowHeight;
}

function drawHighlights(
  context: CanvasRenderingContext2D,
  highlights: TournamentHighlight[],
  top: number,
  bottom: number,
) {
  const gap = 16;
  const cardWidth = (968 - gap) / 2;
  const cardHeight = (bottom - top - gap) / 2;
  highlights.forEach((highlight, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 56 + column * (cardWidth + gap);
    const y = top + row * (cardHeight + gap);
    const wash = context.createLinearGradient(
      x,
      y,
      x + cardWidth,
      y + cardHeight,
    );
    wash.addColorStop(0, "rgba(32, 42, 28, 0.97)");
    wash.addColorStop(1, "rgba(13, 17, 12, 0.97)");
    context.fillStyle = wash;
    context.fillRect(x, y, cardWidth, cardHeight);
    context.fillStyle = index === 0 ? shareColors.lime : shareColors.gold;
    context.fillRect(x, y, 6, cardHeight);
    shareText(context, highlight.label.toUpperCase(), x + 28, y + 40, {
      color: shareColors.mist,
      font: "900 14px Manrope, sans-serif",
    });
    shareFittedText(context, highlight.value, x + 28, y + cardHeight * 0.7, {
      color: index === 0 ? shareColors.lime : shareColors.chalk,
      family: "Manrope, sans-serif",
      weight: 900,
      maxSize: 27,
      minSize: 16,
      maxWidth: cardWidth - 54,
    });
  });
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}
