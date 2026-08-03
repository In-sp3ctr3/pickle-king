import type { QuickMatchRecord } from "../../history";
import type { ScoringState } from "../../match/types";
import { winnerComebackDeficit } from "../../match/scoring";
import {
  drawBrandMark,
  drawShareFooter,
  drawStaticConfetti,
  fitShareText,
  shareCanvasSurface,
  shareColors,
  shareText,
} from "./share-canvas";
import { victoryContext } from "./victory-context";

export async function quickShareCanvas(
  input: QuickMatchRecord | ScoringState,
): Promise<HTMLCanvasElement> {
  const record = "labels" in input;
  const labelA = record ? input.labels.sideA : input.labelA;
  const labelB = record ? input.labels.sideB : input.labelB;
  const scoreA = record ? input.score.sideA : input.scoreA;
  const scoreB = record ? input.score.sideB : input.scoreB;
  const winner = input.winner;
  const stageLabel = "stageLabel" in input ? input.stageLabel : undefined;
  const comebackDeficit =
    "scoreEvents" in input ? winnerComebackDeficit(input) : 0;
  if (!winner) throw new Error("A result needs a winner before sharing.");
  const { element, context, mark } = await shareCanvasSurface(1080, 1350);

  drawCourtLines(context);
  drawStaticConfetti(context, { x: 35, y: 35, width: 1010, height: 430 }, 17);
  shareText(context, "PICKLE KING", 54, 72, {
    color: shareColors.lime,
    font: "900 24px 'Archivo Black', sans-serif",
  });
  shareText(context, (stageLabel ?? "QUICK MATCH").toUpperCase(), 1026, 72, {
    align: "right",
    color: shareColors.mist,
    font: "800 20px Manrope, sans-serif",
  });
  drawBrandMark(context, mark, 540, 72, 180);
  const winnerName = winner === "A" ? labelA : labelB;
  shareText(context, "FINAL SCORE", 540, 294, {
    align: "center",
    color: shareColors.lime,
    font: "900 22px Manrope, sans-serif",
  });
  shareText(context, fitShareText(winnerName, 20).toUpperCase(), 540, 405, {
    align: "center",
    font: "900 98px 'Archivo Black', sans-serif",
  });
  shareText(context, "WINS", 540, 500, {
    align: "center",
    color: shareColors.lime,
    font: "900 112px 'Archivo Black', sans-serif",
  });
  shareText(context, "C R O W N   S E C U R E D", 540, 548, {
    align: "center",
    color: shareColors.lime,
    font: "900 17px Manrope, sans-serif",
  });
  drawScoreArena(context, { labelA, labelB, scoreA, scoreB, winner });
  const contextLabel =
    comebackDeficit >= 3
      ? `COMEBACK · TRAILED BY ${comebackDeficit}`
      : input.finishReason && input.finishReason !== "target"
        ? victoryContext({ ...input, scoreA, scoreB }).toUpperCase()
        : "SETTLED ON COURT";
  shareText(context, contextLabel, 540, 1080, {
    align: "center",
    color: shareColors.lime,
    font: "900 22px Manrope, sans-serif",
  });
  drawShareFooter(context, 1080, 1268);
  return element;
}

function drawCourtLines(context: CanvasRenderingContext2D) {
  context.save();
  context.strokeStyle = "#20291c";
  context.lineWidth = 2;
  context.globalAlpha = 0.55;
  for (const offset of [-430, -260, 260, 430]) {
    context.beginPath();
    context.moveTo(540, 540);
    context.lineTo(540 + offset, 1220);
    context.stroke();
  }
  context.restore();
}

function drawScoreArena(
  context: CanvasRenderingContext2D,
  data: {
    labelA: string;
    labelB: string;
    scoreA: number;
    scoreB: number;
    winner: "A" | "B";
  },
) {
  context.save();
  context.fillStyle = shareColors.surface;
  context.strokeStyle = shareColors.lime;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(118, 620);
  context.lineTo(962, 620);
  context.lineTo(1015, 985);
  context.lineTo(65, 985);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();

  shareText(context, String(data.scoreA), 330, 875, {
    align: "center",
    color: data.winner === "A" ? shareColors.lime : shareColors.chalk,
    font: "900 230px 'Archivo Black', sans-serif",
  });
  shareText(context, "−", 540, 820, {
    align: "center",
    color: shareColors.mist,
    font: "700 72px Manrope, sans-serif",
  });
  shareText(context, String(data.scoreB), 750, 875, {
    align: "center",
    color: data.winner === "B" ? shareColors.lime : shareColors.chalk,
    font: "900 230px 'Archivo Black', sans-serif",
  });
  shareText(context, fitShareText(data.labelA, 18).toUpperCase(), 330, 945, {
    align: "center",
    color: data.winner === "A" ? shareColors.lime : shareColors.chalk,
    font: "900 34px Manrope, sans-serif",
  });
  shareText(context, fitShareText(data.labelB, 18).toUpperCase(), 750, 945, {
    align: "center",
    color: data.winner === "B" ? shareColors.lime : shareColors.chalk,
    font: "900 34px Manrope, sans-serif",
  });
}
