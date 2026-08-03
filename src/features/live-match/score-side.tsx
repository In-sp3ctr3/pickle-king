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
  onAdd,
  onSubtract,
}: {
  team: "A" | "B";
  label: string;
  score: number;
  leader: boolean;
  showHint: boolean;
  disabled: boolean;
  onAdd: () => void;
  onSubtract: () => void;
}) {
  return (
    <section
      className={`score-side score-side-${team.toLowerCase()} ${leader ? "is-leading" : ""}`}
      aria-label={`${label}, ${score} points`}
    >
      <button
        className="score-add"
        data-qa={`score-${team.toLowerCase()}-add`}
        disabled={disabled}
        onClick={onAdd}
        type="button"
      >
        <span className="score-player">{label}</span>
        <AnimatedNumber className="score-number" value={score} />
        {showHint ? <span className="score-hint">Tap court to add</span> : null}
      </button>
      <div className="score-stepper" aria-label={`${label} score controls`}>
        <button
          aria-label={`Undo one point from ${label}`}
          disabled={disabled || score === 0}
          onClick={onSubtract}
          type="button"
        >
          <Minus aria-hidden="true" size={20} />
          <span>Undo −1</span>
        </button>
        <button
          aria-label={`Add one point to ${label}`}
          disabled={disabled}
          onClick={onAdd}
          type="button"
        >
          <Plus aria-hidden="true" size={20} />
          <span>+1 point</span>
        </button>
      </div>
    </section>
  );
}
