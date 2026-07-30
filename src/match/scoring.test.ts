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
  it("never subtracts below zero and finishes with a two-point lead", () => {
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

  it.each([7, 11])(
    "does not finish a play-to-%i match while the score is tied or only one point apart",
    (targetScore) => {
      let current = createScoringState({
        sideA: { memberIds: ["a"] },
        sideB: { memberIds: ["b"] },
        labelA: "Alex",
        labelB: "Blair",
        targetScore,
        durationMs: null,
      });
      current = scoringReducer(current, { type: "start", now: 0 });
      for (let score = 0; score < targetScore; score += 1) {
        current = scoringReducer(current, {
          type: "adjust",
          team: "A",
          delta: 1,
          now: score + 1,
        });
        current = scoringReducer(current, {
          type: "adjust",
          team: "B",
          delta: 1,
          now: score + 1,
        });
      }
      expect(current).toMatchObject({
        scoreA: targetScore,
        scoreB: targetScore,
        status: "running",
      });
      current = scoringReducer(current, {
        type: "adjust",
        team: "A",
        delta: 1,
        now: 100,
      });
      expect(current.status).toBe("running");
      current = scoringReducer(current, {
        type: "adjust",
        team: "A",
        delta: 1,
        now: 101,
      });
      expect(current).toMatchObject({
        scoreA: targetScore + 2,
        scoreB: targetScore,
        status: "awaiting-confirmation",
        winner: "A",
      });
    },
  );

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

  it("resolves an expired deadline before pausing or ending early", () => {
    let leader = scoringReducer(state(), { type: "start", now: 0 });
    leader = scoringReducer(leader, {
      type: "adjust",
      team: "A",
      delta: 1,
      now: 1,
    });
    expect(
      scoringReducer(leader, { type: "pause", now: 60_001 }),
    ).toMatchObject({ winner: "A", finishReason: "buzzer" });

    const tied = scoringReducer(state(), { type: "start", now: 0 });
    expect(
      scoringReducer(tied, {
        type: "end-early",
        now: 60_001,
        winner: "B",
      }),
    ).toMatchObject({ status: "golden-point", winner: null });
  });

  it("resolves a corrected golden-point tie from the buzzer score", () => {
    let current = scoringReducer(state(), { type: "start", now: 0 });
    current = scoringReducer(current, {
      type: "adjust",
      team: "A",
      delta: 1,
      now: 1,
    });
    current = scoringReducer(current, {
      type: "adjust",
      team: "B",
      delta: 1,
      now: 2,
    });
    current = scoringReducer(current, { type: "tick", now: 60_001 });
    current = scoringReducer(current, {
      type: "adjust",
      team: "A",
      delta: -1,
      now: 60_002,
    });
    expect(current).toMatchObject({
      scoreA: 0,
      scoreB: 1,
      status: "awaiting-confirmation",
      winner: "B",
      finishReason: "buzzer",
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

  it("runs untimed matches without creating a deadline or buzzer", () => {
    let current = createScoringState({
      sideA: { memberIds: ["a"] },
      sideB: { memberIds: ["b"] },
      labelA: "Alex",
      labelB: "Blair",
      targetScore: 11,
      durationMs: null,
    });
    current = scoringReducer(current, { type: "start", now: 1_000 });
    expect(current.deadline).toBeNull();
    expect(remainingMs(current, 999_999)).toBeNull();
    expect(scoringReducer(current, { type: "tick", now: 999_999 })).toBe(
      current,
    );
  });

  it("ends early with the leader or an explicitly selected tied winner", () => {
    let leader = scoringReducer(state(), { type: "start", now: 0 });
    leader = scoringReducer(leader, {
      type: "adjust",
      team: "B",
      delta: 1,
      now: 1,
    });
    expect(scoringReducer(leader, { type: "end-early", now: 2 })).toMatchObject(
      {
        winner: "B",
        finishReason: "ended-early",
        status: "awaiting-confirmation",
      },
    );

    const tied = scoringReducer(state(), { type: "start", now: 0 });
    expect(scoringReducer(tied, { type: "end-early", now: 2 })).toBe(tied);
    expect(
      scoringReducer(tied, { type: "end-early", now: 2, winner: "A" }),
    ).toMatchObject({
      scoreA: 0,
      scoreB: 0,
      winner: "A",
      finishReason: "operator-selection",
    });
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

  it("keeps result corrections open until the operator reviews them", () => {
    let current = scoringReducer(state(), { type: "start", now: 0 });
    for (let point = 0; point < 3; point += 1) {
      current = scoringReducer(current, {
        type: "adjust",
        team: "A",
        delta: 1,
        now: point,
      });
    }

    current = scoringReducer(current, { type: "edit-result" });
    expect(current).toMatchObject({
      status: "editing-result",
      winner: null,
      finishReason: null,
    });

    current = scoringReducer(current, {
      type: "adjust",
      team: "A",
      delta: 1,
      now: 4,
    });
    current = scoringReducer(current, {
      type: "adjust",
      team: "B",
      delta: 1,
      now: 5,
    });
    expect(current).toMatchObject({
      scoreA: 4,
      scoreB: 1,
      status: "editing-result",
      winner: null,
    });

    current = scoringReducer(current, { type: "review-result", now: 6 });
    expect(current).toMatchObject({
      status: "awaiting-confirmation",
      winner: "A",
      finishReason: "target",
    });
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
