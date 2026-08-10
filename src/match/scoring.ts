import { repairedService } from "./service";
import {
  adjust,
  finish,
  rally,
  remainingMs,
  tick,
} from "./scoring-transitions";
import type { ScoringAction, ScoringState } from "./types";

export { remainingMs } from "./scoring-transitions";

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
    scoreEvents: [],
    service: null,
    rallyHistory: [],
    rightEndTeam: "A",
  };
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
        service: "service" in action ? action.service : state.service,
        status: "running",
        deadline:
          state.pausedRemainingMs === null
            ? null
            : action.now + state.pausedRemainingMs,
      };
    case "configure-serve":
      return ["running", "paused", "golden-point"].includes(state.status)
        ? { ...state, service: action.service, rallyHistory: [] }
        : state;
    case "tick":
      return tick(state, action.now);
    case "adjust":
      return adjust(state, action.team, action.delta, action.now);
    case "rally":
      return rally(state, action.team, action.now);
    case "undo-rally": {
      const previous = state.rallyHistory.at(-1);
      if (
        !previous ||
        !["running", "paused", "golden-point"].includes(state.status)
      )
        return state;
      return {
        ...state,
        scoreA: previous.scoreA,
        scoreB: previous.scoreB,
        service: previous.service,
        scoreEvents:
          previous.scoredTeam === null
            ? state.scoreEvents
            : state.scoreEvents.slice(0, -1),
        rallyHistory: state.rallyHistory.slice(0, -1),
      };
    }
    case "repair-serve":
      return state.service &&
        ["running", "paused", "golden-point"].includes(state.status)
        ? {
            ...state,
            service: repairedService(
              {
                scores: { A: state.scoreA, B: state.scoreB },
                service: state.service,
                sides: state,
              },
              action.turn,
            ),
          }
        : state;
    case "swap-court-ends":
      return ["running", "paused", "golden-point"].includes(state.status)
        ? {
            ...state,
            rightEndTeam: (state.rightEndTeam ?? "A") === "A" ? "B" : "A",
          }
        : state;
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
        scoreEvents: [],
        service: null,
        rallyHistory: [],
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
        scoreEvents: [],
        service: null,
        rallyHistory: [],
      };
    case "confirm":
      return state.status === "awaiting-confirmation"
        ? { ...state, status: "complete" }
        : state;
  }
}

export function winnerComebackDeficit(state: ScoringState): number {
  if (!state.winner) return 0;
  let scoreA = 0;
  let scoreB = 0;
  let largestDeficit = 0;
  for (const team of state.scoreEvents) {
    if (team === "A") scoreA += 1;
    else scoreB += 1;
    const deficit = state.winner === "A" ? scoreB - scoreA : scoreA - scoreB;
    largestDeficit = Math.max(largestDeficit, deficit);
  }
  return largestDeficit;
}
