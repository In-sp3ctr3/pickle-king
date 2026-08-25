"use client";

import { Maximize2, Minimize2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  bracketShareFormatLabel,
  type BracketShareFormat,
} from "./share-format";
import type { QuickShareStyle } from "./quick-share-card";
import { QuickShareStylePicker } from "./quick-share-style-picker";
import { SharePreviewActions } from "./share-preview-actions";
import { SharePreviewSkeleton } from "./share-preview-skeleton";
import { useSharePreview } from "./use-share-preview";

export interface ShareImageRequest {
  alt: string;
  aspect: "landscape" | "portrait";
  build: (
    format: BracketShareFormat,
    style?: QuickShareStyle,
  ) => Promise<HTMLCanvasElement>;
  description?: string;
  fileName: string;
  formats?: BracketShareFormat[];
  initialFormat?: BracketShareFormat;
  inspectable?: boolean;
  initialStyle?: QuickShareStyle;
  key: string;
  styles?: QuickShareStyle[];
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
  const triggerRef = useRef<HTMLElement | null>(null);
  const formats = request.formats ?? ["feed"];
  const [format, setFormat] = useState<BracketShareFormat>(
    request.initialFormat ?? formats[0] ?? "feed",
  );
  const [style, setStyle] = useState<QuickShareStyle>(
    request.initialStyle ?? request.styles?.[0] ?? "poster",
  );
  const [expanded, setExpanded] = useState(false);
  const aspect = format === "landscape" ? "landscape" : request.aspect;
  const preview = useSharePreview(
    () => request.build(format, style),
    formatFileName(
      request.fileName,
      format,
      formats.length > 1,
      style,
      Boolean(request.styles?.length),
    ),
    `${request.key}:${style}:${format}`,
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
      aria-label={request.title}
      className={[
        "share-preview-dialog",
        `share-preview-dialog--${aspect}`,
        formats.length > 1 ? "share-preview-dialog--has-formats" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
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
      {formats.length > 1 || request.styles?.length ? (
        <div className="share-preview-dialog__choices">
          {formats.length > 1 ? (
            <div
              aria-label="Image format"
              className="share-format-choice share-preview-dialog__formats"
              role="group"
            >
              {formats.map((value) => (
                <button
                  aria-pressed={format === value}
                  key={value}
                  onClick={() => {
                    setExpanded(false);
                    setFormat(value);
                  }}
                  type="button"
                >
                  {bracketShareFormatLabel(value)}
                </button>
              ))}
            </div>
          ) : null}
          {request.styles?.length ? (
            <QuickShareStylePicker
              onChange={(value) => {
                setExpanded(false);
                setStyle(value);
              }}
              value={style}
            />
          ) : null}
        </div>
      ) : null}
      <figure
        aria-busy={!preview.ready}
        className={[
          "share-preview-dialog__figure",
          `share-preview-dialog__figure--${format}`,
          expanded ? "share-preview-dialog__figure--expanded" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {request.inspectable && preview.ready ? (
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
          // The source is a local Blob URL created from the generated canvas.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={request.alt}
            data-qa="share-preview"
            src={preview.previewUrl}
            style={
              expanded
                ? {
                    maxHeight: "none",
                    maxWidth: "none",
                    minWidth: format === "landscape" ? 1600 : 1080,
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
      <footer className="share-preview-dialog__footer">
        <p>Names and scores stay on this device until you share them.</p>
        <SharePreviewActions preview={preview} />
      </footer>
    </dialog>
  );
}

function formatFileName(
  fileName: string,
  format: BracketShareFormat,
  includeFormat: boolean,
  style: QuickShareStyle,
  includeStyle: boolean,
) {
  const suffix = [includeStyle ? style : null, includeFormat ? format : null]
    .filter(Boolean)
    .join("-");
  return suffix ? fileName.replace(/\.png$/i, `-${suffix}.png`) : fileName;
}
