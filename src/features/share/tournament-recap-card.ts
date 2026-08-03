import {
  calculateTournamentResult,
  type TournamentBracket,
} from "../../tournament";
import { championCopy } from "../results/champion-copy";
import {
  drawBrandMark,
  drawShareFooter,
  drawStaticConfetti,
  fitShareText,
  shareCanvasSurface,
  shareColors,
  shareText,
} from "./share-canvas";

export async function tournamentRecapCanvas(bracket: TournamentBracket) {
  const result = calculateTournamentResult(bracket);
  const players = new Map(bracket.players.map((player) => [player.id, player]));
  const champion = result.standings.find(
    ({ playerId }) => playerId === result.championId,
  )!;
  const championMatches = result.matchHistory.filter(
    ({ winnerId }) => winnerId === result.championId,
  );
  const copy = championCopy({
    championName: players.get(result.championId)?.name ?? "Champion",
    comebackCount: championMatches.filter(
      ({ comebackDeficit }) => comebackDeficit >= 3,
    ).length,
    differential: champion.differential,
    seedKey: `${result.championId}:${champion.differential}`,
    upsetCount: result.upsetWins.filter(
      ({ winnerId }) => winnerId === result.championId,
    ).length,
    winningMargins: championMatches.map(({ scoreA, scoreB }) =>
      Math.abs(scoreA - scoreB),
    ),
  });
  const { element, context, mark } = await shareCanvasSurface(1080, 1350);
  drawStaticConfetti(
    context,
    { x: 30, y: 30, width: 1020, height: 520 },
    91,
    58,
  );
  shareText(context, "TOURNAMENT COMPLETE", 64, 82, {
    color: shareColors.lime,
    font: "900 22px Manrope, sans-serif",
  });
  drawBrandMark(context, mark, 540, 92, 260);
  shareText(context, copy.headline.toUpperCase(), 540, 410, {
    align: "center",
    font: "900 60px 'Archivo Black', sans-serif",
  });
  shareText(
    context,
    fitShareText(players.get(result.championId)?.name ?? "Champion", 24),
    540,
    485,
    {
      align: "center",
      color: shareColors.lime,
      font: "900 54px Manrope, sans-serif",
    },
  );
  shareText(context, copy.subcomment, 540, 535, {
    align: "center",
    color: shareColors.mist,
    font: "800 19px Manrope, sans-serif",
  });
  podium(
    context,
    540,
    700,
    "GOLD",
    players.get(result.championId)?.name ?? "Champion",
    shareColors.gold,
    240,
  );
  podium(
    context,
    188,
    790,
    "SILVER",
    players.get(result.runnerUpId)?.name ?? "Runner-up",
    "#c8ced3",
    190,
  );
  podium(
    context,
    892,
    830,
    "BRONZE",
    players.get(result.thirdPlaceId)?.name ?? "Third",
    "#bd7a42",
    175,
  );
  shareText(
    context,
    `${champion.wins}–${champion.losses}  ·  ${champion.differential > 0 ? "+" : ""}${champion.differential} POINT DIFF`,
    540,
    1110,
    {
      align: "center",
      color: shareColors.chalk,
      font: "900 28px Manrope, sans-serif",
    },
  );
  drawShareFooter(context, 1080, 1268);
  return element;
}

function podium(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  medal: string,
  name: string,
  color: string,
  width: number,
) {
  context.fillStyle = shareColors.surface;
  context.fillRect(x - width / 2, y, width, 190);
  context.beginPath();
  context.arc(x, y + 42, 26, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
  shareText(context, medal, x, y + 95, {
    align: "center",
    color,
    font: "900 17px Manrope, sans-serif",
  });
  shareText(context, fitShareText(name, 14), x, y + 145, {
    align: "center",
    font: "900 25px Manrope, sans-serif",
  });
}
