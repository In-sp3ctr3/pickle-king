"use client";

import { ActionButton, StatusLabel } from "@/src/shared/ui";
import type { Match } from "@/src/tournament";
import { Crown, FastForward, PencilLine, Play, Trophy } from "lucide-react";
import { useState } from "react";
import { InlineScoreEditor } from "./inline-score-editor";

export type CorrectMatch = (
  matchId: string,
  scoreA: number,
  scoreB: number,
  winnerIdOverride?: string,
) => boolean;

export interface MatchCardProps {
  canStart: boolean;
  label: string;
  match: Match;
  onCorrectMatch: CorrectMatch;
  onStartMatch: (matchId: string) => void;
  sideALabel: string;
  sideBLabel: string;
}

export function MatchCard(props: MatchCardProps) {
  const { canStart, label, match, sideALabel, sideBLabel } = props;
  const [editing, setEditing] = useState(false);
  const complete = match.status === "complete";
  if (editing) {
    return (
      <article
        aria-label={`Editing ${label}: ${sideALabel} versus ${sideBLabel}`}
        className="tree-match-card tree-match-card--editing"
        data-match-status={match.status}
      >
        <InlineScoreEditor
          match={match}
          onCancel={() => setEditing(false)}
          onSave={props.onCorrectMatch}
          sideALabel={sideALabel}
          sideBLabel={sideBLabel}
        />
      </article>
    );
  }
  return (
    <article
      aria-label={`${label}: ${sideALabel} versus ${sideBLabel}`}
      className={`tree-match-card tree-match-card--${match.status} ${
        canStart ? "tree-match-card--next" : ""
      }`}
      data-match-queue-state={
        canStart ? "next" : match.status === "ready" ? "queued" : match.status
      }
      data-match-status={match.status}
    >
      <div className="tree-match-card__body">
        <MatchHeader canStart={canStart} label={label} match={match} />
        <div className="tree-match-card__sides">
          <MatchSideRow
            isLoser={complete && match.loserId === match.sideA?.memberIds[0]}
            isWinner={match.winnerId === match.sideA?.memberIds[0]}
            label={sideALabel}
            score={match.scoreA}
            showScore={match.status === "live" || complete}
          />
          <MatchSideRow
            isLoser={complete && match.loserId === match.sideB?.memberIds[0]}
            isWinner={match.winnerId === match.sideB?.memberIds[0]}
            label={sideBLabel}
            score={match.scoreB}
            showScore={match.status === "live" || complete}
          />
        </div>
      </div>
      <MatchAction {...props} onEdit={() => setEditing(true)} />
    </article>
  );
}

export function FinalMatchCard(props: MatchCardProps) {
  const { canStart, label, match, sideALabel, sideBLabel } = props;
  const [editing, setEditing] = useState(false);
  const complete = match.status === "complete";
  if (editing) {
    return (
      <article
        aria-label={`Editing ${label}: ${sideALabel} versus ${sideBLabel}`}
        className="tree-match-card final-match-card tree-match-card--editing"
        data-match-status={match.status}
      >
        <InlineScoreEditor
          match={match}
          onCancel={() => setEditing(false)}
          onSave={props.onCorrectMatch}
          sideALabel={sideALabel}
          sideBLabel={sideBLabel}
        />
      </article>
    );
  }
  return (
    <article
      aria-label={`${label}: ${sideALabel} versus ${sideBLabel}`}
      className={`tree-match-card final-match-card ${
        canStart ? "tree-match-card--next" : ""
      }`}
      data-match-queue-state={
        canStart ? "next" : match.status === "ready" ? "queued" : match.status
      }
      data-match-status={match.status}
    >
      <header>
        <span data-qa="final-status">
          <StatusLabel
            status={
              match.status === "ready" && !canStart ? "queued" : match.status
            }
          />
        </span>
      </header>
      <div className="final-match-card__faceoff" data-qa="final-faceoff">
        <FinalSide
          align="left"
          isLoser={complete && match.loserId === match.sideA?.memberIds[0]}
          isWinner={match.winnerId === match.sideA?.memberIds[0]}
          label={sideALabel}
          score={match.scoreA}
          showScore={match.status === "live" || complete}
        />
        <Trophy aria-label="Final trophy" size={28} strokeWidth={1.8} />
        <FinalSide
          align="right"
          isLoser={complete && match.loserId === match.sideB?.memberIds[0]}
          isWinner={match.winnerId === match.sideB?.memberIds[0]}
          label={sideBLabel}
          score={match.scoreB}
          showScore={match.status === "live" || complete}
        />
      </div>
      <MatchAction {...props} onEdit={() => setEditing(true)} />
    </article>
  );
}

