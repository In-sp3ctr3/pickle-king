import { scoringReducer } from "../match/scoring";
import { emptySessionHistory } from "../history";
import type { TournamentSnapshotV1 } from "../persistence/schema";
import {
  abandonMatch,
  createTournament,
  resetTournamentBracket,
} from "../tournament";
import type { AppAction, AppState } from "./types";
import {
  confirmAppResult,
  correctTournamentInState,
  insertLatePlayerInState,
  rebuildTournamentInState,
  renamePlayerInState,
  startTournamentMatch,
  undoLatePlayerInState,
} from "./tournament-state";

export function initialAppState(now: number, hydrated = false): AppState {
  return {
    version: 2,
    updatedAt: now,
    screen: "home",
    setupDraft: null,
    tournament: null,
    activeMatchId: null,
    scorer: null,
    sessionDeadline: null,
    quickMatch: false,
    historyTournamentId: null,
    recoveryMessage: null,
    history: emptySessionHistory(),
    historyRecoveryMessage: null,
    hydrated,
  };
}

function touched(state: AppState, now: number): AppState {
  return { ...state, updatedAt: now };
}

function drawSignature(tournament: NonNullable<AppState["tournament"]>) {
  return JSON.stringify(
    tournament.matches.map(({ sourceA, sourceB }) => [sourceA, sourceB]),
  );
}

export function toSnapshot(state: AppState): TournamentSnapshotV1 | null {
  if (state.screen === "recovery") return null;
  return {
    version: 2,
    updatedAt: state.updatedAt,
    screen: state.screen,
    setupDraft: state.setupDraft,
    tournament: state.tournament,
    activeMatchId: state.activeMatchId,
    scorer: state.scorer,
    sessionDeadline: state.sessionDeadline,
    quickMatch: state.quickMatch,
    historyTournamentId: state.historyTournamentId,
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
      const tournament = createTournament(action.players, action.config);
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
    case "replay-same-draw": {
      if (!state.setupDraft) return state;
      return {
        ...state,
        updatedAt: action.now,
        screen: "bracket",
        tournament: state.tournament
          ? resetTournamentBracket(state.tournament)
          : createTournament(state.setupDraft.players, state.setupDraft.config),
        activeMatchId: null,
        scorer: null,
        sessionDeadline:
          state.setupDraft.config.timingMode === "timed"
            ? action.now + state.setupDraft.config.bookingMinutes * 60_000
            : null,
        quickMatch: false,
      };
    }
    case "prepare-new-draw":
      return {
        ...state,
        updatedAt: action.now,
        screen: "setup",
        tournament: null,
        activeMatchId: null,
        scorer: null,
        sessionDeadline: null,
        quickMatch: false,
      };
    case "reroll-random-draw": {
      if (
        !state.setupDraft ||
        !state.tournament ||
        state.setupDraft.config.drawStyle !== "random" ||
        state.tournament.matches.some(
          ({ status }) => status === "live" || status === "complete",
        )
      ) {
        return state;
      }
      const previousDraw = drawSignature(state.tournament);
      let randomSeed = action.randomSeed;
      let config = { ...state.setupDraft.config, randomSeed };
      let tournament = createTournament(state.setupDraft.players, config);
      for (
        let attempt = 1;
        attempt <= 8 && drawSignature(tournament) === previousDraw;
        attempt += 1
      ) {
        randomSeed = `${action.randomSeed}:${attempt}`;
        config = { ...state.setupDraft.config, randomSeed };
        tournament = createTournament(state.setupDraft.players, config);
      }
      return {
        ...state,
        updatedAt: action.now,
        setupDraft: { ...state.setupDraft, config },
        tournament,
      };
    }
    case "view-history-tournament":
      if (!state.history.tournaments.some(({ id }) => id === action.id)) {
        return { ...state, screen: "history", historyTournamentId: null };
      }
      return touched(
        {
          ...state,
          screen: "history-results",
          historyTournamentId: action.id,
        },
        action.now,
      );
    case "apply-late-entry":
      return insertLatePlayerInState(state, action);
    case "undo-late-entry":
      return undoLatePlayerInState(state, action);
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
          screen:
            action.kind === "tournament" &&
            action.id === state.historyTournamentId
              ? "history"
              : state.screen,
          historyTournamentId:
            action.kind === "tournament" &&
            action.id === state.historyTournamentId
              ? null
              : state.historyTournamentId,
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
