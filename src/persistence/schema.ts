import { z } from "zod";
import { SKILL_LEVELS } from "../tournament";

const matchSideSchema = z.object({
  memberIds: z.array(z.string().min(1)).min(1).max(2),
});
const playerSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(40),
  rating: z.enum(SKILL_LEVELS),
  seed: z.number().int().positive().optional(),
});
const sourceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("player"), playerId: z.string().min(1) }),
  z.object({ type: z.literal("winner"), matchId: z.string().min(1) }),
  z.object({ type: z.literal("loser"), matchId: z.string().min(1) }),
]);
const matchSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["elimination", "bronze"]),
  round: z.number().int().positive(),
  ordinal: z.number().int().nonnegative(),
  sourceA: sourceSchema,
  sourceB: sourceSchema,
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
});
export const tournamentBracketSchema = z.object({
  bracketSize: z.number().int().positive(),
  roundCount: z.number().int().positive(),
  players: z.array(playerSchema).min(4).max(16),
  matches: z.array(matchSchema),
  finalMatchId: z.string().min(1),
  bronzeMatchId: z.string().min(1),
});
const tournamentConfigSchema = z.object({
  timingMode: z.enum(["timed", "untimed"]).default("timed"),
  bookingMinutes: z.number().positive(),
  warmupMinutes: z.number().nonnegative(),
  transitionSeconds: z.number().nonnegative(),
  targetScore: z.number().int().min(1).max(99),
  randomSeed: z.string().min(1),
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
});

export const snapshotV1Schema = z
  .object({
    version: z.literal(1),
    updatedAt: z.number().finite(),
    screen: z.enum([
      "home",
      "setup",
      "bracket",
      "live",
      "quick-setup",
      "quick-live",
      "results",
      "history",
    ]),
    setupDraft: z
      .object({
        players: z.array(playerSchema).max(16),
        config: tournamentConfigSchema,
      })
      .nullable(),
    tournament: tournamentBracketSchema.nullable(),
    activeMatchId: z.string().nullable(),
    scorer: scoringSchema.nullable(),
    sessionDeadline: z.number().nullable(),
    quickMatch: z.boolean(),
  })
  .superRefine((snapshot, context) => {
    const issue = (message: string, path: string[]) =>
      context.addIssue({ code: "custom", message, path });
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
      issue("Running timed scorer requires a deadline.", [
        "scorer",
        "deadline",
      ]);
    }
  });

export type TournamentSnapshotV1 = z.infer<typeof snapshotV1Schema>;
