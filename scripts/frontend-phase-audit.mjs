#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(process.cwd());
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const phaseIndex = process.argv.indexOf("--phase");
const phase = phaseIndex >= 0 ? process.argv[phaseIndex + 1] : "";

if (!["direction", "prototype", "release"].includes(phase)) {
  console.error(
    "Usage: node scripts/frontend-phase-audit.mjs --phase direction|prototype|release",
  );
  process.exit(2);
}

const documentNames = [
  "design-contract.md",
  "hero-concept.md",
  "asset-manifest.md",
];
const documents = {};
const failures = [];

for (const name of documentNames) {
  try {
    documents[name] = await readFile(
      path.join(root, "docs", "frontend", name),
      "utf8",
    );
  } catch {
    failures.push(`Missing docs/frontend/${name}`);
    documents[name] = "";
  }
}

function statusOf(source) {
  return (
    source
      .match(/^Status:[^\S\r\n]*([^\n]+)$/mu)?.[1]
      .trim()
      .toLowerCase() ?? ""
  );
}

function plainField(source, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return (
    source
      .match(new RegExp(`^${escaped}:[^\\S\\r\\n]*(.+)$`, "mu"))?.[1]
      .trim() ?? ""
  );
}

function field(source, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return (
    source
      .match(new RegExp(`^- ${escaped}:[^\\S\\r\\n]*(.+)$`, "mu"))?.[1]
      .trim() ?? ""
  );
}

function tableRows(source, heading, columns) {
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
    .filter((cells) => cells.length === columns && cells.every(Boolean));
}

function requireField(source, label, file) {
  if (!field(source, label)) failures.push(`${file} requires ${label}`);
}

function requireTable(source, heading, columns, minimum, file) {
  if (tableRows(source, heading, columns).length < minimum) {
    failures.push(
      `${file} requires ${minimum} complete ${heading} row${minimum === 1 ? "" : "s"}`,
    );
  }
}

function safeEvidence(relative, label) {
  if (!relative || path.isAbsolute(relative)) {
    failures.push(`${label} must be a repository-relative evidence path`);
    return;
  }
  const resolved = path.resolve(root, relative);
  const allowed = path.resolve(root, "docs", "frontend", "evidence");
  if (!resolved.startsWith(`${allowed}${path.sep}`) || !existsSync(resolved)) {
    failures.push(
      `${label} must exist under docs/frontend/evidence: ${relative}`,
    );
    return;
  }
  let current = root;
  for (const segment of path.relative(root, resolved).split(path.sep)) {
    current = path.join(current, segment);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) {
      failures.push(`${label} traverses a symbolic link: ${relative}`);
      return;
    }
  }
}

function runScript(name, args = []) {
  const result = spawnSync(
    process.execPath,
    [path.join(scriptDir, name), ...args],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 120000,
    },
  );
  if (result.status !== 0) {
    failures.push(
      `${name} failed: ${(result.stderr || result.stdout || `exit ${result.status}`).trim()}`,
    );
  }
}

