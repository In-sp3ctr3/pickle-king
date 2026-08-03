"use client";

import { ActionButton } from "@/src/shared/ui";
import type { Match } from "@/src/tournament";
import { Pencil, Play } from "lucide-react";

export function MatchCardAction({
  canStart,
  match,
  onEdit,
  onRenamePlayer,
  onStartMatch,
  sideALabel,
  sideBLabel,
  compact = false,
}: {
  canStart: boolean;
  match: Match;
  onEdit: () => void;
  onRenamePlayer?: (playerId: string, name: string) => boolean;
  onStartMatch: (matchId: string) => void;
  sideALabel: string;
  sideBLabel: string;
  compact?: boolean;
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
            compact={compact}
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
        compact={compact}
        onEdit={onEdit}
        sideALabel={sideALabel}
        sideBLabel={sideBLabel}
      />
    );
  }
  return null;
}

function EditAction({
  compact,
  onEdit,
  sideALabel,
  sideBLabel,
}: {
  compact: boolean;
  onEdit: () => void;
  sideALabel: string;
  sideBLabel: string;
}) {
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
