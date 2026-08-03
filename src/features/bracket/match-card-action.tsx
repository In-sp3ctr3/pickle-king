"use client";

import { ActionButton } from "@/src/shared/ui";
import type { Match } from "@/src/tournament";
import { PencilLine, Play } from "lucide-react";

export function MatchCardAction({
  canStart,
  match,
  onEdit,
  onRenamePlayer,
  onStartMatch,
  sideALabel,
  sideBLabel,
}: {
  canStart: boolean;
  match: Match;
  onEdit: () => void;
  onRenamePlayer?: (playerId: string, name: string) => boolean;
  onStartMatch: (matchId: string) => void;
  sideALabel: string;
  sideBLabel: string;
}) {
  if (match.status === "ready" && canStart) {
    return (
      <div className="tree-match-card__actions">
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
        {onRenamePlayer ? (
          <EditAction
            onEdit={onEdit}
            sideALabel={sideALabel}
            sideBLabel={sideBLabel}
          />
        ) : null}
      </div>
    );
  }
  if (
    match.status === "complete" ||
    (onRenamePlayer && match.status !== "live" && match.sideA && match.sideB)
  ) {
    return (
      <EditAction
        onEdit={onEdit}
        sideALabel={sideALabel}
        sideBLabel={sideBLabel}
      />
    );
  }
  return null;
}

function EditAction({
  onEdit,
  sideALabel,
  sideBLabel,
}: {
  onEdit: () => void;
  sideALabel: string;
  sideBLabel: string;
}) {
  return (
    <ActionButton
      aria-label={`Edit ${sideALabel} versus ${sideBLabel}`}
      className="tree-match-card__action"
      data-qa="edit-bracket-match"
      onClick={onEdit}
      variant="quiet"
    >
      <PencilLine aria-hidden="true" size={16} />
      <span className="sr-only">Edit match</span>
    </ActionButton>
  );
}
