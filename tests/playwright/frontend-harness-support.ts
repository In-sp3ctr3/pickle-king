import { expect, type Page } from "@playwright/test";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";

export type ExpectedOutcome = {
  url?: string;
  visible?: string;
  text?: { selector: string; value: string };
};

export type Control = {
  name: string;
  selector: string;
  viewports?: string[];
  sequence?: string;
  action: "click" | "fill" | "press" | "check" | "select";
  auditOnly?: boolean;
  value?: string;
  expect: ExpectedOutcome;
};

export type MotionCheck = {
  name: string;
  selector: string;
  stateAttribute: string;
  requiredStates: string[];
  reducedMotionState: string;
  observationMs: number;
  triggerSequence?: string;
};

export type CanvasCheck = {
  name: string;
  canvasSelector: string;
  semanticSelector: string;
  fallbackSelector: string;
  renderStateAttribute: string;
  activeValue: string;
  pausedValue: string;
  reducedValue: string;
  fallbackValue: string;
  dprAttribute: string;
  maxDpr: number;
};

export type Route = {
  name: string;
  path: string;
  prepare?:
    | "tournament-setup"
    | "four-player-bracket"
    | "four-player-history"
    | "four-player-history-results"
    | "four-player-results"
    | "quick-setup"
    | "quick-idle"
    | "quick-live"
    | "quick-result"
    | "history-empty";
  primaryActionSelector?: string;
  primaryActionNotApplicableReason?: string;
  visualEvidence: Record<
    string,
    { source: string; render: string; comparison: string }
  >;
  controls: Control[];
  motionChecks?: MotionCheck[];
  reducedMotionChecks?: Array<{
    name: string;
    selector: string;
    expect: "visible" | "hidden";
  }>;
  canvasChecks?: CanvasCheck[];
};

type RouteMap = {
  baseUrl?: string;
  viewports: Array<{ name: string; width: number; height: number }>;
  routes: Route[];
};

export const routeMap = JSON.parse(
  readFileSync(path.resolve("docs/frontend/route-map.json"), "utf8"),
) as RouteMap;
const baseUrl =
  process.env.FRONTEND_BASE_URL ?? routeMap.baseUrl ?? "http://127.0.0.1:3000";
const repositoryRoot = realpathSync(process.cwd());

async function fillFourPlayerSetup(page: Page, target = 11) {
  await page.locator("[data-qa='start-tournament']").click();
  await page.getByRole("button", { name: "No time limit" }).click();
  const names = ["Maya", "Rae", "Kai", "Noah"];
  const ratings = ["5.5+", "4.5", "3.5", "2.5"];
  for (let index = 0; index < names.length; index += 1) {
    await page.getByLabel("Player name").nth(index).fill(names[index]);
    await page.getByLabel("Rating").nth(index).click();
    await page.keyboard.type(ratings[index]);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toBeHidden();
  }
  await page
    .getByRole("spinbutton", {
      name: "Every match plays to",
      exact: true,
    })
    .fill(String(target));
  await page.locator("[data-qa='build-bracket']").click();
}

async function fillQuickMatch(page: Page, target = 11) {
  await page.locator("[data-qa='quick-match']").click();
  await page.getByLabel("Side A").fill("Alex");
  await page.getByLabel("Side B").fill("Blair");
  await page.getByLabel("Play to").fill(String(target));
  await page.getByRole("button", { name: "Open scorer" }).click();
}

export async function openRoute(page: Page, route: Route) {
  const response = await page.goto(new URL(route.path, baseUrl).toString(), {
    waitUntil: "networkidle",
  });
  if (route.prepare === "tournament-setup") {
    await page.locator("[data-qa='start-tournament']").click();
  }
  if (
    route.prepare === "four-player-bracket" ||
    route.prepare === "four-player-history" ||
    route.prepare === "four-player-history-results" ||
    route.prepare === "four-player-results"
  ) {
    await fillFourPlayerSetup(
      page,
      route.prepare === "four-player-bracket" ? 11 : 1,
    );
    await expect(page.locator("[data-qa='bracket-screen']")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  if (
    route.prepare === "four-player-results" ||
    route.prepare === "four-player-history" ||
    route.prepare === "four-player-history-results"
  ) {
    for (let match = 0; match < 4; match += 1) {
      await page.locator("[data-qa='start-next']").click();
      await page
        .getByRole("button", { name: "Start match", exact: true })
        .click();
      await page.locator("[data-qa='score-a-add']").click();
      await page.locator("[data-qa='score-a-add']").click();
      await page.locator("[data-qa='confirm-result']").click();
    }
    await expect(page.locator("[data-qa='results']")).toBeVisible();
  }
  if (
    route.prepare === "four-player-history" ||
    route.prepare === "four-player-history-results"
  ) {
    await page.locator("[data-qa='brand-home']").click();
    await page.locator("[data-qa='match-history']").click();
    await expect(page.locator("[data-qa='history-screen']")).toBeVisible();
  }
  if (route.prepare === "four-player-history-results") {
    await page.getByRole("button", { name: "View results" }).click();
    await expect(page.locator("[data-qa='results']")).toBeVisible();
  }
  if (route.prepare === "quick-setup") {
    await page.locator("[data-qa='quick-match']").click();
  }
  if (route.prepare === "history-empty") {
    await page.locator("[data-qa='match-history']").click();
  }
  if (
    route.prepare === "quick-idle" ||
    route.prepare === "quick-live" ||
    route.prepare === "quick-result"
  ) {
    await fillQuickMatch(page, route.prepare === "quick-result" ? 1 : 11);
  }
  if (route.prepare === "quick-live" || route.prepare === "quick-result") {
    await page
      .getByRole("button", { name: "Start match", exact: true })
      .click();
    await page.locator("[data-qa='score-a-add']").click();
    if (route.prepare === "quick-live") {
      await page.locator("[data-qa='score-b-add']").click();
    } else {
      await page.locator("[data-qa='score-a-add']").click();
      await expect(page.getByRole("dialog")).toBeVisible();
    }
  }
  return response;
}

export function safeRenderPath(relativePath: string) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`Render path must be repository-relative: ${relativePath}`);
  }
  const resolved = path.resolve(repositoryRoot, relativePath);
  const allowed = path.resolve(
    repositoryRoot,
    "test-results/frontend-captures",
  );
  if (!resolved.startsWith(`${allowed}${path.sep}`)) {
    throw new Error(
      `Render path must stay under test-results/frontend-captures: ${relativePath}`,
    );
  }
  let current = repositoryRoot;
  for (const segment of path
    .relative(repositoryRoot, resolved)
    .split(path.sep)) {
    current = path.join(current, segment);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) {
      throw new Error(`Render path traverses a symbolic link: ${relativePath}`);
    }
  }
  return resolved;
}
