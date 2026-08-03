"use client";

import { useEffect, useRef, useState } from "react";
import type { ScoringState } from "../../match/types";
import {
  quickShareCanvas,
  prewarmSharePreview,
  shareFormatLabel,
  SharePreviewActions,
  SharePreviewSkeleton,
  type ShareFormat,
  useSharePreview,
} from "../share";
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
  const [format, setFormat] = useState<ShareFormat>("feed");
  useEffect(() => {
    for (const value of ["feed", "story"] as const) {
      prewarmSharePreview(
        resultPreviewKey(scorer, value),
        `pickle-king-score-result-${value}.png`,
        () => quickShareCanvas(scorer, value),
      );
    }
  }, [scorer]);
  const share = useSharePreview(
    () => quickShareCanvas(scorer, format),
    `pickle-king-score-result-${format}.png`,
    resultPreviewKey(scorer, format),
  );

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
      <div
        aria-label="Image format"
        className="share-format-choice"
        role="group"
      >
        {(["feed", "story"] as const).map((value) => (
          <button
            aria-pressed={format === value}
            key={value}
            onClick={() => setFormat(value)}
            type="button"
          >
            {shareFormatLabel(value)}
          </button>
        ))}
      </div>
      <figure
        aria-busy={!share.ready}
        className={`result-dialog__preview result-dialog__preview--${format}`}
      >
        {share.previewUrl ? (
          // Blob previews are already-local generated images and cannot use an image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${winnerName} wins ${scorer.scoreA} to ${scorer.scoreB}. Share image preview.`}
            data-qa="result-preview"
            src={share.previewUrl}
          />
        ) : (
          <SharePreviewSkeleton className="result-dialog__preview-skeleton" />
        )}
        <figcaption>Share preview</figcaption>
      </figure>
      <ResultExplanation scorer={scorer} />
      <div className="dialog-actions result-dialog__actions">
        <button className="secondary-button" onClick={onEdit} type="button">
          Edit score
        </button>
        <SharePreviewActions preview={share} qaPrefix="result" />
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
          Native sharing is unavailable here. You can still download the PNG.
        </p>
      ) : null}
    </dialog>
  );
}

export function resultPreviewKey(scorer: ScoringState, format: ShareFormat) {
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
