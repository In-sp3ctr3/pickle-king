import { afterEach, describe, expect, it, vi } from "vitest";
import { createScoringState, scoringReducer } from "../../match/scoring";
import type { ScoringState, ServiceState } from "../../match/types";
import { scoreAnnouncement, speakScoreAnnouncement } from "./match-feedback";

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
  afterEach(() => vi.unstubAllGlobals());

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

    expect(scoreAnnouncement(opening)).toBe("0, 0, 2");
    expect(scoreAnnouncement(receivingTeamNowServes)).toBe("2, 1, 1");
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

    expect(scoreAnnouncement(live)).toBe("0, 0");
  });

  it("replaces queued speech with the latest score", () => {
    const cancel = vi.fn();
    const speak = vi.fn();
    class Utterance {
      constructor(public text: string) {}
    }
    vi.stubGlobal("window", {
      speechSynthesis: { cancel, speak },
    });
    vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
    const scorer = liveScorer({
      startingTeam: "A",
      servingTeam: "A",
      serverId: "a1",
      turn: "opening",
      rightAtZero: { A: "a1", B: "b1" },
    });

    speakScoreAnnouncement(scorer);

    expect(cancel).toHaveBeenCalledOnce();
    expect(speak).toHaveBeenCalledWith(
      expect.objectContaining({ text: "0, 0, 2" }),
    );
  });
});
