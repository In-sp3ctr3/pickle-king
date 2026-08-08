import type { DrawStyle, SkillLevel, TournamentFormat } from "@/src/tournament";

export interface TournamentSetupPlayer {
  name: string;
  rating: SkillLevel;
}

export interface TournamentSetupValues {
  players: TournamentSetupPlayer[];
  format: TournamentFormat;
  drawStyle: DrawStyle;
  timingMode: "timed" | "untimed";
  bookingMinutes: number;
  warmupMinutes: number;
  transitionSeconds: number;
  targetScore: number;
}

export interface TournamentSetupInitialValues {
  players?: Array<{ name: string; rating?: SkillLevel }>;
  format?: TournamentSetupValues["format"];
  timingMode?: "timed" | "untimed";
  bookingMinutes?: number;
  warmupMinutes?: number;
  transitionSeconds?: number;
  targetScore?: number;
  drawStyle?: DrawStyle;
}

export interface SetupPlayerDraft {
  id: string;
  name: string;
  rating: SkillLevel | "";
}

export interface SetupNumberDrafts {
  bookingMinutes: string;
  warmupMinutes: string;
  transitionSeconds: string;
  targetScore: string;
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
