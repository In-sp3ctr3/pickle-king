import type { Match, Player, TournamentBracket } from "@/src/tournament";

export function roundLabel(round: number, roundCount: number): string {
  if (round === roundCount) return "Finals";
  if (round === roundCount - 1) return "Semifinals";
  return `Round ${round}`;
}

export function matchSideLabel(
  memberIds: string[] | undefined,
  players: Player[],
): string {
  if (!memberIds?.length) return "TBD";
  const names = memberIds.map(
    (memberId) =>
      players.find((player) => player.id === memberId)?.name ??
      "Unknown player",
  );
  return names.join(" & ");
}

export function orderedRunOfShow(matches: Match[]): Match[] {
  const statusOrder: Record<Match["status"], number> = {
    live: 0,
    ready: 1,
    waiting: 2,
    complete: 3,
  };

  return matches
    .filter((match) => match.status !== "complete")
    .toSorted(
      (left, right) =>
        statusOrder[left.status] - statusOrder[right.status] ||
        left.round - right.round ||
        left.ordinal - right.ordinal,
    );
}

export function initialRound(bracket: TournamentBracket): number {
  const current = orderedRunOfShow(bracket.matches)[0];
  return current?.round ?? bracket.roundCount;
}
