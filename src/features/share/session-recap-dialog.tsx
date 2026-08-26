"use client";

import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildSessionRecaps,
  paginateRecapPlayers,
  receiptDateLabel,
  type QuickMatchRecord,
} from "../../history";
import { canShareFiles, shareFiles } from "./share-file";
import { ShareComposerDialog } from "./share-composer-dialog";
import { DEFAULT_SHARE_FORMAT, type ShareFormat } from "./share-format";
import { ShareFormatPicker } from "./share-format-picker";
import { SharePreviewActions } from "./share-preview-actions";
import { sharePreviewFile } from "./share-preview-cache";
import { SharePreviewSkeleton } from "./share-preview-skeleton";
import { sessionRecapCanvas, sessionRecapFileName } from "./session-recap-card";
import { useSharePreview } from "./use-share-preview";

export function SessionRecapDialog({
  matches,
  onClose,
}: {
  matches: QuickMatchRecord[];
  onClose: () => void;
}) {
  const sections = useMemo(() => buildSessionRecaps(matches), [matches]);
  const dateLabel = receiptDateLabel(
    matches.map(({ completedAt }) => completedAt),
  );
  const [sectionIndex, setSectionIndex] = useState(0);
  const [imageFormat, setImageFormat] =
    useState<ShareFormat>(DEFAULT_SHARE_FORMAT);
  const [page, setPage] = useState(0);
  const [allStatus, setAllStatus] = useState<"idle" | "working">("idle");
  const [allMessage, setAllMessage] = useState<string | null>(null);
  const section = sections[sectionIndex] ?? sections[0];
  const pages = useMemo(
    () => paginateRecapPlayers(section?.players ?? []),
    [section],
  );
  const currentPage = pages[page] ?? pages[0] ?? [];
  const fileName = section
    ? sessionRecapFileName(dateLabel, section.format, page, pages.length)
    : "pickle-king-session-receipts.png";
  const key = section
    ? `session-recap:${matches
        .map(({ id }) => id)
        .sort()
        .join("|")}:${section.format}:${imageFormat}:${page}`
    : "session-recap:empty";
  const preview = useSharePreview(
    () =>
      section
        ? sessionRecapCanvas(
            section,
            currentPage,
            { dateLabel, page, pageCount: pages.length },
            imageFormat,
          )
        : Promise.reject(new Error("No recap is available.")),
    fileName,
    key,
  );

  if (!section) return null;

  function chooseSection(index: number) {
    setSectionIndex(index);
    setPage(0);
    setAllMessage(null);
  }

  async function shareAllPages() {
    if (allStatus === "working") return;
    setAllStatus("working");
    setAllMessage(null);
    try {
      const files: File[] = [];
      for (let index = 0; index < pages.length; index += 1) {
        const name = sessionRecapFileName(
          dateLabel,
          section.format,
          index,
          pages.length,
        );
        const cacheKey = `session-recap:${matches
          .map(({ id }) => id)
          .sort()
          .join("|")}:${section.format}:${imageFormat}:${index}`;
        files.push(
          await sharePreviewFile(cacheKey, name, () =>
            sessionRecapCanvas(
              section,
              pages[index] ?? [],
              { dateLabel, page: index, pageCount: pages.length },
              imageFormat,
            ),
          ),
        );
      }
      if (!canShareFiles(files)) {
        setAllMessage(
          "This device cannot share multiple images together. Share or download each page instead.",
        );
        return;
      }
      const outcome = await shareFiles(
        files,
        `${section.format} session recap`,
      );
      if (outcome === "completed") setAllMessage("All pages shared.");
    } catch {
      setAllMessage(
        "All pages could not be prepared. The visible page is still available below.",
      );
    } finally {
      setAllStatus("idle");
    }
  }

  return (
    <ShareComposerDialog
      actions={
        <div className="session-recap-dialog__actions">
          {pages.length > 1 ? (
            <button
              className="session-recap-dialog__share-all"
              disabled={allStatus === "working"}
              onClick={() => void shareAllPages()}
              type="button"
            >
              {allStatus === "working" ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="share-action-spinner"
                />
              ) : null}
              Share all pages
            </button>
          ) : null}
          <SharePreviewActions preview={preview} qaPrefix="recap-page" />
          {allMessage ? (
            <p aria-live="polite" className="session-recap-dialog__message">
              {allMessage}
            </p>
          ) : null}
        </div>
      }
      className="share-preview-dialog session-recap-dialog"
      onClose={onClose}
      preview={
        <figure
          aria-busy={!preview.ready}
          className={`share-preview-dialog__figure share-preview-dialog__figure--${imageFormat}`}
        >
          {preview.previewUrl ? (
            // The source is a local Blob URL created from the generated canvas.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`${section.format} session recap page ${page + 1}`}
              data-qa="share-preview"
              src={preview.previewUrl}
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
      title="Session recap"
    >
      <div className="session-recap-dialog__choices">
        {sections.length > 1 ? (
          <div
            aria-label="Recap type"
            className="share-format-choice"
            role="group"
          >
            {sections.map((value, index) => (
              <button
                aria-pressed={sectionIndex === index}
                key={value.format}
                onClick={() => chooseSection(index)}
                type="button"
              >
                {value.format === "singles" ? "Singles" : "Doubles"}
              </button>
            ))}
          </div>
        ) : null}
        <ShareFormatPicker
          formats={["story", "feed"]}
          onChange={(value) => {
            if (value === "landscape") return;
            setImageFormat(value);
            setAllMessage(null);
          }}
          value={imageFormat}
        />
      </div>
      {pages.length > 1 ? (
        <div className="session-recap-dialog__pages">
          <button
            aria-label="Previous page"
            disabled={page === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            type="button"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <span aria-live="polite">
            Page {page + 1} of {pages.length}
          </span>
          <button
            aria-label="Next page"
            disabled={page === pages.length - 1}
            onClick={() =>
              setPage((value) => Math.min(pages.length - 1, value + 1))
            }
            type="button"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </ShareComposerDialog>
  );
}
