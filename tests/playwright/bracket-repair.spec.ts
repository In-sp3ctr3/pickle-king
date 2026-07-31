import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";
const names = ["Maya", "Rae", "Kai", "Noah", "Luis", "Trent"];

async function openFresh(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "networkidle" });
}

async function buildTournament(page: Page, playerNames = names.slice(0, 4)) {
  await openFresh(page);
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "No time limit" }).click();
  while ((await page.getByLabel("Player name").count()) < playerNames.length) {
    await page.getByRole("button", { name: "Add another player" }).click();
  }
  for (let index = 0; index < playerNames.length; index += 1) {
    await page.getByLabel("Player name").nth(index).fill(playerNames[index]);
    await page.getByLabel("Rating").nth(index).click();
    await page.getByRole("option", { name: "3.5" }).click();
  }
  await page.getByLabel("Every match plays to", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Build bracket" }).click();
}

test("six entrants are explained as two automatic advances", async ({
  page,
}) => {
  await buildTournament(page, names);

  await expect(page.getByText("2 automatic advances")).toBeVisible();
  await expect(page.locator("[data-qa='automatic-advance']")).toHaveCount(2);
  await expect(page.getByText("No opponent this round")).toHaveCount(2);
  await expect(page.getByText("Championship", { exact: true })).toHaveCount(0);
  await expect(page.locator("[data-qa='final-status']")).toContainText(
    "Waiting",
  );
});

test("a completed result is corrected inside its bracket node", async ({
  page,
}) => {
  await buildTournament(page);
  await page.locator("[data-qa='bracket-node-start']").click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.locator("[data-qa='score-a-add']").click();
  await page.locator("[data-qa='score-a-add']").click();
  await page.getByRole("button", { name: "Confirm result" }).click();

  const completed = page.locator("[data-match-status='complete']").first();
  const contenders = await completed
    .locator(".tree-match-side__name")
    .allTextContents();
  await completed.getByRole("button", { name: /Edit score/ }).click();
  await completed
    .getByLabel(/Score for/)
    .first()
    .fill("0");
  await completed
    .getByLabel(/Score for/)
    .nth(1)
    .fill("2");
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: "output/playwright/inline-bracket-editor.png",
  });
  await completed.getByRole("button", { name: "Save corrected score" }).click();

  await expect(completed.locator(".tree-match-side--winner")).toContainText(
    contenders[1],
  );
  await expect(page.locator("[data-qa='final-faceoff']")).toContainText(
    contenders[1],
  );
  await expect(completed.getByLabel(/Score for/)).toHaveCount(0);

  await completed.getByRole("button", { name: /Edit score/ }).click();
  await completed
    .getByLabel(/Score for/)
    .first()
    .fill("");
  await expect(
    completed.getByRole("button", { name: "Save corrected score" }),
  ).toBeDisabled();
  await completed
    .getByLabel(/Score for/)
    .first()
    .fill("2");
  await expect(
    completed.getByRole("button", { name: "Save corrected score" }),
  ).toBeDisabled();
  await completed.getByLabel(`Award ${contenders[0]}`).check();
  await completed.getByRole("button", { name: "Save corrected score" }).click();
  await expect(completed.locator(".tree-match-side--winner")).toContainText(
    contenders[0],
  );

  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: "output/playwright/inline-bracket-correction.png",
  });
});
