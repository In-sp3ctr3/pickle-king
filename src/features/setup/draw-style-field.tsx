"use client";

import { SlidingChoice } from "@/src/shared/ui";
import type { TournamentSetupValues } from "./setup-types";

export function DrawStyleField({
  onChange,
  value,
}: {
  onChange: (value: TournamentSetupValues["drawStyle"]) => void;
  value: TournamentSetupValues["drawStyle"];
}) {
  return (
    <fieldset className="setup-draw-style">
      <legend>
        <span aria-hidden="true" className="setup-section-number">
          02
        </span>
        <span className="setup-section-title">Draw style</span>
      </legend>
      <div className="setup-draw-style__content">
        <div>
          <p>How should the bracket be built?</p>
          <span>Choose whether ratings affect player placement.</span>
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
        {value === "ranked"
          ? "Uses skill levels to keep the strongest players apart until later rounds."
          : "Shuffles every player. Ratings do not affect placement."}
      </p>
    </fieldset>
  );
}
