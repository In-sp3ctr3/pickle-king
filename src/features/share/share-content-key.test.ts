import { describe, expect, it } from "vitest";
import { createTournamentBracket } from "../../tournament";
import { tournamentShareContentKey } from "./share-content-key";

const bracket = createTournamentBracket(
  ["Maya", "Rae", "Kai", "Noah"].map((name, index) => ({
    id: `p${index}`,
    name,
    rating: "3.5" as const,
  })),
  {
    bookingMinutes: 120,
    drawStyle: "ranked",
    randomSeed: "share-key",
    targetScore: 11,
    timingMode: "untimed",
    transitionSeconds: 60,
    warmupMinutes: 10,
  },
);

describe("tournament share content keys", () => {
  it("changes when a rendered name, score, or winner changes", () => {
    const base = tournamentShareContentKey(bracket);
    const renamed = structuredClone(bracket);
    renamed.players[0].name = "Patrick";
    const corrected = structuredClone(bracket);
    corrected.matches[0].scoreA = 11;
    corrected.matches[0].winnerId = corrected.players[0].id;

    expect(tournamentShareContentKey(renamed)).not.toBe(base);
    expect(tournamentShareContentKey(corrected)).not.toBe(base);
  });
});
