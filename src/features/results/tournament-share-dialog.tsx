"use client";

import { BarChart3, Share2, Trophy, X } from "lucide-react";
import { useEffect, useRef } from "react";

export type TournamentShareKind = "recap" | "stats" | "bracket";

export function TournamentShareDialog({
  busy,
  onClose,
  onShare,
}: {
  busy: TournamentShareKind | null;
  onClose: () => void;
  onShare: (kind: TournamentShareKind) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const options = [
    [
      "recap",
      Trophy,
      "Champion and podium",
      "Portrait recap with the final podium and winner context.",
    ],
    [
      "stats",
      BarChart3,
      "Player stats",
      "Portrait standings card with records and point differential.",
    ],
    [
      "bracket",
      Share2,
      "Full bracket",
      "Landscape view of the entire completed draw.",
    ],
  ] as const;
  return (
    <dialog className="tournament-share-dialog" onCancel={onClose} ref={ref}>
      <header>
        <div>
          <p className="eyebrow">Share tournament</p>
          <h2>Choose the story.</h2>
        </div>
        <button
          aria-label="Close share options"
          disabled={Boolean(busy)}
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" />
        </button>
      </header>
      <div className="tournament-share-dialog__choices">
        {options.map(([kind, Icon, title, description]) => (
          <button
            disabled={Boolean(busy)}
            key={kind}
            onClick={() => onShare(kind)}
            type="button"
          >
            <Icon aria-hidden="true" />
            <strong>{busy === kind ? "Building image…" : title}</strong>
            <span>{description}</span>
          </button>
        ))}
      </div>
    </dialog>
  );
}
