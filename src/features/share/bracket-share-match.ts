import type { Match } from "../../tournament";
import {
  resolvedSide,
  sourceFallback,
  type ShareMatchPosition,
} from "./bracket-share-layout";
import { fitCanvasText, shareColors, shareText } from "./share-canvas";

export function drawBracketMatch(
  context: CanvasRenderingContext2D,
  match: Match,
  position: ShareMatchPosition,
  names: Map<string, string>,
  matches: Map<string, Match>,
  isFinal: boolean,
) {
  const panel = context.createLinearGradient(
    0,
    position.y,
    0,
    position.y + position.height,
  );
  panel.addColorStop(
    0,
    isFinal ? "rgba(54, 48, 24, 0.98)" : "rgba(28, 36, 25, 0.98)",
  );
  panel.addColorStop(1, "rgba(9, 12, 8, 0.98)");
  context.fillStyle = panel;
  context.fillRect(position.x, position.y, position.width, position.height);
  context.strokeStyle = isFinal ? shareColors.gold : "rgba(84, 99, 77, 0.72)";
  context.lineWidth = isFinal ? 4 : 2;
  context.strokeRect(position.x, position.y, position.width, position.height);
  context.fillStyle = isFinal
    ? shareColors.gold
    : match.status === "complete"
      ? shareColors.limeDeep
      : shareColors.line;
  context.fillRect(position.x, position.y, 5, position.height);
  shareText(
    context,
    matchLabel(match, isFinal),
    position.x + 14,
    position.y + 18,
    {
      color: shareColors.mist,
      font: "900 11px Manrope, sans-serif",
    },
  );
  drawMatchRow(
    context,
    match,
    "A",
    position,
    names,
    matches,
    Math.round(position.height * 0.51),
  );
  drawMatchRow(
    context,
    match,
    "B",
    position,
    names,
    matches,
    Math.round(position.height * 0.83),
  );
}

function drawMatchRow(
  context: CanvasRenderingContext2D,
  match: Match,
  side: "A" | "B",
  position: ShareMatchPosition,
  names: Map<string, string>,
  matches: Map<string, Match>,
  offsetY: number,
) {
  const sideData = resolvedSide(match, side, matches);
  const playerId = sideData?.memberIds[0];
  const rawName = playerId
    ? (names.get(playerId) ?? "Player")
    : sourceFallback(match, side, matches);
  const winner = match.status === "complete" && playerId === match.winnerId;
  const loser = match.status === "complete" && playerId === match.loserId;
  const score = side === "A" ? match.scoreA : match.scoreB;
  const scoreWidth = match.status === "complete" ? 36 : 8;
  const fontSize = position.width <= 190 ? 15 : 17;
  context.font = `800 ${fontSize}px Manrope, sans-serif`;
  const label = fitCanvasText(
    context,
    rawName,
    position.width - 32 - scoreWidth,
  );
  const x = position.x + 14;
  const y = position.y + offsetY;
  shareText(context, label, x, y, {
    color: winner ? shareColors.lime : loser ? "#747c6d" : shareColors.chalk,
    font: `800 ${fontSize}px Manrope, sans-serif`,
  });
  if (match.status === "complete") {
    shareText(context, String(score), position.x + position.width - 12, y, {
      align: "right",
      color: winner ? shareColors.lime : "#747c6d",
      font: "900 17px Manrope, sans-serif",
    });
  }
  if (loser) {
    context.strokeStyle = "#747c6d";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, y - fontSize * 0.35);
    context.lineTo(x + context.measureText(label).width, y - fontSize * 0.35);
    context.stroke();
  }
}

function matchLabel(match: Match, isFinal: boolean) {
  if (isFinal) return "FINAL";
  if (match.kind === "bronze") return "THIRD PLACE";
  return match.round > 1
    ? `ROUND ${match.round} · MATCH ${match.ordinal}`
    : `OPENING · MATCH ${match.ordinal}`;
}
