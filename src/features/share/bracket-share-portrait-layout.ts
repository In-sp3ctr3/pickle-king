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
  const bands = portraitRoundBands(geometry, bracket.roundCount);
  const branchRounds = Math.max(1, bracket.roundCount - 1);
  for (let round = 1; round < bracket.roundCount; round += 1) {
    const roundMatches = matches
      .filter((match) => match.round === round)
      .sort((left, right) => left.ordinal - right.ordinal);
    const perSide = Math.max(1, Math.ceil(roundMatches.length / 2));
    const progress = branchRounds === 1 ? 0 : (round - 1) / (branchRounds - 1);
    const leftX = 64 + progress * 100;
    const rightX = 1080 - leftX - geometry.cardWidth;
    roundMatches.forEach((match, index) => {
      const right = index >= perSide;
      const row = index % perSide;
      positions.set(match.id, {
        x: right ? rightX : leftX,
        y: bands[round - 1].top + row * (geometry.cardHeight + geometry.rowGap),
        width: geometry.cardWidth,
        height: geometry.cardHeight,
      });
    });
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
      target.ordinal,
      add,
    );
  }
  return segments;
}

function connectDependencyGroup(
  sources: ShareMatchPosition[],
  target: ShareMatchPosition,
  targetOrdinal: number,
  add: (x1: number, y1: number, x2: number, y2: number) => void,
) {
  const targetX = target.x + target.width / 2;
  const maxBottom = Math.max(...sources.map(({ height, y }) => y + height));
  const railY = Math.min(
    target.y - 18,
    maxBottom + Math.max(18, (target.y - maxBottom) * 0.42),
  );
  const centers = sources.map(({ width, x }) => x + width / 2);
  const spread = Math.max(...centers) - Math.min(...centers);
  if (sources.length > 1 && spread > sources[0].width * 0.75) {
    for (const source of sources) {
      const sourceX = source.x + source.width / 2;
      add(sourceX, source.y + source.height, sourceX, railY);
    }
    add(Math.min(...centers), railY, Math.max(...centers), railY);
  } else if (sources.length > 1) {
    const sourceCenter =
      centers.reduce((sum, x) => sum + x, 0) / centers.length;
    const leftBranch = sourceCenter < targetX;
    const mergeX = leftBranch
      ? Math.max(...sources.map(({ width, x }) => x + width)) + 20
      : Math.min(...sources.map(({ x }) => x)) - 20;
    const anchors = sources.map((source) => ({
      x: leftBranch ? source.x + source.width : source.x,
      y: source.y + source.height / 2,
    }));
    const top = Math.min(...anchors.map(({ y }) => y));
    const bottom = Math.max(...anchors.map(({ y }) => y));
    const joinY = (top + bottom) / 2;
    const targetEdge = leftBranch ? target.x + target.width : target.x;
    const laneOffset = 20 + ((targetOrdinal - 1) % 2) * 40;
    const laneX = targetEdge + (leftBranch ? laneOffset : -laneOffset);
    const targetY = target.y + target.height / 2;
    for (const anchor of anchors) add(anchor.x, anchor.y, mergeX, anchor.y);
    add(mergeX, top, mergeX, bottom);
    add(mergeX, joinY, laneX, joinY);
    add(laneX, joinY, laneX, targetY);
    add(laneX, targetY, targetEdge, targetY);
    return;
  } else {
    const source = sources[0];
    const sourceX = source.x + source.width / 2;
    add(sourceX, source.y + source.height, sourceX, railY);
    add(sourceX, railY, targetX, railY);
  }
  add(targetX, railY, targetX, target.y);
}

function connectorKey(x1: number, y1: number, x2: number, y2: number) {
  return x1 < x2 || (x1 === x2 && y1 <= y2)
    ? `${x1}:${y1}:${x2}:${y2}`
    : `${x2}:${y2}:${x1}:${y1}`;
}
