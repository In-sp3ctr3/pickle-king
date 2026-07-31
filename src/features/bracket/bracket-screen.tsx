"use client";

import "@/app/styles/bracket.css";
import {
  getNextMatch,
  getReadySchedule,
  type TournamentBracket,
} from "@/src/tournament";
import { Trophy } from "lucide-react";
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
}

export function BracketScreen({
  bracket,
  onCorrectMatch,
  onStartMatch,
  sessionLabel,
  timingWarning,
}: BracketScreenProps) {
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
        <p className="bracket-screen__progress">
          {completeCount} of {bracket.matches.length} matches final
        </p>
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
    </main>
  );
}
