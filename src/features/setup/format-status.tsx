"use client";

import { useEffect } from "react";

export function FormatStatus({
  message,
  onClear,
}: {
  message: string;
  onClear: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(onClear, 4_000);
    return () => window.clearTimeout(timeout);
  }, [message, onClear]);

  return (
    <p
      aria-atomic="true"
      aria-live="polite"
      className="setup-format-status"
      role="status"
    >
      {message}
    </p>
  );
}
