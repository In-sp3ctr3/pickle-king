"use client";

import { ActionButton } from "@/src/shared/ui";
import { Swords, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface MinimumPlayersDialogProps {
  onClose: () => void;
  onQuickMatch: () => void;
  open: boolean;
}

export function MinimumPlayersDialog({
  onClose,
  onQuickMatch,
  open,
}: MinimumPlayersDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLButtonElement>(".minimum-dialog-close")?.focus();
  }, [open]);

  function closeDialog() {
    dialogRef.current?.close();
    onClose();
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  }

  if (!open) return null;

  return (
    <dialog
      aria-labelledby="minimum-players-title"
      aria-describedby="minimum-players-description"
      className="minimum-players-dialog"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      ref={dialogRef}
    >
      <button
        aria-label="Close dialog"
        className="minimum-dialog-close"
        onClick={closeDialog}
        type="button"
      >
        <X aria-hidden="true" size={20} />
      </button>
      <span className="minimum-dialog-icon" aria-hidden="true">
        <Swords size={25} />
      </span>
      <p className="minimum-dialog-kicker">Tournament minimum</p>
      <h2 id="minimum-players-title">Keep four in the field.</h2>
      <p id="minimum-players-description">
        A knockout tournament needs at least four players. If it is just this
        group today, jump into a Quick Match instead.
      </p>
      <div className="minimum-dialog-actions">
        <ActionButton onClick={onQuickMatch}>Start Quick Match</ActionButton>
        <ActionButton onClick={closeDialog} variant="secondary">
          Keep editing
        </ActionButton>
      </div>
    </dialog>
  );
}
