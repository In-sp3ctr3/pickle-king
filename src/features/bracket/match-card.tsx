"use client";

import { MeasuredLabel, StatusLabel } from "@/src/shared/ui";
import type { Match } from "@/src/tournament";
import { Crown, FastForward, Trophy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { InlineScoreEditor } from "./inline-score-editor";
import { FinalMatchSide } from "./final-match-side";
import { MatchEditAction, MatchStartAction } from "./match-card-action";

export type CorrectMatch = (
  matchId: string,
  scoreA: number,
  scoreB: number,
  winnerIdOverride?: string,
) => boolean;
export type RenamePlayer = (playerId: string, name: string) => boolean;

export interface MatchCardProps {
  canStart: boolean;
  recommended?: boolean;
  label: string;
  match: Match;
  onCorrectMatch: CorrectMatch;
  onRenamePlayer?: RenamePlayer;
  onStartMatch: (matchId: string) => void;
  sideALabel: string;
  sideBLabel: string;
}

export function MatchCard(props: MatchCardProps) {
  const { canStart, label, match, recommended, sideALabel, sideBLabel } = props;
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
          onRenamePlayer={props.onRenamePlayer}
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
        recommended
          ? "tree-match-card--next"
          : canStart
            ? "tree-match-card--available"
            : ""
      }`}
      data-match-queue-state={
        recommended
          ? "next"
          : canStart
            ? "available"
            : match.status === "ready"
              ? "queued"
              : match.status
      }
      data-match-status={match.status}
    >
      <div className="tree-match-card__body">
        <MatchHeader
          canStart={canStart}
          label={label}
          match={match}
          recommended={recommended}
        >
          <MatchEditAction
            match={match}
            onEdit={() => setEditing(true)}
            onRenamePlayer={props.onRenamePlayer}
            sideALabel={sideALabel}
            sideBLabel={sideBLabel}
          />
        </MatchHeader>
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
      <MatchStartAction {...props} />
    </article>
  );
}

export function FinalMatchCard(props: MatchCardProps) {
  const { canStart, label, match, recommended, sideALabel, sideBLabel } = props;
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
          onRenamePlayer={props.onRenamePlayer}
          sideALabel={sideALabel}
          sideBLabel={sideBLabel}
        />
      </article>
    );
  }
  return (
    <article
      aria-label={`${label}: ${sideALabel} versus ${sideBLabel}`}
      className={`tree-match-card final-match-card tree-match-card--${match.status} ${
        recommended
          ? "tree-match-card--next"
          : canStart
            ? "tree-match-card--available"
            : ""
      }`}
      data-match-queue-state={
        recommended
          ? "next"
          : canStart
            ? "available"
            : match.status === "ready"
              ? "queued"
              : match.status
      }
      data-match-status={match.status}
    >
      <header>
        <p data-qa="final-title">{label}</p>
        <div className="final-match-card__tools">
          <span data-qa="final-status">
            <StatusLabel
              status={
                match.status === "ready"
                  ? recommended
                    ? "ready"
                    : canStart
                      ? "available"
                      : "queued"
                  : match.status
              }
            />
          </span>
          <MatchEditAction
            match={match}
            onEdit={() => setEditing(true)}
            onRenamePlayer={props.onRenamePlayer}
            sideALabel={sideALabel}
            sideBLabel={sideBLabel}
          />
        </div>
      </header>
      <div className="final-match-card__faceoff" data-qa="final-faceoff">
        <FinalMatchSide
          align="left"
          isLoser={complete && match.loserId === match.sideA?.memberIds[0]}
          isWinner={match.winnerId === match.sideA?.memberIds[0]}
          label={sideALabel}
          score={match.scoreA}
          showScore={match.status === "live" || complete}
        />
        <Trophy aria-label="Final trophy" size={28} strokeWidth={1.8} />
        <FinalMatchSide
          align="right"
          isLoser={complete && match.loserId === match.sideB?.memberIds[0]}
          isWinner={match.winnerId === match.sideB?.memberIds[0]}
          label={sideBLabel}
          score={match.scoreB}
          showScore={match.status === "live" || complete}
        />
      </div>
    </article>
  );
}

function MatchHeader({
  canStart,
  children,
  label,
  match,
  recommended,
}: Pick<MatchCardProps, "canStart" | "label" | "match" | "recommended"> & {
  children?: ReactNode;
}) {
  return (
    <header>
      <p>{label}</p>
      <div className="tree-match-card__header-tools">
        <StatusLabel
          status={
            match.status === "ready"
              ? recommended
                ? "ready"
                : canStart
                  ? "available"
                  : "queued"
              : match.status
          }
        />
        {children}
      </div>
    </header>
  );
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
        <MeasuredLabel maxSize={14} minSize={8} text={label} />
      </span>
      <strong>{showScore ? score : "·"}</strong>
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
