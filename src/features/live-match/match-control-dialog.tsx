"use client";

import { useEffect, useRef } from "react";
import type { MatchTeam, ScoringState } from "../../match/types";

export type MatchControlMode = "end" | "restart";

export function MatchControlDialog({
  mode,
  scorer,
  onClose,
  onDiscard,
  onEnd,
  onRestart,
}: {
  mode: MatchControlMode;
  scorer: ScoringState;
  onClose: () => void;
  onDiscard: () => void;
  onEnd: (winner?: MatchTeam) => void;
  onRestart: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>("[data-initial-focus]")?.focus();
  }, []);

  const tied = scorer.scoreA === scorer.scoreB;
  const leader = scorer.scoreA > scorer.scoreB ? "A" : "B";
  const leaderLabel = leader === "A" ? scorer.labelA : scorer.labelB;
  const close = (next: () => void) => {
    dialogRef.current?.close();
    next();
  };

  return (
    <dialog
      aria-labelledby="match-control-title"
      className="match-control-dialog"
      onCancel={(event) => {
        event.preventDefault();
        close(onClose);
      }}
      ref={dialogRef}
    >
      <p className="eyebrow">
        {mode === "restart"
          ? "Restart match"
          : scorer.status === "editing-result"
            ? "Resolve corrected score"
            : "End match early"}
      </p>
      <h2 id="match-control-title">
        {mode === "restart"
          ? "Start this match over?"
          : tied
            ? "This match needs a winner."
            : `${leaderLabel} leads.`}
      </h2>
      <p>
        {mode === "restart"
          ? "Both scores and the match clock return to their starting values."
          : tied
            ? `The score is ${scorer.scoreA}–${scorer.scoreB}. Choose who advances with this score, or discard this attempt.`
            : `Keeping ${scorer.scoreA}–${scorer.scoreB} awards the match to ${leaderLabel}. Discarding returns without a result.`}
      </p>
      <div className="match-control-actions">
        {mode === "restart" ? (
          <button
            className="danger-button"
            onClick={() => close(onRestart)}
            type="button"
          >
            Restart match
          </button>
        ) : tied ? (
          <>
            <button
              className="primary-button"
              onClick={() => close(() => onEnd("A"))}
              type="button"
            >
              Award {scorer.labelA}
            </button>
            <button
              className="primary-button"
              onClick={() => close(() => onEnd("B"))}
              type="button"
            >
              Award {scorer.labelB}
            </button>
          </>
        ) : (
          <button
            className="primary-button"
            onClick={() => close(() => onEnd())}
            type="button"
          >
            Keep score · {leaderLabel} wins
          </button>
        )}
        {mode === "end" ? (
          <button
            className="danger-button"
            onClick={() => close(onDiscard)}
            type="button"
          >
            Discard this match
          </button>
        ) : null}
        <button
          className="secondary-button"
          data-initial-focus
          onClick={() => close(onClose)}
          type="button"
        >
          {scorer.status === "editing-result"
            ? "Back to score"
            : "Keep playing"}
        </button>
      </div>
    </dialog>
  );
}
