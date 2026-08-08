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
  format: "knockout",
  drawStyle: "ranked",
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
    let completedAt = 1;
    while (bracket.matches.some(({ status }) => status !== "complete")) {
      const next = getNextMatch(bracket)!;
      bracket = completeMatch(bracket, next.id, 11, 4, completedAt++);
    }
    const renamedId = bracket.matches.find(
      ({ id }) => id === bracket.bronzeMatchId,
    )!.sideA!.memberIds[0];
    const renamed = renameTournamentPlayer(bracket, renamedId, "Patrick");
    expect(renamed.players.find(({ id }) => id === renamedId)?.name).toBe(
      "Patrick",
    );
    expect(renamed.matches).toEqual(bracket.matches);
    expect(tournamentHasStarted(renamed)).toBe(true);
  });

  it("rejects empty, duplicate, overlong, and unknown-player renames", () => {
    const bracket = createTournamentBracket(players, config);
    expect(() => renameTournamentPlayer(bracket, "p0", " ")).toThrow(
      /1 and 24/i,
    );
    expect(() => renameTournamentPlayer(bracket, "p0", "PLAYER 1")).toThrow(
      /unique/i,
    );
    expect(() => renameTournamentPlayer(bracket, "p0", "x".repeat(25))).toThrow(
      /1 and 24/i,
    );
    expect(() => renameTournamentPlayer(bracket, "missing", "Patrick")).toThrow(
      /not found/i,
    );
  });
});
