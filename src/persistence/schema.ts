import { z } from "zod";
import {
  matchSideSchema,
  playerSchema,
  tournamentBracketSchema,
  tournamentBracketV1Schema,
} from "./tournament-schema";

const tournamentConfigV1Schema = z.object({
  drawStyle: z.enum(["ranked", "random"]).default("ranked"),
  timingMode: z.enum(["timed", "untimed"]).default("timed"),
  bookingMinutes: z.number().positive(),
  warmupMinutes: z.number().nonnegative(),
  transitionSeconds: z.number().nonnegative(),
  targetScore: z.number().int().min(1).max(99),
  randomSeed: z.string().min(1),
});

const tournamentConfigSchema = tournamentConfigV1Schema.extend({
  format: z.enum(["knockout", "round-robin-finals"]),
});

const scoringSchema = z.object({
  sideA: matchSideSchema,
  sideB: matchSideSchema,
  labelA: z.string().min(1).max(90),
  labelB: z.string().min(1).max(90),
  participantNames: z
    .object({
      sideA: z.array(z.string().trim().min(1).max(40)).min(1).max(2),
      sideB: z.array(z.string().trim().min(1).max(40)).min(1).max(2),
    })
    .optional(),
  stageLabel: z.string().trim().min(1).max(40).optional(),
  scoreA: z.number().int().nonnegative(),
  scoreB: z.number().int().nonnegative(),
  targetScore: z.number().int().min(1).max(99),
  durationMs: z.number().int().positive().nullable(),
  status: z.enum([
    "idle",
    "running",
    "paused",
    "golden-point",
    "editing-result",
    "awaiting-confirmation",
    "complete",
  ]),
  deadline: z.number().nullable(),
  pausedRemainingMs: z.number().nonnegative().nullable(),
  winner: z.enum(["A", "B"]).nullable(),
  finishReason: z
    .enum([
      "target",
      "buzzer",
      "golden-point",
      "ended-early",
      "operator-selection",
    ])
    .nullable(),
  scoreEvents: z.array(z.enum(["A", "B"])).default([]),
});

const screenSchema = z.enum([
  "home",
  "setup",
  "bracket",
  "live",
  "quick-setup",
  "quick-live",
  "results",
  "history",
  "history-results",
]);

const snapshotFields = {
  updatedAt: z.number().finite(),
  screen: screenSchema,
  activeMatchId: z.string().nullable(),
  scorer: scoringSchema.nullable(),
  sessionDeadline: z.number().nullable(),
  quickMatch: z.boolean(),
  historyTournamentId: z.string().nullable().default(null),
};

type SnapshotShape = {
  screen: z.infer<typeof screenSchema>;
  tournament: {
    matches: Array<{
      id: string;
      status: string;
      sideA: { memberIds: string[] } | null;
      sideB: { memberIds: string[] } | null;
    }>;
  } | null;
  activeMatchId: string | null;
  scorer: z.infer<typeof scoringSchema> | null;
  quickMatch: boolean;
};

function validateSnapshot(
  snapshot: SnapshotShape,
  issue: (message: string, path: PropertyKey[]) => void,
): void {
  if (
    ["bracket", "live", "results"].includes(snapshot.screen) &&
    !snapshot.tournament
  ) {
    issue("Tournament screen requires a tournament.", ["tournament"]);
  }
  if (snapshot.screen === "quick-live") {
    if (!snapshot.scorer) issue("Quick Match requires a scorer.", ["scorer"]);
    if (!snapshot.quickMatch)
      issue("Quick Match flag is required.", ["quickMatch"]);
  }
  if (snapshot.screen === "live") {
    if (!snapshot.scorer) issue("Live match requires a scorer.", ["scorer"]);
    if (!snapshot.activeMatchId)
      issue("Live match requires an active match.", ["activeMatchId"]);
    if (snapshot.quickMatch)
      issue("Tournament match cannot be Quick Match.", ["quickMatch"]);
    const active = snapshot.tournament?.matches.find(
      ({ id }) => id === snapshot.activeMatchId,
    );
    if (!active || active.status !== "live") {
      issue("Active tournament match must be live.", ["activeMatchId"]);
    } else if (
      snapshot.scorer &&
      (active.sideA?.memberIds.join("|") !==
        snapshot.scorer.sideA.memberIds.join("|") ||
        active.sideB?.memberIds.join("|") !==
          snapshot.scorer.sideB.memberIds.join("|"))
    ) {
      issue("Scorer sides must match the active match.", ["scorer"]);
    }
  }
  if (snapshot.scorer?.durationMs === null) {
    if (
      snapshot.scorer.deadline !== null ||
      snapshot.scorer.pausedRemainingMs !== null
    ) {
      issue("Untimed scorer cannot store timer state.", ["scorer"]);
    }
  } else if (
    snapshot.scorer?.status === "running" &&
    snapshot.scorer.deadline === null
  ) {
    issue("Running timed scorer requires a deadline.", ["scorer", "deadline"]);
  }
}

export const snapshotV1Schema = z
  .object({
    ...snapshotFields,
    version: z.literal(1),
    setupDraft: z
      .object({
        players: z.array(playerSchema).max(16),
        config: tournamentConfigV1Schema,
      })
      .nullable(),
    tournament: tournamentBracketV1Schema.nullable(),
  })
  .superRefine((snapshot, context) =>
    validateSnapshot(snapshot, (message, path) =>
      context.addIssue({ code: "custom", message, path }),
    ),
  );

export const snapshotV2Schema = z
  .object({
    ...snapshotFields,
    version: z.literal(2),
    setupDraft: z
      .object({
        players: z.array(playerSchema).max(16),
        config: tournamentConfigSchema,
      })
      .nullable(),
    tournament: tournamentBracketSchema.nullable(),
  })
  .superRefine((snapshot, context) => {
    const issue = (message: string, path: PropertyKey[]) =>
      context.addIssue({ code: "custom", message, path });
    validateSnapshot(snapshot, issue);
    if (
      snapshot.setupDraft &&
      snapshot.tournament &&
      snapshot.setupDraft.config.format !== snapshot.tournament.format
    ) {
      issue("Setup and tournament formats must agree.", [
        "setupDraft",
        "config",
      ]);
    }
  });

export type TournamentSnapshotV2 = z.infer<typeof snapshotV2Schema>;
/** @deprecated Use TournamentSnapshotV2. */
export type TournamentSnapshotV1 = TournamentSnapshotV2;
