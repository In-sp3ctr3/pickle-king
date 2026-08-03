"use client";

import { useEffect, useRef } from "react";
import { Crown, Share2 } from "lucide-react";
import type { ScoringState } from "../../match/types";

export function ResultConfirmationDialog({
  onConfirm,
  onEdit,
  onShare,
  scorer,
  standalone,
}: {
  onConfirm: () => void;
  onEdit: () => void;
  onShare: () => void;
  scorer: ScoringState;
  standalone: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>("[data-initial-focus]")?.focus();
    return () => {
      const returnTarget = returnFocusRef.current;
      window.requestAnimationFrame(() => {
        if (returnTarget?.isConnected && returnTarget !== document.body) {
          returnTarget.focus();
        }
      });
    };
  }, []);

  return (
    <dialog
      aria-labelledby="result-title"
      className="result-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onEdit();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const buttons = [
          ...event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
        ];
        const first = buttons[0];
        const last = buttons.at(-1);
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
      }}
      ref={dialogRef}
    >
      <Crown aria-hidden="true" className="result-dialog__crown" size={52} />
      <p className="eyebrow">{scorer.finishReason?.replaceAll("-", " ")}</p>
      <h2 id="result-title">
        {scorer.winner === "A" ? scorer.labelA : scorer.labelB} wins
      </h2>
      <div
        className="result-dialog__score"
        aria-label={`${scorer.scoreA} to ${scorer.scoreB}`}
      >
        <strong>{scorer.scoreA}</strong>
        <span>–</span>
        <strong>{scorer.scoreB}</strong>
      </div>
      <div className="result-dialog__names">
        <span>{scorer.labelA}</span>
        <span>{scorer.labelB}</span>
      </div>
      <ResultExplanation scorer={scorer} standalone={standalone} />
      <div className="dialog-actions">
        <button className="secondary-button" onClick={onEdit} type="button">
          Edit score
        </button>
        <button
          className="secondary-button"
          data-qa="share-result"
          onClick={onShare}
          type="button"
        >
          <Share2 aria-hidden="true" size={18} /> Share result
        </button>
        <button
          className="primary-button"
          data-initial-focus
          data-qa="confirm-result"
          onClick={onConfirm}
          type="button"
        >
          Confirm result
        </button>
      </div>
    </dialog>
  );
}

function ResultExplanation({
  scorer,
  standalone,
}: {
  scorer: ScoringState;
  standalone: boolean;
}) {
  if (scorer.finishReason === "operator-selection") {
    return (
      <p>
        Tied at {scorer.scoreA}–{scorer.scoreB}. Winner selected by the
        operator.
      </p>
    );
  }
  if (scorer.finishReason === "ended-early") {
    return (
      <p>
        Ended early at {scorer.scoreA}–{scorer.scoreB}. The leader will advance.
      </p>
    );
  }
  return (
    <p>
      {scorer.scoreA}–{scorer.scoreB}.{" "}
      {standalone
        ? "Confirm to finish this match."
        : "Confirm before the bracket moves."}
    </p>
  );
}
