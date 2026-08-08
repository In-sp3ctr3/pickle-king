import { validateTournamentField } from "./editing";
import { rebalanceRemainingCap } from "./timing";
import type {
  LateEntryPlan,
  LateEntryTiming,
  Match,
  MatchSlot,
  MatchSource,
  Player,
  TournamentBracket,
} from "./types";

export interface LateEntryPlanOptions {
  now: number;
  randomSeed: string;
  sessionDeadline: number | null;
  transitionSeconds: number;
  declinedPlayerIds?: string[];
}

interface Candidate {
  match: Match;
  playerId: string;
  slot: MatchSlot;
  source: MatchSource;
}

const sourceAt = (match: Match, slot: MatchSlot) =>
  slot === "A" ? match.sourceA : match.sourceB;

const sideIdAt = (match: Match, slot: MatchSlot) =>
  (slot === "A" ? match.sideA : match.sideB)?.memberIds[0] ?? null;

function stableRank(seed: string, value: string) {
  let hash = 2166136261;
  for (const character of `${seed}:${value}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function playedCount(bracket: TournamentBracket, playerId: string) {
  return bracket.matches.filter(
    (match) =>
      match.status === "complete" &&
      [match.sideA?.memberIds[0], match.sideB?.memberIds[0]].includes(playerId),
  ).length;
}

function candidatesFor(matches: Match[]): Candidate[] {
  return matches.flatMap((match) =>
    (["A", "B"] as const).flatMap((slot) => {
      const playerId = sideIdAt(match, slot);
      return playerId
        ? [{ match, playerId, slot, source: sourceAt(match, slot) }]
        : [];
    }),
  );
}

function activeCandidates(bracket: TournamentBracket) {
  const matches = bracket.matches.filter(
    ({ kind, status }) => kind === "elimination" && status !== "complete",
  );
  const activeRound = Math.min(...matches.map(({ round }) => round));
  return candidatesFor(
    matches.filter(
      ({ round, startedAt }) => round === activeRound && startedAt === null,
    ),
  );
}

function chooseCandidate(bracket: TournamentBracket, randomSeed: string) {
  const candidates = activeCandidates(bracket);
  if (!candidates.length)
    throw new Error("No unstarted bracket slot is available.");
  const byes = candidatesFor(
    bracket.matches.filter(
      ({ kind, status, startedAt }) =>
        kind === "elimination" && status !== "complete" && startedAt === null,
    ),
  ).filter(
    ({ match, playerId, source }) =>
      match.round > 1 &&
      source.type === "player" &&
      playedCount(bracket, playerId) === 0,
  );
  if (byes.length) {
    return {
      candidate: byes.toSorted(
        (left, right) =>
          stableRank(randomSeed, left.playerId) -
          stableRank(randomSeed, right.playerId),
      )[0],
      method: "reversible-bye" as const,
    };
  }
  const preliminaries = candidates.filter(
    ({ match, source }) =>
      match.round === 1 && match.status === "ready" && source.type === "player",
  );
  if (preliminaries.length) {
    const seeds = new Map(
      bracket.players.map(({ id, seed }) => [id, seed ?? 0]),
    );
    return {
      candidate: preliminaries.toSorted(
        (left, right) =>
          (seeds.get(right.playerId) ?? 0) - (seeds.get(left.playerId) ?? 0) ||
          stableRank(randomSeed, left.playerId) -
            stableRank(randomSeed, right.playerId),
      )[0],
      method: "untouched-preliminary" as const,
    };
  }
  return {
    candidate: candidates.toSorted(
      (left, right) =>
        playedCount(bracket, left.playerId) -
          playedCount(bracket, right.playerId) ||
        stableRank(randomSeed, left.playerId) -
          stableRank(randomSeed, right.playerId),
    )[0],
    method: "branch-gauntlet" as const,
  };
}

function lineage(bracket: TournamentBracket, playerId: string) {
  return bracket.matches
    .filter(
      ({ kind, status, winnerId }) =>
        kind === "elimination" &&
        status === "complete" &&
        winnerId === playerId,
    )
    .toSorted(
      (left, right) =>
        (left.completedAt ?? 0) - (right.completedAt ?? 0) ||
        left.round - right.round,
    );
}

function timingPlan(
  bracket: TournamentBracket,
  extraMatches: number,
  options: LateEntryPlanOptions,
): LateEntryTiming {
  const unfinished = bracket.matches.filter(
    ({ status }) => status !== "complete",
  );
  const currentCapMs = unfinished[0]?.config.capMs ?? null;
  const remainingMatches = unfinished.length + extraMatches;
  const base = {
    currentCapMs,
    remainingMatches,
    sessionDeadline: options.sessionDeadline,
  };
  if (options.sessionDeadline === null || currentCapMs === null) {
    return { ...base, proposedCapMs: currentCapMs, feasible: true };
  }
  try {
    const proposedCapMs = rebalanceRemainingCap({
      now: options.now,
      sessionDeadline: options.sessionDeadline,
      remainingMatches,
      transitionSeconds: options.transitionSeconds,
      currentCapMs,
    }).capMs;
    return { ...base, proposedCapMs, feasible: true };
  } catch {
    return { ...base, proposedCapMs: null, feasible: false };
  }
}

export function planLateEntry(
  bracket: TournamentBracket,
  player: Player,
  options: LateEntryPlanOptions,
): LateEntryPlan {
  if (bracket.format === "round-robin-finals") {
    throw new Error("Late entry is not available for round robin tournaments.");
  }
  if (bracket.players.length >= 16)
    throw new Error("A tournament is limited to 16 players.");
  if (bracket.amendments.length)
    throw new Error("Only one late-entry amendment is allowed.");
  const placementStarted = [bracket.bronzeMatchId, bracket.finalMatchId]
    .map((id) => bracket.matches.find((match) => match.id === id))
    .some(
      (match) =>
        match && (match.startedAt !== null || match.status === "complete"),
    );
  if (placementStarted)
    throw new Error("Late entry closes when placement play starts.");
  if (bracket.matches.some(({ status }) => status === "live")) {
    throw new Error(
      "Finish or discard the live match before editing the draw.",
    );
  }
  validateTournamentField([...bracket.players, { ...player, seed: undefined }]);

  const { candidate, method } = chooseCandidate(bracket, options.randomSeed);
  const path =
    method === "branch-gauntlet" ? lineage(bracket, candidate.playerId) : [];
  const declined = new Set(options.declinedPlayerIds ?? []);
  const restoredPlayerIds = path
    .map(({ loserId }) => loserId)
    .filter((id): id is string => id !== null)
    .filter((id) => !declined.has(id));
  let bronzeSlot: MatchSlot | null = null;
  let originalBronzeSource: MatchSource | null = null;
  if (
    candidate.match.id === bracket.finalMatchId &&
    candidate.source.type === "winner"
  ) {
    const bronze = bracket.matches.find(
      ({ id }) => id === bracket.bronzeMatchId,
    )!;
    for (const slot of ["A", "B"] as const) {
      const source = sourceAt(bronze, slot);
      if (
        source.type === "loser" &&
        source.matchId === candidate.source.matchId
      ) {
        bronzeSlot = slot;
        originalBronzeSource = source;
      }
    }
  }
  return {
    method,
    playerId: player.id,
    protectedPlayerId: candidate.playerId,
    restoredPlayerIds,
    lineageMatchIds: path.map(({ id }) => id),
    targetMatchId: candidate.match.id,
    targetSlot: candidate.slot,
    originalTargetSource: candidate.source,
    bronzeSlot,
    originalBronzeSource,
    timing: timingPlan(bracket, restoredPlayerIds.length + 1, options),
  };
}
