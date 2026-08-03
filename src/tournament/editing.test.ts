import { describe, expect, it } from "vitest";
import { completeMatch, createTournamentBracket, getNextMatch } from "./index";
import { renameTournamentPlayer, tournamentHasStarted } from "./editing";
import type { Player, TournamentConfig } from "./types";

const players: Player[] = Array.from({ length: 4 }, (_, index) => ({
  id: `p${index}`,
  name: `Player ${index}`,
  rating: "3.5",
}));
const config: TournamentConfig = {
  timingMode: "untimed",
  bookingMinutes: 120,
  warmupMinutes: 0,
  transitionSeconds: 0,
  targetScore: 11,
  randomSeed: "editing",
};

describe("tournament editing", () => {
  it("renames a stable player identity without changing completed results", () => {
    let bracket = createTournamentBracket(players, config);
    const first = getNextMatch(bracket)!;
    bracket = completeMatch(bracket, first.id, 11, 4, 1);
    const winnerId = bracket.matches.find(
      ({ id }) => id === first.id,
    )!.winnerId!;
    const renamed = renameTournamentPlayer(bracket, winnerId, "Patrick");
    expect(renamed.players.find(({ id }) => id === winnerId)?.name).toBe(
      "Patrick",
    );
    expect(renamed.matches).toEqual(bracket.matches);
    expect(tournamentHasStarted(renamed)).toBe(true);
  });

  it("rejects empty, duplicate, overlong, and unknown-player renames", () => {
    const bracket = createTournamentBracket(players, config);
    expect(() => renameTournamentPlayer(bracket, "p0", " ")).toThrow(
      /1 and 40/i,
    );
    expect(() => renameTournamentPlayer(bracket, "p0", "PLAYER 1")).toThrow(
      /unique/i,
    );
    expect(() => renameTournamentPlayer(bracket, "p0", "x".repeat(41))).toThrow(
      /1 and 40/i,
    );
    expect(() => renameTournamentPlayer(bracket, "missing", "Patrick")).toThrow(
      /not found/i,
    );
  });
});
