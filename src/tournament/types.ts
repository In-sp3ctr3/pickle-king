export const SKILL_LEVELS = [
  "2.5",
  "3.0",
  "3.5",
  "4.0",
  "4.5",
  "5.0",
  "5.5+",
] as const;

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
  capMs: number;
}

export interface TournamentConfig {
  bookingMinutes: number;
  warmupMinutes: number;
  transitionSeconds: number;
  targetScore: number;
  randomSeed: string;
}

export type MatchSource =
  | { type: "player"; playerId: string }
  | { type: "winner" | "loser"; matchId: string };

export type MatchStatus = "waiting" | "ready" | "live" | "complete";

export interface Match {
  id: string;
  kind: "elimination" | "bronze";
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
}

export interface TournamentBracket {
  bracketSize: number;
  roundCount: number;
  players: Player[];
  matches: Match[];
  finalMatchId: string;
  bronzeMatchId: string;
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
  matchHistory: Match[];
}
