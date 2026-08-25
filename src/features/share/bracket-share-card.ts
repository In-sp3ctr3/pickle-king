import type { Match, TournamentBracket } from "../../tournament";
import {
  drawBracketBrandFooter,
  drawBracketPodium,
  drawChallengeSummary,
} from "./bracket-share-extras";
import {
  eliminationSharePositions,
  matchDependencySources,
  type ShareMatchPosition,
} from "./bracket-share-layout";
import { drawBracketMatch } from "./bracket-share-match";
import {
  shareCanvasSurface,
  shareColors,
  shareFittedText,
  shareText,
} from "./share-canvas";
import type { BracketShareFormat } from "./share-format";
import { portraitBracketShareCanvas } from "./bracket-share-portrait";

export async function bracketShareCanvas(
  bracket: TournamentBracket,
  format: BracketShareFormat = "landscape",
): Promise<HTMLCanvasElement> {
  if (format !== "landscape") {
    return portraitBracketShareCanvas(bracket, format);
  }
  const { element, context, lockup } = await shareCanvasSurface(1600, 1200);
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

  drawPaper(context, 1600, 1200);
  drawHeader(context, bracket, champion ?? null, final, names);

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
  drawBracketBrandFooter(context, lockup, 1600, 1200);
  return element;
}

function drawHeader(
  context: CanvasRenderingContext2D,
  bracket: TournamentBracket,
  champion: string | null,
  final: Match | undefined,
  names: Map<string, string>,
) {
  shareText(context, `${bracket.players.length} PLAYER TOURNAMENT`, 64, 68, {
    color: "#090b08",
    font: "900 18px Manrope, sans-serif",
  });
  shareText(context, "FULL DRAW", 1536, 68, {
    align: "right",
    color: "#090b08",
    font: "800 18px Manrope, sans-serif",
  });
  if (champion) {
    shareFittedText(context, champion.toUpperCase(), 800, 220, {
      align: "center",
      color: "#090b08",
      maxSize: 74,
      minSize: 38,
      maxWidth: 760,
    });
    shareText(context, "TOURNAMENT CHAMPION", 800, 268, {
      align: "center",
      color: "#090b08",
      font: "900 17px Manrope, sans-serif",
    });
  } else {
    shareText(context, "TOURNAMENT DRAW", 800, 214, {
      align: "center",
      color: "#090b08",
      font: "900 54px 'Archivo Black', sans-serif",
    });
    shareText(
      context,
      `${bracket.matches.filter(({ status }) => status === "complete").length} OF ${bracket.matches.length} MATCHES COMPLETE`,
      800,
      266,
      {
        align: "center",
        color: "#090b08",
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
        color: "#090b08",
        font: "900 18px Manrope, sans-serif",
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
    for (const source of matchDependencySources(bracket, target)) {
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
        sourceMatch.status === "complete" ? shareColors.lime : "#090b08";
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

function drawPaper(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.fillStyle = "#f5f1e8";
  context.fillRect(0, 0, width, height);
  const wash = context.createRadialGradient(
    width / 2,
    height * 0.35,
    width * 0.08,
    width / 2,
    height * 0.35,
    height * 0.8,
  );
  wash.addColorStop(0, "rgba(255,255,255,0.3)");
  wash.addColorStop(1, "rgba(172,157,132,0.08)");
  context.fillStyle = wash;
  context.fillRect(0, 0, width, height);
}
