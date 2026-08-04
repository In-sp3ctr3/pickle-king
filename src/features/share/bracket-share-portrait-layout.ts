import type { Match, TournamentBracket } from "../../tournament";
import { matchSources, type ShareMatchPosition } from "./bracket-share-layout";
import { shareColors } from "./share-canvas";
import type { ShareFormat } from "./share-format";

export interface PortraitGeometry {
  bronze: ShareMatchPosition;
  cardHeight: number;
  cardWidth: number;
  final: ShareMatchPosition;
  podiumY: number;
  roundStartY: number;
  rowGap: number;
  safeBottom: number;
  safeLeft: number;
  safeRight: number;
}

export interface PortraitRoundBand {
  height: number;
  rows: number;
  top: number;
}

export interface PortraitConnectorSegment {
  complete: boolean;
  sourceIds: string[];
  targetId: string;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export function portraitBracketGeometry(format: ShareFormat): PortraitGeometry {
  const story = format === "story";
  const cardHeight = story ? 76 : 62;
  const final = {
    x: 260,
    y: story ? 1230 : 850,
    width: 560,
    height: story ? 92 : 76,
  };
  const bronze = {
    x: 320,
    y: final.y + final.height + (story ? 40 : 28),
    width: 440,
    height: cardHeight,
  };
  return {
    bronze,
    cardHeight,
    cardWidth: 360,
    final,
    podiumY: story ? 1550 : 1160,
    roundStartY: story ? 350 : 280,
    rowGap: story ? 22 : 12,
    safeBottom: story ? 1640 : 1296,
    safeLeft: story ? 72 : 54,
    safeRight: story ? 1008 : 1026,
  };
}

export function portraitRoundBands(
  geometry: PortraitGeometry,
  roundCount: number,
): PortraitRoundBand[] {
  const branchRounds = Math.max(1, roundCount - 1);
  const heights = Array.from({ length: branchRounds }, (_, index) => {
    const round = index + 1;
    const rows = Math.max(1, 2 ** (roundCount - round - 1));
    return {
      height:
        rows * geometry.cardHeight + Math.max(0, rows - 1) * geometry.rowGap,
      rows,
    };
  });
  const contentHeight = heights.reduce((sum, band) => sum + band.height, 0);
  const freeHeight = geometry.final.y - geometry.roundStartY - contentHeight;
  const stageGap = Math.max(18, freeHeight / branchRounds);
  let cursor = geometry.roundStartY;
  return heights.map((band) => {
    const positioned = { ...band, top: cursor };
    cursor += band.height + stageGap;
    return positioned;
  });
}

export function portraitMatchPositions(
  bracket: TournamentBracket,
  matches: Match[],
  geometry: PortraitGeometry,
) {
  const positions = new Map<string, ShareMatchPosition>();
  const branchRounds = Math.max(1, bracket.roundCount - 1);
  const columnCount = branchRounds * 2;
  const availableWidth = geometry.safeRight - geometry.safeLeft;
  const cardWidth = Math.min(
    geometry.cardWidth,
    Math.floor((availableWidth - (columnCount - 1) * 14) / columnCount),
  );
  const columnGap =
    columnCount === 1
      ? 0
      : (availableWidth - columnCount * cardWidth) / (columnCount - 1);
  const columnX = (round: number, right: boolean) =>
    right
      ? geometry.safeRight - cardWidth - (round - 1) * (cardWidth + columnGap)
      : geometry.safeLeft + (round - 1) * (cardWidth + columnGap);
  const opening = matches
    .filter(({ round }) => round === 1)
    .sort((left, right) => left.ordinal - right.ordinal);
  const openingPerSide = Math.max(1, Math.ceil(opening.length / 2));
  const lastOpeningTop = geometry.final.y - geometry.cardHeight * 2.5;
  const openingTop = (row: number) =>
    openingPerSide === 1
      ? geometry.roundStartY + (lastOpeningTop - geometry.roundStartY) * 0.55
      : geometry.roundStartY +
        (row * (lastOpeningTop - geometry.roundStartY)) / (openingPerSide - 1);
  opening.forEach((match, index) => {
    const right = index >= openingPerSide;
    positions.set(match.id, {
      x: columnX(1, right),
      y: openingTop(index % openingPerSide),
      width: cardWidth,
      height: geometry.cardHeight,
    });
  });

  for (let round = 2; round < bracket.roundCount; round += 1) {
    for (const match of matches.filter(
      (candidate) => candidate.round === round,
    )) {
      const sources = matchSources(bracket, match)
        .filter((source) => source.type !== "player")
        .map((source) => positions.get(source.matchId))
        .filter((source): source is ShareMatchPosition => Boolean(source));
      if (sources.length === 0) continue;
      const centerX =
        sources.reduce((sum, source) => sum + source.x + source.width / 2, 0) /
        sources.length;
      const centerY =
        sources.reduce((sum, source) => sum + source.y + source.height / 2, 0) /
        sources.length;
      const right = centerX > (geometry.safeLeft + geometry.safeRight) / 2;
      positions.set(match.id, {
        x: columnX(round, right),
        y: centerY - geometry.cardHeight / 2,
        width: cardWidth,
        height: geometry.cardHeight,
      });
    }
  }
  positions.set(bracket.finalMatchId, geometry.final);
  return positions;
}

export function drawPortraitConnectors(
  context: CanvasRenderingContext2D,
  bracket: TournamentBracket,
  matches: Match[],
  positions: Map<string, ShareMatchPosition>,
) {
  const segments = portraitConnectorSegments(bracket, matches, positions);
  const targetIds = [...new Set(segments.map(({ targetId }) => targetId))];
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 3;
  for (const targetId of targetIds) {
    const targetSegments = segments.filter(
      (segment) => segment.targetId === targetId,
    );
    context.strokeStyle = targetSegments.every(({ complete }) => complete)
      ? shareColors.limeDeep
      : "#516048";
    context.beginPath();
    for (const { x1, x2, y1, y2 } of targetSegments) {
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
    }
    context.stroke();
  }
}

export function portraitConnectorSegments(
  bracket: TournamentBracket,
  matches: Match[],
  positions: Map<string, ShareMatchPosition>,
) {
  const lookup = new Map(matches.map((match) => [match.id, match]));
  const segments: PortraitConnectorSegment[] = [];
  const keys = new Set<string>();
  for (const target of matches) {
    const end = positions.get(target.id);
    if (!end) continue;
    const sources = matchSources(bracket, target)
      .filter((source) => source.type !== "player")
      .map((source) => ({
        complete: lookup.get(source.matchId)?.status === "complete",
        id: source.matchId,
        position: positions.get(source.matchId),
      }))
      .filter(
        (
          source,
        ): source is {
          complete: boolean;
          id: string;
          position: ShareMatchPosition;
        } => Boolean(source.position),
      );
    if (sources.length === 0) continue;
    const sourceIds = sources.map(({ id }) => id).sort();
    const add = (x1: number, y1: number, x2: number, y2: number) => {
      if (x1 === x2 && y1 === y2) return;
      const key = connectorKey(x1, y1, x2, y2);
      if (keys.has(key)) return;
      keys.add(key);
      segments.push({
        complete: sources.every(({ complete }) => complete),
        sourceIds,
        targetId: target.id,
        x1,
        x2,
        y1,
        y2,
      });
    };
    connectDependencyGroup(
      sources.map(({ position }) => position),
      end,
      target.id === bracket.finalMatchId,
      add,
    );
  }
  return segments;
}

function connectDependencyGroup(
  sources: ShareMatchPosition[],
  target: ShareMatchPosition,
  final: boolean,
  add: (x1: number, y1: number, x2: number, y2: number) => void,
) {
  const targetX = target.x + target.width / 2;
  if (final) {
    const maxBottom = Math.max(...sources.map(({ height, y }) => y + height));
    const railY = Math.max(maxBottom + 24, target.y - 48);
    for (const source of sources) {
      const sourceX = source.x + source.width / 2;
      add(sourceX, source.y + source.height, sourceX, railY);
    }
    const centers = sources.map(({ width, x }) => x + width / 2);
    add(Math.min(...centers), railY, Math.max(...centers), railY);
    add(targetX, railY, targetX, target.y);
    return;
  }
  const sourceCenterX =
    sources.reduce((sum, source) => sum + source.x + source.width / 2, 0) /
    sources.length;
  const leftBranch = sourceCenterX < targetX;
  const sourceEdge = leftBranch
    ? Math.max(...sources.map(({ x, width }) => x + width))
    : Math.min(...sources.map(({ x }) => x));
  const targetEdge = leftBranch ? target.x : target.x + target.width;
  const railX = (sourceEdge + targetEdge) / 2;
  const anchors = sources.map((source) => ({
    x: leftBranch ? source.x + source.width : source.x,
    y: source.y + source.height / 2,
  }));
  const top = Math.min(...anchors.map(({ y }) => y));
  const bottom = Math.max(...anchors.map(({ y }) => y));
  for (const anchor of anchors) add(anchor.x, anchor.y, railX, anchor.y);
  add(railX, top, railX, bottom);
  add(railX, (top + bottom) / 2, targetEdge, target.y + target.height / 2);
}

function connectorKey(x1: number, y1: number, x2: number, y2: number) {
  return x1 < x2 || (x1 === x2 && y1 <= y2)
    ? `${x1}:${y1}:${x2}:${y2}`
    : `${x2}:${y2}:${x1}:${y1}`;
}
