import { describe, expect, it } from "vitest";
import { createScoringState, scoringReducer } from "../match/scoring";
import type { TournamentBracket } from "../tournament";
import {
  emptySessionHistory,
  quickMatchRecord,
  recordQuickMatch,
  recordTournament,
  rememberedPlayerNames,
  syncTournamentArchive,
  tournamentArchive,
} from "./history";

function completedScorer(names = ["Robbie", "Maya"]) {
  let scorer = createScoringState({
    sideA: { memberIds: ["a"] },
    sideB: { memberIds: ["b"] },
    labelA: names[0],
    labelB: names[1],
    participantNames: { sideA: [names[0]], sideB: [names[1]] },
    targetScore: 2,
    durationMs: null,
  });
  scorer = scoringReducer(scorer, { type: "start", now: 1 });
  scorer = scoringReducer(scorer, {
    type: "adjust",
    team: "A",
    delta: 1,
    now: 2,
  });
  scorer = scoringReducer(scorer, {
    type: "adjust",
    team: "A",
    delta: 1,
    now: 3,
  });
  return scoringReducer(scorer, { type: "confirm" });
}

describe("session history", () => {
  it("records a Quick Match once with exact participants", () => {
    const record = quickMatchRecord(completedScorer(), 10);
    const first = recordQuickMatch(emptySessionHistory(), record);
    const second = recordQuickMatch(first, record);
    expect(second).toBe(first);
    expect(first.quickMatches).toEqual([record]);
    expect(record.participants.sideA).toEqual(["Robbie"]);
  });

  it("keeps only the newest 50 Quick Matches", () => {
    let history = emptySessionHistory();
    for (let index = 0; index < 51; index += 1) {
      history = recordQuickMatch(
        history,
        quickMatchRecord(completedScorer([`Player ${index}`, "Maya"]), index),
      );
    }
    expect(history.quickMatches).toHaveLength(50);
    expect(history.quickMatches[0].completedAt).toBe(50);
    expect(history.quickMatches.at(-1)?.completedAt).toBe(1);
  });

  it("derives unique remembered names in recent-use order", () => {
    let history = emptySessionHistory();
    history = recordQuickMatch(
      history,
      quickMatchRecord(completedScorer(["Robbie", "Maya"]), 1),
    );
    history = recordQuickMatch(
      history,
      quickMatchRecord(completedScorer(["ROBBIE", "Zoe"]), 2),
    );
    expect(rememberedPlayerNames(history)).toEqual(["ROBBIE", "Zoe", "Maya"]);
  });

  it("keeps only the newest 10 completed tournaments", () => {
    const bracket = {
      players: [],
      matches: [{ id: "final", status: "complete", completedAt: 1 }],
      finalMatchId: "final",
    } as unknown as TournamentBracket;
    let history = emptySessionHistory();
    for (let index = 0; index < 11; index += 1) {
      const archive = tournamentArchive(
        {
          ...bracket,
          players: [{ id: `p${index}`, name: `P${index}`, rating: "3.5" }],
        },
        index,
      );
      history = recordTournament(history, archive);
    }
    expect(history.tournaments).toHaveLength(10);
    expect(history.tournaments[0].completedAt).toBe(10);
  });

  it("updates a completed archive after renames and removes stale incomplete results", () => {
    const bracket = {
      players: [{ id: "p1", name: "Shamar", rating: "3.5" }],
      matches: [{ id: "final", status: "complete", completedAt: 10 }],
      finalMatchId: "final",
    } as unknown as TournamentBracket;
    const history = recordTournament(
      emptySessionHistory(),
      tournamentArchive(bracket, 10),
    );
    const renamed = {
      ...bracket,
      players: [{ id: "p1", name: "Patrick", rating: "3.5" as const }],
    };
    const synced = syncTournamentArchive(history, bracket, renamed);
    expect(synced.tournaments[0].bracket.players[0].name).toBe("Patrick");
    const incomplete = {
      ...renamed,
      matches: [{ id: "final", status: "ready" as const, completedAt: null }],
    } as unknown as TournamentBracket;
    expect(
      syncTournamentArchive(synced, renamed, incomplete).tournaments,
    ).toEqual([]);
  });
});
