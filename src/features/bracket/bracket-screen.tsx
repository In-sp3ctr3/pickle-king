"use client";

import "@/app/styles/bracket.css";
import {
  getNextMatch,
  getReadySchedule,
  type TournamentBracket,
} from "@/src/tournament";
import { Trophy } from "lucide-react";
import { Pencil, Share2 } from "lucide-react";
import { useState } from "react";
import type { Player } from "@/src/tournament";
import { bracketShareCanvas, shareCanvas } from "../share";
import { BracketEditorDialog } from "./bracket-editor-dialog";
import { BracketTree } from "./bracket-tree";
import { matchSideLabel, orderedRunOfShow } from "./bracket-utils";
import { type CorrectMatch, MatchCard } from "./match-card";
import { RunOfShow } from "./run-of-show";

export interface BracketScreenProps {
  bracket: TournamentBracket;
  onCorrectMatch: CorrectMatch;
  onStartMatch: (matchId: string) => void;
  sessionLabel?: string;
  timingWarning?: string;
  onEditDraw: (players: Omit<Player, "seed">[], structural: boolean) => boolean;
}

export function BracketScreen({
  bracket,
  onCorrectMatch,
  onStartMatch,
  sessionLabel,
  timingWarning,
  onEditDraw,
}: BracketScreenProps) {
  const [editing, setEditing] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
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
  const automaticAdvanceCount = bracket.bracketSize - bracket.players.length;

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
          <button
            data-qa="edit-draw"
            onClick={() => setEditing(true)}
            type="button"
          >
            <Pencil aria-hidden="true" size={18} /> Edit draw
          </button>
          <button
            data-qa="share-bracket"
            onClick={() =>
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
            }
            type="button"
          >
            <Share2 aria-hidden="true" size={18} /> Share bracket
          </button>
        </div>
      </header>

      <RunOfShow
        matches={runOfShow}
        onStartMatch={onStartMatch}
        players={bracket.players}
        sessionLabel={sessionLabel}
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
          <p>
            {automaticAdvanceCount > 0
              ? `${bracket.players.length} players · ${automaticAdvanceCount} automatic ${
                  automaticAdvanceCount === 1 ? "advance" : "advances"
                }`
              : "Follow each line from the opening round to the final."}
          </p>
        </div>
        <BracketTree
          bracket={bracket}
          nextMatchId={nextMatch?.id}
          onCorrectMatch={onCorrectMatch}
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
            canStart={bronze.id === nextMatch?.id}
            label="Bronze match"
            match={bronze}
            onCorrectMatch={onCorrectMatch}
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
            const saved = onEditDraw(players, structural);
            if (saved) setEditing(false);
            return saved;
          }}
          players={bracket.players}
        />
      ) : null}
      <p aria-live="polite" className="share-status">
        {shareStatus}
      </p>
    </main>
  );
}
