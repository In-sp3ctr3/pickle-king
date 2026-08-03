import type { QuickMatchRecord } from "../../history";
import type { ScoringState } from "../../match/types";
import type { Match, TournamentBracket } from "../../tournament";

const colors = {
  court: "#090b08",
  surface: "#151b13",
  chalk: "#f5f3e9",
  lime: "#c8ff3d",
  mist: "#9da494",
  line: "#34402e",
};

function canvas(width: number, height: number) {
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  const context = element.getContext("2d");
  if (!context) throw new Error("This browser cannot create share images.");
  context.fillStyle = colors.court;
  context.fillRect(0, 0, width, height);
  return { element, context };
}

function text(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  options: { align?: CanvasTextAlign; color?: string; font?: string } = {},
) {
  context.fillStyle = options.color ?? colors.chalk;
  context.font = options.font ?? "800 34px Manrope, sans-serif";
  context.textAlign = options.align ?? "left";
  context.fillText(value, x, y);
}

function fit(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function crown(context: CanvasRenderingContext2D, x: number, y: number) {
  context.fillStyle = colors.lime;
  context.beginPath();
  context.moveTo(x - 70, y + 34);
  context.lineTo(x - 58, y - 38);
  context.lineTo(x - 16, y + 2);
  context.lineTo(x, y - 54);
  context.lineTo(x + 18, y + 2);
  context.lineTo(x + 58, y - 38);
  context.lineTo(x + 70, y + 34);
  context.closePath();
  context.fill();
  context.fillRect(x - 70, y + 45, 140, 18);
}

function footer(context: CanvasRenderingContext2D, width: number, y: number) {
  text(context, "PICKLE KING", 64, y, {
    color: colors.lime,
    font: "900 24px 'Archivo Black', sans-serif",
  });
  text(context, "SETTLED ON COURT · STORED ON DEVICE", width - 64, y, {
    align: "right",
    color: colors.mist,
    font: "800 18px Manrope, sans-serif",
  });
}

export function quickShareCanvas(input: QuickMatchRecord | ScoringState) {
  const record = "labels" in input;
  const labelA = record ? input.labels.sideA : input.labelA;
  const labelB = record ? input.labels.sideB : input.labelB;
  const scoreA = record ? input.score.sideA : input.scoreA;
  const scoreB = record ? input.score.sideB : input.scoreB;
  const winner = input.winner;
  if (!winner) throw new Error("A result needs a winner before sharing.");
  const { element, context } = canvas(1080, 1350);
  text(context, "FINAL SCORE", 64, 90, {
    color: colors.lime,
    font: "900 24px Manrope, sans-serif",
  });
  crown(context, 540, 245);
  text(context, fit(winner === "A" ? labelA : labelB, 24), 540, 390, {
    align: "center",
    font: "900 68px 'Archivo Black', sans-serif",
  });
  text(context, "WINS", 540, 438, {
    align: "center",
    color: colors.mist,
    font: "900 22px Manrope, sans-serif",
  });
  context.fillStyle = colors.surface;
  context.fillRect(64, 520, 952, 520);
  text(context, fit(labelA, 23), 128, 640, {
    color: winner === "A" ? colors.lime : colors.chalk,
    font: "900 42px Manrope, sans-serif",
  });
  text(context, String(scoreA), 952, 780, {
    align: "right",
    color: winner === "A" ? colors.lime : colors.chalk,
    font: "900 170px 'Archivo Black', sans-serif",
  });
  context.fillStyle = colors.line;
  context.fillRect(128, 824, 824, 3);
  text(context, fit(labelB, 23), 128, 920, {
    color: winner === "B" ? colors.lime : colors.chalk,
    font: "900 42px Manrope, sans-serif",
  });
  text(context, String(scoreB), 952, 1000, {
    align: "right",
    color: winner === "B" ? colors.lime : colors.chalk,
    font: "900 170px 'Archivo Black', sans-serif",
  });
  footer(context, 1080, 1268);
  return element;
}

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
  const height = 88;
  context.fillStyle = colors.surface;
  context.fillRect(position.x, position.y, width, height);
  const side = (ids: string[] | undefined) =>
    ids?.map((id) => names.get(id) ?? "Player").join(" + ") ?? "TBD";
  text(
    context,
    fit(side(match.sideA?.memberIds), 17),
    position.x + 14,
    position.y + 33,
    {
      font: "800 20px Manrope, sans-serif",
    },
  );
  text(
    context,
    fit(side(match.sideB?.memberIds), 17),
    position.x + 14,
    position.y + 69,
    {
      font: "800 20px Manrope, sans-serif",
    },
  );
  if (match.status === "complete") {
    text(
      context,
      String(match.scoreA),
      position.x + width - 14,
      position.y + 33,
      {
        align: "right",
        color: colors.lime,
        font: "900 21px Manrope, sans-serif",
      },
    );
    text(
      context,
      String(match.scoreB),
      position.x + width - 14,
      position.y + 69,
      {
        align: "right",
        color: colors.lime,
        font: "900 21px Manrope, sans-serif",
      },
    );
  }
}

export function bracketShareCanvas(bracket: TournamentBracket) {
  const { element, context } = canvas(1600, 1000);
  const names = new Map(bracket.players.map(({ id, name }) => [id, name]));
  text(context, "ROAD TO THE CROWN", 70, 78, {
    color: colors.lime,
    font: "900 30px 'Archivo Black', sans-serif",
  });
  text(context, `${bracket.players.length} PLAYER TOURNAMENT`, 1530, 76, {
    align: "right",
    color: colors.mist,
    font: "800 20px Manrope, sans-serif",
  });
  const elimination = bracket.matches.filter(
    ({ kind }) => kind === "elimination",
  );
  const positions = new Map<string, Position>();
  for (let round = 1; round <= bracket.roundCount; round += 1) {
    const matches = elimination
      .filter((match) => match.round === round)
      .sort((a, b) => a.ordinal - b.ordinal);
    if (round === bracket.roundCount) {
      positions.set(matches[0].id, { x: 674, y: 390 });
      continue;
    }
    const half = Math.ceil(matches.length / 2);
    matches.forEach((match, index) => {
      const right = index >= half;
      const local = right ? index - half : index;
      const count = right ? matches.length - half : half;
      positions.set(match.id, {
        x: right ? 1278 - (round - 1) * 285 : 70 + (round - 1) * 285,
        y: 120 + ((local + 1) * 650) / (count + 1),
      });
    });
  }
  crown(context, 800, 300);
  context.strokeStyle = colors.line;
  context.lineWidth = 4;
  for (const match of elimination) {
    const target = positions.get(match.id);
    if (!target) continue;
    for (const source of [match.sourceA, match.sourceB]) {
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
  elimination.forEach((match) => {
    const position = positions.get(match.id);
    if (position) drawMatch(context, match, position, names);
  });
  const bronze = bracket.matches.find(({ id }) => id === bracket.bronzeMatchId);
  if (bronze) {
    text(context, "THIRD PLACE", 674, 650, {
      color: colors.mist,
      font: "800 16px Manrope, sans-serif",
    });
    drawMatch(context, bronze, { x: 674, y: 674 }, names);
  }
  footer(context, 1600, 940);
  return element;
}
