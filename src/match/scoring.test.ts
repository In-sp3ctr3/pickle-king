import { describe, expect, it } from "vitest";
import { createScoringState, remainingMs, scoringReducer } from "./scoring";

function state() {
  return createScoringState({
    sideA: { memberIds: ["a"] },
    sideB: { memberIds: ["b"] },
    labelA: "Alex",
    labelB: "Blair",
    targetScore: 3,
    durationMs: 60_000,
  });
}

describe("scoring reducer", () => {
  it("never subtracts below zero and reaches target without win-by-two", () => {
    let current = scoringReducer(state(), { type: "start", now: 0 });
    current = scoringReducer(current, {
      type: "adjust",
      team: "A",
      delta: -1,
      now: 1,
    });
    expect(current.scoreA).toBe(0);
    for (let point = 1; point <= 3; point += 1) {
      current = scoringReducer(current, {
        type: "adjust",
        team: "A",
        delta: 1,
        now: point,
      });
    }
    expect(current).toMatchObject({
      scoreA: 3,
      status: "awaiting-confirmation",
      winner: "A",
      finishReason: "target",
    });
  });

  it("awards the buzzer leader and sends a tie to golden point", () => {
    let leader = scoringReducer(state(), { type: "start", now: 0 });
    leader = scoringReducer(leader, {
      type: "adjust",
      team: "B",
      delta: 1,
      now: 1,
    });
    expect(scoringReducer(leader, { type: "tick", now: 60_001 })).toMatchObject(
      { winner: "B", finishReason: "buzzer" },
    );
    let tied = scoringReducer(state(), { type: "start", now: 0 });
    tied = scoringReducer(tied, { type: "tick", now: 60_001 });
    expect(tied.status).toBe("golden-point");
    tied = scoringReducer(tied, {
      type: "adjust",
      team: "A",
      delta: 1,
      now: 60_002,
    });
    expect(tied).toMatchObject({
      winner: "A",
      finishReason: "golden-point",
    });
  });

  it("recovers remaining time from deadlines after reload or sleep", () => {
    let current = scoringReducer(state(), { type: "start", now: 1_000 });
    expect(remainingMs(current, 11_000)).toBe(50_000);
    current = scoringReducer(current, { type: "pause", now: 11_000 });
    expect(current.pausedRemainingMs).toBe(50_000);
    current = scoringReducer(current, { type: "resume", now: 21_000 });
    expect(current.deadline).toBe(71_000);
  });

  it("requires confirmation and ignores duplicate confirmation", () => {
    let current = scoringReducer(state(), { type: "start", now: 0 });
    for (let point = 0; point < 3; point += 1) {
      current = scoringReducer(current, {
        type: "adjust",
        team: "A",
        delta: 1,
        now: point,
      });
    }
    current = scoringReducer(current, { type: "confirm" });
    expect(current.status).toBe("complete");
    expect(scoringReducer(current, { type: "confirm" })).toBe(current);
  });

  it("supports doubles sides without changing scoring rules", () => {
    const doubles = createScoringState({
      sideA: { memberIds: ["a", "b"] },
      sideB: { memberIds: ["c", "d"] },
      labelA: "A + B",
      labelB: "C + D",
      targetScore: 11,
      durationMs: 600_000,
    });
    expect(doubles.sideA.memberIds).toHaveLength(2);
  });
});
