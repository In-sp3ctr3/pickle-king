"use client";

import { ActionButton } from "@/src/shared/ui";
import { ArrowRight, Plus, Users } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { NumberField } from "./number-field";
import { PlayerRow } from "./player-row";
import type {
  SetupPlayerDraft,
  TournamentSetupInitialValues,
  TournamentSetupValues,
} from "./setup-types";
import { validateSetup } from "./setup-validation";

export interface TournamentSetupProps {
  initialValues?: TournamentSetupInitialValues;
  onSubmit: (values: TournamentSetupValues) => void;
}

function makeInitialPlayers(
  initialValues?: TournamentSetupInitialValues,
): SetupPlayerDraft[] {
  const supplied = initialValues?.players ?? [];
  const count = Math.max(4, Math.min(16, supplied.length));
  return Array.from({ length: count }, (_, index) => ({
    id: `initial-${index + 1}`,
    name: supplied[index]?.name ?? "",
    rating: supplied[index]?.rating ?? "",
  }));
}

export function TournamentSetup({
  initialValues,
  onSubmit,
}: TournamentSetupProps) {
  const [players, setPlayers] = useState<SetupPlayerDraft[]>(() =>
    makeInitialPlayers(initialValues),
  );
  const [numbers, setNumbers] = useState({
    bookingMinutes: String(initialValues?.bookingMinutes ?? 120),
    warmupMinutes: String(initialValues?.warmupMinutes ?? 10),
    transitionSeconds: String(initialValues?.transitionSeconds ?? 60),
    targetScore: String(initialValues?.targetScore ?? 11),
  });
  const [showErrors, setShowErrors] = useState(false);
  const nextPlayerId = useRef(players.length + 1);
  const validation = validateSetup(players, numbers);
  const errors = showErrors ? validation.errors : undefined;

  function updatePlayer(updatedPlayer: SetupPlayerDraft) {
    setPlayers((current) =>
      current.map((player) =>
        player.id === updatedPlayer.id ? updatedPlayer : player,
      ),
    );
  }

  function addPlayer() {
    if (players.length >= 16) return;
    const id = `added-${nextPlayerId.current}`;
    nextPlayerId.current += 1;
    setPlayers((current) => [...current, { id, name: "", rating: "" }]);
  }

  function removePlayer(id: string) {
    if (players.length <= 4) return;
    setPlayers((current) => current.filter((player) => player.id !== id));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);
    const result = validateSetup(players, numbers);
    if (!result.values) return;
    onSubmit(result.values);
  }

  const errorCount = errors
    ? Object.keys(errors.names).length +
      Object.keys(errors.ratings).length +
      [
        errors.form,
        errors.bookingMinutes,
        errors.warmupMinutes,
        errors.transitionSeconds,
        errors.targetScore,
      ].filter(Boolean).length
    : 0;

  return (
    <main
      className="mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-10 sm:py-16"
      data-qa="tournament-setup"
    >
      <header className="mb-10 border-b border-[#2b3227] pb-8">
        <p className="mb-4 text-xs font-extrabold tracking-[0.18em] text-[#c8ff3d] uppercase">
          Tournament setup
        </p>
        <h1 className="max-w-[12ch] text-[clamp(3.2rem,8vw,6.5rem)] leading-[0.84] font-black tracking-[-0.06em] uppercase">
          Build the field.
        </h1>
        <p className="mt-5 max-w-2xl leading-7 text-[#9da494]">
          Add the crew and their current ratings. Pickle King uses both to seed
          a fair bracket and fit it inside your court time.
        </p>
      </header>

      <form noValidate onSubmit={handleSubmit}>
        {showErrors && errorCount > 0 ? (
          <div
            aria-live="polite"
            className="mb-8 border-l-4 border-[#ff7a4d] bg-[#ff7a4d]/8 px-5 py-4"
            role="alert"
          >
            <p className="font-extrabold text-[#ffb097]">
              Fix {errorCount} {errorCount === 1 ? "detail" : "details"} before
              building the bracket.
            </p>
            {errors?.form ? (
              <p className="mt-1 text-sm text-[#ffb097]">{errors.form}</p>
            ) : null}
          </div>
        ) : null}

        <fieldset>
          <legend className="mb-2 flex items-center gap-3 text-lg font-black tracking-[0.06em] uppercase">
            <Users aria-hidden="true" className="text-[#c8ff3d]" size={21} />
            Players
            <span className="text-sm text-[#737b6c] tabular-nums">
              {players.length}/16
            </span>
          </legend>
          <p className="mb-3 text-sm leading-6 text-[#9da494]">
            Four players minimum. Names must be unique and ratings are required.
          </p>

          <div>
            {players.map((player, index) => (
              <PlayerRow
                canRemove={players.length > 4}
                index={index}
                key={player.id}
                nameError={errors?.names[player.id]}
                onChange={updatePlayer}
                onRemove={() => removePlayer(player.id)}
                player={player}
                ratingError={errors?.ratings[player.id]}
              />
            ))}
          </div>

          <ActionButton
            aria-label={
              players.length >= 16
                ? "Sixteen player maximum reached"
                : "Add another player"
            }
            className="mt-5"
            disabled={players.length >= 16}
            onClick={addPlayer}
            title={
              players.length >= 16
                ? "Sixteen player maximum"
                : "Add another player"
            }
            variant="secondary"
          >
            <Plus aria-hidden="true" size={19} />
            Add player
          </ActionButton>
        </fieldset>

        <fieldset className="mt-12 border-t border-[#2b3227] pt-8">
          <legend className="px-0 text-lg font-black tracking-[0.06em] uppercase">
            Court plan
          </legend>
          <p className="mt-2 mb-6 max-w-2xl text-sm leading-6 text-[#9da494]">
            We use these limits to protect warmup, changeovers, and the final.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <NumberField
              error={errors?.bookingMinutes}
              help="Total reserved court time (30–480)."
              id="booking-minutes"
              label="Court booking"
              max={480}
              min={30}
              onChange={(bookingMinutes) =>
                setNumbers((current) => ({ ...current, bookingMinutes }))
              }
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
              onChange={(warmupMinutes) =>
                setNumbers((current) => ({ ...current, warmupMinutes }))
              }
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
              onChange={(transitionSeconds) =>
                setNumbers((current) => ({ ...current, transitionSeconds }))
              }
              suffix="sec"
              value={numbers.transitionSeconds}
            />
            <div className="grid gap-3">
              <NumberField
                error={errors?.targetScore}
                help="Choose 7, 11, or any custom target from 1–99."
                id="target-score"
                label="Play to"
                max={99}
                min={1}
                onChange={(targetScore) =>
                  setNumbers((current) => ({ ...current, targetScore }))
                }
                suffix="pts"
                value={numbers.targetScore}
              />
              <div className="flex gap-2" aria-label="Target score presets">
                {[7, 11].map((preset) => (
                  <button
                    aria-pressed={numbers.targetScore === String(preset)}
                    className="min-h-12 flex-1 rounded-[18px] border border-[#3b4436] text-sm font-extrabold aria-pressed:border-[#c8ff3d] aria-pressed:bg-[#c8ff3d] aria-pressed:text-[#090b08]"
                    key={preset}
                    onClick={() =>
                      setNumbers((current) => ({
                        ...current,
                        targetScore: String(preset),
                      }))
                    }
                    type="button"
                  >
                    Play to {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </fieldset>

        <div className="mt-10 flex justify-end border-t border-[#2b3227] pt-6">
          <ActionButton className="w-full sm:w-auto sm:min-w-64" type="submit">
            Build bracket
            <ArrowRight aria-hidden="true" size={19} />
          </ActionButton>
        </div>
      </form>
    </main>
  );
}
