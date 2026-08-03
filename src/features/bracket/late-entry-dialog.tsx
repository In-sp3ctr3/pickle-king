"use client";

import { ActionButton } from "@/src/shared/ui";
import type {
  LateEntryPlan,
  Player,
  TournamentBracket,
} from "@/src/tournament";
import { Clock3, RotateCcw, ShieldCheck, Swords, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const methodCopy = {
  "reversible-bye": {
    title: "Fill the open route.",
    detail: "The newcomer challenges a player who had an automatic advance.",
  },
  "untouched-preliminary": {
    title: "Add one preliminary.",
    detail: "The newcomer earns an untouched opening-round position.",
  },
  "branch-gauntlet": {
    title: "Run the branch gauntlet.",
    detail: "The newcomer must clear the restored path before taking its slot.",
  },
};

interface LateEntryDialogProps {
  blockedReason: string | null;
  bracket: TournamentBracket;
  onApply: (
    plan: LateEntryPlan,
    declinedPlayerIds: string[],
    removeTimeLimit: boolean,
  ) => void;
  onClose: () => void;
  onQuickMatch: (player: Player) => void;
  onRebuild: (player: Player) => void;
  onReplan: (player: Player, declinedPlayerIds: string[]) => LateEntryPlan;
  plan: LateEntryPlan | null;
  player: Player;
}

export function LateEntryDialog(props: LateEntryDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [declined, setDeclined] = useState<string[]>([]);
  const [preview, setPreview] = useState(props.plan);
  const eligibleRestored = props.plan?.restoredPlayerIds ?? [];
  useEffect(() => dialogRef.current?.showModal(), []);
  const names = new Map(
    props.bracket.players.map(({ id, name }) => [id, name]),
  );
  const protectedName = preview
    ? (names.get(preview.protectedPlayerId) ?? "the protected player")
    : "";

  function toggleDeclined(playerId: string) {
    const next = declined.includes(playerId)
      ? declined.filter((id) => id !== playerId)
      : [...declined, playerId];
    setDeclined(next);
    setPreview(props.onReplan(props.player, next));
  }

  return (
    <dialog
      aria-labelledby="late-entry-title"
      className="late-entry-dialog"
      data-qa="late-entry-dialog"
      onCancel={(event) => {
        event.preventDefault();
        props.onClose();
      }}
      ref={dialogRef}
    >
      <header>
        <div>
          <p className="eyebrow">Late entry review</p>
          <h2 id="late-entry-title">
            {props.blockedReason
              ? "The draw is locked."
              : methodCopy[preview!.method].title}
          </h2>
        </div>
        <button
          aria-label="Close late-entry review"
          onClick={props.onClose}
          type="button"
        >
          <X aria-hidden="true" />
        </button>
      </header>

      {props.blockedReason ? (
        <BlockedEntry
          message={props.blockedReason}
          onClose={props.onClose}
          onQuickMatch={() => props.onQuickMatch(props.player)}
          onRebuild={() => props.onRebuild(props.player)}
          playerName={props.player.name}
        />
      ) : (
        <>
          <div className="late-entry-dialog__summary">
            <Swords aria-hidden="true" />
            <div>
              <strong>
                {props.player.name} must earn {protectedName}&apos;s route.
              </strong>
              <span>{methodCopy[preview!.method].detail}</span>
            </div>
          </div>
          {eligibleRestored.length ? (
            <fieldset className="late-entry-dialog__restored">
              <legend>Players invited back on this branch</legend>
              <p>
                Uncheck anyone who declines. The challenge route updates
                immediately.
              </p>
              {eligibleRestored.map((playerId) => (
                <label key={playerId}>
                  <input
                    checked={!declined.includes(playerId)}
                    onChange={() => toggleDeclined(playerId)}
                    type="checkbox"
                  />
                  <span>{names.get(playerId) ?? "Player"}</span>
                  <small>
                    {declined.includes(playerId) ? "Declined" : "Returns"}
                  </small>
                </label>
              ))}
            </fieldset>
          ) : null}
          <TimingImpact plan={preview!} />
          <p className="late-entry-dialog__integrity">
            <ShieldCheck aria-hidden="true" /> Completed scores stay in history.
            This tournament will be marked as amended.
          </p>
          <footer>
            <ActionButton onClick={props.onClose} variant="quiet">
              Cancel and continue bracket as is
            </ActionButton>
            <ActionButton
              onClick={() => props.onRebuild(props.player)}
              variant="danger"
            >
              <RotateCcw aria-hidden="true" size={17} /> Rebuild from scratch
            </ActionButton>
            <ActionButton
              data-qa="confirm-late-entry"
              onClick={() =>
                props.onApply(preview!, declined, !preview!.timing.feasible)
              }
            >
              Add {props.player.name}
            </ActionButton>
          </footer>
        </>
      )}
    </dialog>
  );
}

function TimingImpact({ plan }: { plan: LateEntryPlan }) {
  const matchCount = plan.restoredPlayerIds.length + 1;
  const current = formatMinutes(plan.timing.currentCapMs);
  const proposed = formatMinutes(plan.timing.proposedCapMs);
  return (
    <div
      className="late-entry-dialog__timing"
      data-feasible={plan.timing.feasible}
    >
      <Clock3 aria-hidden="true" />
      <div>
        <strong>
          {matchCount} challenge {matchCount === 1 ? "match" : "matches"}
        </strong>
        <span>
          {!plan.timing.feasible
            ? "The booking cannot fit them. Confirming removes time caps from every remaining match."
            : current && proposed && current !== proposed
              ? `Remaining caps change from ${current} to ${proposed}.`
              : "The current court plan still fits."}
        </span>
      </div>
    </div>
  );
}

function BlockedEntry({
  message,
  onClose,
  onQuickMatch,
  onRebuild,
  playerName,
}: {
  message: string;
  onClose: () => void;
  onQuickMatch: () => void;
  onRebuild: () => void;
  playerName: string;
}) {
  return (
    <div className="late-entry-dialog__blocked">
      <p>{message}</p>
      <p>
        Continue this bracket and play {playerName} in Quick Match, rebuild the
        field now, or finish and start another tournament afterward.
      </p>
      <footer>
        <ActionButton onClick={onClose} variant="quiet">
          Cancel and continue bracket as is
        </ActionButton>
        <ActionButton onClick={onQuickMatch} variant="secondary">
          Open Quick Match
        </ActionButton>
        <ActionButton onClick={onRebuild} variant="danger">
          End and rebuild bracket
        </ActionButton>
      </footer>
    </div>
  );
}

function formatMinutes(value: number | null) {
  if (value === null) return null;
  const minutes = Math.floor(value / 60_000);
  const seconds = Math.floor((value % 60_000) / 1_000);
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}
