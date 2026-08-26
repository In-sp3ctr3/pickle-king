import { expect, test } from "@playwright/test";
import { confirmServeSetup } from "./small-field-harness";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

test("Quick Match confirmation records once and returns to setup", async ({
  page,
}) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Quick match" }).click();
  await page.getByLabel("Side A").fill("Shemar");
  await page.getByLabel("Side B").fill("Samantha");
  await page.getByLabel("Play to").fill("1");
  await page.getByRole("button", { name: "Open scorer" }).click();
  await page.getByRole("button", { name: "Start match", exact: true }).click();
  await confirmServeSetup(page);
  await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
  await page.getByRole("button", { name: "Confirm result" }).click();
  await expect(page.locator("[data-qa='quick-match-setup']")).toBeVisible();
  await expect(page.locator("[data-qa='result-saved']")).toBeVisible();
  expect(
    await page.evaluate(() => {
      const raw = localStorage.getItem("pickle-king:history");
      return raw ? JSON.parse(raw).quickMatches.length : 0;
    }),
  ).toBe(1);
  await page.locator("[data-qa='share-saved-result']").click();
  await expect(page.locator("[data-qa='share-composer']")).toBeVisible();
  await expect(page.locator("[data-qa='share-format-story']")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("radio", { name: "Poster" })).toBeChecked();
  await expect(page.locator("[data-qa='share-preview']")).toBeVisible();
  await page.getByRole("button", { name: "Close share composer" }).click();
  await page.locator("[data-qa='continue-saved-result']").click();
  await expect(page.locator("[data-qa='result-saved']")).toHaveCount(0);
});

test("composer keeps the design while switching Story and Post", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.clear();
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (...args) {
      window.setTimeout(() => original.apply(this, args), 800);
    };
  });
  await page.goto(baseUrl);
  await page.getByRole("button", { name: "Quick match" }).click();
  await page.getByLabel("Side A").fill("Shemar");
  await page.getByLabel("Side B").fill("Samantha");
  await page.getByLabel("Play to").fill("1");
  await page.getByRole("button", { name: "Open scorer" }).click();
  await page.getByRole("button", { name: "Start match", exact: true }).click();
  await confirmServeSetup(page);
  await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
  await page.getByRole("button", { name: "Confirm result" }).click();
  await page.locator("[data-qa='share-saved-result']").click();
  await page.getByRole("radio", { name: "Receipt" }).click();
  await page.locator("[data-qa='share-format-feed']").click();
  await expect(page.getByRole("radio", { name: "Receipt" })).toBeChecked();
  const preview = page.locator("[data-qa='share-preview']");
  await expect(preview).toBeVisible();
  expect(
    await preview.evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBe(1080);
  expect(
    await preview.evaluate((image: HTMLImageElement) => image.naturalHeight),
  ).toBe(1350);
});
