import { describe, expect, it } from "vitest";
import { emptySessionHistory } from "../history";
import {
  clearHistory,
  HISTORY_KEY,
  loadHistory,
  migrateHistory,
  saveHistory,
} from "./history-storage";
import type { StorageLike } from "./storage";
import { roundRobinTournamentFixture } from "./test-fixtures";

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("history persistence", () => {
  it("round-trips a separately versioned local history", () => {
    const storage = new MemoryStorage();
    const history = emptySessionHistory();
    saveHistory(storage, history);
    expect(loadHistory(storage)).toEqual({ status: "ok", history });
  });

  it("reports corrupt history without deleting active or corrupt data", () => {
    const storage = new MemoryStorage();
    storage.values.set(HISTORY_KEY, "{bad-json");
    storage.values.set("pickle-king:snapshot", "active");
    expect(loadHistory(storage)).toMatchObject({ status: "corrupt" });
    expect(storage.values.get(HISTORY_KEY)).toBe("{bad-json");
    clearHistory(storage);
    expect(storage.values.get("pickle-king:snapshot")).toBe("active");
  });

  it("rejects unsupported, oversized, and invalid history", () => {
    expect(() => migrateHistory({ version: 3 })).toThrow(/unsupported/i);
    expect(() =>
      migrateHistory({ version: 1, quickMatches: [], tournaments: [{}] }),
    ).toThrow(/validation/i);
    expect(() =>
      migrateHistory({
        version: 1,
        quickMatches: Array.from({ length: 51 }, () => ({})),
        tournaments: [],
      }),
    ).toThrow(/validation/i);
  });

  it("migrates v1 tournament archives to knockout v2", () => {
    const bracket = roundRobinTournamentFixture();
    const legacyBracket = structuredClone({
      ...bracket,
      format: "knockout",
      matches: bracket.matches.map((match) => ({
        ...match,
        kind: match.kind === "round-robin" ? "elimination" : match.kind,
        sourceA:
          "rank" in match.sourceA
            ? { type: "winner", matchId: "semi-a" }
            : match.sourceA,
        sourceB:
          "rank" in match.sourceB
            ? { type: "winner", matchId: "semi-b" }
            : match.sourceB,
      })),
    }) as Record<string, unknown>;
    delete legacyBracket.format;
    const migrated = migrateHistory({
      version: 1,
      quickMatches: [],
      tournaments: [{ id: "archive", completedAt: 10, bracket: legacyBracket }],
    });
    expect(migrated).toMatchObject({
      version: 2,
      tournaments: [{ bracket: { format: "knockout" } }],
    });
  });

  it.each([4, 5, 6])(
    "round-trips valid v2 %i-player round-robin history with the bracket key",
    (size) => {
      const storage = new MemoryStorage();
      const history = {
        version: 2 as const,
        quickMatches: [],
        tournaments: [
          {
            id: "round-robin-archive",
            completedAt: 10,
            bracket: roundRobinTournamentFixture(size),
          },
        ],
      };
      saveHistory(storage, history);
      expect(loadHistory(storage)).toEqual({ status: "ok", history });
      expect(
        JSON.parse(storage.values.get(HISTORY_KEY) ?? "{}"),
      ).toHaveProperty("tournaments.0.bracket");
    },
  );
});
