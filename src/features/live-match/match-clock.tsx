"use client";

import { useEffect, useState } from "react";
import { remainingMs } from "../../match/scoring";
import type { ScoringState } from "../../match/types";
import { AnimatedNumber } from "./animated-number";

function clockParts(milliseconds: number) {
  const seconds = Math.ceil(milliseconds / 1_000);
  return { minutes: Math.floor(seconds / 60), seconds: seconds % 60 };
}

export function MatchClock({
  scorer,
  sessionDeadline,
  onExpire,
}: {
  scorer: ScoringState;
  sessionDeadline: number | null;
  onExpire: (now: number) => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);
  const matchMs = remainingMs(scorer, now);
  const sessionMs = sessionDeadline ? Math.max(0, sessionDeadline - now) : 0;
  useEffect(() => {
    if (scorer.status === "running" && matchMs !== null && matchMs === 0) {
      onExpire(now);
    }
  }, [matchMs, now, onExpire, scorer.status]);
  const match = matchMs === null ? null : clockParts(matchMs);
  const session = clockParts(sessionMs);
  return (
    <div className="match-clocks" aria-live="polite">
      <div>
        <span className="clock-label">Match clock</span>
        {match ? (
          <strong className="clock-value">
            <AnimatedNumber value={match.minutes} />
            <span>:</span>
            <AnimatedNumber value={match.seconds} />
          </strong>
        ) : (
          <strong className="clock-value clock-untimed">Untimed</strong>
        )}
      </div>
      {sessionDeadline ? (
        <div className="session-clock">
          <span className="clock-label">Session left</span>
          <strong>
            {session.minutes}:{String(session.seconds).padStart(2, "0")}
          </strong>
        </div>
      ) : null}
    </div>
  );
}
