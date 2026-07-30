import { completeMatch } from "./bracket";
import { getNextMatch } from "./schedule";
import type { Match, TournamentBracket } from "./types";

export function startMatch(
  bracket: TournamentBracket,
  matchId: string,
  startedAt: number,
): TournamentBracket {
  if (!Number.isFinite(startedAt)) throw new Error("Start time must be valid.");
  if (getNextMatch(bracket)?.id !== matchId) {
    throw new Error("Only the next scheduled match can start.");
  }
  return {
    ...bracket,
    matches: bracket.matches.map((match) =>
      match.id === matchId
        ? { ...match, status: "live" as const, startedAt }
        : match,
    ),
  };
}

function dependentMatchIds(matches: Match[], matchId: string): Set<string> {
  const affected = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const match of matches) {
      const sourceIds = [match.sourceA, match.sourceB]
        .filter(({ type }) => type !== "player")
        .map((source) => ("matchId" in source ? source.matchId : ""));
      if (
        !affected.has(match.id) &&
        sourceIds.some((id) => id === matchId || affected.has(id))
      ) {
        affected.add(match.id);
        changed = true;
      }
    }
  }
  return affected;
}

export function correctionNeedsConfirmation(
  bracket: TournamentBracket,
  matchId: string,
): boolean {
  const affected = dependentMatchIds(bracket.matches, matchId);
  return bracket.matches.some(
    (match) =>
      affected.has(match.id) &&
      (match.startedAt !== null || match.status === "complete"),
  );
}

export function correctMatchResult(
  bracket: TournamentBracket,
  matchId: string,
  scoreA: number,
  scoreB: number,
  completedAt: number,
  confirmDownstreamReset = false,
): TournamentBracket {
  const target = bracket.matches.find(({ id }) => id === matchId);
  if (!target || target.status !== "complete") {
    throw new Error("Only a completed match can be corrected.");
  }
  const affected = dependentMatchIds(bracket.matches, matchId);
  const hasStartedDependent = correctionNeedsConfirmation(bracket, matchId);
  if (hasStartedDependent && !confirmDownstreamReset) {
    throw new Error("Confirm reset of affected downstream results.");
  }
  const reset = bracket.matches.map((match) => {
    if (match.id === matchId) {
      return {
        ...match,
        scoreA: 0,
        scoreB: 0,
        status: "ready" as const,
        winnerId: null,
        loserId: null,
        startedAt: null,
        completedAt: null,
      };
    }
    if (!affected.has(match.id)) return match;
    return {
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
    };
  });
  return completeMatch(
    { ...bracket, matches: reset },
    matchId,
    scoreA,
    scoreB,
    completedAt,
  );
}
