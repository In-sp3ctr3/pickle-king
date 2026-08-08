"use client";

import { useId } from "react";
import type { TournamentSetupValues } from "./setup-types";

interface FormatFieldProps {
  onChange: (format: TournamentSetupValues["format"]) => void;
  playerCount: number;
  value: TournamentSetupValues["format"];
}

export function FormatField({
  onChange,
  playerCount,
  value,
}: FormatFieldProps) {
  const indicatorId = useId();
  const roundRobinAvailable = playerCount === 4;
  const unavailableId = `${indicatorId}-unavailable`;

  return (
    <fieldset className="setup-format">
      <legend>
        <span aria-hidden="true" className="setup-section-number">
          02
        </span>
        <span className="setup-section-title">Tournament format</span>
      </legend>
      <p>Choose a fast draw or give a four-player field more court time.</p>

      <div
        aria-label="Tournament format"
        className="setup-format-choice sliding-choice"
        role="group"
      >
        <FormatButton
          label="Fast knockout"
          meta={
            playerCount === 4
              ? "4 matches · 2 per player"
              : `${playerCount} matches · elimination draw`
          }
          onClick={() => onChange("knockout")}
          selected={value === "knockout"}
        />
        <FormatButton
          describedBy={!roundRobinAvailable ? unavailableId : undefined}
          disabled={!roundRobinAvailable}
          label="Round robin + finals"
          meta="8 matches · 4 per player"
          onClick={() => onChange("round-robin-finals")}
          selected={value === "round-robin-finals"}
        />
      </div>

      <p className="setup-format__note" id={unavailableId}>
        {roundRobinAvailable
          ? value === "round-robin-finals"
            ? "Everyone meets once, then ranks 3–4 play for bronze before ranks 1–2 play the final."
            : "Two semifinals lead to a bronze match and the final."
          : "Round robin + finals is available only with exactly four players."}
      </p>
    </fieldset>
  );
}

function FormatButton({
  describedBy,
  disabled = false,
  label,
  meta,
  onClick,
  selected,
}: {
  describedBy?: string;
  disabled?: boolean;
  label: string;
  meta: string;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <button
      aria-describedby={describedBy}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {selected ? <span className="sliding-choice__indicator" /> : null}
      <span className="setup-format-choice__label sliding-choice__label">
        <strong>{label}</strong>
        <span>{meta}</span>
      </span>
    </button>
  );
}
