"use client";

import {
  BarChart3,
  GitFork,
  Maximize2,
  Minimize2,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TournamentBracket } from "../../tournament";
import {
  bracketShareCanvas,
  bracketShareFormatLabel,
  shareFormatLabel,
  SharePreviewActions,
  SharePreviewSkeleton,
  type BracketShareFormat,
  type ShareFormat,
  tournamentShareContentKey,
  tournamentRecapCanvas,
  tournamentStatsCanvas,
  useSharePreview,
} from "../share";

export type TournamentShareKind = "recap" | "stats" | "bracket";

const allOptions = [
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
  const triggerRef = useRef<HTMLElement | null>(null);
  const [kind, setKind] = useState<TournamentShareKind>("recap");
  const [format, setFormat] = useState<ShareFormat>("feed");
  const [bracketFormat, setBracketFormat] =
    useState<BracketShareFormat>("landscape");
  const [expanded, setExpanded] = useState(false);
  const options =
    bracket.format === "round-robin-finals"
      ? allOptions.filter(([value]) => value !== "bracket")
      : allOptions;
  const imageFormat = kind === "bracket" ? bracketFormat : format;
  const contentKey = tournamentShareContentKey(bracket);
  const preview = useSharePreview(
    () =>
      kind === "recap"
        ? tournamentRecapCanvas(bracket, format)
        : kind === "stats"
          ? tournamentStatsCanvas(bracket, format)
          : bracketShareCanvas(bracket, bracketFormat),
    `pickle-king-tournament-${kind}-${imageFormat}.png`,
    `${kind}:${imageFormat}:${contentKey}`,
  );

  useEffect(() => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    ref.current?.showModal();
    return () => triggerRef.current?.focus();
  }, []);

  return (
    <dialog
      aria-label="Share tournament"
      className="tournament-share-dialog tournament-share-dialog--preview tournament-share-dialog--has-formats"
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
      <div
        aria-label="Image format"
        className="share-format-choice"
        role="group"
      >
        {(kind === "bracket"
          ? (["landscape", "feed", "story"] as const)
          : (["feed", "story"] as const)
        ).map((value) => (
          <button
            aria-pressed={imageFormat === value}
            key={value}
            onClick={() => {
              setExpanded(false);
              if (kind === "bracket") setBracketFormat(value);
              else setFormat(value as ShareFormat);
            }}
            type="button"
          >
            {kind === "bracket"
              ? bracketShareFormatLabel(value)
              : shareFormatLabel(value as ShareFormat)}
          </button>
        ))}
      </div>
      <figure
        aria-busy={!preview.ready}
        className={[
          "tournament-share-preview",
          `tournament-share-preview--${kind}`,
          `tournament-share-preview--${imageFormat}`,
          expanded ? "tournament-share-preview--expanded" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {kind === "bracket" && preview.ready ? (
          <button
            aria-label={
              expanded ? "Fit bracket preview" : "Expand bracket preview"
            }
            className="tournament-share-preview__fit"
            onClick={() => setExpanded((value) => !value)}
            type="button"
          >
            {expanded ? (
              <Minimize2 aria-hidden="true" />
            ) : (
              <Maximize2 aria-hidden="true" />
            )}
          </button>
        ) : null}
        {preview.previewUrl ? (
          // Blob URL for a locally generated canvas preview.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${options.find(([value]) => value === kind)?.[2]} preview`}
            data-qa="share-preview"
            src={preview.previewUrl}
            style={
              expanded
                ? {
                    maxHeight: "none",
                    maxWidth: "none",
                    minWidth: imageFormat === "landscape" ? 1600 : 1080,
                    position: "static",
                  }
                : undefined
            }
          />
        ) : preview.error ? (
          <div className="share-preview-dialog__error" role="alert">
            {preview.error}
          </div>
        ) : (
          <SharePreviewSkeleton className="share-preview-dialog__loading" />
        )}
      </figure>
      <footer>
        <p>Names and scores stay on this device until you share them.</p>
        <SharePreviewActions preview={preview} />
      </footer>
    </dialog>
  );
}
