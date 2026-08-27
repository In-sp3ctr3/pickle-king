"use client";

import {
  ArrowLeftRight,
  Check,
  Flag,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { activeReceiver, activeServer } from "../../match/service";
import type { ScoringAction, ScoringState } from "../../match/types";
import { prewarmShareAssets } from "../share";
import {
  MatchControlDialog,
  type MatchControlMode,
} from "./match-control-dialog";
import { MatchClock } from "./match-clock";
import { playBuzzer } from "./match-feedback";
import { ResultConfirmationDialog } from "./result-confirmation-dialog";
import { MatchScoreboard } from "./match-scoreboard";
import { ScoreSoundToggle } from "./score-sound-toggle";
import { ServeGuide } from "./serve-guide";
import { servePlayerName } from "./serve-players";
import { ServeTrackerDialogs } from "./serve-tracker-dialogs";
import { useWakeLock } from "./use-wake-lock";

export function MatchScreen({
  scorer,
  sessionDeadline,
  onAction,
  onConfirm,
  onDiscard,
  onExit,
}: {
  scorer: ScoringState;
  sessionDeadline: number | null;
  onAction: (action: ScoringAction) => void;
  onConfirm: () => void;
  onDiscard: () => void;
  onExit: () => void;
}) {
  const [controlMode, setControlMode] = useState<MatchControlMode | null>(null);
  const [serveDialog, setServeDialog] = useState<"fix" | "setup" | null>(null);
  const [serveStatus, setServeStatus] = useState("");
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const openExit = () => setControlMode("exit");
  useEffect(() => {
    prewarmShareAssets();
  }, []);
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
  useEffect(() => {
    if (scorer.status !== "idle") return;
    startButtonRef.current?.focus({ preventScroll: true });
  }, [scorer.status]);
  const wakeLock = useWakeLock(
    ["running", "paused", "golden-point"].includes(scorer.status),
  );
  const live = ["running", "paused", "golden-point"].includes(scorer.status);
  const canScore =
    scorer.status === "editing-result" || (live && Boolean(scorer.service));
  const positionInput = scorer.service && {
    scores: { A: scorer.scoreA, B: scorer.scoreB },
    service: scorer.service,
    sides: scorer,
  };
  const server = positionInput ? activeServer(positionInput) : null;
  const receiver = positionInput ? activeReceiver(positionInput) : null;
  const serverName = server
    ? servePlayerName(scorer, server.team, server.playerId)
    : null;
  const receiverName = receiver
    ? servePlayerName(scorer, receiver.team, receiver.playerId)
    : null;
  const teamOrder =
    (scorer.rightEndTeam ?? "A") === "A"
      ? (["A", "B"] as const)
      : (["B", "A"] as const);
  const toggle =
    scorer.status === "complete"
      ? onExit
      : scorer.status === "running"
        ? () => onAction({ type: "pause", now: Date.now() })
        : () => onAction({ type: "resume", now: Date.now() });
  return (
    <main className="match-screen" data-qa="live-match">
      <h1 className="sr-only">
        Live match: {scorer.labelA} versus {scorer.labelB}
      </h1>
      <header className="match-topbar">
        <div className="match-topbar__actions">
          <button className="text-button" onClick={openExit} type="button">
            Exit
          </button>
          <ScoreSoundToggle scorer={scorer} />
        </div>
        <MatchClock
          onExpire={(now) => onAction({ type: "tick", now })}
          scorer={scorer}
          sessionDeadline={sessionDeadline}
        />
        <div className="target-label">
          {scorer.stageLabel ? <strong>{scorer.stageLabel}</strong> : null}
          <span>First to {scorer.targetScore}</span>
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
      {server && serverName ? (
        <ServeGuide
          courtEnd={server.team === teamOrder[0] ? "left" : "right"}
          isOpeningServe={
            scorer.scoreA === 0 &&
            scorer.scoreB === 0 &&
            server.turn === "opening"
          }
          receiver={
            receiver && receiverName
              ? { name: receiverName, side: receiver.side }
              : undefined
          }
          server={{
            name: serverName,
            side: server.side,
            team: server.team === "A" ? scorer.labelA : scorer.labelB,
            turn: server.turn,
          }}
        />
      ) : null}
      {serveStatus ? (
        <p className="sr-only" role="status">
          {serveStatus}
        </p>
      ) : null}
      <MatchScoreboard
        canScore={canScore}
        onRally={(team) =>
          onAction(
            scorer.status === "editing-result"
              ? { type: "adjust", team, delta: 1, now: Date.now() }
              : { type: "rally", team, now: Date.now() },
          )
        }
        onStart={() => setServeDialog("setup")}
        onUndo={(team) =>
          onAction(
            scorer.status === "editing-result"
              ? { type: "adjust", team, delta: -1, now: Date.now() }
              : { type: "undo-rally", now: Date.now() },
          )
        }
        scorer={scorer}
        startButtonRef={startButtonRef}
        teamOrder={teamOrder}
      />
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
              onAction({ type: "review-result", now: Date.now() });
            }}
            type="button"
          >
            <Check aria-hidden="true" />
            Review corrected result
          </button>
        </footer>
      ) : !["awaiting-confirmation", "idle"].includes(scorer.status) ? (
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
          {live && scorer.service ? (
            <button
              className="control-button"
              onClick={() => setServeDialog("fix")}
              type="button"
            >
              Fix serve
            </button>
          ) : null}
          {live && !scorer.service ? (
            <button
              className="control-button"
              onClick={() => setServeDialog("setup")}
              type="button"
            >
              Set serve
            </button>
          ) : null}
          {live ? (
            <button
              aria-label="Swap sides"
              className="control-button"
              data-qa="swap-court-ends"
              onClick={() => onAction({ type: "swap-court-ends" })}
              type="button"
            >
              <ArrowLeftRight aria-hidden="true" />
              Swap
            </button>
          ) : null}
          {!["idle", "complete"].includes(scorer.status) ? (
            <button
              className="control-button control-button--bottom"
              onClick={() => setControlMode("restart")}
              type="button"
            >
              <RotateCcw aria-hidden="true" />
              Restart
            </button>
          ) : null}
          {["running", "paused", "golden-point"].includes(scorer.status) ? (
            <button
              className="control-button control-button--bottom control-button-danger"
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
            onAction({ type: "end-early", now: Date.now(), winner });
          }}
          onRestart={() => {
            setControlMode(null);
            onAction({ type: "reset" });
          }}
          scorer={scorer}
        />
      ) : null}
      <ServeTrackerDialogs
        mode={serveDialog}
        onAction={onAction}
        onClose={() => setServeDialog(null)}
        onStatus={setServeStatus}
        scorer={scorer}
      />
      {scorer.status === "awaiting-confirmation" ? (
        <ResultConfirmationDialog
          onConfirm={onConfirm}
          onEdit={() => onAction({ type: "edit-result" })}
          scorer={scorer}
        />
      ) : null}
    </main>
  );
}
