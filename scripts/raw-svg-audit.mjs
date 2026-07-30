#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.cwd());
const extensions = new Set([
  ".astro",
  ".html",
  ".js",
  ".jsx",
  ".mdx",
  ".svelte",
  ".ts",
  ".tsx",
  ".vue",
]);
const ignoredDirectories = new Set([
  ".git",
  ".next",
  "build",
  "coverage",
  "dist",
  "docs",
  "node_modules",
  "public",
  "scripts",
  "test-results",
  "tests",
]);
const failures = [];
let scannedFiles = 0;
let manifest = "";

try {
  manifest = await readFile(
    path.join(root, "docs/frontend/asset-manifest.md"),
    "utf8",
  );
} catch {
  // The contract audit reports the missing manifest.
}

async function walk(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(filePath);
      continue;
    }
    if (!extensions.has(path.extname(entry.name))) continue;
    scannedFiles += 1;

    const source = await readFile(filePath, "utf8");
    const lines = source.split(/\r?\n/u);
    lines.forEach((line, index) => {
      if (!/<svg(?:\s|>)/u.test(line)) return;
      const relativePath = path.relative(root, filePath);
      const approvedMarker = line.includes('data-asset-policy="approved"');
      if (!approvedMarker || !manifest.includes(relativePath)) {
        failures.push(`${relativePath}:${index + 1}`);
      }
    });
  }
}

await walk(root);

if (scannedFiles === 0) {
  console.error("Raw SVG audit scanned no frontend source files.");
  process.exit(1);
}

if (failures.length) {
  console.error(
    "Raw inline SVG found. Use an approved registry/asset or document the exception:",
  );
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Raw SVG audit passed (${scannedFiles} source files scanned).`);
