import { defineTable } from "convex/server";
import { v } from "convex/values";
import {
  ageBracket,
  discipline,
  matchWeight,
  orgRole,
  ratingSnapshot,
  skillLevel,
} from "./schema_values";

export const identityTables = {
  users: defineTable({
    // Active rows require all three identity fields; deletion scrubs them (D11, I8).
    clerkId: v.optional(v.string()),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
    createdAt: v.number(),
    consentAt: v.number(),
    ageGateOk: v.literal(true),
    leaderboardOptIn: v.boolean(),
    skillSelf: skillLevel,
    skillLockedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  }).index("by_clerkId", ["clerkId"]),
  orgs: defineTable({
    kind: v.union(v.literal("personal"), v.literal("club")),
    name: v.string(),
    ownerUserId: v.id("users"),
    duprClubId: v.optional(v.string()),
    archivedAt: v.optional(v.number()),
  }).index("by_ownerUserId", ["ownerUserId"]),
  orgMembers: defineTable({
    orgId: v.id("orgs"),
    userId: v.id("users"),
    role: orgRole,
    since: v.number(), // I9
  })
    .index("by_orgId_userId", ["orgId", "userId"])
    .index("by_userId", ["userId"]),
  players: defineTable({
    orgId: v.id("orgs"),
    userId: v.optional(v.id("users")), // I7
    displayName: v.string(),
    handle: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    ageBracket: v.optional(ageBracket),
    skillSelf: v.optional(skillLevel), // I6
    duprId: v.optional(v.string()),
    claimEmail: v.optional(v.string()),
    claimPhone: v.optional(v.string()),
    claimedAt: v.optional(v.number()),
    unclaimNoticeUntil: v.optional(v.number()),
    lastMatchAt: v.optional(v.number()),
  })
    .index("by_orgId", ["orgId"])
    .index("by_userId", ["userId"]),
  ratings: defineTable({
    subjectId: v.union(v.id("users"), v.id("players")), // T15
    discipline,
    rating: v.number(),
    deviation: v.number(),
    volatility: v.number(),
    ratedMatches: v.number(),
    updatedAt: v.number(),
  }).index("by_subjectId_discipline", ["subjectId", "discipline"]),
  ratingEvents: defineTable({
    playerId: v.id("players"),
    matchId: v.id("matches"),
    discipline,
    before: ratingSnapshot,
    after: ratingSnapshot,
    weight: matchWeight,
    at: v.number(),
  })
    .index("by_playerId", ["playerId"])
    .index("by_at", ["at"]),
};
