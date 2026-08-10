import type { TournamentBracket } from "../../tournament";

export function MatchHistory({
  bracket,
  name,
}: {
  bracket: TournamentBracket;
  name: (id: string) => string;
}) {
  const roundRobin = bracket.format === "round-robin-finals";
  return (
    <section className="match-history">
      <h2>Match history</h2>
      {roundRobin ? (
        <>
          <MatchHistoryGroup
            bracket={bracket}
            matches={bracket.matches.filter(
              ({ kind, status }) =>
                kind === "round-robin" && status === "complete",
            )}
            name={name}
            title="Round robin"
          />
          <MatchHistoryGroup
            bracket={bracket}
            matches={bracket.matches.filter(
              ({ kind, status }) =>
                kind !== "round-robin" && status === "complete",
            )}
            name={name}
            title="Placement matches"
          />
        </>
      ) : (
        <MatchHistoryRows
          bracket={bracket}
          matches={bracket.matches.filter(
            ({ status }) => status === "complete",
          )}
          name={name}
        />
      )}
    </section>
  );
}

function MatchHistoryGroup({
  bracket,
  matches,
  name,
  title,
}: {
  bracket: TournamentBracket;
  matches: TournamentBracket["matches"];
  name: (id: string) => string;
  title: string;
}) {
  return (
    <section className="match-history__group">
      <h3>{title}</h3>
      <MatchHistoryRows bracket={bracket} matches={matches} name={name} />
    </section>
  );
}

function MatchHistoryRows({
  bracket,
  matches,
  name,
}: {
  bracket: TournamentBracket;
  matches: TournamentBracket["matches"];
  name: (id: string) => string;
}) {
  return matches.map((match) => (
    <div className="history-row" key={match.id}>
      <span>{matchLabel(bracket, match)}</span>
      <strong>
        {name(match.sideA!.memberIds[0])} {match.scoreA}–{match.scoreB}{" "}
        {name(match.sideB!.memberIds[0])}
      </strong>
    </div>
  ));
}

function matchLabel(
  bracket: TournamentBracket,
  match: TournamentBracket["matches"][number],
) {
  if (match.kind === "round-robin") {
    const preliminaryNumber = bracket.matches
      .filter(({ kind }) => kind === "round-robin")
      .findIndex(({ id }) => id === match.id);
    return `Round robin · Match ${preliminaryNumber + 1}`;
  }
  if (match.kind === "bronze") return "Third place";
  if (match.kind === "challenge") return "Late-entry challenge";
  if (match.round === bracket.roundCount) return "Final";
  if (match.round === bracket.roundCount - 1) return "Semifinal";
  if (match.round === bracket.roundCount - 2) return "Quarterfinal";
  return `Round ${match.round}`;
}
