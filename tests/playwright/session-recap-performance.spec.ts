import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { quickHistoryFixture } from "./quick-history-fixture";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

test("records first-page and complete-set recap encoding", async ({ page }) => {
  await page.addInitScript((history) => {
    localStorage.setItem("pickle-king:history", JSON.stringify(history));
    Object.defineProperty(navigator, "canShare", { value: () => true });
    Object.defineProperty(navigator, "share", { value: async () => {} });
  }, quickHistoryFixture());
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Match history" }).click();
  await page.getByRole("button", { name: "Create recap" }).click();

  const firstPageStarted = performance.now();
  await page.getByRole("button", { name: "Preview recap" }).click();
  await page.getByRole("button", { name: "Doubles" }).click();
  await expect(page.getByText("Page 1 of 2")).toBeVisible();
  await expect(page.locator("[data-qa='share-preview']")).toBeVisible();
  const firstPageMs = performance.now() - firstPageStarted;

  const completeSetStarted = performance.now();
  await page.getByRole("button", { name: "Share all pages" }).click();
  await expect(page.getByText("All pages shared.")).toBeVisible();
  const completeSetMs = performance.now() - completeSetStarted;
  const evidence = { completeSetMs, firstPageMs, pageCount: 2 };
  await writeFile(
    "output/playwright/session-recap-performance.json",
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  expect(firstPageMs).toBeLessThan(2_500);
  expect(completeSetMs).toBeLessThan(5_000);
});
