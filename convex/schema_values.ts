import { v } from "convex/values";

// Shared value domains keep persisted literals aligned across table modules.

export const skillLevel = v.union(
  v.literal("2.5"),
  v.literal("3.0"),
  v.literal("3.5"),
  v.literal("4.0"),
  v.literal("4.5"),
  v.literal("5.0"),
  v.literal("5.5+"),
);
export const discipline = v.union(v.literal("singles"), v.literal("doubles"));
export const matchWeight = v.union(
  v.literal("tournament"),
  v.literal("league"),
  v.literal("casual"),
  v.literal("conflicted"),
);
export const orgRole = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("director"),
  v.literal("scorer"),
  v.literal("member"),
);
export const eventRole = v.union(
  v.literal("director"),
  v.literal("scorer"),
  v.literal("player"),
);
export const ageBracket = v.union(
  v.literal("19+"),
  v.literal("35+"),
  v.literal("50+"),
  v.literal("60+"),
  v.literal("65+"),
  v.literal("70+"),
);
export const scoring = v.object({
  gamesToWin: v.union(v.literal(1), v.literal(2), v.literal(3)),
  pointsPerGame: v.union(
    v.literal(7),
    v.literal(11),
    v.literal(15),
    v.literal(21),
  ),
  winBy: v.union(v.literal(1), v.literal(2)),
  scoringSystem: v.union(v.literal("side-out"), v.literal("rally")),
  timeCapMs: v.union(v.number(), v.null()),
});
export const ratingSnapshot = v.object({
  rating: v.number(),
  deviation: v.number(),
  volatility: v.number(),
});
export const matchSource = v.union(
  v.object({ type: v.literal("team"), teamId: v.id("teams") }),
  v.object({ type: v.literal("winner"), matchId: v.id("matches") }),
  v.object({ type: v.literal("loser"), matchId: v.id("matches") }),
  v.object({
    type: v.literal("pool-standing"),
    poolId: v.id("pools"),
    rank: v.number(),
  }),
  v.object({ type: v.literal("standing"), rank: v.number() }),
);
export const game = v.object({ a: v.number(), b: v.number() });
export const outcome = v.union(
  v.literal("played"),
  v.literal("forfeit"),
  v.literal("retired"),
  v.literal("withdrawn"),
);
export const signature = v.object({
  side: v.union(v.literal("A"), v.literal("B")),
  userId: v.id("users"),
  kind: v.union(
    v.literal("submit"),
    v.literal("tap"),
    v.literal("staff-override"),
    v.literal("conflicted"),
  ),
  at: v.number(),
});
const previousResult = v.object({
  games: v.array(game),
  winnerTeamId: v.optional(v.id("teams")),
  outcome: v.optional(outcome),
});
export const correction = v.object({
  byUserId: v.id("users"),
  reason: v.string(),
  at: v.number(),
  previous: previousResult,
});
const serviceTeam = v.union(v.literal("A"), v.literal("B"));
export const rallySnapshot = v.object({
  scoreA: v.number(),
  scoreB: v.number(),
  service: v.object({
    startingTeam: serviceTeam,
    servingTeam: serviceTeam,
    serverId: v.string(),
    turn: v.union(
      v.literal("opening"),
      v.literal("first"),
      v.literal("second"),
    ),
    rightAtZero: v.object({ A: v.string(), B: v.string() }),
  }),
  scoredTeam: v.union(serviceTeam, v.null()),
});
