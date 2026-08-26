"use client";

import { Check, Download, LoaderCircle, Share2 } from "lucide-react";
import type { SharePreviewState } from "./use-share-preview";

export function SharePreviewActions({
  preview,
  qaPrefix = "image",
}: {
  preview: SharePreviewState;
  qaPrefix?: string;
}) {
  const noun = qaPrefix === "result" ? "result" : "image";
  const shareSucceeded =
    preview.status === "success" && preview.lastAction === "share";
  const downloadSucceeded =
    preview.status === "success" && preview.lastAction === "download";
  return (
    <div className="share-preview-actions">
      <div className="share-preview-actions__buttons">
        <button
          aria-label={`Share ${noun}`}
          className="share-preview-icon-button"
          data-qa={`share-${qaPrefix}`}
          disabled={!preview.ready || !preview.shareAvailable || preview.busy}
          onClick={() => void preview.share()}
          title={`Share ${noun}`}
          type="button"
        >
          {preview.busy && preview.lastAction === "share" ? (
            <LoaderCircle aria-hidden="true" className="share-action-spinner" />
          ) : shareSucceeded ? (
            <Check aria-hidden="true" />
          ) : (
            <Share2 aria-hidden="true" />
          )}
          <span>
            {shareSucceeded
              ? "Done"
              : preview.appleMobile
                ? "Share / Save"
                : "Share"}
          </span>
        </button>
        {!preview.appleMobile || !preview.shareAvailable ? (
          <button
            aria-label={`Save ${noun}`}
            className="share-preview-icon-button share-preview-icon-button--secondary"
            data-qa={`download-${qaPrefix}`}
            disabled={!preview.ready || preview.busy}
            onClick={preview.download}
            title={`Save ${noun}`}
            type="button"
          >
            {preview.busy && preview.lastAction === "download" ? (
              <LoaderCircle
                aria-hidden="true"
                className="share-action-spinner"
              />
            ) : downloadSucceeded ? (
              <Check aria-hidden="true" />
            ) : (
              <Download aria-hidden="true" />
            )}
            <span>{downloadSucceeded ? "Saved" : "Save image"}</span>
          </button>
        ) : null}
      </div>
      {preview.error ? (
        <span className="share-preview-actions__error" role="alert">
          {preview.error}
        </span>
      ) : null}
      <span aria-live="polite" className="sr-only" role="status">
        {shareSucceeded ? "Done" : downloadSucceeded ? "Saved" : ""}
      </span>
    </div>
  );
}
