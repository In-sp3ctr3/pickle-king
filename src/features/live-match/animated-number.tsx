"use client";

import NumberFlow, { continuous } from "@number-flow/react";

/**
 * Motion behavior adapted from Skiper UI v1 / Skiper37 AnimatedNumber_004:
 * https://skiper-ui.com/v1/skiper37
 *
 * Number transitions use NumberFlow by Maxwell Barvian:
 * https://number-flow.barvian.me/
 */
export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <NumberFlow
      aria-label={String(value)}
      className={className}
      plugins={[continuous]}
      respectMotionPreference
      trend={1}
      value={value}
    />
  );
}
