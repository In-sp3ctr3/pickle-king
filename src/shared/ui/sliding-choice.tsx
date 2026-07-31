"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, type ReactNode } from "react";

export interface SlidingChoiceOption<Value extends string> {
  label: string;
  value: Value;
  icon?: ReactNode;
}

export function SlidingChoice<Value extends string>({
  ariaLabel,
  className = "",
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  className?: string;
  onChange: (value: Value) => void;
  options: SlidingChoiceOption<Value>[];
  value: Value;
}) {
  const id = useId();
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-label={ariaLabel}
      className={`sliding-choice ${className}`}
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            aria-pressed={selected}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {selected ? (
              <motion.span
                className="sliding-choice__indicator"
                layoutId={`sliding-choice-${id}`}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: "spring", bounce: 0.16, duration: 0.42 }
                }
              />
            ) : null}
            <span className="sliding-choice__label">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
