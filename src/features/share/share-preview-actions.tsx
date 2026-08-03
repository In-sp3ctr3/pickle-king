"use client";

import { Download, Share2 } from "lucide-react";
import type { SharePreviewState } from "./use-share-preview";

export function SharePreviewActions({
  preview,
  qaPrefix = "image",
}: {
  preview: SharePreviewState;
  qaPrefix?: string;
}) {
  const noun = qaPrefix === "result" ? "result" : "image";
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
          <Share2 aria-hidden="true" />
          <span>Share</span>
        </button>
        <button
          aria-label={`Download ${noun}`}
          className="share-preview-icon-button"
          data-qa={`download-${qaPrefix}`}
          disabled={!preview.ready || preview.busy}
          onClick={preview.download}
          title={`Download ${noun}`}
          type="button"
        >
          <Download aria-hidden="true" />
          <span>Download</span>
        </button>
      </div>
      <span aria-live="polite" role="status">
        {preview.status}
      </span>
    </div>
  );
}
