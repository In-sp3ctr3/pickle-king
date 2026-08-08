"use client";

import { SlidingChoice } from "@/src/shared/ui";
import type { TournamentSetupValues } from "./setup-types";

export function DrawStyleField({
  format,
  onChange,
  value,
}: {
  format: TournamentSetupValues["format"];
  onChange: (value: TournamentSetupValues["drawStyle"]) => void;
  value: TournamentSetupValues["drawStyle"];
}) {
  return (
    <fieldset className="setup-draw-style">
      <legend>
        <span aria-hidden="true" className="setup-section-number">
          03
        </span>
        <span className="setup-section-title">Draw style</span>
      </legend>
      <div className="setup-draw-style__content">
        <div>
          <p>
            {format === "round-robin-finals"
              ? "How should the player order be set?"
              : "How should the bracket be built?"}
          </p>
          <span>
            {format === "round-robin-finals"
              ? "Order sets the schedule and the final standings tie-break."
              : "Choose whether ratings affect player placement."}
          </span>
        </div>
        <SlidingChoice
          ariaLabel="Tournament draw style"
          onChange={onChange}
          options={[
            { label: "Ranked draw", value: "ranked" },
            { label: "Random draw", value: "random" },
          ]}
          value={value}
        />
      </div>
      <p className="setup-draw-style__note">
        {format === "round-robin-finals"
          ? value === "ranked"
            ? "Uses skill levels for the initial order. Everyone still plays everyone once."
            : "Shuffles the initial order. Ratings do not affect the schedule or standings."
          : value === "ranked"
            ? "Uses skill levels to keep the strongest players apart until later rounds."
            : "Shuffles every player. Ratings do not affect placement."}
      </p>
    </fieldset>
  );
}
