import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

async function finishTournament(page: Page) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(baseUrl);
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "No time limit" }).click();
  for (const [index, name] of ["Maya", "Rae", "Kai", "Noah"].entries()) {
    await page.getByLabel("Player name").nth(index).fill(name);
    await page.getByLabel("Rating").nth(index).click();
    await page.getByRole("option", { name: "3.5", exact: true }).click();
  }
  await page.getByLabel("Every match plays to", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Build bracket" }).click();
  for (let index = 0; index < 4; index += 1) {
    await page.locator("[data-qa='start-next']").click();
    await page
      .getByRole("button", { name: "Start match", exact: true })
      .click();
    await page.locator("[data-qa='confirm-serve-setup']").click();
    await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
    await page.getByRole("button", { name: "Confirm result" }).click();
    await page.locator("[data-qa='continue-saved-result']").click();
  }
}

test("completed results reopen from the bracket and home", async ({ page }) => {
  await finishTournament(page);
  await page.getByRole("button", { name: "Review bracket" }).click();
  await page.getByRole("button", { name: "View results" }).click();
  await expect(page.locator("[data-qa='results']")).toBeVisible();
  await page.locator("[data-qa='brand-home']").click();
  await expect(
    page.getByRole("button", { name: "View tournament results" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View tournament results" }).click();
  await expect(page.locator("[data-qa='results']")).toBeVisible();
});
