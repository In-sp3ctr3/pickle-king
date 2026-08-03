"use client";

import { useCallback, useEffect, useState } from "react";

export function useTransientStatus(timeoutMs = 4_000) {
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (!status || status.endsWith("…")) return;
    const timeout = window.setTimeout(() => setStatus(""), timeoutMs);
    return () => window.clearTimeout(timeout);
  }, [status, timeoutMs]);
  return [
    status,
    useCallback((value: string) => setStatus(value), []),
  ] as const;
}
