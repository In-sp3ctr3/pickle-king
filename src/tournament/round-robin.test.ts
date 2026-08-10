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

describe("small-field round robin", () => {
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

  it.each([
    [4, 6, 8, 3],
    [5, 10, 12, 5],
    [6, 15, 17, 5],
  ])(
    "creates every pairing once for %i players",
    (size, preliminaryCount, totalCount, roundCount) => {
      const tournament = createTournament(field(size), config);
      const repeated = createTournament(field(size), config);
      const preliminaries = tournament.matches.filter(
        ({ kind }) => kind === "round-robin",
      );
      const pairings = preliminaries.map(({ sideA, sideB }) =>
        [sideA!.memberIds[0], sideB!.memberIds[0]].toSorted().join(":"),
      );

      expect(tournament).toMatchObject({
        bracketSize: size,
        roundCount: roundCount + 1,
      });
      expect(tournament.matches).toHaveLength(totalCount);
      expect(
        repeated.matches.map(({ sourceA, sourceB }) => [sourceA, sourceB]),
      ).toEqual(
        tournament.matches.map(({ sourceA, sourceB }) => [sourceA, sourceB]),
      );
      expect(preliminaries).toHaveLength(preliminaryCount);
      expect(new Set(pairings)).toHaveLength(preliminaryCount);
      expect(
        new Set(
          tournament.matches.map(({ config: matchConfig }) =>
            JSON.stringify(matchConfig),
          ),
        ),
      ).toHaveLength(1);
      for (const player of tournament.players) {
        expect(
          pairings.filter((pairing) => pairing.includes(player.id)),
        ).toHaveLength(size - 1);
      }
    },
  );

  it("rotates exactly one real bye through five-player rounds", () => {
    const tournament = createTournament(field(5), config);
    for (let round = 1; round <= 5; round += 1) {
      const matches = tournament.matches.filter(
        (match) => match.kind === "round-robin" && match.round === round,
      );
      const playing = new Set(
        matches.flatMap(({ sideA, sideB }) => [
          sideA!.memberIds[0],
          sideB!.memberIds[0],
        ]),
      );
      expect(matches).toHaveLength(2);
      expect(playing).toHaveLength(4);
      expect(
        tournament.players.filter(({ id }) => !playing.has(id)),
      ).toHaveLength(1);
      expect(matches.every(({ sideA, sideB }) => sideA && sideB)).toBe(true);
    }
  });

  it("generates the six-player circle schedule deterministically", () => {
    const tournament = createTournament(field(6), config);
    expect(
      tournament.matches
        .filter(({ kind }) => kind === "round-robin")
        .map(({ sideA, sideB }) => [sideA!.memberIds[0], sideB!.memberIds[0]]),
    ).toEqual([
      ["p1", "p6"],
      ["p2", "p5"],
      ["p3", "p4"],
      ["p1", "p5"],
      ["p6", "p4"],
      ["p2", "p3"],
      ["p1", "p4"],
      ["p5", "p3"],
      ["p6", "p2"],
      ["p1", "p3"],
      ["p4", "p2"],
      ["p5", "p6"],
      ["p1", "p2"],
      ["p3", "p6"],
      ["p4", "p5"],
    ]);
  });

  it("rejects the format outside four to six players", () => {
    expect(() => createTournament(players.slice(0, 3), config)).toThrow(
      /4 to 6/i,
    );
    expect(() =>
      createTournament(
        field(6).concat({
          id: "p7",
          name: "Player 7",
          rating: "2.5",
        }),
        config,
      ),
    ).toThrow(/4 to 6/i);
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
