import {
  bracketSeedOrder,
  nextPowerOfTwo,
  seedPlayers,
  socialBracketSlots,
} from "./seeding";
import { calculateMatchCap } from "./timing";
import type {
  Match,
  MatchSide,
  MatchSource,
  Player,
  TournamentBracket,
  TournamentConfig,
} from "./types";

function sideFromSource(
  source: MatchSource,
  matches: Map<string, Match>,
): MatchSide | null {
  if (source.type === "player") return { memberIds: [source.playerId] };
  const sourceMatch = matches.get(source.matchId);
  if (!sourceMatch || sourceMatch.status !== "complete") return null;
  const playerId =
    source.type === "winner" ? sourceMatch.winnerId : sourceMatch.loserId;
  return playerId ? { memberIds: [playerId] } : null;
}

function makeMatch(input: {
  id: string;
  kind?: Match["kind"];
  round: number;
  ordinal: number;
  sourceA: MatchSource;
  sourceB: MatchSource;
  capMs: number | null;
  targetScore: number;
  matches: Map<string, Match>;
}): Match {
  const sideA = sideFromSource(input.sourceA, input.matches);
  const sideB = sideFromSource(input.sourceB, input.matches);
  return {
    id: input.id,
    kind: input.kind ?? "elimination",
    round: input.round,
    ordinal: input.ordinal,
    sourceA: input.sourceA,
    sourceB: input.sourceB,
    sideA,
    sideB,
    config: { targetScore: input.targetScore, capMs: input.capMs },
    scoreA: 0,
    scoreB: 0,
    status: sideA && sideB ? "ready" : "waiting",
    winnerId: null,
    loserId: null,
    startedAt: null,
    completedAt: null,
    comebackDeficit: 0,
  };
}

function validatePlayers(players: Player[]): void {
  if (players.length < 4 || players.length > 16) {
    throw new Error("Tournament entrants must be between 4 and 16.");
  }
  const ids = new Set(players.map(({ id }) => id));
  const names = new Set(players.map(({ name }) => name.trim().toLowerCase()));
  if (ids.size !== players.length || names.size !== players.length) {
    throw new Error("Player ids and names must be unique.");
  }
  if (players.some(({ name }) => !name.trim())) {
    throw new Error("Player names are required.");
  }
}

export function createTournamentBracket(
  players: Player[],
  config: TournamentConfig,
): TournamentBracket {
  validatePlayers(players);
  const seeded = seedPlayers(players, config.randomSeed);
  const bracketSize = nextPowerOfTwo(seeded.length);
  const roundCount = Math.log2(bracketSize);
  const capMs =
    config.timingMode === "timed"
      ? calculateMatchCap({
          entrantCount: seeded.length,
          bookingMinutes: config.bookingMinutes,
          warmupMinutes: config.warmupMinutes,
          transitionSeconds: config.transitionSeconds,
        }).capMs
      : null;
  const orderedPlayers =
    config.drawStyle === "social"
      ? socialBracketSlots(seeded, bracketSize, config.randomSeed)
      : bracketSeedOrder(bracketSize).map((seed) =>
          seeded.find((player) => player.seed === seed),
        );
  let sources: Array<MatchSource | null> = orderedPlayers.map((player) =>
    player ? { type: "player", playerId: player.id } : null,
  );
  const matches = new Map<string, Match>();
  const semifinalIds: string[] = [];

  for (let round = 1; round <= roundCount; round += 1) {
    const nextSources: MatchSource[] = [];
    for (let index = 0; index < sources.length; index += 2) {
      const left = sources[index];
      const right = sources[index + 1];
      if (!left && !right) throw new Error("Invalid empty bracket region.");
      if (!left || !right) {
        nextSources.push((left ?? right) as MatchSource);
        continue;
      }
      const ordinal = index / 2 + 1;
      const id = `r${round}-m${ordinal}`;
      const match = makeMatch({
        id,
        round,
        ordinal,
        sourceA: left,
        sourceB: right,
        capMs,
        targetScore: config.targetScore,
        matches,
      });
      matches.set(id, match);
      nextSources.push({ type: "winner", matchId: id });
      if (round === roundCount - 1) semifinalIds.push(id);
    }
    sources = nextSources;
  }

  const finalMatch = [...matches.values()].find(
    (match) => match.round === roundCount,
  );
  if (!finalMatch || semifinalIds.length !== 2) {
    throw new Error("Bracket did not produce a final and two semifinals.");
  }
  const bronze = makeMatch({
    id: "bronze",
    kind: "bronze",
    round: roundCount,
    ordinal: 0,
    sourceA: { type: "loser", matchId: semifinalIds[0] },
    sourceB: { type: "loser", matchId: semifinalIds[1] },
    capMs,
    targetScore: config.targetScore,
    matches,
  });
  matches.set(bronze.id, bronze);

  return {
    bracketSize,
    roundCount,
    players: seeded,
    matches: [...matches.values()],
    finalMatchId: finalMatch.id,
    bronzeMatchId: bronze.id,
    amendments: [],
  };
}

