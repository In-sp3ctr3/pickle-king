"use client";

import { Check, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect } from "react";
import type { ScoringAction, ScoringState } from "../../match/types";
import { MatchClock } from "./match-clock";
import { ScoreSide } from "./score-side";

export function MatchScreen({
  scorer,
  sessionDeadline,
  onAction,
  onConfirm,
  onExit,
}: {
  scorer: ScoringState;
  sessionDeadline: number | null;
  onAction: (action: ScoringAction) => void;
  onConfirm: () => void;
  onExit: () => void;
}) {
  const send = useCallback(
    (action: ScoringAction) => onAction(action),
    [onAction],
  );
  useEffect(() => {
    if (scorer.status !== "awaiting-confirmation") return;
    navigator.vibrate?.([120, 80, 240]);
  }, [scorer.status]);
  const canScore = ["running", "paused", "golden-point"].includes(
    scorer.status,
  );
  const toggle =
    scorer.status === "complete"
      ? onExit
      : scorer.status === "running"
        ? () => send({ type: "pause", now: Date.now() })
        : () =>
            send({
              type: scorer.status === "idle" ? "start" : "resume",
              now: Date.now(),
            });
  return (
    <main className="match-screen" data-qa="live-match">
      <header className="match-topbar">
        <button className="text-button" onClick={onExit} type="button">
          Exit
        </button>
        <MatchClock
          onExpire={(now) => send({ type: "tick", now })}
          scorer={scorer}
          sessionDeadline={sessionDeadline}
        />
        <span className="target-label">First to {scorer.targetScore}</span>
      </header>
      {scorer.status === "golden-point" ? (
        <div className="golden-banner" role="status">
          Golden point · next point wins
        </div>
      ) : null}
      <div className="scoreboard">
        <ScoreSide
          disabled={!canScore}
          label={scorer.labelA}
          leader={scorer.scoreA > scorer.scoreB}
          onAdd={() =>
            send({ type: "adjust", team: "A", delta: 1, now: Date.now() })
          }
          onSubtract={() =>
            send({ type: "adjust", team: "A", delta: -1, now: Date.now() })
          }
          score={scorer.scoreA}
          team="A"
        />
        <ScoreSide
          disabled={!canScore}
          label={scorer.labelB}
          leader={scorer.scoreB > scorer.scoreA}
          onAdd={() =>
            send({ type: "adjust", team: "B", delta: 1, now: Date.now() })
          }
          onSubtract={() =>
            send({ type: "adjust", team: "B", delta: -1, now: Date.now() })
          }
          score={scorer.scoreB}
          team="B"
        />
      </div>
      {scorer.status !== "awaiting-confirmation" ? (
        <footer className="match-controls">
          {scorer.status !== "golden-point" ? (
            <button className="control-button" onClick={toggle} type="button">
              {scorer.status === "complete" ? (
                <Check aria-hidden="true" />
              ) : scorer.status === "running" ? (
                <Pause aria-hidden="true" />
              ) : (
                <Play aria-hidden="true" />
              )}
              {scorer.status === "complete"
                ? "Done"
                : scorer.status === "running"
                  ? "Pause"
                  : scorer.status === "paused"
                    ? "Resume"
                    : "Start"}
            </button>
          ) : null}
          {scorer.status !== "complete" ? (
            <button
              className="control-button"
              onClick={() => send({ type: "reset" })}
              type="button"
            >
              <RotateCcw aria-hidden="true" />
              Reset
            </button>
          ) : null}
        </footer>
      ) : null}
      {scorer.status === "awaiting-confirmation" ? (
        <div className="result-dialog-backdrop">
          <section
            aria-labelledby="result-title"
            aria-modal="true"
            className="result-dialog"
            role="dialog"
          >
            <p className="eyebrow">{scorer.finishReason?.replace("-", " ")}</p>
            <h2 id="result-title">
              {scorer.winner === "A" ? scorer.labelA : scorer.labelB} wins
            </h2>
            <p>
              {scorer.scoreA}–{scorer.scoreB}. Confirm before the bracket moves.
            </p>
            <div className="dialog-actions">
              <button
                className="secondary-button"
                onClick={() => send({ type: "reopen" })}
                type="button"
              >
                Check score
              </button>
              <button
                className="primary-button"
                data-qa="confirm-result"
                onClick={onConfirm}
                type="button"
              >
                Confirm result
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
