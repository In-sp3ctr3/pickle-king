import { describe, expect, it } from "vitest";
import { completeMatch, createTournamentBracket } from "./bracket";
import {
  correctionNeedsConfirmation,
  correctMatchResult,
  startMatch,
} from "./lifecycle";
import { getNextMatch } from "./schedule";
import type { Player, TournamentConfig } from "./types";

const players: Player[] = Array.from({ length: 4 }, (_, index) => ({
  id: `p${index + 1}`,
  name: `Player ${index + 1}`,
  rating: index === 0 ? "5.0" : "3.5",
}));
const config: TournamentConfig = {
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 11,
  randomSeed: "correction",
};

describe("match lifecycle", () => {
  it("starts only the next scheduled one-court match", () => {
    const bracket = createTournamentBracket(players, config);
    const next = getNextMatch(bracket)!;
    expect(startMatch(bracket, next.id, 1_000).matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: next.id, status: "live" }),
      ]),
    );
    expect(() => startMatch(bracket, "r1-m2", 1_000)).toThrow(
      /next scheduled/i,
    );
  });

  it("corrects before dependency play and resets played downstream on confirmation", () => {
    let bracket = createTournamentBracket(players, config);
    const first = getNextMatch(bracket)!;
    bracket = completeMatch(bracket, first.id, 11, 5, 1_000);
    expect(correctionNeedsConfirmation(bracket, first.id)).toBe(false);
    bracket = correctMatchResult(bracket, first.id, 4, 11, 2_000);
    expect(bracket.matches.find(({ id }) => id === first.id)?.winnerId).toBe(
      first.sideB?.memberIds[0],
    );

    while (getNextMatch(bracket)) {
      const match = getNextMatch(bracket)!;
      bracket = completeMatch(bracket, match.id, 11, 5, 3_000);
    }
    expect(correctionNeedsConfirmation(bracket, first.id)).toBe(true);
    expect(() => correctMatchResult(bracket, first.id, 11, 4, 4_000)).toThrow(
      /confirm reset/i,
    );
    const corrected = correctMatchResult(bracket, first.id, 11, 4, 4_000, true);
    expect(
      corrected.matches.find(({ id }) => id === corrected.finalMatchId)?.status,
    ).toBe("ready");
    expect(
      corrected.matches.find(({ id }) => id === corrected.bronzeMatchId)
        ?.status,
    ).toBe("ready");
  });
});
