import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

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
  await page.getByRole("button", { name: "Start", exact: true }).click();
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
  await page.getByRole("button", { name: "Start", exact: true }).click();
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
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Rebuild bracket" }).click();
  await expect(
    page.getByRole("dialog", { name: "Edit the draw." }),
  ).toBeVisible();
  await expect(page.getByText("1 of 4 matches final")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Rebuild bracket" }).click();
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
  await page.getByRole("button", { name: "Share result" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^pickle-king-score-.*\.png$/);
  await download.saveAs("output/playwright/quick-share-card.png");
  await expect(page.getByText("Score image downloaded.")).toBeVisible();
});

test("a tournament bracket exports as an offline PNG", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { value: () => false });
  });
  await openFresh(page);
  await buildTournament(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Share bracket" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("pickle-king-bracket.png");
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
