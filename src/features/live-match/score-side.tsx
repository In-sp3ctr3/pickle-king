"use client";

import { Minus, Plus } from "lucide-react";
import { AnimatedNumber } from "./animated-number";

export function ScoreSide({
  team,
  label,
  score,
  leader,
  showHint,
  disabled,
  onRallyWon,
  onSubtract,
}: {
  team: "A" | "B";
  label: string;
  score: number;
  leader: boolean;
  showHint: boolean;
  disabled: boolean;
  onRallyWon: () => void;
  onSubtract: () => void;
}) {
  const displayLabel = label.replace(/\s+\+\s+/g, " / ");
  return (
    <section
      className={`score-side score-side-${team.toLowerCase()} ${leader ? "is-leading" : ""}`}
      aria-label={`${label}, ${score} points`}
    >
      <button
        className="score-add"
        data-qa={`score-${team.toLowerCase()}-add`}
        disabled={disabled}
        onClick={onRallyWon}
        type="button"
      >
        <span className="score-player">{displayLabel}</span>
        <AnimatedNumber className="score-number" value={score} />
        {showHint ? (
          <span className="score-hint">Tap court for rally winner</span>
        ) : null}
      </button>
      <div className="score-stepper" aria-label={`${label} score controls`}>
        <button
          aria-label="Undo last rally"
          disabled={disabled}
          onClick={onSubtract}
          type="button"
        >
          <Minus aria-hidden="true" size={20} />
          <span>Undo rally</span>
        </button>
        <button
          aria-label={`Record ${label} as the rally winner`}
          disabled={disabled}
          onClick={onRallyWon}
          type="button"
        >
          <Plus aria-hidden="true" size={20} />
          <span>Won rally</span>
        </button>
      </div>
    </section>
  );
}
