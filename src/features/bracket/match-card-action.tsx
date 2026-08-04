"use client";

import { ActionButton } from "@/src/shared/ui";
import type { Match } from "@/src/tournament";
import { Pencil, Play } from "lucide-react";

export function MatchStartAction({
  canStart,
  match,
  onStartMatch,
}: {
  canStart: boolean;
  match: Match;
  onStartMatch: (matchId: string) => void;
}) {
  if (match.status !== "ready" || !canStart) return null;
  return (
    <ActionButton
      aria-label={`Start ${match.id}`}
      className="tree-match-card__action tree-match-card__start"
      data-qa="bracket-node-start"
      onClick={() => onStartMatch(match.id)}
      variant="inverse"
    >
      <Play aria-hidden="true" fill="currentColor" size={17} />
      <span className="sr-only">Start match</span>
    </ActionButton>
  );
}

export function MatchEditAction({
  compact = true,
  match,
  onEdit,
  onRenamePlayer,
  sideALabel,
  sideBLabel,
}: {
  compact?: boolean;
  match: Match;
  onEdit: () => void;
  onRenamePlayer?: (playerId: string, name: string) => boolean;
  sideALabel: string;
  sideBLabel: string;
}) {
  const canEdit =
    match.status === "complete" ||
    Boolean(
      onRenamePlayer && match.status !== "live" && match.sideA && match.sideB,
    );
  if (!canEdit) return null;
  return (
    <ActionButton
      aria-label={`Edit ${sideALabel} versus ${sideBLabel}`}
      className={`tree-match-card__action ${compact ? "tree-match-card__action--compact" : ""}`}
      data-qa="edit-bracket-match"
      onClick={onEdit}
      variant="quiet"
    >
      <Pencil aria-hidden="true" size={15} />
      <span className="sr-only">Edit match</span>
    </ActionButton>
  );
}
