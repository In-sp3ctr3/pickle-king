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
  await page.locator("[data-qa='score-b-add']").click({ clickCount: 3 });
  await page.locator("[data-qa='score-a-add']").click({ clickCount: 5 });

  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  await (
    await downloadEvent
  ).saveAs("output/playwright/reference-match-quick-feed.png");
});
