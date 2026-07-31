import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

async function openFresh(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "networkidle" });
}

async function openQuickMatch(page: Page, target = 11) {
  await openFresh(page);
  await page.getByRole("button", { name: "Quick match" }).click();
  await page.getByLabel("Side A").fill("Alex");
  await page.getByLabel("Side B").fill("Blair");
  await page.getByLabel("Play to").fill(String(target));
  await page.getByRole("button", { name: "Open scorer" }).click();
  await expect(page.getByText("Untimed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start", exact: true }).click();
}

test("play-to-seven continues through a tie and one-point lead", async ({
  page,
}) => {
  await openQuickMatch(page, 7);
  const addA = page.locator("[data-qa='score-a-add']");
  const addB = page.locator("[data-qa='score-b-add']");
  for (let point = 0; point < 7; point += 1) {
    await addA.click();
    await addB.click();
  }
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await addA.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await addA.click();
  await expect(page.getByRole("heading", { name: "Alex wins" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm result" }),
  ).toBeFocused();

  await page.getByRole("button", { name: "Edit score" }).click();
  await expect(addA).toBeFocused();
  for (let point = 0; point < 4; point += 1) await addB.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Review corrected result" }).click();
  await expect(page.getByRole("heading", { name: "Blair wins" })).toBeVisible();
});

test("restart, tied early finish, and operator-selected winner are explicit", async ({
  page,
}) => {
  await openQuickMatch(page);
  const addA = page.locator("[data-qa='score-a-add']");
  const addB = page.locator("[data-qa='score-b-add']");
  await addA.click();
  await page.getByRole("button", { name: "Restart" }).click();
  await expect(
    page.getByRole("heading", { name: "Start this match over?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Restart match" }).click();
  await expect(
    page.locator("section[aria-label='Alex, 0 points']"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Start", exact: true }).click();
  await addA.click();
  await addB.click();
  await page.getByRole("button", { name: "End match" }).click();
  await expect(
    page.getByRole("heading", { name: "This match needs a winner." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Award Alex" }).click();
  await expect(
    page.getByText("Winner selected by the operator."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm result" }).click();
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible();
});

test("discarding an early finish returns without a result", async ({
  page,
}) => {
  await openQuickMatch(page);
  await page.getByRole("button", { name: "End match" }).click();
  await page.getByRole("button", { name: "Discard this match" }).click();
  await expect(page.locator("[data-qa='quick-match-setup']")).toBeVisible();
});

test("setup explains the four-player minimum and builds an untimed centered draw", async ({
  page,
}) => {
  await openFresh(page);
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "Remove player 1" }).click();
  await expect(
    page.getByRole("heading", { name: "Keep four in the field." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep editing" }).click();
  await page.getByRole("button", { name: "No time limit" }).click();
  await expect(page.getByLabel("Court booking")).toHaveCount(0);

  for (let index = 0; index < 4; index += 1) {
    await page
      .getByLabel("Player name")
      .nth(index)
      .fill(["Maya", "Rae", "Kai", "Noah"][index]);
    await page.getByLabel("Rating").nth(index).click();
    await page.getByRole("option", { name: "3.5" }).click();
  }
  await page.getByRole("button", { name: "Build bracket" }).click();
  await expect(
    page.getByRole("heading", { name: "Road to the crown." }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator("[data-qa='final-match']")).toBeVisible();
  await expect(page.locator(".bracket-match-node")).toHaveCount(3);
  await expect(
    page.locator(".bracket-match-node").first().locator(".tree-match-side"),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "Back to setup" }).click();
  await expect(page.locator("[data-qa='tournament-setup']")).toBeVisible();
  await expect(page.getByLabel("Player name").first()).toHaveValue("Maya");
});

test("the installed shell reopens offline", async ({ context, page }) => {
  await openFresh(page);
  const registrationReady = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;
    await navigator.serviceWorker.ready;
    return true;
  });
  expect(registrationReady).toBe(true);

  await page.reload({ waitUntil: "networkidle" });
  expect(
    await page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
  ).toBe(true);

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("button", { name: "Start tournament" }),
  ).toBeVisible();
});
