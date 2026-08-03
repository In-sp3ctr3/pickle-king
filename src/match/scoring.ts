import type { MatchTeam, ScoringAction, ScoringState } from "./types";

export function createScoringState(input: {
  sideA: ScoringState["sideA"];
  sideB: ScoringState["sideB"];
  labelA: string;
  labelB: string;
  participantNames?: ScoringState["participantNames"];
  targetScore: number;
  durationMs: number | null;
}): ScoringState {
  if (
    !Number.isInteger(input.targetScore) ||
    input.targetScore < 1 ||
    input.targetScore > 99 ||
    (input.durationMs !== null &&
      (!Number.isFinite(input.durationMs) || input.durationMs < 1_000))
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

export function remainingMs(state: ScoringState, now: number): number | null {
  if (state.durationMs === null) return null;
  if (state.status === "running" && state.deadline !== null) {
    return Math.max(0, state.deadline - now);
  }
  return Math.max(0, state.pausedRemainingMs ?? 0);
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

function adjust(
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
    };
  }
  const state = tick(initial, now);
  if (!["running", "paused", "golden-point"].includes(state.status)) {
    return state;
  }
  const key = team === "A" ? "scoreA" : "scoreB";
  const nextScore = Math.max(0, state[key] + delta);
  if (nextScore === state[key]) return state;
  const next = { ...state, [key]: nextScore };
  if (state.status === "golden-point" && delta < 0) {
    return finish(next, next.scoreA > next.scoreB ? "A" : "B", "buzzer", now);
  }
  if (delta < 0) return next;
  if (state.status === "golden-point") {
    return finish(next, team, "golden-point", now);
  }
  const lead = Math.abs(next.scoreA - next.scoreB);
  if (nextScore >= state.targetScore && lead >= 2) {
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
        deadline:
          state.pausedRemainingMs === null
            ? null
            : action.now + state.pausedRemainingMs,
      };
    case "tick":
      return tick(state, action.now);
    case "adjust":
      return adjust(state, action.team, action.delta, action.now);
    case "pause":
      if (state.status !== "running") return state;
      {
        const current = tick(state, action.now);
        if (current.status !== "running") return current;
        return {
          ...current,
          status: "paused",
          pausedRemainingMs: remainingMs(current, action.now),
          deadline: null,
        };
      }
    case "resume":
      if (state.status !== "paused") return state;
      return {
        ...state,
        status: "running",
        deadline:
          state.pausedRemainingMs === null
            ? null
            : action.now + state.pausedRemainingMs,
      };
    case "end-early": {
      const current = tick(state, action.now);
      if (current !== state) return current;
      if (
        !["running", "paused", "golden-point", "editing-result"].includes(
          current.status,
        )
      ) {
        return current;
      }
      const leader =
        current.scoreA === current.scoreB
          ? action.winner
          : current.scoreA > current.scoreB
            ? "A"
            : "B";
      if (!leader) return current;
      return finish(
        current,
        leader,
        current.scoreA === current.scoreB
          ? "operator-selection"
          : "ended-early",
        action.now,
      );
    }
    case "edit-result":
      if (state.status !== "awaiting-confirmation") return state;
      return {
        ...state,
        status: "editing-result",
        winner: null,
        finishReason: null,
      };
    case "review-result": {
      if (state.status !== "editing-result" || state.scoreA === state.scoreB) {
        return state;
      }
      const winner = state.scoreA > state.scoreB ? "A" : "B";
      const winningScore = winner === "A" ? state.scoreA : state.scoreB;
      const lead = Math.abs(state.scoreA - state.scoreB);
      return finish(
        state,
        winner,
        winningScore >= state.targetScore && lead >= 2
          ? "target"
          : "ended-early",
        action.now,
      );
    }
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
