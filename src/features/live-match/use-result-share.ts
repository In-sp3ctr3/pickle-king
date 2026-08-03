"use client";

import { useEffect, useRef, useState } from "react";
import type { ScoringState } from "../../match/types";
import {
  canShareFile,
  downloadFile,
  pngFile,
  quickShareCanvas,
  shareFile,
} from "../share";

type ShareStatus = (message: string) => void;

export function useResultShare(scorer: ScoringState, setStatus: ShareStatus) {
  const fileRef = useRef<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [shareAvailable, setShareAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    const fileName = `pickle-king-score-${Date.now()}.png`;
    void quickShareCanvas(scorer)
      .then((canvas) => pngFile(canvas, fileName))
      .then((file) => {
        if (!active) return;
        fileRef.current = file;
        objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setReady(true);
        setShareAvailable(canShareFile(file));
      })
      .catch(() => setStatus("The score preview could not be created."));
    return () => {
      active = false;
      fileRef.current = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [scorer, setStatus]);

  async function share() {
    const file = fileRef.current;
    if (!file || busy) return;
    setBusy(true);
    try {
      const outcome = await shareFile(file, "Pickle King final score");
      setStatus(
        outcome === "shared" ? "Share sheet opened." : "Sharing cancelled.",
      );
    } catch {
      setStatus(
        "This browser cannot share the score image. Download it instead.",
      );
    } finally {
      setBusy(false);
    }
  }

  function download() {
    const file = fileRef.current;
    if (!file || busy) return;
    downloadFile(file);
    setStatus("Score image downloaded.");
  }

  return {
    busy,
    download,
    previewUrl,
    ready,
    share,
    shareAvailable,
  };
}
