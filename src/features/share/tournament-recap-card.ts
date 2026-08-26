import {
  calculateTournamentResult,
  type TournamentBracket,
} from "../../tournament";
import {
  type BrandLockupAssets,
  drawBrandLockup,
  shareCanvasSurface,
  shareColors,
  shareFittedText,
  shareText,
} from "./share-canvas";
import { drawQuickWinner } from "./quick-share-layout-helpers";
import {
  DEFAULT_SHARE_FORMAT,
  shareDimensions,
  type ShareFormat,
} from "./share-format";
import {
  championStanding,
  finalMatchData,
  playerName,
  tournamentFormatLabel,
  tournamentNames,
} from "./tournament-share-data";

const CREAM = "#f5f1e8";

export async function tournamentRecapCanvas(
  bracket: TournamentBracket,
  format: ShareFormat = DEFAULT_SHARE_FORMAT,
) {
  const result = calculateTournamentResult(bracket);
  const names = tournamentNames(bracket);
  const champion = championStanding(result);
  const final = finalMatchData(bracket, result);
  const championName = playerName(names, result.championId, "Champion");
  const opponentName = playerName(names, final.opponentId, "Runner-up");
  const { height, width } = shareDimensions(format);
  const { element, context, lockup } = await shareCanvasSurface(
    width,
    height,
    `/share/templates/tournament-champion-${format}.webp`,
  );
  const story = format === "story";

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

function drawWinner(
  context: CanvasRenderingContext2D,
  championName: string,
  story: boolean,
) {
  const nameY = story ? 468 : 338;
  drawQuickWinner(context, championName, 76, nameY - (story ? 112 : 98), {
    color: CREAM,
    family: "Anton",
    lineHeight: story ? 112 : 98,
    maxHeight: story ? 234 : 208,
    maxSize: story ? 112 : 98,
    maxWidth: 470,
    minSize: story ? 52 : 42,
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
  lockup: BrandLockupAssets,
  width: number,
  height: number,
) {
  drawBrandLockup(context, lockup, width / 2, height - 110, 320, "chalk");
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}
