import { describe, expect, it } from "vitest";
import { createScoringState } from "../match/scoring";
import { createTournamentBracket, startMatch } from "../tournament";
import type { Player, TournamentConfig } from "../tournament";
import type { TournamentSnapshotV2 } from "./schema";
import {
  clearSnapshot,
  loadSnapshot,
  migrateSnapshot,
  saveSnapshot,
  type StorageLike,
} from "./storage";
import {
  lateEntryAmendmentFixture,
  liveRoundRobinSnapshotFixture,
  roundRobinSnapshotFixture,
  roundRobinTournamentFixture,
} from "./test-fixtures";

class MemoryStorage implements StorageLike {
  value: string | null = null;
  getItem() {
    return this.value;
  }
  setItem(_key: string, value: string) {
    this.value = value;
  }
  removeItem() {
    this.value = null;
  }
}

const config: TournamentConfig = {
  format: "knockout",
  drawStyle: "ranked",
  timingMode: "timed",
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 11,
  randomSeed: "persist",
};
const players: Player[] = Array.from({ length: 4 }, (_, index) => ({
  id: `p${index}`,
  name: `Player ${index}`,
  rating: "3.5",
}));

function snapshot(): TournamentSnapshotV2 {
  const bracket = createTournamentBracket(players, config);
  let match = bracket.matches.find(({ status }) => status === "ready")!;
  const tournament = {
    ...startMatch(bracket, match.id, 1_000),
    format: "knockout" as const,
  };
  match = tournament.matches.find(({ id }) => id === match.id)!;
  return {
    version: 2,
    updatedAt: 1_000,
    screen: "live",
    setupDraft: { players, config },
    tournament,
    activeMatchId: match.id,
    scorer: createScoringState({
      sideA: match.sideA!,
      sideB: match.sideB!,
      labelA: "Player A",
      labelB: "Player B",
      targetScore: 11,
      durationMs: match.config.capMs,
    }),
    sessionDeadline: 8_000_000,
    quickMatch: false,
    historyTournamentId: null,
  };
}

