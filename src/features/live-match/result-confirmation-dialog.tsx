"use client";

import { Download, Share2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ScoringState } from "../../match/types";
import { useResultShare } from "./use-result-share";
import { VictoryConfetti } from "./victory-confetti";

export function ResultConfirmationDialog({
  onConfirm,
  onEdit,
  onShareStatus,
  scorer,
}: {
  onConfirm: () => void;
  onEdit: () => void;
  onShareStatus: (message: string) => void;
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
  const share = useResultShare(scorer, onShareStatus);

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
      <figure aria-busy={!share.ready} className="result-dialog__preview">
        {share.previewUrl ? (
          // Blob previews are already-local generated images and cannot use an image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${winnerName} wins ${scorer.scoreA} to ${scorer.scoreB}. Share image preview.`}
            data-qa="result-preview"
            src={share.previewUrl}
          />
        ) : (
          <div className="result-dialog__preview-fallback">
            <span>{scorer.stageLabel ?? "Final score"}</span>
            <strong>{winnerName} wins</strong>
            <b>
              {scorer.scoreA} <i>to</i> {scorer.scoreB}
            </b>
          </div>
        )}
        <figcaption>Preview of the image you can share or download</figcaption>
      </figure>
      <ResultExplanation scorer={scorer} />
      <div className="dialog-actions">
        <button className="secondary-button" onClick={onEdit} type="button">
          Edit score
        </button>
        <button
          aria-describedby={
            !share.shareAvailable ? "share-unavailable" : undefined
          }
          className="secondary-button"
          data-qa="share-result"
          disabled={!share.ready || !share.shareAvailable || share.busy}
          onClick={() => void share.share()}
          type="button"
        >
          <Share2 aria-hidden="true" size={18} />
          Share result
        </button>
        <button
          className="secondary-button"
          data-qa="download-result"
          disabled={!share.ready || share.busy}
          onClick={share.download}
          type="button"
        >
          <Download aria-hidden="true" size={18} />
          Download result
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
      {!share.shareAvailable && share.ready ? (
        <p className="result-dialog__share-note" id="share-unavailable">
          Native sharing is not available here. Download the image instead.
        </p>
      ) : null}
    </dialog>
  );
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
