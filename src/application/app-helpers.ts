import type { TournamentSetupValues } from "../features/setup";
import type { TournamentSnapshotV1 } from "../persistence/schema";
import type { loadSnapshot } from "../persistence/storage";
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
] satisfies TournamentSnapshotV1["screen"][];

export function isHistoryScreen(
  value: string,
): value is TournamentSnapshotV1["screen"] {
  return (historyScreens as string[]).includes(value);
}

export function stateFromSnapshot(
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

export function setupPlayers(values: TournamentSetupValues): Player[] {
  return values.players.map((player, index) => ({
    ...player,
    id: `player-${index + 1}`,
  }));
}
