import {
  calculateMatchCap,
  getNextMatch,
  type TournamentBracket,
  type TournamentConfig,
} from "../tournament";

export function sessionTimeLabel(
  deadline: number | null,
  now: number,
): string | undefined {
  if (!deadline) return undefined;
  const minutes = Math.max(0, Math.ceil((deadline - now) / 60_000));
  return `${minutes} min left`;
}

export function timingAdjustment(
  tournament: TournamentBracket,
  config: TournamentConfig | undefined,
): string | undefined {
  if (!config || config.timingMode === "untimed") return undefined;
  const original = calculateMatchCap({
    entrantCount: tournament.players.length,
    format: tournament.format,
    bookingMinutes: config.bookingMinutes,
    warmupMinutes: config.warmupMinutes,
    transitionSeconds: config.transitionSeconds,
  }).capMs;
  const current = getNextMatch(tournament)?.config.capMs;
  if (!current || current >= original) return undefined;
  return `Schedule adjusted · remaining matches capped at ${Math.ceil(current / 60_000)} min`;
}
