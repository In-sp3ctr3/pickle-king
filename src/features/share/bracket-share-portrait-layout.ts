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
    rowGap: story ? 14 : 8,
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
  const lookup = new Map(matches.map((match) => [match.id, match]));
  for (const target of matches) {
    const end = positions.get(target.id);
    if (!end) continue;
    for (const source of matchSources(bracket, target)) {
      if (source.type === "player") continue;
      const start = positions.get(source.matchId);
      if (!start) continue;
      const x1 = start.x + start.width / 2;
      const y1 = start.y + start.height;
      const x2 = end.x + end.width / 2;
      const y2 = end.y;
      const railY = y1 + Math.max(14, (y2 - y1) / 2);
      context.strokeStyle =
        lookup.get(source.matchId)?.status === "complete"
          ? shareColors.limeDeep
          : "#516048";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x1, railY);
      context.lineTo(x2, railY);
      context.lineTo(x2, y2);
      context.stroke();
    }
  }
}
