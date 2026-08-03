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
          <p>What kind of night is this?</p>
          <span>
            Competitive protects top seeds. Social opens with closer-rated
            matchups to reduce early blowouts.
          </span>
        </div>
        <SlidingChoice
          ariaLabel="Tournament draw style"
          onChange={onChange}
          options={[
            { label: "Competitive", value: "competitive" },
            { label: "Social", value: "social" },
          ]}
          value={value}
        />
      </div>
      <p className="setup-draw-style__note">
        {value === "competitive"
          ? "Strongest players are separated and may meet lower-rated players early."
          : "Similar ratings meet first; strong players may face each other earlier."}
      </p>
    </fieldset>
  );
}
