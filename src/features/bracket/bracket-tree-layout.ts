import {
  bracketSeedOrder,
  type Match,
  type MatchSource,
  type Player,
  type TournamentBracket,
} from "../../tournament";

export interface EntryNode {
  id: string;
  kind: "entry";
  ordinal: number;
  player: Player | null;
  slot: number;
}

export interface ByeNode {
  id: string;
  kind: "bye";
  ordinal: number;
  player: Player;
  round: 1;
}

export interface MatchNode {
  id: string;
  kind: "match";
  match: Match;
  ordinal: number;
  round: number;
}

export interface ChampionNode {
  id: "champion";
  kind: "champion";
  match: Match;
}

export interface FinalistNode {
  id: "finalist-a" | "finalist-b";
  kind: "finalist";
  match: Match;
  side: "a" | "b";
}

export type BracketNode =
  EntryNode | ByeNode | MatchNode | FinalistNode | ChampionNode;

export interface PositionedNode {
  height: number;
  node: BracketNode;
  width: number;
  x: number;
  y: number;
}

export interface BracketLink {
  fromId: string;
  kind: "advance" | "championship";
  state: Match["status"] | "complete" | "waiting";
  toId: string;
}

export interface TreeLayout {
  boardHeight: number;
  boardWidth: number;
  links: BracketLink[];
  nodes: PositionedNode[];
}

const EDGE_PADDING = 16;
const COLUMN_GAP = 18;
const NODE_WIDTH = 132;
const ENTRY_HEIGHT = 54;
const OUTCOME_HEIGHT = 128;
const FINALIST_HEIGHT = 70;
const CHAMPION_HEIGHT = 150;

function makeEntries(bracket: TournamentBracket): EntryNode[] {
  const bySeed = new Map(
    bracket.players.map((player) => [player.seed, player]),
  );
  return bracketSeedOrder(bracket.bracketSize).map((seed, index) => ({
    id: `entry-${index + 1}`,
    kind: "entry",
    ordinal: Math.floor(index / 2) + 1,
    player: bySeed.get(seed) ?? null,
    slot: index + 1,
  }));
}

