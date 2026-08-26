import { expect, type Page } from "@playwright/test";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import {
  chooseRating,
  completeScheduledMatches,
  confirmServeSetup,
  continueSavedResult,
  fillRoundRobinSetup,
} from "./small-field-harness";
import { quickHistoryFixture } from "./quick-history-fixture";
import type { Route, RouteMap } from "./frontend-route-types";

export type {
  CanvasCheck,
  Control,
  MotionCheck,
  Route,
} from "./frontend-route-types";

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
    await chooseRating(page, index, ratings[index]);
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
  if (route.prepare === "quick-history") {
    await page.addInitScript((history) => {
      localStorage.setItem("pickle-king:history", JSON.stringify(history));
    }, quickHistoryFixture());
  }
  const response = await page.goto(new URL(route.path, baseUrl).toString(), {
    waitUntil: "networkidle",
  });
  if (route.prepare === "tournament-setup") {
    await page.locator("[data-qa='start-tournament']").click();
  }
  if (
    route.prepare === "four-player-bracket" ||
    route.prepare === "four-player-completed-bracket" ||
    route.prepare === "four-player-completed-home" ||
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
    route.prepare === "round-robin-initial" ||
    route.prepare === "round-robin-qualified" ||
    route.prepare === "round-robin-completed" ||
    route.prepare === "round-robin-results" ||
    route.prepare === "round-robin-history-results"
  ) {
    await fillRoundRobinSetup(page);
  }
  if (route.prepare === "round-robin-five-initial") {
    await fillRoundRobinSetup(page, { playerCount: 5 });
  }
  if (route.prepare === "round-robin-six-timed-setup") {
    await fillRoundRobinSetup(page, {
      build: false,
      playerCount: 6,
      timed: true,
    });
    await expect(page.locator("[data-qa='setup-tight-warning']")).toBeVisible();
  }
  if (route.prepare === "round-robin-six-untimed-setup") {
    await fillRoundRobinSetup(page, { build: false, playerCount: 6 });
    await expect(page.locator("[data-qa='setup-tight-warning']")).toHaveCount(
      0,
    );
  }
  if (
    route.prepare === "round-robin-six-results" ||
    route.prepare === "round-robin-six-history-results"
  ) {
    await fillRoundRobinSetup(page, { playerCount: 6 });
    await completeScheduledMatches(page, 17);
    await expect(page.locator("[data-qa='results']")).toBeVisible();
  }
  if (route.prepare === "round-robin-six-history-results") {
    await page.locator("[data-qa='brand-home']").click();
    await page.locator("[data-qa='match-history']").click();
    await page.getByRole("button", { name: "View results" }).click();
    await expect(page.locator("[data-qa='results']")).toBeVisible();
  }
  if (route.prepare === "round-robin-qualified") {
    await completeScheduledMatches(page, 6);
    await expect(page.getByText("Positions confirmed")).toBeVisible();
  }
  if (
    route.prepare === "round-robin-completed" ||
    route.prepare === "round-robin-results" ||
    route.prepare === "round-robin-history-results"
  ) {
    await completeScheduledMatches(page, 8);
    await expect(page.locator("[data-qa='results']")).toBeVisible();
  }
  if (route.prepare === "round-robin-completed") {
    await page.locator("[data-qa='view-final-bracket']").click();
    await expect(page.locator("[data-qa='round-robin-screen']")).toBeVisible();
  }
  if (route.prepare === "round-robin-history-results") {
    await page.locator("[data-qa='brand-home']").click();
    await page.locator("[data-qa='match-history']").click();
    await page.getByRole("button", { name: "View results" }).click();
    await expect(page.locator("[data-qa='results']")).toBeVisible();
  }
  if (
    route.prepare === "four-player-results" ||
    route.prepare === "four-player-completed-bracket" ||
    route.prepare === "four-player-completed-home" ||
    route.prepare === "four-player-history" ||
    route.prepare === "four-player-history-results"
  ) {
    for (let match = 0; match < 4; match += 1) {
      await page.locator("[data-qa='start-next']").click();
      await page
        .getByRole("button", { name: "Start match", exact: true })
        .click();
      await confirmServeSetup(page);
      await page.locator("[data-qa='score-a-add']").click();
      await page.locator("[data-qa='score-a-add']").click();
      await page.locator("[data-qa='confirm-result']").click();
      await continueSavedResult(page);
    }
    await expect(page.locator("[data-qa='results']")).toBeVisible();
  }
  if (route.prepare === "four-player-completed-home") {
    await page.locator("[data-qa='brand-home']").click();
    await expect(page.locator("[data-qa='resume-tournament']")).toBeVisible();
  }
  if (route.prepare === "four-player-completed-bracket") {
    await page.locator("[data-qa='view-final-bracket']").click();
    await expect(page.locator("[data-qa='bracket-screen']")).toBeVisible();
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
  if (route.prepare === "quick-history") {
    await page.locator("[data-qa='match-history']").click();
    await expect(page.locator("[data-qa='history-screen']")).toBeVisible();
  }
  if (
    route.prepare === "quick-idle" ||
    route.prepare === "quick-live" ||
    route.prepare === "quick-result" ||
    route.prepare === "quick-result-saved"
  ) {
    await fillQuickMatch(
      page,
      route.prepare === "quick-result" || route.prepare === "quick-result-saved"
        ? 1
        : 11,
    );
  }
  if (
    route.prepare === "quick-live" ||
    route.prepare === "quick-result" ||
    route.prepare === "quick-result-saved"
  ) {
    await page
      .getByRole("button", { name: "Start match", exact: true })
      .click();
    await confirmServeSetup(page);
    await page.locator("[data-qa='score-a-add']").click();
    if (route.prepare === "quick-live") {
      await page.locator("[data-qa='score-b-add']").click();
    } else {
      await page.locator("[data-qa='score-a-add']").click();
      await expect(page.getByRole("dialog")).toBeVisible();
      if (route.prepare === "quick-result-saved") {
        await page.locator("[data-qa='confirm-result']").click();
        await expect(page.locator("[data-qa='result-saved']")).toBeVisible();
      }
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
