"use client";

import { useEffect, useRef, useState } from "react";
import { canShareFile, downloadFile, pngFile, shareFile } from "./share-file";

export type SharePreviewStatus = "idle" | "working" | "success" | "error";
export type SharePreviewAction = "share" | "download";

export interface SharePreviewState {
  appleMobile: boolean;
  busy: boolean;
  download: () => void;
  error: string | null;
  lastAction: SharePreviewAction | null;
  previewUrl: string | null;
  ready: boolean;
  share: () => Promise<void>;
  shareAvailable: boolean;
  status: SharePreviewStatus;
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
  const [status, setStatus] = useState<SharePreviewStatus>("idle");
  const [lastAction, setLastAction] = useState<SharePreviewAction | null>(null);
  const [appleMobile] = useState(isAppleMobilePlatform);
  const [resolvedKey, setResolvedKey] = useState("");
  const successTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (successTimer.current) window.clearTimeout(successTimer.current);
    };
  }, []);

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
        setStatus("idle");
        setResolvedKey(cacheKey);
      })
      .catch(() => {
        if (active) {
          setError("The image preview could not be created.");
          setStatus("error");
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
    if (!file || status === "working" || !shareAvailable) return;
    setStatus("working");
    setLastAction("share");
    try {
      const outcome = await shareFile(file, "Pickle King scorecard");
      if (outcome === "cancelled") {
        setStatus("idle");
        setLastAction(null);
        return;
      }
      showSuccess();
    } catch {
      setError("Sharing is unavailable on this device.");
      setStatus("error");
    }
  }

  function download() {
    const file = fileRef.current;
    if (!file || status === "working") return;
    setStatus("working");
    setLastAction("download");
    try {
      downloadFile(file);
      showSuccess();
    } catch {
      setError("The image could not be saved.");
      setStatus("error");
    }
  }

  function showSuccess() {
    setError(null);
    setStatus("success");
    if (successTimer.current) window.clearTimeout(successTimer.current);
    successTimer.current = window.setTimeout(() => {
      setStatus("idle");
      setLastAction(null);
    }, 1_600);
  }

  return {
    appleMobile,
    busy: status === "working",
    download,
    error: resolvedKey === cacheKey ? error : null,
    lastAction,
    previewUrl: resolvedKey === cacheKey ? previewUrl : null,
    ready: resolvedKey === cacheKey && ready,
    share,
    shareAvailable: resolvedKey === cacheKey && shareAvailable,
    status: resolvedKey === cacheKey ? status : "working",
  };
}

function isAppleMobilePlatform() {
  if (typeof navigator === "undefined") return false;
  const touchMac =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || touchMac;
}
