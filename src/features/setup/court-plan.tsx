"use client";

import type {
  SetupErrors,
  SetupNumberDrafts,
  TournamentSetupValues,
} from "./setup-types";
import { NumberField } from "./number-field";
import { SlidingChoice } from "@/src/shared/ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

interface CourtPlanProps {
  errors?: SetupErrors;
  numbers: SetupNumberDrafts;
  onNumbersChange: (numbers: SetupNumberDrafts) => void;
  onTimingModeChange: (mode: TournamentSetupValues["timingMode"]) => void;
  timingMode: TournamentSetupValues["timingMode"];
}

export function CourtPlan({
  errors,
  numbers,
  onNumbersChange,
  onTimingModeChange,
  timingMode,
}: CourtPlanProps) {
  const reducedMotion = useReducedMotion();
  const setNumber = (field: keyof SetupNumberDrafts, value: string) =>
    onNumbersChange({ ...numbers, [field]: value });

  return (
    <fieldset className="setup-court-plan">
      <legend>
        <span aria-hidden="true" className="setup-section-number">
          03
        </span>
        <span className="setup-section-title">Court rules</span>
      </legend>
      <div className="setup-timing-heading">
        <div>
          <p>Does the booking have a deadline?</p>
          <span>
            Timed sessions share the available court time across every match.
          </span>
        </div>
        <SlidingChoice
          ariaLabel="Tournament timing"
          className="setup-timing-toggle"
          onChange={onTimingModeChange}
          options={[
            { label: "Timed booking", value: "timed" },
            { label: "No time limit", value: "untimed" },
          ]}
          value={timingMode}
        />
      </div>

      <div className="setup-court-grid">
        <AnimatePresence initial={false} mode="wait">
          {timingMode === "timed" ? (
            <motion.div
              animate={{ height: "auto", opacity: 1, y: 0 }}
              className="setup-time-fields"
              data-motion-state="timed"
              exit={{ height: 0, opacity: 0, y: -10 }}
              initial={{ height: 0, opacity: 0, y: -10 }}
              key="timed"
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { bounce: 0.18, duration: 0.42, type: "spring" }
              }
            >
              <NumberField
                error={errors?.bookingMinutes}
                help="Total reserved court time (30–480)."
                id="booking-minutes"
                label="Court booking"
                max={480}
                min={30}
                onChange={(value) => setNumber("bookingMinutes", value)}
                suffix="min"
                value={numbers.bookingMinutes}
              />
              <NumberField
                error={errors?.warmupMinutes}
                help="Time before the first serve (0–60)."
                id="warmup-minutes"
                label="Warmup"
                max={60}
                min={0}
                onChange={(value) => setNumber("warmupMinutes", value)}
                suffix="min"
                value={numbers.warmupMinutes}
              />
              <NumberField
                error={errors?.transitionSeconds}
                help="Reset time between matches (0–600)."
                id="transition-seconds"
                label="Changeover"
                max={600}
                min={0}
                onChange={(value) => setNumber("transitionSeconds", value)}
                suffix="sec"
                value={numbers.transitionSeconds}
              />
            </motion.div>
          ) : (
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="setup-untimed-note"
              exit={{ opacity: 0, y: 8 }}
              initial={{ opacity: 0, y: 8 }}
              key="untimed"
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
            >
              No match clock. The bracket advances only when a player wins.
            </motion.p>
          )}
        </AnimatePresence>

        <div className="setup-target">
          <NumberField
            error={errors?.targetScore}
            help="One target keeps every tournament match on the same rules."
            id="target-score"
            label="Every match plays to"
            max={99}
            min={1}
            onChange={(value) => setNumber("targetScore", value)}
            suffix="pts"
            value={numbers.targetScore}
          />
          <div
            className="setup-target-presets"
            aria-label="Target score presets"
          >
            {[7, 11].map((preset) => (
              <button
                aria-pressed={numbers.targetScore === String(preset)}
                key={preset}
                onClick={() => setNumber("targetScore", String(preset))}
                type="button"
              >
                Play to {preset}
              </button>
            ))}
          </div>
        </div>
      </div>
    </fieldset>
  );
}
