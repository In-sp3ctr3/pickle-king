"use client";

import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { BracketScreen } from "../features/bracket";
import { HomeScreen } from "../features/home";
import { MatchScreen } from "../features/live-match";
import { QuickMatchSetup } from "../features/quick-match";
import { ResultsScreen } from "../features/results";
import { TournamentSetup } from "../features/setup";
import { usePwa } from "../features/pwa";
import {
  clearSnapshot,
  loadSnapshot,
  saveSnapshot,
} from "../persistence/storage";
import type { ScoringAction } from "../match/types";
import { correctionNeedsConfirmation } from "../tournament";
import {
  isHistoryScreen,
  setupPlayers,
  stateFromSnapshot,
} from "./app-helpers";
import { promptForCorrection } from "./correction-prompt";
import { appReducer, initialAppState, toSnapshot } from "./reducer";
import { AppNavigation } from "./app-navigation";
import { sessionTimeLabel, timingAdjustment } from "./timing-view";
const noop = () => undefined;

export function AppShell() {
  const [state, dispatch] = useReducer(appReducer, initialAppState(0));
  const [now, setNow] = useState(() => Date.now());
  const previousScreen = useRef(state.screen);
  const focusedScreen = useRef(state.screen);
  const pwa = usePwa(state.screen === "live" || state.screen === "quick-live");

  useEffect(() => {
    queueMicrotask(() =>
      dispatch({
        type: "hydrate",
        state: stateFromSnapshot(loadSnapshot(window.localStorage)),
      }),
    );
  }, []);
  useEffect(() => {
    if (!state.hydrated) return;
    const snapshot = toSnapshot(state);
    if (snapshot) saveSnapshot(window.localStorage, snapshot);
  }, [state]);
  useEffect(() => {
    if (!state.hydrated || state.screen === "recovery") return;
    const hash = `#${state.screen}`;
    if (window.location.hash !== hash) {
      const method =
        previousScreen.current === state.screen ? "replaceState" : "pushState";
      window.history[method](null, "", hash);
    }
    previousScreen.current = state.screen;
  }, [state.hydrated, state.screen]);
  useEffect(() => {
    if (!state.hydrated || focusedScreen.current === state.screen) return;
    focusedScreen.current = state.screen;
    window.scrollTo({ behavior: "auto", left: 0, top: 0 });
    const frame = window.requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>("main h1");
      if (!heading) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state.hydrated, state.screen]);
  useEffect(() => {
    const syncFromHash = () => {
      const screen = window.location.hash.slice(1);
      if (isHistoryScreen(screen)) {
        dispatch({ type: "navigate", screen });
      }
    };
    window.addEventListener("popstate", syncFromHash);
    return () => window.removeEventListener("popstate", syncFromHash);
  }, []);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

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
      if (!state.tournament) return;
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
        return;
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
    },
    [state.tournament],
  );

  if (!state.hydrated) {
    return <HomeScreen onQuickMatch={noop} onStartTournament={noop} />;
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
        <BracketScreen
          bracket={state.tournament}
          onCorrectMatch={(matchId) => {
            const match = state.tournament?.matches.find(
              ({ id }) => id === matchId,
            );
            if (!match?.sideA || !match.sideB || !state.tournament) return;
            const names = new Map(
              state.tournament.players.map(({ id, name }) => [id, name]),
            );
            const sideAId = match.sideA.memberIds[0];
            const sideBId = match.sideB.memberIds[0];
            const result = promptForCorrection({
              currentScoreA: match.scoreA,
              currentScoreB: match.scoreB,
              currentWinnerId: match.winnerId,
              prompt: (message, defaultValue) =>
                window.prompt(message, defaultValue),
              sideA: { id: sideAId, label: names.get(sideAId) ?? "Side A" },
              sideB: { id: sideBId, label: names.get(sideBId) ?? "Side B" },
            });
            if (result) {
              correctResult(
                matchId,
                result.scoreA,
                result.scoreB,
                result.winnerIdOverride,
              );
            }
          }}
          onStartMatch={(matchId) =>
            dispatch({ type: "start-match", matchId, now: Date.now() })
          }
          sessionLabel={sessionTimeLabel(
            state.sessionDeadline,
            Math.max(now, state.updatedAt),
          )}
          timingWarning={timingAdjustment(
            state.tournament,
            state.setupDraft?.config,
          )}
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
          standalone={state.screen === "quick-live"}
        />
      ) : null}
      {state.screen === "quick-setup" ? (
        <QuickMatchSetup
          onStart={(scorer) =>
            dispatch({ type: "start-quick", scorer, now: Date.now() })
          }
        />
      ) : null}
      {state.screen === "results" && state.tournament ? (
        <ResultsScreen bracket={state.tournament} onCorrect={correctResult} />
      ) : null}
    </div>
  );
}
