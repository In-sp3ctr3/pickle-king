import type { Match, TournamentBracket } from "../../tournament";
import {
  type BrandLockupAssets,
  drawBrandLockup,
  shareColors,
  shareFittedText,
  shareText,
} from "./share-canvas";

const INK = "#090b08";
const CREAM = "#f5f1e8";

export function drawChallengeSummary(
  context: CanvasRenderingContext2D,
  bracket: TournamentBracket,
) {
  const challenges = bracket.matches.filter(({ kind }) => kind === "challenge");
  if (!challenges.length) return;
  context.fillStyle = INK;
  context.fillRect(1246, 850, 300, 96);
  shareText(context, "LATE ENTRY CHALLENGE", 1264, 882, {
    color: shareColors.lime,
    font: "900 14px Manrope, sans-serif",
  });
  shareText(
    context,
    `${challenges.filter(({ status }) => status === "complete").length} OF ${challenges.length} MATCHES COMPLETE`,
    1264,
    919,
    { color: CREAM, font: "800 16px Manrope, sans-serif" },
  );
}

export function drawBracketPodium(
  context: CanvasRenderingContext2D,
  final: Match | undefined,
  bronze: Match | undefined,
  names: Map<string, string>,
) {
  if (!final?.winnerId || !final.loserId || !bronze?.winnerId) return;
  const places = [
    ["1", "CHAMPION", final.winnerId, 570],
    ["2", "RUNNER-UP", final.loserId, 800],
    ["3", "THIRD", bronze.winnerId, 1030],
  ] as const;
  for (const [place, label, playerId, x] of places) {
    shareText(context, place, x - 86, 1058, {
      color: place === "1" ? shareColors.limeDeep : INK,
      font: "900 52px 'Archivo Black', sans-serif",
    });
    shareText(context, label, x - 24, 1025, {
      color: INK,
      font: "900 12px Manrope, sans-serif",
    });
    shareFittedText(
      context,
      (names.get(playerId) ?? "Player").toUpperCase(),
      x - 24,
      1058,
      {
        color: INK,
        family: "Manrope, sans-serif",
        weight: 900,
        maxSize: 18,
        minSize: 12,
        maxWidth: 170,
      },
    );
  }
}

export function drawBracketBrandFooter(
  context: CanvasRenderingContext2D,
  lockup: BrandLockupAssets,
  width: number,
  height: number,
) {
  drawBrandLockup(context, lockup, width / 2, height - 54, 300);
}
