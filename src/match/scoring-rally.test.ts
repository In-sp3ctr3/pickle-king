import { expect, it } from "vitest";
import { createScoringState, scoringReducer } from "./scoring";

it("records rally winners, side outs, and whole-rally undo", () => {
  let current = createScoringState({
    sideA: { memberIds: ["a1", "a2"] },
    sideB: { memberIds: ["b1", "b2"] },
    labelA: "A",
    labelB: "B",
    targetScore: 11,
    durationMs: null,
  });
  current = scoringReducer(current, {
    type: "start",
    now: 0,
    service: {
      startingTeam: "A",
      servingTeam: "A",
      serverId: "a1",
      turn: "opening",
      rightAtZero: { A: "a1", B: "b1" },
    },
  });
  current = scoringReducer(current, { type: "rally", team: "A", now: 1 });
  expect(current).toMatchObject({
    scoreA: 1,
    scoreB: 0,
    service: { turn: "opening" },
  });
  current = scoringReducer(current, { type: "rally", team: "B", now: 2 });
  expect(current).toMatchObject({
    scoreA: 1,
    scoreB: 0,
    service: { servingTeam: "B", turn: "first" },
  });
  current = scoringReducer(current, { type: "undo-rally", now: 3 });
  expect(current).toMatchObject({
    scoreA: 1,
    scoreB: 0,
    service: { servingTeam: "A", turn: "opening" },
  });
});

it("swaps only the persisted court orientation", () => {
  const current = {
    ...createScoringState({
      sideA: { memberIds: ["a1", "a2"] },
      sideB: { memberIds: ["b1", "b2"] },
      labelA: "A",
      labelB: "B",
      targetScore: 11,
      durationMs: null,
    }),
    scoreA: 6,
    scoreB: 3,
    status: "running" as const,
    service: {
      startingTeam: "A" as const,
      servingTeam: "B" as const,
      serverId: "b1",
      turn: "first" as const,
      rightAtZero: { A: "a1", B: "b1" },
    },
  };

  const swapped = scoringReducer(current, { type: "swap-court-ends" });

  expect(swapped.rightEndTeam).toBe("B");
  expect(swapped).toMatchObject({
    labelA: "A",
    labelB: "B",
    scoreA: 6,
    scoreB: 3,
    service: current.service,
  });
});
