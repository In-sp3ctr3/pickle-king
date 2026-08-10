import { ActionButton } from "@/src/shared/ui";
import { ArrowRight } from "lucide-react";
import type { SetupNumberDrafts, TournamentSetupValues } from "./setup-types";
import { setupScheduleCopy } from "./setup-schedule";

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
  const { advisory, summary } = setupScheduleCopy({
    format,
    numbers,
    playerCount,
    timingMode,
  });

  return (
    <div className="setup-submit-row">
      <div>
        <p>{summary}</p>
        {advisory ? (
          <p className="setup-tight-warning" data-qa="setup-tight-warning">
            {advisory}
          </p>
        ) : null}
        {format === "knockout" && automaticAdvanceCount > 0 ? (
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
