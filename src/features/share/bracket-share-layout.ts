import type {
  Match,
  MatchSide,
  MatchSource,
  TournamentBracket,
} from "../../tournament";

export interface ShareMatchPosition {
  height: number;
  width: number;
  x: number;
  y: number;
}

const FINAL_WIDTH = 280;
const CARD_HEIGHT = 96;
const FINAL_X = (1600 - FINAL_WIDTH) / 2;
const TREE_TOP = 350;
const TREE_HEIGHT = 430;

export function eliminationSharePositions(
  bracket: TournamentBracket,
  matches: Match[],
) {
  const positions = new Map<string, ShareMatchPosition>();
  const cardWidth =
    bracket.roundCount >= 4 ? 184 : bracket.roundCount === 3 ? 220 : 260;
  const maxDistance = Math.max(1, bracket.roundCount - 1);
  const gap = (FINAL_X - 76 - maxDistance * cardWidth) / maxDistance;

  for (const match of matches) {
    if (match.id === bracket.finalMatchId) {
      positions.set(match.id, {
        x: FINAL_X,
        y: TREE_TOP + TREE_HEIGHT / 2 - CARD_HEIGHT / 2,
        width: FINAL_WIDTH,
        height: CARD_HEIGHT,
      });
      continue;
    }
    const expected = 2 ** (bracket.roundCount - match.round);
    const perSide = Math.max(1, expected / 2);
    const right = match.ordinal > perSide;
    const slot = (match.ordinal - 1) % perSide;
    const centerY = TREE_TOP + ((slot + 0.5) * TREE_HEIGHT) / perSide;
    const distance = bracket.roundCount - match.round;
    positions.set(match.id, {
      x: right
        ? FINAL_X + FINAL_WIDTH + gap + (distance - 1) * (cardWidth + gap)
        : FINAL_X - gap - cardWidth - (distance - 1) * (cardWidth + gap),
      y: centerY - CARD_HEIGHT / 2,
      width: cardWidth,
      height: CARD_HEIGHT,
    });
  }
  return positions;
}

export function resolvedSide(
  match: Match,
  side: "A" | "B",
  matches: Map<string, Match>,
) {
  const direct = side === "A" ? match.sideA : match.sideB;
  if (direct?.memberIds[0]) return direct;
  const source = side === "A" ? match.sourceA : match.sourceB;
  const playerId = playerFromSource(source, matches);
  return playerId ? ({ memberIds: [playerId] } satisfies MatchSide) : null;
}

export function sourceFallback(
  match: Match,
  side: "A" | "B",
  matches: Map<string, Match>,
) {
  const source = side === "A" ? match.sourceA : match.sourceB;
  if (source.type === "player") return "PLAYER";
  const sourceMatch = matches.get(source.matchId);
  if (!sourceMatch) return "AWAITING RESULT";
  return `${source.type === "winner" ? "WINNER" : "LOSER"} · R${sourceMatch.round} M${sourceMatch.ordinal}`;
}

export function matchSources(bracket: TournamentBracket, match: Match) {
  const amendment = bracket.amendments.find(
    ({ targetMatchId }) => targetMatchId === match.id,
  );
  return [
    amendment?.targetSlot === "A"
      ? amendment.originalTargetSource
      : match.sourceA,
    amendment?.targetSlot === "B"
      ? amendment.originalTargetSource
      : match.sourceB,
  ];
}

function playerFromSource(source: MatchSource, matches: Map<string, Match>) {
  if (source.type === "player") return source.playerId;
  const match = matches.get(source.matchId);
  return source.type === "winner" ? match?.winnerId : match?.loserId;
}
