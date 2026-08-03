import { describe, expect, it } from "vitest";
import { createScoringState } from "../match/scoring";
import { createTournamentBracket, startMatch } from "../tournament";
import type { Player, TournamentConfig } from "../tournament";
import type { TournamentSnapshotV1 } from "./schema";
import {
  clearSnapshot,
  loadSnapshot,
  migrateSnapshot,
  saveSnapshot,
  type StorageLike,
} from "./storage";

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
  drawStyle: "competitive",
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

function snapshot(): TournamentSnapshotV1 {
  let tournament = createTournamentBracket(players, config);
  let match = tournament.matches.find(({ status }) => status === "ready")!;
  tournament = startMatch(tournament, match.id, 1_000);
  match = tournament.matches.find(({ id }) => id === match.id)!;
  return {
    version: 1,
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
  };
}

describe("snapshot persistence", () => {
  it("round-trips a validated v1 snapshot", () => {
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
    expect(() => migrateSnapshot({ version: 2 })).toThrow(/unsupported/i);
    const storage = new MemoryStorage();
    saveSnapshot(storage, snapshot());
    clearSnapshot(storage);
    expect(loadSnapshot(storage)).toEqual({ status: "empty" });
  });

  it("migrates pre-amendment v1 brackets with an empty amendment ledger", () => {
    const legacy = structuredClone(snapshot()) as unknown as {
      tournament: Record<string, unknown>;
    };
    delete legacy.tournament.amendments;
    expect(migrateSnapshot(legacy).tournament?.amendments).toEqual([]);
  });

  it("adds draw, comeback, and score-event defaults to earlier v1 sessions", () => {
    const legacy = structuredClone(snapshot()) as unknown as {
      scorer: Record<string, unknown>;
      setupDraft: { config: Record<string, unknown> };
      tournament: { matches: Array<Record<string, unknown>> };
    };
    delete legacy.setupDraft.config.drawStyle;
    delete legacy.scorer.scoreEvents;
    legacy.tournament.matches.forEach((match) => delete match.comebackDeficit);
    const migrated = migrateSnapshot(legacy);
    expect(migrated.setupDraft?.config.drawStyle).toBe("competitive");
    expect(migrated.scorer?.scoreEvents).toEqual([]);
    expect(
      migrated.tournament?.matches.every(
        ({ comebackDeficit }) => comebackDeficit === 0,
      ),
    ).toBe(true);
  });
});
