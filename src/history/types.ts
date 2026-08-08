import type { FinishReason } from "../match/types";
import type { TournamentBracket } from "../tournament";

export interface QuickMatchRecord {
  id: string;
  completedAt: number;
  format: "singles" | "doubles";
  participants: { sideA: string[]; sideB: string[] };
  labels: { sideA: string; sideB: string };
  score: { sideA: number; sideB: number };
  winner: "A" | "B";
  targetScore: number;
  finishReason: FinishReason;
}

export interface TournamentArchive {
  id: string;
  completedAt: number;
  bracket: TournamentBracket;
}

export interface SessionHistoryV2 {
  version: 2;
  quickMatches: QuickMatchRecord[];
  tournaments: TournamentArchive[];
}

/** @deprecated Use SessionHistoryV2. */
export type SessionHistoryV1 = SessionHistoryV2;
