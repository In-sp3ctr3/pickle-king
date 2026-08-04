import type { Match, TournamentBracket } from "../../tournament";
import { drawBracketMatch } from "./bracket-share-match";
import { matchSources, type ShareMatchPosition } from "./bracket-share-layout";
import {
  drawBrandMark,
  drawShareFooter,
  drawTrophy,
  shareCanvasSurface,
  shareColors,
  shareFittedText,
  shareText,
} from "./share-canvas";
import { bracketShareDimensions, type ShareFormat } from "./share-format";
import { drawMedalBadge, drawExportBackdrop } from "./share-scene";

export async function portraitBracketShareCanvas(
  bracket: TournamentBracket,
  format: ShareFormat,
) {
  const { width, height } = bracketShareDimensions(format);
  const { arena, context, element, mark } = await shareCanvasSurface(
    width,
    height,
  );
  const names = new Map(bracket.players.map(({ id, name }) => [id, name]));
  const lookup = new Map(bracket.matches.map((match) => [match.id, match]));
  const elimination = bracket.matches.filter(
    ({ kind }) => kind === "elimination",
  );
  const final = lookup.get(bracket.finalMatchId);
  const bronze = lookup.get(bracket.bronzeMatchId);
  const geometry = portraitBracketGeometry(format, bracket.roundCount);
  const positions = portraitPositions(bracket, elimination, geometry);

  drawExportBackdrop(context, width, height, arena, height * 0.42);
  drawPortraitHeader(context, mark, bracket, final, names, height);
  drawPortraitConnectors(context, bracket, elimination, positions);
  for (const match of elimination) {
    const position = positions.get(match.id);
    if (!position) continue;
    drawBracketMatch(
      context,
      match,
      position,
      names,
      lookup,
      match.id === bracket.finalMatchId,
    );
  }
  const finalPosition = positions.get(bracket.finalMatchId);
  if (finalPosition) {
    drawTrophy(
      context,
      finalPosition.x + finalPosition.width / 2,
      finalPosition.y - 20,
      34,
    );
  }
  if (bronze) {
    drawBracketMatch(context, bronze, geometry.bronze, names, lookup, false);
  }
  drawPortraitPodium(context, final, bronze, names, geometry);
  drawShareFooter(context, width, height - 54);
  return element;
}

export interface PortraitGeometry {
  bronze: ShareMatchPosition;
  cardHeight: number;
  cardWidth: number;
  final: ShareMatchPosition;
  podiumY: number;
  roundGap: number;
  roundStartY: number;
  rowGap: number;
  safeBottom: number;
}

export function portraitBracketGeometry(
  format: ShareFormat,
  roundCount = 4,
): PortraitGeometry {
  const story = format === "story";
  const cardHeight = story ? 82 : 68;
  const cardWidth = 440;
  const rowGap = story ? 14 : 8;
  const roundGap = story ? 54 : 28;
  const roundStartY = story ? 360 : 292;
  const branchRounds = Math.max(1, roundCount - 1);
  let cursor = roundStartY;
  for (let round = 1; round <= branchRounds; round += 1) {
    const rows = Math.max(1, 2 ** (roundCount - round - 1));
    cursor += rows * cardHeight + Math.max(0, rows - 1) * rowGap + roundGap;
  }
  const final = {
    x: 260,
    y: cursor,
    width: 560,
    height: story ? 92 : 76,
  };
  const bronze = {
    x: 320,
    y: final.y + final.height + (story ? 38 : 24),
    width: 440,
    height: cardHeight,
  };
  return {
    bronze,
    cardHeight,
    cardWidth,
    final,
    podiumY: story ? 1650 : 1210,
    roundGap,
    roundStartY,
    rowGap,
    safeBottom: story ? 1740 : 1296,
  };
}

function portraitPositions(
  bracket: TournamentBracket,
  matches: Match[],
  geometry: PortraitGeometry,
) {
  const positions = new Map<string, ShareMatchPosition>();
  let cursor = geometry.roundStartY;
  for (let round = 1; round < bracket.roundCount; round += 1) {
    const roundMatches = matches
      .filter((match) => match.round === round)
      .sort((left, right) => left.ordinal - right.ordinal);
    const perSide = Math.max(1, Math.ceil(roundMatches.length / 2));
    roundMatches.forEach((match, index) => {
      const right = index >= perSide;
      const row = index % perSide;
      positions.set(match.id, {
        x: right ? 574 : 66,
        y: cursor + row * (geometry.cardHeight + geometry.rowGap),
        width: geometry.cardWidth,
        height: geometry.cardHeight,
      });
    });
    cursor +=
      perSide * geometry.cardHeight +
      Math.max(0, perSide - 1) * geometry.rowGap +
      geometry.roundGap;
  }
  positions.set(bracket.finalMatchId, geometry.final);
  return positions;
}

function drawPortraitConnectors(
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
      const railY = (y1 + y2) / 2;
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

function drawPortraitHeader(
  context: CanvasRenderingContext2D,
  mark: HTMLImageElement,
  bracket: TournamentBracket,
  final: Match | undefined,
  names: Map<string, string>,
  height: number,
) {
  shareText(context, "PICKLE KING", 54, 62, {
    color: shareColors.lime,
    font: "900 22px 'Archivo Black', sans-serif",
  });
  shareText(context, `${bracket.players.length} PLAYER TOURNAMENT`, 1026, 62, {
    align: "right",
    color: shareColors.mist,
    font: "800 17px Manrope, sans-serif",
  });
  drawBrandMark(context, mark, 540, height === 1350 ? 68 : 92, 104);
  const champion = final?.winnerId ? names.get(final.winnerId) : null;
  shareFittedText(
    context,
    (champion ?? "ROAD TO THE CROWN").toUpperCase(),
    540,
    height === 1350 ? 218 : 258,
    {
      align: "center",
      color: champion ? shareColors.lime : shareColors.chalk,
      maxSize: 50,
      minSize: 28,
      maxWidth: 820,
    },
  );
}

function drawPortraitPodium(
  context: CanvasRenderingContext2D,
  final: Match | undefined,
  bronze: Match | undefined,
  names: Map<string, string>,
  geometry: PortraitGeometry,
) {
  if (!final?.winnerId) return;
  const places = [
    { id: final.loserId, medal: "2" as const, color: "#c9cec5", x: 240 },
    {
      id: final.winnerId,
      medal: "1" as const,
      color: shareColors.gold,
      x: 540,
    },
    { id: bronze?.winnerId, medal: "3" as const, color: "#c6814a", x: 840 },
  ];
  places.forEach(({ color, id, medal, x }) => {
    if (!id) return;
    const lift = medal === "1" ? -18 : 0;
    drawMedalBadge(context, x, geometry.podiumY + lift, medal, color, 54);
    shareFittedText(
      context,
      names.get(id) ?? "Player",
      x,
      geometry.podiumY + 66,
      {
        align: "center",
        color: medal === "1" ? shareColors.lime : shareColors.chalk,
        family: "Manrope, sans-serif",
        weight: 900,
        maxSize: 18,
        minSize: 12,
        maxWidth: 220,
      },
    );
  });
}
