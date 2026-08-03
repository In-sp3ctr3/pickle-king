import { scoringReducer } from "../match/scoring";
import { emptySessionHistory } from "../history";
import type { TournamentSnapshotV1 } from "../persistence/schema";
import { abandonMatch, createTournamentBracket } from "../tournament";
import type { AppAction, AppState } from "./types";
import {
  confirmAppResult,
  correctTournamentInState,
  rebuildTournamentInState,
  renamePlayerInState,
  startTournamentMatch,
} from "./tournament-state";

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
    history: emptySessionHistory(),
    historyRecoveryMessage: null,
    hydrated,
  };
}

function touched(state: AppState, now: number): AppState {
  return { ...state, updatedAt: now };
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
        history: state.history,
        historyRecoveryMessage: state.historyRecoveryMessage,
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
        sessionDeadline:
          action.config.timingMode === "timed"
            ? action.now + action.config.bookingMinutes * 60_000
            : null,
        quickMatch: false,
      };
    }
    case "start-match":
      return startTournamentMatch(state, action);
    case "score": {
      if (!state.scorer) return state;
      const scorer = scoringReducer(state.scorer, action.action);
      if (scorer === state.scorer) return state;
      return touched({ ...state, scorer }, action.now);
    }
    case "confirm-result":
      return confirmAppResult(state, action);
    case "rename-player":
      return renamePlayerInState(state, action);
    case "rebuild-tournament":
      return rebuildTournamentInState(state, action);
    case "discard-match": {
      if (state.quickMatch) {
        return {
          ...state,
          updatedAt: action.now,
          screen: "quick-setup",
          scorer: null,
          quickMatch: false,
        };
      }
      if (!state.tournament || !state.activeMatchId) return state;
      return {
        ...state,
        updatedAt: action.now,
        screen: "bracket",
        tournament: abandonMatch(state.tournament, state.activeMatchId),
        activeMatchId: null,
        scorer: null,
      };
    }
    case "correct-result":
      return correctTournamentInState(state, action);
    case "start-quick":
      return {
        ...state,
        updatedAt: action.now,
        screen: "quick-live",
        scorer: action.scorer,
        activeMatchId: null,
        quickMatch: true,
      };
    case "reset-history":
      return touched(
        {
          ...state,
          history: emptySessionHistory(),
          historyRecoveryMessage: null,
        },
        action.now,
      );
    case "remove-history":
      return touched(
        {
          ...state,
          history: {
            ...state.history,
            quickMatches:
              action.kind === "quick"
                ? state.history.quickMatches.filter(
                    ({ id }) => id !== action.id,
                  )
                : state.history.quickMatches,
            tournaments:
              action.kind === "tournament"
                ? state.history.tournaments.filter(({ id }) => id !== action.id)
                : state.history.tournaments,
          },
        },
        action.now,
      );
    case "reset":
      return {
        ...initialAppState(action.now, true),
        history: state.history,
        historyRecoveryMessage: state.historyRecoveryMessage,
      };
  }
}
