"use client";

import { BarChart3, GitFork, Maximize2, Minimize2, Trophy } from "lucide-react";
import { useState } from "react";
import type { TournamentBracket } from "../../tournament";
import {
  bracketShareCanvas,
  DEFAULT_SHARE_FORMAT,
  ShareComposerDialog,
  ShareFormatPicker,
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
  ["recap", Trophy, "Champion"],
  ["stats", BarChart3, "Standings"],
  ["bracket", GitFork, "Full draw"],
] as const;

export function TournamentShareDialog({
  bracket,
  onClose,
}: {
  bracket: TournamentBracket;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<TournamentShareKind>("recap");
  const [format, setFormat] = useState<ShareFormat>(DEFAULT_SHARE_FORMAT);
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

  return (
    <ShareComposerDialog
      actions={<SharePreviewActions preview={preview} />}
      className="share-preview-dialog tournament-share-dialog"
      onClose={onClose}
      preview={
        <figure
          aria-busy={!preview.ready}
          className={[
            "share-preview-dialog__figure",
            "tournament-share-preview",
            `tournament-share-preview--${kind}`,
            `share-preview-dialog__figure--${imageFormat}`,
            expanded ? "share-preview-dialog__figure--expanded" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {kind === "bracket" && preview.ready ? (
            <button
              aria-label={
                expanded ? "Fit bracket preview" : "Expand bracket preview"
              }
              className="share-preview-dialog__fit"
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
      }
      title="Share tournament"
    >
      <section aria-labelledby="tournament-artifact-title">
        <h3 id="tournament-artifact-title">Choose an export</h3>
        <div
          className="tournament-share-tabs share-artifact-rail"
          role="tablist"
        >
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
      </section>
      <ShareFormatPicker
        formats={
          kind === "bracket"
            ? ["landscape", "story", "feed"]
            : ["story", "feed"]
        }
        onChange={(value) => {
          setExpanded(false);
          if (kind === "bracket") setBracketFormat(value);
          else if (value !== "landscape") setFormat(value);
        }}
        value={imageFormat}
      />
    </ShareComposerDialog>
  );
}
