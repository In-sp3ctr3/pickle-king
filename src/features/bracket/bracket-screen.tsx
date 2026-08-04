"use client";

import "@/app/styles/bracket.css";
import {
  getNextMatch,
  getReadySchedule,
  type DrawStyle,
  type LateEntryPlan,
  type Player,
  type TournamentBracket,
} from "@/src/tournament";
import { Dices, Pencil, Trophy } from "lucide-react";
import { useState } from "react";
import {
  bracketShareCanvas,
  ShareImageDialog,
  type ShareImageRequest,
  tournamentShareContentKey,
} from "../share";
import { BracketEditorDialog } from "./bracket-editor-dialog";
import {
  BracketResultsAction,
  BracketShareAction,
} from "./bracket-results-action";
import { BracketTree } from "./bracket-tree";
import { LateEntryDialog } from "./late-entry-dialog";
import { LateEntryLane } from "./late-entry-lane";
import { orderedRunOfShow } from "./bracket-utils";
import { type CorrectMatch, type RenamePlayer } from "./match-card";
import { RunOfShow } from "./run-of-show";

export interface BracketScreenProps {
  bracket: TournamentBracket;
  onCorrectMatch: CorrectMatch;
  onRenamePlayer: RenamePlayer;
  drawStyle?: DrawStyle;
  onRerollRandomDraw?: () => void;
  onViewResults?: () => void;
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
  drawStyle,
  onRerollRandomDraw,
  onStartMatch,
  sessionLabel,
  timingWarning,
  onEditDraw,
  onApplyLateEntry,
  onQuickMatch,
  onRebuildWithPlayer,
  onReplanLateEntry,
  onUndoLateEntry,
  onViewResults,
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
  const [shareRequest, setShareRequest] = useState<ShareImageRequest | null>(
    null,
  );
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
  const automaticAdvanceCount = Math.max(
    0,
    bracket.bracketSize - bracket.players.length,
  );
  const drawHasStarted = bracket.matches.some(
    ({ startedAt }) => startedAt !== null,
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
        <p className="bracket-screen__header-actions bracket-screen__progress">
          {completeCount} of {bracket.matches.length} matches complete
        </p>
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
              {completeCount === bracket.matches.length && onViewResults ? (
                <BracketResultsAction onView={onViewResults} />
              ) : null}
              {drawStyle === "random" &&
              onRerollRandomDraw &&
              !drawHasStarted ? (
                <button
                  aria-label="Shuffle random draw again"
                  data-qa="reroll-random-draw"
                  onClick={onRerollRandomDraw}
                  title="Shuffle random draw again"
                  type="button"
                >
                  <Dices aria-hidden="true" size={18} />
                  Shuffle again
                </button>
              ) : null}
              <button
                data-qa="edit-draw"
                onClick={() => setEditing(true)}
                type="button"
              >
                <Pencil aria-hidden="true" size={18} /> Edit draw
              </button>
              <BracketShareAction
                onShare={() => {
                  setShareRequest({
                    alt: "Tournament bracket share image",
                    aspect: "landscape",
                    build: (format) => bracketShareCanvas(bracket, format),
                    fileName: "pickle-king-bracket.png",
                    formats: ["landscape", "feed", "story"],
                    initialFormat: "landscape",
                    inspectable: true,
                    key: `bracket:${tournamentShareContentKey(bracket)}`,
                    title: "Share bracket",
                  });
                }}
              />
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
      {shareRequest ? (
        <ShareImageDialog
          onClose={() => setShareRequest(null)}
          request={shareRequest}
        />
      ) : null}
    </main>
  );
}
