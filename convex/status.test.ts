/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.{js,ts}");

test("reports deterministic backend connectivity", async () => {
  const backend = convexTest(undefined, modules);

  await expect(backend.query(api.status.health)).resolves.toBe("ready");
});
