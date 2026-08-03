"use client";

import "@/app/styles/bracket.css";
import {
  getNextMatch,
  getReadySchedule,
  type LateEntryPlan,
  type TournamentBracket,
} from "@/src/tournament";
import { Trophy } from "lucide-react";
import { Pencil, Share2 } from "lucide-react";
import { useState } from "react";
import { useTransientStatus } from "@/src/shared/use-transient-status";
import type { Player } from "@/src/tournament";
import { bracketShareCanvas, shareCanvas } from "../share";
import { BracketEditorDialog } from "./bracket-editor-dialog";
import { BracketTree } from "./bracket-tree";
import { LateEntryDialog } from "./late-entry-dialog";
import { LateEntryLane } from "./late-entry-lane";
import { matchSideLabel, orderedRunOfShow } from "./bracket-utils";
import { type CorrectMatch, MatchCard, type RenamePlayer } from "./match-card";
import { RunOfShow } from "./run-of-show";

export interface BracketScreenProps {
  bracket: TournamentBracket;
  onCorrectMatch: CorrectMatch;
  onRenamePlayer: RenamePlayer;
  onStartMatch: (matchId: string) => void;
  sessionLabel?: string;
  timingWarning?: string;
  onApplyLateEntry: (
    player: Player,
    plan: LateEntryPlan,
    declinedPlayerIds: string[],
    removeTimeLimit: boolean,
  ) => void;
  onEditDraw: (
    players: Omit<Player, "seed">[],
    structural: boolean,
  ) => DrawEditOutcome;
  onQuickMatch: (player: Player) => void;
  onRebuildWithPlayer: (player: Player) => void;
  onReplanLateEntry: (
    player: Player,
    declinedPlayerIds: string[],
  ) => LateEntryPlan;
  onUndoLateEntry: () => void;
}

export type DrawEditOutcome =
  | { kind: "saved" }
  | { kind: "late-entry"; plan: LateEntryPlan; player: Player }
  | { kind: "blocked"; message: string; player: Player };

