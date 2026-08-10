import { describe, expect, it } from "vitest";
import {
  calculatePreliminaryStandings,
  calculateTournamentResult,
  completeMatch,
  correctionNeedsConfirmation,
  correctMatchResult,
  createTournament,
  getNextMatch,
  getReadySchedule,
  planLateEntry,
  resetTournamentBracket,
  startMatch,
} from "./index";
import type { Player, TournamentBracket, TournamentConfig } from "./types";

const players: Player[] = Array.from({ length: 4 }, (_, index) => ({
  id: `p${index + 1}`,
  name: `Player ${index + 1}`,
  rating: ["5.0", "4.0", "3.5", "3.0"][index] as Player["rating"],
}));
const ratings: Player["rating"][] = ["5.5+", "5.0", "4.5", "4.0", "3.5", "3.0"];

function field(size: number): Player[] {
  return ratings.slice(0, size).map((rating, index) => ({
    id: `p${index + 1}`,
    name: `Player ${index + 1}`,
    rating,
  }));
}
const config: TournamentConfig = {
  format: "round-robin-finals",
  drawStyle: "ranked",
  timingMode: "timed",
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 11,
  randomSeed: "rr-lifecycle",
};

function completeNext(tournament: TournamentBracket, at: number) {
  const next = getNextMatch(tournament)!;
  return completeMatch(tournament, next.id, 11, 5, at);
}

function finishPreliminaries(tournament: TournamentBracket) {
  let current = tournament;
  let completedAt = 1;
  while (
    current.matches.some(
      ({ kind, status }) => kind === "round-robin" && status !== "complete",
    )
  ) {
    current = completeNext(current, completedAt++);
  }
  return current;
}

