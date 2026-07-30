#!/usr/bin/env node

import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";

const root = realpathSync(process.cwd());
const routeMapPath = path.join(root, "docs/frontend/route-map.json");
const failures = [];
const seenPaths = {
  source: new Set(),
  render: new Set(),
  comparison: new Set(),
};

function recordUnique(role, resolved, key) {
  if (!resolved) return;
  if (seenPaths[role].has(resolved)) {
    failures.push(
      `${role} path is reused across evidence keys at ${key}: ${resolved}`,
    );
  }
  seenPaths[role].add(resolved);
}

function validatePath(relativePath, label, allowedRoot = null) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    failures.push(
      `${label} must be a repository-relative path: ${relativePath}`,
    );
    return null;
  }
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    failures.push(`${label} escapes the repository: ${relativePath}`);
    return null;
  }
  if (path.extname(resolved).toLowerCase() !== ".png") {
    failures.push(`${label} must be a PNG: ${relativePath}`);
  }
  if (allowedRoot) {
    const allowed = path.resolve(root, allowedRoot);
    if (!resolved.startsWith(`${allowed}${path.sep}`)) {
      failures.push(`${label} must be under ${allowedRoot}: ${relativePath}`);
    }
  }

  let current = root;
  for (const segment of path.relative(root, resolved).split(path.sep)) {
    current = path.join(current, segment);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) {
      failures.push(`${label} traverses a symbolic link: ${relativePath}`);
      return null;
    }
  }
  return resolved;
}

let routeMap;
try {
  routeMap = JSON.parse(readFileSync(routeMapPath, "utf8"));
} catch (error) {
  console.error(`Cannot read route-map.json: ${error.message}`);
  process.exit(1);
}

for (const route of routeMap.routes ?? []) {
  for (const viewport of routeMap.viewports ?? []) {
    const key = `${route.name}/${viewport.name}`;
    const evidence = route.visualEvidence?.[viewport.name];
    if (!evidence) {
      failures.push(`Missing visualEvidence for ${key}`);
      continue;
    }
    const source = validatePath(
      evidence.source,
      `Source for ${key}`,
      "docs/frontend/evidence",
    );
    const render = validatePath(
      evidence.render,
      `Render for ${key}`,
      "test-results/frontend-captures",
    );
    const comparison = validatePath(
      evidence.comparison,
      `Comparison for ${key}`,
      "test-results/frontend-comparisons",
    );
    if (
      source &&
      render &&
      comparison &&
      new Set([source, render, comparison]).size !== 3
    ) {
      failures.push(
        `Source, render, and comparison must be distinct for ${key}`,
      );
    }
    recordUnique("source", source, key);
    recordUnique("render", render, key);
    recordUnique("comparison", comparison, key);
  }
}

if (failures.length) {
  console.error("Frontend evidence preflight failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Frontend evidence preflight passed.");
