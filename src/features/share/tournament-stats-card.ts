import {
  calculateTournamentResult,
  type TournamentBracket,
} from "../../tournament";
import {
  drawBrandMark,
  drawShareFooter,
  fitShareText,
  shareCanvasSurface,
  shareColors,
  shareText,
} from "./share-canvas";

export async function tournamentStatsCanvas(bracket: TournamentBracket) {
  const result = calculateTournamentResult(bracket);
  const names = new Map(bracket.players.map(({ id, name }) => [id, name]));
  const { element, context, mark } = await shareCanvasSurface(1080, 1350);
  drawBrandMark(context, mark, 920, 52, 120);
  shareText(context, "TOURNAMENT TABLE", 64, 95, {
    color: shareColors.lime,
    font: "900 22px Manrope, sans-serif",
  });
  shareText(context, "How the field finished.", 64, 165, {
    font: "900 52px 'Archivo Black', sans-serif",
  });
  shareText(context, "PLAYER", 72, 245, {
    color: shareColors.mist,
    font: "900 16px Manrope, sans-serif",
  });
  shareText(context, "W–L", 690, 245, {
    align: "right",
    color: shareColors.mist,
    font: "900 16px Manrope, sans-serif",
  });
  shareText(context, "FOR", 820, 245, {
    align: "right",
    color: shareColors.mist,
    font: "900 16px Manrope, sans-serif",
  });
  shareText(context, "DIFF", 1008, 245, {
    align: "right",
    color: shareColors.mist,
    font: "900 16px Manrope, sans-serif",
  });
  const rowHeight = Math.min(56, 820 / result.standings.length);
  result.standings.forEach((standing, index) => {
    const y = 282 + rowHeight * index;
    context.fillStyle =
      index === 0 ? "#202a18" : index % 2 ? "#151a13" : shareColors.surface;
    context.fillRect(64, y - 30, 952, rowHeight - 4);
    shareText(
      context,
      `${String(index + 1).padStart(2, "0")}  ${fitShareText(names.get(standing.playerId) ?? "Player", 22)}`,
      78,
      y + 5,
      {
        color: index === 0 ? shareColors.lime : shareColors.chalk,
        font: "900 22px Manrope, sans-serif",
      },
    );
    shareText(context, `${standing.wins}–${standing.losses}`, 690, y + 5, {
      align: "right",
      font: "900 22px Manrope, sans-serif",
    });
    shareText(context, String(standing.pointsFor), 820, y + 5, {
      align: "right",
      font: "800 22px Manrope, sans-serif",
    });
    shareText(
      context,
      `${standing.differential > 0 ? "+" : ""}${standing.differential}`,
      1008,
      y + 5,
      {
        align: "right",
        color: standing.differential > 0 ? shareColors.lime : shareColors.chalk,
        font: "900 22px Manrope, sans-serif",
      },
    );
  });
  shareText(
    context,
    "Tournament performance only. No new skill rating assigned.",
    64,
    1185,
    { color: shareColors.mist, font: "800 18px Manrope, sans-serif" },
  );
  drawShareFooter(context, 1080, 1268);
  return element;
}
