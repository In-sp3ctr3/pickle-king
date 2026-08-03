"use client";

import { ArrowRight, Users } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type FormEvent } from "react";
import { ActionButton, NameCombobox, SlidingChoice } from "@/src/shared/ui";
import { createScoringState } from "../../match/scoring";
import type { ScoringState } from "../../match/types";

export function QuickMatchSetup({
  onStart,
  suggestions = [],
}: {
  onStart: (scorer: ScoringState) => void;
  suggestions?: string[];
}) {
  const [doubles, setDoubles] = useState(false);
  const [names, setNames] = useState(["", "", "", ""]);
  const [target, setTarget] = useState(11);
  const [timed, setTimed] = useState(false);
  const [minutes, setMinutes] = useState(15);
  const [errors, setErrors] = useState<{
    minutes?: string;
    names: Record<number, string>;
    target?: string;
  }>({ names: {} });
  const [validationAttempt, setValidationAttempt] = useState(0);
  const reducedMotion = useReducedMotion();
  const count = doubles ? 4 : 2;

  function clearFieldError(field: "minutes" | "target") {
    setErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  }

  function clearNameError(index: number) {
    setErrors((current) => {
      if (!current.names[index]) return current;
      const nextNames = { ...current.names };
      delete nextNames[index];
      return { ...current, names: nextNames };
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const active = names.slice(0, count).map((name) => name.trim());
    const nextErrors: typeof errors = { names: {} };
    active.forEach((name, index) => {
      if (!name) nextErrors.names[index] = "Enter a player name.";
    });
    const normalized = active.map((name) => name.toLowerCase());
    normalized.forEach((name, index) => {
      if (
        name &&
        normalized.filter((candidate) => candidate === name).length > 1
      ) {
        nextErrors.names[index] = "Use a unique player name.";
      }
    });
    if (!Number.isInteger(target) || target < 1 || target > 99) {
      nextErrors.target = "Use a whole number from 1 to 99.";
    }
    if (timed && (!Number.isInteger(minutes) || minutes < 1 || minutes > 120)) {
      nextErrors.minutes = "Use a whole number from 1 to 120.";
    }
    setValidationAttempt((attempt) => attempt + 1);
    setErrors(nextErrors);
    if (
      Object.keys(nextErrors.names).length ||
      nextErrors.target ||
      nextErrors.minutes
    ) {
      return;
    }
    const sideAIds = doubles ? ["quick-a1", "quick-a2"] : ["quick-a1"];
    const sideBIds = doubles ? ["quick-b1", "quick-b2"] : ["quick-b1"];
    onStart(
      createScoringState({
        sideA: { memberIds: sideAIds },
        sideB: { memberIds: sideBIds },
        labelA: active.slice(0, doubles ? 2 : 1).join(" + "),
        labelB: active.slice(doubles ? 2 : 1).join(" + "),
        participantNames: {
          sideA: active.slice(0, doubles ? 2 : 1),
          sideB: active.slice(doubles ? 2 : 1),
        },
        targetScore: target,
        durationMs: timed ? minutes * 60_000 : null,
      }),
    );
  }

  return (
    <main
      className="quick-setup mx-auto w-full max-w-[900px] px-5 py-10 sm:px-10 sm:py-16"
      data-qa="quick-match-setup"
    >
      <p className="eyebrow mt-6">Standalone scorer</p>
      <h1>Quick match.</h1>
      <p className="lede">
        No bracket, no setup marathon. Pick sides, choose your rules, and play.
      </p>
      <form className="quick-form" onSubmit={submit}>
        <fieldset>
          <legend>Format</legend>
          <SlidingChoice
            ariaLabel="Match format"
            onChange={(format) => {
              setDoubles(format === "doubles");
              setErrors({ names: {} });
            }}
            options={[
              { label: "Singles", value: "singles" },
              {
                icon: <Users aria-hidden="true" size={18} />,
                label: "Doubles",
                value: "doubles",
              },
            ]}
            value={doubles ? "doubles" : "singles"}
          />
        </fieldset>
        <fieldset>
          <legend>Players</legend>
          <div className="quick-player-grid">
            {Array.from({ length: count }, (_, index) => (
              <motion.div
                animate={
                  errors.names[index] && validationAttempt
                    ? { x: [0, -7, 6, -3, 0] }
                    : { x: 0 }
                }
                className={errors.names[index] ? "is-invalid" : undefined}
                key={`${index}-${errors.names[index] ? validationAttempt : 0}`}
                transition={{ duration: reducedMotion ? 0 : 0.32 }}
              >
                <NameCombobox
                  describedBy={
                    errors.names[index]
                      ? `quick-name-${index}-error`
                      : undefined
                  }
                  invalid={Boolean(errors.names[index])}
                  label={
                    doubles
                      ? `Team ${index < 2 ? "A" : "B"} · Player ${(index % 2) + 1}`
                      : `Side ${index === 0 ? "A" : "B"}`
                  }
                  onChange={(value) => {
                    setNames((current) =>
                      current.map((name, nameIndex) =>
                        nameIndex === index ? value : name,
                      ),
                    );
                    clearNameError(index);
                  }}
                  suggestions={suggestions.filter(
                    (suggestion) =>
                      !names.some(
                        (name, nameIndex) =>
                          nameIndex !== index &&
                          name.trim().toLocaleLowerCase() ===
                            suggestion.toLocaleLowerCase(),
                      ),
                  )}
                  value={names[index]}
                />
                {errors.names[index] ? (
                  <small
                    className="quick-field-error"
                    id={`quick-name-${index}-error`}
                  >
                    {errors.names[index]}
                  </small>
                ) : null}
              </motion.div>
            ))}
          </div>
        </fieldset>
        <div className="quick-rules">
          <motion.label
            animate={
              errors.target && validationAttempt
                ? { x: [0, -7, 6, -3, 0] }
                : { x: 0 }
            }
            className={errors.target ? "is-invalid" : undefined}
            key={`target-${errors.target ? validationAttempt : 0}`}
            transition={{ duration: reducedMotion ? 0 : 0.32 }}
          >
            <span>Play to</span>
            <input
              aria-describedby={
                errors.target ? "quick-target-error" : undefined
              }
              aria-invalid={Boolean(errors.target)}
              max={99}
              min={1}
              onChange={(event) => {
                setTarget(event.target.valueAsNumber);
                clearFieldError("target");
              }}
              type="number"
              value={target}
            />
            {errors.target ? (
              <small className="quick-field-error" id="quick-target-error">
                {errors.target}
              </small>
            ) : null}
          </motion.label>
          <fieldset className="quick-timing">
            <legend>Match clock</legend>
            <SlidingChoice
              ariaLabel="Match clock"
              onChange={(mode) => {
                setTimed(mode === "timed");
                if (mode === "untimed") clearFieldError("minutes");
              }}
              options={[
                { label: "No time cap", value: "untimed" },
                { label: "Timed", value: "timed" },
              ]}
              value={timed ? "timed" : "untimed"}
            />
            <AnimatePresence initial={false}>
              {timed ? (
                <motion.label
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  className={errors.minutes ? "is-invalid" : undefined}
                  data-motion-state="open"
                  exit={{ height: 0, opacity: 0, y: -8 }}
                  initial={{ height: 0, opacity: 0, y: -10 }}
                  key={`time-cap-${errors.minutes ? validationAttempt : 0}`}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { bounce: 0.18, duration: 0.42, type: "spring" }
                  }
                >
                  <span>Time cap · minutes</span>
                  <input
                    aria-describedby={
                      errors.minutes ? "quick-minutes-error" : undefined
                    }
                    aria-invalid={Boolean(errors.minutes)}
                    max={120}
                    min={1}
                    onChange={(event) => {
                      setMinutes(event.target.valueAsNumber);
                      clearFieldError("minutes");
                    }}
                    type="number"
                    value={minutes}
                  />
                  {errors.minutes ? (
                    <small
                      className="quick-field-error"
                      id="quick-minutes-error"
                    >
                      {errors.minutes}
                    </small>
                  ) : null}
                </motion.label>
              ) : null}
            </AnimatePresence>
          </fieldset>
        </div>
        <p className="sr-only" role="alert">
          {Object.keys(errors.names).length || errors.target || errors.minutes
            ? "Fix the highlighted match details."
            : ""}
        </p>
        <ActionButton className="quick-submit" type="submit">
          Open scorer <ArrowRight aria-hidden="true" size={19} />
        </ActionButton>
      </form>
    </main>
  );
}
