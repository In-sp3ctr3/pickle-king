import { ActionButton } from "@/src/shared/ui";
import { Trash2 } from "lucide-react";
import type { SetupPlayerDraft } from "./setup-types";
import { RatingSelect } from "./rating-select";

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
    <div
      className="setup-player-row"
      data-invalid={Boolean(nameError || ratingError)}
    >
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

      <div className="setup-field">
        <span id={`player-${player.id}-rating-label`}>Rating</span>
        <RatingSelect
          describedBy={ratingError ? ratingErrorId : undefined}
          id={`player-${player.id}-rating`}
          invalid={Boolean(ratingError)}
          onChange={(rating) => onChange({ ...player, rating })}
          value={player.rating}
        />
        {ratingError ? (
          <span className="setup-field-error" id={ratingErrorId}>
            {ratingError}
          </span>
        ) : null}
      </div>

      <ActionButton
        aria-label={`Remove player ${index + 1}`}
        className="setup-remove-player"
        onClick={onRemove}
        title={`Remove player ${index + 1}`}
        variant="quiet"
      >
        <Trash2 aria-hidden="true" size={19} />
        <span className="sr-only">Remove player</span>
      </ActionButton>
    </div>
  );
}
