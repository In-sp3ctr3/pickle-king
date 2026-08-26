"use client";

import { useEffect, useRef } from "react";
import type { ScoringState } from "../../match/types";
import type { QuickShareStyle, ShareFormat } from "../share";
import { VictoryConfetti } from "./victory-confetti";

export function ResultConfirmationDialog({
  onConfirm,
  onEdit,
  scorer,
}: {
  onConfirm: () => void;
  onEdit: () => void;
  scorer: ScoringState;
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

  const winnerName = scorer.winner === "A" ? scorer.labelA : scorer.labelB;
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
      <VictoryConfetti />
      <h2 className="sr-only" id="result-title">
        {winnerName} wins
      </h2>
      <span className="sr-only">{scorer.stageLabel ?? "Final score"}</span>
      <div className="result-dialog__score" data-qa="result-score">
        <p>{winnerName} wins</p>
        <strong>
          {scorer.scoreA}–{scorer.scoreB}
        </strong>
      </div>
      <ResultExplanation scorer={scorer} />
      <div className="dialog-actions result-dialog__actions">
        <button className="secondary-button" onClick={onEdit} type="button">
          Edit score
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

export function resultPreviewKey(
  scorer: ScoringState,
  format: ShareFormat,
  style: QuickShareStyle,
) {
  return JSON.stringify([
    scorer.labelA,
    scorer.labelB,
    scorer.scoreA,
    scorer.scoreB,
    scorer.winner,
    scorer.finishReason,
    scorer.targetScore,
    scorer.stageLabel ?? null,
    format,
    style,
  ]);
}

function ResultExplanation({ scorer }: { scorer: ScoringState }) {
  if (scorer.finishReason === "operator-selection") {
    return (
      <p className="result-dialog__exception">
        Tied at {scorer.scoreA} to {scorer.scoreB}. Winner selected by the
        operator.
      </p>
    );
  }
  if (scorer.finishReason === "ended-early") {
    return (
      <p className="result-dialog__exception">
        Match ended early. The recorded leader will advance.
      </p>
    );
  }
  return null;
}
