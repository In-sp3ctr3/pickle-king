import { describe, expect, it } from "vitest";
import { tournamentHighlights } from "./highlights";
import type { Match, TournamentBracket, TournamentResult } from "./types";

const players = [
  { id: "a", name: "Asha", rating: "4.5" as const, seed: 1 },
  { id: "b", name: "Bun", rating: "3.0" as const, seed: 4 },
  { id: "c", name: "Chris", rating: "4.0" as const, seed: 2 },
  { id: "d", name: "Drew", rating: "3.5" as const, seed: 3 },
];

function played(overrides: Partial<Match> = {}): Match {
  return {
    id: "m1",
    kind: "elimination",
    round: 1,
    ordinal: 1,
    sourceA: { type: "player", playerId: "a" },
    sourceB: { type: "player", playerId: "b" },
    sideA: { memberIds: ["a"] },
    sideB: { memberIds: ["b"] },
    config: { targetScore: 11, capMs: null },
    scoreA: 11,
    scoreB: 0,
    status: "complete",
    winnerId: "a",
    loserId: "b",
    startedAt: 1,
    completedAt: 2,
    comebackDeficit: 0,
    ...overrides,
  };
}

function result(matches: Match[], upsets: TournamentResult["upsetWins"] = []) {
  const value: TournamentResult = {
    championId: "a",
    runnerUpId: "c",
    thirdPlaceId: "d",
    standings: players.map(({ id }) => ({
      playerId: id,
      wins: id === "a" ? 3 : 0,
      losses: id === "a" ? 0 : 1,
      pointsFor: 11,
      pointsAgainst: 0,
      differential: 11,
      eliminatedRound: id === "a" ? null : 1,
    })),
    upsetWins: upsets,
    eliminationGroups: [],
    matchHistory: matches,
  };
  const bracket: TournamentBracket = {
    bracketSize: 4,
    roundCount: 2,
    players,
    matches,
    finalMatchId: "final",
    bronzeMatchId: "bronze",
    amendments: [],
  };
  return { bracket, value };
}

describe("tournamentHighlights", () => {
  it("selects comeback, clean sweep, upset, and biggest margin", () => {
    const comeback = played({ id: "comeback", comebackDeficit: 6, scoreB: 7 });
    const sweep = played({ id: "sweep", scoreA: 11, scoreB: 0 });
    const close = played({ id: "close", scoreA: 11, scoreB: 10 });
    const { bracket, value } = result(
      [comeback, sweep, close],
      [{ matchId: "sweep", winnerId: "b", loserId: "a", seedDifference: 3 }],
    );
    expect(
      tournamentHighlights(bracket, value).map(({ kind }) => kind),
    ).toEqual(["comeback", "clean-sweep", "upset", "margin"]);
  });

  it("falls back to the champion record when fewer stories exist", () => {
    const match = played({ scoreA: 7, scoreB: 6 });
    const { bracket, value } = result([match]);
    expect(tournamentHighlights(bracket, value)).toContainEqual({
      kind: "champion-record",
      label: "Champion record",
      value: "3 wins · 0 losses",
    });
  });
});
