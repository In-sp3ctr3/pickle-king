"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";
import { loadHistory, saveHistory } from "../persistence/history-storage";
import { loadSnapshot, saveSnapshot } from "../persistence/storage";
import { isHistoryScreen, stateFromSnapshot } from "./app-helpers";
import { toSnapshot } from "./reducer";
import type { AppAction, AppState } from "./types";

export function useAppLifecycle(
  state: AppState,
  dispatch: Dispatch<AppAction>,
): number {
  const [now, setNow] = useState(() => Date.now());
  const previousScreen = useRef(state.screen);
  const focusedScreen = useRef(state.screen);

  useEffect(() => {
    queueMicrotask(() =>
      dispatch({
        type: "hydrate",
        state: stateFromSnapshot(
          loadSnapshot(window.localStorage),
          loadHistory(window.localStorage),
        ),
      }),
    );
  }, [dispatch]);
  useEffect(() => {
    if (!state.hydrated) return;
    const snapshot = toSnapshot(state);
    if (snapshot) saveSnapshot(window.localStorage, snapshot);
  }, [state]);
  useEffect(() => {
    if (!state.hydrated || state.historyRecoveryMessage) return;
    saveHistory(window.localStorage, state.history);
  }, [state.history, state.historyRecoveryMessage, state.hydrated]);
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
      if (isHistoryScreen(screen)) dispatch({ type: "navigate", screen });
    };
    window.addEventListener("popstate", syncFromHash);
    return () => window.removeEventListener("popstate", syncFromHash);
  }, [dispatch]);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);
  return now;
}
