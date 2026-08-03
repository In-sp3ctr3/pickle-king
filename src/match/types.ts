import type { MatchSide } from "../tournament";

export type MatchTeam = "A" | "B";
export type FinishReason =
  "target" | "buzzer" | "golden-point" | "ended-early" | "operator-selection";
export type ScoringStatus =
  | "idle"
  | "running"
  | "paused"
  | "golden-point"
  | "editing-result"
  | "awaiting-confirmation"
  | "complete";

export interface ScoringState {
  sideA: MatchSide;
  sideB: MatchSide;
  labelA: string;
  labelB: string;
  participantNames?: { sideA: string[]; sideB: string[] };
  stageLabel?: string;
  scoreA: number;
  scoreB: number;
  targetScore: number;
  durationMs: number | null;
  status: ScoringStatus;
  deadline: number | null;
  pausedRemainingMs: number | null;
  winner: MatchTeam | null;
  finishReason: FinishReason | null;
  scoreEvents: MatchTeam[];
}

export type ScoringAction =
  | { type: "start"; now: number }
  | { type: "adjust"; team: MatchTeam; delta: 1 | -1; now: number }
  | { type: "tick"; now: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "end-early"; now: number; winner?: MatchTeam }
  | { type: "edit-result" }
  | { type: "review-result"; now: number }
  | { type: "reset" }
  | { type: "confirm" };
