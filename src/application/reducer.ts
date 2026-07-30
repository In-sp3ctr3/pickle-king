import { scoringReducer } from "../match/scoring";
import type { TournamentSnapshotV1 } from "../persistence/schema";
import {
  completeMatch,
  correctMatchResult,
  createTournamentBracket,
  rebalanceRemainingCap,
  startMatch,
} from "../tournament";
import type { AppAction, AppState } from "./types";

export function initialAppState(now: number, hydrated = false): AppState {
  return {
    version: 1,
    updatedAt: now,
    screen: "home",
    setupDraft: null,
    tournament: null,
    activeMatchId: null,
    scorer: null,
    sessionDeadline: null,
    quickMatch: false,
    recoveryMessage: null,
    hydrated,
  };
}

function touched(state: AppState, now: number): AppState {
  return { ...state, updatedAt: now };
}

function rebalanceTournament(state: AppState, now: number) {
  const bracket = state.tournament;
  if (!bracket || !state.sessionDeadline) return bracket;
  const unfinished = bracket.matches.filter(
    ({ status }) => status !== "complete",
  );
  const currentCapMs = unfinished[0]?.config.capMs;
  if (!currentCapMs) return bracket;
  let capMs = currentCapMs;
  try {
    capMs = rebalanceRemainingCap({
      now,
      sessionDeadline: state.sessionDeadline,
      remainingMatches: unfinished.length,
      transitionSeconds: state.setupDraft?.config.transitionSeconds ?? 0,
      currentCapMs,
    }).capMs;
  } catch {
    capMs = 1_000;
  }
  if (capMs === currentCapMs) return bracket;
  return {
    ...bracket,
    matches: bracket.matches.map((match) =>
      match.status === "complete"
        ? match
        : { ...match, config: { ...match.config, capMs } },
    ),
  };
}

export function toSnapshot(state: AppState): TournamentSnapshotV1 | null {
  if (state.screen === "recovery") return null;
  return {
    version: 1,
    updatedAt: state.updatedAt,
    screen: state.screen,
    setupDraft: state.setupDraft,
    tournament: state.tournament,
    activeMatchId: state.activeMatchId,
    scorer: state.scorer,
    sessionDeadline: state.sessionDeadline,
    quickMatch: state.quickMatch,
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "recover":
      return {
        ...initialAppState(0, true),
        screen: "recovery",
        recoveryMessage: action.message,
      };
    case "navigate":
      return { ...state, screen: action.screen };
    case "update-draft":
      return touched(
        {
          ...state,
          setupDraft: { players: action.players, config: action.config },
        },
        action.now,
      );
    case "create-tournament": {
      const tournament = createTournamentBracket(action.players, action.config);
      return {
        ...state,
        updatedAt: action.now,
        screen: "bracket",
        setupDraft: { players: action.players, config: action.config },
        tournament,
        activeMatchId: null,
        scorer: null,
        sessionDeadline: action.now + action.config.bookingMinutes * 60_000,
        quickMatch: false,
      };
    }
    case "start-match": {
      if (!state.tournament) return state;
      const rebalanced =
        rebalanceTournament(state, action.now) ?? state.tournament;
      const tournament = startMatch(rebalanced, action.matchId, action.now);
      const match = tournament.matches.find(({ id }) => id === action.matchId)!;
      const names = new Map(
        tournament.players.map(({ id, name }) => [id, name]),
      );
      const label = (ids: string[]) =>
        ids.map((id) => names.get(id) ?? "Player").join(" + ");
      return {
        ...state,
        updatedAt: action.now,
        screen: "live",
        tournament,
        activeMatchId: match.id,
        scorer: {
          sideA: match.sideA!,
          sideB: match.sideB!,
          labelA: label(match.sideA!.memberIds),
          labelB: label(match.sideB!.memberIds),
          scoreA: 0,
          scoreB: 0,
          targetScore: match.config.targetScore,
          durationMs: match.config.capMs,
          status: "idle",
          deadline: null,
          pausedRemainingMs: match.config.capMs,
          winner: null,
          finishReason: null,
        },
        quickMatch: false,
      };
    }
    case "score": {
      if (!state.scorer) return state;
      const scorer = scoringReducer(state.scorer, action.action);
      if (scorer === state.scorer) return state;
      return touched({ ...state, scorer }, action.now);
    }
    case "confirm-result": {
      if (!state.scorer || state.scorer.status !== "awaiting-confirmation") {
        return state;
      }
      if (state.quickMatch) {
        return touched(
          {
            ...state,
            scorer: scoringReducer(state.scorer, { type: "confirm" }),
          },
          action.now,
        );
      }
      if (!state.tournament || !state.activeMatchId) return state;
      const tournament = completeMatch(
        state.tournament,
        state.activeMatchId,
        state.scorer.scoreA,
        state.scorer.scoreB,
        action.now,
      );
      const done = tournament.matches.every(
        ({ status }) => status === "complete",
      );
      return {
        ...state,
        updatedAt: action.now,
        screen: done ? "results" : "bracket",
        tournament,
        activeMatchId: null,
        scorer: null,
      };
    }
    case "correct-result":
      if (!state.tournament) return state;
      return {
        ...state,
        updatedAt: action.now,
        screen: "bracket",
        tournament: correctMatchResult(
          state.tournament,
          action.matchId,
          action.scoreA,
          action.scoreB,
          action.now,
          action.confirmDownstreamReset,
        ),
        activeMatchId: null,
        scorer: null,
      };
    case "start-quick":
      return {
        ...state,
        updatedAt: action.now,
        screen: "quick-live",
        scorer: action.scorer,
        activeMatchId: null,
        quickMatch: true,
      };
    case "reset":
      return initialAppState(action.now, true);
  }
}
