import {
  calculateTournamentResult,
  type TournamentBracket,
} from "../../tournament";
import {
  drawBrandLockup,
  drawBrandMark,
  shareCanvasSurface,
  shareColors,
  shareFittedText,
  shareText,
} from "./share-canvas";
import { shareDimensions, type ShareFormat } from "./share-format";
import {
  championStanding,
  finalMatchData,
  playerName,
  tournamentFormatLabel,
  tournamentNames,
} from "./tournament-share-data";

const INK = "#090b08";
const CREAM = "#f5f1e8";

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
  const { element, context, lockup, mark } = await shareCanvasSurface(
    width,
    height,
  );
  const story = format === "story";

  drawPosterFrame(context, width, height);
  drawBrandMark(
    context,
    mark,
    story ? 900 : 838,
    story ? 160 : 104,
    story ? 940 : 610,
  );
  shareText(context, `${tournamentFormatLabel(bracket)} · FINAL`, 78, 112, {
    color: shareColors.lime,
    font: "900 19px Manrope, sans-serif",
  });
  drawWinner(context, championName, story);
  drawResult(context, story, {
    championScore: final.championScore,
    opponentName,
    opponentScore: final.opponentScore,
    record: `${champion.wins}–${champion.losses} RECORD · ${signed(champion.differential)} POINT DIFFERENTIAL`,
  });
  drawPodium(context, story, {
    champion: championName,
    runnerUp: playerName(names, result.runnerUpId, "Runner-up"),
    third: playerName(names, result.thirdPlaceId, "Third place"),
  });
  drawPosterBrand(context, lockup, width, height);
  return element;
}

function drawPosterFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.fillStyle = INK;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = shareColors.lime;
  context.lineWidth = 14;
  context.strokeRect(52, 52, width - 104, height - 104);
}

function drawWinner(
  context: CanvasRenderingContext2D,
  championName: string,
  story: boolean,
) {
  const nameY = story ? 468 : 338;
  const winsY = story ? 590 : 448;
  shareFittedText(context, championName.toUpperCase(), 76, nameY, {
    color: CREAM,
    maxSize: story ? 118 : 104,
    minSize: 52,
    maxWidth: 470,
  });
  shareText(context, "WINS", 76, winsY, {
    color: CREAM,
    font: `900 ${story ? 112 : 102}px 'Archivo Black', sans-serif`,
  });
}

function drawResult(
  context: CanvasRenderingContext2D,
  story: boolean,
  data: {
    championScore: number;
    opponentName: string;
    opponentScore: number;
    record: string;
  },
) {
  const scoreY = story ? 940 : 700;
  shareFittedText(
    context,
    `${data.championScore}–${data.opponentScore}`,
    76,
    scoreY,
    {
      color: shareColors.lime,
      maxSize: story ? 190 : 176,
      minSize: 116,
      maxWidth: 770,
    },
  );
  shareFittedText(
    context,
    `OVER ${data.opponentName.toUpperCase()}`,
    82,
    scoreY + 60,
    {
      color: CREAM,
      family: "Manrope, sans-serif",
      weight: 700,
      maxSize: 27,
      minSize: 18,
      maxWidth: 740,
    },
  );
  shareFittedText(context, data.record, 82, scoreY + 116, {
    color: shareColors.lime,
    family: "Manrope, sans-serif",
    weight: 900,
    maxSize: 21,
    minSize: 15,
    maxWidth: 880,
  });
}

function drawPodium(
  context: CanvasRenderingContext2D,
  story: boolean,
  names: { champion: string; runnerUp: string; third: string },
) {
  const top = story ? 1420 : 900;
  context.strokeStyle = CREAM;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(78, top);
  context.lineTo(1002, top);
  context.stroke();
  const places = [
    ["1", "CHAMPION", names.champion, 80],
    ["2", "RUNNER-UP", names.runnerUp, 390],
    ["3", "THIRD", names.third, 700],
  ] as const;
  for (const [place, label, name, x] of places) {
    shareText(context, place, x, top + 84, {
      color: place === "1" ? shareColors.lime : CREAM,
      font: "900 66px 'Archivo Black', sans-serif",
    });
    shareText(context, label, x + 66, top + 48, {
      color: shareColors.lime,
      font: "900 14px Manrope, sans-serif",
    });
    shareFittedText(context, name.toUpperCase(), x + 66, top + 84, {
      color: CREAM,
      family: "Manrope, sans-serif",
      weight: 900,
      maxSize: 22,
      minSize: 14,
      maxWidth: 226,
    });
  }
}

function drawPosterBrand(
  context: CanvasRenderingContext2D,
  lockup: HTMLImageElement,
  width: number,
  height: number,
) {
  drawBrandLockup(context, lockup, width / 2, height - 110, 320, "chalk");
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}
