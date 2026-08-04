import { describe, expect, it } from "vitest";
import {
  createTournamentBracket,
  type Player,
  type TournamentConfig,
} from "../../tournament";
import { matchSources } from "./bracket-share-layout";
import type { ShareMatchPosition } from "./bracket-share-layout";
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
        const position = positions.get(target.id)!;
        const firstSource = positions.get(expectedSources[0])!;
        const anchor =
          target.id === bracket.finalMatchId
            ? [position.x + position.width / 2, position.y]
            : [
                firstSource.x < position.x
                  ? position.x
                  : position.x + position.width,
                centerY(position),
              ];
        expect(targetSegments.some((segment) => touches(segment, anchor))).toBe(
          true,
        );
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

  it.each([4, 8, 16])(
    "places every %s-player target between its sibling sources",
    (count) => {
      const bracket = createTournamentBracket(players(count), config);
      const elimination = bracket.matches.filter(
        ({ kind }) => kind === "elimination",
      );
      const positions = portraitMatchPositions(
        bracket,
        elimination,
        portraitBracketGeometry("story"),
      );

      for (const target of elimination.filter(
        ({ id, round }) => id !== bracket.finalMatchId && round > 1,
      )) {
        const targetPosition = positions.get(target.id)!;
        const sources = matchSources(bracket, target)
          .filter((source) => source.type !== "player")
          .map((source) => positions.get(source.matchId)!);
        const expectedCenterY =
          sources.reduce((sum, source) => sum + centerY(source), 0) /
          sources.length;

        expect(centerY(targetPosition)).toBeCloseTo(expectedCenterY);
        if (sources[0].x < 540) {
          expect(targetPosition.x).toBeGreaterThan(
            Math.max(...sources.map((source) => source.x + source.width)),
          );
        } else {
          expect(targetPosition.x + targetPosition.width).toBeLessThan(
            Math.min(...sources.map((source) => source.x)),
          );
        }
      }
    },
  );

  it.each([4, 8, 16])(
    "keeps %s-player connector groups disjoint and outside unrelated cards",
    (count) => {
      const bracket = createTournamentBracket(players(count), config);
      const elimination = bracket.matches.filter(
        ({ kind }) => kind === "elimination",
      );
      const positions = portraitMatchPositions(
        bracket,
        elimination,
        portraitBracketGeometry("story"),
      );
      const geometry = portraitBracketGeometry("story");
      const segments = portraitConnectorSegments(
        bracket,
        elimination,
        positions,
      );

      for (let left = 0; left < segments.length; left += 1) {
        expect(
          Math.min(segments[left].x1, segments[left].x2),
        ).toBeGreaterThanOrEqual(geometry.safeLeft);
        expect(
          Math.max(segments[left].x1, segments[left].x2),
        ).toBeLessThanOrEqual(geometry.safeRight);
        expect(
          Math.min(segments[left].y1, segments[left].y2),
        ).toBeGreaterThanOrEqual(geometry.roundStartY);
        expect(
          Math.max(segments[left].y1, segments[left].y2),
        ).toBeLessThanOrEqual(geometry.final.y);
        for (let right = left + 1; right < segments.length; right += 1) {
          if (segments[left].targetId === segments[right].targetId) continue;
          expect(segmentsIntersect(segments[left], segments[right])).toBe(
            false,
          );
        }
        for (const [matchId, card] of positions) {
          if (
            matchId === segments[left].targetId ||
            segments[left].sourceIds.includes(matchId)
          ) {
            continue;
          }
          expect(segmentEntersCard(segments[left], card)).toBe(false);
        }
      }
    },
  );
});

type Segment = ReturnType<typeof portraitConnectorSegments>[number];

function centerY(position: ShareMatchPosition) {
  return position.y + position.height / 2;
}

function touches(segment: Segment, [x, y]: number[]) {
  return (
    (segment.x1 === x && segment.y1 === y) ||
    (segment.x2 === x && segment.y2 === y)
  );
}

function segmentsIntersect(left: Segment, right: Segment) {
  const leftHorizontal = left.y1 === left.y2;
  const rightHorizontal = right.y1 === right.y2;
  if (leftHorizontal === rightHorizontal) {
    if (leftHorizontal && left.y1 !== right.y1) return false;
    if (!leftHorizontal && left.x1 !== right.x1) return false;
    const [leftStart, leftEnd] = sortedRange(
      leftHorizontal ? left.x1 : left.y1,
      leftHorizontal ? left.x2 : left.y2,
    );
    const [rightStart, rightEnd] = sortedRange(
      rightHorizontal ? right.x1 : right.y1,
      rightHorizontal ? right.x2 : right.y2,
    );
    return Math.max(leftStart, rightStart) <= Math.min(leftEnd, rightEnd);
  }
  const horizontal = leftHorizontal ? left : right;
  const vertical = leftHorizontal ? right : left;
  const [minX, maxX] = sortedRange(horizontal.x1, horizontal.x2);
  const [minY, maxY] = sortedRange(vertical.y1, vertical.y2);
  return (
    vertical.x1 >= minX &&
    vertical.x1 <= maxX &&
    horizontal.y1 >= minY &&
    horizontal.y1 <= maxY
  );
}

function segmentEntersCard(segment: Segment, card: ShareMatchPosition) {
  const epsilon = 0.01;
  if (segment.y1 === segment.y2) {
    const [minX, maxX] = sortedRange(segment.x1, segment.x2);
    return (
      segment.y1 > card.y + epsilon &&
      segment.y1 < card.y + card.height - epsilon &&
      maxX > card.x + epsilon &&
      minX < card.x + card.width - epsilon
    );
  }
  const [minY, maxY] = sortedRange(segment.y1, segment.y2);
  return (
    segment.x1 > card.x + epsilon &&
    segment.x1 < card.x + card.width - epsilon &&
    maxY > card.y + epsilon &&
    minY < card.y + card.height - epsilon
  );
}

function sortedRange(first: number, second: number) {
  return first <= second ? [first, second] : [second, first];
}
