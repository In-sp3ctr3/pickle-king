"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { shareFormatLabel, type ShareFormat } from "./share-format";
import { SharePreviewActions } from "./share-preview-actions";
import { useSharePreview } from "./use-share-preview";

export interface ShareImageRequest {
  alt: string;
  aspect: "landscape" | "portrait";
  build: (format: ShareFormat) => Promise<HTMLCanvasElement>;
  description?: string;
  fileName: string;
  formats?: ShareFormat[];
  initialFormat?: ShareFormat;
  key: string;
  title: string;
}

export function ShareImageDialog({
  onClose,
  request,
}: {
  onClose: () => void;
  request: ShareImageRequest;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const formats = request.formats ?? ["feed"];
  const [format, setFormat] = useState<ShareFormat>(
    request.initialFormat ?? formats[0] ?? "feed",
  );
  const preview = useSharePreview(
    () => request.build(format),
    formatFileName(request.fileName, format, formats.length > 1),
    `${request.key}:${format}`,
  );
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      aria-label={request.title}
      className={`share-preview-dialog share-preview-dialog--${request.aspect}${formats.length > 1 ? "share-preview-dialog--has-formats" : ""}`}
      onCancel={onClose}
      ref={ref}
    >
      <header className="share-preview-dialog__header">
        <div>
          <h2>{request.title}</h2>
          {request.description ? <p>{request.description}</p> : null}
        </div>
        <button aria-label="Close preview" onClick={onClose} type="button">
          <X aria-hidden="true" />
        </button>
      </header>
      {formats.length > 1 ? (
        <div
          aria-label="Image format"
          className="share-format-choice"
          role="group"
        >
          {formats.map((value) => (
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
        className={`share-preview-dialog__figure share-preview-dialog__figure--${format}`}
      >
        {preview.previewUrl ? (
          // The source is a local Blob URL created from the generated canvas.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={request.alt}
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
      <footer className="share-preview-dialog__footer">
        <p>Names and scores stay on this device until you share them.</p>
        <SharePreviewActions preview={preview} />
      </footer>
    </dialog>
  );
}

function formatFileName(
  fileName: string,
  format: ShareFormat,
  includeFormat: boolean,
) {
  return includeFormat
    ? fileName.replace(/\.png$/i, `-${format}.png`)
    : fileName;
}
