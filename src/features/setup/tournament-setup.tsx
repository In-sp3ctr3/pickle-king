"use client";

import { ActionButton } from "@/src/shared/ui";
import { nextPowerOfTwo } from "@/src/tournament";
import { Plus, RotateCcw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { CourtPlan } from "./court-plan";
import { DrawStyleField } from "./draw-style-field";
import { FormatField } from "./format-field";
import { FormatStatus } from "./format-status";
import { MinimumPlayersDialog } from "./minimum-players-dialog";
import { PlayerRow } from "./player-row";
import { SetupSubmit } from "./setup-submit";
import type {
  SetupNumberDrafts,
  SetupPlayerDraft,
  TournamentSetupInitialValues,
  TournamentSetupValues,
} from "./setup-types";
import { validateSetup } from "./setup-validation";

export interface TournamentSetupProps {
  initialValues?: TournamentSetupInitialValues;
  onQuickMatch: () => void;
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

function makeInitialNumbers(
  initialValues?: TournamentSetupInitialValues,
): SetupNumberDrafts {
  return {
    bookingMinutes: String(initialValues?.bookingMinutes ?? 120),
    warmupMinutes: String(initialValues?.warmupMinutes ?? 10),
    transitionSeconds: String(initialValues?.transitionSeconds ?? 60),
    targetScore: String(initialValues?.targetScore ?? 11),
  };
}

export function TournamentSetup({
  initialValues,
  onQuickMatch,
  onSubmit,
}: TournamentSetupProps) {
  const reducedMotion = useReducedMotion();
  const [players, setPlayers] = useState<SetupPlayerDraft[]>(() =>
    makeInitialPlayers(initialValues),
  );
  const [format, setFormat] = useState<TournamentSetupValues["format"]>(() =>
    initialValues?.format === "round-robin-finals" && players.length <= 6
      ? "round-robin-finals"
      : "knockout",
  );
  const [timingMode, setTimingMode] = useState<
    TournamentSetupValues["timingMode"]
  >(initialValues?.timingMode ?? "timed");
  const [drawStyle, setDrawStyle] = useState<
    TournamentSetupValues["drawStyle"]
  >(initialValues?.drawStyle ?? "ranked");
  const [numbers, setNumbers] = useState<SetupNumberDrafts>(() =>
    makeInitialNumbers(initialValues),
  );
  const [showErrors, setShowErrors] = useState(false);
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [showMinimumDialog, setShowMinimumDialog] = useState(false);
  const [formatStatus, setFormatStatus] = useState("");
  const nextPlayerId = useRef(players.length + 1);
  const formRef = useRef<HTMLFormElement>(null);
  const validation = validateSetup(players, numbers, timingMode, format);
  const errors = showErrors ? validation.errors : undefined;
  const automaticAdvanceCount = nextPowerOfTwo(players.length) - players.length;
  const clearFormatStatus = useCallback(() => setFormatStatus(""), []);

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
    if (format === "round-robin-finals" && players.length >= 6) {
      setFormat("knockout");
      setFormatStatus(
        "Fast knockout selected because round robin + finals supports 4–6 players.",
      );
    }
    setPlayers((current) => [...current, { id, name: "", rating: "" }]);
  }

  function removePlayer(id: string) {
    if (players.length <= 4) {
      setShowMinimumDialog(true);
      return;
    }
    setPlayers((current) => current.filter((player) => player.id !== id));
  }

  function resetAllFields() {
    setPlayers(makeInitialPlayers());
    setFormat("knockout");
    setFormatStatus("");
    setTimingMode("timed");
    setDrawStyle("ranked");
    setNumbers(makeInitialNumbers());
    setShowErrors(false);
    setValidationAttempt(0);
    nextPlayerId.current = 5;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);
    setValidationAttempt((attempt) => attempt + 1);
    const result = validateSetup(players, numbers, timingMode, format);
    if (result.values) {
      onSubmit({ ...result.values, drawStyle, format });
      return;
    }
    window.requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
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
    <main className="setup-screen" data-qa="tournament-setup">
      <header className="setup-header">
        <p>Tournament setup</p>
        <h1>Build the field.</h1>
        <span>
          Add the crew and a rough skill level. Ratings guide the tournament
          only when you choose a ranked draw.
        </span>
      </header>

      <form
        className="setup-form"
        noValidate
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <div className="setup-reset-row">
          <ActionButton
            aria-label="Reset all fields"
            className="setup-reset"
            onClick={resetAllFields}
            title="Clear players and restore default rules"
            type="button"
            variant="quiet"
          >
            <RotateCcw aria-hidden="true" size={17} />
            Reset all
          </ActionButton>
        </div>
        {showErrors && errorCount > 0 ? (
          <div aria-live="polite" className="setup-error-summary" role="alert">
            <p>A few details need your attention.</p>
            <span>
              {errorCount} {errorCount === 1 ? "field is" : "fields are"}{" "}
              highlighted below.
            </span>
            {errors?.form ? <span>{errors.form}</span> : null}
          </div>
        ) : null}

        <fieldset className="setup-player-fieldset">
          <legend>
            <span aria-hidden="true" className="setup-section-number">
              01
            </span>
            <span className="setup-section-title">The field</span>
            <span className="setup-section-count">{players.length}/16</span>
          </legend>
          <p>Four minimum. Names must be unique and ratings are required.</p>

          <div className="setup-player-list">
            <AnimatePresence initial={false}>
              {players.map((player, index) => (
                <motion.div
                  animate={{ height: "auto", y: 0 }}
                  exit={{ height: 0, y: -8 }}
                  initial={reducedMotion ? false : { height: 0, y: 10 }}
                  key={player.id}
                  layout={!reducedMotion}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { duration: 0.24, ease: "easeOut" }
                  }
                >
                  <motion.div
                    animate={
                      errors?.names[player.id] || errors?.ratings[player.id]
                        ? { x: [0, -7, 6, -3, 0] }
                        : { x: 0 }
                    }
                    key={`validation-${validationAttempt}`}
                    transition={{ duration: reducedMotion ? 0 : 0.32 }}
                  >
                    <PlayerRow
                      index={index}
                      nameError={errors?.names[player.id]}
                      onChange={updatePlayer}
                      onRemove={() => removePlayer(player.id)}
                      player={player}
                      ratingError={errors?.ratings[player.id]}
                    />
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <ActionButton
            aria-label={
              players.length >= 16
                ? "Sixteen player maximum reached"
                : "Add another player"
            }
            className="setup-add-player"
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

        <FormatField
          onChange={setFormat}
          playerCount={players.length}
          value={format}
        />

        <FormatStatus message={formatStatus} onClear={clearFormatStatus} />

        <DrawStyleField
          format={format}
          onChange={setDrawStyle}
          value={drawStyle}
        />

        <CourtPlan
          errors={errors}
          numbers={numbers}
          onNumbersChange={setNumbers}
          onTimingModeChange={setTimingMode}
          timingMode={timingMode}
        />

        <SetupSubmit
          automaticAdvanceCount={automaticAdvanceCount}
          drawStyle={drawStyle}
          format={format}
          numbers={numbers}
          playerCount={players.length}
          timingMode={timingMode}
        />
      </form>

      <MinimumPlayersDialog
        onClose={() => setShowMinimumDialog(false)}
        onQuickMatch={onQuickMatch}
        open={showMinimumDialog}
      />
    </main>
  );
}
