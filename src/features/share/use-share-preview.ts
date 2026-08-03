"use client";

import { useEffect, useRef, useState } from "react";
import { canShareFile, downloadFile, pngFile, shareFile } from "./share-file";

export interface SharePreviewState {
  busy: boolean;
  download: () => void;
  error: string | null;
  previewUrl: string | null;
  ready: boolean;
  share: () => Promise<void>;
  shareAvailable: boolean;
  status: string;
}

export function useSharePreview(
  build: () => Promise<HTMLCanvasElement>,
  fileName: string,
  cacheKey: string,
): SharePreviewState {
  const buildRef = useRef(build);
  const fileRef = useRef<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [shareAvailable, setShareAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [resolvedKey, setResolvedKey] = useState("");

  useEffect(() => {
    buildRef.current = build;
  }, [build]);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    fileRef.current = null;
    const buildPreview = async () => {
      const canvas = await buildRef.current();
      return pngFile(canvas, fileName);
    };
    void buildPreview()
      .then((file) => {
        if (!active) return;
        fileRef.current = file;
        objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setShareAvailable(canShareFile(file));
        setReady(true);
        setResolvedKey(cacheKey);
      })
      .catch(() => {
        if (active) {
          setError("The image preview could not be created.");
          setResolvedKey(cacheKey);
        }
      });
    return () => {
      active = false;
      fileRef.current = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [cacheKey, fileName]);

  async function share() {
    const file = fileRef.current;
    if (!file || busy || !shareAvailable) return;
    setBusy(true);
    try {
      const outcome = await shareFile(file, "Pickle King scorecard");
      setStatus(
        outcome === "shared" ? "Share sheet opened" : "Share cancelled",
      );
    } catch {
      setStatus("Sharing is unavailable. Download the image instead.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    const file = fileRef.current;
    if (!file || busy) return;
    downloadFile(file);
    setStatus("Download started");
  }

  return {
    busy,
    download,
    error: resolvedKey === cacheKey ? error : null,
    previewUrl: resolvedKey === cacheKey ? previewUrl : null,
    ready: resolvedKey === cacheKey && ready,
    share,
    shareAvailable: resolvedKey === cacheKey && shareAvailable,
    status: resolvedKey === cacheKey ? status : "",
  };
}
