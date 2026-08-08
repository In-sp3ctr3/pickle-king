import { resolveBracketMatches } from "./bracket";
import { validateTournamentField } from "./editing";
import type {
  LateEntryAmendment,
  LateEntryPlan,
  Match,
  MatchSlot,
  MatchSource,
  Player,
  TournamentBracket,
} from "./types";

interface ApplyOptions {
  createdAt: number;
  declinedPlayerIds: string[];
  removeTimeLimit: boolean;
}

function withSource(match: Match, slot: MatchSlot, source: MatchSource): Match {
  return slot === "A"
    ? { ...match, sourceA: source }
    : { ...match, sourceB: source };
}

function challengeMatch(
  id: string,
  ordinal: number,
  sourceA: MatchSource,
  playerId: string,
  target: Match,
  capMs: number | null,
): Match {
  return {
    id,
    kind: "challenge",
    round: Math.max(1, target.round - 1),
    ordinal,
    sourceA,
    sourceB: { type: "player", playerId },
    sideA: sourceA.type === "player" ? { memberIds: [sourceA.playerId] } : null,
    sideB: { memberIds: [playerId] },
    config: { ...target.config, capMs },
    scoreA: 0,
    scoreB: 0,
    status: sourceA.type === "player" ? "ready" : "waiting",
    winnerId: null,
    loserId: null,
    startedAt: null,
    completedAt: null,
    comebackDeficit: 0,
  };
}

export function applyLateEntry(
  bracket: TournamentBracket,
  player: Player,
  plan: LateEntryPlan,
  options: ApplyOptions,
): TournamentBracket {
  if (bracket.format === "round-robin-finals") {
    throw new Error("Late entry is not available for round robin tournaments.");
  }
  if (plan.playerId !== player.id)
    throw new Error("Late-entry plan does not match the player.");
  if (bracket.amendments.length)
    throw new Error("Only one late-entry amendment is allowed.");
  const target = bracket.matches.find(({ id }) => id === plan.targetMatchId);
  if (!target || target.startedAt !== null || target.status === "complete") {
    throw new Error("The selected bracket slot has already started.");
  }
  if (!plan.timing.feasible && !options.removeTimeLimit) {
    throw new Error("The late-entry matches do not fit the remaining booking.");
  }
  validateTournamentField([...bracket.players, { ...player, seed: undefined }]);
  const declined = new Set(options.declinedPlayerIds);
  const restored = plan.restoredPlayerIds.filter((id) => !declined.has(id));
  const opponents = [...restored, plan.protectedPlayerId];
  const amendmentId = `late-${options.createdAt}-${player.id.replace(/[^a-z0-9-]/gi, "")}`;
  const capMs = options.removeTimeLimit ? null : plan.timing.proposedCapMs;
  const challenges: Match[] = [];
  opponents.forEach((opponentId, index) => {
    const previous = challenges[index - 1];
    challenges.push(
      challengeMatch(
        `${amendmentId}-m${index + 1}`,
        index + 1,
        previous
          ? { type: "winner", matchId: previous.id }
          : { type: "player", playerId: player.id },
        opponentId,
        target,
        capMs,
      ),
    );
  });
  const finalChallenge = challenges.at(-1)!;
  let matches = bracket.matches.map((match) => {
    let next = match;
    if (match.id === plan.targetMatchId) {
      next = withSource(match, plan.targetSlot, {
        type: "winner",
        matchId: finalChallenge.id,
      });
    }
    if (match.id === bracket.bronzeMatchId && plan.bronzeSlot) {
      next = withSource(next, plan.bronzeSlot, {
        type: "loser",
        matchId: finalChallenge.id,
      });
    }
    return next.status === "complete"
      ? next
      : { ...next, config: { ...next.config, capMs } };
  });
  matches = resolveBracketMatches([...matches, ...challenges]);
  const timing = {
    ...plan.timing,
    proposedCapMs: capMs,
    remainingMatches:
      bracket.matches.filter(({ status }) => status !== "complete").length +
      challenges.length,
  };
  const amendment: LateEntryAmendment = {
    ...plan,
    timing,
    restoredPlayerIds: restored,
    id: amendmentId,
    createdAt: options.createdAt,
    challengeMatchIds: challenges.map(({ id }) => id),
    declinedPlayerIds: [...declined],
  };
  return {
    ...bracket,
    players: [
      ...bracket.players,
      { id: player.id, name: player.name.trim(), rating: player.rating },
    ],
    matches,
    amendments: [amendment],
  };
}

export function undoLateEntry(bracket: TournamentBracket): TournamentBracket {
  const amendment = bracket.amendments.at(-1);
  if (!amendment) throw new Error("There is no late-entry amendment to undo.");
  const challengeIds = new Set(amendment.challengeMatchIds);
  if (
    bracket.matches.some(
      ({ id, startedAt, status }) =>
        challengeIds.has(id) && (startedAt !== null || status === "complete"),
    )
  ) {
    throw new Error("The late-entry challenge has already started.");
  }
  let matches = bracket.matches
    .filter(({ id }) => !challengeIds.has(id))
    .map((match) => {
      let next = match;
      if (match.id === amendment.targetMatchId) {
        next = withSource(
          match,
          amendment.targetSlot,
          amendment.originalTargetSource,
        );
      }
      if (
        match.id === bracket.bronzeMatchId &&
        amendment.bronzeSlot &&
        amendment.originalBronzeSource
      ) {
        next = withSource(
          next,
          amendment.bronzeSlot,
          amendment.originalBronzeSource,
        );
      }
      return next.status === "complete"
        ? next
        : {
            ...next,
            config: { ...next.config, capMs: amendment.timing.currentCapMs },
          };
    });
  matches = resolveBracketMatches(matches);
  return {
    ...bracket,
    players: bracket.players.filter(({ id }) => id !== amendment.playerId),
    matches,
    amendments: bracket.amendments.slice(0, -1),
  };
}

export function lateEntryCorrectionBlockReason(
  bracket: TournamentBracket,
  matchId: string,
): string | null {
  const amendment = bracket.amendments.at(-1);
  if (!amendment?.lineageMatchIds.includes(matchId)) return null;
  return "This result defines the late-entry route. Undo the amendment before correcting it.";
}
