import type { Match, TournamentBracket, TournamentResult } from "./types";

export type TournamentHighlightKind =
  "comeback" | "clean-sweep" | "upset" | "margin" | "champion-record";

export interface TournamentHighlight {
  kind: TournamentHighlightKind;
  label: string;
  value: string;
}

export function tournamentHighlights(
  bracket: TournamentBracket,
  result: TournamentResult,
): TournamentHighlight[] {
  const names = new Map(bracket.players.map(({ id, name }) => [id, name]));
  const completed = result.matchHistory.filter(isPlayedMatch);
  const highlights: TournamentHighlight[] = [];
  const comeback = maxBy(completed, (match) => match.comebackDeficit);
  if (comeback && comeback.comebackDeficit > 0) {
    highlights.push({
      kind: "comeback",
      label: "Biggest comeback",
      value: `${playerName(names, comeback.winnerId)} erased ${comeback.comebackDeficit}`,
    });
  }
  const sweep = maxBy(
    completed.filter((match) => Math.min(match.scoreA, match.scoreB) === 0),
    (match) => Math.max(match.scoreA, match.scoreB),
  );
  if (sweep) {
    highlights.push({
      kind: "clean-sweep",
      label: "Clean sweep",
      value: `${playerName(names, sweep.winnerId)} · ${sweep.scoreA}–${sweep.scoreB}`,
    });
  }
  const upset = maxBy(result.upsetWins, (item) => item.seedDifference);
  if (upset) {
    highlights.push({
      kind: "upset",
      label: "Biggest upset",
      value: `${playerName(names, upset.winnerId)} over ${playerName(names, upset.loserId)}`,
    });
  }
  const margin = maxBy(completed, (match) =>
    Math.abs(match.scoreA - match.scoreB),
  );
  if (margin) {
    highlights.push({
      kind: "margin",
      label: "Biggest win",
      value: `${playerName(names, margin.winnerId)} · ${Math.abs(margin.scoreA - margin.scoreB)} points`,
    });
  }
  if (highlights.length < 4) {
    const champion = result.standings.find(
      ({ playerId }) => playerId === result.championId,
    );
    if (champion) {
      highlights.push({
        kind: "champion-record",
        label: "Champion record",
        value: `${champion.wins} wins · ${champion.losses} losses`,
      });
    }
  }
  return highlights.slice(0, 4);
}

function isPlayedMatch(match: Match) {
  return (
    match.status === "complete" &&
    Boolean(match.sideA?.memberIds[0]) &&
    Boolean(match.sideB?.memberIds[0])
  );
}

function playerName(names: Map<string, string>, id: string | null) {
  return id ? (names.get(id) ?? "Player") : "Player";
}

function maxBy<T>(items: T[], value: (item: T) => number) {
  return items.reduce<T | undefined>(
    (best, item) => (!best || value(item) > value(best) ? item : best),
    undefined,
  );
}
