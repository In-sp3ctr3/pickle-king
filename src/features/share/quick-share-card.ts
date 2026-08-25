import type { QuickMatchRecord } from "../../history";
import type { ScoringState } from "../../match/types";
import { shareCanvasSurface } from "./share-canvas";
import { shareDimensions, type ShareFormat } from "./share-format";
import {
  drawQuickShareLayout,
  type QuickShareCardData,
} from "./quick-share-layouts";

export type QuickShareStyle = "poster" | "frame" | "receipt";

export async function quickShareCanvas(
  input: QuickMatchRecord | ScoringState,
  format: ShareFormat = "feed",
  style: QuickShareStyle = "poster",
): Promise<HTMLCanvasElement> {
  if (!input.winner) throw new Error("A result needs a winner before sharing.");
  const { height, width } = shareDimensions(format);
  const { context, element, lockup } = await shareCanvasSurface(
    width,
    height,
    quickShareTemplatePath(style, format),
  );
  drawQuickShareLayout(
    context,
    lockup,
    scoreCardData(input),
    width,
    height,
    style,
  );
  return element;
}

export function quickShareFileName(
  style: QuickShareStyle,
  format: ShareFormat,
) {
  return `pickle-king-score-result-${style}-${format}.png`;
}

export function quickShareTemplatePath(
  style: QuickShareStyle,
  format: ShareFormat,
) {
  return `/share/templates/quick-${style}-${format}.webp`;
}

export function quickShareHeading(
  format: QuickShareCardData["format"],
  date: string,
  stage?: string,
): [string, string] {
  return [format, stage ? `${stage.toUpperCase()} · ${date}` : date];
}

function scoreCardData(
  input: QuickMatchRecord | ScoringState,
): QuickShareCardData {
  const record = "labels" in input;
  const labelA = record ? input.labels.sideA : input.labelA;
  const labelB = record ? input.labels.sideB : input.labelB;
  const scoreA = record ? input.score.sideA : input.scoreA;
  const scoreB = record ? input.score.sideB : input.scoreB;
  const winnerA = input.winner === "A";
  const format = record
    ? input.format
    : (input.participantNames?.sideA.length ?? 1) > 1
      ? "doubles"
      : "singles";
  const date = resultDate(record ? input.completedAt : Date.now());
  const exportFormat = format.toUpperCase() as QuickShareCardData["format"];
  const stage =
    "stageLabel" in input && input.stageLabel ? input.stageLabel : undefined;
  return {
    date,
    format: exportFormat,
    heading: quickShareHeading(exportFormat, date, stage),
    loserName: winnerA ? labelB : labelA,
    loserScore: winnerA ? scoreB : scoreA,
    winnerName: winnerA ? labelA : labelB,
    winnerScore: winnerA ? scoreA : scoreB,
  };
}

function resultDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  })
    .format(timestamp)
    .toUpperCase();
}
