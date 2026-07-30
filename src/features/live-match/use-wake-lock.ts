"use client";

import { useEffect, useState } from "react";

export type WakeLockStatus = "idle" | "active" | "unsupported" | "error";

export function useWakeLock(active: boolean): WakeLockStatus {
  const [status, setStatus] = useState<WakeLockStatus>("idle");
  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;

  useEffect(() => {
    if (!active || !supported) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        sentinel = await navigator.wakeLock.request("screen");
        if (!cancelled) setStatus("active");
        sentinel.addEventListener("release", () => {
          if (!cancelled) setStatus("idle");
        });
      } catch {
        if (!cancelled) setStatus("error");
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !sentinel) void request();
    };
    void request();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinel?.release();
    };
  }, [active, supported]);

  if (!active) return "idle";
  return supported ? status : "unsupported";
}
