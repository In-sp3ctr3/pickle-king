export const SKILL_LEVELS = [
  "2.5",
  "3.0",
  "3.5",
  "4.0",
  "4.5",
  "5.0",
  "5.5+",
] as const;

export const PLAYER_NAME_MAX_LENGTH = 16;

export type SkillLevel = (typeof SKILL_LEVELS)[number];

export interface Player {
  id: string;
  name: string;
  rating: SkillLevel;
  seed?: number;
}

export interface MatchSide {
  memberIds: string[];
}

export interface MatchConfig {
  targetScore: number;
  capMs: number | null;
}

export type DrawStyle = "ranked" | "random";
export type TournamentFormat = "knockout" | "round-robin-finals";

export interface TournamentConfig {
  format: TournamentFormat;
  drawStyle: DrawStyle;
  timingMode: "timed" | "untimed";
  bookingMinutes: number;
  warmupMinutes: number;
  transitionSeconds: number;
  targetScore: number;
  randomSeed: string;
}

export type MatchSource =
  | { type: "player"; playerId: string }
  | { type: "winner" | "loser"; matchId: string }
  | { type: "standing"; rank: 1 | 2 | 3 | 4 };

export type MatchStatus = "waiting" | "ready" | "live" | "complete";
export type MatchSlot = "A" | "B";
export type LateEntryMethod =
  "reversible-bye" | "untouched-preliminary" | "branch-gauntlet";

export interface Match {
  id: string;
  kind: "elimination" | "round-robin" | "bronze" | "challenge";
  round: number;
  ordinal: number;
  sourceA: MatchSource;
  sourceB: MatchSource;
  sideA: MatchSide | null;
  sideB: MatchSide | null;
  config: MatchConfig;
  scoreA: number;
  scoreB: number;
  status: MatchStatus;
  winnerId: string | null;
  loserId: string | null;
  startedAt: number | null;
  completedAt: number | null;
  comebackDeficit: number;
}

export interface LateEntryTiming {
  currentCapMs: number | null;
  proposedCapMs: number | null;
  feasible: boolean;
  remainingMatches: number;
  sessionDeadline: number | null;
}

export interface LateEntryPlan {
  method: LateEntryMethod;
  playerId: string;
  protectedPlayerId: string;
  restoredPlayerIds: string[];
  lineageMatchIds: string[];
  targetMatchId: string;
  targetSlot: MatchSlot;
  originalTargetSource: MatchSource;
  bronzeSlot: MatchSlot | null;
  originalBronzeSource: MatchSource | null;
  timing: LateEntryTiming;
}

export interface LateEntryAmendment extends LateEntryPlan {
  id: string;
  createdAt: number;
  challengeMatchIds: string[];
  declinedPlayerIds: string[];
}

export interface TournamentBracket {
  format: TournamentFormat;
  bracketSize: number;
  roundCount: number;
  players: Player[];
  matches: Match[];
  finalMatchId: string;
  bronzeMatchId: string;
  amendments: LateEntryAmendment[];
}

export interface PlayerStanding {
  playerId: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  differential: number;
  eliminatedRound: number | null;
}

export interface UpsetResult {
  matchId: string;
  winnerId: string;
  loserId: string;
  seedDifference: number;
}

export interface EliminationGroup {
  round: number;
  playerIds: string[];
}

export interface TournamentResult {
  championId: string;
  runnerUpId: string;
  thirdPlaceId: string;
  standings: PlayerStanding[];
  upsetWins: UpsetResult[];
  eliminationGroups: EliminationGroup[];
  preliminaryStandings: PlayerStanding[] | null;
  matchHistory: Match[];
}
