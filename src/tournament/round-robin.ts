import { validateTournamentField } from "./editing";
import { orderPlayers } from "./seeding";
import { calculateMatchCap } from "./timing";
import type {
  Match,
  MatchSide,
  MatchSource,
  Player,
  PlayerStanding,
  TournamentBracket,
  TournamentConfig,
} from "./types";

const ROUND_PAIRINGS = [
  [
    [0, 3],
    [1, 2],
  ],
  [
    [0, 2],
    [3, 1],
  ],
  [
    [0, 1],
    [2, 3],
  ],
] as const;

function emptyStanding(playerId: string): PlayerStanding {
  return {
    playerId,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    differential: 0,
    eliminatedRound: null,
  };
}

export function calculatePreliminaryStandings(
  tournament: TournamentBracket,
): PlayerStanding[] {
  const standings = new Map(
    tournament.players.map(({ id }) => [id, emptyStanding(id)]),
  );
  const completed = tournament.matches.filter(
    ({ kind, status }) => kind === "round-robin" && status === "complete",
  );
  for (const match of completed) {
    const sideA = match.sideA?.memberIds[0];
    const sideB = match.sideB?.memberIds[0];
    if (!sideA || !sideB || !match.winnerId || !match.loserId) continue;
    const first = standings.get(sideA)!;
    const second = standings.get(sideB)!;
    first.pointsFor += match.scoreA;
    first.pointsAgainst += match.scoreB;
    second.pointsFor += match.scoreB;
    second.pointsAgainst += match.scoreA;
    standings.get(match.winnerId)!.wins += 1;
    standings.get(match.loserId)!.losses += 1;
  }
  const values = [...standings.values()].map((standing) => ({
    ...standing,
    differential: standing.pointsFor - standing.pointsAgainst,
  }));
  const winsGroups = Map.groupBy(values, ({ wins }) => wins);
  const order = new Map(tournament.players.map(({ id }, index) => [id, index]));
  return values.toSorted((left, right) => {
    if (left.wins !== right.wins) return right.wins - left.wins;
    if (winsGroups.get(left.wins)?.length === 2) {
      const meeting = completed.find((match) => {
        const ids = [match.sideA?.memberIds[0], match.sideB?.memberIds[0]];
        return ids.includes(left.playerId) && ids.includes(right.playerId);
      });
      if (meeting?.winnerId === left.playerId) return -1;
      if (meeting?.winnerId === right.playerId) return 1;
    }
    return (
      right.differential - left.differential ||
      right.pointsFor - left.pointsFor ||
      order.get(left.playerId)! - order.get(right.playerId)!
    );
  });
}

function match(input: {
  id: string;
  kind: Match["kind"];
  round: number;
  ordinal: number;
  sourceA: MatchSource;
  sourceB: MatchSource;
  capMs: number | null;
  targetScore: number;
  sideA?: MatchSide | null;
  sideB?: MatchSide | null;
}): Match {
  const sideA = input.sideA ?? null;
  const sideB = input.sideB ?? null;
  return {
    ...input,
    sideA,
    sideB,
    config: { targetScore: input.targetScore, capMs: input.capMs },
    scoreA: 0,
    scoreB: 0,
    status: sideA && sideB && input.round === 1 ? "ready" : "waiting",
    winnerId: null,
    loserId: null,
    startedAt: null,
    completedAt: null,
    comebackDeficit: 0,
  };
}

export function createRoundRobinTournament(
  players: Player[],
  config: TournamentConfig,
): TournamentBracket {
  if (players.length !== 4) {
    throw new Error("Round robin + finals requires exactly four players.");
  }
  validateTournamentField(players);
  const ordered = orderPlayers(players, config.drawStyle, config.randomSeed);
  const capMs =
    config.timingMode === "timed"
      ? calculateMatchCap({
          entrantCount: 4,
          format: "round-robin-finals",
          bookingMinutes: config.bookingMinutes,
          warmupMinutes: config.warmupMinutes,
          transitionSeconds: config.transitionSeconds,
        }).capMs
      : null;
  const preliminaries = ROUND_PAIRINGS.flatMap((pairings, roundIndex) =>
    pairings.map(([left, right], matchIndex) =>
      match({
        id: `rr-r${roundIndex + 1}-m${matchIndex + 1}`,
        kind: "round-robin",
        round: roundIndex + 1,
        ordinal: matchIndex + 1,
        sourceA: { type: "player", playerId: ordered[left].id },
        sourceB: { type: "player", playerId: ordered[right].id },
        sideA: { memberIds: [ordered[left].id] },
        sideB: { memberIds: [ordered[right].id] },
        capMs,
        targetScore: config.targetScore,
      }),
    ),
  );
  const placement = [
    match({
      id: "bronze",
      kind: "bronze",
      round: 4,
      ordinal: 1,
      sourceA: { type: "standing", rank: 3 },
      sourceB: { type: "standing", rank: 4 },
      capMs,
      targetScore: config.targetScore,
    }),
    match({
      id: "final",
      kind: "elimination",
      round: 4,
      ordinal: 2,
      sourceA: { type: "standing", rank: 1 },
      sourceB: { type: "standing", rank: 2 },
      capMs,
      targetScore: config.targetScore,
    }),
  ];
  return {
    format: "round-robin-finals",
    bracketSize: 4,
    roundCount: 4,
    players: ordered,
    matches: [...preliminaries, ...placement],
    finalMatchId: "final",
    bronzeMatchId: "bronze",
    amendments: [],
  };
}

function sideForStanding(
  source: MatchSource,
  standings: PlayerStanding[] | null,
): MatchSide | null {
  if (source.type === "player") return { memberIds: [source.playerId] };
  if (source.type !== "standing" || !standings) return null;
  const playerId = standings[source.rank - 1]?.playerId;
  return playerId ? { memberIds: [playerId] } : null;
}

export function resolveRoundRobinMatches(
  tournament: TournamentBracket,
): Match[] {
  const preliminaries = tournament.matches.filter(
    ({ kind }) => kind === "round-robin",
  );
  const preliminariesComplete = preliminaries.every(
    ({ status }) => status === "complete",
  );
  const standings = preliminariesComplete
    ? calculatePreliminaryStandings(tournament)
    : null;
  const bronze = tournament.matches.find(
    ({ id }) => id === tournament.bronzeMatchId,
  );
  return tournament.matches.map((current) => {
    if (current.status === "complete" || current.status === "live") {
      return current;
    }
    const sideA = sideForStanding(current.sourceA, standings);
    const sideB = sideForStanding(current.sourceB, standings);
    const priorRoundsComplete = preliminaries
      .filter(({ round }) => round < current.round)
      .every(({ status }) => status === "complete");
    const unlocked =
      current.kind === "round-robin"
        ? priorRoundsComplete
        : current.id === tournament.bronzeMatchId
          ? preliminariesComplete
          : preliminariesComplete && bronze?.status === "complete";
    return {
      ...current,
      sideA,
      sideB,
      status: unlocked && sideA && sideB ? "ready" : "waiting",
    };
  });
}
