import { describe, expect, it } from "vitest";
import type { ScoringState } from "../../match/types";
import { resultPreviewKey } from "./result-confirmation-dialog";

const scorer: ScoringState = {
  deadline: null,
  durationMs: null,
  finishReason: "operator-selection",
  labelA: "Jack",
  labelB: "Brandon",
  pausedRemainingMs: null,
  scoreA: 5,
  scoreB: 5,
  scoreEvents: [],
  rightEndTeam: "A",
  service: null,
  rallyHistory: [],
  sideA: { memberIds: ["jack"] },
  sideB: { memberIds: ["brandon"] },
  stageLabel: "Semifinal",
  status: "awaiting-confirmation",
  targetScore: 11,
  winner: "A",
};

describe("result preview cache keys", () => {
  it("changes for corrected winners, stages, targets, and formats", () => {
    const base = resultPreviewKey(scorer, "feed", "poster");

    expect(
      resultPreviewKey({ ...scorer, winner: "B" }, "feed", "poster"),
    ).not.toBe(base);
    expect(
      resultPreviewKey({ ...scorer, stageLabel: "Final" }, "feed", "poster"),
    ).not.toBe(base);
    expect(
      resultPreviewKey({ ...scorer, targetScore: 7 }, "feed", "poster"),
    ).not.toBe(base);
    expect(resultPreviewKey(scorer, "story", "poster")).not.toBe(base);
    expect(resultPreviewKey(scorer, "feed", "frame")).not.toBe(base);
  });
});
