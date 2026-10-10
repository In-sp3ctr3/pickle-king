/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { expect, test } from "vitest";
import schema from "./schema";
import {
  createBackend,
  matchRow,
  scoring,
  seedDomain,
} from "./schema.test-fixtures";

test("declares only the ticketed query indexes", () => {
  const actual = Object.fromEntries(
    Object.entries(schema.tables).map(([table, definition]) => [
      table,
      definition[" indexes"]().map(({ indexDescriptor, fields }) => [
        indexDescriptor,
        fields,
      ]),
    ]),
  );

  expect(actual).toEqual({
    users: [["by_clerkId", ["clerkId"]]],
    orgs: [["by_ownerUserId", ["ownerUserId"]]],
    orgMembers: [
      ["by_orgId_userId", ["orgId", "userId"]],
      ["by_userId", ["userId"]],
    ],
    players: [
      ["by_orgId", ["orgId"]],
      ["by_userId", ["userId"]],
    ],
    ratings: [["by_subjectId_discipline", ["subjectId", "discipline"]]],
    ratingEvents: [
      ["by_playerId", ["playerId"]],
      ["by_at", ["at"]],
    ],
    events: [
      ["by_orgId", ["orgId"]],
      ["by_joinCodeDigest", ["joinCodeDigest"]],
    ],
    divisions: [["by_eventId", ["eventId"]]],
    teams: [["by_divisionId", ["divisionId"]]],
    pools: [["by_divisionId", ["divisionId"]]],
    matches: [
      ["by_divisionId", ["divisionId"]],
      ["by_poolId", ["poolId"]],
      ["by_lobbyId", ["lobbyId"]],
      ["by_result", ["result"]],
      ["by_finalAt", ["finalAt"]],
    ],
    rallyLogs: [["by_matchId_chunk", ["matchId", "chunk"]]],
    liveScores: [["by_matchId", ["matchId"]]],
    eventRoles: [
      ["by_eventId_userId", ["eventId", "userId"]],
      ["by_userId", ["userId"]],
    ],
    lobbies: [
      ["by_orgId", ["orgId"]],
      ["by_joinCodeDigest", ["joinCodeDigest"]],
    ],
    invites: [["by_tokenDigest", ["tokenDigest"]]],
    duprOutbox: [["by_status_notBefore", ["status", "notBefore"]]],
    auditLog: [["by_target", ["targetTable", "targetId"]]],
  });
});

