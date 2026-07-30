import { SKILL_LEVELS, type SkillLevel } from "@/src/tournament";
import { ActionButton } from "@/src/shared/ui";
import { ChevronDown, Trash2 } from "lucide-react";
import type { SetupPlayerDraft } from "./setup-types";

interface PlayerRowProps {
  index: number;
  player: SetupPlayerDraft;
  nameError?: string;
  ratingError?: string;
  onChange: (player: SetupPlayerDraft) => void;
  onRemove: () => void;
}

export function PlayerRow({
  index,
  player,
  nameError,
  ratingError,
  onChange,
  onRemove,
}: PlayerRowProps) {
  const nameErrorId = `player-${player.id}-name-error`;
  const ratingErrorId = `player-${player.id}-rating-error`;

  return (
    <div className="setup-player-row">
      <span className="setup-player-seed">
        {String(index + 1).padStart(2, "0")}
      </span>

      <label className="setup-field">
        <span>Player name</span>
        <input
          aria-describedby={nameError ? nameErrorId : undefined}
          aria-invalid={Boolean(nameError)}
          autoComplete="off"
          maxLength={40}
          onChange={(event) =>
            onChange({ ...player, name: event.currentTarget.value })
          }
          placeholder={`Player ${index + 1}`}
          required
          value={player.name}
        />
        {nameError ? (
          <span className="setup-field-error" id={nameErrorId}>
            {nameError}
          </span>
        ) : null}
      </label>

      <label className="setup-field">
        <span>Rating</span>
        <span className="setup-select-wrap">
          <select
            aria-describedby={ratingError ? ratingErrorId : undefined}
            aria-invalid={Boolean(ratingError)}
            onChange={(event) =>
              onChange({
                ...player,
                rating: event.currentTarget.value as SkillLevel | "",
              })
            }
            required
            value={player.rating}
          >
            <option value="">Select</option>
            {SKILL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" size={18} strokeWidth={2.4} />
        </span>
        {ratingError ? (
          <span className="setup-field-error" id={ratingErrorId}>
            {ratingError}
          </span>
        ) : null}
      </label>

      <ActionButton
        aria-label={`Remove player ${index + 1}`}
        className="setup-remove-player"
        onClick={onRemove}
        title={`Remove player ${index + 1}`}
        variant="quiet"
      >
        <Trash2 aria-hidden="true" size={19} />
        <span className="sm:sr-only">Remove player</span>
      </ActionButton>
    </div>
  );
}
