import {
  calculateTournamentResult,
  type TournamentBracket,
} from "../../tournament";
import {
  drawBrandMark,
  drawExportBackdrop,
  drawLimeGlow,
  drawShareFooter,
  drawStaticConfetti,
  shareCanvasSurface,
  shareColors,
  shareFittedText,
  shareText,
} from "./share-canvas";
import {
  championStanding,
  finalMatchData,
  playerName,
  tournamentNames,
} from "./tournament-share-data";

export async function tournamentRecapCanvas(bracket: TournamentBracket) {
  const result = calculateTournamentResult(bracket);
  const names = tournamentNames(bracket);
  const champion = championStanding(result);
  const final = finalMatchData(bracket, result);
  const championName = playerName(names, result.championId, "Champion");
  const opponentName = playerName(names, final.opponentId, "Runner-up");
  const { element, context, mark } = await shareCanvasSurface(1080, 1350);

  drawExportBackdrop(context, 1080, 1350, 430);
  drawLimeGlow(context, 540, 190, 360);
  drawStaticConfetti(
    context,
    { x: 36, y: 24, width: 1008, height: 520 },
    91,
    58,
  );
  shareText(context, "PICKLE KING", 54, 68, {
    color: shareColors.lime,
    font: "900 24px 'Archivo Black', sans-serif",
  });
  shareText(context, `${bracket.players.length} PLAYER TOURNAMENT`, 1026, 68, {
    align: "right",
    color: shareColors.mist,
    font: "800 19px Manrope, sans-serif",
  });
  drawBrandMark(context, mark, 540, 62, 182);

  shareText(context, "T O U R N A M E N T   C H A M P I O N", 540, 292, {
    align: "center",
    color: shareColors.lime,
    font: "900 20px Manrope, sans-serif",
  });
  shareFittedText(context, championName.toUpperCase(), 540, 438, {
    align: "center",
    maxSize: 124,
    minSize: 64,
    maxWidth: 930,
  });
  shareText(context, "CROWN SECURED", 540, 490, {
    align: "center",
    color: shareColors.lime,
    font: "900 20px Manrope, sans-serif",
  });

  drawFinalScore(context, {
    championName,
    championScore: final.championScore,
    opponentName,
    opponentScore: final.opponentScore,
  });
  shareText(
    context,
    `${champion.wins}–${champion.losses} RECORD   ·   ${signed(champion.differential)} POINT DIFFERENTIAL`,
    540,
    825,
    {
      align: "center",
      color: shareColors.chalk,
      font: "900 24px Manrope, sans-serif",
    },
  );

  drawPodium(context, {
    champion: championName,
    runnerUp: playerName(names, result.runnerUpId, "Runner-up"),
    third: playerName(names, result.thirdPlaceId, "Third place"),
  });
  drawShareFooter(context, 1080, 1290);
  return element;
}

function drawFinalScore(
  context: CanvasRenderingContext2D,
  data: {
    championName: string;
    championScore: number;
    opponentName: string;
    opponentScore: number;
  },
) {
  context.save();
  context.fillStyle = "rgba(21, 27, 19, 0.94)";
  context.strokeStyle = shareColors.lime;
  context.lineWidth = 3;
  context.beginPath();
  context.roundRect(118, 548, 844, 224, 28);
  context.fill();
  context.stroke();
  context.restore();
  shareText(context, "FINAL", 540, 586, {
    align: "center",
    color: shareColors.mist,
    font: "900 16px Manrope, sans-serif",
  });
  finalSide(context, data.championName, data.championScore, 330, true);
  finalSide(context, data.opponentName, data.opponentScore, 750, false);
  shareText(context, "—", 540, 708, {
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
) {
  shareText(context, String(score), x, 699, {
    align: "center",
    color: winner ? shareColors.lime : shareColors.chalk,
    font: "900 110px 'Archivo Black', sans-serif",
  });
  shareFittedText(context, name.toUpperCase(), x, 744, {
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
  names: { champion: string; runnerUp: string; third: string },
) {
  shareText(context, "PODIUM", 540, 900, {
    align: "center",
    color: shareColors.mist,
    font: "900 17px Manrope, sans-serif",
  });
  podiumStep(
    context,
    80,
    986,
    270,
    176,
    "2",
    "RUNNER-UP",
    names.runnerUp,
    "#c8ced3",
  );
  podiumStep(
    context,
    405,
    930,
    270,
    232,
    "1",
    "CHAMPION",
    names.champion,
    shareColors.gold,
  );
  podiumStep(
    context,
    730,
    1022,
    270,
    140,
    "3",
    "THIRD",
    names.third,
    "#bd7a42",
  );
  context.strokeStyle = shareColors.lime;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(80, 1162);
  context.lineTo(1000, 1162);
  context.stroke();
}

function podiumStep(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  place: string,
  label: string,
  name: string,
  color: string,
) {
  context.fillStyle = "rgba(27, 34, 24, 0.96)";
  context.fillRect(x, y, width, height);
  shareText(context, place, x + 24, y + 58, {
    color,
    font: "900 54px 'Archivo Black', sans-serif",
  });
  shareText(context, label, x + 24, y + 91, {
    color,
    font: "900 14px Manrope, sans-serif",
  });
  shareFittedText(context, name.toUpperCase(), x + 24, y + 129, {
    color: shareColors.chalk,
    family: "Manrope, sans-serif",
    weight: 900,
    maxSize: 23,
    minSize: 16,
    maxWidth: width - 48,
  });
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}
