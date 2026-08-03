import type { TournamentBracket } from "../../tournament";

export function tournamentShareContentKey(bracket: TournamentBracket) {
  return JSON.stringify({
    bronzeMatchId: bracket.bronzeMatchId,
    finalMatchId: bracket.finalMatchId,
    matches: bracket.matches.map((match) => ({
      comebackDeficit: match.comebackDeficit,
      config: match.config,
      id: match.id,
      kind: match.kind,
      loserId: match.loserId,
      round: match.round,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      sideA: match.sideA?.memberIds ?? null,
      sideB: match.sideB?.memberIds ?? null,
      status: match.status,
      winnerId: match.winnerId,
    })),
    players: bracket.players.map(({ id, name, rating, seed }) => ({
      id,
      name,
      rating,
      seed: seed ?? null,
    })),
  });
}
