import type {
  LateEntryAmendment,
  MatchSource,
  TournamentBracket,
  TournamentConfig,
  TournamentFormat,
} from "../tournament";

const player = (index: number) => ({
  id: `p${index}`,
  name: `Player ${index}`,
  rating: "3.5" as const,
  seed: index,
});

const match = (
  id: string,
  kind: "round-robin" | "bronze" | "elimination",
  round: number,
  sourceA: MatchSource,
  sourceB: MatchSource,
) => ({
  id,
  kind,
  round,
  ordinal: Number(id.match(/\d+$/)?.[0] ?? 0),
  sourceA,
  sourceB,
  sideA: null,
  sideB: null,
  config: { targetScore: 11, capMs: 300_000 },
  scoreA: 0,
  scoreB: 0,
  status: "waiting" as const,
  winnerId: null,
  loserId: null,
  startedAt: null,
  completedAt: null,
  comebackDeficit: 0,
});

export function roundRobinTournamentFixture(): TournamentBracket {
  const playerSource = (playerId: string): MatchSource => ({
    type: "player",
    playerId,
  });
  const standingSource = (rank: 1 | 2 | 3 | 4): MatchSource => ({
    type: "standing",
    rank,
  });
  return {
    format: "round-robin-finals" as const,
    bracketSize: 4,
    roundCount: 4,
    players: [1, 2, 3, 4].map(player),
    matches: [
      match(
        "rr-r1-m1",
        "round-robin",
        1,
        playerSource("p1"),
        playerSource("p4"),
      ),
      match(
        "rr-r1-m2",
        "round-robin",
        1,
        playerSource("p2"),
        playerSource("p3"),
      ),
      match(
        "rr-r2-m1",
        "round-robin",
        2,
        playerSource("p1"),
        playerSource("p3"),
      ),
      match(
        "rr-r2-m2",
        "round-robin",
        2,
        playerSource("p4"),
        playerSource("p2"),
      ),
      match(
        "rr-r3-m1",
        "round-robin",
        3,
        playerSource("p1"),
        playerSource("p2"),
      ),
      match(
        "rr-r3-m2",
        "round-robin",
        3,
        playerSource("p3"),
        playerSource("p4"),
      ),
      match("bronze", "bronze", 4, standingSource(3), standingSource(4)),
      match("final", "elimination", 4, standingSource(1), standingSource(2)),
    ],
    finalMatchId: "final",
    bronzeMatchId: "bronze",
    amendments: [],
  };
}

export function setupConfigFixture(
  format: TournamentFormat = "round-robin-finals",
): TournamentConfig {
  return {
    format,
    drawStyle: "ranked",
    timingMode: "timed",
    bookingMinutes: 120,
    warmupMinutes: 10,
    transitionSeconds: 60,
    targetScore: 11,
    randomSeed: "persist",
  };
}

export function lateEntryAmendmentFixture(): LateEntryAmendment {
  return {
    id: "amendment-1",
    createdAt: 1_000,
    method: "reversible-bye" as const,
    playerId: "p4",
    protectedPlayerId: "p1",
    restoredPlayerIds: [],
    lineageMatchIds: ["rr-r1-m1"],
    targetMatchId: "final",
    targetSlot: "A" as const,
    originalTargetSource: { type: "player" as const, playerId: "p1" },
    bronzeSlot: null,
    originalBronzeSource: null,
    timing: {
      currentCapMs: 300_000,
      proposedCapMs: 240_000,
      feasible: true,
      remainingMatches: 1,
      sessionDeadline: 8_000_000,
    },
    challengeMatchIds: ["challenge-1"],
    declinedPlayerIds: [],
  };
}

export function roundRobinSnapshotFixture() {
  const tournament = roundRobinTournamentFixture();
  return {
    version: 2 as const,
    updatedAt: 1_000,
    screen: "bracket" as const,
    setupDraft: {
      players: tournament.players,
      config: setupConfigFixture(),
    },
    tournament,
    activeMatchId: null,
    scorer: null,
    sessionDeadline: 8_000_000,
    quickMatch: false,
    historyTournamentId: null,
  };
}
