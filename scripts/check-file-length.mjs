import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignored = new Set([
  ".git",
  ".next",
  ".vinext",
  "coverage",
  "dist",
  "node_modules",
  "test-results",
]);
const extensions = new Set([".ts", ".tsx"]);
const generatedExceptions = new Set([
  "tests/playwright/frontend-harness.spec.ts",
]);
const violations = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(absolute);
      continue;
    }
    if (!extensions.has(path.extname(entry.name))) continue;
    if (generatedExceptions.has(path.relative(root, absolute))) continue;
    const source = await readFile(absolute, "utf8");
    const logicalLines = source
      .split(/\r?\n/)
      .filter(
        (line) => line.trim() && !line.trimStart().startsWith("//"),
      ).length;
    if (logicalLines > 300) {
      violations.push(`${path.relative(root, absolute)}: ${logicalLines}`);
    }
  }
}

await walk(root);
if (violations.length) {
  console.error("Hand-authored TypeScript files exceed 300 logical lines:");
  console.error(violations.join("\n"));
  process.exit(1);
}
console.log("TypeScript file-length gate passed.");
