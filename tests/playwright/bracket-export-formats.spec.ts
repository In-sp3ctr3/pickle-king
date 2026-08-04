import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { PNG } from "pngjs";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

async function finishEightPlayerTournament(page: Page) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(baseUrl);
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "No time limit" }).click();
  for (let index = 4; index < 8; index += 1) {
    await page.getByRole("button", { name: "Add another player" }).click();
  }
  await expect(page.getByLabel("Rating")).toHaveCount(8);
  for (let index = 0; index < 8; index += 1) {
    await page
      .getByLabel("Player name")
      .nth(index)
      .fill(`Player ${index + 1}`);
    const rating = page.getByLabel("Rating").nth(index);
    await rating.scrollIntoViewIfNeeded();
    await rating.click();
    await page.getByRole("option", { name: "3.5", exact: true }).click();
  }
  await page.getByLabel("Every match plays to", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Build bracket" }).click();
  for (let index = 0; index < 8; index += 1) {
    await page.locator("[data-qa='start-next']").click();
    await page
      .getByRole("button", { name: "Start match", exact: true })
      .click();
    await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
    await page.getByRole("button", { name: "Confirm result" }).click();
  }
}

test("eight-player brackets export complete landscape, Post, and Story images", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await finishEightPlayerTournament(page);
  await page.getByRole("button", { name: "Share tournament" }).click();
  const dialog = page.getByRole("dialog", { name: "Share tournament" });
  await dialog.getByRole("tab", { name: "Full bracket" }).click();
  for (const [label, width, height, file] of [
    ["Full draw", 1600, 1200, "landscape"],
    ["Post", 1080, 1350, "post"],
    ["Story / Reel", 1080, 1920, "story"],
  ] as const) {
    await dialog.getByRole("button", { name: label }).click();
    const preview = dialog.locator("[data-qa='share-preview']");
    await expect(preview).toHaveJSProperty("naturalHeight", height);
    const event = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download image" }).click();
    const download = await event;
    const path = await download.path();
    if (!path) throw new Error("Bracket PNG path was unavailable.");
    const png = PNG.sync.read(await readFile(path));
    expect({ width: png.width, height: png.height }).toEqual({ width, height });
    await download.saveAs(`output/playwright/bracket-8-${file}.png`);
  }
});