export function resolveBracketMatches(matches: Match[]): Match[] {
  const lookup = new Map(matches.map((match) => [match.id, match]));
  return matches.map((match) => {
    if (match.status === "complete" || match.status === "live") return match;
    const sideA = sideFromSource(match.sourceA, lookup);
    const sideB = sideFromSource(match.sourceB, lookup);
    return {
      ...match,
      sideA,
      sideB,
      status: sideA && sideB ? "ready" : "waiting",
    };
  });
}

export function resetTournamentBracket(
  bracket: TournamentBracket,
): TournamentBracket {
  const cleared = bracket.matches.map((match) => ({
    ...match,
    sideA: null,
    sideB: null,
    scoreA: 0,
    scoreB: 0,
    status: "waiting" as const,
    winnerId: null,
    loserId: null,
    startedAt: null,
    completedAt: null,
    comebackDeficit: 0,
  }));
  return { ...bracket, matches: resolveBracketMatches(cleared) };
}

export function completeMatch(
  bracket: TournamentBracket,
  matchId: string,
  scoreA: number,
  scoreB: number,
  completedAt: number,
  winnerIdOverride?: string,
  comebackDeficit = 0,
): TournamentBracket {
  const target = bracket.matches.find((match) => match.id === matchId);
  if (!target) throw new Error("Match not found.");
  if (target.status === "complete") return bracket;
  const liveMatch = bracket.matches.find(({ status }) => status === "live");
  if (liveMatch && liveMatch.id !== matchId) {
    throw new Error("Another match is already live on this court.");
  }
  if (target.kind === "elimination") {
    const unfinishedRounds = bracket.matches
      .filter(
        (match) => match.kind === "elimination" && match.status !== "complete",
      )
      .map(({ round }) => round);
    const earliestRound = Math.min(...unfinishedRounds);
    if (target.round !== earliestRound) {
      throw new Error("Complete the current round before advancing.");
    }
  }
  const bronze = bracket.matches.find(({ id }) => id === bracket.bronzeMatchId);
  if (matchId === bracket.finalMatchId && bronze?.status !== "complete") {
    throw new Error("Complete the third-place match before the final.");
  }
  if (!target.sideA || !target.sideB) {
    throw new Error("A ready match requires both sides.");
  }
  if (
    !Number.isInteger(scoreA) ||
    !Number.isInteger(scoreB) ||
    scoreA < 0 ||
    scoreB < 0 ||
    !Number.isFinite(completedAt) ||
    !Number.isInteger(comebackDeficit) ||
    comebackDeficit < 0
  ) {
    throw new Error("Scores and completion time must be valid.");
  }
  const sideAId = target.sideA.memberIds[0];
  const sideBId = target.sideB.memberIds[0];
  const scoreWinnerId =
    scoreA === scoreB ? null : scoreA > scoreB ? sideAId : sideBId;
  if (winnerIdOverride && ![sideAId, sideBId].includes(winnerIdOverride)) {
    throw new Error("Selected winner must be one of the match participants.");
  }
  if (scoreWinnerId && winnerIdOverride && scoreWinnerId !== winnerIdOverride) {
    throw new Error("Selected winner conflicts with the recorded score.");
  }
  const winnerId = scoreWinnerId ?? winnerIdOverride;
  if (!winnerId) {
    throw new Error("A tied match requires a selected winner.");
  }
  const loserId = winnerId === sideAId ? sideBId : sideAId;
  const matches = bracket.matches.map((match) =>
    match.id === matchId
      ? {
          ...match,
          scoreA,
          scoreB,
          winnerId,
          loserId,
          status: "complete" as const,
          completedAt,
          comebackDeficit,
        }
      : match,
  );
  return { ...bracket, matches: resolveBracketMatches(matches) };
}
