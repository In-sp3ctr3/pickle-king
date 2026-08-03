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
    expect(() => migrateHistory({ version: 2 })).toThrow(/unsupported/i);
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
});
