import type { QuickMatchRecord } from "../../history";
import type { FinishReason, ScoringState } from "../../match/types";
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

interface ScoreCardData {
  labelA: string;
  labelB: string;
  scoreA: number;
  scoreB: number;
  winner: "A" | "B";
}

export async function quickShareCanvas(
  input: QuickMatchRecord | ScoringState,
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

  const { element, context, mark } = await shareCanvasSurface(1080, 1350);
  drawExportBackdrop(context, 1080, 1350, 460);
  drawLimeGlow(context, 540, 180, 330);
  drawStaticConfetti(
    context,
    { x: 38, y: 30, width: 1004, height: 540 },
    17,
    52,
  );

  shareText(context, "PICKLE KING", 54, 66, {
    color: shareColors.lime,
    font: "900 24px 'Archivo Black', sans-serif",
  });
  shareText(context, getStageLabel(input).toUpperCase(), 1026, 66, {
    align: "right",
    color: shareColors.mist,
    font: "800 19px Manrope, sans-serif",
  });
  drawBrandMark(context, mark, 540, 62, 172);

  shareText(context, "F I N A L   S C O R E", 540, 280, {
    align: "center",
    color: shareColors.lime,
    font: "900 22px Manrope, sans-serif",
  });
  const winnerName = data.winner === "A" ? data.labelA : data.labelB;
  shareFittedText(context, winnerName.toUpperCase(), 540, 414, {
    align: "center",
    maxSize: 132,
    minSize: 64,
    maxWidth: 930,
  });
  drawWideWins(context, 540, 596);
  shareText(context, "C R O W N   S E C U R E D", 540, 640, {
    align: "center",
    color: shareColors.lime,
    font: "900 18px Manrope, sans-serif",
  });

  drawScoreArena(context, data);
  shareText(
    context,
    finishLabel(input.finishReason, input.targetScore),
    540,
    1108,
    {
      align: "center",
      color: shareColors.lime,
      font: "900 21px Manrope, sans-serif",
    },
  );
  drawShareFooter(context, 1080, 1290);
  return element;
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
) {
  drawLimeGlow(context, 540, 860, 500);
  context.save();
  context.fillStyle = "rgba(21, 27, 19, 0.96)";
  context.strokeStyle = shareColors.lime;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(122, 704);
  context.lineTo(958, 704);
  context.lineTo(1020, 1028);
  context.lineTo(60, 1028);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = "rgba(200, 255, 61, 0.45)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(540, 740);
  context.lineTo(540, 982);
  context.stroke();
  context.restore();

  drawScoreSide(context, data.labelA, data.scoreA, 320, data.winner === "A");
  drawScoreSide(context, data.labelB, data.scoreB, 760, data.winner === "B");
  context.fillStyle = shareColors.court;
  context.strokeStyle = shareColors.lime;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(540, 858, 34, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  shareText(context, "VS", 540, 868, {
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
) {
  shareFittedText(context, String(score), x, 946, {
    align: "center",
    color: winner ? shareColors.lime : shareColors.chalk,
    maxSize: 230,
    minSize: 180,
    maxWidth: 330,
  });
  shareFittedText(context, name.toUpperCase(), x, 1001, {
    align: "center",
    color: winner ? shareColors.lime : shareColors.chalk,
    family: "Manrope, sans-serif",
    weight: 900,
    maxSize: 34,
    minSize: 22,
    maxWidth: 340,
  });
}
