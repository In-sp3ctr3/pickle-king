"use client";

import { Check, Share2 } from "lucide-react";
import { useEffect, useRef } from "react";

export function ResultSavedDialog({
  continueLabel,
  onClose,
  onContinue,
  onShare,
  score,
  winnerName,
}: {
  continueLabel: string;
  onClose: () => void;
  onContinue: () => void;
  onShare: () => void;
  score: string;
  winnerName: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const shareRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    ref.current?.showModal();
    shareRef.current?.focus();
    return () => triggerRef.current?.focus();
  }, []);

  return (
    <dialog
      aria-labelledby="result-saved-title"
      className="result-saved-dialog"
      data-qa="result-saved"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      ref={ref}
    >
      <Check aria-hidden="true" className="result-saved-dialog__check" />
      <p className="eyebrow">Result saved</p>
      <h2 id="result-saved-title">{winnerName}</h2>
      <p className="result-saved-dialog__outcome">takes it.</p>
      <strong>{score}</strong>
      <div className="dialog-actions">
        <button
          className="secondary-button"
          data-qa="continue-saved-result"
          onClick={onContinue}
          type="button"
        >
          {continueLabel}
        </button>
        <button
          className="primary-button"
          data-initial-focus
          data-qa="share-saved-result"
          onClick={onShare}
          ref={shareRef}
          type="button"
        >
          <Share2 aria-hidden="true" /> Share result
        </button>
      </div>
    </dialog>
  );
}
