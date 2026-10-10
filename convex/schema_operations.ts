import { defineTable } from "convex/server";
import { v } from "convex/values";

const inviteState = {
  tokenDigest: v.string(), // Scoped digest only; raw bearer values are never persisted.
  issuedByUserId: v.id("users"),
  expiresAt: v.number(),
  revokedAt: v.optional(v.number()),
  usedAt: v.optional(v.number()),
};

export const operationTables = {
  invites: defineTable(
    v.union(
      v.object({
        ...inviteState,
        kind: v.literal("claim"),
        targetPlayerId: v.id("players"),
        claimantUserId: v.optional(v.id("users")),
        confirmedAt: v.optional(v.number()), // I1
      }),
      v.object({
        ...inviteState,
        kind: v.literal("team"),
        targetTeamId: v.id("teams"),
        role: v.literal("player"),
      }),
      v.object({
        ...inviteState,
        kind: v.literal("scorer"),
        targetEventId: v.id("events"),
        role: v.literal("scorer"),
      }),
      v.object({
        ...inviteState,
        kind: v.literal("org"),
        targetOrgId: v.id("orgs"),
        role: v.union(
          v.literal("admin"),
          v.literal("director"),
          v.literal("scorer"),
          v.literal("member"),
        ), // I4: owner is transfer-only.
      }),
    ),
  ).index("by_tokenDigest", ["tokenDigest"]),
  duprOutbox: defineTable({
    matchId: v.id("matches"),
    idempotencyKey: v.string(), // T25
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("ineligible"),
      v.literal("correction-needed"),
    ),
    attempts: v.number(),
    notBefore: v.number(),
    lastError: v.optional(v.string()),
    purgeAfter: v.number(), // T24
  }).index("by_status_notBefore", ["status", "notBefore"]),
  auditLog: defineTable({
    actorUserId: v.id("users"),
    action: v.string(),
    targetTable: v.string(),
    targetId: v.string(),
    diff: v.any(),
    at: v.number(),
  }).index("by_target", ["targetTable", "targetId"]),
};
