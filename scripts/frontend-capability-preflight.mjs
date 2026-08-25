#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, lstatSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.cwd());
const manifestPath = path.join(root, "docs", "frontend", "asset-manifest.md");
const outputPath = path.join(
  root,
  "test-results",
  "frontend-capability-preflight.json",
);
const failures = [];

function tableRows(source, heading) {
  const section = source.split(`## ${heading}`)[1]?.split(/^##\s/mu)[0] ?? "";
  return section
    .split(/\r?\n/u)
    .filter((line) => line.startsWith("|"))
    .filter((line) => !/^\|\s*-+/u.test(line))
    .slice(1)
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    )
    .filter((cells) => cells.some(Boolean));
}

function capabilityId(label) {
  const explicit = label.match(/`([a-z0-9-]+)`/u)?.[1];
  if (explicit) return explicit;
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

function commandStatus(command, args = ["--version"]) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout: 5000 });
  if (result.error?.code === "ENOENT")
    return { status: "install-required", evidence: `${command} not found` };
  if (result.error)
    return {
      status: "verification-required",
      evidence: `${command} check failed: ${result.error.code ?? "error"}`,
    };
  return result.status === 0
    ? { status: "available", evidence: `${command} command check passed` }
    : {
        status: "verification-required",
        evidence: `${command} exited ${result.status}`,
      };
}

function packageStatus(packageJson, names) {
  const dependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  };
  const found = names.find((name) => dependencies[name]);
  return found
    ? {
        status: "available",
        evidence: `${found}@${dependencies[found]} declared`,
      }
    : {
        status: "install-required",
        evidence: `${names.join(" or ")} not declared`,
      };
}

function safeManualEvidence(value) {
  const relative = value.match(/(?:^|\s)manual:([^\s]+)/u)?.[1];
  if (!relative || path.isAbsolute(relative)) return null;
  const resolved = path.resolve(root, relative);
  const allowed = path.resolve(root, "docs", "frontend", "evidence");
  if (!resolved.startsWith(`${allowed}${path.sep}`) || !existsSync(resolved))
    return null;
  let current = root;
  for (const segment of path.relative(root, resolved).split(path.sep)) {
    current = path.join(current, segment);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) return null;
  }
  return relative;
}

let packageJson = {};
try {
  packageJson = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8"),
  );
} catch {
  failures.push("Missing or invalid package.json");
}

let manifest = "";
try {
  manifest = await readFile(manifestPath, "utf8");
} catch {
  failures.push("Missing docs/frontend/asset-manifest.md");
}

const detectors = {
  "dom-css": () => ({
    status: "available",
    evidence: "native browser capability",
  }),
  motion: () => packageStatus(packageJson, ["motion", "framer-motion"]),
  gsap: () => packageStatus(packageJson, ["gsap"]),
  rive: () =>
    packageStatus(packageJson, ["@rive-app/react-canvas", "@rive-app/canvas"]),
  lottie: () => packageStatus(packageJson, ["lottie-web", "lottie-react"]),
  "model-viewer": () => packageStatus(packageJson, ["@google/model-viewer"]),
  three: () => packageStatus(packageJson, ["three", "@react-three/fiber"]),
  playwright: () => packageStatus(packageJson, ["@playwright/test"]),
  sharp: () => packageStatus(packageJson, ["sharp"]),
  ffmpeg: () => commandStatus("ffmpeg", ["-version"]),
  blender: () => commandStatus("blender"),
  "21st": () => {
    const local = commandStatus("21st", ["whoami"]);
    return local.status === "available"
      ? {
          status: "verification-required",
          evidence:
            "local identity found; attach successful remote search evidence",
        }
      : local;
  },
};

const rows = tableRows(manifest, "Capability Plan");
if (rows.length === 0) failures.push("Capability Plan has no rows");
const results = [];

for (const cells of rows) {
  if (cells.length !== 7 || cells.some((cell) => !cell)) {
    failures.push(`Incomplete Capability Plan row: ${cells.join(" | ")}`);
    continue;
  }
  const [label, , claimedReadiness, , , verification, decision] = cells;
  const id = capabilityId(label);
  const detected = detectors[id]?.() ?? {
    status: "verification-required",
    evidence: "host/service capability requires repository evidence",
  };
  const manualEvidence = safeManualEvidence(verification);
  const effectiveStatus =
    detected.status === "verification-required" && manualEvidence
      ? "available"
      : detected.status;
  const normalizedDecision = decision.toLowerCase();
  const normalizedClaim = claimedReadiness.toLowerCase();

  if (["selected", "fallback"].includes(normalizedDecision)) {
    if (effectiveStatus !== "available") {
      failures.push(
        `${id} is ${detected.status}; selected/fallback use requires availability or manual evidence`,
      );
    }
    if (
      normalizedClaim !== "available" &&
      normalizedClaim !== "fallback-selected"
    ) {
      failures.push(
        `${id} has incompatible claimed readiness: ${normalizedClaim}`,
      );
    }
  }
  if (normalizedClaim === "available" && effectiveStatus !== "available") {
    failures.push(`${id} is claimed available but detected ${detected.status}`);
  }

  results.push({
    id,
    decision: normalizedDecision,
    claimedReadiness: normalizedClaim,
    detectedReadiness: detected.status,
    effectiveReadiness: effectiveStatus,
    evidence: manualEvidence ? `manual:${manualEvidence}` : detected.evidence,
  });
}

const report = {
  version: 1,
  passed: failures.length === 0,
  generatedAt: new Date().toISOString(),
  manifest: "docs/frontend/asset-manifest.md",
  results,
  failures,
};
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

if (failures.length) {
  console.error("Frontend capability preflight failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Frontend capability preflight passed: ${path.relative(root, outputPath)}`,
);
