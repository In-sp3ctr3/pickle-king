import { defineTable } from "convex/server";
import { v } from "convex/values";
import {
  correction,
  discipline,
  eventRole,
  game,
  matchSource,
  matchWeight,
  outcome,
  rallySnapshot,
  scoring,
  signature,
} from "./schema_values";

export const matchTables = {
  matches: defineTable({
    divisionId: v.optional(v.id("divisions")),
    poolId: v.optional(v.id("pools")),
    lobbyId: v.optional(v.id("lobbies")),
    kind: v.union(
      v.literal("winners"),
      v.literal("consolation"),
      v.literal("bronze"),
      v.literal("gold"),
      v.literal("gold-tiebreaker"),
      v.literal("pool"),
      v.literal("round-robin"),
      v.literal("challenge"),
      v.literal("lobby"),
    ),
    round: v.number(),
    ordinal: v.number(),
    sourceA: matchSource,
    sourceB: matchSource,
    teamAId: v.optional(v.id("teams")),
    teamBId: v.optional(v.id("teams")),
    court: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("ready"),
      v.literal("live"),
      v.literal("complete"),
      v.literal("void"),
    ),
    scoring,
    games: v.array(game),
    winnerTeamId: v.optional(v.id("teams")),
    outcome: v.optional(outcome),
    result: v.optional(
      v.union(
        v.literal("recorded"),
        v.literal("signed"),
        v.literal("final"),
        v.literal("disputed"),
      ),
    ),
    signatures: v.array(signature),
    corrections: v.array(correction),
    resolution: v.optional(
      v.object({
        byUserId: v.id("users"),
        reason: v.string(),
        at: v.number(),
      }),
    ),
    // One ready-match claim; revision invalidates stale submissions (T1-T4, T10).
    scorerClaim: v.optional(
      v.object({
        userId: v.id("users"),
        claimedAt: v.number(),
        expiresAt: v.number(),
        revision: v.number(),
      }),
    ),
    submittedByUserId: v.optional(v.id("users")),
    finalAt: v.optional(v.number()),
    weight: matchWeight,
  })
    .index("by_divisionId", ["divisionId"])
    .index("by_poolId", ["poolId"])
    .index("by_lobbyId", ["lobbyId"])
    .index("by_result", ["result"])
    .index("by_finalAt", ["finalAt"]),
  rallyLogs: defineTable({
    matchId: v.id("matches"),
    chunk: v.number(),
    snapshots: v.array(rallySnapshot), // T26
  }).index("by_matchId_chunk", ["matchId", "chunk"]),
  liveScores: defineTable({
    matchId: v.id("matches"),
    a: v.number(),
    b: v.number(),
    updatedAt: v.number(), // T27
  }).index("by_matchId", ["matchId"]),
  eventRoles: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    role: eventRole, // I11
  })
    .index("by_eventId_userId", ["eventId", "userId"])
    .index("by_userId", ["userId"]),
  lobbies: defineTable({
    orgId: v.id("orgs"),
    hostUserId: v.id("users"),
    name: v.string(),
    joinCodeDigest: v.string(),
    discipline,
    scoring,
    status: v.union(v.literal("open"), v.literal("closed")),
  })
    .index("by_orgId", ["orgId"])
    .index("by_joinCodeDigest", ["joinCodeDigest"]),
};
