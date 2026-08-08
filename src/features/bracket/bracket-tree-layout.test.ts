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
    format: "knockout",
    drawStyle: "ranked",
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
    "uses one two-contender node per match for a %i-player draw",
    (count) => {
      const tournament = bracket(count);
      const layout = createTreeLayout(tournament);
      const final = layout.nodes.find(({ node }) => node.kind === "final");
      const bronze = layout.nodes.find(({ node }) => node.kind === "bronze");
      const openingNodes = layout.nodes.filter(({ node }) => node.round === 1);

      expect(layout.nodes).toHaveLength(tournament.bracketSize);
      expect(openingNodes).toHaveLength(tournament.bracketSize / 2);
      expect(Math.min(...openingNodes.map(({ x }) => x))).toBe(24);
      expect(Math.max(...openingNodes.map(({ x }) => x))).toBeGreaterThan(
        layout.boardWidth / 2,
      );
      expect(final).toBeDefined();
      if (!final || final.node.kind !== "final") {
        throw new Error("Final node missing.");
      }
      expect(final.x).toBe(layout.boardWidth / 2 - final.width / 2);
      expect(bronze).toBeDefined();
      if (!bronze) throw new Error("Bronze node missing.");
      expect(bronze.x + bronze.width / 2).toBe(final.x + final.width / 2);
      expect(bronze.y).toBeGreaterThan(final.y);
      const sideNodes = layout.nodes.filter(({ node }) =>
        ["match", "bye"].includes(node.kind),
      );
      expect(
        sideNodes.every(
          (positioned) =>
            positioned.x + positioned.width <= final.x ||
            positioned.x >= final.x + final.width,
        ),
      ).toBe(true);
      expect(final.node.match.sourceA).toBeTruthy();
      expect(final.node.match.sourceB).toBeTruthy();
      expect(layout.links.every(({ fromId, toId }) => fromId !== toId)).toBe(
        true,
      );
    },
  );

  it("keeps six-player automatic-advance paths connected", () => {
    const tournament = bracket(6);
    const layout = createTreeLayout(tournament);
    const byes = layout.nodes
      .map(({ node }) => node)
      .filter((node) => node.kind === "bye");

    expect(byes).toHaveLength(2);
    expect(byes.every(({ player }) => player)).toBe(true);
    expect(layout.nodes.map(({ node }) => node.kind)).not.toContain("entry");
  });

  it("places the actual random-draw bye recipients in the connected tree", () => {
    const tournament = createTournamentBracket(players(6), {
      format: "knockout",
      drawStyle: "random",
      bookingMinutes: 120,
      randomSeed: "tree-random-byes",
      targetScore: 11,
      timingMode: "untimed",
      transitionSeconds: 60,
      warmupMinutes: 10,
    });
    const layout = createTreeLayout(tournament);
    const byeIds = layout.nodes.flatMap(({ node }) =>
      node.kind === "bye" ? [node.player.id] : [],
    );
    const directlyAdvancedIds = tournament.matches
      .filter(({ kind, round }) => kind === "elimination" && round === 2)
      .flatMap(({ sourceA, sourceB }) => [sourceA, sourceB])
      .flatMap((source) => (source.type === "player" ? [source.playerId] : []));
    expect(new Set(byeIds)).toEqual(new Set(directlyAdvancedIds));
  });
});
