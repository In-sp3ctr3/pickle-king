import type { Match, TournamentBracket } from "./types";

export function matchStageLabel(
  bracket: Pick<
    TournamentBracket,
    "bronzeMatchId" | "finalMatchId" | "roundCount"
  >,
  match: Pick<Match, "id" | "kind" | "round">,
): string | null {
  if (match.id === bracket.bronzeMatchId || match.kind === "bronze") {
    return "Third place";
  }
  if (match.id === bracket.finalMatchId) return "Final";
  if (match.kind === "elimination" && match.round === bracket.roundCount - 1) {
    return "Semifinal";
  }
  return null;
}
