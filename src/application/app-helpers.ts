import type { TournamentSetupValues } from "../features/setup";
import type { TournamentSnapshotV1 } from "../persistence/schema";
import type { loadSnapshot } from "../persistence/storage";
import type { loadHistory } from "../persistence/history-storage";
import { emptySessionHistory } from "../history";
import type { Player } from "../tournament";
import { initialAppState } from "./reducer";
import type { AppState } from "./types";

const historyScreens = [
  "home",
  "setup",
  "bracket",
  "live",
  "quick-setup",
  "quick-live",
  "results",
  "history",
] satisfies TournamentSnapshotV1["screen"][];

export function isHistoryScreen(
  value: string,
): value is TournamentSnapshotV1["screen"] {
  return (historyScreens as string[]).includes(value);
}

export function stateFromSnapshot(
  snapshot: ReturnType<typeof loadSnapshot>,
  historyLoad: ReturnType<typeof loadHistory> = { status: "empty" },
): AppState {
  const history =
    historyLoad.status === "ok" ? historyLoad.history : emptySessionHistory();
  const historyRecoveryMessage =
    historyLoad.status === "corrupt" ? historyLoad.message : null;
  if (snapshot.status === "ok") {
    return {
      ...snapshot.snapshot,
      recoveryMessage: null,
      history,
      historyRecoveryMessage,
      hydrated: true,
    };
  }
  if (snapshot.status === "corrupt") {
    return {
      ...initialAppState(0, true),
      screen: "recovery",
      recoveryMessage: snapshot.message,
      history,
      historyRecoveryMessage,
    };
  }
  return {
    ...initialAppState(0, true),
    history,
    historyRecoveryMessage,
  };
}

export function setupPlayers(values: TournamentSetupValues): Player[] {
  return values.players.map((player, index) => ({
    ...player,
    id: `player-${index + 1}`,
  }));
}
