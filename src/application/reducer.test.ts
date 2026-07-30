import { describe, expect, it } from "vitest";
import { createScoringState } from "../match/scoring";
import {
  getNextMatch,
  type Player,
  type TournamentConfig,
} from "../tournament";
import { appReducer, initialAppState, toSnapshot } from "./reducer";

const players: Player[] = Array.from({ length: 4 }, (_, index) => ({
  id: `p${index}`,
  name: `Player ${index}`,
  rating: "3.5",
}));
const config: TournamentConfig = {
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 2,
  randomSeed: "app",
};

describe("application reducer", () => {
  it("creates, starts, scores, and advances a tournament match", () => {
    let state = appReducer(initialAppState(0), {
      type: "create-tournament",
      players,
      config,
      now: 1_000,
    });
    const match = state.tournament!.matches.find(
      ({ status }) => status === "ready",
    )!;
    state = appReducer(state, {
      type: "start-match",
      matchId: match.id,
      now: 2_000,
    });
    state = appReducer(state, {
      type: "score",
      action: { type: "start", now: 2_000 },
      now: 2_000,
    });
    for (let point = 0; point < 2; point += 1) {
      state = appReducer(state, {
        type: "score",
        action: { type: "adjust", team: "A", delta: 1, now: 3_000 + point },
        now: 3_000 + point,
      });
    }
    state = appReducer(state, { type: "confirm-result", now: 5_000 });
    expect(state.screen).toBe("bracket");
    expect(
      state.tournament?.matches.find(({ id }) => id === match.id)?.status,
    ).toBe("complete");
  });

  it("reduces unfinished match caps when the booking falls behind", () => {
    let state = appReducer(initialAppState(0, true), {
      type: "create-tournament",
      players,
      config,
      now: 0,
    });
    const next = getNextMatch(state.tournament!)!;
    const originalCap = next.config.capMs;
    state = appReducer(state, {
      type: "start-match",
      matchId: next.id,
      now: state.sessionDeadline! - 5 * 60_000,
    });
    expect(state.scorer?.durationMs).toBeLessThan(originalCap);
    expect(state.scorer?.durationMs).toBe(30_000);
  });

  it("keeps Quick Match separate and excludes recovery from persistence", () => {
    const scorer = createScoringState({
      sideA: { memberIds: ["a", "b"] },
      sideB: { memberIds: ["c", "d"] },
      labelA: "A + B",
      labelB: "C + D",
      targetScore: 11,
      durationMs: 600_000,
    });
    const quick = appReducer(initialAppState(0), {
      type: "start-quick",
      scorer,
      now: 1,
    });
    expect(quick).toMatchObject({ screen: "quick-live", quickMatch: true });
    expect(
      toSnapshot(appReducer(quick, { type: "recover", message: "bad" })),
    ).toBeNull();
  });
});
