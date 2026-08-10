import type { Player, PlayerStanding } from "@/src/tournament";

export function StandingsTable({
  confirmed,
  players,
  standings,
}: {
  confirmed: boolean;
  players: Player[];
  standings: PlayerStanding[];
}) {
  const playerNames = new Map(players.map(({ id, name }) => [id, name]));
  const announcement = confirmed
    ? `Standings confirmed: ${standings
        .map(
          ({ playerId }, index) =>
            `${index + 1}, ${playerNames.get(playerId) ?? "Unknown player"}`,
        )
        .join("; ")}.`
    : `Standings updated: ${standings
        .map(
          ({ playerId, wins }, index) =>
            `${index + 1}, ${playerNames.get(playerId) ?? "Unknown player"}, ${wins} wins`,
        )
        .join("; ")}.`;

  return (
    <section
      aria-labelledby="preliminary-standings-title"
      className="round-robin-standings"
    >
      <div className="round-robin-section-heading">
        <div>
          <p>Live table</p>
          <h2 id="preliminary-standings-title">Preliminary standings</h2>
        </div>
        <p>{confirmed ? "Positions confirmed" : "Provisional positions"}</p>
      </div>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <div className="round-robin-standings__table-wrap">
        <table aria-label="Preliminary standings">
          <thead>
            <tr>
              <th scope="col">Place</th>
              <th scope="col">Player</th>
              <th scope="col">W–L</th>
              <th scope="col">For</th>
              <th scope="col">Against</th>
              <th scope="col">Diff</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, index) => (
              <tr key={standing.playerId}>
                <td data-label="Place">
                  <strong>{index + 1}</strong>
                </td>
                <td data-label="Player">
                  <strong>
                    {playerNames.get(standing.playerId) ?? "Unknown player"}
                  </strong>
                  <span>{positionLabel(index, confirmed)}</span>
                </td>
                <td data-label="W–L">
                  {standing.wins}–{standing.losses}
                </td>
                <td data-label="For">{standing.pointsFor}</td>
                <td data-label="Against">{standing.pointsAgainst}</td>
                <td data-label="Diff">
                  {standing.differential > 0 ? "+" : ""}
                  {standing.differential}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="round-robin-standings__tie-break">
        Ties: wins, two-player head-to-head, point difference, points scored,
        then starting order.
      </p>
    </section>
  );
}

function positionLabel(index: number, confirmed: boolean): string {
  if (!confirmed) return "Provisional";
  if (index < 2) return "Final position";
  if (index < 4) return "Third-place position";
  return `${placeName(index + 1)} place confirmed`;
}

function placeName(rank: number): string {
  return rank === 5 ? "Fifth" : rank === 6 ? "Sixth" : `${rank}th`;
}
