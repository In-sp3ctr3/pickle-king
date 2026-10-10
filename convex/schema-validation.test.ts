/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { expect, test } from "vitest";
import { createBackend, scoring, seedDomain } from "./schema.test-fixtures";

test("accepts a valid row in every declared table", async () => {
  const backend = createBackend();
  const ids = await seedDomain(backend);

  const documents = await backend.run(({ db }) =>
    Promise.all([
      db.get("users", ids.users),
      db.get("orgs", ids.orgs),
      db.get("orgMembers", ids.orgMembers),
      db.get("players", ids.players),
      db.get("ratings", ids.ratings),
      db.get("ratingEvents", ids.ratingEvents),
      db.get("events", ids.events),
      db.get("divisions", ids.divisions),
      db.get("teams", ids.teams),
      db.get("pools", ids.pools),
      db.get("matches", ids.matches),
      db.get("rallyLogs", ids.rallyLogs),
      db.get("liveScores", ids.liveScores),
      db.get("eventRoles", ids.eventRoles),
      db.get("lobbies", ids.lobbies),
      db.get("invites", ids.invites),
      db.get("duprOutbox", ids.duprOutbox),
      db.get("auditLog", ids.auditLog),
    ]),
  );

  expect(Object.keys(ids)).toHaveLength(18);
  expect(documents).toHaveLength(18);
  expect(documents.every(Boolean)).toBe(true);
});

test("supports anonymized users but rejects missing required and invalid fields", async () => {
  const backend = createBackend();
  const anonymized = await backend.run(({ db }) =>
    db.insert("users", {
      createdAt: 1,
      consentAt: 1,
      ageGateOk: true,
      leaderboardOptIn: false,
      skillSelf: "2.5",
      deletedAt: 2,
    }),
  );

  await expect(
    backend.run(({ db }) =>
      db.insert("users", {
        createdAt: 1,
        ageGateOk: true,
        leaderboardOptIn: false,
        skillSelf: "2.5",
      } as never),
    ),
  ).rejects.toThrow();
  await expect(
    backend.run(({ db }) =>
      db.insert("users", {
        createdAt: 1,
        consentAt: 1,
        ageGateOk: false,
        leaderboardOptIn: false,
        skillSelf: "2.5",
      } as never),
    ),
  ).rejects.toThrow();
  expect(anonymized).toBeTruthy();
});

test("has no persisted destination for raw bearer codes or tokens", async () => {
  const backend = createBackend();
  const ids = await seedDomain(backend);

  await expect(
    backend.run(({ db }) =>
      db.insert("events", {
        orgId: ids.orgs,
        createdByUserId: ids.users,
        name: "Raw code",
        startsAt: 1,
        courtCount: 1,
        joinCode: "raw-secret",
        joinCodeExpiresAt: 2,
        visibility: "code",
        status: "open",
      } as never),
    ),
  ).rejects.toThrow();
  await expect(
    backend.run(({ db }) =>
      db.insert("lobbies", {
        orgId: ids.orgs,
        hostUserId: ids.users,
        name: "Raw code",
        joinCode: "raw-secret",
        discipline: "singles",
        scoring,
        status: "open",
      } as never),
    ),
  ).rejects.toThrow();
  await expect(
    backend.run(({ db }) =>
      db.insert("invites", {
        kind: "claim",
        token: "raw-secret",
        issuedByUserId: ids.users,
        targetPlayerId: ids.players,
        expiresAt: 2,
      } as never),
    ),
  ).rejects.toThrow();
});

test("enforces typed references, discriminated invites, and complete claims", async () => {
  const backend = createBackend();
  const ids = await seedDomain(backend);

  await expect(
    backend.run(({ db }) =>
      db.insert("orgMembers", {
        orgId: ids.orgs,
        userId: ids.players,
        role: "member",
        since: 1,
      } as never),
    ),
  ).rejects.toThrow();
  await expect(
    backend.run(({ db }) =>
      db.insert("invites", {
        kind: "org",
        tokenDigest: "owner-digest",
        issuedByUserId: ids.users,
        targetOrgId: ids.orgs,
        role: "owner",
        expiresAt: 2,
      } as never),
    ),
  ).rejects.toThrow();
  await expect(
    backend.run(({ db }) =>
      db.insert("matches", {
        divisionId: ids.divisions,
        kind: "winners",
        round: 1,
        ordinal: 2,
        sourceA: { type: "standing", rank: 1 },
        sourceB: { type: "standing", rank: 2 },
        status: "ready",
        scoring,
        games: [],
        signatures: [],
        corrections: [],
        scorerClaim: { userId: ids.users, claimedAt: 1, expiresAt: 2 },
        weight: "tournament",
      } as never),
    ),
  ).rejects.toThrow();
  await expect(
    backend.run(({ db }) =>
      db.insert("matches", {
        divisionId: ids.divisions,
        kind: "winners",
        round: 1,
        ordinal: 3,
        sourceA: { type: "standing", rank: 1 },
        sourceB: { type: "standing", rank: 2 },
        status: "complete",
        scoring,
        games: [],
        result: "approved",
        signatures: [],
        corrections: [],
        weight: "tournament",
      } as never),
    ),
  ).rejects.toThrow();
});

test("accepts each security-bound invite variant and rejects a mismatched target", async () => {
  const backend = createBackend();
  const ids = await seedDomain(backend);

  const variants = await backend.run(async ({ db }) => [
    await db.insert("invites", {
      kind: "team",
      tokenDigest: "team-digest",
      issuedByUserId: ids.users,
      targetTeamId: ids.teams,
      role: "player",
      expiresAt: 100,
    }),
    await db.insert("invites", {
      kind: "scorer",
      tokenDigest: "scorer-digest",
      issuedByUserId: ids.users,
      targetEventId: ids.events,
      role: "scorer",
      expiresAt: 100,
      revokedAt: 90,
    }),
    await db.insert("invites", {
      kind: "org",
      tokenDigest: "org-digest",
      issuedByUserId: ids.users,
      targetOrgId: ids.orgs,
      role: "member",
      expiresAt: 100,
      usedAt: 80,
    }),
  ]);

  await expect(
    backend.run(({ db }) =>
      db.insert("invites", {
        kind: "team",
        tokenDigest: "wrong-target",
        issuedByUserId: ids.users,
        targetEventId: ids.events,
        role: "player",
        expiresAt: 100,
      } as never),
    ),
  ).rejects.toThrow();
  expect(variants).toHaveLength(3);
});

test("documents team cardinality as a mutation invariant, not schema capability", async () => {
  const backend = createBackend();
  const ids = await seedDomain(backend);

  const inserted = await backend.run(async ({ db }) => [
    await db.insert("teams", {
      divisionId: ids.divisions,
      playerIds: [],
      checkedIn: false,
      registeredByUserId: ids.users,
    }),
    await db.insert("teams", {
      divisionId: ids.divisions,
      playerIds: [ids.players, ids.players, ids.players],
      checkedIn: false,
      registeredByUserId: ids.users,
    }),
  ]);

  expect(inserted).toHaveLength(2);
});
