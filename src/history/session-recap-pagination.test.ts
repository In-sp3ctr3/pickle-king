import { describe, expect, it } from "vitest";
import {
  latestQuickMatchDayIds,
  paginateRecapPlayers,
  receiptDateLabel,
} from "./session-recap";
import type { QuickMatchRecord } from "./types";

function match(id: string, completedAt: number): QuickMatchRecord {
  return {
    id,
    completedAt,
    finishReason: "target",
    format: "singles",
    labels: { sideA: "Maya", sideB: "Rae" },
    participants: { sideA: ["Maya"], sideB: ["Rae"] },
    score: { sideA: 11, sideB: 7 },
    targetScore: 11,
    winner: "A",
  };
}

describe("session recap pagination", () => {
  it("starts strict continuation chunks at player thirteen", () => {
    const players = Array.from({ length: 25 }, (_, index) => ({
      differential: 0,
      gamesPlayed: 1,
      losses: 0,
      name: `Player ${index + 1}`,
      pointsAgainst: 0,
      pointsFor: 1,
      wins: 1,
    }));
    for (const [count, lengths] of [
      [12, [12]],
      [13, [12, 1]],
      [24, [12, 12]],
      [25, [12, 12, 1]],
    ] as const) {
      const pages = paginateRecapPlayers(players.slice(0, count));
      expect(pages.map((page) => page.length)).toEqual(lengths);
      expect(pages.flat()).toEqual(players.slice(0, count));
    }
  });

  it("defaults selection to the newest local day and formats the range", () => {
    const older = match("older", new Date(2026, 7, 21, 23).getTime());
    const latest = [
      match("latest-0", new Date(2026, 7, 22, 10).getTime()),
      match("latest-1", new Date(2026, 7, 22, 11).getTime()),
    ];
    expect(latestQuickMatchDayIds([older, ...latest])).toEqual(
      new Set(["latest-0", "latest-1"]),
    );
    expect(receiptDateLabel([older.completedAt, latest[1].completedAt])).toBe(
      "AUG 21–22 RECEIPTS",
    );
  });
});
