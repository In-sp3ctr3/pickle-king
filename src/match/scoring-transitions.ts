import { nextService } from "./service";
import type { MatchTeam, ScoringState } from "./types";

export function remainingMs(state: ScoringState, now: number): number | null {
  if (state.durationMs === null) return null;
  if (state.status === "running" && state.deadline !== null) {
    return Math.max(0, state.deadline - now);
  }
  return Math.max(0, state.pausedRemainingMs ?? 0);
}

export function finish(
  state: ScoringState,
  winner: MatchTeam,
  reason: ScoringState["finishReason"],
  now: number,
): ScoringState {
  return {
    ...state,
    status: "awaiting-confirmation",
    deadline: null,
    pausedRemainingMs: remainingMs(state, now),
    winner,
    finishReason: reason,
  };
}

export function tick(state: ScoringState, now: number): ScoringState {
  if (
    state.status !== "running" ||
    state.durationMs === null ||
    state.deadline === null ||
    now < state.deadline
  ) {
    return state;
  }
  if (state.scoreA === state.scoreB) {
    return {
      ...state,
      status: "golden-point",
      deadline: null,
      pausedRemainingMs: 0,
      finishReason: null,
    };
  }
  return finish(state, state.scoreA > state.scoreB ? "A" : "B", "buzzer", now);
}

export function adjust(
  initial: ScoringState,
  team: MatchTeam,
  delta: 1 | -1,
  now: number,
): ScoringState {
  if (initial.status === "editing-result") {
    const key = team === "A" ? "scoreA" : "scoreB";
    return {
      ...initial,
      [key]: Math.max(0, initial[key] + delta),
      scoreEvents: [],
    };
  }
  const state = tick(initial, now);
  if (!["running", "paused", "golden-point"].includes(state.status))
    return state;
  const key = team === "A" ? "scoreA" : "scoreB";
  const nextScore = Math.max(0, state[key] + delta);
  if (nextScore === state[key]) return state;
  const scoreEvents = [...state.scoreEvents];
  if (delta > 0) scoreEvents.push(team);
  else {
    const lastTeamPoint = scoreEvents.lastIndexOf(team);
    if (lastTeamPoint >= 0) scoreEvents.splice(lastTeamPoint, 1);
  }
  const next = { ...state, [key]: nextScore, scoreEvents };
  if (state.status === "golden-point" && delta < 0) {
    return finish(next, next.scoreA > next.scoreB ? "A" : "B", "buzzer", now);
  }
  if (delta < 0) return next;
  if (state.status === "golden-point")
    return finish(next, team, "golden-point", now);
  const lead = Math.abs(next.scoreA - next.scoreB);
  return nextScore >= state.targetScore && lead >= 2
    ? finish(next, team, "target", now)
    : next;
}

export function rally(
  state: ScoringState,
  team: MatchTeam,
  now: number,
): ScoringState {
  const current = tick(state, now);
  if (
    !["running", "paused", "golden-point"].includes(current.status) ||
    !current.service
  ) {
    return current;
  }
  const next = nextService({
    scores: { A: current.scoreA, B: current.scoreB },
    service: current.service,
    sides: current,
    winner: team,
  });
  const scored =
    next.scores[team] !== current[team === "A" ? "scoreA" : "scoreB"];
  const scoreEvents = scored
    ? [...current.scoreEvents, team]
    : current.scoreEvents;
  const updated = {
    ...current,
    scoreA: next.scores.A,
    scoreB: next.scores.B,
    service: next.service,
    scoreEvents,
    rallyHistory: [
      ...current.rallyHistory,
      {
        scoreA: current.scoreA,
        scoreB: current.scoreB,
        service: current.service,
        scoredTeam: scored ? team : null,
      },
    ],
  };
  if (current.status === "golden-point" && scored) {
    return finish(updated, team, "golden-point", now);
  }
  const winningScore = team === "A" ? updated.scoreA : updated.scoreB;
  return scored &&
    winningScore >= current.targetScore &&
    Math.abs(updated.scoreA - updated.scoreB) >= 2
    ? finish(updated, team, "target", now)
    : updated;
}
