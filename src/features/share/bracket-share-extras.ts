import type { Match, TournamentBracket } from "../../tournament";
import { shareColors, shareFittedText, shareText } from "./share-canvas";
import { drawMedalBadge } from "./share-scene";

export function drawChallengeSummary(
  context: CanvasRenderingContext2D,
  bracket: TournamentBracket,
) {
  const challenges = bracket.matches.filter(({ kind }) => kind === "challenge");
  if (!challenges.length) return;
  context.fillStyle = "rgba(21, 27, 19, 0.94)";
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
    { color: shareColors.chalk, font: "800 16px Manrope, sans-serif" },
  );
}

export function drawBracketPodium(
  context: CanvasRenderingContext2D,
  final: Match | undefined,
  bronze: Match | undefined,
  names: Map<string, string>,
) {
  if (!final?.winnerId || !final.loserId || !bronze?.winnerId) return;
  for (const [place, playerId, x, y, color] of [
    ["2", final.loserId, 570, 1018, "#c8ced3"],
    ["1", final.winnerId, 800, 996, shareColors.gold],
    ["3", bronze.winnerId, 1030, 1028, "#bd7a42"],
  ] as const) {
    drawMedalBadge(context, x, y, place, color, place === "1" ? 70 : 60);
    shareFittedText(
      context,
      (names.get(playerId) ?? "Player").toUpperCase(),
      x,
      y + 72,
      {
        align: "center",
        color: shareColors.chalk,
        family: "Manrope, sans-serif",
        weight: 900,
        maxSize: 18,
        minSize: 13,
        maxWidth: 180,
      },
    );
  }
}
