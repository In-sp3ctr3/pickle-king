import type { MatchSide } from "../tournament";

export type MatchTeam = "A" | "B";
export type FinishReason = "target" | "buzzer" | "golden-point";
export type ScoringStatus =
  | "idle"
  | "running"
  | "paused"
  | "golden-point"
  | "awaiting-confirmation"
  | "complete";

export interface ScoringState {
  sideA: MatchSide;
  sideB: MatchSide;
  labelA: string;
  labelB: string;
  scoreA: number;
  scoreB: number;
  targetScore: number;
  durationMs: number;
  status: ScoringStatus;
  deadline: number | null;
  pausedRemainingMs: number;
  winner: MatchTeam | null;
  finishReason: FinishReason | null;
}

export type ScoringAction =
  | { type: "start"; now: number }
  | { type: "adjust"; team: MatchTeam; delta: 1 | -1; now: number }
  | { type: "tick"; now: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "reopen" }
  | { type: "reset" }
  | { type: "confirm" };
