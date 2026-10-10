/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import {
  asIdentity,
  capabilityProbe,
  matchGatesProbe,
  seedAuthz,
} from "./authz.test-fixtures";
import { createBackend, scoring } from "./schema.test-fixtures";
import { expect, test } from "vitest";

const unavailable = { data: { code: "RESOURCE_UNAVAILABLE" } };

test("resolves event, division, tournament match, lobby, and lobby match scope", async () => {
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  const owner = asIdentity(backend, "owner");
  for (const target of [
    { type: "event" as const, id: fixture.event },
    { type: "division" as const, id: fixture.division },
    { type: "match" as const, id: fixture.match },
  ]) {
    await expect(
      owner.query(capabilityProbe, { target, capability: "event:read" }),
    ).resolves.toMatchObject({
      scope: { orgId: fixture.org, eventId: fixture.event },
    });
  }
  const host = asIdentity(backend, "otherOwner");
  for (const target of [
    { type: "lobby" as const, id: fixture.lobby },
    { type: "match" as const, id: fixture.lobbyMatch },
  ]) {
    await expect(
      host.query(capabilityProbe, { target, capability: "event:manage" }),
    ).resolves.toMatchObject({
      scope: {
        orgId: fixture.personalOrg,
        lobbyHostUserId: fixture.users.otherOwner,
      },
    });
  }
  await expect(
    host.query(matchGatesProbe, { matchId: fixture.lobbyMatch }),
  ).resolves.toMatchObject({ requiresOperationChecks: true });
});

test("keeps lobby event and match authority exclusive to the validated host", async () => {
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  await backend.run(({ db }) =>
    db.insert("orgMembers", {
      orgId: fixture.personalOrg,
      userId: fixture.users.admin,
      role: "admin",
      since: 1,
    }),
  );
  const admin = asIdentity(backend, "admin");
  await expect(
    admin.query(capabilityProbe, {
      target: { type: "lobby", id: fixture.lobby },
      capability: "org:read",
    }),
  ).resolves.toBeDefined();
  await expect(
    admin.query(capabilityProbe, {
      target: { type: "lobby", id: fixture.lobby },
      capability: "event:read",
    }),
  ).rejects.toMatchObject(unavailable);
  await expect(
    admin.query(matchGatesProbe, { matchId: fixture.lobbyMatch }),
  ).rejects.toMatchObject(unavailable);
});

test("uses one safe payload for a real foreign resource and a missing id", async () => {
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  const owner = asIdentity(backend, "owner");
  const target = { type: "org" as const, id: fixture.foreignOrg };
  let foreignData: unknown;
  let missingData: unknown;
  try {
    await owner.query(capabilityProbe, { target, capability: "org:read" });
  } catch (error) {
    foreignData = (error as { data: unknown }).data;
  }
  await backend.run(async ({ db }) => {
    const membership = await db
      .query("orgMembers")
      .withIndex("by_orgId_userId", (q) =>
        q.eq("orgId", fixture.foreignOrg).eq("userId", fixture.users.spectator),
      )
      .unique();
    if (membership) await db.delete(membership._id);
    await db.delete(fixture.foreignOrg);
  });
  try {
    await owner.query(capabilityProbe, { target, capability: "org:read" });
  } catch (error) {
    missingData = (error as { data: unknown }).data;
  }
  expect(foreignData).toEqual({ code: "RESOURCE_UNAVAILABLE" });
  expect(missingData).toEqual(foreignData);
});

test("denies malformed lobby ownership and match ownership shapes", async () => {
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  const malformed = await backend.run(async ({ db }) => {
    const base = {
      kind: "round-robin" as const,
      round: 1,
      ordinal: 9,
      sourceA: { type: "standing" as const, rank: 1 },
      sourceB: { type: "standing" as const, rank: 2 },
      status: "pending" as const,
      scoring,
      games: [],
      signatures: [],
      corrections: [],
      weight: "tournament" as const,
    };
    const otherDivision = await db.insert("divisions", {
      eventId: fixture.event,
      name: "Other",
      discipline: "singles",
      format: "round-robin",
      scoring,
      eligibility: { ratingSource: "self", allowProvisional: true },
      teamCap: 8,
      minRestMs: 0,
      status: "registration",
    });
    const clubLobby = await db.insert("lobbies", {
      orgId: fixture.org,
      hostUserId: fixture.users.owner,
      name: "Club lobby",
      joinCodeDigest: "club",
      discipline: "singles",
      scoring,
      status: "open",
    });
    const wrongHostLobby = await db.insert("lobbies", {
      orgId: fixture.personalOrg,
      hostUserId: fixture.users.owner,
      name: "Wrong host",
      joinCodeDigest: "wrong-host",
      discipline: "singles",
      scoring,
      status: "open",
    });
    return {
      clubLobby,
      wrongHostLobby,
      noScope: await db.insert("matches", base),
      ambiguous: await db.insert("matches", {
        ...base,
        divisionId: fixture.division,
        lobbyId: fixture.lobby,
      }),
      mismatch: await db.insert("matches", {
        ...base,
        divisionId: otherDivision,
        poolId: fixture.pool,
      }),
      wrongLobbyKind: await db.insert("matches", {
        ...base,
        lobbyId: fixture.lobby,
      }),
      wrongTournamentKind: await db.insert("matches", {
        ...base,
        divisionId: fixture.division,
        kind: "lobby",
      }),
    };
  });
  for (const lobbyId of [malformed.clubLobby, malformed.wrongHostLobby]) {
    await expect(
      asIdentity(backend, "owner").query(capabilityProbe, {
        target: { type: "lobby", id: lobbyId },
        capability: "event:read",
      }),
    ).rejects.toMatchObject(unavailable);
  }
  for (const matchId of [
    malformed.noScope,
    malformed.ambiguous,
    malformed.mismatch,
    malformed.wrongLobbyKind,
    malformed.wrongTournamentKind,
  ]) {
    await expect(
      asIdentity(backend, "owner").query(capabilityProbe, {
        target: { type: "match", id: matchId },
        capability: "event:read",
      }),
    ).rejects.toMatchObject(unavailable);
  }
});

test("denies dangling event, division, pool, and lobby links", async () => {
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  const dangling = await backend.run(async ({ db }) => {
    await db.delete(fixture.event);
    await db.delete(fixture.division);
    await db.delete(fixture.pool);
    await db.delete(fixture.lobby);
    return [fixture.division, fixture.match, fixture.lobbyMatch] as const;
  });
  const owner = asIdentity(backend, "owner");
  await expect(
    owner.query(capabilityProbe, {
      target: { type: "event", id: fixture.event },
      capability: "event:read",
    }),
  ).rejects.toMatchObject(unavailable);
  for (const [index, id] of dangling.entries()) {
    const target =
      index === 0
        ? ({ type: "division", id } as const)
        : ({ type: "match", id } as const);
    await expect(
      owner.query(capabilityProbe, {
        target: target as never,
        capability: "event:read",
      }),
    ).rejects.toMatchObject(unavailable);
  }
});
