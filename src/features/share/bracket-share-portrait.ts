import type { Match, TournamentBracket } from "../../tournament";
import { drawBracketMatch } from "./bracket-share-match";
import {
  drawBrandMark,
  drawShareFooter,
  drawTrophy,
  shareCanvasSurface,
  shareColors,
  shareFittedText,
  shareText,
} from "./share-canvas";
import {
  drawPortraitConnectors,
  portraitBracketGeometry,
  portraitMatchPositions,
  portraitRoundBands,
  type PortraitGeometry,
} from "./bracket-share-portrait-layout";
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
  const geometry = portraitBracketGeometry(format);
  const positions = portraitMatchPositions(bracket, elimination, geometry);

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

export { portraitBracketGeometry, portraitRoundBands };

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
