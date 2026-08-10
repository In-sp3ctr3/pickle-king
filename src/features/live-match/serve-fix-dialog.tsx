"use client";

import { useEffect, useRef } from "react";

export function ServeFixDialog({
  canAdvance,
  onClose,
  onConfirm,
}: {
  canAdvance: boolean;
  onClose: () => void;
  onConfirm: (turn: "second" | "side-out") => void;
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
      requestAnimationFrame(() => {
        if (returnTarget?.isConnected && returnTarget !== document.body)
          returnTarget.focus();
      });
    };
  }, []);

  const close = (next: () => void) => {
    dialogRef.current?.close();
    next();
  };

  return (
    <dialog
      aria-labelledby="serve-fix-title"
      className="serve-dialog serve-dialog--fix"
      data-qa="serve-fix-dialog"
      onCancel={(event) => {
        event.preventDefault();
        close(onClose);
      }}
      ref={dialogRef}
    >
      <p className="eyebrow">Recovery</p>
      <h2 id="serve-fix-title">Fix serve</h2>
      <p className="serve-dialog__intro">
        This changes the serving turn only. The score stays exactly as it is.
      </p>
      <div className="serve-fix-actions">
        {canAdvance ? (
          <button
            className="primary-button"
            onClick={() => close(() => onConfirm("second"))}
            type="button"
          >
            Advance to Server 2
          </button>
        ) : null}
        <button
          className="primary-button"
          onClick={() => close(() => onConfirm("side-out"))}
          type="button"
        >
          Side out
        </button>
        <button
          className="secondary-button"
          data-initial-focus
          onClick={() => close(onClose)}
          type="button"
        >
          Keep current serve
        </button>
      </div>
    </dialog>
  );
}
