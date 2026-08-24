import { describe, expect, it } from "vitest";
import type { FinishReason } from "../match/types";
import type { QuickMatchRecord } from "./types";
import {
  buildSessionRecaps,
  latestQuickMatchDayIds,
  paginateRecapPlayers,
  receiptDateLabel,
} from "./session-recap";

let completedAt = new Date(2026, 7, 22, 18).getTime();

function record({
  format,
  loser,
  loserScore,
  targetScore = 11,
  winner,
  winnerScore = 11,
  finishReason = "target",
}: {
  finishReason?: FinishReason;
  format: QuickMatchRecord["format"];
  loser: string[];
  loserScore: number;
  targetScore?: number;
  winner: string[];
  winnerScore?: number;
}): QuickMatchRecord {
  completedAt += 1_000;
  return {
    id: `match-${completedAt}`,
    completedAt,
    finishReason,
    format,
    labels: { sideA: winner.join(" + "), sideB: loser.join(" + ") },
    participants: { sideA: winner, sideB: loser },
    score: { sideA: winnerScore, sideB: loserScore },
    targetScore,
    winner: "A",
  };
}

function suppliedDoubles() {
  return [
    record({
      format: "doubles",
      winner: ["Shevar", "Kaodi"],
      loser: ["Jadan", "Khamoi"],
      loserScore: 8,
    }),
    record({
      format: "doubles",
      winner: ["Shevar", "Kaodi"],
      loser: ["Shemar", "Teandra"],
      loserScore: 6,
    }),
    record({
      format: "doubles",
      winner: ["Shevar", "Kaodi"],
      loser: ["Jadan", "Shemar"],
      loserScore: 6,
    }),
    record({
      format: "doubles",
      winner: ["Shevar", "Teandra"],
      loser: ["Kaodi", "Jadan"],
      loserScore: 9,
    }),
    record({
      format: "doubles",
      winner: ["Teandra", "Jadan"],
      loser: ["Shemar", "Khamoi"],
      loserScore: 6,
    }),
    record({
      format: "doubles",
      winner: ["Teandra", "Shemar"],
      loser: ["Shevar", "Khamoi"],
      loserScore: 7,
    }),
    record({
      format: "doubles",
      winner: ["Jadan", "Shemar"],
      loser: ["Kaodi", "Khamoi"],
      loserScore: 8,
    }),
  ];
}

function suppliedSingles() {
  return [
    record({
      format: "singles",
      targetScore: 3,
      winnerScore: 3,
      winner: ["Jadan"],
      loser: ["Shevar"],
      loserScore: 1,
    }),
    record({
      format: "singles",
      targetScore: 3,
      winnerScore: 4,
      winner: ["Jadan"],
      loser: ["Teandra"],
      loserScore: 0,
    }),
    record({
      format: "singles",
      targetScore: 3,
      winnerScore: 3,
      winner: ["Jadan"],
      loser: ["Shemar"],
      loserScore: 0,
    }),
    record({
      format: "singles",
      targetScore: 3,
      winnerScore: 3,
      winner: ["Jadan"],
      loser: ["Kaodi"],
      loserScore: 1,
    }),
    record({
      format: "singles",
      targetScore: 3,
      winnerScore: 3,
      winner: ["Shemar"],
      loser: ["Teandra"],
      loserScore: 1,
    }),
    record({
      format: "singles",
      targetScore: 3,
      winnerScore: 3,
      winner: ["Kaodi"],
      loser: ["Shevar"],
      loserScore: 1,
    }),
  ];
}

