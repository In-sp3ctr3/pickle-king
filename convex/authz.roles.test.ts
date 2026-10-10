/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import type { Capability, MatchRoleGate } from "./lib/authz";
import { requireCapability } from "./lib/authz";
import {
  asIdentity,
  capabilityProbe,
  matchGatesProbe,
  seedAuthz,
  writeProbe,
} from "./authz.test-fixtures";
import { createBackend } from "./schema.test-fixtures";
import { expect, test } from "vitest";

const capabilities: Capability[] = [
  "org:read",
  "org:manage",
  "org:transfer",
  "org:dupr",
  "event:read",
  "event:manage",
  "event:register",
];
const unavailable = { data: { code: "RESOURCE_UNAVAILABLE" } };

async function expectCapabilities(
  role: string,
  expected: Capability[],
  target: "org" | "event" = "event",
) {
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  const caller = asIdentity(backend, role);
  const id = target === "org" ? fixture.org : fixture.event;
  for (const capability of capabilities) {
    const result = caller.query(capabilityProbe, {
      target: { type: target, id } as never,
      capability,
    });
    if (expected.includes(capability))
      await expect(result).resolves.toBeDefined();
    else await expect(result).rejects.toMatchObject(unavailable);
  }
}

test("enforces the exact organization-role capability matrix", async () => {
  await expectCapabilities("owner", [
    "org:read",
    "org:manage",
    "org:transfer",
    "org:dupr",
    "event:read",
    "event:manage",
    "event:register",
  ]);
  await expectCapabilities("admin", [
    "org:read",
    "org:manage",
    "event:read",
    "event:manage",
  ]);
  await expectCapabilities("director", [
    "org:read",
    "event:read",
    "event:manage",
  ]);
  await expectCapabilities("scorer", ["org:read", "event:read"]);
  await expectCapabilities("member", [
    "org:read",
    "event:read",
    "event:register",
  ]);
  await expectCapabilities("spectator", []);
});

test("does not expose event capabilities on an organization target", async () => {
  await expectCapabilities(
    "owner",
    ["org:read", "org:manage", "org:transfer", "org:dupr"],
    "org",
  );
});

test.each([
  ["director", ["event:read", "event:manage"]],
  ["scorer", ["event:read"]],
  ["player", ["event:read", "event:register"]],
] as const)(
  "confines event-only %s authority to its event",
  async (role, expected) => {
    const backend = createBackend();
    const fixture = await seedAuthz(backend);
    if (role !== "player") {
      await backend.run(({ db }) =>
        db.insert("eventRoles", {
          eventId: fixture.event,
          userId: fixture.users.spectator,
          role,
        }),
      );
    }
    const caller = asIdentity(
      backend,
      role === "player" ? "player" : "spectator",
    );
    for (const capability of capabilities) {
      const result = caller.query(capabilityProbe, {
        target: { type: "event", id: fixture.event },
        capability,
      });
      if ((expected as readonly Capability[]).includes(capability)) {
        await expect(result).resolves.toBeDefined();
      } else {
        await expect(result).rejects.toMatchObject(unavailable);
      }
    }
    await expect(
      caller.query(capabilityProbe, {
        target: { type: "event", id: fixture.otherEvent },
        capability: "event:read",
      }),
    ).rejects.toMatchObject(unavailable);
  },
);

test("replaces non-owner event inheritance but never owner authority", async () => {
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  await backend.run(async ({ db }) => {
    await db.insert("eventRoles", {
      eventId: fixture.event,
      userId: fixture.users.admin,
      role: "player",
    });
    await db.insert("eventRoles", {
      eventId: fixture.event,
      userId: fixture.users.owner,
      role: "player",
    });
  });
  const target = { type: "event" as const, id: fixture.event };
  const admin = asIdentity(backend, "admin");
  await expect(
    admin.query(capabilityProbe, { target, capability: "org:manage" }),
  ).resolves.toBeDefined();
  await expect(
    admin.query(capabilityProbe, { target, capability: "event:register" }),
  ).resolves.toBeDefined();
  await expect(
    admin.query(capabilityProbe, { target, capability: "event:manage" }),
  ).rejects.toMatchObject(unavailable);
  await expect(
    asIdentity(backend, "owner").query(capabilityProbe, {
      target,
      capability: "event:manage",
    }),
  ).resolves.toBeDefined();
});

