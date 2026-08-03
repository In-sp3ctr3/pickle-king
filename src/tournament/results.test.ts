import { describe, expect, it } from "vitest";
import { completeMatch, createTournamentBracket } from "./bracket";
import { calculateTournamentResult } from "./results";
import { getNextMatch } from "./schedule";
import type { Player, TournamentConfig } from "./types";

const config: TournamentConfig = {
  drawStyle: "ranked",
  timingMode: "timed",
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 11,
  randomSeed: "results",
};
const players: Player[] = [
  { id: "a", name: "A", rating: "5.0" },
  { id: "b", name: "B", rating: "4.0" },
  { id: "c", name: "C", rating: "3.5" },
  { id: "d", name: "D", rating: "3.0" },
];

describe("tournament results", () => {
  it("calculates podium, points, differential, and upset wins", () => {
    let bracket = createTournamentBracket(players, config);
    let time = 0;
    while (getNextMatch(bracket)) {
      const match = getNextMatch(bracket)!;
      const upsetFinal = match.id === bracket.finalMatchId;
      bracket = completeMatch(
        bracket,
        match.id,
        upsetFinal ? 7 : 11,
        upsetFinal ? 11 : 5,
        (time += 1_000),
      );
    }
    const result = calculateTournamentResult(bracket);
    expect(result.championId).toBe("b");
    expect(result.runnerUpId).toBe("a");
    expect(result.thirdPlaceId).toBeTruthy();
    expect(
      result.standings.slice(0, 3).map(({ playerId }) => playerId),
    ).toEqual([result.championId, result.runnerUpId, result.thirdPlaceId]);
    expect(result.eliminationGroups).toHaveLength(bracket.roundCount);
    expect(result.matchHistory).toHaveLength(bracket.matches.length);
    expect(result.upsetWins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          matchId: bracket.finalMatchId,
          winnerId: "b",
        }),
      ]),
    );
    expect(
      result.standings.every(
        ({ differential, pointsFor, pointsAgainst }) =>
          differential === pointsFor - pointsAgainst,
      ),
    ).toBe(true);
  });
});
