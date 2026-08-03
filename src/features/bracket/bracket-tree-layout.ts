import {
  bracketSeedOrder,
  type Match,
  type Player,
  type TournamentBracket,
} from "../../tournament";

export interface MatchNode {
  id: string;
  kind: "match" | "final";
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
const FINAL_WIDTH = 370;
const TREE_TOP = 34;

function createByeNodes(bracket: TournamentBracket): ByeNode[] {
  const playersBySeed = new Map(
    bracket.players.map((player) => [player.seed, player]),
  );
  const entries = bracketSeedOrder(bracket.bracketSize).map(
    (seed) => playersBySeed.get(seed) ?? null,
  );
  const played = new Set(
    bracket.matches
      .filter(({ kind, round }) => kind === "elimination" && round === 1)
      .map(({ ordinal }) => ordinal),
  );
  const reopened = new Set(
    bracket.amendments
      .filter(({ method }) => method === "reversible-bye")
      .map(({ protectedPlayerId }) => protectedPlayerId),
  );

  return Array.from({ length: bracket.bracketSize / 2 }, (_, index) => {
    const ordinal = index + 1;
    if (played.has(ordinal)) return null;
    const player = entries[index * 2] ?? entries[index * 2 + 1];
    return player && !reopened.has(player.id)
      ? {
          id: `bye-${ordinal}`,
          kind: "bye" as const,
          ordinal,
          player,
          round: 1 as const,
        }
      : null;
  }).filter((node): node is ByeNode => node !== null);
}

function createNodes(bracket: TournamentBracket): BracketNode[] {
  const matches: MatchNode[] = bracket.matches
    .filter(({ kind }) => kind === "elimination")
    .map((match) => ({
      id: match.id,
      kind: match.id === bracket.finalMatchId ? "final" : "match",
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
  const boardHeight = TREE_TOP + treeHeight + 36;
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
        height: NODE_HEIGHT + 12,
        node,
        width: FINAL_WIDTH,
        x: finalX,
        y: TREE_TOP + treeHeight / 2,
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
