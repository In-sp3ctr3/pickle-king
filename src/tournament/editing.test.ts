import { describe, expect, it } from "vitest";
import { completeMatch, createTournamentBracket, getNextMatch } from "./index";
import { renameTournamentPlayer, tournamentHasStarted } from "./editing";
import {
  PLAYER_NAME_MAX_LENGTH,
  type Player,
  type TournamentConfig,
} from "./types";

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
      new RegExp(`1 and ${PLAYER_NAME_MAX_LENGTH}`, "i"),
    );
    expect(() => renameTournamentPlayer(bracket, "p0", "PLAYER 1")).toThrow(
      /unique/i,
    );
    expect(() =>
      renameTournamentPlayer(
        bracket,
        "p0",
        "x".repeat(PLAYER_NAME_MAX_LENGTH + 1),
      ),
    ).toThrow(new RegExp(`1 and ${PLAYER_NAME_MAX_LENGTH}`, "i"));
    expect(() => renameTournamentPlayer(bracket, "missing", "Patrick")).toThrow(
      /not found/i,
    );
  });

  it("preserves an unchanged legacy name above the new-entry limit", () => {
    const bracket = createTournamentBracket(players, config);
    const legacyName = "A persisted player name with forty chars".slice(0, 40);
    const legacy = {
      ...bracket,
      players: bracket.players.map((player) =>
        player.id === "p0" ? { ...player, name: legacyName } : player,
      ),
    };
    expect(renameTournamentPlayer(legacy, "p0", legacyName)).toEqual(legacy);
    expect(() =>
      renameTournamentPlayer(legacy, "p0", `${legacyName.slice(0, -1)}x`),
    ).toThrow(new RegExp(`1 and ${PLAYER_NAME_MAX_LENGTH}`, "i"));
  });
});
