import type { QuickMatchRecord } from "../../history";
import type { FinishReason, ScoringState } from "../../match/types";
import {
  drawBrandMark,
  drawLimeGlow,
  drawShareFooter,
  shareDimensionalFittedText,
  shareCanvasSurface,
  shareColors,
  shareFittedText,
  shareText,
} from "./share-canvas";
import { shareDimensions, type ShareFormat } from "./share-format";
import { drawEdgeFragments, drawExportBackdrop } from "./share-scene";

interface ScoreCardData {
  labelA: string;
  labelB: string;
  scoreA: number;
  scoreB: number;
  winner: "A" | "B";
}

export async function quickShareCanvas(
  input: QuickMatchRecord | ScoringState,
  format: ShareFormat = "feed",
): Promise<HTMLCanvasElement> {
  const record = "labels" in input;
  const data: ScoreCardData = {
    labelA: record ? input.labels.sideA : input.labelA,
    labelB: record ? input.labels.sideB : input.labelB,
    scoreA: record ? input.score.sideA : input.scoreA,
    scoreB: record ? input.score.sideB : input.scoreB,
    winner: input.winner as "A" | "B",
  };
  if (!input.winner) throw new Error("A result needs a winner before sharing.");

  const { height, width } = shareDimensions(format);
  const { arena, element, context, mark } = await shareCanvasSurface(
    width,
    height,
  );
  drawExportBackdrop(context, width, height, arena, height * 0.31);
  drawEdgeFragments(context, width, Math.min(height * 0.32, 540), 17);

  shareText(context, "PICKLE KING", 54, 66, {
    color: shareColors.lime,
    font: "900 24px 'Archivo Black', sans-serif",
  });
  shareText(context, getStageLabel(input).toUpperCase(), 1026, 66, {
    align: "right",
    color: shareColors.mist,
    font: "800 19px Manrope, sans-serif",
  });
  drawBrandMark(context, mark, 540, height * 0.06, 172);

  shareText(context, "F I N A L   S C O R E", 540, height * 0.22, {
    align: "center",
    color: shareColors.lime,
    font: "900 22px Manrope, sans-serif",
  });
  const winnerName = data.winner === "A" ? data.labelA : data.labelB;
  drawWinnerName(context, winnerName, height);
  drawWideWins(context, 540, height * 0.475);
  shareText(context, "C R O W N   S E C U R E D", 540, height * 0.515, {
    align: "center",
    color: shareColors.lime,
    font: "900 18px Manrope, sans-serif",
  });

  drawScoreArena(context, data, height);
  shareText(
    context,
    finishLabel(input.finishReason, input.targetScore),
    540,
    quickShareContextY(format),
    {
      align: "center",
      color: shareColors.lime,
      font: "900 21px Manrope, sans-serif",
    },
  );
  drawShareFooter(context, width, height - 60);
  return element;
}

export function quickShareContextY(format: ShareFormat) {
  return format === "story" ? 1580 : 1350 * 0.865;
}

function drawWinnerName(
  context: CanvasRenderingContext2D,
  winnerName: string,
  height: number,
) {
  const value = winnerName.toUpperCase();
  context.font = "900 64px 'Archivo Black', sans-serif";
  if (context.measureText(value).width <= 930) {
    shareDimensionalFittedText(context, value, 540, height * 0.32, {
      align: "center",
      color: shareColors.chalk,
      maxSize: 132,
      minSize: 64,
      maxWidth: 930,
    });
    return;
  }
  const words = value.split(/\s+/);
  let split = 1;
  let narrowest = Number.POSITIVE_INFINITY;
  for (let index = 1; index < words.length; index += 1) {
    const width = Math.max(
      context.measureText(words.slice(0, index).join(" ")).width,
      context.measureText(words.slice(index).join(" ")).width,
    );
    if (width < narrowest) {
      narrowest = width;
      split = index;
    }
  }
  for (const [line, y] of [
    [words.slice(0, split).join(" "), height * 0.285],
    [words.slice(split).join(" "), height * 0.35],
  ] as const) {
    shareDimensionalFittedText(context, line, 540, y, {
      align: "center",
      color: shareColors.chalk,
      maxSize: 84,
      minSize: 52,
      maxWidth: 930,
    });
  }
}

function getStageLabel(input: QuickMatchRecord | ScoringState) {
  return "stageLabel" in input && input.stageLabel
    ? input.stageLabel
    : "Quick match";
}

function finishLabel(reason: FinishReason | null, target: number) {
  switch (reason) {
    case "buzzer":
      return "BUZZER WIN";
    case "golden-point":
      return "GOLDEN POINT";
    case "ended-early":
      return "MATCH ENDED EARLY";
    case "operator-selection":
      return "WINNER SELECTED BY OPERATOR";
    default:
      return `FIRST TO ${target}`;
  }
}

function drawWideWins(
  context: CanvasRenderingContext2D,
  centerX: number,
  baseline: number,
) {
  context.save();
  context.translate(centerX, 0);
  context.scale(1.2, 1);
  shareText(context, "WINS", 0, baseline, {
    align: "center",
    color: shareColors.lime,
    font: "900 224px 'Archivo Black', sans-serif",
  });
  context.restore();
}

function drawScoreArena(
  context: CanvasRenderingContext2D,
  data: ScoreCardData,
  height: number,
) {
  const top = height * 0.54;
  const arenaHeight = height * 0.25;
  const bottom = top + arenaHeight;
  drawLimeGlow(context, 540, top + arenaHeight / 2, 500);
  context.save();
  const panel = context.createLinearGradient(0, top, 0, bottom);
  panel.addColorStop(0, "rgba(31, 40, 27, 0.98)");
  panel.addColorStop(1, "rgba(10, 13, 9, 0.98)");
  context.fillStyle = panel;
  context.strokeStyle = shareColors.lime;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(122, top);
  context.lineTo(958, top);
  context.lineTo(1020, bottom);
  context.lineTo(60, bottom);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = "rgba(200, 255, 61, 0.45)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(540, top + 36);
  context.lineTo(540, bottom - 46);
  context.stroke();
  context.restore();

  drawScoreSide(
    context,
    data.labelA,
    data.scoreA,
    320,
    data.winner === "A",
    top,
    arenaHeight,
  );
  drawScoreSide(
    context,
    data.labelB,
    data.scoreB,
    760,
    data.winner === "B",
    top,
    arenaHeight,
  );
  context.fillStyle = shareColors.court;
  context.strokeStyle = shareColors.lime;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(540, top + arenaHeight / 2, 34, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  shareText(context, "VS", 540, top + arenaHeight / 2 + 10, {
    align: "center",
    color: shareColors.lime,
    font: "900 26px Manrope, sans-serif",
  });
}

function drawScoreSide(
  context: CanvasRenderingContext2D,
  name: string,
  score: number,
  x: number,
  winner: boolean,
  top: number,
  arenaHeight: number,
) {
  shareDimensionalFittedText(
    context,
    String(score),
    x,
    top + arenaHeight * 0.67,
    {
      align: "center",
      color: winner ? shareColors.lime : shareColors.chalk,
      maxSize: 230,
      minSize: 180,
      maxWidth: 330,
    },
  );
  shareFittedText(context, name.toUpperCase(), x, top + arenaHeight * 0.87, {
    align: "center",
    color: winner ? shareColors.lime : shareColors.chalk,
    family: "Manrope, sans-serif",
    weight: 900,
    maxSize: 34,
    minSize: 22,
    maxWidth: 340,
  });
}
