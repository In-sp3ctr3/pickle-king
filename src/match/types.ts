import type { MatchSide } from "../tournament";

export type MatchTeam = "A" | "B";
export type ServiceTurn = "opening" | "first" | "second";
export type ServiceSide = "left" | "right";

export interface ServiceState {
  startingTeam: MatchTeam;
  servingTeam: MatchTeam;
  serverId: string;
  turn: ServiceTurn;
  rightAtZero: Record<MatchTeam, string>;
}

export interface RallySnapshot {
  scoreA: number;
  scoreB: number;
  service: ServiceState;
  scoredTeam: MatchTeam | null;
}
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
  service: ServiceState | null;
  rallyHistory: RallySnapshot[];
  rightEndTeam: MatchTeam;
}

export type ScoringAction =
  | { type: "start"; now: number }
  | { type: "start"; now: number; service: ServiceState }
  | { type: "configure-serve"; service: ServiceState }
  | { type: "adjust"; team: MatchTeam; delta: 1 | -1; now: number }
  | { type: "rally"; team: MatchTeam; now: number }
  | { type: "undo-rally"; now: number }
  | { type: "repair-serve"; turn: "second" | "side-out" }
  | { type: "swap-court-ends" }
  | { type: "tick"; now: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "end-early"; now: number; winner?: MatchTeam }
  | { type: "edit-result" }
  | { type: "review-result"; now: number }
  | { type: "reset" }
  | { type: "confirm" };