describe("session recap", () => {
  it("reproduces the supplied Doubles receipts and unique Top Pair", () => {
    const [recap] = buildSessionRecaps(suppliedDoubles());

    expect(
      recap.players.map(({ name, wins, losses, differential }) => [
        name,
        wins,
        losses,
        differential,
      ]),
    ).toEqual([
      ["Shevar", 4, 1, 11],
      ["Teandra", 3, 1, 6],
      ["Kaodi", 3, 2, 8],
      ["Jadan", 2, 3, -2],
      ["Shemar", 2, 3, -8],
      ["Khamoi", 0, 4, -15],
    ]);
    expect(recap.topPair).toMatchObject({
      names: ["Shevar", "Kaodi"],
      wins: 3,
      losses: 0,
    });
  });

  it("reproduces the supplied Singles receipts", () => {
    const [recap] = buildSessionRecaps(suppliedSingles());

    expect(
      recap.players.map(({ name, wins, losses, differential }) => [
        name,
        wins,
        losses,
        differential,
      ]),
    ).toEqual([
      ["Jadan", 4, 0, 11],
      ["Kaodi", 1, 1, 0],
      ["Shemar", 1, 1, -1],
      ["Shevar", 0, 2, -4],
      ["Teandra", 0, 2, -6],
    ]);
  });

  it("is invariant to record order and winner side", () => {
    const values = suppliedSingles();
    const reversedSides = values.map((match) => ({
      ...match,
      labels: { sideA: match.labels.sideB, sideB: match.labels.sideA },
      participants: {
        sideA: match.participants.sideB,
        sideB: match.participants.sideA,
      },
      score: { sideA: match.score.sideB, sideB: match.score.sideA },
      winner: "B" as const,
    }));

    expect(buildSessionRecaps(reversedSides.reverse())[0].players).toEqual(
      buildSessionRecaps(values)[0].players,
    );
  });

  it("merges case-only names and keeps the newest spelling", () => {
    const first = record({
      format: "singles",
      winner: ["jadan"],
      loser: ["Maya"],
      loserScore: 8,
    });
    const newest = record({
      format: "singles",
      winner: ["JADAN"],
      loser: ["Rae"],
      loserScore: 7,
    });

    expect(buildSessionRecaps([first, newest])[0].players[0]).toMatchObject({
      name: "JADAN",
      wins: 2,
    });
  });

  it("uses a stable id tie-break when case variants share a timestamp", () => {
    const first = record({
      format: "singles",
      winner: ["jadan"],
      loser: ["Maya"],
      loserScore: 8,
    });
    const second = {
      ...record({
        format: "singles",
        winner: ["JADAN"],
        loser: ["Rae"],
        loserScore: 7,
      }),
      completedAt: first.completedAt,
      id: `${first.id}-z`,
    };

    expect(buildSessionRecaps([second, first])[0].players[0].name).toBe(
      "JADAN",
    );
    expect(buildSessionRecaps([first, second])[0].players[0].name).toBe(
      "JADAN",
    );
  });

  it("keeps pairs distinct when player names contain separators", () => {
    const values = [
      record({
        format: "doubles",
        winner: ["A|B", "C"],
        loser: ["A", "B|C"],
        loserScore: 8,
      }),
      record({
        format: "doubles",
        winner: ["A|B", "C"],
        loser: ["A", "B|C"],
        loserScore: 7,
      }),
    ];

    expect(buildSessionRecaps(values)[0].topPair).toMatchObject({
      names: ["A|B", "C"],
      wins: 2,
      losses: 0,
    });
  });

  it.each<FinishReason>([
    "buzzer",
    "golden-point",
    "ended-early",
    "operator-selection",
  ])("omits differential for a %s finish", (finishReason) => {
    const values = suppliedSingles();
    values[0] = { ...values[0], finishReason };
    expect(buildSessionRecaps(values)[0].showDifferential).toBe(false);
  });

  it("omits differential when targets differ", () => {
    const values = suppliedSingles();
    values[0] = { ...values[0], targetScore: 5 };
    expect(buildSessionRecaps(values)[0].showDifferential).toBe(false);
  });

  it("omits Top Pair when the numerical lead is tied", () => {
    const values = [
      record({
        format: "doubles",
        winner: ["A", "B"],
        loser: ["E", "F"],
        loserScore: 9,
      }),
      record({
        format: "doubles",
        winner: ["A", "B"],
        loser: ["G", "H"],
        loserScore: 9,
      }),
      record({
        format: "doubles",
        winner: ["C", "D"],
        loser: ["E", "G"],
        loserScore: 9,
      }),
      record({
        format: "doubles",
        winner: ["C", "D"],
        loser: ["F", "H"],
        loserScore: 9,
      }),
    ];
    expect(buildSessionRecaps(values)[0].topPair).toBeNull();
  });

  it("balances every player into pages of at most six", () => {
    const players = Array.from({ length: 13 }, (_, index) => ({
      differential: 0,
      gamesPlayed: 1,
      losses: 0,
      name: `Player ${index + 1}`,
      pointsAgainst: 0,
      pointsFor: 1,
      wins: 1,
    }));
    const pages = paginateRecapPlayers(players);
    expect(pages.map((page) => page.length)).toEqual([5, 4, 4]);
    expect(pages.flat()).toEqual(players);
  });

  it("defaults selection to the newest local day and formats the range", () => {
    const older = {
      ...suppliedSingles()[0],
      id: "older",
      completedAt: new Date(2026, 7, 21, 23).getTime(),
    };
    const latest = suppliedDoubles()
      .slice(0, 2)
      .map((match, index) => ({
        ...match,
        id: `latest-${index}`,
        completedAt: new Date(2026, 7, 22, 10 + index).getTime(),
      }));
    expect(latestQuickMatchDayIds([older, ...latest])).toEqual(
      new Set(["latest-0", "latest-1"]),
    );
    expect(receiptDateLabel([older.completedAt, latest[1].completedAt])).toBe(
      "AUG 21–22 RECEIPTS",
    );
  });
});
