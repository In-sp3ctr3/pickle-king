import type { Match, TournamentBracket } from "../../tournament";
import {
  drawBrandMark,
  drawShareFooter,
  drawStaticConfetti,
  fitShareText,
  shareCanvasSurface,
  shareColors,
  shareText,
} from "./share-canvas";

interface Position {
  x: number;
  y: number;
}

function drawMatch(
  context: CanvasRenderingContext2D,
  match: Match,
  position: Position,
  names: Map<string, string>,
) {
  const width = 252;
  context.fillStyle = shareColors.surface;
  context.fillRect(position.x, position.y, width, 88);
  const label = (ids: string[] | undefined) =>
    ids?.map((id) => names.get(id) ?? "Player").join(" + ") ?? "TBD";
  for (const [side, y] of [
    [match.sideA, 33],
    [match.sideB, 69],
  ] as const) {
    shareText(
      context,
      fitShareText(label(side?.memberIds), 17),
      position.x + 14,
      position.y + y,
      { font: "800 20px Manrope, sans-serif" },
    );
  }
  if (match.status !== "complete") return;
  for (const [score, y] of [
    [match.scoreA, 33],
    [match.scoreB, 69],
  ] as const) {
    shareText(context, String(score), position.x + width - 14, position.y + y, {
      align: "right",
      color: shareColors.lime,
      font: "900 21px Manrope, sans-serif",
    });
  }
}

function eliminationPositions(bracket: TournamentBracket, matches: Match[]) {
  const positions = new Map<string, Position>();
  for (let round = 1; round <= bracket.roundCount; round += 1) {
    const roundMatches = matches
      .filter((match) => match.round === round)
      .sort((left, right) => left.ordinal - right.ordinal);
    if (round === bracket.roundCount) {
      positions.set(roundMatches[0].id, { x: 674, y: 390 });
      continue;
    }
    const half = Math.ceil(roundMatches.length / 2);
    roundMatches.forEach((match, index) => {
      const right = index >= half;
      const local = right ? index - half : index;
      const count = right ? roundMatches.length - half : half;
      positions.set(match.id, {
        x: right ? 1278 - (round - 1) * 285 : 70 + (round - 1) * 285,
        y: 120 + ((local + 1) * 650) / (count + 1),
      });
    });
  }
  return positions;
}

function drawConnectors(
  context: CanvasRenderingContext2D,
  bracket: TournamentBracket,
  matches: Match[],
  positions: Map<string, Position>,
) {
  context.strokeStyle = shareColors.line;
  context.lineWidth = 4;
  for (const match of matches) {
    const target = positions.get(match.id);
    if (!target) continue;
    const amendment = bracket.amendments.find(
      ({ targetMatchId }) => targetMatchId === match.id,
    );
    const sources = [
      amendment?.targetSlot === "A"
        ? amendment.originalTargetSource
        : match.sourceA,
      amendment?.targetSlot === "B"
        ? amendment.originalTargetSource
        : match.sourceB,
    ];
    for (const source of sources) {
      if (source.type === "player") continue;
      const start = positions.get(source.matchId);
      if (!start) continue;
      const fromRight = start.x > 800;
      const x1 = fromRight ? start.x : start.x + 252;
      const x2 = fromRight ? target.x + 252 : target.x;
      const y1 = start.y + 44;
      const y2 = target.y + 44;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo((x1 + x2) / 2, y1);
      context.lineTo((x1 + x2) / 2, y2);
      context.lineTo(x2, y2);
      context.stroke();
    }
  }
}

export async function bracketShareCanvas(
  bracket: TournamentBracket,
): Promise<HTMLCanvasElement> {
  const { element, context, mark } = await shareCanvasSurface(1600, 1000);
  const names = new Map(bracket.players.map(({ id, name }) => [id, name]));
  const final = bracket.matches.find(({ id }) => id === bracket.finalMatchId);
  const champion = final?.winnerId ? names.get(final.winnerId) : null;
  drawStaticConfetti(
    context,
    { x: 575, y: 20, width: 450, height: 310 },
    29,
    34,
  );
  shareText(
    context,
    champion ? `${fitShareText(champion, 20)} REIGNS` : "ROAD TO THE CROWN",
    70,
    78,
    {
      color: shareColors.lime,
      font: "900 30px 'Archivo Black', sans-serif",
    },
  );
  shareText(
    context,
    `${bracket.amendments.length ? "AMENDED · " : ""}${bracket.players.length} PLAYER TOURNAMENT`,
    1530,
    76,
    {
      align: "right",
      color: shareColors.mist,
      font: "800 20px Manrope, sans-serif",
    },
  );
  drawBrandMark(context, mark, 800, 112, 178);
  const elimination = bracket.matches.filter(
    ({ kind }) => kind === "elimination",
  );
  const positions = eliminationPositions(bracket, elimination);
  drawConnectors(context, bracket, elimination, positions);
  elimination.forEach((match) => {
    const position = positions.get(match.id);
    if (position) drawMatch(context, match, position, names);
  });
  const bronze = bracket.matches.find(({ id }) => id === bracket.bronzeMatchId);
  if (bronze) {
    shareText(context, "THIRD PLACE", 674, 650, {
      color: shareColors.mist,
      font: "800 16px Manrope, sans-serif",
    });
    drawMatch(context, bronze, { x: 674, y: 674 }, names);
  }
  const challenges = bracket.matches.filter(({ kind }) => kind === "challenge");
  if (challenges.length) {
    shareText(context, "LATE ENTRY CHALLENGE", 70, 820, {
      color: shareColors.lime,
      font: "800 16px Manrope, sans-serif",
    });
    const totalWidth = challenges.length * 252 + (challenges.length - 1) * 28;
    challenges.forEach((match, index) =>
      drawMatch(
        context,
        match,
        { x: 800 - totalWidth / 2 + index * 280, y: 836 },
        names,
      ),
    );
  }
  drawShareFooter(context, 1600, 940);
  return element;
}
