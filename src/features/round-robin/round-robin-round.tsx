import type { Match, Player } from "@/src/tournament";
import { MatchCard } from "../bracket/match-card";
import { matchSideLabel } from "../bracket/bracket-utils";
import type { CorrectMatch, RenamePlayer } from "../bracket";

export function RoundRobinRound({
  matches,
  nextMatchId,
  onCorrectMatch,
  onRenamePlayer,
  onStartMatch,
  players,
  readyMatchIds,
  round,
}: {
  matches: Match[];
  nextMatchId?: string;
  onCorrectMatch: CorrectMatch;
  onRenamePlayer: RenamePlayer;
  onStartMatch: (matchId: string) => void;
  players: Player[];
  readyMatchIds: Set<string>;
  round: number;
}) {
  return (
    <section
      aria-labelledby={`round-robin-round-${round}`}
      className="round-robin-round"
    >
      <header>
        <h3 id={`round-robin-round-${round}`}>Round {round}</h3>
        <p>{roundState(matches)}</p>
      </header>
      <div className="round-robin-round__matches">
        {matches.map((match) => (
          <MatchCard
            canStart={readyMatchIds.has(match.id)}
            key={match.id}
            label={`Round ${round} · Match ${match.ordinal}`}
            match={match}
            onCorrectMatch={onCorrectMatch}
            onRenamePlayer={onRenamePlayer}
            onStartMatch={onStartMatch}
            recommended={match.id === nextMatchId}
            sideALabel={matchSideLabel(match.sideA?.memberIds, players)}
            sideBLabel={matchSideLabel(match.sideB?.memberIds, players)}
          />
        ))}
      </div>
    </section>
  );
}

function roundState(matches: Match[]): string {
  if (matches.every(({ status }) => status === "complete")) return "Complete";
  if (matches.some(({ status }) => status === "live")) return "On court";
  if (matches.some(({ status }) => status === "ready")) return "Ready";
  return "Waiting";
}
