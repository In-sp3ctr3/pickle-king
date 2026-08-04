import type { MatchStatus } from "@/src/tournament";
import {
  CircleCheck,
  CircleDashed,
  Clock3,
  Radio,
  TimerReset,
} from "lucide-react";

const statusDetails = {
  waiting: {
    label: "Waiting",
    icon: CircleDashed,
    className: "text-[#9da494]",
  },
  ready: {
    label: "Next",
    icon: TimerReset,
    className: "text-[#c8ff3d]",
  },
  available: {
    label: "Available",
    icon: TimerReset,
    className: "text-[#c8ff3d]",
  },
  queued: {
    label: "Queued",
    icon: Clock3,
    className: "text-[#9da494]",
  },
  live: {
    label: "Live",
    icon: Radio,
    className: "text-[#ff9a78]",
  },
  complete: {
    label: "Complete",
    icon: CircleCheck,
    className: "text-[#f5f3e9]",
  },
} satisfies Record<
  MatchStatus | "available" | "queued",
  { label: string; icon: typeof CircleCheck; className: string }
>;

export function StatusLabel({
  status,
}: {
  status: MatchStatus | "available" | "queued";
}) {
  const detail = statusDetails[status];
  const Icon = detail.icon;

  return (
    <span
      className={`inline-flex min-h-8 items-center gap-1.5 text-xs font-extrabold tracking-[0.12em] uppercase ${detail.className}`}
      data-status={status}
    >
      <Icon aria-hidden="true" size={16} strokeWidth={2.25} />
      {detail.label}
    </span>
  );
}
