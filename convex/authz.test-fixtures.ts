import { makeFunctionReference } from "convex/server";
import type { FunctionReturnType } from "convex/server";
import type { Id } from "./_generated/dataModel";
import type { Capability, ResourceTarget } from "./lib/authz";
import { createBackend, scoring } from "./schema.test-fixtures";

type Backend = ReturnType<typeof createBackend>;

export const identityProbe = makeFunctionReference<
  "query",
  Record<string, never>,
  Id<"users">
>("authz.test-harness:identityProbe");

export const capabilityProbe = makeFunctionReference<
  "query",
  { target: ResourceTarget; capability: Capability }
>("authz.test-harness:capabilityProbe");

export const writeProbe = makeFunctionReference<
  "mutation",
  { target: ResourceTarget; capability: Capability }
>("authz.test-harness:writeProbe");

export const matchGatesProbe = makeFunctionReference<
  "query",
  { matchId: Id<"matches"> }
>("authz.test-harness:matchGatesProbe");

export type CapabilityResult = FunctionReturnType<typeof capabilityProbe>;

export function asIdentity(backend: Backend, clerkId: string) {
  return backend.withIdentity({ subject: clerkId });
}

export async function addUser(
  backend: Backend,
  clerkId: string,
  fields: { deletedAt?: number; incomplete?: boolean } = {},
) {
  return backend.run(({ db }) =>
    db.insert("users", {
      clerkId,
      email: fields.incomplete ? undefined : `${clerkId}@example.test`,
      displayName: fields.incomplete ? undefined : clerkId,
      createdAt: 1,
      consentAt: 1,
      ageGateOk: true,
      leaderboardOptIn: false,
      skillSelf: "3.5",
      deletedAt: fields.deletedAt,
    }),
  );
}

export async function seedAuthz(backend: Backend) {
  const users = {} as Record<
    | "owner"
    | "admin"
    | "director"
    | "scorer"
    | "member"
    | "player"
    | "spectator"
    | "otherOwner",
    Id<"users">
  >;
  for (const name of [
    "owner",
    "admin",
    "director",
    "scorer",
    "member",
    "player",
    "spectator",
    "otherOwner",
  ] as const) {
    if (!users[name]) users[name] = await addUser(backend, name);
  }

  return backend.run(async ({ db }) => {
    const org = await db.insert("orgs", {
      kind: "club",
      name: "Primary",
      ownerUserId: users.owner,
    });
    for (const role of [
      "owner",
      "admin",
      "director",
      "scorer",
      "member",
    ] as const) {
      await db.insert("orgMembers", {
        orgId: org,
        userId: users[role],
        role,
        since: 1,
      });
    }
    const event = await db.insert("events", {
      orgId: org,
      createdByUserId: users.owner,
      name: "Primary event",
      startsAt: 1,
      courtCount: 1,
      joinCodeDigest: "primary",
      joinCodeExpiresAt: 100,
      visibility: "private",
      status: "open",
    });
    const otherEvent = await db.insert("events", {
      orgId: org,
      createdByUserId: users.owner,
      name: "Other event",
      startsAt: 2,
      courtCount: 1,
      joinCodeDigest: "other-event",
      joinCodeExpiresAt: 100,
      visibility: "private",
      status: "open",
    });
    await db.insert("eventRoles", {
      eventId: event,
      userId: users.player,
      role: "player",
    });
    const division = await db.insert("divisions", {
      eventId: event,
      name: "Division",
      discipline: "singles",
      format: "round-robin",
      scoring,
      eligibility: { ratingSource: "self", allowProvisional: true },
      teamCap: 16,
      minRestMs: 0,
      status: "registration",
    });
    const pool = await db.insert("pools", {
      divisionId: division,
      name: "A",
      teamIds: [],
    });
    const match = await db.insert("matches", {
      divisionId: division,
      poolId: pool,
      kind: "round-robin",
      round: 1,
      ordinal: 1,
      sourceA: { type: "standing", rank: 1 },
      sourceB: { type: "standing", rank: 2 },
      status: "pending",
      scoring,
      games: [],
      signatures: [],
      corrections: [],
      weight: "tournament",
    });
    const personalOrg = await db.insert("orgs", {
      kind: "personal",
      name: "Host",
      ownerUserId: users.otherOwner,
    });
    await db.insert("orgMembers", {
      orgId: personalOrg,
      userId: users.otherOwner,
      role: "owner",
      since: 1,
    });
    const lobby = await db.insert("lobbies", {
      orgId: personalOrg,
      hostUserId: users.otherOwner,
      name: "Lobby",
      joinCodeDigest: "lobby",
      discipline: "singles",
      scoring,
      status: "open",
    });
    const lobbyMatch = await db.insert("matches", {
      lobbyId: lobby,
      kind: "lobby",
      round: 1,
      ordinal: 1,
      sourceA: { type: "standing", rank: 1 },
      sourceB: { type: "standing", rank: 2 },
      status: "pending",
      scoring,
      games: [],
      signatures: [],
      corrections: [],
      weight: "casual",
    });
    const foreignOrg = await db.insert("orgs", {
      kind: "club",
      name: "Foreign",
      ownerUserId: users.spectator,
    });
    await db.insert("orgMembers", {
      orgId: foreignOrg,
      userId: users.spectator,
      role: "owner",
      since: 1,
    });
    return {
      users,
      org,
      event,
      otherEvent,
      division,
      pool,
      match,
      personalOrg,
      lobby,
      lobbyMatch,
      foreignOrg,
    };
  });
}
