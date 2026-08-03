import { expect, test } from "@playwright/test";

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
  await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
  await page.getByRole("button", { name: "Confirm result" }).click();
  await expect(page.locator("[data-qa='quick-match-setup']")).toBeVisible();
  await expect(page.getByRole("button", { name: "Done" })).toHaveCount(0);
  expect(
    await page.evaluate(() => {
      const raw = localStorage.getItem("pickle-king:history");
      return raw ? JSON.parse(raw).quickMatches.length : 0;
    }),
  ).toBe(1);
});

test("result rendering shows only an aspect-correct branded skeleton", async ({
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
  await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
  const skeleton = page.locator(".result-dialog__preview-skeleton");
  await expect(skeleton).toBeVisible();
  await expect(page.locator(".result-dialog__preview-fallback")).toHaveCount(0);
  await page.getByRole("button", { name: "Story / Reel · 9:16" }).click();
  await expect(skeleton).toHaveCSS("aspect-ratio", "9 / 16");
  await expect(page.locator("[data-qa='result-preview']")).toBeVisible();
});
