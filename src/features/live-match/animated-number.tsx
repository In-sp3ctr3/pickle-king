"use client";

import NumberFlow, { type NumberFlowProps } from "@number-flow/react";

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
  digits,
  format,
  trend,
}: {
  value: number;
  className?: string;
} & Pick<NumberFlowProps, "digits" | "format" | "trend">) {
  return (
    <NumberFlow
      aria-label={String(value)}
      className={className}
      {...(digits === undefined ? {} : { digits })}
      {...(format === undefined ? {} : { format })}
      respectMotionPreference
      {...(trend === undefined ? {} : { trend })}
      value={value}
    />
  );
}
