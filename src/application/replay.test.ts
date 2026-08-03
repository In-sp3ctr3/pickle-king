import { describe, expect, it } from "vitest";
import {
  getNextMatch,
  type Player,
  type TournamentConfig,
} from "../tournament";
import { appReducer, initialAppState } from "./reducer";

const players: Player[] = Array.from({ length: 4 }, (_, index) => ({
  id: `p${index}`,
  name: `Player ${index}`,
  rating: "3.5",
}));
const config: TournamentConfig = {
  drawStyle: "random",
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

  it("rerolls an untouched random draw and locks once play starts", () => {
    const entrants = Array.from({ length: 8 }, (_, index) => ({
      id: `r${index}`,
      name: `Random ${index}`,
      rating: "3.5" as const,
    }));
    const created = appReducer(initialAppState(0), {
      type: "create-tournament",
      players: entrants,
      config,
      now: 1_000,
    });
    const rerolled = appReducer(created, {
      type: "reroll-random-draw",
      randomSeed: "different-draw",
      now: 2_000,
    });
    expect(rerolled.setupDraft?.config.randomSeed).toBe("different-draw");
    expect(rerolled.tournament?.matches).not.toEqual(
      created.tournament?.matches,
    );

    const next = getNextMatch(rerolled.tournament!)!;
    const started = appReducer(rerolled, {
      type: "start-match",
      matchId: next.id,
      now: 3_000,
    });
    expect(
      appReducer(started, {
        type: "reroll-random-draw",
        randomSeed: "too-late",
        now: 4_000,
      }),
    ).toBe(started);
  });

  it("opens an archived result without replacing the active tournament", () => {
    const active = appReducer(initialAppState(0), {
      type: "create-tournament",
      players,
      config,
      now: 1_000,
    });
    const archive = {
      id: "archive-1",
      completedAt: 900,
      bracket: active.tournament!,
    };
    const withHistory = {
      ...active,
      history: {
        ...active.history,
        tournaments: [archive],
      },
    };
    const viewing = appReducer(withHistory, {
      type: "view-history-tournament",
      id: archive.id,
      now: 2_000,
    });
    expect(viewing).toMatchObject({
      screen: "history-results",
      historyTournamentId: archive.id,
      tournament: active.tournament,
    });
  });
});
