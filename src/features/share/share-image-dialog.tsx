"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { SharePreviewActions } from "./share-preview-actions";
import { useSharePreview } from "./use-share-preview";

export interface ShareImageRequest {
  alt: string;
  aspect: "landscape" | "portrait";
  build: () => Promise<HTMLCanvasElement>;
  description: string;
  fileName: string;
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
  const preview = useSharePreview(request.build, request.fileName, request.key);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      aria-label={request.title}
      className={`share-preview-dialog share-preview-dialog--${request.aspect}`}
      onCancel={onClose}
      ref={ref}
    >
      <header className="share-preview-dialog__header">
        <div>
          <p className="eyebrow">Preview</p>
          <h2>{request.title}</h2>
          <p>{request.description}</p>
        </div>
        <button aria-label="Close preview" onClick={onClose} type="button">
          <X aria-hidden="true" />
        </button>
      </header>
      <figure
        aria-busy={!preview.ready}
        className="share-preview-dialog__figure"
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
        <p>
          Includes player names and scores. Nothing leaves this device until you
          choose an action.
        </p>
        <SharePreviewActions preview={preview} />
      </footer>
    </dialog>
  );
}
