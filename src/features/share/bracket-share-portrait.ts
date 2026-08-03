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
  const surface = await shareCanvasSurface(width, height);
  const { arena, context, element, mark } = surface;
  const names = new Map(bracket.players.map(({ id, name }) => [id, name]));
  const lookup = new Map(bracket.matches.map((match) => [match.id, match]));
  const elimination = bracket.matches.filter(
    ({ kind }) => kind === "elimination",
  );
  const final = lookup.get(bracket.finalMatchId);
  const bronze = lookup.get(bracket.bronzeMatchId);
  const geometry = portraitBracketGeometry(format);
  const positions = portraitPositions(bracket, elimination, geometry);

  drawExportBackdrop(context, width, height, arena, height * 0.42);
  drawPortraitHeader(context, mark, bracket, final, names, height);
  drawPortraitConnectors(context, bracket, elimination, positions, geometry);
  if (final?.winnerId) {
    const position = positions.get(bracket.finalMatchId)!;
    drawTrophy(context, position.x + position.width / 2, position.y - 28, 38);
  }
  for (const match of elimination) {
    const position = positions.get(match.id);
    if (position) {
      drawBracketMatch(
        context,
        match,
        position,
        names,
        lookup,
        match.id === bracket.finalMatchId,
      );
    }
  }
  if (bronze) {
    const finalPosition = positions.get(bracket.finalMatchId)!;
    drawBracketMatch(
      context,
      bronze,
      {
        x: 360,
        y: geometry.bronzeY,
        width: 360,
        height: finalPosition.height,
      },
      names,
      lookup,
      false,
    );
  }
  drawPortraitPodium(context, bracket, final, bronze, names, geometry);
  drawShareFooter(context, width, height - 54);
  return element;
}

interface PortraitGeometry {
  branchGap: number;
  bronzeY: number;
  cardHeight: number;
  finalY: number;
  layerGap: number;
  podiumY: number;
  safeBottom: number;
}

export function portraitBracketGeometry(format: ShareFormat): PortraitGeometry {
  const compact = format === "feed";
  const finalY = compact ? 610 : 850;
  const cardHeight = compact ? 68 : 86;
  return {
    branchGap: compact ? 76 : 110,
    bronzeY: finalY + cardHeight + (compact ? 28 : 44),
    cardHeight,
    finalY,
    layerGap: compact ? 74 : 100,
    podiumY: compact ? 1190 : 1550,
    safeBottom: compact ? 1296 : 1640,
  };
}

function portraitPositions(
  bracket: TournamentBracket,
  matches: Match[],
  geometry: PortraitGeometry,
) {
  const positions = new Map<string, ShareMatchPosition>();
  const { branchGap, cardHeight, finalY, layerGap } = geometry;
  const safeLeft = 66;
  const safeWidth = 948;
  for (const match of matches) {
    if (match.id === bracket.finalMatchId) {
      positions.set(match.id, {
        x: 350,
        y: finalY,
        width: 380,
        height: cardHeight,
      });
      continue;
    }
    const expected = 2 ** (bracket.roundCount - match.round);
    const perBranch = Math.max(1, expected / 2);
    const lower = match.ordinal > perBranch;
    const slot = (match.ordinal - 1) % perBranch;
    const gap = perBranch > 1 ? 16 : 0;
    const width = Math.min(
      360,
      (safeWidth - gap * (perBranch - 1)) / perBranch,
    );
    const rowWidth = perBranch * width + (perBranch - 1) * gap;
    const x = safeLeft + (safeWidth - rowWidth) / 2 + slot * (width + gap);
    const distance = bracket.roundCount - match.round;
    positions.set(match.id, {
      x,
      y: lower
        ? finalY + cardHeight + branchGap + distance * layerGap
        : finalY - branchGap - distance * layerGap - cardHeight,
      width,
      height: cardHeight,
    });
  }
  return positions;
}

function drawPortraitConnectors(
  context: CanvasRenderingContext2D,
  bracket: TournamentBracket,
  matches: Match[],
  positions: Map<string, ShareMatchPosition>,
  geometry: PortraitGeometry,
) {
  const lookup = new Map(matches.map((match) => [match.id, match]));
  for (const target of matches) {
    const end = positions.get(target.id);
    if (!end) continue;
    for (const source of matchSources(bracket, target)) {
      if (source.type === "player") continue;
      const start = positions.get(source.matchId);
      if (!start) continue;
      const above = start.y < end.y;
      const x1 = start.x + start.width / 2;
      const y1 = above ? start.y + start.height : start.y;
      const x2 = end.x + end.width / 2;
      const y2 = above ? end.y : end.y + end.height;
      context.strokeStyle =
        lookup.get(source.matchId)?.status === "complete"
          ? shareColors.limeDeep
          : "#516048";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(x1, y1);
      if (target.id === bracket.finalMatchId && !above) {
        const bronzeBottom = geometry.bronzeY + geometry.cardHeight;
        const railY = (y1 + bronzeBottom) / 2;
        const detourX = end.x + end.width + 34;
        context.lineTo(x1, railY);
        context.lineTo(detourX, railY);
        context.lineTo(detourX, y2 + 12);
        context.lineTo(x2, y2 + 12);
        context.lineTo(x2, y2);
        context.stroke();
        continue;
      }
      context.lineTo(x1, (y1 + y2) / 2);
      context.lineTo(x2, (y1 + y2) / 2);
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
  drawBrandMark(context, mark, 540, height === 1350 ? 70 : 92, 110);
  const champion = final?.winnerId ? names.get(final.winnerId) : null;
  shareFittedText(
    context,
    (champion ?? "ROAD TO THE CROWN").toUpperCase(),
    540,
    height === 1350 ? 220 : 258,
    {
      align: "center",
      color: champion ? shareColors.lime : shareColors.chalk,
      maxSize: 52,
      minSize: 28,
      maxWidth: 820,
    },
  );
}

function drawPortraitPodium(
  context: CanvasRenderingContext2D,
  bracket: TournamentBracket,
  final: Match | undefined,
  bronze: Match | undefined,
  names: Map<string, string>,
  geometry: PortraitGeometry,
) {
  if (!final?.winnerId) return;
  const podium = [final.winnerId, final.loserId, bronze?.winnerId].filter(
    (id): id is string => Boolean(id),
  );
  const y = geometry.podiumY;
  const colors = [shareColors.gold, "#c9cec5", "#c6814a"];
  podium.forEach((id, index) => {
    const x = 250 + index * 290;
    drawMedalBadge(
      context,
      x,
      y,
      String(index + 1) as "1" | "2" | "3",
      colors[index],
      54,
    );
    shareFittedText(context, names.get(id) ?? "Player", x, y + 66, {
      align: "center",
      color: index === 0 ? shareColors.lime : shareColors.chalk,
      family: "Manrope, sans-serif",
      weight: 900,
      maxSize: 18,
      minSize: 12,
      maxWidth: 220,
    });
  });
}
