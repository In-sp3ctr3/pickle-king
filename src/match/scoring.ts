import type { MatchTeam, ScoringAction, ScoringState } from "./types";

export function createScoringState(input: {
  sideA: ScoringState["sideA"];
  sideB: ScoringState["sideB"];
  labelA: string;
  labelB: string;
  targetScore: number;
  durationMs: number;
}): ScoringState {
  if (
    !Number.isInteger(input.targetScore) ||
    input.targetScore < 1 ||
    input.targetScore > 99 ||
    !Number.isFinite(input.durationMs) ||
    input.durationMs < 1_000
  ) {
    throw new Error("Target and duration must be valid.");
  }
  if (
    input.sideA.memberIds.length < 1 ||
    input.sideA.memberIds.length > 2 ||
    input.sideB.memberIds.length < 1 ||
    input.sideB.memberIds.length > 2
  ) {
    throw new Error("Each side needs one or two players.");
  }
  return {
    ...input,
    scoreA: 0,
    scoreB: 0,
    status: "idle",
    deadline: null,
    pausedRemainingMs: input.durationMs,
    winner: null,
    finishReason: null,
  };
}

export function remainingMs(state: ScoringState, now: number): number {
  if (state.status === "running" && state.deadline !== null) {
    return Math.max(0, state.deadline - now);
  }
  return Math.max(0, state.pausedRemainingMs);
}

function finish(
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

function tick(state: ScoringState, now: number): ScoringState {
  if (
    state.status !== "running" ||
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

function adjust(
  initial: ScoringState,
  team: MatchTeam,
  delta: 1 | -1,
  now: number,
): ScoringState {
  const state = tick(initial, now);
  if (!["running", "paused", "golden-point"].includes(state.status)) {
    return state;
  }
  const key = team === "A" ? "scoreA" : "scoreB";
  const nextScore = Math.max(0, state[key] + delta);
  if (nextScore === state[key]) return state;
  const next = { ...state, [key]: nextScore };
  if (delta < 0) return next;
  if (state.status === "golden-point") {
    return finish(next, team, "golden-point", now);
  }
  if (nextScore >= state.targetScore) {
    return finish(next, team, "target", now);
  }
  return next;
}

export function scoringReducer(
  state: ScoringState,
  action: ScoringAction,
): ScoringState {
  switch (action.type) {
    case "start":
      if (state.status !== "idle") return state;
      return {
        ...state,
        status: "running",
        deadline: action.now + state.pausedRemainingMs,
      };
    case "tick":
      return tick(state, action.now);
    case "adjust":
      return adjust(state, action.team, action.delta, action.now);
    case "pause":
      if (state.status !== "running") return state;
      return {
        ...state,
        status: "paused",
        pausedRemainingMs: remainingMs(state, action.now),
        deadline: null,
      };
    case "resume":
      if (state.status !== "paused") return state;
      return {
        ...state,
        status: "running",
        deadline: action.now + state.pausedRemainingMs,
      };
    case "reopen":
      if (state.status !== "awaiting-confirmation") return state;
      return {
        ...state,
        status: "paused",
        winner: null,
        finishReason: null,
      };
    case "reset":
      return {
        ...state,
        scoreA: 0,
        scoreB: 0,
        status: "idle",
        deadline: null,
        pausedRemainingMs: state.durationMs,
        winner: null,
        finishReason: null,
      };
    case "confirm":
      return state.status === "awaiting-confirmation"
        ? { ...state, status: "complete" }
        : state;
  }
}
