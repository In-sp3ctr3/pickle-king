import { describe, expect, it } from "vitest";
import type { Player, TournamentConfig } from "../tournament";
import { appReducer, initialAppState } from "./reducer";

const players: Player[] = Array.from({ length: 4 }, (_, index) => ({
  id: `p${index}`,
  name: `Player ${index}`,
  rating: "3.5",
}));
const config: TournamentConfig = {
  drawStyle: "social",
  timingMode: "untimed",
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 11,
  randomSeed: "replay",
};

describe("tournament replay", () => {
  it("replays the exact draw or returns to a prefilled setup", () => {
    const created = appReducer(initialAppState(0), {
      type: "create-tournament",
      players,
      config,
      now: 1_000,
    });
    const replayed = appReducer(created, {
      type: "replay-same-draw",
      now: 2_000,
    });
    expect(replayed.screen).toBe("bracket");
    expect(replayed.tournament?.matches).toEqual(created.tournament?.matches);
    const newDraw = appReducer(created, {
      type: "prepare-new-draw",
      now: 3_000,
    });
    expect(newDraw).toMatchObject({ screen: "setup", tournament: null });
    expect(newDraw.setupDraft?.players).toEqual(players);
  });
});
