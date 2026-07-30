import { ActionButton, StatusLabel } from "@/src/shared/ui";
import type { Match, Player } from "@/src/tournament";
import { Crown, FastForward, Play, Trophy } from "lucide-react";
import { matchSideLabel } from "./bracket-utils";

export function EntryCard({
  player,
  slot,
}: {
  player: Player | null;
  slot: number;
}) {
  return (
    <article
      aria-label={
        player
          ? `Seed ${player.seed ?? slot}: ${player.name}`
          : `Bracket slot ${slot}: bye`
      }
      className={`bracket-entry ${player ? "" : "bracket-entry--empty"}`}
    >
      <span>{player ? String(player.seed ?? slot).padStart(2, "0") : "—"}</span>
      <strong>{player?.name ?? "Bye"}</strong>
    </article>
  );
}

export function OutcomeCard({
  canStart,
  label,
  match,
  onCorrectMatch,
  onStartMatch,
  players,
}: {
  canStart: boolean;
  label: string;
  match: Match;
  onCorrectMatch: (matchId: string) => void;
  onStartMatch: (matchId: string) => void;
  players: Player[];
}) {
  const winner = players.find(({ id }) => id === match.winnerId);
  const matchup = `${matchSideLabel(
    match.sideA?.memberIds,
    players,
  )} vs ${matchSideLabel(match.sideB?.memberIds, players)}`;

  return (
    <article
      aria-label={`${label}: ${winner ? `${winner.name} advanced` : matchup}`}
      className={`bracket-outcome bracket-outcome--${match.status}`}
      data-match-status={match.status}
    >
      <header>
        <span>{label}</span>
        <StatusLabel status={match.status} />
      </header>
      <div>
        <strong>{winner?.name ?? matchup}</strong>
        {winner ? (
          <span>
            {match.scoreA}–{match.scoreB}
          </span>
        ) : null}
      </div>
      <MatchAction
        canStart={canStart}
        match={match}
        onCorrectMatch={onCorrectMatch}
        onStartMatch={onStartMatch}
      />
    </article>
  );
}

export function ByeOutcomeCard({
  label,
  playerName,
}: {
  label: string;
  playerName: string;
}) {
  return (
    <article
      aria-label={`${label}: ${playerName} advances with a bye`}
      className="bracket-outcome bracket-outcome--bye"
    >
      <header>
        <span>{label}</span>
        <span className="bracket-bye-label">
          <FastForward aria-hidden="true" size={13} />
          Bye
        </span>
      </header>
      <div>
        <strong>{playerName}</strong>
        <span>Advances</span>
      </div>
    </article>
  );
}

export function FinalistCard({
  match,
  players,
  side,
}: {
  match: Match;
  players: Player[];
  side: "a" | "b";
}) {
  const memberIds =
    side === "a" ? match.sideA?.memberIds : match.sideB?.memberIds;
  const playerName = matchSideLabel(memberIds, players);
  const isWaiting = playerName === "To be decided";
  return (
    <article
      aria-label={
        isWaiting
          ? `Finalist ${side.toUpperCase()} has not been decided`
          : `${playerName} reached the final`
      }
      className={`finalist-card ${isWaiting ? "finalist-card--waiting" : ""}`}
    >
      <span>Finalist {side.toUpperCase()}</span>
      <strong>{isWaiting ? "Awaiting" : playerName}</strong>
    </article>
  );
}

export function ChampionCard({
  canStart,
  match,
  onCorrectMatch,
  onStartMatch,
  players,
}: {
  canStart: boolean;
  match: Match;
  onCorrectMatch: (matchId: string) => void;
  onStartMatch: (matchId: string) => void;
  players: Player[];
}) {
  const winner = players.find(({ id }) => id === match.winnerId);
  return (
    <div className="championship-node">
      <span aria-hidden="true" className="championship-node__mark">
        <Trophy size={42} strokeWidth={1.8} />
      </span>
      <article
        aria-label={
          winner
            ? `${winner.name} is tournament champion`
            : `Championship match: ${match.status}`
        }
        className={`champion-card champion-card--${match.status}`}
        data-qa="champion-slot"
      >
        <p>
          <Crown aria-hidden="true" size={15} />
          Champion
        </p>
        <strong>{winner?.name ?? "Crown awaits"}</strong>
        {winner ? (
          <span>
            Final · {match.scoreA}–{match.scoreB}
          </span>
        ) : (
          <StatusLabel status={match.status} />
        )}
        <MatchAction
          canStart={canStart}
          match={match}
          onCorrectMatch={onCorrectMatch}
          onStartMatch={onStartMatch}
        />
      </article>
    </div>
  );
}

function MatchAction({
  canStart,
  match,
  onCorrectMatch,
  onStartMatch,
}: {
  canStart: boolean;
  match: Match;
  onCorrectMatch: (matchId: string) => void;
  onStartMatch: (matchId: string) => void;
}) {
  if (match.status === "ready" && canStart) {
    return (
      <ActionButton
        className="bracket-node-action"
        data-qa="bracket-node-start"
        onClick={() => onStartMatch(match.id)}
      >
        <Play aria-hidden="true" fill="currentColor" size={15} />
        Play
      </ActionButton>
    );
  }
  if (match.status === "complete") {
    return (
      <ActionButton
        className="bracket-node-action"
        onClick={() => onCorrectMatch(match.id)}
        variant="secondary"
      >
        Correct
      </ActionButton>
    );
  }
  return null;
}
