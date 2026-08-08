import { describe, expect, it } from "vitest";
import { createScoringState } from "../match/scoring";
import {
  getNextMatch,
  planLateEntry,
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
  format: "knockout",
  drawStyle: "ranked",
  timingMode: "timed",
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
    expect(originalCap).not.toBeNull();
    state = appReducer(state, {
      type: "start-match",
      matchId: next.id,
      now: state.sessionDeadline! - 5 * 60_000,
    });
    expect(state.scorer?.durationMs).toBeLessThan(originalCap!);
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

  it("archives a confirmed Quick Match once", () => {
    const scorer = createScoringState({
      sideA: { memberIds: ["a"] },
      sideB: { memberIds: ["b"] },
      labelA: "Robbie",
      labelB: "Maya",
      participantNames: { sideA: ["Robbie"], sideB: ["Maya"] },
      targetScore: 2,
      durationMs: null,
    });
    let state = appReducer(initialAppState(0), {
      type: "start-quick",
      scorer,
      now: 1,
    });
    state = appReducer(state, {
      type: "score",
      action: { type: "start", now: 1 },
      now: 1,
    });
    for (let point = 0; point < 2; point += 1) {
      state = appReducer(state, {
        type: "score",
        action: { type: "adjust", team: "A", delta: 1, now: point + 2 },
        now: point + 2,
      });
    }
    state = appReducer(state, { type: "confirm-result", now: 10 });
    state = appReducer(state, { type: "confirm-result", now: 11 });
    expect(state.history.quickMatches).toHaveLength(1);
    expect(state.history.quickMatches[0].participants.sideA).toEqual([
      "Robbie",
    ]);
    expect(state).toMatchObject({
      screen: "quick-setup",
      scorer: null,
      quickMatch: false,
    });
  });

  it("keeps results for a rename and clears them for a field rebuild", () => {
    let state = appReducer(initialAppState(0), {
      type: "create-tournament",
      players,
      config,
      now: 1_000,
    });
    const deadline = state.sessionDeadline;
    const next = getNextMatch(state.tournament!)!;
    state = appReducer(state, {
      type: "start-match",
      matchId: next.id,
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
    state = appReducer(state, { type: "confirm-result", now: 4_000 });
    const winnerId = state.tournament!.matches.find(
      ({ id }) => id === next.id,
    )!.winnerId!;
    state = appReducer(state, {
      type: "rename-player",
      playerId: winnerId,
      name: "Patrick",
      now: 5_000,
    });
    expect(
      state.tournament!.matches.find(({ id }) => id === next.id),
    ).toMatchObject({ status: "complete", scoreA: 2 });
    expect(
      state.tournament!.players.find(({ id }) => id === winnerId)?.name,
    ).toBe("Patrick");

    const expanded = [
      ...state.tournament!.players.map(({ id, name, rating }) => ({
        id,
        name,
        rating,
      })),
      { id: "late", name: "Late player", rating: "3.5" as const },
    ];
    state = appReducer(state, {
      type: "rebuild-tournament",
      players: expanded,
      now: 6_000,
    });
    expect(state.tournament?.players).toHaveLength(5);
    expect(
      state.tournament?.matches.every(
        ({ scoreA, scoreB, status }) =>
          scoreA === 0 && scoreB === 0 && status !== "complete",
      ),
    ).toBe(true);
    expect(state.sessionDeadline).toBe(deadline);
  });

  it("applies and reverses a late-entry amendment without clearing results", () => {
    const sixPlayers = [
      ...players,
      { id: "p4", name: "Player 4", rating: "3.5" as const },
      { id: "p5", name: "Player 5", rating: "3.5" as const },
    ];
    let state = appReducer(initialAppState(0, true), {
      type: "create-tournament",
      players: sixPlayers,
      config,
      now: 1_000,
    });
    const late = { id: "late", name: "Late Player", rating: "3.5" as const };
    const plan = planLateEntry(state.tournament!, late, {
      now: 2_000,
      randomSeed: config.randomSeed,
      sessionDeadline: state.sessionDeadline,
      transitionSeconds: config.transitionSeconds,
    });
    const deadline = state.sessionDeadline;
    state = appReducer(state, {
      type: "apply-late-entry",
      player: late,
      plan,
      declinedPlayerIds: [],
      removeTimeLimit: false,
      now: 2_000,
    });
    expect(state.tournament).toMatchObject({
      players: expect.arrayContaining([
        expect.objectContaining({ id: "late" }),
      ]),
      amendments: [expect.objectContaining({ method: "reversible-bye" })],
    });
    expect(getNextMatch(state.tournament!)?.kind).toBe("challenge");
    expect(state.sessionDeadline).toBe(deadline);

    state = appReducer(state, { type: "undo-late-entry", now: 3_000 });
    expect(state.tournament?.players).toHaveLength(6);
    expect(state.tournament?.amendments).toEqual([]);
    expect(state.sessionDeadline).toBe(deadline);
  });

  it("discards a tournament attempt without advancing the bracket", () => {
    let state = appReducer(initialAppState(0), {
      type: "create-tournament",
      players,
      config,
      now: 1_000,
    });
    const next = getNextMatch(state.tournament!)!;
    state = appReducer(state, {
      type: "start-match",
      matchId: next.id,
      now: 2_000,
    });
    state = appReducer(state, { type: "discard-match", now: 3_000 });
    expect(state).toMatchObject({
      screen: "bracket",
      activeMatchId: null,
      scorer: null,
    });
    expect(getNextMatch(state.tournament!)?.id).toBe(next.id);
  });

  it("advances the selected winner when a tournament match ends tied", () => {
    let state = appReducer(initialAppState(0), {
      type: "create-tournament",
      players,
      config,
      now: 1_000,
    });
    const next = getNextMatch(state.tournament!)!;
    state = appReducer(state, {
      type: "start-match",
      matchId: next.id,
      now: 2_000,
    });
    state = appReducer(state, {
      type: "score",
      action: { type: "start", now: 2_000 },
      now: 2_000,
    });
    state = appReducer(state, {
      type: "score",
      action: { type: "end-early", now: 3_000, winner: "B" },
      now: 3_000,
    });
    state = appReducer(state, { type: "confirm-result", now: 4_000 });

    const completed = state.tournament!.matches.find(
      ({ id }) => id === next.id,
    )!;
    expect(completed).toMatchObject({
      scoreA: 0,
      scoreB: 0,
      status: "complete",
      winnerId: next.sideB!.memberIds[0],
    });
  });
});
