/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import {
  asIdentity,
  capabilityProbe,
  matchGatesProbe,
  seedAuthz,
  writeProbe,
} from "./authz.test-fixtures";
import { createBackend } from "./schema.test-fixtures";
import { expect, test } from "vitest";

const unavailable = { data: { code: "RESOURCE_UNAVAILABLE" } };

test("preserves only existing read authority after archival", async () => {
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  await backend.run(({ db }) => db.patch(fixture.org, { archivedAt: 2 }));

  await expect(
    asIdentity(backend, "member").query(capabilityProbe, {
      target: { type: "event", id: fixture.event },
      capability: "event:read",
    }),
  ).resolves.toBeDefined();
  await expect(
    asIdentity(backend, "owner").query(capabilityProbe, {
      target: { type: "org", id: fixture.org },
      capability: "org:read",
    }),
  ).resolves.toBeDefined();
  await expect(
    asIdentity(backend, "director").mutation(writeProbe, {
      target: { type: "event", id: fixture.event },
      capability: "event:manage",
    }),
  ).rejects.toMatchObject(unavailable);
  await expect(
    asIdentity(backend, "member").query(matchGatesProbe, {
      matchId: fixture.match,
    }),
  ).rejects.toMatchObject(unavailable);
});

test("keeps surviving reads when deletion removes an archived canonical owner", async () => {
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  await backend.run(async ({ db }) => {
    await db.patch(fixture.org, { archivedAt: 2 });
    await db.patch(fixture.users.owner, { deletedAt: 2 });
    const ownerMembership = await db
      .query("orgMembers")
      .withIndex("by_orgId_userId", (q) =>
        q.eq("orgId", fixture.org).eq("userId", fixture.users.owner),
      )
      .unique();
    if (ownerMembership) await db.delete(ownerMembership._id);
  });

  for (const clerkId of ["member", "player"]) {
    await expect(
      asIdentity(backend, clerkId).query(capabilityProbe, {
        target: { type: "event", id: fixture.event },
        capability: "event:read",
      }),
    ).resolves.toBeDefined();
  }
  await expect(
    asIdentity(backend, "director").mutation(writeProbe, {
      target: { type: "event", id: fixture.event },
      capability: "event:manage",
    }),
  ).rejects.toMatchObject(unavailable);
});

test.each(["dangling-owner", "active-owner-without-membership"])(
  "fails closed for an archived org with a %s",
  async (shape) => {
    const backend = createBackend();
    const fixture = await seedAuthz(backend);
    await backend.run(async ({ db }) => {
      await db.patch(fixture.org, { archivedAt: 2 });
      const ownerMembership = await db
        .query("orgMembers")
        .withIndex("by_orgId_userId", (q) =>
          q.eq("orgId", fixture.org).eq("userId", fixture.users.owner),
        )
        .unique();
      if (ownerMembership) await db.delete(ownerMembership._id);
      if (shape === "dangling-owner") await db.delete(fixture.users.owner);
    });
    await expect(
      asIdentity(backend, "member").query(capabilityProbe, {
        target: { type: "event", id: fixture.event },
        capability: "event:read",
      }),
    ).rejects.toMatchObject(unavailable);
  },
);

test.each(["missing", "wrong-role"])(
  "fails closed when an active org has a %s canonical owner membership",
  async (shape) => {
    const backend = createBackend();
    const fixture = await seedAuthz(backend);
    await backend.run(async ({ db }) => {
      const membership = await db
        .query("orgMembers")
        .withIndex("by_orgId_userId", (q) =>
          q.eq("orgId", fixture.org).eq("userId", fixture.users.owner),
        )
        .unique();
      if (!membership) return;
      if (shape === "missing") await db.delete(membership._id);
      else await db.patch(membership._id, { role: "admin" });
    });
    await expect(
      asIdentity(backend, "member").query(capabilityProbe, {
        target: { type: "org", id: fixture.org },
        capability: "org:read",
      }),
    ).rejects.toMatchObject(unavailable);
  },
);

test("rejects a noncanonical owner membership", async () => {
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  await backend.run(({ db }) =>
    db.insert("orgMembers", {
      orgId: fixture.org,
      userId: fixture.users.spectator,
      role: "owner",
      since: 2,
    }),
  );
  await expect(
    asIdentity(backend, "spectator").query(capabilityProbe, {
      target: { type: "org", id: fixture.org },
      capability: "org:read",
    }),
  ).rejects.toMatchObject(unavailable);
});

test.each(["identical", "conflicting"])(
  "rejects %s duplicate organization memberships",
  async (shape) => {
    const backend = createBackend();
    const fixture = await seedAuthz(backend);
    await backend.run(({ db }) =>
      db.insert("orgMembers", {
        orgId: fixture.org,
        userId: fixture.users.member,
        role: shape === "identical" ? "member" : "admin",
        since: 2,
      }),
    );
    await expect(
      asIdentity(backend, "member").query(capabilityProbe, {
        target: { type: "org", id: fixture.org },
        capability: "org:read",
      }),
    ).rejects.toMatchObject(unavailable);
  },
);

test.each(["identical", "conflicting"])(
  "rejects %s duplicate event roles",
  async (shape) => {
    const backend = createBackend();
    const fixture = await seedAuthz(backend);
    await backend.run(({ db }) =>
      db.insert("eventRoles", {
        eventId: fixture.event,
        userId: fixture.users.player,
        role: shape === "identical" ? "player" : "director",
      }),
    );
    await expect(
      asIdentity(backend, "player").query(capabilityProbe, {
        target: { type: "event", id: fixture.event },
        capability: "event:read",
      }),
    ).rejects.toMatchObject(unavailable);
  },
);
