import { expect, test, type Page } from "@playwright/test";
import { confirmServeSetup, continueSavedResult } from "./small-field-harness";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

async function buildCompletedDraw(page: Page) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "No time limit" }).click();
  for (const [index, name] of [
    "Robbie",
    "Jadan",
    "Brad",
    "Samantha",
  ].entries()) {
    await page.getByLabel("Player name").nth(index).fill(name);
    await page.getByLabel("Rating").nth(index).click();
    await page.getByRole("option", { name: "3.5", exact: true }).click();
  }
  await page.getByLabel("Every match plays to", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Build bracket" }).click();
  for (let match = 0; match < 4; match += 1) {
    await page.locator("[data-qa='start-next']").click();
    await page
      .getByRole("button", { name: "Start match", exact: true })
      .click();
    await confirmServeSetup(page);
    await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
    await page.locator("[data-qa='confirm-result']").click();
    await continueSavedResult(page);
  }
  await page.locator("[data-qa='view-final-bracket']").click();
}

test("a completed bracket rename changes labels without reopening matches", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await buildCompletedDraw(page);
  const bronze = page.locator("[data-qa='bronze-match']");
  const final = page.locator("[data-qa='final-match']");
  const [bronzeScores, finalScores] = await Promise.all([
    bronze.locator("strong").allTextContents(),
    final.locator("strong").allTextContents(),
  ]);
  const semifinal = page
    .locator("[data-match-status='complete']")
    .filter({ hasText: "Robbie" })
    .first();
  await semifinal.getByRole("button", { name: /Edit .* versus/ }).click();
  const name = page.getByLabel("Player name for Robbie");
  await name.fill("Smithy");
  await page.getByRole("button", { name: "Save corrected score" }).click();

  await expect(page.locator("[data-match-status='complete']")).toHaveCount(4);
  await expect(bronze.locator("article")).toHaveAttribute(
    "data-match-status",
    "complete",
  );
  await expect(final.locator("article")).toHaveAttribute(
    "data-match-status",
    "complete",
  );
  expect(await bronze.locator("strong").allTextContents()).toEqual(
    bronzeScores,
  );
  expect(await final.locator("strong").allTextContents()).toEqual(finalScores);
  await expect(page.locator("[data-qa='bracket-screen']")).not.toContainText(
    "Robbie",
  );
  await expect(page.locator("[data-qa='bracket-screen']")).toContainText(
    "Smithy",
  );
  await expect(
    page.getByRole("button", { name: "View results" }),
  ).toBeVisible();
});
