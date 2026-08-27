import type { MatchTeam, ScoringState } from "../../match/types";

export type ServePlayer = { id: string; name: string };

export function servePlayers(
  scorer: ScoringState,
  team: MatchTeam,
): ServePlayer[] {
  const ids = team === "A" ? scorer.sideA.memberIds : scorer.sideB.memberIds;
  const names =
    team === "A"
      ? scorer.participantNames?.sideA
      : scorer.participantNames?.sideB;
  return ids.map((id, index) => ({ id, name: names?.[index] ?? id }));
}

export function servePlayerName(
  scorer: ScoringState,
  team: MatchTeam,
  playerId: string,
): string {
  return (
    servePlayers(scorer, team).find(({ id }) => id === playerId)?.name ??
    playerId
  );
}
