import { ActionButton } from "@/src/shared/ui";
import { calculateMatchCap, plannedMatchCount } from "@/src/tournament";
import { ArrowRight } from "lucide-react";
import type { SetupNumberDrafts, TournamentSetupValues } from "./setup-types";

export function SetupSubmit({
  automaticAdvanceCount,
  drawStyle,
  format,
  numbers,
  playerCount,
  timingMode,
}: {
  automaticAdvanceCount: number;
  drawStyle: TournamentSetupValues["drawStyle"];
  format: TournamentSetupValues["format"];
  numbers: SetupNumberDrafts;
  playerCount: number;
  timingMode: TournamentSetupValues["timingMode"];
}) {
  const summary = scheduleSummary(format, playerCount, timingMode, numbers);

  return (
    <div className="setup-submit-row">
      <div>
        <p>{summary}</p>
        {automaticAdvanceCount > 0 ? (
          <p className="setup-advance-note" data-qa="automatic-advance-note">
            With {playerCount} players, {automaticAdvanceCount}{" "}
            {drawStyle === "ranked" ? "top-ranked " : ""}
            {automaticAdvanceCount === 1 ? "player" : "players"}{" "}
            {automaticAdvanceCount === 1 ? "advances" : "advance"} automatically
            through round one
            {drawStyle === "random" ? " after the shuffle" : ""}.
          </p>
        ) : null}
      </div>
      <ActionButton data-qa="build-bracket" type="submit">
        {format === "round-robin-finals" ? "Build tournament" : "Build bracket"}
        <ArrowRight aria-hidden="true" size={19} />
      </ActionButton>
    </div>
  );
}

function scheduleSummary(
  format: TournamentSetupValues["format"],
  playerCount: number,
  timingMode: TournamentSetupValues["timingMode"],
  numbers: SetupNumberDrafts,
): string {
  const count = plannedMatchCount(playerCount, format);
  const participation =
    playerCount === 4
      ? ` · ${format === "round-robin-finals" ? 4 : 2} per player`
      : "";
  if (timingMode === "untimed") return `${count} matches${participation}`;

  try {
    const { capMs } = calculateMatchCap({
      entrantCount: playerCount,
      format,
      bookingMinutes: Number(numbers.bookingMinutes),
      warmupMinutes: Number(numbers.warmupMinutes),
      transitionSeconds: Number(numbers.transitionSeconds),
    });
    const seconds = Math.floor(capMs / 1_000);
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    const cap = remainder
      ? `${minutes} min ${remainder} sec`
      : `${minutes} min`;
    return `${count} matches${participation} · ${cap} cap each`;
  } catch {
    return `${count} matches${participation} · Fix court rules to calculate the cap`;
  }
}
