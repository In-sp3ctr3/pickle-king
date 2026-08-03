import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PNG } from "pngjs";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000/";

async function openSetup(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "No time limit" }).click();
}

async function fillPlayers(page: Page, players: Array<[string, string]>) {
  for (const [index, [name, rating]] of players.entries()) {
    await page.getByLabel("Player name").nth(index).fill(name);
    await page.getByLabel("Rating").nth(index).click();
    await page.getByRole("option", { name: rating, exact: true }).click();
  }
}

async function finishRecommendedMatch(page: Page, stage: string) {
  await page.locator("[data-qa='start-next']").click();
  await expect(page.getByText(stage, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start match", exact: true }).click();
  await page.locator("[data-qa='score-a-add']").click();
  await page.locator("[data-qa='score-a-add']").click();
  await expect(page.getByRole("dialog")).toContainText(stage);
  await page.getByRole("button", { name: "Confirm result" }).click();
}

async function expectPortraitPng(path: string | null) {
  if (!path) throw new Error("Downloaded PNG path was unavailable.");
  const png = PNG.sync.read(await readFile(path));
  expect({ width: png.width, height: png.height }).toEqual({
    width: 1080,
    height: 1350,
  });
  expect(png.data.some((channel) => channel !== 0)).toBe(true);
}

test("social draw pairs nearby ratings and bracket nodes rename stable players", async ({
  page,
}) => {
  await openSetup(page);
  await page.getByRole("button", { name: "Closer games", exact: true }).click();
  await fillPlayers(page, [
    ["Maya", "5.0"],
    ["Rae", "4.5"],
    ["Kai", "3.0"],
    ["Noah", "2.5"],
  ]);
  await page.getByRole("button", { name: "Build bracket" }).click();
  await expect(page.locator("[data-qa='bracket-node-start']")).toHaveCount(2);
  await expect(page.locator("[data-match-queue-state='next']")).toHaveCount(1);
  await expect(
    page.locator("[data-match-queue-state='available']"),
  ).toHaveCount(1);

  const closeRatedCard = page
    .locator(".tree-match-card")
    .filter({ hasText: "Maya" })
    .filter({ hasText: "Rae" });
  await expect(closeRatedCard).toHaveCount(1);
  await closeRatedCard.getByRole("button", { name: /Edit .* versus/ }).click();
  await page.getByLabel("Player name for Maya").fill("Maya Prime");
  await page.getByRole("button", { name: "Save corrected score" }).click();
  await expect(
    page.locator(".tree-match-card").filter({ hasText: "Maya Prime" }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Back to setup" }).click();
  await expect(page.getByLabel("Player name").first()).toHaveValue(
    "Maya Prime",
  );
});

test("completed tournament is static, shareable, and replayable", async ({
  page,
}) => {
  await openSetup(page);
  await fillPlayers(page, [
    ["Maya", "4.0"],
    ["Rae", "3.5"],
    ["Kai", "3.0"],
    ["Noah", "2.5"],
  ]);
  await page.getByLabel("Every match plays to", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Build bracket" }).click();
  for (const stage of ["Semifinal", "Semifinal", "Third place", "Final"]) {
    await finishRecommendedMatch(page, stage);
  }

  await expect(page.locator("[data-qa='results']")).toBeVisible();
  await expect(page.locator(".podium-medal")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Correct" })).toHaveCount(0);
  await page.getByRole("button", { name: "Share tournament" }).click();
  await expect(page.getByRole("dialog")).toContainText("Champion card");
  await expect(page.getByRole("dialog")).toContainText("Player stats");
  await expect(page.getByRole("dialog")).toContainText("Full bracket");
  await expect(page.locator("[data-qa='share-preview']")).toBeVisible();
  const recapDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download image" }).click();
  const recap = await recapDownload;
  await expectPortraitPng(await recap.path());
  await recap.saveAs("output/playwright/tournament-recap-card.png");
  await page.getByRole("tab", { name: /Player stats/ }).click();
  await expect(page.locator("[data-qa='share-preview']")).toHaveJSProperty(
    "naturalWidth",
    1080,
  );
  const statsDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download image" }).click();
  const stats = await statsDownload;
  await expectPortraitPng(await stats.path());
  await stats.saveAs("output/playwright/tournament-stats-card.png");
  await page.getByRole("button", { name: "Close share preview" }).click();

  await page.getByRole("button", { name: "Play again" }).click();
  await expect(page.getByRole("dialog")).toContainText("Replay same draw");
  await expect(page.getByRole("dialog")).toContainText("Create a new draw");
  await page.getByRole("button", { name: "Replay same draw" }).click();
  await expect(page.locator("[data-qa='bracket-screen']")).toBeVisible();
  await expect(page.locator("[data-match-status='complete']")).toHaveCount(0);
});

test("scorer keeps court tap and exposes explicit add and undo controls", async ({
  page,
}) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Quick match" }).click();
  await page.getByLabel("Side A").fill("Robbie");
  await page.getByLabel("Side B").fill("Maya");
  await page.getByRole("button", { name: "Open scorer" }).click();
  await page.getByRole("button", { name: "Start match", exact: true }).click();

  const side = page.locator(".score-side-a");
  await expect(
    side.getByRole("button", { name: "Add one point to Robbie" }),
  ).toBeVisible();
  await expect(
    side.getByRole("button", { name: "Undo one point from Robbie" }),
  ).toBeDisabled();
  await side.getByRole("button", { name: "Add one point to Robbie" }).click();
  await expect(side.locator(".score-number")).toContainText("1");
  await side
    .getByRole("button", { name: "Undo one point from Robbie" })
    .click();
  await expect(side.locator(".score-number")).toContainText("0");
  await expect(side.locator("[data-qa='score-a-add']")).toBeEnabled();
});
