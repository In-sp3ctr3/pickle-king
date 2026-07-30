import { describe, expect, it } from "vitest";
import { createTournamentBracket, type Player } from "../../tournament";
import { createTreeLayout } from "./bracket-tree-layout";

function players(count: number): Player[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    name: `Player ${index + 1}`,
    rating: "3.5",
  }));
}

function bracket(count: number) {
  return createTournamentBracket(players(count), {
    bookingMinutes: 120,
    randomSeed: "tree-layout",
    targetScore: 11,
    timingMode: "timed",
    transitionSeconds: 60,
    warmupMinutes: 10,
  });
}

describe("connected bracket tree layout", () => {
  it.each([4, 8, 16])(
    "puts a %i-player field on two outer sides converging on a champion slot",
    (count) => {
      const tournament = bracket(count);
      const layout = createTreeLayout(tournament);
      const entries = layout.nodes.filter(({ node }) => node.kind === "entry");
      const champion = layout.nodes.find(
        ({ node }) => node.kind === "champion",
      );
      const championshipLinks = layout.links.filter(
        ({ kind }) => kind === "championship",
      );
      const finalists = layout.nodes.filter(
        ({ node }) => node.kind === "finalist",
      );

      expect(entries).toHaveLength(tournament.bracketSize);
      expect(finalists).toHaveLength(2);
      expect(Math.min(...entries.map(({ x }) => x))).toBe(16);
      expect(Math.max(...entries.map(({ x }) => x))).toBeGreaterThan(
        layout.boardWidth / 2,
      );
      expect(champion?.x).toBe(layout.boardWidth / 2 - 110);
      expect(championshipLinks).toHaveLength(2);
      expect(championshipLinks.every(({ toId }) => toId === "champion")).toBe(
        true,
      );
      expect(layout.links.every(({ fromId, toId }) => fromId !== toId)).toBe(
        true,
      );
    },
  );

  it("renders explicit bye nodes and connects them to the next round", () => {
    const tournament = bracket(5);
    const layout = createTreeLayout(tournament);
    const byes = layout.nodes.filter(({ node }) => node.kind === "bye");
    const linkedIds = new Set(layout.links.map(({ fromId }) => fromId));

    expect(byes).toHaveLength(3);
    expect(byes.every(({ node }) => linkedIds.has(node.id))).toBe(true);
    expect(
      layout.nodes.filter(
        ({ node }) => node.kind === "entry" && node.player === null,
      ),
    ).toHaveLength(3);
  });
});
