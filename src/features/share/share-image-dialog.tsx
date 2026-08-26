"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_SHARE_FORMAT, type BracketShareFormat } from "./share-format";
import type { QuickShareStyle } from "./quick-share-card";
import { QuickShareStylePicker } from "./quick-share-style-picker";
import { ShareComposerDialog } from "./share-composer-dialog";
import { ShareFormatPicker } from "./share-format-picker";
import { SharePreviewActions } from "./share-preview-actions";
import { sharePreviewFile } from "./share-preview-cache";
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
  const formats = request.formats ?? ["feed"];
  const [format, setFormat] = useState<BracketShareFormat>(
    initialShareFormat(formats, request.initialFormat),
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
  const thumbnails = useQuickShareThumbnails(request, format, style, preview);
  return (
    <ShareComposerDialog
      actions={<SharePreviewActions preview={preview} />}
      className={`share-preview-dialog share-preview-dialog--${aspect}`}
      description={request.description}
      onClose={onClose}
      preview={
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
      }
      title={request.title}
    >
      {formats.length > 1 ? (
        <ShareFormatPicker
          formats={formats}
          onChange={(value) => {
            setExpanded(false);
            setFormat(value);
          }}
          value={format}
        />
      ) : null}
      {request.styles?.length ? (
        <section aria-labelledby="share-design-title">
          <h3 id="share-design-title">Choose a design</h3>
          <QuickShareStylePicker
            onChange={(value) => {
              setExpanded(false);
              setStyle(value);
            }}
            thumbnails={thumbnails}
            value={style}
          />
        </section>
      ) : null}
    </ShareComposerDialog>
  );
}

function useQuickShareThumbnails(
  request: ShareImageRequest,
  format: BracketShareFormat,
  selectedStyle: QuickShareStyle,
  preview: ReturnType<typeof useSharePreview>,
) {
  const thumbnailKey = `${request.key}:${format}`;
  const [loaded, setLoaded] = useState<{
    key: string;
    values: Partial<Record<QuickShareStyle, string>>;
  }>({ key: "", values: {} });

  useEffect(() => {
    if (!request.styles?.length || !preview.ready || !preview.previewUrl)
      return;
    let active = true;
    const urls: string[] = [];
    const values: Partial<Record<QuickShareStyle, string>> = {};
    void (async () => {
      for (const candidate of thumbnailQueue(
        request.styles ?? [],
        selectedStyle,
      )) {
        if (!active) continue;
        try {
          const file = await sharePreviewFile(
            `${request.key}:${candidate}:${format}`,
            formatFileName(
              request.fileName,
              format,
              (request.formats?.length ?? 0) > 1,
              candidate,
              true,
            ),
            () => request.build(format, candidate),
          );
          if (!active) break;
          const url = URL.createObjectURL(file);
          urls.push(url);
          values[candidate] = url;
          setLoaded({ key: thumbnailKey, values: { ...values } });
        } catch {
          // The main preview remains available if an optional thumbnail fails.
        }
      }
    })();
    return () => {
      active = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [
    format,
    preview.previewUrl,
    preview.ready,
    request,
    selectedStyle,
    thumbnailKey,
  ]);
  return {
    ...(loaded.key === thumbnailKey ? loaded.values : {}),
    ...(preview.previewUrl ? { [selectedStyle]: preview.previewUrl } : {}),
  };
}

export function initialShareFormat(
  formats: readonly BracketShareFormat[],
  requested?: BracketShareFormat,
) {
  return (
    requested ??
    (formats.includes(DEFAULT_SHARE_FORMAT)
      ? DEFAULT_SHARE_FORMAT
      : (formats[0] ?? "feed"))
  );
}

export function thumbnailQueue(
  styles: readonly QuickShareStyle[],
  selected: QuickShareStyle,
) {
  return styles.filter((style) => style !== selected);
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
