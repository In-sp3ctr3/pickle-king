import { describe, expect, it } from "vitest";
import { completeMatch, createTournamentBracket } from "./bracket";
import {
  abandonMatch,
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
  format: "knockout",
  drawStyle: "ranked",
  timingMode: "timed",
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 11,
  randomSeed: "correction",
};

describe("match lifecycle", () => {
  it("starts a ready current-round match but rejects a locked round", () => {
    const bracket = createTournamentBracket(players, config);
    const next = getNextMatch(bracket)!;
    expect(startMatch(bracket, next.id, 1_000).matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: next.id, status: "live" }),
      ]),
    );
    expect(() => startMatch(bracket, "r2-m1", 1_000)).toThrow(/current round/i);
  });

  it("discards a live attempt without advancing or losing its schedule slot", () => {
    const bracket = createTournamentBracket(players, config);
    const next = getNextMatch(bracket)!;
    const live = startMatch(bracket, next.id, 1_000);
    const discarded = abandonMatch(live, next.id);
    expect(getNextMatch(discarded)?.id).toBe(next.id);
    expect(discarded.matches.find(({ id }) => id === next.id)).toMatchObject({
      status: "ready",
      startedAt: null,
      scoreA: 0,
      scoreB: 0,
    });
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

  it("corrects tied selected winners and completed bronze results", () => {
    let bracket = createTournamentBracket(players, config);
    const first = getNextMatch(bracket)!;
    const originalWinner = first.sideA!.memberIds[0];
    const correctedWinner = first.sideB!.memberIds[0];
    bracket = completeMatch(bracket, first.id, 5, 5, 1_000, originalWinner);
    bracket = correctMatchResult(
      bracket,
      first.id,
      5,
      5,
      2_000,
      false,
      correctedWinner,
    );
    expect(bracket.matches.find(({ id }) => id === first.id)?.winnerId).toBe(
      correctedWinner,
    );

    while (getNextMatch(bracket)) {
      const match = getNextMatch(bracket)!;
      bracket = completeMatch(bracket, match.id, 11, 5, 3_000);
    }
    const correctedBronze = correctMatchResult(
      bracket,
      bracket.bronzeMatchId,
      4,
      11,
      4_000,
    );
    expect(
      correctedBronze.matches.find(
        ({ id }) => id === correctedBronze.bronzeMatchId,
      ),
    ).toMatchObject({ scoreA: 4, scoreB: 11, status: "complete" });
  });
});
