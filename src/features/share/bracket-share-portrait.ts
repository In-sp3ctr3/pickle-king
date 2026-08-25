import type { Match, TournamentBracket } from "../../tournament";
import { drawBracketBrandFooter } from "./bracket-share-extras";
import { drawBracketMatch } from "./bracket-share-match";
import {
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

const INK = "#090b08";

export async function portraitBracketShareCanvas(
  bracket: TournamentBracket,
  format: ShareFormat,
) {
  const { width, height } = bracketShareDimensions(format);
  const { context, element, lockup } = await shareCanvasSurface(width, height);
  const names = new Map(bracket.players.map(({ id, name }) => [id, name]));
  const lookup = new Map(bracket.matches.map((match) => [match.id, match]));
  const elimination = bracket.matches.filter(
    ({ kind }) => kind === "elimination",
  );
  const final = lookup.get(bracket.finalMatchId);
  const bronze = lookup.get(bracket.bronzeMatchId);
  const geometry = portraitBracketGeometry(format);
  const positions = portraitMatchPositions(bracket, elimination, geometry);

  drawPaper(context, width, height);
  drawPortraitHeader(context, bracket, final, names, height);
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
  if (bronze) {
    drawBracketMatch(context, bronze, geometry.bronze, names, lookup, false);
  }
  drawPortraitPodium(context, final, bronze, names, geometry);
  drawBracketBrandFooter(context, lockup, width, height);
  return element;
}

export { portraitBracketGeometry, portraitRoundBands };

function drawPaper(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.fillStyle = "#f5f1e8";
  context.fillRect(0, 0, width, height);
  const wash = context.createRadialGradient(
    width / 2,
    height * 0.32,
    width * 0.06,
    width / 2,
    height * 0.32,
    height * 0.76,
  );
  wash.addColorStop(0, "rgba(255,255,255,0.3)");
  wash.addColorStop(1, "rgba(172,157,132,0.08)");
  context.fillStyle = wash;
  context.fillRect(0, 0, width, height);
}

function drawPortraitHeader(
  context: CanvasRenderingContext2D,
  bracket: TournamentBracket,
  final: Match | undefined,
  names: Map<string, string>,
  height: number,
) {
  shareText(context, `${bracket.players.length} PLAYER TOURNAMENT`, 54, 68, {
    color: INK,
    font: "900 17px Manrope, sans-serif",
  });
  shareText(context, "FULL DRAW", 1026, 68, {
    align: "right",
    color: INK,
    font: "900 17px Manrope, sans-serif",
  });
  const champion = final?.winnerId ? names.get(final.winnerId) : null;
  shareFittedText(
    context,
    (champion ?? "TOURNAMENT DRAW").toUpperCase(),
    540,
    height === 1350 ? 190 : 220,
    {
      align: "center",
      color: INK,
      maxSize: 58,
      minSize: 30,
      maxWidth: 860,
    },
  );
  shareText(
    context,
    champion
      ? "TOURNAMENT CHAMPION"
      : `${bracket.matches.filter(({ status }) => status === "complete").length} OF ${bracket.matches.length} MATCHES COMPLETE`,
    540,
    height === 1350 ? 232 : 264,
    {
      align: "center",
      color: champion ? shareColors.limeDeep : INK,
      font: "900 15px Manrope, sans-serif",
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
    { id: final.winnerId, label: "CHAMPION", place: "1", x: 180 },
    { id: final.loserId, label: "RUNNER-UP", place: "2", x: 480 },
    { id: bronze?.winnerId, label: "THIRD", place: "3", x: 780 },
  ];
  places.forEach(({ id, label, place, x }) => {
    if (!id) return;
    shareText(context, place, x, geometry.podiumY + 36, {
      color: place === "1" ? shareColors.limeDeep : INK,
      font: "900 52px 'Archivo Black', sans-serif",
    });
    shareText(context, label, x + 58, geometry.podiumY + 5, {
      color: INK,
      font: "900 12px Manrope, sans-serif",
    });
    shareFittedText(
      context,
      (names.get(id) ?? "Player").toUpperCase(),
      x + 58,
      geometry.podiumY + 36,
      {
        color: INK,
        family: "Manrope, sans-serif",
        weight: 900,
        maxSize: 18,
        minSize: 12,
        maxWidth: 210,
      },
    );
  });
}
