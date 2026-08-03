import type { Match, TournamentBracket } from "../../tournament";
import {
  drawBracketPodium,
  drawChallengeSummary,
} from "./bracket-share-extras";
import {
  eliminationSharePositions,
  matchSources,
  type ShareMatchPosition,
} from "./bracket-share-layout";
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
import { drawEdgeFragments, drawExportBackdrop } from "./share-scene";
import type { BracketShareFormat } from "./share-format";
import { portraitBracketShareCanvas } from "./bracket-share-portrait";

export async function bracketShareCanvas(
  bracket: TournamentBracket,
  format: BracketShareFormat = "landscape",
): Promise<HTMLCanvasElement> {
  if (format !== "landscape") {
    return portraitBracketShareCanvas(bracket, format);
  }
  const { arena, element, context, mark } = await shareCanvasSurface(
    1600,
    1200,
  );
  const names = new Map(bracket.players.map(({ id, name }) => [id, name]));
  const matchLookup = new Map(
    bracket.matches.map((match) => [match.id, match]),
  );
  const elimination = bracket.matches.filter(
    ({ kind }) => kind === "elimination",
  );
  const final = matchLookup.get(bracket.finalMatchId);
  const bronze = matchLookup.get(bracket.bronzeMatchId);
  const champion = final?.winnerId ? names.get(final.winnerId) : null;

  drawExportBackdrop(context, 1600, 1200, arena, 310);
  if (champion) drawEdgeFragments(context, 1600, 280, 29);
  drawHeader(context, mark, bracket, champion ?? null, final, names);

  const positions = eliminationSharePositions(bracket, elimination);
  drawConnectors(context, bracket, elimination, positions);
  for (const match of elimination) {
    const position = positions.get(match.id);
    if (position) {
      drawBracketMatch(
        context,
        match,
        position,
        names,
        matchLookup,
        match.id === bracket.finalMatchId,
      );
    }
  }

  if (bronze) {
    drawBracketMatch(
      context,
      bronze,
      { x: 650, y: 800, width: 300, height: 96 },
      names,
      matchLookup,
      false,
    );
  }
  drawChallengeSummary(context, bracket);
  drawBracketPodium(context, final, bronze, names);
  drawShareFooter(context, 1600, 1165);
  return element;
}

function drawHeader(
  context: CanvasRenderingContext2D,
  mark: HTMLImageElement,
  bracket: TournamentBracket,
  champion: string | null,
  final: Match | undefined,
  names: Map<string, string>,
) {
  shareText(context, "PICKLE KING", 50, 62, {
    color: shareColors.lime,
    font: "900 23px 'Archivo Black', sans-serif",
  });
  shareText(context, `${bracket.players.length} PLAYER TOURNAMENT`, 1550, 62, {
    align: "right",
    color: shareColors.mist,
    font: "800 18px Manrope, sans-serif",
  });
  drawBrandMark(context, mark, 800, 2, 150);
  shareText(
    context,
    champion ? "TOURNAMENT CHAMPION" : "ROAD TO THE CROWN",
    800,
    158,
    {
      align: "center",
      color: champion ? shareColors.gold : shareColors.lime,
      font: "900 18px Manrope, sans-serif",
    },
  );
  if (champion) {
    shareFittedText(context, champion.toUpperCase(), 800, 220, {
      align: "center",
      color: shareColors.chalk,
      maxSize: 54,
      minSize: 32,
      maxWidth: 520,
    });
    drawTrophy(context, 800, 273, 52);
  } else {
    shareText(
      context,
      `${bracket.matches.filter(({ status }) => status === "complete").length} MATCHES COMPLETE`,
      800,
      214,
      {
        align: "center",
        color: shareColors.mist,
        font: "800 17px Manrope, sans-serif",
      },
    );
  }
  if (final?.status === "complete") {
    const sideA = final.sideA?.memberIds[0];
    const sideB = final.sideB?.memberIds[0];
    shareText(
      context,
      `${names.get(sideA ?? "") ?? "Finalist"} ${final.scoreA}–${final.scoreB} ${names.get(sideB ?? "") ?? "Finalist"}`,
      800,
      322,
      {
        align: "center",
        color: shareColors.mist,
        font: "800 17px Manrope, sans-serif",
      },
    );
  }
}

function drawConnectors(
  context: CanvasRenderingContext2D,
  bracket: TournamentBracket,
  matches: Match[],
  positions: Map<string, ShareMatchPosition>,
) {
  for (const target of matches) {
    const targetPosition = positions.get(target.id);
    if (!targetPosition) continue;
    for (const source of matchSources(bracket, target)) {
      if (source.type === "player") continue;
      const startPosition = positions.get(source.matchId);
      const sourceMatch = matches.find(({ id }) => id === source.matchId);
      if (!startPosition || !sourceMatch) continue;
      const fromLeft = startPosition.x < 800;
      const x1 = fromLeft
        ? startPosition.x + startPosition.width
        : startPosition.x;
      const x2 = fromLeft
        ? targetPosition.x
        : targetPosition.x + targetPosition.width;
      const y1 = startPosition.y + startPosition.height / 2;
      const y2 = targetPosition.y + targetPosition.height / 2;
      context.strokeStyle =
        sourceMatch.status === "complete" ? shareColors.limeDeep : "#516048";
      context.lineWidth = sourceMatch.status === "complete" ? 4 : 3;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo((x1 + x2) / 2, y1);
      context.lineTo((x1 + x2) / 2, y2);
      context.lineTo(x2, y2);
      context.stroke();
    }
  }
}
