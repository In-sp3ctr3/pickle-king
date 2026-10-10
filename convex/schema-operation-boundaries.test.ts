/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { expect, test } from "vitest";
import { createBackend, scoring, seedDomain } from "./schema.test-fixtures";

test("accepts rally, event-role, lobby, and outbox state boundaries", async () => {
  const backend = createBackend();
  const ids = await seedDomain(backend);

  const rows = await backend.run(async ({ db }) => {
    const inserted = [];
    inserted.push(
      await db.insert("rallyLogs", {
        matchId: ids.matches,
        chunk: 1,
        snapshots: (["opening", "first", "second"] as const).map(
          (turn, index) => ({
            scoreA: index,
            scoreB: 0,
            service: {
              startingTeam: index % 2 === 0 ? ("A" as const) : ("B" as const),
              servingTeam: index % 2 === 0 ? ("B" as const) : ("A" as const),
              serverId: "server",
              turn,
              rightAtZero: { A: "a", B: "b" },
            },
            scoredTeam: (["A", "B", null] as const)[index],
          }),
        ),
      }),
    );
    for (const role of ["director", "scorer", "player"] as const) {
      inserted.push(
        await db.insert("eventRoles", {
          eventId: ids.events,
          userId: ids.users,
          role,
        }),
      );
    }
    for (const status of ["open", "closed"] as const) {
      inserted.push(
        await db.insert("lobbies", {
          orgId: ids.orgs,
          hostUserId: ids.users,
          name: status,
          joinCodeDigest: `${status}-digest`,
          discipline: status === "open" ? "singles" : "doubles",
          scoring,
          status,
        }),
      );
    }
    for (const status of [
      "queued",
      "sent",
      "failed",
      "ineligible",
      "correction-needed",
    ] as const) {
      inserted.push(
        await db.insert("duprOutbox", {
          matchId: ids.matches,
          idempotencyKey: status,
          status,
          attempts: 0,
          notBefore: 1,
          lastError: status === "failed" ? "retry" : undefined,
          purgeAfter: 2,
        }),
      );
    }
    return inserted;
  });

  await expect(
    backend.run(({ db }) =>
      db.insert("rallyLogs", {
        matchId: ids.matches,
        chunk: 2,
        snapshots: [
          {
            scoreA: 0,
            scoreB: 0,
            service: {
              startingTeam: "A",
              servingTeam: "A",
              serverId: "server",
              turn: "third",
              rightAtZero: { A: "a", B: "b" },
            },
            scoredTeam: "C",
          },
        ],
      } as never),
    ),
  ).rejects.toThrow();
  await expect(
    backend.run(({ db }) =>
      db.insert("eventRoles", {
        eventId: ids.events,
        userId: ids.users,
        role: "owner",
      } as never),
    ),
  ).rejects.toThrow();
  await expect(
    backend.run(({ db }) =>
      db.insert("duprOutbox", {
        matchId: ids.matches,
        idempotencyKey: "invalid",
        status: "pending",
        attempts: 0,
        notBefore: 1,
        purgeAfter: 2,
      } as never),
    ),
  ).rejects.toThrow();
  expect(rows).toHaveLength(11);
});