function makeByes(bracket: TournamentBracket, entries: EntryNode[]): ByeNode[] {
  const playedOrdinals = new Set(
    bracket.matches
      .filter((match) => match.kind === "elimination" && match.round === 1)
      .map(({ ordinal }) => ordinal),
  );
  return Array.from({ length: bracket.bracketSize / 2 }, (_, index) => {
    const ordinal = index + 1;
    if (playedOrdinals.has(ordinal)) return null;
    const player =
      entries[index * 2]?.player ?? entries[index * 2 + 1]?.player ?? null;
    return player
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

function sidePosition(
  round: number,
  ordinal: number,
  bracket: TournamentBracket,
) {
  const count = bracket.bracketSize / 2 ** round;
  const sideCount = count / 2;
  const right = ordinal > sideCount;
  const index = right ? ordinal - sideCount - 1 : ordinal - 1;
  return { index, right, sideCount };
}

function sourceNodeId(
  source: MatchSource,
  matchIds: Set<string>,
  byeByPlayer: Map<string, string>,
): string | null {
  if (source.type === "winner") {
    return matchIds.has(source.matchId) ? source.matchId : null;
  }
  if (source.type === "player") {
    return byeByPlayer.get(source.playerId) ?? null;
  }
  return null;
}

function createLinks(
  bracket: TournamentBracket,
  entries: EntryNode[],
  byes: ByeNode[],
  matches: MatchNode[],
): BracketLink[] {
  const matchIds = new Set(matches.map(({ id }) => id));
  const byeByPlayer = new Map(byes.map((bye) => [bye.player.id, bye.id]));
  const firstRoundOutput = new Map<number, string>([
    ...matches
      .filter(({ round }) => round === 1)
      .map(({ id, ordinal }) => [ordinal, id] as const),
    ...byes.map(({ id, ordinal }) => [ordinal, id] as const),
  ]);
  const links: BracketLink[] = entries.flatMap((entry) => {
    const target = firstRoundOutput.get(entry.ordinal);
    return target
      ? [
          {
            fromId: entry.id,
            kind: "advance" as const,
            state: entry.player ? ("complete" as const) : ("waiting" as const),
            toId: target,
          },
        ]
      : [];
  });

  for (const target of bracket.matches.filter(
    ({ kind, round }) => kind === "elimination" && round > 1,
  )) {
    const isFinal = target.id === bracket.finalMatchId;
    for (const [sourceIndex, source] of [
      target.sourceA,
      target.sourceB,
    ].entries()) {
      const fromId = sourceNodeId(source, matchIds, byeByPlayer);
      const sourceMatch = bracket.matches.find(({ id }) => id === fromId);
      if (!fromId) continue;
      links.push({
        fromId,
        kind: "advance",
        state: sourceMatch?.status ?? "complete",
        toId: isFinal
          ? sourceIndex === 0
            ? "finalist-a"
            : "finalist-b"
          : target.id,
      });
    }
  }
  for (const finalistId of ["finalist-a", "finalist-b"] as const) {
    links.push({
      fromId: finalistId,
      kind: "championship",
      state:
        bracket.matches.find(({ id }) => id === bracket.finalMatchId)?.status ??
        "waiting",
      toId: "champion",
    });
  }
  return links;
}

export function createTreeLayout(bracket: TournamentBracket): TreeLayout {
  const final = bracket.matches.find(({ id }) => id === bracket.finalMatchId);
  if (!final) throw new Error("Tournament final is missing.");
  const entries = makeEntries(bracket);
  const matches: MatchNode[] = bracket.matches
    .filter(
      ({ id, kind }) => kind === "elimination" && id !== bracket.finalMatchId,
    )
    .map((match) => ({
      id: match.id,
      kind: "match",
      match,
      ordinal: match.ordinal,
      round: match.round,
    }));
  const byes = makeByes(bracket, entries);
  const champion: ChampionNode = {
    id: "champion",
    kind: "champion",
    match: final,
  };
  const finalists: FinalistNode[] = [
    { id: "finalist-a", kind: "finalist", match: final, side: "a" },
    { id: "finalist-b", kind: "finalist", match: final, side: "b" },
  ];
  const columnCount = bracket.roundCount * 2 + 3;
  const boardWidth =
    EDGE_PADDING * 2 +
    columnCount * NODE_WIDTH +
    (columnCount - 1) * COLUMN_GAP;
  const treeHeight = Math.max(260, (bracket.bracketSize / 2) * 66);
  const treeTop = 48;
  const boardHeight = treeTop + treeHeight + 190;
  const columnX = (column: number) =>
    EDGE_PADDING + column * (NODE_WIDTH + COLUMN_GAP);
  const sideY = (index: number, count: number) =>
    treeTop + ((index + 0.5) / count) * treeHeight;
  const nodes: PositionedNode[] = entries.map((node, index) => {
    const sideCount = bracket.bracketSize / 2;
    const right = index >= sideCount;
    return {
      height: ENTRY_HEIGHT,
      node,
      width: NODE_WIDTH,
      x: columnX(right ? columnCount - 1 : 0),
      y: sideY(right ? index - sideCount : index, sideCount),
    };
  });

  for (const node of [...matches, ...byes]) {
    const { index, right, sideCount } = sidePosition(
      node.round,
      node.ordinal,
      bracket,
    );
    nodes.push({
      height: OUTCOME_HEIGHT,
      node,
      width: NODE_WIDTH,
      x: columnX(right ? columnCount - node.round - 1 : node.round),
      y: sideY(index, sideCount),
    });
  }
  nodes.push(
    {
      height: FINALIST_HEIGHT,
      node: finalists[0],
      width: NODE_WIDTH,
      x: columnX(bracket.roundCount),
      y: treeTop + treeHeight / 2,
    },
    {
      height: FINALIST_HEIGHT,
      node: finalists[1],
      width: NODE_WIDTH,
      x: columnX(bracket.roundCount + 2),
      y: treeTop + treeHeight / 2,
    },
  );
  nodes.push({
    height: CHAMPION_HEIGHT,
    node: champion,
    width: 220,
    x: boardWidth / 2 - 110,
    y: treeTop + treeHeight / 2 + 170,
  });

  return {
    boardHeight,
    boardWidth,
    links: createLinks(bracket, entries, byes, matches),
    nodes,
  };
}