test("denies nonmember and cross-event player mutations", async () => {
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  await expect(
    asIdentity(backend, "spectator").mutation(writeProbe, {
      target: { type: "event", id: fixture.event },
      capability: "event:manage",
    }),
  ).rejects.toMatchObject(unavailable);
  await expect(
    asIdentity(backend, "player").mutation(writeProbe, {
      target: { type: "event", id: fixture.otherEvent },
      capability: "event:register",
    }),
  ).rejects.toMatchObject(unavailable);
});

test("applies inherited and overridden event authority through division and match scope", async () => {
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  await backend.run(({ db }) =>
    db.insert("eventRoles", {
      eventId: fixture.event,
      userId: fixture.users.admin,
      role: "player",
    }),
  );
  for (const target of [
    { type: "division" as const, id: fixture.division },
    { type: "match" as const, id: fixture.match },
  ]) {
    await expect(
      asIdentity(backend, "member").query(capabilityProbe, {
        target,
        capability: "event:register",
      }),
    ).resolves.toBeDefined();
    await expect(
      asIdentity(backend, "admin").query(capabilityProbe, {
        target,
        capability: "event:register",
      }),
    ).resolves.toBeDefined();
    await expect(
      asIdentity(backend, "admin").query(capabilityProbe, {
        target,
        capability: "event:manage",
      }),
    ).rejects.toMatchObject(unavailable);
  }
});

test("returns exact preliminary match gates and marks further checks required", async () => {
  const expected: Record<string, MatchRoleGate[]> = {
    owner: [
      "staff-score",
      "staff-record",
      "staff-correct",
      "participant-record-candidate",
      "participant-sign-candidate",
    ],
    admin: ["staff-correct"],
    director: ["staff-score", "staff-record", "staff-correct"],
    scorer: ["staff-score", "staff-record"],
    member: ["participant-record-candidate", "participant-sign-candidate"],
    player: ["participant-record-candidate", "participant-sign-candidate"],
  };
  for (const [role, roleGates] of Object.entries(expected)) {
    const backend = createBackend();
    const fixture = await seedAuthz(backend);
    await expect(
      asIdentity(backend, role).query(matchGatesProbe, {
        matchId: fixture.match,
      }),
    ).resolves.toMatchObject({ roleGates, requiresOperationChecks: true });
  }
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  await expect(
    asIdentity(backend, "spectator").query(matchGatesProbe, {
      matchId: fixture.match,
    }),
  ).rejects.toMatchObject(unavailable);
});

test.each([
  ["director", ["staff-score", "staff-record", "staff-correct"]],
  ["scorer", ["staff-score", "staff-record"]],
] as const)("uses exact event-only %s match gates", async (role, roleGates) => {
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  await backend.run(({ db }) =>
    db.insert("eventRoles", {
      eventId: fixture.event,
      userId: fixture.users.spectator,
      role,
    }),
  );
  await expect(
    asIdentity(backend, "spectator").query(matchGatesProbe, {
      matchId: fixture.match,
    }),
  ).resolves.toMatchObject({ roleGates, requiresOperationChecks: true });
});

test("rejects client-supplied authority fields at the adapter boundary", async () => {
  const backend = createBackend();
  const fixture = await seedAuthz(backend);
  await expect(
    asIdentity(backend, "spectator").query(capabilityProbe, {
      target: { type: "org", id: fixture.org },
      capability: "org:read",
      userId: fixture.users.owner,
      role: "owner",
    } as never),
  ).rejects.toBeDefined();
});

function acceptsCapability(value: Parameters<typeof requireCapability>[2]) {
  return value;
}

test("keeps match role gates out of the capability API at compile time", () => {
  // @ts-expect-error match gates are not final operation capabilities
  expect(acceptsCapability("staff-score")).toBe("staff-score");
});
