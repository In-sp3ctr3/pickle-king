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
  const restingPlayer = findRestingPlayer(matches, players);

  return (
    <section
      aria-labelledby={`round-robin-round-${round}`}
      className="round-robin-round"
    >
      <header>
        <div className="round-robin-round__title">
          <h3 id={`round-robin-round-${round}`}>Round {round}</h3>
          {restingPlayer ? (
            <p className="round-robin-round__resting">
              Resting this round: <strong>{restingPlayer.name}</strong>
            </p>
          ) : null}
        </div>
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

function findRestingPlayer(matches: Match[], players: Player[]) {
  if (players.length % 2 === 0) return undefined;
  const playingIds = new Set(
    matches.flatMap((match) => [
      ...(match.sideA?.memberIds ?? []),
      ...(match.sideB?.memberIds ?? []),
    ]),
  );
  return players.find(({ id }) => !playingIds.has(id));
}

function roundState(matches: Match[]): string {
  if (matches.every(({ status }) => status === "complete")) return "Complete";
  if (matches.some(({ status }) => status === "live")) return "On court";
  if (matches.some(({ status }) => status === "ready")) return "Ready";
  return "Waiting";
}