function checkDirection() {
  const design = documents["design-contract.md"];
  const hero = documents["hero-concept.md"];
  const assets = documents["asset-manifest.md"];

  for (const [name, source] of Object.entries(documents)) {
    if (Number(plainField(source, "Pipeline version")) !== 2)
      failures.push(`${name} requires Pipeline version: 2`);
  }
  if (statusOf(design) !== "ready")
    failures.push(
      "design-contract.md must say Status: ready before implementation",
    );
  for (const label of [
    "Product",
    "Audience",
    "Primary user job",
    "Primary action",
    "Visual thesis",
    "Content narrative",
    "Selected direction",
    "Selected by",
    "Selection evidence",
  ]) {
    requireField(design, label, "design-contract.md");
  }
  if (field(design, "Selection status").toLowerCase() !== "approved")
    failures.push("design-contract.md requires Selection status: approved");
  for (const [heading, columns] of [
    ["Sources", 4],
    ["Reference Atlas", 4],
    ["Page Regions", 5],
    ["Page Rhythm Map", 5],
    ["Typography", 6],
    ["Color", 4],
    ["Breakpoints", 4],
  ]) {
    requireTable(design, heading, columns, 1, "design-contract.md");
  }
  requireTable(design, "Authorship Decisions", 3, 3, "design-contract.md");
  if (/net[- ]?new/iu.test(plainField(design, "Mode")))
    requireTable(design, "Concept Candidates", 5, 3, "design-contract.md");
  if (/- \[ \]/u.test(design))
    failures.push("design-contract.md has unchecked direction criteria");

  const experience = plainField(hero, "Experience type").toLowerCase();
  if (!["static", "functional", "cinematic", "spatial"].includes(experience))
    failures.push("hero-concept.md requires a valid Experience type");
  for (const label of [
    "Input",
    "Transformation",
    "Output",
    "User value demonstrated",
    "Selected rung",
    "Why this rung is necessary",
    "Rejected simpler options",
  ]) {
    requireField(hero, label, "hero-concept.md");
  }
  if (!/^Motion required:[^\S\r\n]*(?:yes|no)$/imu.test(hero))
    failures.push("hero-concept.md requires Motion required: yes or no");
  if (!plainField(hero, "Motion reason"))
    failures.push("hero-concept.md requires Motion reason");

  requireTable(assets, "Capability Plan", 7, 1, "asset-manifest.md");
  runScript("frontend-capability-preflight.mjs");
}

function checkPrototype() {
  checkDirection();
  const hero = documents["hero-concept.md"];
  const heroStatus = statusOf(hero);
  if (heroStatus === "not-applicable") return;
  if (heroStatus !== "ready")
    failures.push("hero-concept.md must say Status: ready before integration");
  const experience = plainField(hero, "Experience type").toLowerCase();
  requireTable(hero, "Storyboard", 5, 1, "hero-concept.md");
  if (["functional", "cinematic", "spatial"].includes(experience))
    requireTable(hero, "State Model", 5, 1, "hero-concept.md");
  const prototypeRequired = field(hero, "Prototype required").toLowerCase();
  if (
    ["functional", "cinematic", "spatial"].includes(experience) &&
    prototypeRequired !== "yes"
  )
    failures.push(`${experience} experience requires Prototype required: yes`);
  if (prototypeRequired === "yes") {
    for (const label of [
      "Prototype route/artifact",
      "Prototype acceptance criteria",
      "Prototype evidence",
      "Approved by",
    ])
      requireField(hero, label, "hero-concept.md");
    if (field(hero, "Prototype decision").toLowerCase() !== "passed")
      failures.push("hero-concept.md requires Prototype decision: passed");
    safeEvidence(field(hero, "Prototype evidence"), "Prototype evidence");
  }
  const rung = field(hero, "Selected rung");
  if (/frame-sequence|video|model-viewer|three|r3f|drei/iu.test(rung))
    requireTable(hero, "Advanced Asset Production", 5, 1, "hero-concept.md");
}

if (phase === "direction") checkDirection();
if (phase === "prototype") checkPrototype();
if (phase === "release") {
  checkPrototype();
  if (failures.length === 0) runScript("frontend-contract-audit.mjs");
}

const receiptPath = path.join(
  root,
  "test-results",
  "frontend-gates",
  `${phase}.json`,
);
const receiptDocuments = { ...documents };
if (phase === "release") {
  for (const name of ["route-map.json", "design-qa.md"]) {
    try {
      receiptDocuments[name] = await readFile(
        path.join(root, "docs", "frontend", name),
        "utf8",
      );
    } catch {
      failures.push(`Missing docs/frontend/${name} for release receipt`);
      receiptDocuments[name] = "";
    }
  }
}
const hashes = Object.fromEntries(
  Object.entries(receiptDocuments).map(([name, source]) => [
    name,
    createHash("sha256").update(source).digest("hex"),
  ]),
);
const receipt = {
  version: 1,
  phase,
  passed: failures.length === 0,
  generatedAt: new Date().toISOString(),
  documentHashes: hashes,
  failures,
};
await mkdir(path.dirname(receiptPath), { recursive: true });
await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);

if (failures.length) {
  console.error(`Frontend ${phase} gate failed:`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Frontend ${phase} gate passed: ${path.relative(root, receiptPath)}`,
);