export function BracketScreen({
  bracket,
  onCorrectMatch,
  onRenamePlayer,
  onStartMatch,
  sessionLabel,
  timingWarning,
  onEditDraw,
  onApplyLateEntry,
  onQuickMatch,
  onRebuildWithPlayer,
  onReplanLateEntry,
  onUndoLateEntry,
}: BracketScreenProps) {
  const [editing, setEditing] = useState(false);
  const [lateReview, setLateReview] = useState<
    | {
        blockedReason: string | null;
        plan: LateEntryPlan | null;
        player: Player;
      }
    | undefined
  >();
  const [shareStatus, setShareStatus] = useTransientStatus();
  const [sharing, setSharing] = useState(false);
  const nextMatch = getNextMatch(bracket);
  const readySchedule = getReadySchedule(bracket);
  const runOfShow = [
    ...readySchedule,
    ...orderedRunOfShow(bracket.matches).filter(
      (match) => !readySchedule.some(({ id }) => id === match.id),
    ),
  ];
  const completeCount = bracket.matches.filter(
    (match) => match.status === "complete",
  ).length;
  const bronze = bracket.matches.find(
    (match) => match.id === bracket.bronzeMatchId,
  );
  const automaticAdvanceCount = Math.max(
    0,
    bracket.bracketSize - bracket.players.length,
  );

  return (
    <main className="bracket-screen" data-qa="bracket-screen">
      <header className="bracket-screen__header">
        <div>
          <p className="bracket-screen__eyebrow">
            <Trophy aria-hidden="true" size={17} />
            Tournament bracket
          </p>
          <h1>Road to the crown.</h1>
        </div>
        <div className="bracket-screen__header-actions">
          <p className="bracket-screen__progress">
            {completeCount} of {bracket.matches.length} matches final
          </p>
        </div>
      </header>

      <RunOfShow
        matches={runOfShow}
        onStartMatch={onStartMatch}
        players={bracket.players}
        sessionLabel={sessionLabel}
      />
      <LateEntryLane
        bracket={bracket}
        nextMatchId={nextMatch?.id}
        onCorrectMatch={onCorrectMatch}
        onStartMatch={onStartMatch}
        onUndo={onUndoLateEntry}
      />
      {timingWarning ? (
        <p className="bracket-screen__warning" role="status">
          {timingWarning}
        </p>
      ) : null}

      <section
        aria-labelledby="full-bracket-title"
        className="bracket-screen__draw"
      >
        <div className="bracket-screen__draw-heading">
          <div>
            <p>Bracket view</p>
            <h2 id="full-bracket-title">Full draw</h2>
          </div>
          <div className="bracket-screen__draw-meta">
            <p>
              {automaticAdvanceCount > 0
                ? `${bracket.players.length} players · ${automaticAdvanceCount} automatic ${
                    automaticAdvanceCount === 1 ? "advance" : "advances"
                  }`
                : "Follow each line from the opening round to the final."}
            </p>
            <div className="bracket-screen__draw-tools" aria-label="Draw tools">
              <button
                data-qa="edit-draw"
                onClick={() => setEditing(true)}
                type="button"
              >
                <Pencil aria-hidden="true" size={18} /> Edit draw
              </button>
              <button
                data-qa="share-bracket"
                disabled={sharing}
                onClick={() => {
                  if (sharing) return;
                  setSharing(true);
                  setShareStatus("Building image…");
                  void shareCanvas(
                    bracketShareCanvas(bracket),
                    "pickle-king-bracket.png",
                    "Pickle King tournament bracket",
                  )
                    .then((outcome) =>
                      setShareStatus(
                        outcome === "downloaded"
                          ? "Bracket image downloaded."
                          : outcome === "shared"
                            ? "Share sheet opened."
                            : "Sharing cancelled.",
                      ),
                    )
                    .catch(() =>
                      setShareStatus("The bracket image could not be shared."),
                    )
                    .finally(() => setSharing(false));
                }}
                type="button"
              >
                <Share2 aria-hidden="true" size={18} />
                {sharing ? "Building image…" : "Share bracket"}
              </button>
            </div>
          </div>
        </div>
        <BracketTree
          bracket={bracket}
          nextMatchId={nextMatch?.id}
          readyMatchIds={readySchedule.map(({ id }) => id)}
          onCorrectMatch={onCorrectMatch}
          onRenamePlayer={onRenamePlayer}
          onStartMatch={onStartMatch}
        />
      </section>

      {bronze ? (
        <section
          aria-labelledby="bronze-title"
          className="bracket-screen__bronze"
        >
          <div>
            <p>Before the final</p>
            <h2 id="bronze-title">Third-place court</h2>
          </div>
          <MatchCard
            canStart={readySchedule.some(({ id }) => id === bronze.id)}
            recommended={bronze.id === nextMatch?.id}
            label="Bronze match"
            match={bronze}
            onCorrectMatch={onCorrectMatch}
            onRenamePlayer={onRenamePlayer}
            onStartMatch={onStartMatch}
            sideALabel={matchSideLabel(
              bronze.sideA?.memberIds,
              bracket.players,
            )}
            sideBLabel={matchSideLabel(
              bronze.sideB?.memberIds,
              bracket.players,
            )}
          />
        </section>
      ) : null}
      {editing ? (
        <BracketEditorDialog
          hasStarted={bracket.matches.some(
            ({ startedAt }) => startedAt !== null,
          )}
          onClose={() => setEditing(false)}
          onSave={(players, structural) => {
            const outcome = onEditDraw(players, structural);
            if (outcome.kind === "saved") {
              setEditing(false);
              return;
            }
            setEditing(false);
            setLateReview({
              blockedReason:
                outcome.kind === "blocked" ? outcome.message : null,
              plan: outcome.kind === "late-entry" ? outcome.plan : null,
              player: outcome.player,
            });
          }}
          players={bracket.players}
        />
      ) : null}
      {lateReview ? (
        <LateEntryDialog
          blockedReason={lateReview.blockedReason}
          bracket={bracket}
          onApply={(plan, declinedPlayerIds, removeTimeLimit) => {
            onApplyLateEntry(
              lateReview.player,
              plan,
              declinedPlayerIds,
              removeTimeLimit,
            );
            setLateReview(undefined);
          }}
          onClose={() => setLateReview(undefined)}
          onQuickMatch={(player) => {
            onQuickMatch(player);
            setLateReview(undefined);
          }}
          onRebuild={(player) => {
            onRebuildWithPlayer(player);
            setLateReview(undefined);
          }}
          onReplan={onReplanLateEntry}
          plan={lateReview.plan}
          player={lateReview.player}
        />
      ) : null}
      <p aria-live="polite" className="share-status">
        {shareStatus}
      </p>
    </main>
  );
}
