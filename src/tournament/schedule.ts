import type { Match, TournamentBracket } from "./types";

function participantIds(match: Match): string[] {
  return [...(match.sideA?.memberIds ?? []), ...(match.sideB?.memberIds ?? [])];
}

function lastPlayedAt(playerId: string, completedMatches: Match[]): number {
  return completedMatches.reduce((latest, match) => {
    if (
      match.completedAt &&
      (match.sideA?.memberIds.includes(playerId) ||
        match.sideB?.memberIds.includes(playerId))
    ) {
      return Math.max(latest, match.completedAt);
    }
    return latest;
  }, 0);
}

export function getReadySchedule(bracket: TournamentBracket): Match[] {
  if (bracket.matches.some(({ status }) => status === "live")) return [];
  const pendingChallenges = bracket.matches.filter(
    ({ kind, status }) => kind === "challenge" && status !== "complete",
  );
  if (pendingChallenges.length) {
    return pendingChallenges
      .filter(({ status }) => status === "ready")
      .sort((left, right) => left.ordinal - right.ordinal);
  }
  const completed = bracket.matches.filter(
    (match) => match.status === "complete",
  );
  if (bracket.format === "round-robin-finals") {
    const incomplete = bracket.matches.filter(
      ({ kind, status }) => kind === "round-robin" && status !== "complete",
    );
    const round = Math.min(...incomplete.map((match) => match.round));
    const ready = incomplete.length
      ? incomplete.filter(
          (match) => match.round === round && match.status === "ready",
        )
      : bracket.matches.filter(
          (match) =>
            match.status === "ready" &&
            (match.id === bracket.bronzeMatchId ||
              match.id === bracket.finalMatchId),
        );
    return sortByRest(ready, completed);
  }
  const incompleteElimination = bracket.matches.filter(
    (match) => match.kind === "elimination" && match.status !== "complete",
  );
  const firstRound = Math.min(
    ...incompleteElimination.map(({ round }) => round),
  );
  const candidates = bracket.matches.filter((match) => {
    if (match.status !== "ready" || match.round !== firstRound) return false;
    if (
      match.id === bracket.finalMatchId &&
      bracket.matches.find(({ id }) => id === bracket.bronzeMatchId)?.status !==
        "complete"
    ) {
      return false;
    }
    return true;
  });
  if (!candidates.length) return [];
  return sortByRest(candidates, completed);
}

function sortByRest(candidates: Match[], completed: Match[]): Match[] {
  return candidates.toSorted((left, right) => {
    if (left.kind !== right.kind) return left.kind === "bronze" ? -1 : 1;
    const leftRecent = Math.max(
      ...participantIds(left).map((id) => lastPlayedAt(id, completed)),
    );
    const rightRecent = Math.max(
      ...participantIds(right).map((id) => lastPlayedAt(id, completed)),
    );
    return leftRecent - rightRecent || left.ordinal - right.ordinal;
  });
}

export function getNextMatch(bracket: TournamentBracket): Match | null {
  return getReadySchedule(bracket)[0] ?? null;
}
