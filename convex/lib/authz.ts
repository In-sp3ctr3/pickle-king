import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { ConvexError } from "convex/values";
import {
  eventCapabilities,
  eventMatchGates,
  inheritedEventCapabilities,
  inheritedMatchGates,
  orgCapabilities,
  type Capability,
  type EventRole,
  type MatchRoleGate,
  type OrgRole,
} from "./authz_policy";

export type { Capability, MatchRoleGate } from "./authz_policy";

type AuthzCtx = Pick<QueryCtx | MutationCtx, "auth" | "db">;

export type ResourceTarget =
  | { type: "org"; id: Id<"orgs"> }
  | { type: "event"; id: Id<"events"> }
  | { type: "division"; id: Id<"divisions"> }
  | { type: "match"; id: Id<"matches"> }
  | { type: "lobby"; id: Id<"lobbies"> };

export interface ResourceScope {
  kind: ResourceTarget["type"];
  orgId: Id<"orgs">;
  eventId?: Id<"events">;
  lobbyHostUserId?: Id<"users">;
  archived: boolean;
}

export interface AuthorizationContext {
  user: Doc<"users">;
  scope: ResourceScope;
  orgRole?: OrgRole;
  eventRole?: EventRole;
  capabilities: readonly Capability[];
}

export interface MatchRoleGateContext {
  user: Doc<"users">;
  scope: ResourceScope;
  roleGates: readonly MatchRoleGate[];
  requiresOperationChecks: true;
}

const unavailableData = { code: "RESOURCE_UNAVAILABLE" } as const;
const unavailable = (): never => {
  throw new ConvexError(unavailableData);
};
const unauthenticated = (): never => {
  throw new ConvexError({ code: "AUTH_REQUIRED" });
};

function isActiveUser(user: Doc<"users"> | null): user is Doc<"users"> {
  return Boolean(
    user &&
    user.deletedAt === undefined &&
    user.clerkId?.trim() &&
    user.email?.trim() &&
    user.displayName?.trim(),
  );
}

function required<T>(value: T | null): T {
  if (value === null) return unavailable();
  return value;
}

export async function requireActiveUser(ctx: AuthzCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const subject = identity?.subject;
  if (!subject || subject.trim() !== subject) unauthenticated();
  const users = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", subject))
    .take(2);
  if (users.length !== 1 || !isActiveUser(users[0])) unauthenticated();
  return users[0];
}

async function getOrg(ctx: AuthzCtx, orgId: Id<"orgs">) {
  const org = required(await ctx.db.get("orgs", orgId));
  const ownerMemberships = await ctx.db
    .query("orgMembers")
    .withIndex("by_orgId_userId", (q) =>
      q.eq("orgId", orgId).eq("userId", org.ownerUserId),
    )
    .take(2);
  if (ownerMemberships.length > 1) unavailable();
  const ownerMembership = ownerMemberships[0];
  if (ownerMembership && ownerMembership.role !== "owner") unavailable();
  const owner = required(await ctx.db.get("users", org.ownerUserId));
  if (org.archivedAt === undefined) {
    if (!isActiveUser(owner) || !ownerMembership) unavailable();
  } else if (
    owner.deletedAt === undefined &&
    (!isActiveUser(owner) || !ownerMembership)
  ) {
    unavailable();
  }
  return org;
}

async function tournamentScope(
  ctx: AuthzCtx,
  divisionId: Id<"divisions">,
  kind: ResourceScope["kind"],
) {
  const division = required(await ctx.db.get("divisions", divisionId));
  const event = required(await ctx.db.get("events", division.eventId));
  const org = await getOrg(ctx, event.orgId);
  return {
    kind,
    orgId: org._id,
    eventId: event._id,
    archived: org.archivedAt !== undefined,
  } satisfies ResourceScope;
}

async function lobbyScope(
  ctx: AuthzCtx,
  lobbyId: Id<"lobbies">,
  kind: ResourceScope["kind"],
) {
  const lobby = required(await ctx.db.get("lobbies", lobbyId));
  const org = await getOrg(ctx, lobby.orgId);
  if (org.kind !== "personal" || lobby.hostUserId !== org.ownerUserId) {
    unavailable();
  }
  return {
    kind,
    orgId: org._id,
    lobbyHostUserId: lobby.hostUserId,
    archived: org.archivedAt !== undefined,
  } satisfies ResourceScope;
}

