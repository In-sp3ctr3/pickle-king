import { SKILL_LEVELS, type SkillLevel } from "@/src/tournament";
import { ActionButton } from "@/src/shared/ui";
import { Trash2 } from "lucide-react";
import type { SetupPlayerDraft } from "./setup-types";

interface PlayerRowProps {
  index: number;
  player: SetupPlayerDraft;
  nameError?: string;
  ratingError?: string;
  canRemove: boolean;
  onChange: (player: SetupPlayerDraft) => void;
  onRemove: () => void;
}

export function PlayerRow({
  index,
  player,
  nameError,
  ratingError,
  canRemove,
  onChange,
  onRemove,
}: PlayerRowProps) {
  const nameErrorId = `player-${player.id}-name-error`;
  const ratingErrorId = `player-${player.id}-rating-error`;

  return (
    <div className="grid gap-3 border-b border-[#2b3227] py-4 sm:grid-cols-[2.5rem_minmax(0,1fr)_9rem_3.25rem] sm:items-start">
      <span className="flex min-h-12 items-center text-sm font-black text-[#737b6c]">
        {String(index + 1).padStart(2, "0")}
      </span>

      <label className="grid gap-1.5">
        <span className="text-[0.68rem] font-extrabold tracking-[0.14em] text-[#9da494] uppercase">
          Player name
        </span>
        <input
          aria-describedby={nameError ? nameErrorId : undefined}
          aria-invalid={Boolean(nameError)}
          autoComplete="off"
          className="min-h-12 w-full rounded-[18px] border border-[#3b4436] bg-[#090b08] px-4 text-base font-bold text-[#f5f3e9] placeholder:text-[#5f6659] hover:border-[#596452]"
          maxLength={40}
          onChange={(event) =>
            onChange({ ...player, name: event.currentTarget.value })
          }
          placeholder={`Player ${index + 1}`}
          required
          value={player.name}
        />
        {nameError ? (
          <span
            className="text-sm font-semibold text-[#ff9a78]"
            id={nameErrorId}
          >
            {nameError}
          </span>
        ) : null}
      </label>

      <label className="grid gap-1.5">
        <span className="text-[0.68rem] font-extrabold tracking-[0.14em] text-[#9da494] uppercase">
          Rating
        </span>
        <select
          aria-describedby={ratingError ? ratingErrorId : undefined}
          aria-invalid={Boolean(ratingError)}
          className="min-h-12 w-full rounded-[18px] border border-[#3b4436] bg-[#090b08] px-3 text-base font-bold text-[#f5f3e9] hover:border-[#596452]"
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
        {ratingError ? (
          <span
            className="text-sm font-semibold text-[#ff9a78]"
            id={ratingErrorId}
          >
            {ratingError}
          </span>
        ) : null}
      </label>

      <ActionButton
        aria-label={
          canRemove
            ? `Remove player ${index + 1}`
            : "At least four players are required"
        }
        className="self-end px-0"
        disabled={!canRemove}
        onClick={onRemove}
        title={canRemove ? `Remove player ${index + 1}` : "Four player minimum"}
        variant="quiet"
      >
        <Trash2 aria-hidden="true" size={19} />
        <span className="sm:sr-only">Remove player</span>
      </ActionButton>
    </div>
  );
}
