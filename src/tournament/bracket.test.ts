import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  allocateByes,
  completeMatch,
  createTournamentBracket,
  getNextMatch,
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
