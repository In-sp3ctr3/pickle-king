import { calculateMatchCap, plannedMatchCount } from "@/src/tournament";
import type { SetupNumberDrafts, TournamentSetupValues } from "./setup-types";

const TIGHT_CAP_MS = 8 * 60_000;

function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1_000);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes} min ${remainder} sec` : `${minutes} min`;
}

export function roundRobinSummary(playerCount: number): string {
  const count = plannedMatchCount(playerCount, "round-robin-finals");
  return `${count} matches · ${roundRobinParticipation(playerCount)}`;
}

function roundRobinParticipation(playerCount: number): string {
  return playerCount === 4
    ? "4 per player"
    : `${playerCount - 1}–${playerCount} per player`;
}

export function setupScheduleCopy(input: {
  format: TournamentSetupValues["format"];
  numbers: SetupNumberDrafts;
  playerCount: number;
  timingMode: TournamentSetupValues["timingMode"];
}): { advisory?: string; summary: string } {
  const count = plannedMatchCount(input.playerCount, input.format);
  const participation =
    input.format === "round-robin-finals"
      ? ` · ${roundRobinParticipation(input.playerCount)}`
      : input.playerCount === 4
        ? " · 2 per player"
        : "";
  const base = `${count} matches${participation}`;
  if (input.timingMode === "untimed") return { summary: base };

  try {
    const { capMs } = calculateMatchCap({
      entrantCount: input.playerCount,
      format: input.format,
      bookingMinutes: Number(input.numbers.bookingMinutes),
      warmupMinutes: Number(input.numbers.warmupMinutes),
      transitionSeconds: Number(input.numbers.transitionSeconds),
    });
    const cap = formatDuration(capMs);
    return {
      summary: `${base} · ${cap} cap each`,
      advisory:
        input.format === "round-robin-finals" && capMs < TIGHT_CAP_MS
          ? `Tight timed schedule · ${cap} per match. Consider a longer booking, a lower score target, or Fast knockout.`
          : undefined,
    };
  } catch {
    return { summary: `${base} · Fix court rules to calculate the cap` };
  }
}
