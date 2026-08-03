import { describe, expect, it } from "vitest";
import {
  applyLateEntry,
  completeMatch,
  createTournamentBracket,
  getNextMatch,
  lateEntryCorrectionBlockReason,
  planLateEntry,
  startMatch,
  undoLateEntry,
} from "./index";
import type { Player, TournamentBracket, TournamentConfig } from "./types";

const config: TournamentConfig = {
  drawStyle: "ranked",
  timingMode: "untimed",
  bookingMinutes: 120,
  warmupMinutes: 0,
  transitionSeconds: 0,
  targetScore: 11,
  randomSeed: "late-entry",
};

function players(count: number): Player[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    name: `Player ${index + 1}`,
    rating: "3.5",
  }));
}

const latePlayer: Player = {
  id: "late",
  name: "Late Player",
  rating: "3.5",
};

function plan(bracket: TournamentBracket) {
  return planLateEntry(bracket, latePlayer, {
    now: 10_000,
    randomSeed: config.randomSeed,
    sessionDeadline: null,
    transitionSeconds: 0,
  });
}

function completeNext(bracket: TournamentBracket, at: number) {
  const next = getNextMatch(bracket)!;
  return completeMatch(bracket, next.id, 11, 4, at);
}

describe("late-entry challenge", () => {
  it("fills a reversible bye before using any other repair", () => {
    const bracket = createTournamentBracket(players(6), config);
    const proposal = plan(bracket);
    expect(proposal.method).toBe("reversible-bye");
    expect(proposal.restoredPlayerIds).toEqual([]);

    const amended = applyLateEntry(bracket, latePlayer, proposal, {
      createdAt: 10_000,
      declinedPlayerIds: [],
      removeTimeLimit: false,
    });
    expect(amended.players).toHaveLength(7);
    expect(
      amended.matches.filter(({ kind }) => kind === "challenge"),
    ).toHaveLength(1);
    expect(getNextMatch(amended)?.kind).toBe("challenge");
  });

  it("uses an untouched preliminary when no reversible bye exists", () => {
    const bracket = createTournamentBracket(players(4), config);
    const proposal = plan(bracket);
    expect(proposal.method).toBe("untouched-preliminary");
    expect(proposal.timing.remainingMatches).toBe(5);
    expect(plan(bracket).protectedPlayerId).toBe(proposal.protectedPlayerId);
  });

  it("runs a deterministic branch gauntlet and preserves prior results", () => {
    let bracket = createTournamentBracket(players(4), config);
    bracket = completeNext(bracket, 1_000);
    bracket = completeNext(bracket, 2_000);
    const priorResults = bracket.matches
      .filter(({ status }) => status === "complete")
      .map(({ id, scoreA, scoreB, winnerId }) => ({
        id,
        scoreA,
        scoreB,
        winnerId,
      }));
    const proposal = plan(bracket);
    expect(proposal.method).toBe("branch-gauntlet");
    expect(proposal.restoredPlayerIds).toHaveLength(1);

    const amended = applyLateEntry(bracket, latePlayer, proposal, {
      createdAt: 3_000,
      declinedPlayerIds: [],
      removeTimeLimit: false,
    });
    expect(
      amended.matches
        .filter(({ status }) => status === "complete")
        .map(({ id, scoreA, scoreB, winnerId }) => ({
          id,
          scoreA,
          scoreB,
          winnerId,
        })),
    ).toEqual(priorResults);
    expect(
      amended.matches.filter(({ kind }) => kind === "challenge"),
    ).toHaveLength(2);
    expect(
      lateEntryCorrectionBlockReason(amended, proposal.lineageMatchIds[0]),
    ).toMatch(/undo/i);
  });

  it("lets declined eliminated players be skipped", () => {
    let bracket = createTournamentBracket(players(4), config);
    bracket = completeNext(bracket, 1_000);
    bracket = completeNext(bracket, 2_000);
    const proposal = plan(bracket);
    const amended = applyLateEntry(bracket, latePlayer, proposal, {
      createdAt: 3_000,
      declinedPlayerIds: proposal.restoredPlayerIds,
      removeTimeLimit: false,
    });
    expect(
      amended.matches.filter(({ kind }) => kind === "challenge"),
    ).toHaveLength(1);
  });

  it("rewires the final and bronze after semifinals without erasing them", () => {
    let bracket = createTournamentBracket(players(4), config);
    bracket = completeNext(bracket, 1_000);
    bracket = completeNext(bracket, 2_000);
    const proposal = plan(bracket);
    expect(proposal.targetMatchId).toBe(bracket.finalMatchId);
    expect(proposal.bronzeSlot).not.toBeNull();
    const amended = applyLateEntry(bracket, latePlayer, proposal, {
      createdAt: 5_000,
      declinedPlayerIds: [],
      removeTimeLimit: false,
    });
    expect(
      amended.matches.find(({ id }) => id === bracket.finalMatchId),
    ).toMatchObject({ status: "waiting" });
    expect(
      amended.matches.find(({ id }) => id === bracket.bronzeMatchId),
    ).toMatchObject({ status: "waiting" });
  });

  it("undoes an untouched amendment but locks it once challenge play starts", () => {
    const bracket = createTournamentBracket(players(6), config);
    const proposal = plan(bracket);
    const amended = applyLateEntry(bracket, latePlayer, proposal, {
      createdAt: 10_000,
      declinedPlayerIds: [],
      removeTimeLimit: false,
    });
    expect(undoLateEntry(amended)).toEqual(bracket);
    const challenge = getNextMatch(amended)!;
    const started = startMatch(amended, challenge.id, 11_000);
    expect(() => undoLateEntry(started)).toThrow(/already started/i);
  });

  it("blocks placement-stage insertion, duplicate amendments, and full fields", () => {
    let bracket = createTournamentBracket(players(4), config);
    bracket = completeNext(bracket, 1_000);
    bracket = completeNext(bracket, 2_000);
    bracket = startMatch(bracket, getNextMatch(bracket)!.id, 5_000);
    expect(() => plan(bracket)).toThrow(/placement/i);

    const six = createTournamentBracket(players(6), config);
    const proposal = plan(six);
    const amended = applyLateEntry(six, latePlayer, proposal, {
      createdAt: 10_000,
      declinedPlayerIds: [],
      removeTimeLimit: false,
    });
    expect(() =>
      planLateEntry(
        amended,
        { id: "another", name: "Another", rating: "3.5" },
        {
          now: 12_000,
          randomSeed: config.randomSeed,
          sessionDeadline: null,
          transitionSeconds: 0,
        },
      ),
    ).toThrow(/one late-entry/i);
    expect(() =>
      planLateEntry(createTournamentBracket(players(16), config), latePlayer, {
        now: 12_000,
        randomSeed: config.randomSeed,
        sessionDeadline: null,
        transitionSeconds: 0,
      }),
    ).toThrow(/16/i);
  });
});
