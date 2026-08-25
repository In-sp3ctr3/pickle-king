"use client";

import { Share2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildSessionRecaps,
  latestQuickMatchDayIds,
  type QuickMatchRecord,
} from "../../history";
import {
  quickShareCanvas,
  SessionRecapDialog,
  ShareImageDialog,
  type ShareImageRequest,
} from "../share";

function dateLabel(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

export function QuickMatchHistory({
  matches,
  onRemove,
}: {
  matches: QuickMatchRecord[];
  onRemove: (id: string, kind: "quick") => void;
}) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showRecap, setShowRecap] = useState(false);
  const [shareRequest, setShareRequest] = useState<ShareImageRequest | null>(
    null,
  );
  const selectedMatches = useMemo(
    () => matches.filter(({ id }) => selected.has(id)),
    [matches, selected],
  );
  const recaps = useMemo(
    () => buildSessionRecaps(selectedMatches),
    [selectedMatches],
  );
  const counts = selectedMatches.reduce(
    (value, match) => ({ ...value, [match.format]: value[match.format] + 1 }),
    { doubles: 0, singles: 0 },
  );

  function startSelecting() {
    setSelected(latestQuickMatchDayIds(matches));
    setSelecting(true);
  }

  function cancelSelecting() {
    setSelecting(false);
    setSelected(new Set());
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="session-ledger" aria-labelledby="quick-history-title">
      <div className="session-ledger__heading">
        <h2 id="quick-history-title">Quick Matches</h2>
        {!selecting && matches.length >= 2 ? (
          <button data-qa="create-recap" onClick={startSelecting} type="button">
            Create recap
          </button>
        ) : null}
      </div>
      {selecting ? (
        <div className="recap-selection-toolbar">
          <div>
            <strong>{selected.size} selected</strong>
            <span aria-live="polite" className="sr-only">
              {selected.size} matches selected.
            </span>
            <p>
              {counts.singles === 1
                ? "Select one more Singles match, or share it individually. "
                : ""}
              {counts.doubles === 1
                ? "Select one more Doubles match, or share it individually."
                : ""}
              {!selected.size
                ? "Choose at least two matches of one format."
                : ""}
            </p>
          </div>
          <div>
            <button
              className="secondary-button"
              onClick={cancelSelecting}
              type="button"
            >
              Cancel
            </button>
            <button
              className="primary-button"
              data-qa="preview-recap"
              disabled={!recaps.length}
              onClick={() => setShowRecap(true)}
              type="button"
            >
              Preview recap
            </button>
          </div>
        </div>
      ) : null}
      {matches.map((match) => (
        <article
          className={
            selecting
              ? "session-ledger__row session-ledger__row--selecting"
              : "session-ledger__row"
          }
          key={match.id}
        >
          {selecting ? (
            <label className="session-ledger__select">
              <input
                checked={selected.has(match.id)}
                onChange={() => toggle(match.id)}
                type="checkbox"
              />
              <span className="sr-only">
                Select {match.labels.sideA} versus {match.labels.sideB}
              </span>
            </label>
          ) : null}
          <div>
            <span>
              {dateLabel(match.completedAt)} · {match.format}
            </span>
            <strong>
              {match.labels.sideA}{" "}
              <b>
                {match.score.sideA}–{match.score.sideB}
              </b>{" "}
              {match.labels.sideB}
            </strong>
          </div>
          {!selecting ? (
            <div className="session-ledger__actions">
              <button
                onClick={() =>
                  setShareRequest({
                    alt: `${match.labels.sideA} versus ${match.labels.sideB} final score`,
                    aspect: "portrait",
                    build: (format, style = "poster") =>
                      quickShareCanvas(
                        match,
                        format === "landscape" ? "feed" : format,
                        style,
                      ),
                    fileName: `pickle-king-${match.completedAt}.png`,
                    formats: ["feed", "story"],
                    key: `quick:${match.id}`,
                    styles: ["poster", "frame", "receipt"],
                    title: "Final score",
                  })
                }
                type="button"
              >
                <Share2 aria-hidden="true" size={18} /> Share
              </button>
              <button
                aria-label="Remove match from history"
                onClick={() => onRemove(match.id, "quick")}
                type="button"
              >
                <Trash2 aria-hidden="true" size={18} />
              </button>
            </div>
          ) : null}
        </article>
      ))}
      {shareRequest ? (
        <ShareImageDialog
          onClose={() => setShareRequest(null)}
          request={shareRequest}
        />
      ) : null}
      {showRecap ? (
        <SessionRecapDialog
          matches={selectedMatches}
          onClose={() => setShowRecap(false)}
        />
      ) : null}
    </section>
  );
}
