import type { Match, Player, TournamentBracket } from "../../tournament";

export interface MatchNode {
  id: string;
  kind: "match" | "final" | "bronze";
  match: Match;
  ordinal: number;
  round: number;
}

export interface ByeNode {
  id: string;
  kind: "bye";
  ordinal: number;
  player: Player;
  round: 1;
}

export type BracketNode = MatchNode | ByeNode;

export interface PositionedNode {
  height: number;
  node: BracketNode;
  width: number;
  x: number;
  y: number;
}

export interface BracketLink {
  fromId: string;
  state: Match["status"] | "complete" | "waiting";
  toId: string;
}

export interface TreeLayout {
  boardHeight: number;
  boardWidth: number;
  links: BracketLink[];
  nodes: PositionedNode[];
}

const EDGE_PADDING = 24;
const COLUMN_GAP = 56;
const NODE_WIDTH = 276;
const NODE_HEIGHT = 124;
const FINAL_WIDTH = 340;
const TREE_TOP = 34;

function createByeNodes(bracket: TournamentBracket): ByeNode[] {
  const playersById = new Map(
    bracket.players.map((player) => [player.id, player]),
  );
  const reopened = new Set(
    bracket.amendments
      .filter(({ method }) => method === "reversible-bye")
      .map(({ protectedPlayerId }) => protectedPlayerId),
  );

  return bracket.matches
    .filter(({ kind, round }) => kind === "elimination" && round === 2)
    .flatMap((match) =>
      ([match.sourceA, match.sourceB] as const).flatMap((source, index) => {
        if (source.type !== "player" || reopened.has(source.playerId))
          return [];
        const player = playersById.get(source.playerId);
        if (!player) return [];
        const ordinal = (match.ordinal - 1) * 2 + index + 1;
        return [
          {
            id: `bye-${ordinal}`,
            kind: "bye" as const,
            ordinal,
            player,
            round: 1 as const,
          },
        ];
      }),
    );
}

function createNodes(bracket: TournamentBracket): BracketNode[] {
  const matches: MatchNode[] = bracket.matches
    .filter(({ kind }) => kind === "elimination" || kind === "bronze")
    .map((match) => ({
      id: match.id,
      kind:
        match.id === bracket.finalMatchId
          ? "final"
          : match.id === bracket.bronzeMatchId
            ? "bronze"
            : "match",
      match,
      ordinal: match.ordinal,
      round: match.round,
    }));
  return [...matches, ...createByeNodes(bracket)];
}

function sourceMatchesNode(source: Match["sourceA"], node: BracketNode) {
  if (node.kind === "bye") {
    return source.type === "player" && source.playerId === node.player.id;
  }
  return source.type === "winner" && source.matchId === node.match.id;
}

function createLinks(
  bracket: TournamentBracket,
  nodes: BracketNode[],
): BracketLink[] {
  const targets = bracket.matches.filter(
    ({ kind, round }) => kind === "elimination" && round > 1,
  );
  return nodes.flatMap((node) => {
    const target = targets.find((match) => {
      const amendment = bracket.amendments.find(
        ({ targetMatchId }) => targetMatchId === match.id,
      );
      const sourceA =
        amendment?.targetSlot === "A"
          ? amendment.originalTargetSource
          : match.sourceA;
      const sourceB =
        amendment?.targetSlot === "B"
          ? amendment.originalTargetSource
          : match.sourceB;
      return (
        sourceMatchesNode(sourceA, node) || sourceMatchesNode(sourceB, node)
      );
    });
    if (!target) return [];
    return [
      {
        fromId: node.id,
        state: node.kind === "bye" ? "complete" : node.match.status,
        toId: target.id,
      },
    ];
  });
}

function sidePosition(node: BracketNode, bracket: TournamentBracket) {
  const count = bracket.bracketSize / 2 ** node.round;
  const sideCount = Math.max(1, count / 2);
  const right = node.ordinal > sideCount;
  return {
    index: right ? node.ordinal - sideCount - 1 : node.ordinal - 1,
    right,
    sideCount,
  };
}

export function createTreeLayout(bracket: TournamentBracket): TreeLayout {
  const nodes = createNodes(bracket);
  const sideColumns = bracket.roundCount - 1;
  const boardWidth =
    EDGE_PADDING * 2 +
    sideColumns * 2 * NODE_WIDTH +
    sideColumns * 2 * COLUMN_GAP +
    FINAL_WIDTH;
  const openingPerSide = Math.max(1, bracket.bracketSize / 4);
  const treeHeight = Math.max(250, openingPerSide * (NODE_HEIGHT + 34));
  const finalCenter = TREE_TOP + treeHeight / 2;
  const bronzeCenter = finalCenter + NODE_HEIGHT + 32;
  const boardHeight = Math.max(
    TREE_TOP + treeHeight + 36,
    bronzeCenter + NODE_HEIGHT / 2 + 34,
  );
  const finalX = EDGE_PADDING + sideColumns * (NODE_WIDTH + COLUMN_GAP);
  const sideX = (round: number, right: boolean) =>
    right
      ? finalX +
        FINAL_WIDTH +
        COLUMN_GAP +
        (sideColumns - round) * (NODE_WIDTH + COLUMN_GAP)
      : EDGE_PADDING + (round - 1) * (NODE_WIDTH + COLUMN_GAP);
  const sideY = (index: number, count: number) =>
    TREE_TOP + ((index + 0.5) / count) * treeHeight;

  const positioned = nodes.map((node): PositionedNode => {
    if (node.kind === "final") {
      return {
        height: NODE_HEIGHT,
        node,
        width: FINAL_WIDTH,
        x: finalX,
        y: finalCenter,
      };
    }
    if (node.kind === "bronze") {
      return {
        height: NODE_HEIGHT,
        node,
        width: NODE_WIDTH,
        x: finalX + (FINAL_WIDTH - NODE_WIDTH) / 2,
        y: bronzeCenter,
      };
    }
    const { index, right, sideCount } = sidePosition(node, bracket);
    return {
      height: NODE_HEIGHT,
      node,
      width: NODE_WIDTH,
      x: sideX(node.round, right),
      y: sideY(index, sideCount),
    };
  });

  return {
    boardHeight,
    boardWidth,
    links: createLinks(bracket, nodes),
    nodes: positioned,
  };
}
