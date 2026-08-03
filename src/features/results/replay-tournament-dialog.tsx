"use client";

import { RefreshCw, Shuffle, X } from "lucide-react";
import { useEffect, useRef } from "react";

export function ReplayTournamentDialog({
  onClose,
  onNewDraw,
  onSameDraw,
}: {
  onClose: () => void;
  onNewDraw: () => void;
  onSameDraw: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog className="replay-dialog" onCancel={onClose} ref={ref}>
      <header>
        <div>
          <p className="eyebrow">Run it back</p>
          <h2>Play another tournament?</h2>
        </div>
        <button
          aria-label="Close replay options"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" />
        </button>
      </header>
      <div className="replay-dialog__choices">
        <button data-qa="replay-same-draw" onClick={onSameDraw} type="button">
          <RefreshCw aria-hidden="true" />
          <strong>Replay same draw</strong>
          <span>Same roster, rules, seeds, byes, and opening matchups.</span>
        </button>
        <button data-qa="prepare-new-draw" onClick={onNewDraw} type="button">
          <Shuffle aria-hidden="true" />
          <strong>Create a new draw</strong>
          <span>Return to the prefilled setup and build fresh matchups.</span>
        </button>
      </div>
      <button className="text-button" onClick={onClose} type="button">
        Cancel and keep these results
      </button>
    </dialog>
  );
}
