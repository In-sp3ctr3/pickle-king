import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { confirmServeSetup } from "./small-field-harness";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

async function openFresh(page: Page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
}

async function buildRoundRobin(page: Page, playerCount = 4) {
  await openFresh(page);
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "No time limit" }).click();
  const names = ["Maya", "Rae", "Kai", "Noah", "Ari", "Zoe"];
  const ratings = ["5.5+", "4.5", "4.0", "3.5", "3.0", "2.5"];
  for (let index = 4; index < playerCount; index += 1) {
    await page.getByRole("button", { name: "Add another player" }).click();
  }
  for (let index = 0; index < playerCount; index += 1) {
    await page.getByLabel("Player name").nth(index).fill(names[index]);
    await page.getByLabel("Rating").nth(index).click();
    await page
      .getByRole("option", { name: ratings[index], exact: true })
      .click();
  }
  await page.getByRole("button", { name: /Round robin \+ finals/i }).click();
  await page
    .getByRole("spinbutton", { name: "Every match plays to", exact: true })
    .fill("1");
  await page.getByRole("button", { name: "Build tournament" }).click();
  await expect(page.locator("[data-qa='round-robin-screen']")).toBeVisible();
}

async function completeNext(page: Page) {
  await page.locator("[data-qa='start-next']").click();
  await page.getByRole("button", { name: "Start match", exact: true }).click();
  await confirmServeSetup(page);
  await page.locator("[data-qa='score-a-add']").click();
  await page.locator("[data-qa='score-a-add']").click();
  await page.locator("[data-qa='confirm-result']").click();
}

test("a seventh player falls back to fast knockout with an announcement", async ({
  page,
}) => {
  await openFresh(page);
  await page.getByRole("button", { name: "Start tournament" }).click();
  const roundRobin = page.getByRole("button", {
    name: /Round robin \+ finals/i,
  });
  await roundRobin.click();
  await page.getByRole("button", { name: "Add another player" }).click();
  await expect(roundRobin).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Add another player" }).click();
  await expect(roundRobin).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Add another player" }).click();

  await expect(
    page.getByRole("button", { name: /Fast knockout/i }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(roundRobin).toBeDisabled();
  await expect(page.getByRole("status")).toContainText(
    "Fast knockout selected because round robin + finals supports 4–6 players.",
  );
});

test("timed six-player setup warns below eight minutes but untimed does not", async ({
  page,
}) => {
  await openFresh(page);
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "Add another player" }).click();
  await page.getByRole("button", { name: "Add another player" }).click();
  await page.getByRole("button", { name: /Round robin \+ finals/i }).click();
  await expect(page.getByText(/Tight timed schedule/i)).toContainText(
    "Tight timed schedule · 5 min 31 sec per match.",
  );
  await page.getByRole("button", { name: "No time limit" }).click();
  await expect(
    page.locator(".setup-submit-row").getByText("17 matches · 5–6 per player"),
  ).toBeVisible();
  await expect(page.getByText(/Tight timed schedule/i)).toHaveCount(0);
});

test("a five-player field rotates one resting player through five rounds", async ({
  page,
}) => {
  await buildRoundRobin(page, 5);
  await expect(
    page.locator(".round-robin-screen .tree-match-card"),
  ).toHaveCount(12);
  const resting = page.getByText(/Resting this round:/i);
  await expect(resting).toHaveCount(5);
  expect(new Set(await resting.allTextContents()).size).toBe(5);
  for (let match = 0; match < 12; match += 1) await completeNext(page);
  await expect(page.locator("[data-qa='results']")).toBeVisible();
  await expect(page.getByText("Round-robin standings")).toBeVisible();
});

test("the 17-match schedule refreshes, corrects placements, archives, shares, and replays", async ({
  page,
}) => {
  await buildRoundRobin(page, 6);
  await expect(
    page.locator(".round-robin-screen .tree-match-card"),
  ).toHaveCount(17);
  await expect(page.getByText("0 of 17 matches complete")).toBeVisible();
  await expect(page.getByText("1st in standings")).toBeVisible();
  await expect(page.getByText("3rd in standings")).toBeVisible();

  await completeNext(page);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("1 of 17 matches complete")).toBeVisible();
  await page.locator("[data-qa='brand-home']").click();
  await page.locator("[data-qa='resume-tournament']").click();
  await expect(page.locator("[data-qa='round-robin-screen']")).toBeVisible();

  for (let match = 1; match < 16; match += 1) await completeNext(page);
  await expect(page.getByText("Positions confirmed")).toBeVisible();
  await expect(page.getByText("16 of 17 matches complete")).toBeVisible();

  const firstPreliminary = page
    .locator(".round-robin-round")
    .first()
    .locator(".tree-match-card")
    .first();
  await firstPreliminary.locator("[data-qa='edit-bracket-match']").click();
  const scoreInputs = firstPreliminary.locator("input[type='number']");
  await scoreInputs.nth(0).fill("0");
  await scoreInputs.nth(1).fill("2");
  page.once("dialog", (dialog) => dialog.accept());
  await firstPreliminary
    .getByRole("button", { name: "Save corrected score" })
    .click();
  await expect(page.getByText("15 of 17 matches complete")).toBeVisible();
  await expect(
    page.locator(
      ".round-robin-placements .tree-match-card[data-match-status='complete']",
    ),
  ).toHaveCount(0);

  await completeNext(page);
  await completeNext(page);
  await expect(page.locator("[data-qa='results']")).toBeVisible();
  await expect(page.getByText("Round-robin standings")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  const shareTrigger = page.locator("[data-qa='share-tournament']");
  await shareTrigger.click();
  const share = page.getByRole("dialog", { name: "Share tournament" });
  await expect(share.getByRole("tab")).toHaveCount(2);
  await expect(share.getByRole("tab", { name: "Full bracket" })).toHaveCount(0);
  await share.getByRole("button", { name: "Close share preview" }).click();
  await expect(shareTrigger).toBeFocused();

  await page.getByRole("button", { name: "Review schedule" }).click();
  await expect(page.getByText("17 of 17 matches complete")).toBeVisible();
  await page.locator("[data-qa='view-tournament-results']").click();
  const replayTrigger = page.locator("[data-qa='replay-tournament']");
  await replayTrigger.click();
  await page.keyboard.press("Escape");
  await expect(replayTrigger).toBeFocused();
  await replayTrigger.click();
  await page.getByRole("button", { name: "Replay same schedule" }).click();
  await expect(page.getByText("0 of 17 matches complete")).toBeVisible();

  await page.locator("[data-qa='brand-home']").click();
  await page.locator("[data-qa='match-history']").click();
  await expect(
    page.getByText(/6 players · Round robin \+ finals/i),
  ).toBeVisible();
  await page.getByRole("button", { name: "Share results" }).click();
  await expect(
    page.getByRole("dialog", { name: "Share tournament" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close share preview" }).click();
  await page.getByRole("button", { name: "View results" }).click();
  await expect(page.getByText("Round-robin standings")).toBeVisible();
});
