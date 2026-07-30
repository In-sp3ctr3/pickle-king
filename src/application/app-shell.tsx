"use client";

import { AlertTriangle, Crown } from "lucide-react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { BracketScreen } from "../features/bracket";
import { HomeScreen } from "../features/home";
import { MatchScreen } from "../features/live-match";
import { QuickMatchSetup } from "../features/quick-match";
import { ResultsScreen } from "../features/results";
import { TournamentSetup, type TournamentSetupValues } from "../features/setup";
import {
  clearSnapshot,
  loadSnapshot,
  saveSnapshot,
} from "../persistence/storage";
import type { TournamentSnapshotV1 } from "../persistence/schema";
import type { ScoringAction } from "../match/types";
import { correctionNeedsConfirmation, type Player } from "../tournament";
import { appReducer, initialAppState, toSnapshot } from "./reducer";
import { sessionTimeLabel, timingAdjustment } from "./timing-view";
import type { AppState } from "./types";

const HISTORY_SCREENS = [
  "home",
  "setup",
  "bracket",
  "live",
  "quick-setup",
  "quick-live",
  "results",
] satisfies TournamentSnapshotV1["screen"][];
const noop = () => undefined;

function isHistoryScreen(
  value: string,
): value is TournamentSnapshotV1["screen"] {
  return (HISTORY_SCREENS as string[]).includes(value);
}

function stateFromSnapshot(
  snapshot: ReturnType<typeof loadSnapshot>,
): AppState {
  if (snapshot.status === "ok") {
    return { ...snapshot.snapshot, recoveryMessage: null, hydrated: true };
  }
  if (snapshot.status === "corrupt") {
    return {
      ...initialAppState(0, true),
      screen: "recovery",
      recoveryMessage: snapshot.message,
    };
  }
  return initialAppState(0, true);
}

function setupPlayers(values: TournamentSetupValues): Player[] {
  return values.players.map((player, index) => ({
    ...player,
    id: `player-${index + 1}`,
  }));
}

export function AppShell() {
  const [state, dispatch] = useReducer(appReducer, initialAppState(0));
  const [now, setNow] = useState(() => Date.now());
  const previousScreen = useRef(state.screen);

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
    (matchId: string, scoreA: number, scoreB: number) => {
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
      {state.screen !== "home" &&
      state.screen !== "live" &&
      state.screen !== "quick-live" ? (
        <header className="app-header">
          <button
            className="brand-button"
            onClick={() => dispatch({ type: "navigate", screen: "home" })}
            type="button"
          >
            <Crown aria-hidden="true" size={18} /> Pickle King
          </button>
          <span>Local-only session</span>
        </header>
      ) : null}
      {state.screen === "home" ? (
        <HomeScreen
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
          onSubmit={(values) =>
            dispatch({
              type: "create-tournament",
              players: setupPlayers(values),
              config: {
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
            if (!match) return;
            const scoreA = Number(
              window.prompt(
                "Correct score for the first side",
                `${match.scoreA}`,
              ),
            );
            const scoreB = Number(
              window.prompt(
                "Correct score for the second side",
                `${match.scoreB}`,
              ),
            );
            if (Number.isInteger(scoreA) && Number.isInteger(scoreB)) {
              correctResult(matchId, scoreA, scoreB);
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
          onExit={() => dispatch({ type: "navigate", screen: "home" })}
          scorer={state.scorer}
          sessionDeadline={state.quickMatch ? null : state.sessionDeadline}
        />
      ) : null}
      {state.screen === "quick-setup" ? (
        <QuickMatchSetup
          onBack={() => dispatch({ type: "navigate", screen: "home" })}
          onStart={(scorer) =>
            dispatch({ type: "start-quick", scorer, now: Date.now() })
          }
        />
      ) : null}
      {state.screen === "results" && state.tournament ? (
        <ResultsScreen
          bracket={state.tournament}
          onCorrect={correctResult}
          onHome={() => dispatch({ type: "navigate", screen: "home" })}
        />
      ) : null}
    </div>
  );
}
