"use client";

import { RefreshCw, Shuffle, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { TournamentFormat } from "../../tournament";

export function ReplayTournamentDialog({
  onClose,
  format,
  onNewDraw,
  onSameDraw,
}: {
  onClose: () => void;
  format: TournamentFormat;
  onNewDraw: () => void;
  onSameDraw: () => void;
}) {
  const roundRobin = format === "round-robin-finals";
  const ref = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    ref.current?.showModal();
    return () => triggerRef.current?.focus();
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
          <strong>Replay same {roundRobin ? "schedule" : "draw"}</strong>
          <span>
            {roundRobin
              ? "Same roster, rules, player order, and eight-match schedule."
              : "Same roster, rules, automatic advances, and opening matchups."}
          </span>
        </button>
        <button data-qa="prepare-new-draw" onClick={onNewDraw} type="button">
          <Shuffle aria-hidden="true" />
          <strong>Create a new {roundRobin ? "tournament" : "draw"}</strong>
          <span>
            Return to the prefilled setup and build a fresh{" "}
            {roundRobin ? "schedule" : "draw"}.
          </span>
        </button>
      </div>
      <button className="text-button" onClick={onClose} type="button">
        Cancel and keep these results
      </button>
    </dialog>
  );
}
