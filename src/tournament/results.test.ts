import { describe, expect, it } from "vitest";
import {
  completeMatch,
  createTournament,
  createTournamentBracket,
} from "./bracket";
import { calculateTournamentResult } from "./results";
import { getNextMatch } from "./schedule";
import type { Player, TournamentConfig } from "./types";

const config: TournamentConfig = {
  format: "knockout",
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
const sixPlayers: Player[] = ["5.5+", "5.0", "4.5", "4.0", "3.5", "3.0"].map(
  (rating, index) => ({
    id: `p${index + 1}`,
    name: `Player ${index + 1}`,
    rating: rating as Player["rating"],
  }),
);

function completeSchedule(bracket: ReturnType<typeof createTournament>) {
  let current = bracket;
  let completedAt = 1;
  while (getNextMatch(current)) {
    const match = getNextMatch(current)!;
    current = completeMatch(current, match.id, 11, 5, completedAt++);
  }
  return current;
}

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

  it("orders six-player results by podium then frozen preliminary ranks", () => {
    const bracket = completeSchedule(
      createTournament(sixPlayers, {
        ...config,
        format: "round-robin-finals",
      }),
    );
    const result = calculateTournamentResult(bracket);
    const preliminaryIds = result.preliminaryStandings!.map(
      ({ playerId }) => playerId,
    );

    expect(
      result.standings.slice(0, 4).map(({ playerId }) => playerId),
    ).toEqual([
      result.championId,
      result.runnerUpId,
      result.thirdPlaceId,
      bracket.matches.find(({ id }) => id === "bronze")!.loserId,
    ]);
    expect(result.standings.slice(4).map(({ playerId }) => playerId)).toEqual(
      preliminaryIds.slice(4),
    );
    expect(
      result.standings.map(({ playerId, wins, losses }) => ({
        playerId,
        played: wins + losses,
      })),
    ).toEqual(
      expect.arrayContaining([
        ...preliminaryIds
          .slice(0, 4)
          .map((playerId) => ({ playerId, played: 6 })),
        ...preliminaryIds.slice(4).map((playerId) => ({ playerId, played: 5 })),
      ]),
    );
  });
});
