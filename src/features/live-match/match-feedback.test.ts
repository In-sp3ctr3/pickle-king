import { afterEach, describe, expect, it, vi } from "vitest";
import { createScoringState, scoringReducer } from "../../match/scoring";
import type { ScoringState, ServiceState } from "../../match/types";
import {
  matchAnnouncement,
  scoreAnnouncement,
  speakScoreAnnouncement,
} from "./match-feedback";

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

    expect(matchAnnouncement(previous, next)).toBe(
      "That's a side out. Match point. 10, 8, 1.",
    );
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
      labelA: "Alex and Casey",
      scoreA: 11,
      scoreB: 7,
      status: "awaiting-confirmation",
      winner: "A",
      finishReason: "target",
    };

    expect(matchAnnouncement(previous, finished)).toBe(
      "Game! The win goes to Alex and Casey, 11 to 7.",
    );
  });

  it("replaces queued speech with the latest score", () => {
    const cancel = vi.fn();
    const speak = vi.fn();
    const naturalVoice = {
      default: false,
      lang: "en-US",
      localService: true,
      name: "Ava",
      voiceURI: "Ava",
    } as SpeechSynthesisVoice;
    class Utterance {
      pitch = 1;
      rate = 1;
      voice: SpeechSynthesisVoice | null = null;

      constructor(public text: string) {}
    }
    vi.stubGlobal("window", {
      navigator: { language: "en-US" },
      speechSynthesis: {
        cancel,
        getVoices: () => [
          {
            ...naturalVoice,
            default: true,
            name: "Plain Voice",
            voiceURI: "Plain Voice",
          },
          naturalVoice,
        ],
        speak,
      },
    });
    vi.stubGlobal("navigator", { language: "en-US" });
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
      expect.objectContaining({
        pitch: 1.04,
        rate: 1.03,
        text: "0, 0, 2",
        voice: naturalVoice,
      }),
    );
  });
});
