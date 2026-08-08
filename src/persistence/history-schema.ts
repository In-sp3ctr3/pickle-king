import { z } from "zod";
import {
  tournamentBracketSchema,
  tournamentBracketV1Schema,
} from "./tournament-schema";

const namesSchema = z.array(z.string().trim().min(1).max(40)).min(1).max(2);

const quickMatchRecordSchema = z.object({
  id: z.string().min(1),
  completedAt: z.number().finite(),
  format: z.enum(["singles", "doubles"]),
  participants: z.object({ sideA: namesSchema, sideB: namesSchema }),
  labels: z.object({
    sideA: z.string().trim().min(1).max(90),
    sideB: z.string().trim().min(1).max(90),
  }),
  score: z.object({
    sideA: z.number().int().nonnegative(),
    sideB: z.number().int().nonnegative(),
  }),
  winner: z.enum(["A", "B"]),
  targetScore: z.number().int().min(1).max(99),
  finishReason: z.enum([
    "target",
    "buzzer",
    "golden-point",
    "ended-early",
    "operator-selection",
  ]),
});

export const sessionHistoryV1Schema = z.object({
  version: z.literal(1),
  quickMatches: z.array(quickMatchRecordSchema).max(50),
  tournaments: z
    .array(
      z.object({
        id: z.string().min(1),
        completedAt: z.number().finite(),
        bracket: tournamentBracketV1Schema,
      }),
    )
    .max(10),
});

export const sessionHistoryV2Schema = z.object({
  version: z.literal(2),
  quickMatches: z.array(quickMatchRecordSchema).max(50),
  tournaments: z
    .array(
      z.object({
        id: z.string().min(1),
        completedAt: z.number().finite(),
        bracket: tournamentBracketSchema,
      }),
    )
    .max(10),
});
