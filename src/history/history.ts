import type { ScoringState } from "../match/types";
import type { TournamentBracket } from "../tournament";
import type {
  QuickMatchRecord,
  SessionHistoryV2,
  TournamentArchive,
} from "./types";

export const QUICK_HISTORY_LIMIT = 50;
export const TOURNAMENT_HISTORY_LIMIT = 10;

export function emptySessionHistory(): SessionHistoryV2 {
  return { version: 2, quickMatches: [], tournaments: [] };
}

function recordFirst<T extends { id: string }>(
  records: T[],
  record: T,
  limit: number,
): T[] {
  if (records.some(({ id }) => id === record.id)) return records;
  return [record, ...records].slice(0, limit);
}

export function quickMatchRecord(
  scorer: ScoringState,
  completedAt: number,
): QuickMatchRecord {
  if (
    scorer.status !== "complete" ||
    !scorer.winner ||
    !scorer.finishReason ||
    !Number.isFinite(completedAt)
  ) {
    throw new Error("Only a completed Quick Match can be recorded.");
  }
  const participants = scorer.participantNames ?? {
    sideA: [scorer.labelA],
    sideB: [scorer.labelB],
  };
  return {
    id: `quick-${completedAt}-${scorer.sideA.memberIds.join("+")}-${scorer.sideB.memberIds.join("+")}`,
    completedAt,
    format:
      participants.sideA.length === 2 || participants.sideB.length === 2
        ? "doubles"
        : "singles",
    participants,
    labels: { sideA: scorer.labelA, sideB: scorer.labelB },
    score: { sideA: scorer.scoreA, sideB: scorer.scoreB },
    winner: scorer.winner,
    targetScore: scorer.targetScore,
    finishReason: scorer.finishReason,
  };
}

export function recordQuickMatch(
  history: SessionHistoryV2,
  record: QuickMatchRecord,
): SessionHistoryV2 {
  const quickMatches = recordFirst(
    history.quickMatches,
    record,
    QUICK_HISTORY_LIMIT,
  );
  return quickMatches === history.quickMatches
    ? history
    : { ...history, quickMatches };
}

export function tournamentArchive(
  bracket: TournamentBracket,
  completedAt: number,
): TournamentArchive {
  if (
    !Number.isFinite(completedAt) ||
    bracket.matches.some(({ status }) => status !== "complete")
  ) {
    throw new Error("Only a completed tournament can be archived.");
  }
  const final = bracket.matches.find(({ id }) => id === bracket.finalMatchId);
  return {
    id: `tournament-${final?.completedAt ?? completedAt}-${bracket.players
      .map(({ id }) => id)
      .join("+")}`,
    completedAt,
    bracket,
  };
}

export function recordTournament(
  history: SessionHistoryV2,
  archive: TournamentArchive,
): SessionHistoryV2 {
  const tournaments = recordFirst(
    history.tournaments,
    archive,
    TOURNAMENT_HISTORY_LIMIT,
  );
  return tournaments === history.tournaments
    ? history
    : { ...history, tournaments };
}

export function rememberedPlayerNames(
  history: SessionHistoryV2,
  currentNames: string[] = [],
): string[] {
  const ordered = [
    ...currentNames,
    ...history.quickMatches.flatMap(({ participants }) => [
      ...participants.sideA,
      ...participants.sideB,
    ]),
    ...history.tournaments.flatMap(({ bracket }) =>
      bracket.players.map(({ name }) => name),
    ),
  ];
  const seen = new Set<string>();
  return ordered.filter((name) => {
    const normalized = name.trim().toLocaleLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function archiveMatches(
  archive: TournamentArchive,
  bracket: TournamentBracket,
): boolean {
  const archivedFinal = archive.bracket.matches.find(
    ({ id }) => id === archive.bracket.finalMatchId,
  );
  const currentFinal = bracket.matches.find(
    ({ id }) => id === bracket.finalMatchId,
  );
  return (
    archivedFinal?.completedAt !== null &&
    archivedFinal?.completedAt === currentFinal?.completedAt &&
    archive.bracket.players.map(({ id }) => id).join("|") ===
      bracket.players.map(({ id }) => id).join("|")
  );
}

export function syncTournamentArchive(
  history: SessionHistoryV2,
  before: TournamentBracket,
  after: TournamentBracket | null,
): SessionHistoryV2 {
  const index = history.tournaments.findIndex((archive) =>
    archiveMatches(archive, before),
  );
  if (index < 0) return history;
  if (!after || after.matches.some(({ status }) => status !== "complete")) {
    return {
      ...history,
      tournaments: history.tournaments.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    };
  }
  return {
    ...history,
    tournaments: history.tournaments.map((archive, itemIndex) =>
      itemIndex === index ? { ...archive, bracket: after } : archive,
    ),
  };
}
