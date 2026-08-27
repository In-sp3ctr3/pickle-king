import { describe, expect, it } from "vitest";
import {
  activeReceiver,
  activeServer,
  nextService,
  serviceSide,
} from "./service";
import type { ServiceState } from "./types";

const sides = {
  sideA: { memberIds: ["a1", "a2"] },
  sideB: { memberIds: ["b1", "b2"] },
};
const opening: ServiceState = {
  startingTeam: "A",
  servingTeam: "A",
  serverId: "a1",
  turn: "opening",
  rightAtZero: { A: "a1", B: "b1" },
};

describe("service sequence", () => {
  it("uses score parity for an active first server", () => {
    expect(serviceSide(0)).toBe("right");
    expect(serviceSide(1)).toBe("left");
    expect(
      activeServer({
        scores: { A: 1, B: 0 },
        service: { ...opening, turn: "first" },
        sides,
      }),
    ).toMatchObject({ playerId: "a1", side: "left" });
  });

  it("identifies the doubles receiver in the diagonal service box", () => {
    expect(
      activeReceiver({ scores: { A: 0, B: 0 }, service: opening, sides }),
    ).toMatchObject({ playerId: "b1", side: "right", team: "B" });
    expect(
      activeReceiver({
        scores: { A: 1, B: 0 },
        service: opening,
        sides,
      }),
    ).toMatchObject({ playerId: "b2", side: "left", team: "B" });
    expect(
      activeReceiver({
        scores: { A: 0, B: 0 },
        service: opening,
        sides: {
          sideA: { memberIds: ["a1"] },
          sideB: { memberIds: ["b1"] },
        },
      }),
    ).toBeNull();
  });

  it("makes the opening fault an immediate side out", () => {
    expect(
      nextService({
        scores: { A: 0, B: 0 },
        service: opening,
        sides,
        winner: "B",
      }).service,
    ).toMatchObject({ servingTeam: "B", turn: "first" });
  });

  it("moves first server to second, then side out", () => {
    const firstFault = nextService({
      scores: { A: 2, B: 1 },
      service: { ...opening, turn: "first" },
      sides,
      winner: "B",
    });
    expect(
      activeServer({
        scores: firstFault.scores,
        service: firstFault.service,
        sides,
      }),
    ).toMatchObject({ playerId: "a2", side: "left", turn: "second" });
    expect(
      nextService({ ...firstFault, sides, winner: "B" }).service,
    ).toMatchObject({ servingTeam: "B", turn: "first" });
  });

  it("keeps the server while awarding its point", () => {
    const next = nextService({
      scores: { A: 0, B: 0 },
      service: opening,
      sides,
      winner: "A",
    });
    expect(next).toMatchObject({ scores: { A: 1, B: 0 }, service: opening });
  });
});
