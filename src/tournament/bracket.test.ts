import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  allocateByes,
  completeMatch,
  createTournamentBracket,
  getNextMatch,
  resetTournamentBracket,
} from "./index";
import type {
  Match,
  Player,
  SkillLevel,
  TournamentBracket,
  TournamentConfig,
} from "./types";

const levels: SkillLevel[] = ["5.5+", "5.0", "4.5", "4.0", "3.5", "3.0", "2.5"];

const config: TournamentConfig = {
  drawStyle: "ranked",
  timingMode: "timed",
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 11,
  randomSeed: "test-seed",
};

function players(count: number, tied = false): Player[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    name: `Player ${index + 1}`,
    rating: tied ? "3.5" : levels[Math.min(index, levels.length - 1)],
  }));
}

function chooseHigherSeed(
  bracket: TournamentBracket,
  match: Match,
): [number, number] {
  const seedById = new Map(
    bracket.players.map(({ id, seed }) => [id, seed ?? 99]),
  );
  const left = match.sideA!.memberIds[0];
  const right = match.sideB!.memberIds[0];
  return seedById.get(left)! < seedById.get(right)! ? [11, 4] : [4, 11];
}

function finishTournament(bracket: TournamentBracket): TournamentBracket {
  let current = bracket;
  let timestamp = 1_000;
  while (getNextMatch(current)) {
    const match = getNextMatch(current)!;
    const [scoreA, scoreB] = chooseHigherSeed(current, match);
    current = completeMatch(current, match.id, scoreA, scoreB, timestamp);
    timestamp += 1_000;
  }
  return current;
}

