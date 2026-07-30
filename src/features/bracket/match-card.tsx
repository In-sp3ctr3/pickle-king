import { ActionButton, StatusLabel } from "@/src/shared/ui";
import type { Match } from "@/src/tournament";
import { Crown, FastForward, Play } from "lucide-react";

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
  return (
    <article
      aria-label={`${label}: ${sideALabel} versus ${sideBLabel}`}
      className={`tree-match-card tree-match-card--${match.status}`}
      data-match-status={match.status}
    >
      <header>
        <p>{label}</p>
        <StatusLabel status={match.status} />
      </header>

      <div className="tree-match-card__sides">
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
          className="tree-match-card__action"
          onClick={() => onStartMatch(match.id)}
        >
          <Play aria-hidden="true" fill="currentColor" size={17} />
          Start
        </ActionButton>
      ) : null}
      {match.status === "complete" ? (
        <ActionButton
          className="tree-match-card__action"
          onClick={() => onCorrectMatch(match.id)}
          variant="secondary"
        >
          Correct
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
    <div className="tree-match-side">
      <span
        className={`tree-match-side__name ${
          label === "To be decided" ? "text-[#818a7a]" : "text-[#f5f3e9]"
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
      <strong>{score}</strong>
    </div>
  );
}

export function ByeCard({
  label,
  playerName,
}: {
  label: string;
  playerName: string;
}) {
  return (
    <article
      aria-label={`${label}: ${playerName} advances with a bye`}
      className="tree-match-card tree-match-card--bye"
    >
      <header>
        <p>{label}</p>
        <span className="tree-match-card__bye-status">
          <FastForward aria-hidden="true" size={13} />
          Bye
        </span>
      </header>
      <div className="tree-match-card__sides">
        <div className="tree-match-side">
          <span className="tree-match-side__name text-[#f5f3e9]">
            {playerName}
          </span>
          <strong aria-label="Advanced">A</strong>
        </div>
        <div className="tree-match-side tree-match-side--bye">
          <span>Advances automatically</span>
        </div>
      </div>
    </article>
  );
}
