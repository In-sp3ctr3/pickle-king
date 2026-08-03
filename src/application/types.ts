import type { ScoringAction, ScoringState } from "../match/types";
import type { SessionHistoryV1 } from "../history";
import type { TournamentSnapshotV1 } from "../persistence/schema";
import type { Player, TournamentConfig } from "../tournament";

export type AppState = Omit<TournamentSnapshotV1, "screen"> & {
  screen: TournamentSnapshotV1["screen"] | "recovery";
  recoveryMessage: string | null;
  history: SessionHistoryV1;
  historyRecoveryMessage: string | null;
  hydrated: boolean;
};

export type AppAction =
  | { type: "navigate"; screen: TournamentSnapshotV1["screen"] }
  | {
      type: "update-draft";
      players: Player[];
      config: TournamentConfig;
      now: number;
    }
  | {
      type: "create-tournament";
      players: Player[];
      config: TournamentConfig;
      now: number;
    }
  | { type: "start-match"; matchId: string; now: number }
  | { type: "score"; action: ScoringAction; now: number }
  | { type: "confirm-result"; now: number }
  | { type: "rename-player"; playerId: string; name: string; now: number }
  | { type: "rebuild-tournament"; players: Player[]; now: number }
  | { type: "discard-match"; now: number }
  | {
      type: "correct-result";
      matchId: string;
      scoreA: number;
      scoreB: number;
      winnerIdOverride?: string;
      confirmDownstreamReset: boolean;
      now: number;
    }
  | {
      type: "start-quick";
      scorer: ScoringState;
      now: number;
    }
  | { type: "hydrate"; state: AppState }
  | { type: "recover"; message: string }
  | { type: "reset-history"; now: number }
  | {
      type: "remove-history";
      id: string;
      kind: "quick" | "tournament";
      now: number;
    }
  | { type: "reset"; now: number };
