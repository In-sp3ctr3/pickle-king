import type {
  EliminationGroup,
  PlayerStanding,
  TournamentBracket,
  TournamentResult,
  UpsetResult,
} from "./types";

export function calculateTournamentResult(
  bracket: TournamentBracket,
): TournamentResult {
  const final = bracket.matches.find(({ id }) => id === bracket.finalMatchId);
  const bronze = bracket.matches.find(({ id }) => id === bracket.bronzeMatchId);
  if (
    !final?.winnerId ||
    !final.loserId ||
    !bronze?.winnerId ||
    !bronze.loserId ||
    bracket.matches.some(({ status }) => status !== "complete")
  ) {
    throw new Error("Tournament results require every match to be complete.");
  }
  const standings = new Map<string, PlayerStanding>(
    bracket.players.map(({ id }) => [
      id,
      {
        playerId: id,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        differential: 0,
        eliminatedRound: null,
      },
    ]),
  );
  const seedByPlayer = new Map(
    bracket.players.map(({ id, seed }) => [id, seed ?? 0]),
  );
  const upsetWins: UpsetResult[] = [];

  for (const match of bracket.matches) {
    const sideA = match.sideA?.memberIds[0];
    const sideB = match.sideB?.memberIds[0];
    if (!sideA || !sideB || !match.winnerId || !match.loserId) continue;
    const first = standings.get(sideA)!;
    const second = standings.get(sideB)!;
    first.pointsFor += match.scoreA;
    first.pointsAgainst += match.scoreB;
    second.pointsFor += match.scoreB;
    second.pointsAgainst += match.scoreA;
    standings.get(match.winnerId)!.wins += 1;
    standings.get(match.loserId)!.losses += 1;
    if (match.kind !== "bronze") {
      standings.get(match.loserId)!.eliminatedRound = match.round;
    }
    const winnerSeed = seedByPlayer.get(match.winnerId) ?? 0;
    const loserSeed = seedByPlayer.get(match.loserId) ?? 0;
    if (winnerSeed > loserSeed) {
      upsetWins.push({
        matchId: match.id,
        winnerId: match.winnerId,
        loserId: match.loserId,
        seedDifference: winnerSeed - loserSeed,
      });
    }
  }
  const values = [...standings.values()].map((standing) => ({
    ...standing,
    differential: standing.pointsFor - standing.pointsAgainst,
  }));
  const podiumRank = new Map([
    [final.winnerId, 0],
    [final.loserId, 1],
    [bronze.winnerId, 2],
    [bronze.loserId, 3],
  ]);
  const elimination = Map.groupBy(
    values.filter(({ eliminatedRound }) => eliminatedRound !== null) as Array<
      PlayerStanding & { eliminatedRound: number }
    >,
    ({ eliminatedRound }) => eliminatedRound,
  );
  const eliminationGroups: EliminationGroup[] = [...elimination.entries()]
    .sort(([left], [right]) => right - left)
    .map(([round, standings]) => ({
      round,
      playerIds: standings.map(({ playerId }) => playerId),
    }));
  return {
    championId: final.winnerId,
    runnerUpId: final.loserId,
    thirdPlaceId: bronze.winnerId,
    standings: values.sort((left, right) => {
      const leftPodium = podiumRank.get(left.playerId);
      const rightPodium = podiumRank.get(right.playerId);
      if (leftPodium !== undefined || rightPodium !== undefined) {
        return (leftPodium ?? 99) - (rightPodium ?? 99);
      }
      return (
        (right.eliminatedRound ?? 0) - (left.eliminatedRound ?? 0) ||
        right.wins - left.wins ||
        right.differential - left.differential ||
        (seedByPlayer.get(left.playerId) ?? 99) -
          (seedByPlayer.get(right.playerId) ?? 99)
      );
    }),
    upsetWins,
    eliminationGroups,
    matchHistory: bracket.matches.map((match) => ({ ...match })),
  };
}
