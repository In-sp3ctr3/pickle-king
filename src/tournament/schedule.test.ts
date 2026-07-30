import { describe, expect, it } from "vitest";
import { completeMatch, createTournamentBracket } from "./bracket";
import { getReadySchedule } from "./schedule";
import type { Player, TournamentConfig } from "./types";

const players: Player[] = Array.from({ length: 8 }, (_, index) => ({
  id: `p${index + 1}`,
  name: `Player ${index + 1}`,
  rating: index < 2 ? "5.0" : "3.5",
}));
const config: TournamentConfig = {
  timingMode: "timed",
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 11,
  randomSeed: "schedule",
};

describe("one-court schedule", () => {
  it("finishes a round before later ready matches and favors longest rest", () => {
    let bracket = createTournamentBracket(players, config);
    const firstRound = getReadySchedule(bracket);
    expect(firstRound.every(({ round }) => round === 1)).toBe(true);
    const completionTimes = [1_000, 4_000, 2_000, 3_000];
    firstRound.forEach((match, index) => {
      bracket = completeMatch(bracket, match.id, 11, 5, completionTimes[index]);
    });
    const nextRound = getReadySchedule(bracket);
    expect(nextRound.map(({ id }) => id)).toEqual(["r2-m2", "r2-m1"]);
  });

  it("places the bronze match before the final", () => {
    let bracket = createTournamentBracket(players.slice(0, 4), config);
    while (getReadySchedule(bracket)[0]?.round === 1) {
      const match = getReadySchedule(bracket)[0];
      bracket = completeMatch(bracket, match.id, 11, 7, Date.now());
    }
    expect(getReadySchedule(bracket).map(({ id }) => id)).toEqual(["bronze"]);
    bracket = completeMatch(bracket, "bronze", 11, 8, Date.now());
    expect(getReadySchedule(bracket).map(({ id }) => id)).toEqual([
      bracket.finalMatchId,
    ]);
  });

  it("does not expose another match while the court is live", () => {
    const bracket = createTournamentBracket(players, config);
    const liveId = getReadySchedule(bracket)[0].id;
    const withLive = {
      ...bracket,
      matches: bracket.matches.map((match) =>
        match.id === liveId
          ? { ...match, status: "live" as const, startedAt: 1_000 }
          : match,
      ),
    };
    expect(getReadySchedule(withLive)).toEqual([]);
  });
});
