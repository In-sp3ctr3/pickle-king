"use client";

import { AlertTriangle } from "lucide-react";
import { useCallback, useReducer, useState } from "react";
import { HomeScreen } from "../features/home";
import { HistoryScreen } from "../features/history";
import { MatchScreen } from "../features/live-match";
import { QuickMatchSetup } from "../features/quick-match";
import { ResultsScreen } from "../features/results";
import { TournamentSetup } from "../features/setup";
import { usePwa } from "../features/pwa";
import { clearSnapshot } from "../persistence/storage";
import { clearHistory } from "../persistence/history-storage";
import { rememberedPlayerNames } from "../history";
import type { ScoringAction } from "../match/types";
import {
  correctionNeedsConfirmation,
  lateEntryCorrectionBlockReason,
} from "../tournament";
import { setupPlayers } from "./app-helpers";
import { TournamentBracketRoute } from "./bracket-route";
import { appReducer, initialAppState } from "./reducer";
import { AppNavigation } from "./app-navigation";
import { useAppLifecycle } from "./use-app-lifecycle";
const noop = () => undefined;

export function AppShell() {
  const [state, dispatch] = useReducer(appReducer, initialAppState(0));
  const [handoffNames, setHandoffNames] = useState<string[]>([]);
  const now = useAppLifecycle(state, dispatch);
  const pwa = usePwa(state.screen === "live" || state.screen === "quick-live");

  const score = useCallback(
    (action: ScoringAction) =>
      dispatch({ type: "score", action, now: Date.now() }),
    [],
  );
  const correctResult = useCallback(
    (
      matchId: string,
      scoreA: number,
      scoreB: number,
      winnerIdOverride?: string,
    ) => {
      if (!state.tournament) return false;
      const lateEntryBlock = lateEntryCorrectionBlockReason(
        state.tournament,
        matchId,
      );
      if (lateEntryBlock) {
        window.alert(lateEntryBlock);
        return false;
      }
      const needsConfirmation = correctionNeedsConfirmation(
        state.tournament,
        matchId,
      );
      if (
        needsConfirmation &&
        !window.confirm(
          "A later match has started. Correcting this result will reset every affected downstream result. Continue?",
        )
      ) {
        return false;
      }
      dispatch({
        type: "correct-result",
        matchId,
        scoreA,
        scoreB,
        winnerIdOverride,
        confirmDownstreamReset: needsConfirmation,
        now: Date.now(),
      });
      return true;
    },
    [state.tournament],
  );

  if (!state.hydrated) {
    return (
      <HomeScreen hydrating onQuickMatch={noop} onStartTournament={noop} />
    );
  }
  if (state.screen === "recovery") {
    return (
      <main className="recovery-screen">
        <AlertTriangle aria-hidden="true" size={42} />
        <p className="eyebrow">Recovery needed</p>
        <h1>Saved session damaged.</h1>
        <p>
          {state.recoveryMessage} Your data was not silently deleted. Reset the
          on-device session to continue.
        </p>
        <button
          className="primary-button"
          onClick={() => {
            clearSnapshot(window.localStorage);
            dispatch({ type: "reset", now: Date.now() });
          }}
          type="button"
        >
          Reset local session
        </button>
      </main>
    );
  }

  const resume = () => {
    if (state.scorer && state.activeMatchId) {
      dispatch({ type: "navigate", screen: "live" });
    } else if (state.tournament) {
      const done = state.tournament.matches.every(
        ({ status }) => status === "complete",
      );
      dispatch({ type: "navigate", screen: done ? "results" : "bracket" });
    }
  };
  return (
    <div className="app-shell">
      <AppNavigation
        onNavigate={(screen) => dispatch({ type: "navigate", screen })}
        screen={state.screen}
      />
      {state.screen === "home" ? (
        <HomeScreen
          onInstall={pwa.canInstall ? pwa.install : undefined}
          onQuickMatch={() =>
            dispatch({ type: "navigate", screen: "quick-setup" })
          }
          onHistory={() => dispatch({ type: "navigate", screen: "history" })}
          onResume={state.tournament ? resume : undefined}
          onStartTournament={() =>
            dispatch({ type: "navigate", screen: "setup" })
          }
        />
      ) : null}
      {state.screen === "setup" ? (
        <TournamentSetup
          initialValues={
            state.setupDraft
              ? {
                  ...state.setupDraft.config,
                  players: state.setupDraft.players,
                }
              : undefined
          }
          onQuickMatch={() =>
            dispatch({ type: "navigate", screen: "quick-setup" })
          }
          onSubmit={(values) =>
            dispatch({
              type: "create-tournament",
              players: setupPlayers(values),
              config: {
                timingMode: values.timingMode,
                drawStyle: values.drawStyle,
                bookingMinutes: values.bookingMinutes,
                warmupMinutes: values.warmupMinutes,
                transitionSeconds: values.transitionSeconds,
                targetScore: values.targetScore,
                randomSeed: crypto.randomUUID(),
              },
              now: Date.now(),
            })
          }
        />
      ) : null}
      {state.screen === "bracket" && state.tournament ? (
        <TournamentBracketRoute
          correctResult={correctResult}
          dispatch={dispatch}
          now={now}
          onQuickHandoff={(name) => setHandoffNames([name])}
          state={state}
        />
      ) : null}
      {(state.screen === "live" || state.screen === "quick-live") &&
      state.scorer ? (
        <MatchScreen
          onAction={score}
          onConfirm={() =>
            dispatch({ type: "confirm-result", now: Date.now() })
          }
          onDiscard={() => dispatch({ type: "discard-match", now: Date.now() })}
          onExit={() => dispatch({ type: "navigate", screen: "home" })}
          scorer={state.scorer}
          sessionDeadline={state.quickMatch ? null : state.sessionDeadline}
        />
      ) : null}
      {state.screen === "quick-setup" ? (
        <QuickMatchSetup
          onStart={(scorer) =>
            dispatch({ type: "start-quick", scorer, now: Date.now() })
          }
          suggestions={rememberedPlayerNames(state.history, [
            ...handoffNames,
            ...(
              state.tournament?.players ??
              state.setupDraft?.players ??
              []
            ).map(({ name }) => name),
          ])}
        />
      ) : null}
      {state.screen === "results" && state.tournament ? (
        <ResultsScreen
          bracket={state.tournament}
          onNewDraw={() =>
            dispatch({ type: "prepare-new-draw", now: Date.now() })
          }
          onReplaySame={() =>
            dispatch({ type: "replay-same-draw", now: Date.now() })
          }
          onViewBracket={() =>
            dispatch({ type: "navigate", screen: "bracket" })
          }
        />
      ) : null}
      {state.screen === "history" ? (
        <HistoryScreen
          history={state.history}
          onRemove={(id, kind) =>
            dispatch({ type: "remove-history", id, kind, now: Date.now() })
          }
          onReset={() => {
            clearHistory(window.localStorage);
            dispatch({ type: "reset-history", now: Date.now() });
          }}
          recoveryMessage={state.historyRecoveryMessage}
        />
      ) : null}
    </div>
  );
}
