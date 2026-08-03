import type { Match, TournamentBracket } from "../../tournament";
import {
  drawBracketPodium,
  drawChallengeSummary,
} from "./bracket-share-extras";
import {
  eliminationSharePositions,
  matchSources,
  resolvedSide,
  sourceFallback,
  type ShareMatchPosition,
} from "./bracket-share-layout";
import {
  drawBrandMark,
  drawShareFooter,
  drawTrophy,
  fitCanvasText,
  shareCanvasSurface,
  shareColors,
  shareFittedText,
  shareText,
} from "./share-canvas";
import { drawEdgeFragments, drawExportBackdrop } from "./share-scene";

export async function bracketShareCanvas(
  bracket: TournamentBracket,
): Promise<HTMLCanvasElement> {
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
      drawMatch(
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
    drawMatch(
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

function drawMatch(
  context: CanvasRenderingContext2D,
  match: Match,
  position: ShareMatchPosition,
  names: Map<string, string>,
  matches: Map<string, Match>,
  isFinal: boolean,
) {
  const panel = context.createLinearGradient(
    0,
    position.y,
    0,
    position.y + position.height,
  );
  panel.addColorStop(
    0,
    isFinal ? "rgba(64, 51, 12, 0.98)" : "rgba(28, 36, 25, 0.98)",
  );
  panel.addColorStop(1, "rgba(9, 12, 8, 0.98)");
  context.fillStyle = panel;
  context.fillRect(position.x, position.y, position.width, position.height);
  if (isFinal) {
    context.strokeStyle = shareColors.gold;
    context.lineWidth = 4;
    context.strokeRect(position.x, position.y, position.width, position.height);
  }
  context.fillStyle = isFinal
    ? shareColors.gold
    : match.status === "complete"
      ? shareColors.limeDeep
      : shareColors.line;
  context.fillRect(position.x, position.y, 5, position.height);
  shareText(
    context,
    matchLabel(match, isFinal),
    position.x + 14,
    position.y + 18,
    {
      color: shareColors.mist,
      font: "900 11px Manrope, sans-serif",
    },
  );
  drawMatchRow(context, match, "A", position, names, matches, 43);
  drawMatchRow(context, match, "B", position, names, matches, 76);
}

function drawMatchRow(
  context: CanvasRenderingContext2D,
  match: Match,
  side: "A" | "B",
  position: ShareMatchPosition,
  names: Map<string, string>,
  matches: Map<string, Match>,
  offsetY: number,
) {
  const sideData = resolvedSide(match, side, matches);
  const playerId = sideData?.memberIds[0];
  const rawName = playerId
    ? (names.get(playerId) ?? "Player")
    : sourceFallback(match, side, matches);
  const winner = match.status === "complete" && playerId === match.winnerId;
  const loser = match.status === "complete" && playerId === match.loserId;
  const score = side === "A" ? match.scoreA : match.scoreB;
  const scoreWidth = match.status === "complete" ? 36 : 8;
  const fontSize = position.width <= 190 ? 15 : 17;
  context.font = `800 ${fontSize}px Manrope, sans-serif`;
  const label = fitCanvasText(
    context,
    rawName,
    position.width - 32 - scoreWidth,
  );
  const x = position.x + 14;
  const y = position.y + offsetY;
  shareText(context, label, x, y, {
    color: winner ? shareColors.lime : loser ? "#747c6d" : shareColors.chalk,
    font: `800 ${fontSize}px Manrope, sans-serif`,
  });
  if (match.status === "complete") {
    shareText(context, String(score), position.x + position.width - 12, y, {
      align: "right",
      color: winner ? shareColors.lime : "#747c6d",
      font: "900 17px Manrope, sans-serif",
    });
  }
  if (loser) {
    context.strokeStyle = "#747c6d";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, y - fontSize * 0.35);
    context.lineTo(x + context.measureText(label).width, y - fontSize * 0.35);
    context.stroke();
  }
}

function matchLabel(match: Match, isFinal: boolean) {
  if (isFinal) return "FINAL";
  if (match.kind === "bronze") return "THIRD PLACE";
  return match.round > 1
    ? `ROUND ${match.round} · MATCH ${match.ordinal}`
    : `OPENING · MATCH ${match.ordinal}`;
}
