import {
  quickMatchRecord,
  recordQuickMatch,
  recordTournament,
  syncTournamentArchive,
  tournamentArchive,
} from "../history";
import { scoringReducer, winnerComebackDeficit } from "../match/scoring";
import {
  applyLateEntry,
  completeMatch,
  correctMatchResult,
  createTournamentBracket,
  matchStageLabel,
  rebalanceRemainingCap,
  renameTournamentPlayer,
  startMatch,
  undoLateEntry,
} from "../tournament";
import type { AppAction, AppState } from "./types";

function rebalanceTournament(state: AppState, now: number) {
  const bracket = state.tournament;
  if (!bracket || !state.sessionDeadline) return bracket;
  const unfinished = bracket.matches.filter(
    ({ status }) => status !== "complete",
  );
  const currentCapMs = unfinished[0]?.config.capMs;
  if (currentCapMs === null || currentCapMs === undefined) return bracket;
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

export function startTournamentMatch(
  state: AppState,
  action: Extract<AppAction, { type: "start-match" }>,
): AppState {
  if (!state.tournament) return state;
  const rebalanced = rebalanceTournament(state, action.now) ?? state.tournament;
  const tournament = startMatch(rebalanced, action.matchId, action.now);
  const match = tournament.matches.find(({ id }) => id === action.matchId)!;
  const names = new Map(tournament.players.map(({ id, name }) => [id, name]));
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
      scoreEvents: [],
      stageLabel: matchStageLabel(tournament, match) ?? undefined,
    },
    quickMatch: false,
  };
}

export function confirmAppResult(
  state: AppState,
  action: Extract<AppAction, { type: "confirm-result" }>,
): AppState {
  if (!state.scorer || state.scorer.status !== "awaiting-confirmation") {
    return state;
  }
  if (state.quickMatch) {
    const scorer = scoringReducer(state.scorer, { type: "confirm" });
    return {
      ...state,
      updatedAt: action.now,
      screen: "quick-setup",
      scorer: null,
      quickMatch: false,
      history: recordQuickMatch(
        state.history,
        quickMatchRecord(scorer, action.now),
      ),
    };
  }
  if (!state.tournament || !state.activeMatchId) return state;
  const scorer = state.scorer;
  const tournament = completeMatch(
    state.tournament,
    state.activeMatchId,
    scorer.scoreA,
    scorer.scoreB,
    action.now,
    scorer.scoreA === scorer.scoreB
      ? scorer.winner === "A"
        ? scorer.sideA.memberIds[0]
        : scorer.winner === "B"
          ? scorer.sideB.memberIds[0]
          : undefined
      : undefined,
    winnerComebackDeficit(scorer),
  );
  const done = tournament.matches.every(({ status }) => status === "complete");
  return {
    ...state,
    updatedAt: action.now,
    screen: done ? "results" : "bracket",
    tournament,
    activeMatchId: null,
    scorer: null,
    history: done
      ? recordTournament(
          state.history,
          tournamentArchive(tournament, action.now),
        )
      : state.history,
  };
}

export function renamePlayerInState(
  state: AppState,
  action: Extract<AppAction, { type: "rename-player" }>,
): AppState {
  if (!state.tournament) return state;
  const tournament = renameTournamentPlayer(
    state.tournament,
    action.playerId,
    action.name,
  );
  const nameById = new Map(
    tournament.players.map(({ id, name }) => [id, name]),
  );
  const sideLabel = (memberIds: string[]) =>
    memberIds.map((id) => nameById.get(id) ?? "Player").join(" + ");
  return {
    ...state,
    updatedAt: action.now,
    tournament,
    history: syncTournamentArchive(state.history, state.tournament, tournament),
    setupDraft: state.setupDraft
      ? {
          ...state.setupDraft,
          players: tournament.players.map(({ id, name, rating }) => ({
            id,
            name,
            rating,
          })),
        }
      : null,
    scorer: state.scorer
      ? {
          ...state.scorer,
          labelA: sideLabel(state.scorer.sideA.memberIds),
          labelB: sideLabel(state.scorer.sideB.memberIds),
        }
      : null,
  };
}

export function rebuildTournamentInState(
  state: AppState,
  action: Extract<AppAction, { type: "rebuild-tournament" }>,
): AppState {
  if (!state.setupDraft || state.activeMatchId) return state;
  const tournament = createTournamentBracket(
    action.players,
    state.setupDraft.config,
  );
  return {
    ...state,
    updatedAt: action.now,
    screen: "bracket",
    setupDraft: { ...state.setupDraft, players: action.players },
    tournament,
    history: syncTournamentArchive(
      state.history,
      state.tournament ?? tournament,
      null,
    ),
    activeMatchId: null,
    scorer: null,
    quickMatch: false,
  };
}

export function insertLatePlayerInState(
  state: AppState,
  action: Extract<AppAction, { type: "apply-late-entry" }>,
): AppState {
  if (!state.tournament || !state.setupDraft || state.activeMatchId)
    return state;
  const tournament = applyLateEntry(
    state.tournament,
    action.player,
    action.plan,
    {
      createdAt: action.now,
      declinedPlayerIds: action.declinedPlayerIds,
      removeTimeLimit: action.removeTimeLimit,
    },
  );
  return {
    ...state,
    updatedAt: action.now,
    screen: "bracket",
    tournament,
    setupDraft: {
      players: tournament.players.map(({ id, name, rating }) => ({
        id,
        name,
        rating,
      })),
      config: action.removeTimeLimit
        ? { ...state.setupDraft.config, timingMode: "untimed" }
        : state.setupDraft.config,
    },
    sessionDeadline: action.removeTimeLimit ? null : state.sessionDeadline,
  };
}

export function undoLatePlayerInState(
  state: AppState,
  action: Extract<AppAction, { type: "undo-late-entry" }>,
): AppState {
  if (!state.tournament || !state.setupDraft || state.activeMatchId)
    return state;
  const amendment = state.tournament.amendments.at(-1);
  if (!amendment) return state;
  const tournament = undoLateEntry(state.tournament);
  return {
    ...state,
    updatedAt: action.now,
    tournament,
    setupDraft: {
      players: tournament.players.map(({ id, name, rating }) => ({
        id,
        name,
        rating,
      })),
      config: {
        ...state.setupDraft.config,
        timingMode:
          amendment.timing.currentCapMs === null ? "untimed" : "timed",
      },
    },
    sessionDeadline: amendment.timing.sessionDeadline,
  };
}

export function correctTournamentInState(
  state: AppState,
  action: Extract<AppAction, { type: "correct-result" }>,
): AppState {
  if (!state.tournament) return state;
  const tournament = correctMatchResult(
    state.tournament,
    action.matchId,
    action.scoreA,
    action.scoreB,
    action.now,
    action.confirmDownstreamReset,
    action.winnerIdOverride,
  );
  return {
    ...state,
    updatedAt: action.now,
    screen: "bracket",
    tournament,
    history: syncTournamentArchive(state.history, state.tournament, tournament),
    activeMatchId: null,
    scorer: null,
  };
}
