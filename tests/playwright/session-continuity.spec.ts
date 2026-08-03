import { readFile } from "node:fs/promises";
import { expect, test, type Download, type Page } from "@playwright/test";
import { PNG } from "pngjs";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

async function expectBrandedPng(
  download: Download,
  width: number,
  height: number,
  markRegion: { x: number; y: number; width: number; height: number },
) {
  const path = await download.path();
  if (!path) throw new Error("Downloaded PNG path was unavailable.");
  const png = PNG.sync.read(await readFile(path));
  expect({ width: png.width, height: png.height }).toEqual({ width, height });
  let brandedPixels = 0;
  for (let y = markRegion.y; y < markRegion.y + markRegion.height; y += 1) {
    for (let x = markRegion.x; x < markRegion.x + markRegion.width; x += 1) {
      const offset = (y * png.width + x) * 4;
      if (png.data[offset] > 135 && png.data[offset + 1] > 145) {
        brandedPixels += 1;
      }
    }
  }
  expect(brandedPixels).toBeGreaterThan(4_000);
}

async function openFresh(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Quick match" })).toBeEnabled();
}

async function completeQuickMatch(page: Page) {
  await page.getByRole("button", { name: "Quick match" }).click();
  await page.getByLabel("Side A").fill("Robbie");
  await page.getByLabel("Side B").fill("Maya");
  await page.getByLabel("Play to").fill("2");
  await page.getByRole("button", { name: "Open scorer" }).click();
  await page.getByRole("button", { name: "Start match", exact: true }).click();
  await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
  await expect(
    page.getByRole("heading", { name: "Robbie wins" }),
  ).toBeVisible();
}

async function buildTournament(page: Page) {
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "No time limit" }).click();
  for (const [index, name] of ["Maya", "Rae", "Kai", "Noah"].entries()) {
    await page.getByLabel("Player name").nth(index).fill(name);
    await page.getByLabel("Rating").nth(index).click();
    await page.getByRole("option", { name: "3.5" }).click();
  }
  await page.getByRole("button", { name: "Build bracket" }).click();
}

test("confirmed Quick Matches become history and remembered-name suggestions", async ({
  page,
}) => {
  await openFresh(page);
  await completeQuickMatch(page);
  await page.getByRole("button", { name: "Confirm result" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Match history" }).click();
  await expect(page.getByText("Robbie 2–0 Maya")).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: "output/playwright/history-populated.png",
  });

  await page.getByRole("button", { name: "Go home" }).click();
  await page.getByRole("button", { name: "Quick match" }).click();
  await page.getByLabel("Side A").fill("Ro");
  await page.getByLabel("Side A").press("ArrowDown");
  await page.getByLabel("Side A").press("Enter");
  await expect(page.getByLabel("Side A")).toHaveValue("Robbie");
});

test("safe renames retain results and structural edits rebuild the draw", async ({
  page,
}) => {
  await openFresh(page);
  await buildTournament(page);
  await page.locator("[data-qa='start-next']").click();
  await page.getByRole("button", { name: "Start match", exact: true }).click();
  await page.locator("[data-qa='score-a-add']").click();
  await page.getByRole("button", { name: "End match" }).click();
  await page.getByRole("button", { name: /Keep score/ }).click();
  await page.getByRole("button", { name: "Confirm result" }).click();
  await expect(page.getByText("1 of 4 matches final")).toBeVisible();

  await page.getByRole("button", { name: "Edit draw" }).click();
  await page.locator('.draw-editor input[value="Maya"]').fill("Patrick");
  await page.getByRole("button", { name: "Save names" }).click();
  await expect(page.getByText("1 of 4 matches final")).toBeVisible();
  await expect(
    page.getByText("Patrick", { exact: true }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: "Edit draw" }).click();
  await page.getByRole("button", { name: "Add forgotten player" }).click();
  await page.locator(".draw-editor__row input").last().fill("Late player");
  await page.getByRole("button", { name: "Review draw change" }).click();
  await expect(page.locator("[data-qa='late-entry-dialog']")).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel and continue bracket as is" })
    .click();
  await expect(page.getByText("1 of 4 matches final")).toBeVisible();

  await page.getByRole("button", { name: "Edit draw" }).click();
  await page.getByRole("button", { name: "Add forgotten player" }).click();
  await page.locator(".draw-editor__row input").last().fill("Late player");
  await page.getByRole("button", { name: "Review draw change" }).click();
  await page.getByRole("button", { name: "Rebuild from scratch" }).click();
  await expect(page.getByText("0 of 5 matches final")).toBeVisible();
  await expect(
    page.getByText(/5 players · 3 automatic advances/),
  ).toBeVisible();
});

test("result sharing downloads a branded PNG when native file share is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { value: () => false });
  });
  await openFresh(page);
  await completeQuickMatch(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^pickle-king-.*\.png$/);
  await expectBrandedPng(download, 1080, 1350, {
    x: 410,
    y: 90,
    width: 260,
    height: 270,
  });
  await download.saveAs("output/playwright/quick-share-card.png");
  await expect(page.getByRole("status")).toHaveText("Download started");
});

test("a tournament bracket exports as an offline PNG", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { value: () => false });
  });
  await openFresh(page);
  await buildTournament(page);
  await page.getByRole("button", { name: "Share bracket" }).click();
  const dialog = page.getByRole("dialog", { name: "Bracket preview" });
  await expect(dialog.locator("[data-qa='share-preview']")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download image" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("pickle-king-bracket.png");
  await expectBrandedPng(download, 1600, 1200, {
    x: 700,
    y: 100,
    width: 200,
    height: 200,
  });
  await download.saveAs("output/playwright/bracket-share-card.png");
});

test("draw editing remains usable on iPad portrait", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await openFresh(page);
  await buildTournament(page);
  await page.getByRole("button", { name: "Edit draw" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate(
        (element) =>
          element.scrollWidth <= document.documentElement.clientWidth,
      ),
  ).toBe(true);
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: "output/playwright/draw-editor-ipad.png",
  });
});
