/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { expect, test } from "vitest";
import {
  createBackend,
  matchRow,
  scoring,
  seedDomain,
} from "./schema.test-fixtures";

test("accepts the committed identity and tournament literal boundaries", async () => {
  const backend = createBackend();
  const ids = await seedDomain(backend);

  const inserted = await backend.run(async ({ db }) => {
    const rows = [];
    rows.push(
      await db.insert("orgs", {
        kind: "personal",
        name: "Personal",
        ownerUserId: ids.users,
      }),
    );
    for (const role of [
      "owner",
      "admin",
      "director",
      "scorer",
      "member",
    ] as const) {
      rows.push(
        await db.insert("orgMembers", {
          orgId: ids.orgs,
          userId: ids.users,
          role,
          since: 1,
        }),
      );
    }
    for (const [gender, ageBracket, skillSelf] of [
      ["male", "19+", "2.5"],
      ["female", "35+", "3.0"],
      [undefined, "50+", "3.5"],
      [undefined, "60+", "4.0"],
      [undefined, "65+", "4.5"],
      [undefined, "70+", "5.0"],
      [undefined, undefined, "5.5+"],
    ] as const) {
      rows.push(
        await db.insert("players", {
          orgId: ids.orgs,
          displayName: `${ageBracket ?? "Open"} player`,
          gender,
          ageBracket,
          skillSelf,
        }),
      );
    }
    for (const [subjectId, discipline] of [
      [ids.users, "singles"],
      [ids.players, "doubles"],
    ] as const) {
      rows.push(
        await db.insert("ratings", {
          subjectId,
          discipline,
          rating: 3.5,
          deviation: 0.5,
          volatility: 0.06,
          ratedMatches: 1,
          updatedAt: 20,
        }),
      );
    }
    for (const weight of [
      "tournament",
      "league",
      "casual",
      "conflicted",
    ] as const) {
      rows.push(
        await db.insert("ratingEvents", {
          playerId: ids.players,
          matchId: ids.matches,
          discipline: weight === "league" ? "doubles" : "singles",
          before: { rating: 3.5, deviation: 0.5, volatility: 0.06 },
          after: { rating: 3.6, deviation: 0.45, volatility: 0.06 },
          weight,
          at: 20,
        }),
      );
    }
    const eventStatuses = [
      "draft",
      "open",
      "live",
      "complete",
      "cancelled",
    ] as const;
    const visibilities = ["private", "code", "public"] as const;
    for (const [index, status] of eventStatuses.entries()) {
      rows.push(
        await db.insert("events", {
          orgId: ids.orgs,
          createdByUserId: ids.users,
          name: status,
          startsAt: 10,
          courtCount: 2,
          joinCodeDigest: `event-${status}`,
          joinCodeExpiresAt: 100,
          visibility: visibilities[index % visibilities.length],
          status,
        }),
      );
    }
    const formats = [
      "single-elimination",
      "single-elimination-consolation",
      "double-elimination",
      "round-robin",
      "pool-play-bracket",
      "round-robin-bracket",
      "king-of-the-court",
      "ladder",
      "rotating-partner-round-robin",
    ] as const;
    const genders = ["men", "women", "mixed", "open"] as const;
    const ages = ["19+", "35+", "50+", "60+", "65+", "70+"] as const;
    const ratingSources = ["self", "pickle-king", "dupr"] as const;
    for (const [index, format] of formats.entries()) {
      rows.push(
        await db.insert("divisions", {
          eventId: ids.events,
          name: format,
          discipline: index % 2 === 0 ? "singles" : "doubles",
          format,
          scoring: {
            gamesToWin: ([1, 2, 3] as const)[index % 3],
            pointsPerGame: ([7, 11, 15, 21] as const)[index % 4],
            winBy: ([1, 2] as const)[index % 2],
            scoringSystem: index % 2 === 0 ? "side-out" : "rally",
            timeCapMs: index === 0 ? null : 900_000,
          },
          eligibility: {
            gender: genders[index % genders.length],
            minAge: ages[index % ages.length],
            ratingSource: ratingSources[index % ratingSources.length],
            allowProvisional: index % 2 === 0,
          },
          poolPlay:
            index === 4
              ? {
                  poolSize: 4,
                  advancePerPool: 2,
                  playoff: "double-elimination",
                }
              : undefined,
          teamCap: 16,
          minRestMs: 60_000,
          status: (
            ["registration", "locked", "in-progress", "complete"] as const
          )[index % 4],
        }),
      );
    }
    return rows;
  });

  await expect(
    backend.run(({ db }) =>
      db.insert("orgMembers", {
        orgId: ids.orgs,
        userId: ids.users,
        role: "captain",
        since: 1,
      } as never),
    ),
  ).rejects.toThrow();
  await expect(
    backend.run(({ db }) =>
      db.insert("players", {
        orgId: ids.orgs,
        displayName: "Invalid",
        gender: "open",
      } as never),
    ),
  ).rejects.toThrow();
  await expect(
    backend.run(({ db }) =>
      db.insert("divisions", {
        eventId: ids.events,
        name: "Invalid",
        discipline: "singles",
        format: "swiss",
        scoring,
        eligibility: { ratingSource: "external", allowProvisional: true },
        teamCap: 16,
        minRestMs: 60_000,
        status: "registration",
      } as never),
    ),
  ).rejects.toThrow();
  expect(inserted).toHaveLength(33);
});

test("accepts every match source, result, signature, and outcome variant", async () => {
  const backend = createBackend();
  const ids = await seedDomain(backend);
  const sources = [
    { type: "team", teamId: ids.teams },
    { type: "winner", matchId: ids.matches },
    { type: "loser", matchId: ids.matches },
    { type: "pool-standing", poolId: ids.pools, rank: 1 },
    { type: "standing", rank: 1 },
  ] as const;
  const results = ["recorded", "signed", "final", "disputed"] as const;
  const signatureKinds = [
    "submit",
    "tap",
    "staff-override",
    "conflicted",
  ] as const;
  const outcomes = ["played", "forfeit", "retired", "withdrawn"] as const;

  const matches = await backend.run(async ({ db }) =>
    Promise.all(
      sources.map((sourceA, index) =>
        db.insert("matches", {
          ...matchRow(ids.divisions, index + 10),
          sourceA,
          result: results[index % results.length],
          signatures: [
            {
              side: index % 2 === 0 ? "A" : "B",
              userId: ids.users,
              kind: signatureKinds[index % signatureKinds.length],
              at: 20,
            },
          ],
          outcome: outcomes[index % outcomes.length],
        }),
      ),
    ),
  );

  for (const invalid of [
    { sourceA: { type: "seed", rank: 1 } },
    { result: "approved" },
    { signatures: [{ side: "A", userId: ids.users, kind: "email", at: 20 }] },
    { outcome: "abandoned" },
  ]) {
    await expect(
      backend.run(({ db }) =>
        db.insert("matches", {
          ...matchRow(ids.divisions, 30),
          ...invalid,
        } as never),
      ),
    ).rejects.toThrow();
  }
  expect(matches).toHaveLength(5);
});
