"use client";

import type { TournamentBracket } from "@/src/tournament";
import { motion, useReducedMotion } from "motion/react";
import { RotateCcw, Swords } from "lucide-react";
import { matchSideLabel } from "./bracket-utils";
import { type CorrectMatch, MatchCard } from "./match-card";

export function LateEntryLane({
  bracket,
  nextMatchId,
  onCorrectMatch,
  onStartMatch,
  onUndo,
}: {
  bracket: TournamentBracket;
  nextMatchId?: string;
  onCorrectMatch: CorrectMatch;
  onStartMatch: (matchId: string) => void;
  onUndo: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const amendment = bracket.amendments.at(-1);
  if (!amendment) return null;
  const matches = amendment.challengeMatchIds
    .map((id) => bracket.matches.find((match) => match.id === id))
    .filter((match) => match !== undefined);
  const canUndo = matches.every(
    ({ startedAt, status }) => startedAt === null && status !== "complete",
  );
  const entrant = bracket.players.find(
    ({ id }) => id === amendment.playerId,
  )?.name;
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      aria-labelledby="late-entry-lane-title"
      className="late-entry-lane"
      data-qa="late-entry-lane"
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      transition={{ duration: reducedMotion ? 0 : 0.38 }}
    >
      <header>
        <div>
          <p>
            <Swords aria-hidden="true" size={16} /> Amended bracket
          </p>
          <h2 id="late-entry-lane-title">{entrant} runs the challenge lane.</h2>
        </div>
        {canUndo ? (
          <button data-qa="undo-late-entry" onClick={onUndo} type="button">
            <RotateCcw aria-hidden="true" size={17} /> Undo amendment
          </button>
        ) : (
          <span>Locked after first serve</span>
        )}
      </header>
      <div className="late-entry-lane__matches">
        {matches.map((match, index) => (
          <MatchCard
            canStart={match.id === nextMatchId}
            key={match.id}
            label={`Challenge ${index + 1} of ${matches.length}`}
            match={match}
            onCorrectMatch={onCorrectMatch}
            onStartMatch={onStartMatch}
            sideALabel={matchSideLabel(match.sideA?.memberIds, bracket.players)}
            sideBLabel={matchSideLabel(match.sideB?.memberIds, bracket.players)}
          />
        ))}
      </div>
    </motion.section>
  );
}
