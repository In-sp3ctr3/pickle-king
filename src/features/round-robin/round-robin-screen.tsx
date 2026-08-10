"use client";

import "@/app/styles/bracket.css";
import "@/app/styles/round-robin.css";
import {
  calculatePreliminaryStandings,
  getNextMatch,
  getReadySchedule,
  matchStageLabel,
  type DrawStyle,
  type Match,
  type MatchSource,
  type TournamentBracket,
} from "@/src/tournament";
import { Dices, ListOrdered } from "lucide-react";
import { BracketResultsAction } from "../bracket/bracket-results-action";
import { orderedRunOfShow } from "../bracket/bracket-utils";
import {
  FinalMatchCard,
  MatchCard,
  type CorrectMatch,
  type RenamePlayer,
} from "../bracket/match-card";
import { RunOfShow } from "../bracket/run-of-show";
import { RoundRobinRound } from "./round-robin-round";
import { StandingsTable } from "./standings-table";

export interface RoundRobinScreenProps {
  bracket: TournamentBracket;
  drawStyle?: DrawStyle;
  onCorrectMatch: CorrectMatch;
  onRenamePlayer: RenamePlayer;
  onRerollRandomDraw?: () => void;
  onStartMatch: (matchId: string) => void;
  onViewResults?: () => void;
  sessionLabel?: string;
  timingWarning?: string;
}

export function RoundRobinScreen({
  bracket,
  drawStyle,
  onCorrectMatch,
  onRenamePlayer,
  onRerollRandomDraw,
  onStartMatch,
  onViewResults,
  sessionLabel,
  timingWarning,
}: RoundRobinScreenProps) {
  const readySchedule = getReadySchedule(bracket);
  const readyMatchIds = new Set(readySchedule.map(({ id }) => id));
  const nextMatch = getNextMatch(bracket);
  const runOfShow = [
    ...readySchedule,
    ...orderedRunOfShow(bracket.matches).filter(
      (match) => !readyMatchIds.has(match.id),
    ),
  ];
  const preliminaries = bracket.matches.filter(
    ({ kind }) => kind === "round-robin",
  );
  const placements = bracket.matches.filter(
    ({ id }) => id === bracket.bronzeMatchId || id === bracket.finalMatchId,
  );
  const completedCount = bracket.matches.filter(
    ({ status }) => status === "complete",
  ).length;
  const preliminariesComplete = preliminaries.every(
    ({ status }) => status === "complete",
  );
  const preliminaryRounds = [
    ...new Set(preliminaries.map(({ round }) => round)),
  ].toSorted((left, right) => left - right);
  const untouched = bracket.matches.every(
    ({ startedAt }) => startedAt === null,
  );

  return (
    <main className="round-robin-screen" data-qa="round-robin-screen">
      <header className="round-robin-screen__header">
        <div>
          <p className="round-robin-screen__eyebrow">
            <ListOrdered aria-hidden="true" size={17} /> Round robin + finals
          </p>
          <h1>Every point shapes the table.</h1>
        </div>
        <div className="round-robin-screen__header-meta">
          <p>
            {completedCount} of {bracket.matches.length} matches complete
          </p>
          <div className="round-robin-screen__actions">
            {completedCount === bracket.matches.length && onViewResults ? (
              <BracketResultsAction onView={onViewResults} />
            ) : null}
            {drawStyle === "random" && onRerollRandomDraw && untouched ? (
              <button
                aria-label="Shuffle random player order again"
                data-qa="reroll-random-draw"
                onClick={onRerollRandomDraw}
                type="button"
              >
                <Dices aria-hidden="true" size={18} /> Shuffle again
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <RunOfShow
        matches={runOfShow}
        onStartMatch={onStartMatch}
        players={bracket.players}
        sessionLabel={sessionLabel}
      />
      {timingWarning ? (
        <p className="round-robin-screen__warning" role="status">
          {timingWarning}
        </p>
      ) : null}

      <StandingsTable
        confirmed={preliminariesComplete}
        players={bracket.players}
        standings={calculatePreliminaryStandings(bracket)}
      />

      <section
        aria-labelledby="round-robin-schedule-title"
        className="round-robin-schedule"
      >
        <div className="round-robin-section-heading">
          <div>
            <p>{preliminaryCountLabel(preliminaries.length)}</p>
            <h2 id="round-robin-schedule-title">Round-robin schedule</h2>
          </div>
          <p>Complete every match to unlock the next round.</p>
        </div>
        <div className="round-robin-schedule__rounds">
          {preliminaryRounds.map((round) => (
            <RoundRobinRound
              key={round}
              matches={preliminaries.filter((match) => match.round === round)}
              nextMatchId={nextMatch?.id}
              onCorrectMatch={onCorrectMatch}
              onRenamePlayer={onRenamePlayer}
              onStartMatch={onStartMatch}
              players={bracket.players}
              readyMatchIds={readyMatchIds}
              round={round}
            />
          ))}
        </div>
      </section>

      <PlacementMatches
        bracket={bracket}
        matches={placements}
        nextMatchId={nextMatch?.id}
        onCorrectMatch={onCorrectMatch}
        onRenamePlayer={onRenamePlayer}
        onStartMatch={onStartMatch}
        readyMatchIds={readyMatchIds}
      />
    </main>
  );
}

function PlacementMatches({
  bracket,
  matches,
  nextMatchId,
  onCorrectMatch,
  onRenamePlayer,
  onStartMatch,
  readyMatchIds,
}: {
  bracket: TournamentBracket;
  matches: Match[];
  nextMatchId?: string;
  onCorrectMatch: CorrectMatch;
  onRenamePlayer: RenamePlayer;
  onStartMatch: (matchId: string) => void;
  readyMatchIds: Set<string>;
}) {
  return (
    <section
      aria-labelledby="placement-matches-title"
      className="round-robin-placements"
    >
      <div className="round-robin-section-heading">
        <div>
          <p>Placement matches</p>
          <h2 id="placement-matches-title">Settle the podium</h2>
        </div>
        <p>Third place is played first; then the championship unlocks.</p>
      </div>
      <div className="round-robin-placements__matches">
        {matches.map((match) => {
          const Card =
            match.id === bracket.finalMatchId ? FinalMatchCard : MatchCard;
          return (
            <Card
              canStart={readyMatchIds.has(match.id)}
              key={match.id}
              label={matchStageLabel(bracket, match) ?? "Placement"}
              match={match}
              onCorrectMatch={onCorrectMatch}
              onRenamePlayer={onRenamePlayer}
              onStartMatch={onStartMatch}
              recommended={match.id === nextMatchId}
              sideALabel={placementSideLabel(
                match.sideA,
                match.sourceA,
                bracket,
              )}
              sideBLabel={placementSideLabel(
                match.sideB,
                match.sourceB,
                bracket,
              )}
            />
          );
        })}
      </div>
    </section>
  );
}

function placementSideLabel(
  side: Match["sideA"],
  source: MatchSource,
  bracket: TournamentBracket,
): string {
  const playerId = side?.memberIds[0];
  if (playerId) {
    return (
      bracket.players.find(({ id }) => id === playerId)?.name ??
      "Unknown player"
    );
  }
  if (source.type === "standing") return `${ordinal(source.rank)} in standings`;
  return "To be decided";
}

function ordinal(rank: number): string {
  return rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : "4th";
}

function preliminaryCountLabel(count: number): string {
  const words: Record<number, string> = {
    6: "Six",
    10: "Ten",
    15: "Fifteen",
  };
  return `${words[count] ?? count} preliminary matches`;
}