function MatchHeader({
  canStart,
  label,
  match,
}: Pick<MatchCardProps, "canStart" | "label" | "match">) {
  return (
    <header>
      <p>{label}</p>
      <StatusLabel
        status={match.status === "ready" && !canStart ? "queued" : match.status}
      />
    </header>
  );
}

function MatchAction({
  canStart,
  match,
  onStartMatch,
  onEdit,
  sideALabel,
  sideBLabel,
}: MatchCardProps & { onEdit: () => void }) {
  if (match.status === "ready" && canStart) {
    return (
      <ActionButton
        aria-label={`Start ${match.id}`}
        className="tree-match-card__action"
        data-qa="bracket-node-start"
        onClick={() => onStartMatch(match.id)}
        variant="inverse"
      >
        <Play aria-hidden="true" fill="currentColor" size={17} />
        <span className="sr-only">Start match</span>
      </ActionButton>
    );
  }
  if (match.status === "complete") {
    return (
      <ActionButton
        aria-label={`Edit score for ${sideALabel} versus ${sideBLabel}`}
        className="tree-match-card__action"
        data-qa="edit-bracket-score"
        onClick={onEdit}
        variant="quiet"
      >
        <PencilLine aria-hidden="true" size={16} />
        <span className="sr-only">Correct result</span>
      </ActionButton>
    );
  }
  return null;
}

function MatchSideRow({
  isLoser,
  isWinner,
  label,
  score,
  showScore,
}: {
  isLoser: boolean;
  isWinner: boolean;
  label: string;
  score: number;
  showScore: boolean;
}) {
  return (
    <div className={sideClass(isWinner, isLoser)}>
      <span className="tree-match-side__name">
        {isWinner ? <Crown aria-label="Winner" size={15} /> : null}
        <span>{label}</span>
      </span>
      <strong>{showScore ? score : "—"}</strong>
    </div>
  );
}

function FinalSide({
  align,
  isLoser,
  isWinner,
  label,
  score,
  showScore,
}: {
  align: "left" | "right";
  isLoser: boolean;
  isWinner: boolean;
  label: string;
  score: number;
  showScore: boolean;
}) {
  return (
    <div
      className={`final-match-side is-${align} ${sideClass(isWinner, isLoser)}`}
    >
      <span>{label}</span>
      <strong>{showScore ? score : "—"}</strong>
    </div>
  );
}

function sideClass(isWinner: boolean, isLoser: boolean) {
  return `tree-match-side ${
    isWinner
      ? "tree-match-side--winner"
      : isLoser
        ? "tree-match-side--loser"
        : ""
  }`;
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
      aria-label={`${label}: ${playerName} advances automatically`}
      className="tree-match-card tree-match-card--bye"
      data-qa="automatic-advance"
    >
      <div className="tree-match-card__body">
        <header>
          <p>{label}</p>
          <span className="tree-match-card__bye-status">
            <FastForward aria-hidden="true" size={13} />
            Automatic advance
          </span>
        </header>
        <div className="tree-match-card__automatic">
          <strong>{playerName}</strong>
          <span>No opponent this round</span>
        </div>
      </div>
    </article>
  );
}
