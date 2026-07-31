"use client";

import { ArrowRight, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { SlidingChoice } from "@/src/shared/ui";
import { createScoringState } from "../../match/scoring";
import type { ScoringState } from "../../match/types";

export function QuickMatchSetup({
  onStart,
}: {
  onStart: (scorer: ScoringState) => void;
}) {
  const [doubles, setDoubles] = useState(false);
  const [names, setNames] = useState(["", "", "", ""]);
  const [target, setTarget] = useState(11);
  const [timed, setTimed] = useState(false);
  const [minutes, setMinutes] = useState(15);
  const [error, setError] = useState("");
  const count = doubles ? 4 : 2;

  function submit(event: FormEvent) {
    event.preventDefault();
    const active = names.slice(0, count).map((name) => name.trim());
    if (active.some((name) => !name)) {
      setError("Add a name for every player.");
      return;
    }
    if (new Set(active.map((name) => name.toLowerCase())).size !== count) {
      setError("Player names must be unique.");
      return;
    }
    if (!Number.isInteger(target) || target < 1 || target > 99) {
      setError("Play-to score must be a whole number from 1 to 99.");
      return;
    }
    if (timed && (!Number.isInteger(minutes) || minutes < 1 || minutes > 120)) {
      setError("Time cap must be a whole number from 1 to 120 minutes.");
      return;
    }
    setError("");
    const sideAIds = doubles ? ["quick-a1", "quick-a2"] : ["quick-a1"];
    const sideBIds = doubles ? ["quick-b1", "quick-b2"] : ["quick-b1"];
    onStart(
      createScoringState({
        sideA: { memberIds: sideAIds },
        sideB: { memberIds: sideBIds },
        labelA: active.slice(0, doubles ? 2 : 1).join(" + "),
        labelB: active.slice(doubles ? 2 : 1).join(" + "),
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
            onChange={(format) => setDoubles(format === "doubles")}
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
              <label key={index}>
                <span>
                  {doubles
                    ? `Team ${index < 2 ? "A" : "B"} · Player ${(index % 2) + 1}`
                    : `Side ${index === 0 ? "A" : "B"}`}
                </span>
                <input
                  autoComplete="off"
                  maxLength={40}
                  onChange={(event) =>
                    setNames((current) =>
                      current.map((name, nameIndex) =>
                        nameIndex === index ? event.target.value : name,
                      ),
                    )
                  }
                  value={names[index]}
                />
              </label>
            ))}
          </div>
        </fieldset>
        <div className="quick-rules">
          <label>
            <span>Play to</span>
            <input
              max={99}
              min={1}
              onChange={(event) => setTarget(event.target.valueAsNumber)}
              type="number"
              value={target}
            />
          </label>
          <fieldset className="quick-timing">
            <legend>Match clock</legend>
            <SlidingChoice
              ariaLabel="Match clock"
              onChange={(mode) => setTimed(mode === "timed")}
              options={[
                { label: "No time cap", value: "untimed" },
                { label: "Timed", value: "timed" },
              ]}
              value={timed ? "timed" : "untimed"}
            />
            {timed ? (
              <label>
                <span>Time cap · minutes</span>
                <input
                  max={120}
                  min={1}
                  onChange={(event) => setMinutes(event.target.valueAsNumber)}
                  type="number"
                  value={minutes}
                />
              </label>
            ) : null}
          </fieldset>
        </div>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="primary-button quick-submit" type="submit">
          Open scorer <ArrowRight aria-hidden="true" size={19} />
        </button>
      </form>
    </main>
  );
}
