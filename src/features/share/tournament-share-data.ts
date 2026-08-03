import type {
  Match,
  TournamentBracket,
  TournamentResult,
} from "../../tournament";

export function tournamentNames(bracket: TournamentBracket) {
  return new Map(bracket.players.map(({ id, name }) => [id, name]));
}

export function playerName(
  names: Map<string, string>,
  playerId: string | null | undefined,
  fallback = "Player",
) {
  return playerId ? (names.get(playerId) ?? fallback) : fallback;
}

export function matchPlayerId(match: Match, side: "A" | "B") {
  return (side === "A" ? match.sideA : match.sideB)?.memberIds[0] ?? null;
}

export function finalMatchData(
  bracket: TournamentBracket,
  result: TournamentResult,
) {
  const match = bracket.matches.find(({ id }) => id === bracket.finalMatchId);
  if (!match) throw new Error("Tournament final is unavailable.");
  const sideAId = matchPlayerId(match, "A");
  const sideBId = matchPlayerId(match, "B");
  return {
    match,
    championScore: result.championId === sideAId ? match.scoreA : match.scoreB,
    opponentId: result.championId === sideAId ? sideBId : sideAId,
    opponentScore: result.championId === sideAId ? match.scoreB : match.scoreA,
  };
}

export function championStanding(result: TournamentResult) {
  const standing = result.standings.find(
    ({ playerId }) => playerId === result.championId,
  );
  if (!standing)
    throw new Error("Tournament champion statistics are unavailable.");
  return standing;
}

export function closestCompletedMatch(result: TournamentResult) {
  return result.matchHistory
    .filter(
      (match) =>
        match.status === "complete" &&
        match.sideA?.memberIds[0] &&
        match.sideB?.memberIds[0],
    )
    .sort(
      (left, right) =>
        Math.abs(left.scoreA - left.scoreB) -
        Math.abs(right.scoreA - right.scoreB),
    )[0];
}