describe("tournament bracket", () => {
  it.each(Array.from({ length: 13 }, (_, index) => index + 4))(
    "places every one of %i entrants once and creates N played matches",
    (count) => {
      const bracket = createTournamentBracket(players(count), config);
      const initialIds = bracket.matches
        .filter(({ round }) => round === 1)
        .flatMap((match) => [
          ...(match.sideA?.memberIds ?? []),
          ...(match.sideB?.memberIds ?? []),
        ]);
      const byeIds = bracket.players
        .map(({ id }) => id)
        .filter((id) => !initialIds.includes(id));
      expect(new Set([...initialIds, ...byeIds])).toHaveLength(count);
      expect(bracket.matches).toHaveLength(count);
      expect(
        bracket.matches.filter(({ kind }) => kind === "bronze"),
      ).toHaveLength(1);
      const expectedByeIds = bracket.players
        .slice(0, bracket.bracketSize - count)
        .map(({ id }) => id);
      expect(
        new Set(allocateByes(bracket.players, bracket.bracketSize)),
      ).toEqual(new Set(expectedByeIds));
      const finished = finishTournament(bracket);
      const final = finished.matches.find(
        ({ id }) => id === finished.finalMatchId,
      )!;
      expect([final.sideA?.memberIds[0], final.sideB?.memberIds[0]]).toEqual(
        expect.arrayContaining(["p1", "p2"]),
      );
    },
  );

  it("gives the strongest seeds byes and keeps the top two apart until final", () => {
    const bracket = createTournamentBracket(players(5), config);
    expect(allocateByes(bracket.players, bracket.bracketSize)).toEqual([
      "p1",
      "p2",
      "p3",
    ]);
    const roundOneIds = bracket.matches
      .filter(({ round }) => round === 1)
      .flatMap((match) => [
        ...(match.sideA?.memberIds ?? []),
        ...(match.sideB?.memberIds ?? []),
      ]);
    expect(roundOneIds).not.toContain("p1");
    expect(roundOneIds).not.toContain("p2");
    const finished = finishTournament(bracket);
    const final = finished.matches.find(
      ({ id }) => id === finished.finalMatchId,
    )!;
    expect([final.sideA?.memberIds[0], final.sideB?.memberIds[0]]).toEqual(
      expect.arrayContaining(["p1", "p2"]),
    );
  });

  it("shuffles the complete field deterministically for a random draw", () => {
    const random = createTournamentBracket(players(8), {
      ...config,
      drawStyle: "random",
    });
    const openingIds = random.matches
      .filter(({ round }) => round === 1)
      .flatMap((match) => [match.sideA, match.sideB])
      .flatMap((side) => side?.memberIds ?? []);
    expect(new Set(openingIds)).toEqual(
      new Set(players(8).map(({ id }) => id)),
    );
    expect(
      createTournamentBracket(players(8), {
        ...config,
        drawStyle: "random",
      }).matches,
    ).toEqual(random.matches);
    expect(
      createTournamentBracket(players(8), {
        ...config,
        drawStyle: "random",
        randomSeed: "another-draw",
      }).matches.map(({ sourceA, sourceB }) => [sourceA, sourceB]),
    ).not.toEqual(
      random.matches.map(({ sourceA, sourceB }) => [sourceA, sourceB]),
    );
  });

  it("allocates random-draw byes deterministically without favoring top seeds", () => {
    const first = createTournamentBracket(players(6), {
      ...config,
      drawStyle: "random",
      randomSeed: "random-byes",
    });
    const second = createTournamentBracket(players(6), {
      ...config,
      drawStyle: "random",
      randomSeed: "random-byes",
    });
    const openingIds = new Set(
      first.matches
        .filter(({ round }) => round === 1)
        .flatMap(({ sideA, sideB }) => [sideA, sideB])
        .flatMap((side) => side?.memberIds ?? []),
    );
    const byeIds = first.players
      .map(({ id }) => id)
      .filter((id) => !openingIds.has(id));
    expect(byeIds).toHaveLength(2);
    expect(first.matches).toEqual(second.matches);
    expect(byeIds).not.toEqual(first.players.slice(0, 2).map(({ id }) => id));
  });

  it("randomizes equal ratings deterministically", () => {
    const first = createTournamentBracket(players(12, true), config);
    const second = createTournamentBracket(players(12, true), config);
    const changed = createTournamentBracket(players(12, true), {
      ...config,
      randomSeed: "different",
    });
    expect(first.players).toEqual(second.players);
    expect(first.players.map(({ id }) => id)).not.toEqual(
      changed.players.map(({ id }) => id),
    );
  });

  it("creates an untimed bracket without artificial match caps", () => {
    const bracket = createTournamentBracket(players(8), {
      ...config,
      timingMode: "untimed",
    });
    expect(bracket.matches.every(({ config }) => config.capMs === null)).toBe(
      true,
    );
  });

  it("preserves bracket invariants across entrant counts and shuffle seeds", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 4, max: 16 }),
        fc.string({ minLength: 1, maxLength: 24 }),
        (count, randomSeed) => {
          const bracket = createTournamentBracket(players(count, true), {
            ...config,
            randomSeed,
          });
          const finished = finishTournament(bracket);
          expect(new Set(bracket.players.map(({ seed }) => seed))).toHaveLength(
            count,
          );
          expect(finished.matches).toHaveLength(count);
          expect(
            finished.matches.every(({ status }) => status === "complete"),
          ).toBe(true);
          const randomBracket = createTournamentBracket(players(count), {
            ...config,
            drawStyle: "random",
            randomSeed,
          });
          const openingIds = randomBracket.matches
            .filter(({ round }) => round === 1)
            .flatMap(({ sideA, sideB }) => [sideA, sideB])
            .flatMap((side) => side?.memberIds ?? []);
          const byeCount = randomBracket.bracketSize - count;
          expect(new Set(openingIds)).toHaveLength(count - byeCount);
          expect(finishTournament(randomBracket).matches).toHaveLength(count);
        },
      ),
      { numRuns: 80 },
    );
  });

  it("advances winners, resolves bronze, and is idempotent after completion", () => {
    let bracket = createTournamentBracket(players(4), config);
    const first = getNextMatch(bracket)!;
    bracket = completeMatch(bracket, first.id, 11, 6, 1_000);
    expect(bracket.matches.find(({ id }) => id === first.id)?.winnerId).toBe(
      first.sideA?.memberIds[0],
    );
    expect(completeMatch(bracket, first.id, 0, 11, 2_000)).toBe(bracket);
    bracket = finishTournament(bracket);
    expect(bracket.matches.every(({ status }) => status === "complete")).toBe(
      true,
    );
  });

  it("resets scores while preserving the exact draw graph", () => {
    let bracket = createTournamentBracket(players(6), config);
    const originalSources = bracket.matches.map(({ id, sourceA, sourceB }) => ({
      id,
      sourceA,
      sourceB,
    }));
    const next = getNextMatch(bracket)!;
    bracket = completeMatch(bracket, next.id, 11, 5, 1_000);
    const replay = resetTournamentBracket(bracket);
    expect(
      replay.matches.map(({ id, sourceA, sourceB }) => ({
        id,
        sourceA,
        sourceB,
      })),
    ).toEqual(originalSources);
    expect(
      replay.matches.every(
        ({ scoreA, scoreB }) => scoreA === 0 && scoreB === 0,
      ),
    ).toBe(true);
    expect(getNextMatch(replay)).not.toBeNull();
  });

  it("requires an operator-selected participant to resolve a tied early finish", () => {
    const bracket = createTournamentBracket(players(4), config);
    const first = getNextMatch(bracket)!;
    expect(() => completeMatch(bracket, first.id, 5, 5, 1_000)).toThrow(
      /selected winner/i,
    );
    const selected = first.sideB!.memberIds[0];
    const advanced = completeMatch(bracket, first.id, 5, 5, 1_000, selected);
    expect(advanced.matches.find(({ id }) => id === first.id)).toMatchObject({
      scoreA: 5,
      scoreB: 5,
      winnerId: selected,
      status: "complete",
    });
  });

  it("rejects later rounds, the final before bronze, and corrupt scores", () => {
    let bracket = createTournamentBracket(players(5), config);
    const earlyRoundTwo = bracket.matches.find(({ id }) => id === "r2-m2")!;
    expect(() =>
      completeMatch(bracket, earlyRoundTwo.id, 11, 5, 1_000),
    ).toThrow(/current round/i);
    expect(() =>
      completeMatch(bracket, getNextMatch(bracket)!.id, Number.NaN, 5, 1_000),
    ).toThrow(/valid/i);
    bracket = createTournamentBracket(players(4), config);
    for (let index = 0; index < 2; index += 1) {
      const match = getNextMatch(bracket)!;
      bracket = completeMatch(bracket, match.id, 11, 5, index + 1);
    }
    expect(() =>
      completeMatch(bracket, bracket.finalMatchId, 11, 5, 3),
    ).toThrow(/third-place/i);
  });
});
