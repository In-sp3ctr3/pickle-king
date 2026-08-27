import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const specs = path.join(root, "specs");
const requiredArtifacts = ["spec.md", "plan.md", "tasks.md", "verification.md"];

test("feature workspaces remain routable and internally consistent", async () => {
  const entries = await readdir(specs, { withFileTypes: true });
  const workspaces = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const router = await readFile(path.join(specs, "README.md"), "utf8");

  for (const workspace of workspaces) {
    for (const artifact of requiredArtifacts) {
      await assert.doesNotReject(
        readFile(path.join(specs, workspace, artifact), "utf8"),
        `${workspace} is missing ${artifact}`,
      );
    }

    assert.match(
      router,
      new RegExp(`\\(\\./${workspace}/spec\\.md\\)`),
      `${workspace} is missing from specs/README.md`,
    );

    const verification = await readFile(
      path.join(specs, workspace, "verification.md"),
      "utf8",
    );
    const gates = await readFile(
      path.join(specs, workspace, "gates.md"),
      "utf8",
    ).catch(() => "");
    const releaseRow = gates
      .split("\n")
      .find((line) => /^\|\s*Release\s*\|/i.test(line));

    if (/^Status:\s*complete\s*$/im.test(verification) && releaseRow) {
      assert.doesNotMatch(
        releaseRow,
        /\bblocked\b/i,
        `${workspace} says verification is complete but its release gate is blocked`,
      );
    }
  }
});