describe("snapshot persistence", () => {
  it("round-trips a validated v2 snapshot", () => {
    const storage = new MemoryStorage();
    saveSnapshot(storage, snapshot());
    expect(loadSnapshot(storage)).toEqual({
      status: "ok",
      snapshot: snapshot(),
    });
  });

  it("reports corrupt JSON and invalid shapes without discarding them", () => {
    const storage = new MemoryStorage();
    storage.value = "{not-json";
    expect(loadSnapshot(storage)).toMatchObject({ status: "corrupt" });
    storage.value = JSON.stringify({ version: 1, screen: "live" });
    expect(loadSnapshot(storage)).toMatchObject({ status: "corrupt" });
    expect(storage.value).not.toBeNull();
  });

  it("rejects shape-valid snapshots with impossible live state", () => {
    const invalid = snapshot();
    invalid.scorer = null;
    expect(() => migrateSnapshot(invalid)).toThrow(/validation/i);
  });

  it("rejects unsupported versions and clears only when requested", () => {
    expect(() => migrateSnapshot({ version: 3 })).toThrow(/unsupported/i);
    const storage = new MemoryStorage();
    saveSnapshot(storage, snapshot());
    clearSnapshot(storage);
    expect(loadSnapshot(storage)).toEqual({ status: "empty" });
  });

  it("migrates v1 snapshots to knockout v2 while retaining legacy defaults", () => {
    const legacy = structuredClone(snapshot()) as unknown as {
      version: number;
      setupDraft: { config: Record<string, unknown> };
      tournament: Record<string, unknown>;
    };
    legacy.version = 1;
    delete legacy.setupDraft.config.format;
    delete legacy.tournament.format;
    delete legacy.tournament.amendments;
    const migrated = migrateSnapshot(legacy);
    expect(migrated).toMatchObject({
      version: 2,
      setupDraft: { config: { format: "knockout" } },
      tournament: { format: "knockout", amendments: [] },
    });
  });

  it("adds draw, comeback, and score-event defaults to earlier v1 sessions", () => {
    const legacy = structuredClone(snapshot()) as unknown as {
      version: number;
      scorer: Record<string, unknown>;
      setupDraft: { config: Record<string, unknown> };
      tournament: { matches: Array<Record<string, unknown>> };
    };
    legacy.version = 1;
    delete legacy.setupDraft.config.format;
    delete legacy.setupDraft.config.drawStyle;
    delete legacy.scorer.scoreEvents;
    legacy.tournament.matches.forEach((match) => delete match.comebackDeficit);
    const migrated = migrateSnapshot(legacy);
    expect(migrated.setupDraft?.config.drawStyle).toBe("ranked");
    expect(migrated.scorer?.scoreEvents).toEqual([]);
    expect(
      migrated.tournament?.matches.every(
        ({ comebackDeficit }) => comebackDeficit === 0,
      ),
    ).toBe(true);
  });

  it.each([
    ["competitive", "ranked"],
    ["social", "random"],
  ] as const)(
    "migrates the legacy %s draw style to %s",
    (legacyStyle, nextStyle) => {
      const legacy = structuredClone(snapshot()) as unknown as {
        version: number;
        setupDraft: { config: Record<string, unknown> };
        tournament: Record<string, unknown>;
      };
      legacy.version = 1;
      delete legacy.setupDraft.config.format;
      delete legacy.tournament.format;
      legacy.setupDraft.config.drawStyle = legacyStyle;
      expect(migrateSnapshot(legacy).setupDraft?.config.drawStyle).toBe(
        nextStyle,
      );
    },
  );

  it("accepts a valid four-player round robin v2 snapshot", () => {
    expect(migrateSnapshot(roundRobinSnapshotFixture())).toEqual(
      roundRobinSnapshotFixture(),
    );
  });

  it.each([5, 6] as const)(
    "round-trips a live %i-player round-robin snapshot",
    (size) => {
      const storage = new MemoryStorage();
      const current = liveRoundRobinSnapshotFixture(size);
      saveSnapshot(storage, current);
      expect(loadSnapshot(storage)).toEqual({
        status: "ok",
        snapshot: current,
      });
    },
  );

  it("requires the active setup and tournament formats to agree", () => {
    const invalid = roundRobinSnapshotFixture();
    invalid.setupDraft.config.format = "knockout";
    expect(() => migrateSnapshot(invalid)).toThrow(/validation/i);
  });

  it("rejects malformed round robin and format-crossed knockout records", () => {
    const malformed = roundRobinSnapshotFixture();
    malformed.tournament.matches = malformed.tournament.matches.slice(0, 7);
    expect(() => migrateSnapshot(malformed)).toThrow(/validation/i);

    const knockout = snapshot();
    knockout.tournament = roundRobinTournamentFixture();
    if (!knockout.tournament) throw new Error("Fixture requires tournament.");
    knockout.tournament.format = "knockout";
    knockout.setupDraft!.config.format = "knockout";
    expect(() => migrateSnapshot(knockout)).toThrow(/validation/i);
  });

  it("enforces round-robin pairings, placement sources, and no amendments", () => {
    const duplicatePairing = roundRobinSnapshotFixture();
    duplicatePairing.tournament.matches[5].sourceA = {
      type: "player",
      playerId: "p1",
    };
    duplicatePairing.tournament.matches[5].sourceB = {
      type: "player",
      playerId: "p4",
    };
    expect(() => migrateSnapshot(duplicatePairing)).toThrow(/validation/i);

    const badPlacement = roundRobinSnapshotFixture();
    badPlacement.tournament.matches[6].sourceA = {
      type: "standing",
      rank: 2,
    };
    expect(() => migrateSnapshot(badPlacement)).toThrow(/validation/i);

    const amended = roundRobinSnapshotFixture();
    amended.tournament.amendments = [lateEntryAmendmentFixture()];
    expect(() => migrateSnapshot(amended)).toThrow(/validation/i);
  });

  it("rejects seven players plus duplicate or missing pairings", () => {
    const sevenPlayers = roundRobinSnapshotFixture();
    sevenPlayers.tournament.players.push(
      { id: "p5", name: "Player 5", rating: "3.5", seed: 5 },
      { id: "p6", name: "Player 6", rating: "3.5", seed: 6 },
      { id: "p7", name: "Player 7", rating: "3.5", seed: 7 },
    );
    expect(() => migrateSnapshot(sevenPlayers)).toThrow(/validation/i);

    const duplicate = liveRoundRobinSnapshotFixture(6);
    const preliminaries = duplicate.tournament.matches.filter(
      ({ kind }) => kind === "round-robin",
    );
    preliminaries.at(-1)!.sourceA = preliminaries[0].sourceA;
    preliminaries.at(-1)!.sourceB = preliminaries[0].sourceB;
    expect(() => migrateSnapshot(duplicate)).toThrow(/validation/i);

    const missing = liveRoundRobinSnapshotFixture(5);
    missing.tournament.matches = missing.tournament.matches.filter(
      ({ id }) => id !== "rr-r5-m2",
    );
    expect(() => migrateSnapshot(missing)).toThrow(/validation/i);
  });

  it("rejects inconsistent round structure and bracket metadata", () => {
    const badRound = liveRoundRobinSnapshotFixture(5);
    const fifthRound = badRound.tournament.matches.find(
      ({ id }) => id === "rr-r5-m1",
    )!;
    fifthRound.round = 1;
    expect(() => migrateSnapshot(badRound)).toThrow(/validation/i);

    const badMetadata = liveRoundRobinSnapshotFixture(6);
    badMetadata.tournament.bracketSize = 5;
    expect(() => migrateSnapshot(badMetadata)).toThrow(/validation/i);

    const badPlacement = liveRoundRobinSnapshotFixture(6);
    badPlacement.tournament.roundCount = 5;
    expect(() => migrateSnapshot(badPlacement)).toThrow(/validation/i);

    const badPlacementRound = liveRoundRobinSnapshotFixture(6);
    badPlacementRound.tournament.matches.find(
      ({ id }) => id === "bronze",
    )!.round = 5;
    expect(() => migrateSnapshot(badPlacementRound)).toThrow(/validation/i);
  });
});
