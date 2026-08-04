import { describe, expect, it } from "vitest";
import {
  createTournamentBracket,
  type Player,
  type TournamentConfig,
} from "../../tournament";
import { matchSources } from "./bracket-share-layout";
import {
  portraitBracketGeometry,
  portraitRoundBands,
} from "./bracket-share-portrait";
import {
  portraitConnectorSegments,
  portraitMatchPositions,
} from "./bracket-share-portrait-layout";

const config: TournamentConfig = {
  drawStyle: "ranked",
  timingMode: "untimed",
  bookingMinutes: 120,
  warmupMinutes: 10,
  transitionSeconds: 60,
  targetScore: 11,
  randomSeed: "portrait-tree",
};

function players(count: number): Player[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    name: `Player ${index + 1}`,
    rating: "3.5",
  }));
}

describe("portrait bracket geometry", () => {
  it("keeps Story podium medals and labels inside the central safe area", () => {
    const layout = portraitBracketGeometry("story");
    const medalTop = layout.podiumY - 72;
    const labelBottom = layout.podiumY + 84;

    expect(medalTop).toBeGreaterThanOrEqual(240);
    expect(labelBottom).toBeLessThanOrEqual(layout.safeBottom);
  });

  it("reserves a labelled gap between the final and third place", () => {
    const layout = portraitBracketGeometry("story");
    const finalBottom = layout.final.y + layout.final.height;

    expect(layout.bronze.y - finalBottom).toBeGreaterThanOrEqual(36);
  });

  it.each(["feed", "story"] as const)(
    "keeps every 16-player %s round vertically separated",
    (format) => {
      const layout = portraitBracketGeometry(format);

      expect(layout.roundStartY).toBeGreaterThanOrEqual(250);
      expect(layout.final.y).toBeGreaterThan(layout.roundStartY);
      expect(layout.bronze.y).toBeGreaterThan(
        layout.final.y + layout.final.height,
      );
      expect(layout.bronze.y + layout.bronze.height).toBeLessThan(
        layout.podiumY - 54,
      );
    },
  );

  it.each([2, 3, 4])(
    "uses the Story canvas height for a %s-round tree",
    (roundCount) => {
      const layout = portraitBracketGeometry("story");
      const bands = portraitRoundBands(layout, roundCount);

      expect(bands).toHaveLength(roundCount - 1);
      expect(bands.at(-1)?.top).toBeLessThan(layout.final.y);
      expect(layout.final.y - bands[0].top).toBeGreaterThanOrEqual(700);
      for (let index = 1; index < bands.length; index += 1) {
        expect(bands[index].top).toBeGreaterThan(
          bands[index - 1].top + bands[index - 1].height,
        );
      }
    },
  );

  it.each([8, 16])(
    "draws one non-doubled dependency tree for %s players",
    (count) => {
      const bracket = createTournamentBracket(players(count), config);
      const elimination = bracket.matches.filter(
        ({ kind }) => kind === "elimination",
      );
      const geometry = portraitBracketGeometry("story");
      const positions = portraitMatchPositions(bracket, elimination, geometry);
      const segments = portraitConnectorSegments(
        bracket,
        elimination,
        positions,
      );
      const keys = segments.map(({ x1, x2, y1, y2 }) =>
        [x1, y1, x2, y2].join(":"),
      );

      expect(new Set(keys).size).toBe(keys.length);
      for (const target of elimination.filter(({ round }) => round > 1)) {
        const targetSegments = segments.filter(
          ({ targetId }) => targetId === target.id,
        );
        const expectedSources = matchSources(bracket, target)
          .filter((source) => source.type !== "player")
          .map((source) => source.matchId)
          .sort();
        expect(targetSegments.length).toBeGreaterThan(0);
        expect(new Set(targetSegments.map(({ targetId }) => targetId))).toEqual(
          new Set([target.id]),
        );
        expect(
          new Set(targetSegments.flatMap(({ sourceIds }) => sourceIds)),
        ).toEqual(new Set(expectedSources));
      }
    },
  );

  it("moves each 16-player branch inward with deliberate opening gaps", () => {
    const bracket = createTournamentBracket(players(16), config);
    const elimination = bracket.matches.filter(
      ({ kind }) => kind === "elimination",
    );
    const geometry = portraitBracketGeometry("story");
    const positions = portraitMatchPositions(bracket, elimination, geometry);
    const leftXs: number[] = [];
    const rightXs: number[] = [];

    for (let round = 1; round < bracket.roundCount; round += 1) {
      const matches = elimination
        .filter((match) => match.round === round)
        .sort((left, right) => left.ordinal - right.ordinal);
      const perSide = matches.length / 2;
      leftXs.push(positions.get(matches[0].id)!.x);
      rightXs.push(positions.get(matches[perSide].id)!.x);
    }

    for (let index = 1; index < leftXs.length; index += 1) {
      expect(leftXs[index]).toBeGreaterThan(leftXs[index - 1]);
      expect(rightXs[index]).toBeLessThan(rightXs[index - 1]);
    }
    const opening = elimination
      .filter(({ round }) => round === 1)
      .sort((left, right) => left.ordinal - right.ordinal)
      .slice(0, 4)
      .map(({ id }) => positions.get(id)!);
    for (let index = 1; index < opening.length; index += 1) {
      expect(opening[index].y - opening[index - 1].y).toBeGreaterThanOrEqual(
        geometry.cardHeight + geometry.rowGap,
      );
    }
  });

  it("keeps adjacent opening-pair connector rails independent", () => {
    const bracket = createTournamentBracket(players(16), config);
    const elimination = bracket.matches.filter(
      ({ kind }) => kind === "elimination",
    );
    const positions = portraitMatchPositions(
      bracket,
      elimination,
      portraitBracketGeometry("story"),
    );
    const roundTwoIds = new Set(
      elimination.filter(({ round }) => round === 2).map(({ id }) => id),
    );
    const vertical = portraitConnectorSegments(
      bracket,
      elimination,
      positions,
    ).filter(({ targetId, x1, x2 }) => roundTwoIds.has(targetId) && x1 === x2);

    for (let left = 0; left < vertical.length; left += 1) {
      for (let right = left + 1; right < vertical.length; right += 1) {
        const a = vertical[left];
        const b = vertical[right];
        if (a.targetId === b.targetId || a.x1 !== b.x1) continue;
        const overlap =
          Math.min(Math.max(a.y1, a.y2), Math.max(b.y1, b.y2)) -
          Math.max(Math.min(a.y1, a.y2), Math.min(b.y1, b.y2));
        expect(overlap).toBeLessThanOrEqual(0);
      }
    }
  });
});
