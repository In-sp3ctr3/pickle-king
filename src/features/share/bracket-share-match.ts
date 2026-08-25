import type { Match } from "../../tournament";
import {
  resolvedSide,
  sourceFallback,
  type ShareMatchPosition,
} from "./bracket-share-layout";
import { fitCanvasText, shareColors, shareText } from "./share-canvas";

const INK = "#090b08";
const CREAM = "#f5f1e8";
const MUTED = "#827f75";

export function bracketMatchPalette(status: Match["status"], isFinal: boolean) {
  const active = status === "complete" || isFinal;
  return {
    accent: active ? shareColors.lime : INK,
    border: active ? shareColors.lime : INK,
    fill: INK,
    loser: MUTED,
    text: CREAM,
    winner: shareColors.lime,
  };
}

export function drawBracketMatch(
  context: CanvasRenderingContext2D,
  match: Match,
  position: ShareMatchPosition,
  names: Map<string, string>,
  matches: Map<string, Match>,
  isFinal: boolean,
) {
  const palette = bracketMatchPalette(match.status, isFinal);
  context.fillStyle = palette.fill;
  context.fillRect(position.x, position.y, position.width, position.height);
  context.strokeStyle = palette.border;
  context.lineWidth = isFinal ? 4 : 2;
  context.strokeRect(position.x, position.y, position.width, position.height);
  context.fillStyle = palette.accent;
  context.fillRect(position.x, position.y, 5, position.height);
  shareText(
    context,
    matchLabel(match, isFinal),
    position.x + 14,
    position.y + 18,
    {
      color: "#bbb6aa",
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
  const palette = bracketMatchPalette(match.status, false);
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
    color: winner ? palette.winner : loser ? palette.loser : palette.text,
    font: `800 ${fontSize}px Manrope, sans-serif`,
  });
  if (match.status === "complete") {
    shareText(context, String(score), position.x + position.width - 12, y, {
      align: "right",
      color: winner ? palette.winner : palette.loser,
      font: "900 17px Manrope, sans-serif",
    });
  }
  if (loser) {
    context.strokeStyle = palette.loser;
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