export async function resolveResourceScope(
  ctx: AuthzCtx,
  target: ResourceTarget,
): Promise<ResourceScope> {
  if (target.type === "org") {
    const org = await getOrg(ctx, target.id);
    return {
      kind: "org",
      orgId: org._id,
      archived: org.archivedAt !== undefined,
    };
  }
  if (target.type === "event") {
    const event = required(await ctx.db.get("events", target.id));
    const org = await getOrg(ctx, event.orgId);
    return {
      kind: "event",
      orgId: org._id,
      eventId: event._id,
      archived: org.archivedAt !== undefined,
    };
  }
  if (target.type === "division") {
    return tournamentScope(ctx, target.id, "division");
  }
  if (target.type === "lobby") {
    return lobbyScope(ctx, target.id, "lobby");
  }
  const match = required(await ctx.db.get("matches", target.id));
  const tournamentPath =
    match.divisionId !== undefined || match.poolId !== undefined;
  if (Boolean(match.lobbyId) === tournamentPath) unavailable();
  if (match.lobbyId) {
    if (match.kind !== "lobby") unavailable();
    return lobbyScope(ctx, match.lobbyId, "match");
  }
  if (match.kind === "lobby") unavailable();
  let divisionId = match.divisionId;
  if (match.poolId) {
    const pool = required(await ctx.db.get("pools", match.poolId));
    if (divisionId && divisionId !== pool.divisionId) unavailable();
    divisionId = pool.divisionId;
  }
  if (!divisionId) return unavailable();
  return tournamentScope(ctx, divisionId, "match");
}

async function resolveAuthorization(
  ctx: AuthzCtx,
  target: ResourceTarget,
): Promise<AuthorizationContext & { roleGates: readonly MatchRoleGate[] }> {
  const user = await requireActiveUser(ctx);
  const scope = await resolveResourceScope(ctx, target);
  const memberships = await ctx.db
    .query("orgMembers")
    .withIndex("by_orgId_userId", (q) =>
      q.eq("orgId", scope.orgId).eq("userId", user._id),
    )
    .take(2);
  if (memberships.length > 1) unavailable();
  const orgRole = memberships[0]?.role;
  if (
    orgRole === "owner" &&
    user._id !== (await ctx.db.get("orgs", scope.orgId))?.ownerUserId
  ) {
    unavailable();
  }
  let eventRole: EventRole | undefined;
  if (scope.eventId) {
    const eventRoles = await ctx.db
      .query("eventRoles")
      .withIndex("by_eventId_userId", (q) =>
        q.eq("eventId", scope.eventId!).eq("userId", user._id),
      )
      .take(2);
    if (eventRoles.length > 1) unavailable();
    eventRole = eventRoles[0]?.role;
  }
  const effectiveEventRole = orgRole === "owner" ? undefined : eventRole;
  const inherited = effectiveEventRole ? undefined : orgRole;
  const isLobbyHost = scope.lobbyHostUserId === user._id;
  const orgCaps = orgRole ? orgCapabilities[orgRole] : [];
  const eventCaps = scope.lobbyHostUserId
    ? isLobbyHost && orgRole === "owner"
      ? inheritedEventCapabilities.owner
      : []
    : effectiveEventRole
      ? eventCapabilities[effectiveEventRole]
      : inherited
        ? inheritedEventCapabilities[inherited]
        : [];
  const roleGates = scope.lobbyHostUserId
    ? isLobbyHost && orgRole === "owner"
      ? inheritedMatchGates.owner
      : []
    : effectiveEventRole
      ? eventMatchGates[effectiveEventRole]
      : inherited
        ? inheritedMatchGates[inherited]
        : [];
  const scopedEventCaps = scope.kind === "org" ? [] : eventCaps;
  const capabilities = scope.archived
    ? [...orgCaps, ...scopedEventCaps].filter((capability) =>
        capability.endsWith(":read"),
      )
    : [...orgCaps, ...scopedEventCaps];
  return {
    user,
    scope,
    orgRole,
    eventRole,
    capabilities,
    roleGates: scope.archived ? [] : roleGates,
  };
}

export async function requireCapability(
  ctx: AuthzCtx,
  target: ResourceTarget,
  capability: Capability,
): Promise<AuthorizationContext> {
  const authorization = await resolveAuthorization(ctx, target);
  if (!authorization.capabilities.includes(capability)) unavailable();
  return authorization;
}

export async function resolveMatchRoleGates(
  ctx: AuthzCtx,
  matchId: Id<"matches">,
): Promise<MatchRoleGateContext> {
  const authorization = await resolveAuthorization(ctx, {
    type: "match",
    id: matchId,
  });
  if (authorization.roleGates.length === 0) unavailable();
  return {
    user: authorization.user,
    scope: authorization.scope,
    roleGates: authorization.roleGates,
    requiresOperationChecks: true,
  };
}
