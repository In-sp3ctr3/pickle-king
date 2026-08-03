"use client";

import { BarChart3, GitFork, Trophy, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TournamentBracket } from "../../tournament";
import {
  bracketShareCanvas,
  SharePreviewActions,
  tournamentRecapCanvas,
  tournamentStatsCanvas,
  useSharePreview,
} from "../share";

export type TournamentShareKind = "recap" | "stats" | "bracket";

const options = [
  ["recap", Trophy, "Champion card"],
  ["stats", BarChart3, "Player stats"],
  ["bracket", GitFork, "Full bracket"],
] as const;

export function TournamentShareDialog({
  bracket,
  onClose,
}: {
  bracket: TournamentBracket;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState<TournamentShareKind>("recap");
  const preview = useSharePreview(
    () =>
      kind === "recap"
        ? tournamentRecapCanvas(bracket)
        : kind === "stats"
          ? tournamentStatsCanvas(bracket)
          : bracketShareCanvas(bracket),
    `pickle-king-tournament-${kind}.png`,
    `${kind}:${bracket.finalMatchId}`,
  );

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      aria-label="Share tournament"
      className="tournament-share-dialog tournament-share-dialog--preview"
      onCancel={onClose}
      ref={ref}
    >
      <header>
        <div>
          <p className="eyebrow">Share tournament</p>
          <h2>Preview your image</h2>
        </div>
        <button
          aria-label="Close share preview"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" />
        </button>
      </header>
      <div className="tournament-share-tabs" role="tablist">
        {options.map(([value, Icon, label]) => (
          <button
            aria-selected={kind === value}
            key={value}
            onClick={() => setKind(value)}
            role="tab"
            type="button"
          >
            <Icon aria-hidden="true" size={18} />
            {label}
          </button>
        ))}
      </div>
      <figure
        aria-busy={!preview.ready}
        className={`tournament-share-preview tournament-share-preview--${kind}`}
      >
        {preview.previewUrl ? (
          // Blob URL for a locally generated canvas preview.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${options.find(([value]) => value === kind)?.[2]} preview`}
            data-qa="share-preview"
            src={preview.previewUrl}
          />
        ) : preview.error ? (
          <div className="share-preview-dialog__error" role="alert">
            {preview.error}
          </div>
        ) : (
          <div aria-hidden="true" className="share-preview-dialog__loading" />
        )}
      </figure>
      <footer>
        <p>
          Includes player names and scores. Nothing leaves this device until you
          choose an action.
        </p>
        <SharePreviewActions preview={preview} />
      </footer>
    </dialog>
  );
}
