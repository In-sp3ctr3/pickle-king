import { describe, expect, it } from "vitest";
import { createScoringState, scoringReducer } from "../../match/scoring";
import type { ScoringState, ServiceState } from "../../match/types";
import { announcementSequence } from "./match-feedback";

function clips(previous: ScoringState | null, scorer: ScoringState) {
  return announcementSequence(previous, scorer).map(
    ({ name, pauseAfterMs }) => [name, pauseAfterMs] as const,
  );
}

function liveScorer(service: ServiceState): ScoringState {
  const scorer = createScoringState({
    sideA: { memberIds: ["a1", "a2"] },
    sideB: { memberIds: ["b1", "b2"] },
    labelA: "A",
    labelB: "B",
    targetScore: 11,
    durationMs: null,
  });
  return scoringReducer(scorer, { type: "start", now: 0, service });
}

describe("score announcements", () => {
  it("calls the serving score first and maps the opening turn to Server 2", () => {
    const opening = liveScorer({
      startingTeam: "A",
      servingTeam: "A",
      serverId: "a1",
      turn: "opening",
      rightAtZero: { A: "a1", B: "b1" },
    });
    const receivingTeamNowServes: ScoringState = {
      ...opening,
      scoreA: 1,
      scoreB: 2,
      service: {
        ...opening.service!,
        servingTeam: "B",
        turn: "first",
      },
    };

    expect(clips(null, opening)).toEqual([
      ["0", 180],
      ["0", 180],
      ["2", 0],
    ]);
    expect(clips(null, receivingTeamNowServes)).toEqual([
      ["2", 180],
      ["1", 180],
      ["1", 0],
    ]);
  });

  it("omits the server number for singles", () => {
    const scorer = createScoringState({
      sideA: { memberIds: ["a1"] },
      sideB: { memberIds: ["b1"] },
      labelA: "A",
      labelB: "B",
      targetScore: 11,
      durationMs: null,
    });
    const live = scoringReducer(scorer, {
      type: "start",
      now: 0,
      service: {
        startingTeam: "B",
        servingTeam: "B",
        serverId: "b1",
        turn: "opening",
        rightAtZero: { A: "a1", B: "b1" },
      },
    });

    expect(clips(null, live)).toEqual([
      ["0", 180],
      ["0", 0],
    ]);
  });

  it("adds side-out and match-point calls when the service changes", () => {
    const previous = liveScorer({
      startingTeam: "B",
      servingTeam: "B",
      serverId: "b2",
      turn: "second",
      rightAtZero: { A: "a1", B: "b1" },
    });
    const next: ScoringState = {
      ...previous,
      scoreA: 10,
      scoreB: 8,
      service: {
        ...previous.service!,
        servingTeam: "A",
        serverId: "a1",
        turn: "first",
      },
    };

    expect(clips(previous, next)).toEqual([
      ["side-out", 480],
      ["match-point", 480],
      ["10", 180],
      ["8", 180],
      ["1", 0],
    ]);
  });

  it("announces the winner and final score when the game ends", () => {
    const previous = liveScorer({
      startingTeam: "A",
      servingTeam: "A",
      serverId: "a1",
      turn: "first",
      rightAtZero: { A: "a1", B: "b1" },
    });
    const finished: ScoringState = {
      ...previous,
      scoreA: 7,
      scoreB: 11,
      status: "awaiting-confirmation",
      winner: "B",
      finishReason: "target",
    };

    expect(clips(previous, finished)).toEqual([
      ["game", 520],
      ["final-score", 420],
      ["11", 260],
      ["7", 0],
    ]);
  });
});
