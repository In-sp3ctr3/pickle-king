import { describe, expect, it } from "vitest";
import { createTournamentBracket } from "./bracket";
import { matchStageLabel } from "./stage";
import type { Player, TournamentConfig } from "./types";

const players: Player[] = Array.from({ length: 8 }, (_, index) => ({
  id: `p${index}`,
  name: `Player ${index}`,
  rating: "3.5",
}));
const config: TournamentConfig = {
  drawStyle: "ranked",
  timingMode: "untimed",
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 11,
  randomSeed: "stages",
};

describe("tournament stage labels", () => {
  it("names only meaningful late tournament stages", () => {
    const bracket = createTournamentBracket(players, config);
    expect(
      matchStageLabel(
        bracket,
        bracket.matches.find(({ id }) => id === "r1-m1")!,
      ),
    ).toBeNull();
    expect(
      matchStageLabel(
        bracket,
        bracket.matches.find(({ id }) => id === "r2-m1")!,
      ),
    ).toBe("Semifinal");
    expect(
      matchStageLabel(
        bracket,
        bracket.matches.find(({ id }) => id === bracket.bronzeMatchId)!,
      ),
    ).toBe("Third place");
    expect(
      matchStageLabel(
        bracket,
        bracket.matches.find(({ id }) => id === bracket.finalMatchId)!,
      ),
    ).toBe("Final");
  });
});
