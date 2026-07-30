import type { SkillLevel } from "@/src/tournament";

export interface TournamentSetupPlayer {
  name: string;
  rating: SkillLevel;
}

export interface TournamentSetupValues {
  players: TournamentSetupPlayer[];
  bookingMinutes: number;
  warmupMinutes: number;
  transitionSeconds: number;
  targetScore: number;
}

export interface TournamentSetupInitialValues {
  players?: Array<{ name: string; rating?: SkillLevel }>;
  bookingMinutes?: number;
  warmupMinutes?: number;
  transitionSeconds?: number;
  targetScore?: number;
}

export interface SetupPlayerDraft {
  id: string;
  name: string;
  rating: SkillLevel | "";
}

export interface SetupErrors {
  form?: string;
  names: Record<string, string>;
  ratings: Record<string, string>;
  bookingMinutes?: string;
  warmupMinutes?: string;
  transitionSeconds?: string;
  targetScore?: string;
}