test("executes every declared index shape", async () => {
  const backend = createBackend();
  const id = await seedDomain(backend);
  const indexed = await backend.run(async ({ db }) => ({
    user: await db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", "clerk-user"))
      .collect(),
    org: await db
      .query("orgs")
      .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", id.users))
      .collect(),
    orgMember: await db
      .query("orgMembers")
      .withIndex("by_orgId_userId", (q) =>
        q.eq("orgId", id.orgs).eq("userId", id.users),
      )
      .collect(),
    userMemberships: await db
      .query("orgMembers")
      .withIndex("by_userId", (q) => q.eq("userId", id.users))
      .collect(),
    orgPlayers: await db
      .query("players")
      .withIndex("by_orgId", (q) => q.eq("orgId", id.orgs))
      .collect(),
    userPlayers: await db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", id.users))
      .collect(),
    rating: await db
      .query("ratings")
      .withIndex("by_subjectId_discipline", (q) =>
        q.eq("subjectId", id.users).eq("discipline", "singles"),
      )
      .collect(),
    playerRatingEvents: await db
      .query("ratingEvents")
      .withIndex("by_playerId", (q) => q.eq("playerId", id.players))
      .collect(),
    replay: await db
      .query("ratingEvents")
      .withIndex("by_at")
      .order("asc")
      .collect(),
    orgEvents: await db
      .query("events")
      .withIndex("by_orgId", (q) => q.eq("orgId", id.orgs))
      .collect(),
    eventDigest: await db
      .query("events")
      .withIndex("by_joinCodeDigest", (q) =>
        q.eq("joinCodeDigest", "event-digest"),
      )
      .collect(),
    divisions: await db
      .query("divisions")
      .withIndex("by_eventId", (q) => q.eq("eventId", id.events))
      .collect(),
    teams: await db
      .query("teams")
      .withIndex("by_divisionId", (q) => q.eq("divisionId", id.divisions))
      .collect(),
    pools: await db
      .query("pools")
      .withIndex("by_divisionId", (q) => q.eq("divisionId", id.divisions))
      .collect(),
    matches: await db
      .query("matches")
      .withIndex("by_divisionId", (q) => q.eq("divisionId", id.divisions))
      .collect(),
    poolMatches: await db
      .query("matches")
      .withIndex("by_poolId", (q) => q.eq("poolId", id.pools))
      .collect(),
    lobbyMatches: await db
      .query("matches")
      .withIndex("by_lobbyId", (q) => q.eq("lobbyId", id.lobbies))
      .collect(),
    finalResults: await db
      .query("matches")
      .withIndex("by_result", (q) => q.eq("result", "final"))
      .collect(),
    finalOrder: await db
      .query("matches")
      .withIndex("by_finalAt")
      .order("asc")
      .collect(),
    rally: await db
      .query("rallyLogs")
      .withIndex("by_matchId_chunk", (q) =>
        q.eq("matchId", id.matches).eq("chunk", 0),
      )
      .collect(),
    live: await db
      .query("liveScores")
      .withIndex("by_matchId", (q) => q.eq("matchId", id.matches))
      .collect(),
    eventRole: await db
      .query("eventRoles")
      .withIndex("by_eventId_userId", (q) =>
        q.eq("eventId", id.events).eq("userId", id.users),
      )
      .collect(),
    userRoles: await db
      .query("eventRoles")
      .withIndex("by_userId", (q) => q.eq("userId", id.users))
      .collect(),
    orgLobbies: await db
      .query("lobbies")
      .withIndex("by_orgId", (q) => q.eq("orgId", id.orgs))
      .collect(),
    lobbyDigest: await db
      .query("lobbies")
      .withIndex("by_joinCodeDigest", (q) =>
        q.eq("joinCodeDigest", "lobby-digest"),
      )
      .collect(),
    invite: await db
      .query("invites")
      .withIndex("by_tokenDigest", (q) => q.eq("tokenDigest", "invite-digest"))
      .collect(),
    outbox: await db
      .query("duprOutbox")
      .withIndex("by_status_notBefore", (q) =>
        q.eq("status", "queued").gte("notBefore", 0),
      )
      .collect(),
    audit: await db
      .query("auditLog")
      .withIndex("by_target", (q) =>
        q.eq("targetTable", "matches").eq("targetId", id.matches),
      )
      .collect(),
  }));

  expect(Object.values(indexed).every((rows) => rows.length === 1)).toBe(true);
});

test("reads a 127-row division in one indexed query and excludes decoys", async () => {
  const backend = createBackend();
  const id = await seedDomain(backend);
  const inserted = await backend.run(async ({ db }) => {
    const decoyDivision = await db.insert("divisions", {
      eventId: id.events,
      name: "Decoy",
      discipline: "singles",
      format: "single-elimination",
      scoring,
      eligibility: { ratingSource: "self", allowProvisional: true },
      teamCap: 64,
      minRestMs: 0,
      status: "locked",
    });
    const target = [id.matches];
    const decoys = [];
    for (let ordinal = 2; ordinal <= 127; ordinal += 1) {
      target.push(await db.insert("matches", matchRow(id.divisions, ordinal)));
    }
    for (let ordinal = 1; ordinal <= 9; ordinal += 1) {
      decoys.push(await db.insert("matches", matchRow(decoyDivision, ordinal)));
    }
    return { target, decoys };
  });

  const rows = await backend.run(({ db }) =>
    db
      .query("matches")
      .withIndex("by_divisionId", (q) => q.eq("divisionId", id.divisions))
      .collect(),
  );

  expect(rows).toHaveLength(127);
  expect(new Set(rows.map(({ _id }) => _id))).toEqual(new Set(inserted.target));
  expect(rows.every(({ _id }) => !inserted.decoys.includes(_id))).toBe(true);
});
