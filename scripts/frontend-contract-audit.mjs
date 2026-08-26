#!/usr/bin/env node

import { execFile } from "node:child_process";
import { existsSync, lstatSync } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const root = path.resolve(process.cwd());
const docsRoot = path.join(root, "docs", "frontend");
const failures = [];
const execFileAsync = promisify(execFile);

async function read(name) {
  try {
    return await readFile(path.join(docsRoot, name), "utf8");
  } catch {
    failures.push(`Missing docs/frontend/${name}`);
    return "";
  }
}

function statusOf(source) {
  return (
    source
      .match(/^Status:\s*([^\n]+)$/mu)?.[1]
      .trim()
      .toLowerCase() ?? ""
  );
}

function tableRows(source, heading) {
  const section = source.split(`## ${heading}`)[1]?.split(/^##\s/mu)[0] ?? "";
  return section
    .split(/\r?\n/u)
    .filter((line) => line.startsWith("|"))
    .filter((line) => !/^\|\s*-+/u.test(line))
    .filter((line, index) => index > 0)
    .filter((line) =>
      line
        .split("|")
        .slice(1, -1)
        .some((cell) => cell.trim()),
    );
}

function completeTableRows(source, heading, columns) {
  return tableRows(source, heading).filter((row) => {
    const cells = row
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    return cells.length === columns && cells.every(Boolean);
  });
}

function field(source, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return (
    source
      .match(new RegExp(`^- ${escaped}:[^\\S\\r\\n]*(.+)$`, "mu"))?.[1]
      .trim() ?? ""
  );
}

function plainField(source, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  return (
    source
      .match(new RegExp(`^${escaped}:[^\\S\\r\\n]*(.+)$`, "mu"))?.[1]
      .trim()
      .replace(/^`|`$/gu, "") ?? ""
  );
}

function pipelineVersion(source) {
  return Number(plainField(source, "Pipeline version"));
}

function cellsOf(row) {
  return row
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function safeDocumentPath(relativePath, label, allowedRoot) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    failures.push(
      `${label} must be a repository-relative path: ${relativePath}`,
    );
    return null;
  }
  const resolved = path.resolve(root, relativePath);
  const allowed = path.resolve(root, allowedRoot);
  if (
    !resolved.startsWith(`${allowed}${path.sep}`) ||
    path.extname(resolved).toLowerCase() !== ".md"
  ) {
    failures.push(
      `${label} must be a Markdown file under ${allowedRoot}: ${relativePath}`,
    );
    return null;
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

function safeEvidencePath(relativePath, label, allowedRoots = null) {
  if (
    !relativePath ||
    path.isAbsolute(relativePath) ||
    /^https?:\/\//u.test(relativePath)
  ) {
    failures.push(
      `${label} must be a repository-relative local path: ${relativePath}`,
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
    return null;
  }
  if (
    allowedRoots &&
    !allowedRoots.some((allowedRoot) =>
      resolved.startsWith(`${path.resolve(root, allowedRoot)}${path.sep}`),
    )
  ) {
    failures.push(
      `${label} must be under ${allowedRoots.join(" or ")}: ${relativePath}`,
    );
    return null;
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

const [design, hero, assets, qa, routeSource] = await Promise.all([
  read("design-contract.md"),
  read("hero-concept.md"),
  read("asset-manifest.md"),
  read("design-qa.md"),
  read("route-map.json"),
]);

for (const [name, source] of [
  ["design-contract.md", design],
  ["hero-concept.md", hero],
  ["asset-manifest.md", assets],
  ["design-qa.md", qa],
]) {
  if (pipelineVersion(source) !== 2)
    failures.push(`${name} must say \`Pipeline version: 2\``);
}

if (statusOf(design) !== "ready") {
  failures.push("design-contract.md must say `Status: ready`");
}
for (const label of [
  "Product",
  "Audience",
  "Primary user job",
  "Primary action",
]) {
  if (!field(design, label))
    failures.push(`design-contract.md requires ${label}`);
}
for (const label of [
  "Visual thesis",
  "Content narrative",
  "Selected direction",
  "Selected by",
  "Selection evidence",
]) {
  if (!field(design, label))
    failures.push(`design-contract.md requires ${label}`);
}
if (field(design, "Selection status").toLowerCase() !== "approved") {
  failures.push("design-contract.md requires `Selection status: approved`");
}
for (const [heading, columns] of [
  ["Sources", 4],
  ["Reference Atlas", 4],
  ["Page Regions", 5],
  ["Page Rhythm Map", 5],
  ["Typography", 6],
  ["Color", 4],
  ["Breakpoints", 4],
]) {
  if (completeTableRows(design, heading, columns).length === 0) {
    failures.push(`design-contract.md requires a complete ${heading} row`);
  }
}
const designAuthorshipRows = completeTableRows(
  design,
  "Authorship Decisions",
  3,
);
if (designAuthorshipRows.length < 3) {
  failures.push(
    "design-contract.md requires three complete Authorship Decisions rows",
  );
}
if (/net[- ]?new/iu.test(plainField(design, "Mode"))) {
  if (completeTableRows(design, "Concept Candidates", 5).length < 3) {
    failures.push(
      "Net-new mode requires three complete Concept Candidates rows",
    );
  }
}
if (/- \[ \]/u.test(design)) {
  failures.push("design-contract.md has unchecked acceptance criteria");
}

const heroStatus = statusOf(hero);
if (!["ready", "not-applicable"].includes(heroStatus)) {
  failures.push(
    "hero-concept.md must say `Status: ready` or `Status: not-applicable`",
  );
}
if (heroStatus === "not-applicable") {
  const reason = hero.match(/^Not applicable reason:\s*(.+)$/mu)?.[1].trim();
  if (!reason)
    failures.push("A not-applicable hero requires `Not applicable reason:`");
}
if (heroStatus === "ready") {
  if (!/^Motion required:\s*(?:yes|no)\s*$/imu.test(hero)) {
    failures.push(
      "hero-concept.md requires `Motion required: yes` or `Motion required: no`",
    );
  }
  if (!/^Motion reason:\s*.+$/mu.test(hero)) {
    failures.push("hero-concept.md requires a non-empty `Motion reason:`");
  }
  const experienceType = plainField(hero, "Experience type").toLowerCase();
  if (
    !["static", "functional", "cinematic", "spatial"].includes(experienceType)
  ) {
    failures.push(
      "hero-concept.md requires Experience type: static, functional, cinematic, or spatial",
    );
  }
  for (const label of [
    "Input",
    "Transformation",
    "Output",
    "User value demonstrated",
  ]) {
    if (!field(hero, label)) failures.push(`hero-concept.md requires ${label}`);
  }
  if (completeTableRows(hero, "Storyboard", 5).length === 0) {
    failures.push("hero-concept.md requires a complete Storyboard row");
  }
  if (
    ["functional", "cinematic", "spatial"].includes(experienceType) &&
    completeTableRows(hero, "State Model", 5).length === 0
  ) {
    failures.push(
      `${experienceType} hero experiences require a complete State Model row`,
    );
  }
  for (const label of [
    "Selected rung",
    "Why this rung is necessary",
    "Desktop",
    "Mobile",
    "`prefers-reduced-motion` behavior",
    "Static fallback",
    "Measurement",
  ]) {
    if (!field(hero, label)) failures.push(`hero-concept.md requires ${label}`);
  }
  const prototypeRequired = field(hero, "Prototype required").toLowerCase();
  if (!["yes", "no"].includes(prototypeRequired)) {
    failures.push(
      "hero-concept.md requires `Prototype required: yes` or `Prototype required: no`",
    );
  }
  if (
    ["functional", "cinematic", "spatial"].includes(experienceType) &&
    prototypeRequired !== "yes"
  ) {
    failures.push(
      `${experienceType} hero experiences require an isolated prototype`,
    );
  }
  if (prototypeRequired === "yes") {
    for (const label of [
      "Prototype route/artifact",
      "Prototype acceptance criteria",
      "Prototype evidence",
      "Approved by",
    ]) {
      if (!field(hero, label))
        failures.push(`hero-concept.md requires ${label}`);
    }
    if (field(hero, "Prototype decision").toLowerCase() !== "passed") {
      failures.push(
        "A required hero prototype must say `Prototype decision: passed`",
      );
    }
  }
  const selectedRung = field(hero, "Selected rung").toLowerCase();
  if (
    /frame-sequence|video/iu.test(selectedRung) &&
    !/^Motion required:\s*yes\s*$/imu.test(hero)
  ) {
    failures.push(
      "A frame-sequence/video hero requires `Motion required: yes`",
    );
  }
  if (/frame-sequence|video|model-viewer|three|r3f|drei/iu.test(selectedRung)) {
    if (completeTableRows(hero, "Advanced Asset Production", 5).length === 0) {
      failures.push(
        "The selected advanced representation requires an Advanced Asset Production row",
      );
    }
  }
}

if (statusOf(assets) !== "ready") {
  failures.push("asset-manifest.md must say `Status: ready`");
}
if (completeTableRows(assets, "Asset Register", 8).length === 0) {
  failures.push("asset-manifest.md requires a complete Asset Register row");
}
const capabilityRows = completeTableRows(assets, "Capability Plan", 7);
if (capabilityRows.length === 0) {
  failures.push("asset-manifest.md requires a complete Capability Plan row");
}
const readinessValues = new Set([
  "available",
  "install-required",
  "authentication-required",
  "paid-not-enabled",
  "verification-required",
  "fallback-selected",
  "not-needed",
]);
for (const row of capabilityRows) {
  const cells = cellsOf(row);
  const readiness = cells[2]?.toLowerCase();
  const decision = cells[6]?.toLowerCase();
  if (!readinessValues.has(readiness)) {
    failures.push(`Invalid capability readiness: ${readiness || "missing"}`);
  }
  if (!["selected", "fallback", "rejected", "not-needed"].includes(decision)) {
    failures.push(`Invalid capability decision: ${decision || "missing"}`);
  }
  if (decision === "selected" && readiness !== "available") {
    failures.push(
      `Selected capability must be available: ${cells[0] || "unnamed"}`,
    );
  }
  if (decision === "fallback" && readiness !== "fallback-selected") {
    failures.push(
      `Fallback capability must use fallback-selected readiness: ${cells[0] || "unnamed"}`,
    );
  }
}
if (
  !capabilityRows.some((row) =>
    ["selected", "fallback"].includes(cellsOf(row)[6]?.toLowerCase()),
  )
) {
  failures.push(
    "Capability Plan requires at least one selected or fallback decision",
  );
}

if (!/^Result:\s*passed\s*$/mu.test(qa)) {
  failures.push("design-qa.md must say `Result: passed`");
}
if (statusOf(qa) !== "passed") {
  failures.push("design-qa.md must say `Status: passed`");
}
if (/- \[ \]/u.test(qa))
  failures.push("design-qa.md has unchecked completion gates");
for (const label of [
  "Mechanism",
  "Availability/status",
  "Annotation/comment evidence",
  "Resolution evidence",
]) {
  if (!field(qa, label)) failures.push(`design-qa.md requires ${label}`);
}
if (
  !["browser-annotations", "screenshot-comments", "cross-host-bridge"].includes(
    field(qa, "Mechanism").toLowerCase(),
  )
) {
  failures.push("design-qa.md has an invalid feedback Mechanism");
}
const performanceRows = completeTableRows(qa, "Performance Evidence", 6);
if (performanceRows.length === 0) {
  failures.push("design-qa.md requires a complete Performance Evidence row");
}
for (const row of performanceRows) {
  const cells = cellsOf(row);
  const result = cells[5]?.toLowerCase();
  if (!/\d/u.test(cells[1]) || !/\d/u.test(cells[2])) {
    failures.push(
      `Performance evidence requires numeric target and result: ${cells[0] || "unnamed"}`,
    );
  }
  if (!["passed", "accepted-risk"].includes(result)) {
    failures.push(
      `Performance evidence must be passed or accepted-risk: ${result || "missing"}`,
    );
  }
}
const antiTemplateRows = completeTableRows(qa, "Anti-Template Review", 6);
if (antiTemplateRows.length === 0) {
  failures.push("design-qa.md requires a complete Anti-Template Review row");
}
for (const row of antiTemplateRows) {
  const result = cellsOf(row)[5]?.toLowerCase();
  if (
    !["closed", "fixed", "resolved", "passed", "none-observed"].includes(result)
  ) {
    failures.push(
      `Anti-template finding is unresolved: ${cellsOf(row)[0] || "unnamed"}`,
    );
  }
}
if (completeTableRows(qa, "Authorship Evidence", 3).length < 3) {
  failures.push(
    "design-qa.md requires three complete Authorship Evidence rows",
  );
}
if (/\|\s*P[012]\s*\|[^\n]*\|\s*(?:open|blocked|todo)\s*\|/iu.test(qa)) {
  failures.push("design-qa.md contains an open P0/P1/P2 finding");
}
if (plainField(qa, "Reviewer") !== "design_reviewer") {
  failures.push("design-qa.md must record `Reviewer: design_reviewer`");
}
if (plainField(qa, "Reviewer result") !== "passed") {
  failures.push("design-qa.md must record `Reviewer result: passed`");
}
const sourceState = field(qa, "Commit/source state");
if (!sourceState) failures.push("design-qa.md requires Commit/source state");
const reviewerEvidencePath = safeDocumentPath(
  plainField(qa, "Reviewer evidence"),
  "Reviewer evidence",
  "docs/frontend/reviews",
);
let designReview = "";
if (reviewerEvidencePath) {
  try {
    designReview = await readFile(reviewerEvidencePath, "utf8");
    if (plainField(designReview, "Reviewer") !== "design_reviewer") {
      failures.push("Design review evidence has the wrong reviewer");
    }
    if (plainField(designReview, "Result") !== "passed") {
      failures.push("Design review evidence must say `Result: passed`");
    }
    if (pipelineVersion(designReview) !== 2) {
      failures.push("Design review evidence must say `Pipeline version: 2`");
    }
    if (
      !sourceState ||
      plainField(designReview, "Source state") !== sourceState
    ) {
      failures.push(
        "Design review evidence source state does not match design-qa.md",
      );
    }
    for (const severity of ["P0", "P1", "P2"]) {
      if (plainField(designReview, `Open ${severity}`) !== "0") {
        failures.push(`Design review evidence must say Open ${severity}: 0`);
      }
    }
    for (const label of [
      "Source captures",
      "Render captures",
      "Combined comparisons",
    ]) {
      if (!field(designReview, label)) {
        failures.push(`Design review evidence requires ${label}`);
      }
    }
    for (const label of [
      "Anti-template evidence",
      "Authorship evidence",
      "Mobile art-direction evidence",
      "Signature-experience evidence",
    ]) {
      if (!field(designReview, label))
        failures.push(`Design review evidence requires ${label}`);
    }
    for (const row of tableRows(designReview, "Findings")) {
      const cells = row
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      const severity = cells[1]?.toUpperCase();
      const findingStatus = cells[5]?.toLowerCase();
      if (
        ["P0", "P1", "P2"].includes(severity) &&
        !["closed", "fixed", "resolved", "passed"].includes(findingStatus)
      ) {
        failures.push(
          `Design review evidence contains an unresolved ${severity} finding: ${cells[0] || "unnamed"}`,
        );
      }
    }
  } catch {
    failures.push(`Missing design review evidence: ${reviewerEvidencePath}`);
  }
}

const evidenceRows = tableRows(qa, "Evidence");
const evidenceRolePaths = {
  source: new Set(),
  render: new Set(),
  comparison: new Set(),
};
if (evidenceRows.length === 0) {
  failures.push("design-qa.md requires at least one complete evidence row");
} else {
  for (const row of evidenceRows) {
    const cells = row
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    const [route, viewport, source, render, comparison, interaction, axe] =
      cells;
    if (
      ![route, viewport, source, render, comparison, interaction, axe].every(
        Boolean,
      )
    ) {
      failures.push(`Incomplete design-qa evidence row: ${row}`);
      continue;
    }
    const sourceResolved = safeEvidencePath(source, "Source capture", [
      "docs/frontend/evidence",
    ]);
    const renderResolved = safeEvidencePath(render, "Render capture", [
      "test-results/frontend-captures",
    ]);
    const comparisonResolved = safeEvidencePath(
      comparison,
      "Combined comparison",
      ["test-results/frontend-comparisons"],
    );
    if (
      sourceResolved &&
      renderResolved &&
      comparisonResolved &&
      new Set([sourceResolved, renderResolved, comparisonResolved]).size !== 3
    ) {
      failures.push(
        `Source, render, and comparison paths must be distinct: ${row}`,
      );
    }
    if (sourceResolved) {
      if (evidenceRolePaths.source.has(sourceResolved)) {
        failures.push(
          `A source path is reused across evidence rows: ${sourceResolved}`,
        );
      }
      evidenceRolePaths.source.add(sourceResolved);
    }
    if (renderResolved) {
      if (evidenceRolePaths.render.has(renderResolved)) {
        failures.push(
          `A render path is reused across evidence rows: ${renderResolved}`,
        );
      }
      evidenceRolePaths.render.add(renderResolved);
    }
    if (comparisonResolved) {
      if (evidenceRolePaths.comparison.has(comparisonResolved)) {
        failures.push(
          `A comparison path is reused across evidence rows: ${comparisonResolved}`,
        );
      }
      evidenceRolePaths.comparison.add(comparisonResolved);
    }
    for (const evidencePath of [sourceResolved, renderResolved]) {
      if (!evidencePath) continue;
      try {
        await access(evidencePath);
      } catch {
        failures.push(`Missing QA evidence file: ${evidencePath}`);
      }
    }
    if (sourceResolved && renderResolved && comparisonResolved) {
      try {
        const { stdout } = await execFileAsync(process.execPath, [
          path.join(root, "scripts", "frontend-visual-compare.mjs"),
          "--source",
          sourceResolved,
          "--render",
          renderResolved,
          "--out",
          comparisonResolved,
        ]);
        console.log(`Visual comparison ${route} ${viewport}: ${stdout.trim()}`);
      } catch (error) {
        failures.push(
          `Visual comparison failed for ${route} ${viewport}: ${error.stderr?.trim() ?? error.message}`,
        );
      }
    }
  }
}

for (const sourcePath of evidenceRolePaths.source) {
  if (
    evidenceRolePaths.render.has(sourcePath) ||
    evidenceRolePaths.comparison.has(sourcePath)
  ) {
    failures.push(
      `A source path is reused for generated evidence: ${sourcePath}`,
    );
  }
}
for (const renderPath of evidenceRolePaths.render) {
  if (evidenceRolePaths.comparison.has(renderPath)) {
    failures.push(
      `A render path is reused as a comparison output: ${renderPath}`,
    );
  }
}

const researchRequired =
  /^Research required:\s*yes\s*$/imu.test(hero) && heroStatus === "ready";
if (
  researchRequired &&
  completeTableRows(assets, "Catalog and Library Research", 6).length === 0
) {
  failures.push(
    "The ready hero requires at least one catalog/library research row",
  );
}

if (
  /\|\s*generated\s*\|/iu.test(assets) &&
  completeTableRows(assets, "Generated Assets", 7).length === 0
) {
  failures.push("Generated assets require a completed Generated Assets row");
}

let routeMap;
try {
  routeMap = JSON.parse(routeSource);
} catch {
  failures.push("route-map.json is invalid JSON");
}

if (routeMap) {
  if (routeMap.version !== 2)
    failures.push("route-map.json requires version 2");
  if (!Array.isArray(routeMap.viewports) || routeMap.viewports.length === 0) {
    failures.push("route-map.json requires at least one viewport");
  }
  if (!Array.isArray(routeMap.routes) || routeMap.routes.length === 0) {
    failures.push("route-map.json requires at least one route");
  } else {
    for (const delegated of routeMap.globalDelegatedControlCoverage ?? []) {
      if (!delegated.name || !delegated.selector || !delegated.evidence) {
        failures.push(
          "Every global delegated control requires name, selector, and evidence",
        );
        continue;
      }
      if (!existsSync(path.resolve(root, delegated.evidence))) {
        failures.push(
          `Missing delegated control evidence: ${delegated.evidence}`,
        );
      }
    }
    for (const route of routeMap.routes) {
      if (!route.name || !route.path || !Array.isArray(route.controls)) {
        failures.push("Every route requires name, path, and controls");
      }
      if (
        !route.primaryActionSelector &&
        !String(route.primaryActionNotApplicableReason ?? "").trim()
      ) {
        failures.push(
          `Route ${route.name} requires primaryActionSelector or primaryActionNotApplicableReason`,
        );
      }
      if ((route.unlistedControlExemptions ?? []).length > 0) {
        failures.push(
          `Route ${route.name} uses unverified unlistedControlExemptions; map the control or cite delegated executable coverage`,
        );
      }
      for (const delegated of route.delegatedControlCoverage ?? []) {
        if (!delegated.name || !delegated.selector || !delegated.evidence) {
          failures.push(
            `Route ${route.name} has incomplete delegated control coverage`,
          );
          continue;
        }
        if (!existsSync(path.resolve(root, delegated.evidence))) {
          failures.push(
            `Missing delegated control evidence for ${route.name}: ${delegated.evidence}`,
          );
        }
      }
      if (
        route.primaryActionSelector &&
        !route.controls?.some(
          (control) => control.selector === route.primaryActionSelector,
        )
      ) {
        failures.push(
          `Route ${route.name} primary action must be represented in controls`,
        );
      }
      for (const control of route.controls ?? []) {
        if (!control.name || !control.selector || !control.action) {
          failures.push(`Route ${route.name} has an incomplete control`);
        }
        if (!control.expect || Object.keys(control.expect).length === 0) {
          failures.push(
            `Control ${route.name}/${control.name} requires a non-empty expect`,
          );
        }
        if (
          control.viewports &&
          (!Array.isArray(control.viewports) ||
            control.viewports.some(
              (name) =>
                !routeMap.viewports.some((viewport) => viewport.name === name),
            ))
        ) {
          failures.push(
            `Control ${route.name}/${control.name} has invalid viewports`,
          );
        }
      }
      for (const motionCheck of route.motionChecks ?? []) {
        const uniqueStates = new Set(motionCheck.requiredStates ?? []);
        const triggerControls = motionCheck.triggerSequence
          ? route.controls?.filter(
              (control) => control.sequence === motionCheck.triggerSequence,
            )
          : [];
        if (
          !motionCheck.name ||
          !motionCheck.selector ||
          !motionCheck.stateAttribute ||
          !Array.isArray(motionCheck.requiredStates) ||
          motionCheck.requiredStates.length < 2 ||
          uniqueStates.size !== motionCheck.requiredStates.length ||
          motionCheck.requiredStates.some((state) => !String(state).trim()) ||
          !motionCheck.reducedMotionState ||
          !Number.isFinite(motionCheck.observationMs) ||
          motionCheck.observationMs < 100 ||
          motionCheck.observationMs > 10000
        ) {
          failures.push(
            `Route ${route.name} has an incomplete motionChecks entry`,
          );
        }
        if (motionCheck.triggerSequence && triggerControls.length === 0) {
          failures.push(
            `Route ${route.name} motion check ${motionCheck.name} references an unknown triggerSequence`,
          );
        }
      }
      for (const canvasCheck of route.canvasChecks ?? []) {
        const selectors = [
          canvasCheck.canvasSelector,
          canvasCheck.semanticSelector,
          canvasCheck.fallbackSelector,
        ];
        const stateValues = [
          canvasCheck.activeValue,
          canvasCheck.pausedValue,
          canvasCheck.reducedValue,
          canvasCheck.fallbackValue,
        ];
        if (
          !canvasCheck.name ||
          !canvasCheck.canvasSelector ||
          !canvasCheck.semanticSelector ||
          !canvasCheck.fallbackSelector ||
          !canvasCheck.renderStateAttribute ||
          !canvasCheck.activeValue ||
          !canvasCheck.pausedValue ||
          !canvasCheck.reducedValue ||
          !canvasCheck.fallbackValue ||
          !canvasCheck.dprAttribute ||
          !Number.isFinite(canvasCheck.maxDpr) ||
          canvasCheck.maxDpr <= 0 ||
          new Set(selectors).size !== selectors.length ||
          new Set(stateValues).size !== stateValues.length
        ) {
          failures.push(
            `Route ${route.name} has an incomplete canvasChecks entry`,
          );
        }
      }
    }
  }

  const evidenceByKey = new Map();
  for (const row of evidenceRows) {
    const cells = row
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    const key = `${cells[0]}|${cells[1]}`;
    if (evidenceByKey.has(key))
      failures.push(`Duplicate design-qa evidence key: ${key}`);
    evidenceByKey.set(key, cells);
  }
  const expectedEvidenceCount =
    (routeMap.routes?.length ?? 0) * (routeMap.viewports?.length ?? 0);
  if (evidenceRows.length !== expectedEvidenceCount) {
    failures.push(
      `design-qa evidence row count must be ${expectedEvidenceCount}, found ${evidenceRows.length}`,
    );
  }
  for (const route of routeMap.routes ?? []) {
    for (const viewport of routeMap.viewports ?? []) {
      const key = `${route.name}|${viewport.name}`;
      const row = evidenceByKey.get(key);
      if (!row) {
        failures.push(
          `Missing design-qa evidence for route=${route.name}, viewport=${viewport.name}`,
        );
        continue;
      }
      const configured = route.visualEvidence?.[viewport.name];
      if (!configured) {
        failures.push(`Missing route-map visualEvidence for ${key}`);
        continue;
      }
      const [, , source, render, comparison, interaction, axe] = row;
      if (
        source !== configured.source ||
        render !== configured.render ||
        comparison !== configured.comparison
      ) {
        failures.push(
          `design-qa evidence paths do not match route-map visualEvidence for ${key}`,
        );
      }
      if (
        interaction.toLowerCase() !== "passed" ||
        axe.toLowerCase() !== "passed"
      ) {
        failures.push(`Interaction and Axe evidence must be passed for ${key}`);
      }
      const renderResolved = safeEvidencePath(
        render,
        `Render capture for ${key}`,
      );
      if (renderResolved) {
        try {
          const renderStat = await stat(renderResolved);
          if (Date.now() - renderStat.mtimeMs > 20 * 60 * 1000) {
            failures.push(`Render capture is stale for ${key}: ${render}`);
          }
        } catch {
          failures.push(`Missing current render capture for ${key}: ${render}`);
        }
      }
    }
  }
  const expectedKeys = new Set(
    (routeMap.routes ?? []).flatMap((route) =>
      (routeMap.viewports ?? []).map(
        (viewport) => `${route.name}|${viewport.name}`,
      ),
    ),
  );
  for (const key of evidenceByKey.keys()) {
    if (!expectedKeys.has(key))
      failures.push(`Unexpected design-qa evidence key: ${key}`);
  }
  if (designReview) {
    for (const [role, column] of [
      ["source", 2],
      ["render", 3],
      ["comparison", 4],
    ]) {
      const declared = designReview;
      for (const cells of evidenceByKey.values()) {
        const expectedPath = cells[column];
        if (expectedPath && !declared.includes(expectedPath)) {
          failures.push(
            `Design review ${role} evidence does not cite current QA path: ${expectedPath}`,
          );
        }
      }
    }
  }

  const selectedHeroRung = [
    field(hero, "Selected rung"),
    field(hero, "Why this rung is necessary"),
  ].join(" ");
  const usesWebgl =
    heroStatus === "ready" &&
    /\b(?:three\.js|react three fiber|r3f|drei|webgl)\b/iu.test(
      selectedHeroRung,
    );
  if (
    usesWebgl &&
    !routeMap.routes?.some(
      (route) =>
        Array.isArray(route.canvasChecks) && route.canvasChecks.length > 0,
    )
  ) {
    failures.push(
      "A WebGL hero requires at least one route-map canvasChecks entry",
    );
  }
  if (
    heroStatus === "ready" &&
    /^Motion required:\s*yes\s*$/imu.test(hero) &&
    !routeMap.routes?.some(
      (route) =>
        Array.isArray(route.motionChecks) && route.motionChecks.length > 0,
    )
  ) {
    failures.push("A ready animated hero requires route-map motionChecks");
  }
}

if (failures.length) {
  console.error("Frontend contract audit failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Frontend contract audit passed.");
