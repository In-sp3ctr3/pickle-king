import { z } from "zod";
import { SKILL_LEVELS } from "../tournament";

export const matchSideSchema = z.object({
  memberIds: z.array(z.string().min(1)).min(1).max(2),
});

export const playerSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(40),
  rating: z.enum(SKILL_LEVELS),
  seed: z.number().int().positive().optional(),
});

const legacySourceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("player"), playerId: z.string().min(1) }),
  z.object({ type: z.literal("winner"), matchId: z.string().min(1) }),
  z.object({ type: z.literal("loser"), matchId: z.string().min(1) }),
]);

const standingSourceSchema = z.object({
  type: z.literal("standing"),
  rank: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

const sourceSchema = z.discriminatedUnion("type", [
  ...legacySourceSchema.options,
  standingSourceSchema,
]);

const matchFields = {
  id: z.string().min(1),
  round: z.number().int().positive(),
  ordinal: z.number().int().nonnegative(),
  sideA: matchSideSchema.nullable(),
  sideB: matchSideSchema.nullable(),
  config: z.object({
    targetScore: z.number().int().min(1).max(99),
    capMs: z.number().int().positive().nullable(),
  }),
  scoreA: z.number().int().nonnegative(),
  scoreB: z.number().int().nonnegative(),
  status: z.enum(["waiting", "ready", "live", "complete"]),
  winnerId: z.string().nullable(),
  loserId: z.string().nullable(),
  startedAt: z.number().nullable(),
  completedAt: z.number().nullable(),
  comebackDeficit: z.number().int().nonnegative().default(0),
};

const legacyMatchSchema = z.object({
  ...matchFields,
  kind: z.enum(["elimination", "bronze", "challenge"]),
  sourceA: legacySourceSchema,
  sourceB: legacySourceSchema,
});

const matchSchema = z.object({
  ...matchFields,
  kind: z.enum(["elimination", "bronze", "challenge", "round-robin"]),
  sourceA: sourceSchema,
  sourceB: sourceSchema,
});

const lateEntryTimingSchema = z.object({
  currentCapMs: z.number().int().positive().nullable(),
  proposedCapMs: z.number().int().positive().nullable(),
  feasible: z.boolean(),
  remainingMatches: z.number().int().positive(),
  sessionDeadline: z.number().nullable(),
});

const amendmentFields = {
  id: z.string().min(1),
  createdAt: z.number().finite(),
  method: z.enum([
    "reversible-bye",
    "untouched-preliminary",
    "branch-gauntlet",
  ]),
  playerId: z.string().min(1),
  protectedPlayerId: z.string().min(1),
  restoredPlayerIds: z.array(z.string().min(1)),
  lineageMatchIds: z.array(z.string().min(1)),
  targetMatchId: z.string().min(1),
  targetSlot: z.enum(["A", "B"]),
  bronzeSlot: z.enum(["A", "B"]).nullable(),
  timing: lateEntryTimingSchema,
  challengeMatchIds: z.array(z.string().min(1)).min(1),
  declinedPlayerIds: z.array(z.string().min(1)),
};

const legacyLateEntryAmendmentSchema = z.object({
  ...amendmentFields,
  originalTargetSource: legacySourceSchema,
  originalBronzeSource: legacySourceSchema.nullable(),
});

const lateEntryAmendmentSchema = z.object({
  ...amendmentFields,
  originalTargetSource: sourceSchema,
  originalBronzeSource: sourceSchema.nullable(),
});

const bracketFields = {
  bracketSize: z.number().int().positive(),
  roundCount: z.number().int().positive(),
  players: z.array(playerSchema).min(4).max(16),
  finalMatchId: z.string().min(1),
  bronzeMatchId: z.string().min(1),
};

export const tournamentBracketV1Schema = z.object({
  ...bracketFields,
  matches: z.array(legacyMatchSchema),
  amendments: z.array(legacyLateEntryAmendmentSchema).max(1).default([]),
});

function isStandingSource(source: { type: string }): boolean {
  return source.type === "standing";
}

function validateRoundRobin(
  bracket: z.infer<typeof tournamentBracketBaseSchema>,
  issue: (message: string, path?: PropertyKey[]) => void,
): void {
  const playerCount = bracket.players.length;
  const preliminaryRounds = playerCount === 4 ? 3 : 5;
  const preliminaryCount = (playerCount * (playerCount - 1)) / 2;
  const placementRound = preliminaryRounds + 1;
  const preliminary = bracket.matches.filter(
    ({ kind }) => kind === "round-robin",
  );
  const bronze = bracket.matches.find(({ id }) => id === bracket.bronzeMatchId);
  const final = bracket.matches.find(({ id }) => id === bracket.finalMatchId);
  if (
    playerCount < 4 ||
    playerCount > 6 ||
    new Set(bracket.players.map(({ id }) => id)).size !== playerCount
  ) {
    issue("Round robin requires four to six unique players.", ["players"]);
  }
  if (
    bracket.bracketSize !== playerCount ||
    bracket.roundCount !== placementRound
  ) {
    issue("Round-robin bracket metadata must match its field and rounds.");
  }
  if (bracket.matches.length !== preliminaryCount + 2) {
    issue("Round-robin match count must cover every pairing and placement.", [
      "matches",
    ]);
  }
  if (
    preliminary.length !== preliminaryCount ||
    bronze?.kind !== "bronze" ||
    bronze.round !== placementRound ||
    final?.kind !== "elimination" ||
    final.round !== placementRound
  ) {
    issue("Round robin requires every preliminary, bronze, and final.", [
      "matches",
    ]);
  }
  if (bracket.amendments.length) {
    issue("Round robin cannot contain late-entry amendments.", ["amendments"]);
  }
  const playerIds = new Set(bracket.players.map(({ id }) => id));
  const pairings = new Set<string>();
  const appearances = new Map<string, number>(
    bracket.players.map(({ id }) => [id, 0] as const),
  );
  for (const match of preliminary) {
    if (match.sourceA.type !== "player" || match.sourceB.type !== "player") {
      issue("Round-robin preliminaries require direct player sources.", [
        "matches",
      ]);
      continue;
    }
    const ids = [match.sourceA.playerId, match.sourceB.playerId];
    if (!ids.every((id) => playerIds.has(id)) || ids[0] === ids[1]) {
      issue("Round-robin pairings must use two tournament players.", [
        "matches",
      ]);
    }
    pairings.add(ids.sort().join("|"));
    for (const id of ids) {
      if (appearances.has(id)) appearances.set(id, appearances.get(id)! + 1);
    }
  }
  if (
    pairings.size !== preliminaryCount ||
    [...appearances.values()].some((count) => count !== playerCount - 1)
  ) {
    issue("Round robin must contain every unique player pairing once.", [
      "matches",
    ]);
  }
  for (let round = 1; round <= preliminaryRounds; round += 1) {
    const matches = preliminary.filter((match) => match.round === round);
    const roundPlayers = matches.flatMap((match) =>
      [match.sourceA, match.sourceB].flatMap((source) =>
        source.type === "player" ? [source.playerId] : [],
      ),
    );
    if (
      matches.length !== Math.floor(playerCount / 2) ||
      new Set(roundPlayers).size !== roundPlayers.length
    ) {
      issue("Each preliminary round must schedule each player at most once.", [
        "matches",
      ]);
    }
  }
  if (preliminary.some(({ round }) => round < 1 || round > preliminaryRounds)) {
    issue("Preliminary matches must use the expected round range.", [
      "matches",
    ]);
  }
  if (
    bronze?.sourceA.type !== "standing" ||
    bronze.sourceA.rank !== 3 ||
    bronze.sourceB.type !== "standing" ||
    bronze.sourceB.rank !== 4 ||
    final?.sourceA.type !== "standing" ||
    final.sourceA.rank !== 1 ||
    final.sourceB.type !== "standing" ||
    final.sourceB.rank !== 2
  ) {
    issue("Placement matches require standings ranks 3/4 and 1/2.", [
      "matches",
    ]);
  }
}

const tournamentBracketBaseSchema = z.object({
  ...bracketFields,
  format: z.enum(["knockout", "round-robin-finals"]),
  matches: z.array(matchSchema),
  amendments: z.array(lateEntryAmendmentSchema).max(1).default([]),
});

export const tournamentBracketSchema = tournamentBracketBaseSchema.superRefine(
  (bracket, context) => {
    const issue = (message: string, path: PropertyKey[] = []) =>
      context.addIssue({ code: "custom", message, path });
    if (
      new Set(bracket.matches.map(({ id }) => id)).size !==
      bracket.matches.length
    ) {
      issue("Tournament match ids must be unique.", ["matches"]);
    }
    if (bracket.format === "round-robin-finals") {
      validateRoundRobin(bracket, issue);
      return;
    }
    const matchHasStanding = bracket.matches.some(
      ({ sourceA, sourceB }) =>
        isStandingSource(sourceA) || isStandingSource(sourceB),
    );
    const amendmentHasStanding = bracket.amendments.some(
      ({ originalTargetSource, originalBronzeSource }) =>
        isStandingSource(originalTargetSource) ||
        (originalBronzeSource !== null &&
          isStandingSource(originalBronzeSource)),
    );
    if (
      bracket.matches.some(({ kind }) => kind === "round-robin") ||
      matchHasStanding ||
      amendmentHasStanding
    ) {
      issue("Knockout tournaments cannot contain round-robin data.", [
        "matches",
      ]);
    }
  },
);
