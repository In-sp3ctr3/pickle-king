import { test } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

test("captures the supplied-reference match state for visual comparison", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Quick match" }).click();
  await page.getByLabel("Side A").fill("Jack");
  await page.getByLabel("Side B").fill("Brandon");
  await page.getByLabel("Play to").fill("5");
  await page.getByRole("button", { name: "Open scorer" }).click();
  await page.getByRole("button", { name: "Start match", exact: true }).click();
  await page.locator("[data-qa='confirm-serve-setup']").click();
  await page.locator("[data-qa='score-b-add']").click({ clickCount: 4 });
  await page.locator("[data-qa='score-a-add']").click({ clickCount: 6 });

  await page.getByRole("button", { name: "Confirm result" }).click();
  await page.locator("[data-qa='share-saved-result']").click();
  await page.getByRole("button", { name: "Post (4:5)" }).click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save image" }).click();
  await (
    await downloadEvent
  ).saveAs("output/playwright/reference-match-quick-feed.png");
});
