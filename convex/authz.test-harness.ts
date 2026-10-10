import { mutation, query } from "./_generated/server";
import {
  requireActiveUser,
  requireCapability,
  resolveMatchRoleGates,
} from "./lib/authz";
import { v } from "convex/values";

const target = v.union(
  v.object({ type: v.literal("org"), id: v.id("orgs") }),
  v.object({ type: v.literal("event"), id: v.id("events") }),
  v.object({ type: v.literal("division"), id: v.id("divisions") }),
  v.object({ type: v.literal("match"), id: v.id("matches") }),
  v.object({ type: v.literal("lobby"), id: v.id("lobbies") }),
);

const capability = v.union(
  v.literal("org:read"),
  v.literal("org:manage"),
  v.literal("org:transfer"),
  v.literal("org:dupr"),
  v.literal("event:read"),
  v.literal("event:manage"),
  v.literal("event:register"),
);

export const identityProbe = query({
  args: {},
  handler: async (ctx) => (await requireActiveUser(ctx))._id,
});

export const capabilityProbe = query({
  args: { target, capability },
  handler: async (ctx, args) => {
    const authorization = await requireCapability(
      ctx,
      args.target,
      args.capability,
    );
    return {
      userId: authorization.user._id,
      scope: authorization.scope,
      orgRole: authorization.orgRole,
      eventRole: authorization.eventRole,
      capabilities: authorization.capabilities,
    };
  },
});

export const writeProbe = mutation({
  args: { target, capability },
  handler: async (ctx, args) => {
    const authorization = await requireCapability(
      ctx,
      args.target,
      args.capability,
    );
    return authorization.scope;
  },
});

export const matchGatesProbe = query({
  args: { matchId: v.id("matches") },
  handler: (ctx, args) => resolveMatchRoleGates(ctx, args.matchId),
});
