"use client";

import { Minus } from "lucide-react";
import { AnimatedNumber } from "./animated-number";

export function ScoreSide({
  team,
  label,
  score,
  leader,
  disabled,
  onAdd,
  onSubtract,
}: {
  team: "A" | "B";
  label: string;
  score: number;
  leader: boolean;
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
        <span className="score-hint">Tap anywhere to add</span>
      </button>
      <button
        aria-label={`Subtract one point from ${label}`}
        className="score-subtract"
        disabled={disabled || score === 0}
        onClick={onSubtract}
        type="button"
      >
        <Minus aria-hidden="true" size={22} />
        Point
      </button>
    </section>
  );
}
