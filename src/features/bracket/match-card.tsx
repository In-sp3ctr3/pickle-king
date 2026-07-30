import { ActionButton, StatusLabel } from "@/src/shared/ui";
import type { Match } from "@/src/tournament";
import { Crown, Play } from "lucide-react";

export interface MatchCardProps {
  canStart: boolean;
  label: string;
  match: Match;
  onCorrectMatch: (matchId: string) => void;
  onStartMatch: (matchId: string) => void;
  sideALabel: string;
  sideBLabel: string;
}

export function MatchCard({
  canStart,
  label,
  match,
  onCorrectMatch,
  onStartMatch,
  sideALabel,
  sideBLabel,
}: MatchCardProps) {
  const isReady = match.status === "ready";
  const borderClass = isReady
    ? "border-[#c8ff3d]"
    : match.status === "live"
      ? "border-[#ff7a4d]"
      : "border-[#2b3227]";

  return (
    <article
      aria-label={`${label}: ${sideALabel} versus ${sideBLabel}`}
      className={`relative border-l-2 bg-[#11150f] p-4 sm:p-5 ${borderClass}`}
      data-match-status={match.status}
    >
      <header className="mb-3 flex min-h-8 items-center justify-between gap-3">
        <p className="text-[0.68rem] font-extrabold tracking-[0.14em] text-[#737b6c] uppercase">
          {label}
        </p>
        <StatusLabel status={match.status} />
      </header>

      <div className="divide-y divide-[#2b3227] border-y border-[#2b3227]">
        <MatchSideRow
          isWinner={match.winnerId === match.sideA?.memberIds[0]}
          label={sideALabel}
          score={match.scoreA}
        />
        <MatchSideRow
          isWinner={match.winnerId === match.sideB?.memberIds[0]}
          label={sideBLabel}
          score={match.scoreB}
        />
      </div>

      {isReady && canStart ? (
        <ActionButton
          className="mt-4 w-full"
          onClick={() => onStartMatch(match.id)}
        >
          <Play aria-hidden="true" fill="currentColor" size={17} />
          Start match
        </ActionButton>
      ) : null}
      {match.status === "complete" ? (
        <ActionButton
          className="mt-4 w-full"
          onClick={() => onCorrectMatch(match.id)}
          variant="secondary"
        >
          Correct result
        </ActionButton>
      ) : null}
    </article>
  );
}

function MatchSideRow({
  isWinner,
  label,
  score,
}: {
  isWinner: boolean;
  label: string;
  score: number;
}) {
  return (
    <div className="grid min-h-15 grid-cols-[minmax(0,1fr)_3rem] items-center gap-3">
      <span
        className={`flex min-w-0 items-center gap-2 truncate text-sm font-bold sm:text-base ${
          label === "To be decided" ? "text-[#737b6c]" : "text-[#f5f3e9]"
        }`}
      >
        {isWinner ? (
          <Crown
            aria-label="Winner"
            className="shrink-0 text-[#c8ff3d]"
            size={16}
          />
        ) : null}
        <span className="truncate">{label}</span>
      </span>
      <span className="text-right text-3xl leading-none font-black tabular-nums">
        {score}
      </span>
    </div>
  );
}
