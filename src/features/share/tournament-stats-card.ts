import {
  calculateTournamentResult,
  type Match,
  type TournamentBracket,
} from "../../tournament";
import {
  drawBrandMark,
  drawExportBackdrop,
  drawLimeGlow,
  drawShareFooter,
  fitCanvasText,
  shareCanvasSurface,
  shareColors,
  shareFittedText,
  shareText,
} from "./share-canvas";
import {
  championStanding,
  closestCompletedMatch,
  finalMatchData,
  matchPlayerId,
  playerName,
  tournamentNames,
} from "./tournament-share-data";

export async function tournamentStatsCanvas(bracket: TournamentBracket) {
  const result = calculateTournamentResult(bracket);
  const names = tournamentNames(bracket);
  const champion = championStanding(result);
  const final = finalMatchData(bracket, result);
  const closest = closestCompletedMatch(result);
  const { element, context, mark } = await shareCanvasSurface(1080, 1350);

  drawExportBackdrop(context, 1080, 1350, 290);
  drawLimeGlow(context, 890, 120, 260);
  shareText(context, "PICKLE KING", 54, 66, {
    color: shareColors.lime,
    font: "900 24px 'Archivo Black', sans-serif",
  });
  shareText(context, `${bracket.players.length} PLAYER TOURNAMENT`, 1026, 66, {
    align: "right",
    color: shareColors.mist,
    font: "800 18px Manrope, sans-serif",
  });
  drawBrandMark(context, mark, 920, 82, 116);
  shareText(context, "TOURNAMENT STANDINGS", 56, 128, {
    color: shareColors.mist,
    font: "900 18px Manrope, sans-serif",
  });
  shareFittedText(
    context,
    playerName(names, result.championId, "Champion").toUpperCase(),
    56,
    218,
    { color: shareColors.lime, maxSize: 68, minSize: 42, maxWidth: 760 },
  );
  shareText(
    context,
    `CHAMPION  ·  ${champion.wins}–${champion.losses}  ·  ${signed(champion.differential)} DIFF`,
    58,
    264,
    { color: shareColors.chalk, font: "900 21px Manrope, sans-serif" },
  );

  const tableEnd = drawStandings(context, result.standings, names);
  drawFacts(context, {
    top: Math.min(930, Math.max(680, tableEnd + 40)),
    final: `${playerName(names, result.championId)} ${final.championScore}–${final.opponentScore} ${playerName(names, final.opponentId)}`,
    closest: closest ? matchSummary(closest, names) : "No completed match",
    upsets: result.upsetWins.length,
    championRecord: `${champion.wins} wins · ${champion.losses} loss${champion.losses === 1 ? "" : "es"}`,
    differential: `${signed(champion.differential)} points`,
  });
  drawShareFooter(context, 1080, 1290);
  return element;
}

function drawStandings(
  context: CanvasRenderingContext2D,
  standings: ReturnType<typeof calculateTournamentResult>["standings"],
  names: Map<string, string>,
) {
  const top = 326;
  const rowHeight = Math.min(52, 570 / standings.length);
  for (const [label, x, align] of [
    ["PLAYER", 70, "left"],
    ["W–L", 702, "right"],
    ["PTS", 848, "right"],
    ["DIFF", 1006, "right"],
  ] as const) {
    shareText(context, label, x, top, {
      align,
      color: shareColors.mist,
      font: "900 15px Manrope, sans-serif",
    });
  }
  standings.forEach((standing, index) => {
    const y = top + 32 + index * rowHeight;
    context.fillStyle =
      index === 0
        ? "rgba(41, 54, 30, 0.96)"
        : index % 2
          ? "rgba(21, 27, 19, 0.9)"
          : "rgba(27, 34, 24, 0.88)";
    context.fillRect(56, y, 968, rowHeight - 4);
    context.font = "900 19px Manrope, sans-serif";
    const name = fitCanvasText(
      context,
      `${String(index + 1).padStart(2, "0")}  ${playerName(names, standing.playerId)}`,
      520,
    );
    shareText(context, name, 72, y + rowHeight * 0.65, {
      color: index === 0 ? shareColors.lime : shareColors.chalk,
      font: "900 19px Manrope, sans-serif",
    });
    shareText(
      context,
      `${standing.wins}–${standing.losses}`,
      702,
      y + rowHeight * 0.65,
      {
        align: "right",
        font: "900 19px Manrope, sans-serif",
      },
    );
    shareText(
      context,
      `${standing.pointsFor}–${standing.pointsAgainst}`,
      848,
      y + rowHeight * 0.65,
      {
        align: "right",
        font: "800 18px Manrope, sans-serif",
      },
    );
    shareText(
      context,
      signed(standing.differential),
      1006,
      y + rowHeight * 0.65,
      {
        align: "right",
        color: standing.differential > 0 ? shareColors.lime : shareColors.chalk,
        font: "900 19px Manrope, sans-serif",
      },
    );
  });
  return top + 32 + standings.length * rowHeight;
}

function drawFacts(
  context: CanvasRenderingContext2D,
  data: {
    top: number;
    final: string;
    closest: string;
    upsets: number;
    championRecord: string;
    differential: string;
  },
) {
  const bottom = 1228;
  const height = bottom - data.top;
  context.fillStyle = "rgba(17, 21, 15, 0.97)";
  context.fillRect(56, data.top, 968, height);
  const facts = [
    ["FINAL", data.final],
    ["CLOSEST MATCH", data.closest],
    ["UPSET WINS", String(data.upsets)],
    ["CHAMPION RECORD", `${data.championRecord} · ${data.differential}`],
  ];
  const rowHeight = height / facts.length;
  facts.forEach(([label, value], index) => {
    const rowTop = data.top + index * rowHeight;
    if (index > 0) {
      context.strokeStyle = shareColors.line;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(80, rowTop);
      context.lineTo(1000, rowTop);
      context.stroke();
    }
    shareText(context, label, 84, rowTop + rowHeight * 0.58, {
      color: shareColors.mist,
      font: "900 14px Manrope, sans-serif",
    });
    shareFittedText(context, value, 990, rowTop + rowHeight * 0.62, {
      align: "right",
      color: index === 0 ? shareColors.lime : shareColors.chalk,
      family: "Manrope, sans-serif",
      weight: 900,
      maxSize: 24,
      minSize: 15,
      maxWidth: 690,
    });
  });
}

function matchSummary(match: Match, names: Map<string, string>) {
  return `${playerName(names, matchPlayerId(match, "A"))} ${match.scoreA}–${match.scoreB} ${playerName(names, matchPlayerId(match, "B"))}`;
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}
