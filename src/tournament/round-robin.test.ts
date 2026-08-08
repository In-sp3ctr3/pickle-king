import { describe, expect, it } from "vitest";
import {
  calculatePreliminaryStandings,
  completeMatch,
  createTournament,
  createTournamentBracket,
  getNextMatch,
} from "./index";
import type { Player, TournamentBracket, TournamentConfig } from "./types";

const players: Player[] = [
  { id: "a", name: "A", rating: "5.0" },
  { id: "b", name: "B", rating: "4.0" },
  { id: "c", name: "C", rating: "3.5" },
  { id: "d", name: "D", rating: "3.0" },
];

const config: TournamentConfig = {
  format: "round-robin-finals",
  drawStyle: "ranked",
  timingMode: "timed",
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 11,
  randomSeed: "round-robin",
};

type Score = readonly [number, number];

function playPreliminaries(
  tournament: TournamentBracket,
  scores: Record<string, Score>,
): TournamentBracket {
  let current = tournament;
  let completedAt = 1_000;
  while (
    current.matches.some(
      ({ kind, status }) => kind === "round-robin" && status !== "complete",
    )
  ) {
    const match = getNextMatch(current)!;
    const [scoreA, scoreB] = scores[match.id];
    current = completeMatch(current, match.id, scoreA, scoreB, completedAt);
    completedAt += 1_000;
  }
  return current;
}

describe("four-player round robin", () => {
  it("creates every pairing once across three locked rounds", () => {
    const tournament = createTournament(players, config);
    expect(tournament.format).toBe("round-robin-finals");
    expect(tournament.matches).toHaveLength(8);
    const preliminaries = tournament.matches.filter(
      ({ kind }) => kind === "round-robin",
    );
    expect(preliminaries).toHaveLength(6);
    expect(
      preliminaries.map(({ sourceA, sourceB }) => [sourceA, sourceB]),
    ).toEqual([
      [
        { type: "player", playerId: "a" },
        { type: "player", playerId: "d" },
      ],
      [
        { type: "player", playerId: "b" },
        { type: "player", playerId: "c" },
      ],
      [
        { type: "player", playerId: "a" },
        { type: "player", playerId: "c" },
      ],
      [
        { type: "player", playerId: "d" },
        { type: "player", playerId: "b" },
      ],
      [
        { type: "player", playerId: "a" },
        { type: "player", playerId: "b" },
      ],
      [
        { type: "player", playerId: "c" },
        { type: "player", playerId: "d" },
      ],
    ]);
    expect(
      new Set(
        preliminaries.map(({ sideA, sideB }) =>
          [sideA!.memberIds[0], sideB!.memberIds[0]].toSorted().join(":"),
        ),
      ),
    ).toHaveLength(6);
    for (const player of players) {
      expect(
        preliminaries.filter(({ sideA, sideB }) =>
          [sideA!.memberIds[0], sideB!.memberIds[0]].includes(player.id),
        ),
      ).toHaveLength(3);
    }
    expect(
      preliminaries.filter(({ status }) => status === "ready"),
    ).toHaveLength(2);
    expect(tournament.matches.find(({ id }) => id === "bronze")).toMatchObject({
      sourceA: { type: "standing", rank: 3 },
      sourceB: { type: "standing", rank: 4 },
      status: "waiting",
    });
    expect(tournament.matches.find(({ id }) => id === "final")).toMatchObject({
      sourceA: { type: "standing", rank: 1 },
      sourceB: { type: "standing", rank: 2 },
      status: "waiting",
    });
  });

  it("rejects the format for any field other than exactly four", () => {
    expect(() => createTournament(players.slice(0, 3), config)).toThrow(
      /exactly four/i,
    );
    expect(() =>
      createTournament(
        [...players, { id: "e", name: "E", rating: "3.0" }],
        config,
      ),
    ).toThrow(/exactly four/i);
    expect(createTournamentBracket(players, config).format).toBe("knockout");
  });

  it("orders ranked and random schedules deterministically", () => {
    const ranked = createTournament(players.toReversed(), config);
    expect(ranked.players.map(({ id }) => id)).toEqual(["a", "b", "c", "d"]);
    const randomConfig = { ...config, drawStyle: "random" as const };
    const first = createTournament(players, randomConfig);
    const second = createTournament(players, randomConfig);
    const changed = createTournament(players, {
      ...randomConfig,
      randomSeed: "different",
    });
    expect(second.players).toEqual(first.players);
    expect(changed.players.map(({ id }) => id)).not.toEqual(
      first.players.map(({ id }) => id),
    );
  });

  it("uses head-to-head only for an exactly two-player wins tie", () => {
    const completed = playPreliminaries(createTournament(players, config), {
      "rr-r1-m1": [0, 11],
      "rr-r1-m2": [11, 0],
      "rr-r2-m1": [11, 10],
      "rr-r2-m2": [0, 11],
      "rr-r3-m1": [11, 10],
      "rr-r3-m2": [11, 0],
    });
    const standings = calculatePreliminaryStandings(completed);
    expect(standings.map(({ playerId }) => playerId)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(
      standings.find(({ playerId }) => playerId === "b")!.differential,
    ).toBeGreaterThan(
      standings.find(({ playerId }) => playerId === "a")!.differential,
    );
  });

  it("skips head-to-head for three-way ties, then uses differential, points, and stored order", () => {
    const byDifferential = playPreliminaries(
      createTournament(players, config),
      {
        "rr-r1-m1": [11, 10],
        "rr-r1-m2": [11, 10],
        "rr-r2-m1": [0, 11],
        "rr-r2-m2": [10, 11],
        "rr-r3-m1": [11, 10],
        "rr-r3-m2": [11, 0],
      },
    );
    expect(
      calculatePreliminaryStandings(byDifferential).map(
        ({ playerId }) => playerId,
      ),
    ).toEqual(["c", "b", "a", "d"]);

    const byPoints = playPreliminaries(createTournament(players, config), {
      "rr-r1-m1": [11, 1],
      "rr-r1-m2": [12, 8],
      "rr-r2-m1": [9, 15],
      "rr-r2-m2": [7, 11],
      "rr-r3-m1": [11, 9],
      "rr-r3-m2": [11, 7],
    });
    expect(
      calculatePreliminaryStandings(byPoints).map(({ playerId }) => playerId),
    ).toEqual(["c", "b", "a", "d"]);

    const byOrder = playPreliminaries(createTournament(players, config), {
      "rr-r1-m1": [11, 5],
      "rr-r1-m2": [11, 9],
      "rr-r2-m1": [9, 11],
      "rr-r2-m2": [5, 11],
      "rr-r3-m1": [11, 9],
      "rr-r3-m2": [11, 5],
    });
    expect(
      calculatePreliminaryStandings(byOrder).map(({ playerId }) => playerId),
    ).toEqual(["a", "b", "c", "d"]);
  });
});