describe("round-robin lifecycle", () => {
  it("unlocks one preliminary round at a time, then bronze before final", () => {
    let tournament = createTournament(players, config);
    expect(getReadySchedule(tournament).map(({ id }) => id)).toEqual([
      "rr-r1-m1",
      "rr-r1-m2",
    ]);
    tournament = completeNext(tournament, 1);
    expect(getReadySchedule(tournament)).toHaveLength(1);
    tournament = completeNext(tournament, 2);
    expect(getReadySchedule(tournament).map(({ round }) => round)).toEqual([
      2, 2,
    ]);
    for (let index = 0; index < 4; index += 1)
      tournament = completeNext(tournament, index + 3);
    expect(getReadySchedule(tournament).map(({ id }) => id)).toEqual([
      "bronze",
    ]);
    expect(tournament.matches.find(({ id }) => id === "final")?.status).toBe(
      "waiting",
    );
    expect(() => completeMatch(tournament, "final", 11, 5, 7)).toThrow(
      /third-place/i,
    );
    tournament = completeNext(tournament, 7);
    expect(getReadySchedule(tournament).map(({ id }) => id)).toEqual(["final"]);
  });

  it.each([5, 6])(
    "gates all preliminary rounds and placements for %i players",
    (size) => {
      let tournament = createTournament(field(size), config);
      const preliminaryRounds = Math.max(
        ...tournament.matches
          .filter(({ kind }) => kind === "round-robin")
          .map(({ round }) => round),
      );
      let completedAt = 1;
      for (let round = 1; round <= preliminaryRounds; round += 1) {
        const roundMatches = tournament.matches.filter(
          (match) => match.kind === "round-robin" && match.round === round,
        );
        expect(
          getReadySchedule(tournament).every((match) => match.round === round),
        ).toBe(true);
        for (const match of roundMatches) {
          tournament = completeMatch(
            tournament,
            match.id,
            11,
            5,
            completedAt++,
          );
        }
      }
      expect(getReadySchedule(tournament).map(({ id }) => id)).toEqual([
        "bronze",
      ]);
      expect(tournament.matches.find(({ id }) => id === "final")?.status).toBe(
        "waiting",
      );
      tournament = completeNext(tournament, completedAt++);
      expect(getReadySchedule(tournament).map(({ id }) => id)).toEqual([
        "final",
      ]);
    },
  );

  it("recalculates placements and resets both only after confirmation when play started", () => {
    let tournament = finishPreliminaries(createTournament(field(6), config));
    tournament = startMatch(tournament, "bronze", 7);
    expect(correctionNeedsConfirmation(tournament, "rr-r1-m1")).toBe(true);
    expect(() => correctMatchResult(tournament, "rr-r1-m1", 5, 11, 8)).toThrow(
      /confirm reset/i,
    );
    const corrected = correctMatchResult(
      tournament,
      "rr-r1-m1",
      5,
      11,
      8,
      true,
    );
    expect(
      corrected.matches.filter(
        ({ kind, status }) => kind === "round-robin" && status === "complete",
      ),
    ).toHaveLength(15);
    expect(corrected.matches.find(({ id }) => id === "bronze")).toMatchObject({
      status: "ready",
      scoreA: 0,
      scoreB: 0,
      startedAt: null,
    });
    expect(corrected.matches.find(({ id }) => id === "final")).toMatchObject({
      status: "waiting",
      scoreA: 0,
      scoreB: 0,
      startedAt: null,
    });
    const standings = calculatePreliminaryStandings(corrected);
    expect(corrected.matches.find(({ id }) => id === "final")?.sideA).toEqual({
      memberIds: [standings[0].playerId],
    });
    expect(corrected.matches.find(({ id }) => id === "bronze")?.sideA).toEqual({
      memberIds: [standings[2].playerId],
    });
  });

  it("corrects a preliminary without confirmation before placement starts", () => {
    const tournament = finishPreliminaries(createTournament(field(5), config));
    expect(correctionNeedsConfirmation(tournament, "rr-r1-m1")).toBe(false);
    const corrected = correctMatchResult(tournament, "rr-r1-m1", 5, 11, 8);
    expect(
      corrected.matches.filter(
        ({ kind, status }) => kind === "round-robin" && status === "complete",
      ),
    ).toHaveLength(10);
    expect(corrected.matches.find(({ id }) => id === "bronze")?.status).toBe(
      "ready",
    );
  });

  it("replays the exact schedule and calculates a four-match podium result", () => {
    let tournament = finishPreliminaries(createTournament(players, config));
    tournament = completeNext(tournament, 7);
    tournament = completeNext(tournament, 8);
    const result = calculateTournamentResult(tournament);
    expect(
      result.standings.slice(0, 3).map(({ playerId }) => playerId),
    ).toEqual([result.championId, result.runnerUpId, result.thirdPlaceId]);
    expect(
      result.standings.every(({ wins, losses }) => wins + losses === 4),
    ).toBe(true);
    expect(result.eliminationGroups).toEqual([]);
    expect(
      result.preliminaryStandings?.map(({ playerId }) => playerId),
    ).toHaveLength(4);
    const sources = tournament.matches.map(({ sourceA, sourceB }) => [
      sourceA,
      sourceB,
    ]);
    const replay = resetTournamentBracket(tournament);
    expect(
      replay.matches.map(({ sourceA, sourceB }) => [sourceA, sourceB]),
    ).toEqual(sources);
    expect(getNextMatch(replay)?.id).toBe("rr-r1-m1");
  });

  it("replays the exact six-player schedule", () => {
    let tournament = finishPreliminaries(createTournament(field(6), config));
    tournament = completeNext(tournament, 20);
    tournament = completeNext(tournament, 21);
    const replay = resetTournamentBracket(tournament);
    expect(
      replay.matches.map(({ sourceA, sourceB }) => [sourceA, sourceB]),
    ).toEqual(
      tournament.matches.map(({ sourceA, sourceB }) => [sourceA, sourceB]),
    );
    expect(getNextMatch(replay)?.id).toBe("rr-r1-m1");
  });

  it("rejects late entry", () => {
    const tournament = createTournament(players, config);
    expect(() =>
      planLateEntry(
        tournament,
        { id: "late", name: "Late", rating: "3.5" },
        {
          now: 0,
          randomSeed: "late",
          sessionDeadline: null,
          transitionSeconds: 0,
        },
      ),
    ).toThrow(/round robin/i);
  });
});
