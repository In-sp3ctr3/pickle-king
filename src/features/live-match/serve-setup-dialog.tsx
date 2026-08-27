"use client";

import { useEffect, useRef, useState } from "react";
import type { MatchTeam, ScoringState, ServiceState } from "../../match/types";
import { servePlayers, type ServePlayer } from "./serve-players";

export function ServeSetupDialog({
  scorer,
  onClose,
  onConfirm,
}: {
  scorer: ScoringState;
  onClose: () => void;
  onConfirm: (service: ServiceState) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const teamA = servePlayers(scorer, "A");
  const teamB = servePlayers(scorer, "B");
  const [startingTeam, setStartingTeam] = useState<MatchTeam>("A");
  const [rightAtZeroA, setRightAtZeroA] = useState(teamA[0]?.id ?? "");
  const [rightAtZeroB, setRightAtZeroB] = useState(teamB[0]?.id ?? "");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog.showModal();
    dialog.querySelector<HTMLInputElement>("[data-initial-focus]")?.focus();
    return () => {
      const returnTarget = returnFocusRef.current;
      requestAnimationFrame(() => {
        if (returnTarget?.isConnected && returnTarget !== document.body)
          returnTarget.focus();
      });
    };
  }, []);

  const close = (next: () => void) => {
    dialogRef.current?.close();
    next();
  };
  const isDoubles = teamA.length === 2 || teamB.length === 2;

  return (
    <dialog
      aria-labelledby="serve-setup-title"
      className="serve-dialog"
      data-qa="serve-setup-dialog"
      onCancel={(event) => {
        event.preventDefault();
        close(onClose);
      }}
      ref={dialogRef}
    >
      <p className="eyebrow">Before the first rally</p>
      <h2 id="serve-setup-title">Set the opening serve</h2>
      <p className="serve-dialog__intro">
        This sets the legal serving order. It does not track where players stand
        after the serve.
      </p>
      <fieldset className="serve-dialog__choices">
        <legend>Who serves first?</legend>
        <TeamChoice
          checked={startingTeam === "A"}
          first
          label={scorer.labelA}
          onChange={() => setStartingTeam("A")}
        />
        <TeamChoice
          checked={startingTeam === "B"}
          label={scorer.labelB}
          onChange={() => setStartingTeam("B")}
        />
      </fieldset>
      {isDoubles ? (
        <div className="serve-setup-positions">
          <PositionChoice
            label={scorer.labelA}
            name="right-at-zero-a"
            onChange={setRightAtZeroA}
            players={teamA}
            value={rightAtZeroA}
          />
          <PositionChoice
            label={scorer.labelB}
            name="right-at-zero-b"
            onChange={setRightAtZeroB}
            players={teamB}
            value={rightAtZeroB}
          />
        </div>
      ) : null}
      <footer className="serve-dialog__actions">
        <button
          className="secondary-button"
          onClick={() => close(onClose)}
          type="button"
        >
          Cancel
        </button>
        <button
          className="primary-button"
          data-qa="confirm-serve-setup"
          disabled={!rightAtZeroA || !rightAtZeroB}
          onClick={() =>
            close(() =>
              onConfirm({
                startingTeam,
                servingTeam: startingTeam,
                serverId: startingTeam === "A" ? rightAtZeroA : rightAtZeroB,
                turn: "opening",
                rightAtZero: { A: rightAtZeroA, B: rightAtZeroB },
              }),
            )
          }
          type="button"
        >
          Start match
        </button>
      </footer>
    </dialog>
  );
}

function TeamChoice({
  checked,
  first,
  label,
  onChange,
}: {
  checked: boolean;
  first?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="serve-choice">
      <input
        checked={checked}
        data-initial-focus={first || undefined}
        name="starting-team"
        onChange={onChange}
        type="radio"
      />
      <span>{label}</span>
    </label>
  );
}

function PositionChoice({
  label,
  name,
  onChange,
  players,
  value,
}: {
  label: string;
  name: string;
  onChange: (id: string) => void;
  players: ServePlayer[];
  value: string;
}) {
  if (players.length < 2) return null;
  return (
    <fieldset className="serve-dialog__choices">
      <legend>{label}: right at 0–0</legend>
      {players.map((player) => (
        <label className="serve-choice" key={player.id}>
          <input
            checked={value === player.id}
            name={name}
            onChange={() => onChange(player.id)}
            type="radio"
          />
          <span>{player.name}</span>
        </label>
      ))}
    </fieldset>
  );
}
