import {
  calculateTournamentResult,
  type TournamentBracket,
} from "../../tournament";
import {
  drawBrandMark,
  drawShareFooter,
  shareCanvasSurface,
  shareColors,
  shareDimensionalFittedText,
  shareFittedText,
  shareText,
} from "./share-canvas";
import { shareDimensions, type ShareFormat } from "./share-format";
import {
  drawEdgeFragments,
  drawExportBackdrop,
  drawMedalBadge,
} from "./share-scene";
import {
  championStanding,
  finalMatchData,
  playerName,
  tournamentNames,
} from "./tournament-share-data";

export async function tournamentRecapCanvas(
  bracket: TournamentBracket,
  format: ShareFormat = "feed",
) {
  const result = calculateTournamentResult(bracket);
  const names = tournamentNames(bracket);
  const champion = championStanding(result);
  const final = finalMatchData(bracket, result);
  const championName = playerName(names, result.championId, "Champion");
  const opponentName = playerName(names, final.opponentId, "Runner-up");
  const { height, width } = shareDimensions(format);
  const { arena, element, context, mark } = await shareCanvasSurface(
    width,
    height,
  );

  drawExportBackdrop(context, width, height, arena, height * 0.28);
  drawEdgeFragments(context, width, Math.min(height * 0.32, 620), 91);
  shareText(context, "PICKLE KING", 54, 68, {
    color: shareColors.lime,
    font: "900 24px 'Archivo Black', sans-serif",
  });
  shareText(context, `${bracket.players.length} PLAYER TOURNAMENT`, 1026, 68, {
    align: "right",
    color: shareColors.mist,
    font: "800 19px Manrope, sans-serif",
  });
  drawBrandMark(context, mark, 540, height * 0.055, 182);

  shareText(
    context,
    "T O U R N A M E N T   C H A M P I O N",
    540,
    height * 0.22,
    {
      align: "center",
      color: shareColors.lime,
      font: "900 20px Manrope, sans-serif",
    },
  );
  shareDimensionalFittedText(
    context,
    championName.toUpperCase(),
    540,
    height * 0.325,
    {
      align: "center",
      color: shareColors.chalk,
      maxSize: 124,
      minSize: 64,
      maxWidth: 930,
    },
  );
  shareText(context, "CROWN SECURED", 540, height * 0.365, {
    align: "center",
    color: shareColors.lime,
    font: "900 20px Manrope, sans-serif",
  });

  drawFinalScore(context, height, {
    championName,
    championScore: final.championScore,
    opponentName,
    opponentScore: final.opponentScore,
  });
  shareText(
    context,
    `${champion.wins}–${champion.losses} RECORD   ·   ${signed(champion.differential)} POINT DIFFERENTIAL`,
    540,
    height * 0.635,
    {
      align: "center",
      color: shareColors.chalk,
      font: "900 24px Manrope, sans-serif",
    },
  );

  drawPodium(context, height, {
    champion: championName,
    runnerUp: playerName(names, result.runnerUpId, "Runner-up"),
    third: playerName(names, result.thirdPlaceId, "Third place"),
  });
  drawShareFooter(context, width, height - 60);
  return element;
}

function drawFinalScore(
  context: CanvasRenderingContext2D,
  height: number,
  data: {
    championName: string;
    championScore: number;
    opponentName: string;
    opponentScore: number;
  },
) {
  const top = height * 0.405;
  const panelHeight = height * 0.17;
  context.save();
  const panel = context.createLinearGradient(0, top, 0, top + panelHeight);
  panel.addColorStop(0, "rgba(34, 44, 29, 0.98)");
  panel.addColorStop(1, "rgba(10, 13, 9, 0.98)");
  context.fillStyle = panel;
  context.strokeStyle = shareColors.lime;
  context.lineWidth = 3;
  context.beginPath();
  context.roundRect(118, top, 844, panelHeight, 28);
  context.fill();
  context.stroke();
  context.restore();
  shareText(context, "FINAL", 540, top + 38, {
    align: "center",
    color: shareColors.mist,
    font: "900 16px Manrope, sans-serif",
  });
  finalSide(
    context,
    data.championName,
    data.championScore,
    330,
    true,
    top,
    panelHeight,
  );
  finalSide(
    context,
    data.opponentName,
    data.opponentScore,
    750,
    false,
    top,
    panelHeight,
  );
  shareText(context, "—", 540, top + panelHeight * 0.7, {
    align: "center",
    color: shareColors.mist,
    font: "700 54px Manrope, sans-serif",
  });
}

function finalSide(
  context: CanvasRenderingContext2D,
  name: string,
  score: number,
  x: number,
  winner: boolean,
  top: number,
  panelHeight: number,
) {
  shareDimensionalFittedText(
    context,
    String(score),
    x,
    top + panelHeight * 0.68,
    {
      align: "center",
      color: winner ? shareColors.lime : shareColors.chalk,
      maxSize: 110,
      minSize: 88,
      maxWidth: 220,
    },
  );
  shareFittedText(context, name.toUpperCase(), x, top + panelHeight * 0.87, {
    align: "center",
    color: winner ? shareColors.lime : shareColors.chalk,
    family: "Manrope, sans-serif",
    weight: 900,
    maxSize: 28,
    minSize: 18,
    maxWidth: 300,
  });
}

function drawPodium(
  context: CanvasRenderingContext2D,
  height: number,
  names: { champion: string; runnerUp: string; third: string },
) {
  const top = height * 0.7;
  podiumStep(
    context,
    205,
    top + 145,
    "2",
    "RUNNER-UP",
    names.runnerUp,
    "#c8ced3",
  );
  podiumStep(
    context,
    540,
    top + 92,
    "1",
    "CHAMPION",
    names.champion,
    shareColors.gold,
  );
  podiumStep(context, 875, top + 175, "3", "THIRD", names.third, "#bd7a42");
}

function podiumStep(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  place: "1" | "2" | "3",
  label: string,
  name: string,
  color: string,
) {
  context.save();
  context.fillStyle = "rgba(15, 19, 13, 0.95)";
  context.beginPath();
  context.roundRect(x - 145, y - 64, 290, 190, 26);
  context.fill();
  context.restore();
  drawMedalBadge(context, x, y - 32, place, color, place === "1" ? 82 : 70);
  shareText(context, label, x, y + 48, {
    align: "center",
    color,
    font: "900 14px Manrope, sans-serif",
  });
  shareFittedText(context, name.toUpperCase(), x, y + 87, {
    align: "center",
    color: shareColors.chalk,
    family: "Manrope, sans-serif",
    weight: 900,
    maxSize: 23,
    minSize: 16,
    maxWidth: 250,
  });
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}
