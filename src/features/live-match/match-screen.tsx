"use client";

import { Check, Flag, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ScoringAction, ScoringState } from "../../match/types";
import {
  MatchControlDialog,
  type MatchControlMode,
} from "./match-control-dialog";
import { MatchClock } from "./match-clock";
import { playBuzzer } from "./match-feedback";
import { ResultConfirmationDialog } from "./result-confirmation-dialog";
import { ScoreSide } from "./score-side";
import { useWakeLock } from "./use-wake-lock";

export function MatchScreen({
  scorer,
  sessionDeadline,
  onAction,
  onConfirm,
  onDiscard,
  onExit,
  standalone = false,
}: {
  scorer: ScoringState;
  sessionDeadline: number | null;
  onAction: (action: ScoringAction) => void;
  onConfirm: () => void;
  onDiscard: () => void;
  onExit: () => void;
  standalone?: boolean;
}) {
  const [controlMode, setControlMode] = useState<MatchControlMode | null>(null);
  const send = useCallback(
    (action: ScoringAction) => onAction(action),
    [onAction],
  );
  useEffect(() => {
    if (scorer.status !== "awaiting-confirmation") return;
    navigator.vibrate?.([120, 80, 240]);
    playBuzzer();
  }, [scorer.status]);
  useEffect(() => {
    if (scorer.status !== "editing-result") return;
    document
      .querySelector<HTMLButtonElement>("[data-qa='score-a-add']")
      ?.focus();
  }, [scorer.status]);
  const wakeLock = useWakeLock(
    ["running", "paused", "golden-point"].includes(scorer.status),
  );
  const canScore =
    ["running", "paused", "golden-point"].includes(scorer.status) ||
    scorer.status === "editing-result";
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
      <h1 className="sr-only">
        Live match: {scorer.labelA} versus {scorer.labelB}
      </h1>
      <header className="match-topbar">
        <button className="text-button" onClick={onExit} type="button">
          Exit
        </button>
        <MatchClock
          onExpire={(now) => send({ type: "tick", now })}
          scorer={scorer}
          sessionDeadline={sessionDeadline}
        />
        <div className="target-label">
          <span>First to {scorer.targetScore} · win by 2</span>
          {wakeLock === "active" ? <small>Screen awake</small> : null}
          {wakeLock === "unsupported" || wakeLock === "error" ? (
            <small>Keep screen awake</small>
          ) : null}
        </div>
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
      {scorer.status === "editing-result" ? (
        <footer className="match-controls match-controls--editing">
          <span>Editing score · review when it is correct</span>
          <button
            className="primary-button"
            data-qa="review-corrected-result"
            onClick={() => {
              if (scorer.scoreA === scorer.scoreB) {
                setControlMode("end");
                return;
              }
              send({ type: "review-result", now: Date.now() });
            }}
            type="button"
          >
            <Check aria-hidden="true" />
            Review corrected result
          </button>
        </footer>
      ) : scorer.status !== "awaiting-confirmation" ? (
        <footer className="match-controls">
          {scorer.status !== "golden-point" ? (
            <button
              className="control-button"
              data-qa="match-toggle"
              onClick={toggle}
              type="button"
            >
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
          {!["idle", "complete"].includes(scorer.status) ? (
            <button
              className="control-button"
              onClick={() => setControlMode("restart")}
              type="button"
            >
              <RotateCcw aria-hidden="true" />
              Restart
            </button>
          ) : null}
          {["running", "paused", "golden-point"].includes(scorer.status) ? (
            <button
              className="control-button control-button-danger"
              onClick={() => setControlMode("end")}
              type="button"
            >
              <Flag aria-hidden="true" />
              End match
            </button>
          ) : null}
        </footer>
      ) : null}
      {controlMode ? (
        <MatchControlDialog
          mode={controlMode}
          onClose={() => setControlMode(null)}
          onDiscard={onDiscard}
          onEnd={(winner) => {
            setControlMode(null);
            send({ type: "end-early", now: Date.now(), winner });
          }}
          onRestart={() => {
            setControlMode(null);
            send({ type: "reset" });
          }}
          scorer={scorer}
        />
      ) : null}
      {scorer.status === "awaiting-confirmation" ? (
        <ResultConfirmationDialog
          onConfirm={onConfirm}
          onEdit={() => send({ type: "edit-result" })}
          scorer={scorer}
          standalone={standalone}
        />
      ) : null}
    </main>
  );
}
