/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { api } from "./_generated/api";
import { addUser, asIdentity, identityProbe } from "./authz.test-fixtures";
import { createBackend } from "./schema.test-fixtures";
import { expect, test } from "vitest";

const denied = { data: { code: "AUTH_REQUIRED" } };

test("denies absent, malformed, and unprovisioned identities", async () => {
  const backend = createBackend();
  await expect(backend.query(identityProbe, {})).rejects.toMatchObject(denied);
  await expect(
    backend.withIdentity({ subject: "" }).query(identityProbe, {}),
  ).rejects.toMatchObject(denied);
  await expect(
    backend.withIdentity({ subject: " clerk " }).query(identityProbe, {}),
  ).rejects.toMatchObject(denied);
  await expect(
    asIdentity(backend, "unprovisioned").query(identityProbe, {}),
  ).rejects.toMatchObject(denied);
});

test("denies incomplete, deleted, and duplicate Pickle King users", async () => {
  const incomplete = createBackend();
  await addUser(incomplete, "incomplete", { incomplete: true });
  await expect(
    asIdentity(incomplete, "incomplete").query(identityProbe, {}),
  ).rejects.toMatchObject(denied);

  const deleted = createBackend();
  await addUser(deleted, "deleted", { deletedAt: 2 });
  await expect(
    asIdentity(deleted, "deleted").query(identityProbe, {}),
  ).rejects.toMatchObject(denied);

  const duplicate = createBackend();
  await addUser(duplicate, "duplicate");
  await addUser(duplicate, "duplicate");
  await expect(
    asIdentity(duplicate, "duplicate").query(identityProbe, {}),
  ).rejects.toMatchObject(denied);
});

test("resolves one complete active user by the indexed Clerk subject", async () => {
  const backend = createBackend();
  const userId = await addUser(backend, "active");

  await expect(
    asIdentity(backend, "active").query(identityProbe, {}),
  ).resolves.toBe(userId);
});

test("keeps the intentional public health query unauthenticated", async () => {
  const backend = createBackend();
  await expect(backend.query(api.status.health)).resolves.toBe("ready");
});
