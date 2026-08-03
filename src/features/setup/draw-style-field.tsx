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
          <p>How should the opening round feel?</p>
          <span>
            Choose a standard seeded bracket or closer opening matchups.
          </span>
        </div>
        <SlidingChoice
          ariaLabel="Tournament draw style"
          onChange={onChange}
          options={[
            { label: "Seeded", value: "competitive" },
            { label: "Closer games", value: "social" },
          ]}
          value={value}
        />
      </div>
      <p className="setup-draw-style__note">
        {value === "competitive"
          ? "Top-rated players start in separate parts of the draw. Opening matches can be uneven."
          : "Similar skill levels meet first. Strong players may face each other sooner."}
      </p>
    </fieldset>
  );
}
