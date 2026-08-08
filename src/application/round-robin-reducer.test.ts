import { describe, expect, it } from "vitest";
import {
  getNextMatch,
  type Player,
  type TournamentConfig,
} from "../tournament";
import { appReducer, initialAppState } from "./reducer";
import type { AppState } from "./types";

const players: Player[] = ["Amina", "Brielle", "Cass", "Dani"].map(
  (name, index) => ({
    id: `p${index + 1}`,
    name,
    rating: ["5.0", "4.0", "3.5", "3.0"][index] as Player["rating"],
  }),
);

const config: TournamentConfig = {
  format: "round-robin-finals",
  drawStyle: "ranked",
  timingMode: "timed",
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 2,
  randomSeed: "reducer-round-robin",
};

function createState() {
  return appReducer(initialAppState(0, true), {
    type: "create-tournament",
    players,
    config,
    now: 1,
  });
}

function completeNext(state: AppState, now: number) {
  const match = getNextMatch(state.tournament!);
  if (!match) throw new Error("Expected another scheduled match.");
  let next = appReducer(state, {
    type: "start-match",
    matchId: match.id,
    now,
  });
  next = appReducer(next, {
    type: "score",
    action: { type: "start", now },
    now,
  });
  for (let point = 0; point < 2; point += 1) {
    next = appReducer(next, {
      type: "score",
      action: { type: "adjust", team: "A", delta: 1, now: now + point + 1 },
      now: now + point + 1,
    });
  }
  return appReducer(next, { type: "confirm-result", now: now + 3 });
}

function completeTournament(state: AppState, startAt: number) {
  let next = state;
  while (getNextMatch(next.tournament!)) {
    next = completeNext(next, startAt);
    startAt += 10;
  }
  return next;
}

function scheduleSignature(state: AppState) {
  return state.tournament!.matches.map(({ id, sourceA, sourceB }) => ({
    id,
    sourceA,
    sourceB,
  }));
}

describe("round-robin application lifecycle", () => {
  it("removes a stale archive after correction and records completion again", () => {
    let state = completeTournament(createState(), 10);
    expect(state.screen).toBe("results");
    expect(state.history.tournaments).toHaveLength(1);

    state = appReducer(state, {
      type: "correct-result",
      matchId: "rr-r1-m1",
      scoreA: 0,
      scoreB: 2,
      confirmDownstreamReset: true,
      now: 100,
    });
    expect(state.history.tournaments).toHaveLength(0);
    expect(
      state.tournament!.matches.filter(
        ({ kind, status }) => kind !== "round-robin" && status === "complete",
      ),
    ).toHaveLength(0);

    state = completeTournament(state, 110);
    expect(state.screen).toBe("results");
    expect(state.history.tournaments).toHaveLength(1);
    expect(state.history.tournaments[0].bracket.format).toBe(
      "round-robin-finals",
    );
  });

  it("replays the same schedule and returns to a prefilled setup", () => {
    const completed = completeTournament(createState(), 10);
    const signature = scheduleSignature(completed);
    const replayed = appReducer(completed, {
      type: "replay-same-draw",
      now: 200,
    });

    expect(scheduleSignature(replayed)).toEqual(signature);
    expect(replayed.tournament!.format).toBe("round-robin-finals");
    expect(
      replayed.tournament!.matches.every(
        ({ scoreA, scoreB, status }) =>
          scoreA === 0 && scoreB === 0 && status !== "complete",
      ),
    ).toBe(true);

    const setup = appReducer(replayed, { type: "prepare-new-draw", now: 201 });
    expect(setup).toMatchObject({
      screen: "setup",
      tournament: null,
      setupDraft: { players, config },
    });
  });
});
