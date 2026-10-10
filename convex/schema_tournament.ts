import { defineTable } from "convex/server";
import { v } from "convex/values";
import { ageBracket, discipline, scoring } from "./schema_values";

export const tournamentTables = {
  events: defineTable({
    orgId: v.id("orgs"),
    createdByUserId: v.id("users"),
    name: v.string(),
    venue: v.optional(v.string()),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
    courtCount: v.number(),
    joinCodeDigest: v.string(),
    joinCodeExpiresAt: v.number(),
    visibility: v.union(
      v.literal("private"),
      v.literal("code"),
      v.literal("public"),
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("open"),
      v.literal("live"),
      v.literal("complete"),
      v.literal("cancelled"),
    ),
  })
    .index("by_orgId", ["orgId"])
    .index("by_joinCodeDigest", ["joinCodeDigest"]),
  divisions: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    discipline,
    format: v.union(
      v.literal("single-elimination"),
      v.literal("single-elimination-consolation"),
      v.literal("double-elimination"),
      v.literal("round-robin"),
      v.literal("pool-play-bracket"),
      v.literal("round-robin-bracket"),
      v.literal("king-of-the-court"),
      v.literal("ladder"),
      v.literal("rotating-partner-round-robin"),
    ),
    scoring,
    eligibility: v.object({
      gender: v.optional(
        v.union(
          v.literal("men"),
          v.literal("women"),
          v.literal("mixed"),
          v.literal("open"),
        ),
      ),
      minAge: v.optional(ageBracket),
      minRating: v.optional(v.number()),
      maxRating: v.optional(v.number()),
      maxCombinedRating: v.optional(v.number()),
      ratingSource: v.union(
        v.literal("self"),
        v.literal("pickle-king"),
        v.literal("dupr"),
      ),
      allowProvisional: v.boolean(), // T21
    }),
    poolPlay: v.optional(
      v.object({
        poolSize: v.number(),
        advancePerPool: v.number(),
        playoff: v.union(
          v.literal("single-elimination"),
          v.literal("double-elimination"),
        ),
      }),
    ),
    teamCap: v.number(),
    minRestMs: v.number(),
    status: v.union(
      v.literal("registration"),
      v.literal("locked"),
      v.literal("in-progress"),
      v.literal("complete"),
    ),
  }).index("by_eventId", ["eventId"]),
  teams: defineTable({
    divisionId: v.id("divisions"),
    // Convex has no tuple validator; future mutations enforce one/two players (I5).
    playerIds: v.array(v.id("players")),
    seed: v.optional(v.number()),
    checkedIn: v.boolean(),
    registeredByUserId: v.id("users"),
    eligibilityOverrideBy: v.optional(v.id("users")),
  }).index("by_divisionId", ["divisionId"]),
  pools: defineTable({
    divisionId: v.id("divisions"),
    name: v.string(),
    teamIds: v.array(v.id("teams")),
  }).index("by_divisionId", ["divisionId"]),
};
