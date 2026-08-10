import type {
  LateEntryAmendment,
  TournamentBracket,
  TournamentConfig,
  TournamentFormat,
} from "../tournament";
import { createRoundRobinTournament, startMatch } from "../tournament";
import { createScoringState } from "../match/scoring";

const player = (index: number) => ({
  id: `p${index}`,
  name: `Player ${index}`,
  rating: "3.5" as const,
  seed: index,
});

export function roundRobinTournamentFixture(size = 4): TournamentBracket {
  return createRoundRobinTournament(
    Array.from({ length: size }, (_, index) => player(index + 1)),
    setupConfigFixture(),
  );
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

export function liveRoundRobinSnapshotFixture(size: 5 | 6) {
  const setupConfig = setupConfigFixture();
  const created = roundRobinTournamentFixture(size);
  const players = created.players;
  const ready = created.matches.find(({ status }) => status === "ready")!;
  const tournament = startMatch(created, ready.id, 1_000);
  const current = tournament.matches.find(({ id }) => id === ready.id)!;
  return {
    version: 2 as const,
    updatedAt: 1_000,
    screen: "live" as const,
    setupDraft: { players, config: setupConfig },
    tournament,
    activeMatchId: current.id,
    scorer: createScoringState({
      sideA: current.sideA!,
      sideB: current.sideB!,
      labelA: current.sideA!.memberIds[0],
      labelB: current.sideB!.memberIds[0],
      targetScore: current.config.targetScore,
      durationMs: current.config.capMs,
    }),
    sessionDeadline: 8_000_000,
    quickMatch: false,
    historyTournamentId: null,
  };
}
