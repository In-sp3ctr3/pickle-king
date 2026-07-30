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
const patterns = [
  { label: 'placeholder href="#"', expression: /href\s*=\s*["']#["']/u },
  { label: "empty href", expression: /href\s*=\s*["']\s*["']/u },
  {
    label: "empty click handler",
    expression: /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/u,
  },
  { label: "explicit dead-control marker", expression: /data-dead-control/u },
];
const failures = [];
let scannedFiles = 0;

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
    source.split(/\r?\n/u).forEach((line, index) => {
      for (const pattern of patterns) {
        if (pattern.expression.test(line)) {
          failures.push(
            `${path.relative(root, filePath)}:${index + 1} — ${pattern.label}`,
          );
        }
      }
    });
  }
}

await walk(root);

if (scannedFiles === 0) {
  console.error("Dead-control audit scanned no frontend source files.");
  process.exit(1);
}

if (failures.length) {
  console.error("Potential dead controls found:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Dead-control static audit passed (${scannedFiles} source files scanned).`,
);
