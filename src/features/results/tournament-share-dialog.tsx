"use client";

import { BarChart3, GitFork, Trophy, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TournamentBracket } from "../../tournament";
import {
  bracketShareCanvas,
  shareFormatLabel,
  SharePreviewActions,
  type ShareFormat,
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
  const [format, setFormat] = useState<ShareFormat>("feed");
  const imageFormat = kind === "bracket" ? "feed" : format;
  const preview = useSharePreview(
    () =>
      kind === "recap"
        ? tournamentRecapCanvas(bracket, imageFormat)
        : kind === "stats"
          ? tournamentStatsCanvas(bracket, imageFormat)
          : bracketShareCanvas(bracket),
    `pickle-king-tournament-${kind}${kind === "bracket" ? "" : `-${imageFormat}`}.png`,
    `${kind}:${imageFormat}:${bracket.finalMatchId}`,
  );

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      aria-label="Share tournament"
      className={`tournament-share-dialog tournament-share-dialog--preview${kind !== "bracket" ? "tournament-share-dialog--has-formats" : ""}`}
      onCancel={onClose}
      ref={ref}
    >
      <header>
        <div>
          <h2>Share tournament</h2>
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
      {kind !== "bracket" ? (
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
      ) : null}
      <figure
        aria-busy={!preview.ready}
        className={`tournament-share-preview tournament-share-preview--${kind} tournament-share-preview--${imageFormat}`}
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
        <p>Names and scores stay on this device until you share them.</p>
        <SharePreviewActions preview={preview} />
      </footer>
    </dialog>
  );
}
