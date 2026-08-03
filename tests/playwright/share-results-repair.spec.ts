import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { PNG } from "pngjs";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

async function openSetup(page: Page, untimed = true) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.waitForURL(/#setup$/);
  if (untimed) {
    await page.getByRole("button", { name: "No time limit" }).click();
  }
}

async function fillPlayers(page: Page) {
  for (const [index, [name, rating]] of [
    ["Maya", "4.0"],
    ["Rae", "3.5"],
    ["Kai", "3.0"],
    ["Noah", "2.5"],
  ].entries()) {
    await page.getByLabel("Player name").nth(index).fill(name);
    await page.getByLabel("Rating").nth(index).click();
    await page.getByRole("option", { name: rating, exact: true }).click();
  }
}

async function finishTournament(page: Page) {
  await openSetup(page);
  await fillPlayers(page);
  await page.getByLabel("Every match plays to", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Build bracket" }).click();
  for (let index = 0; index < 4; index += 1) {
    await page.locator("[data-qa='start-next']").click();
    await page
      .getByRole("button", { name: "Start match", exact: true })
      .click();
    await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
    await page.getByRole("button", { name: "Confirm result" }).click();
  }
}

test("quick result export keeps the reference-led score hierarchy", async ({
  page,
}) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Quick match" }).click();
  await page
    .getByLabel("Side A")
    .fill("Samantha Elizabeth Richardson-Montgomery");
  await page
    .getByLabel("Side B")
    .fill("Christopher Nathaniel Thompson-Alexander");
  await page.getByLabel("Play to").fill("2");
  await page.getByRole("button", { name: "Open scorer" }).click();
  await page.getByRole("button", { name: "Start match", exact: true }).click();
  await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
  const preview = page.locator("[data-qa='result-preview']");
  await expect(preview).toHaveJSProperty("naturalWidth", 1080);
  await expect(preview).toHaveJSProperty("naturalHeight", 1350);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  const download = await downloadEvent;
  await download.saveAs("output/playwright/share-quick-feed.png");
  await expect(
    page.getByRole("button", { name: "Download result" }),
  ).toHaveText("Saved");
  await page.getByRole("button", { name: "Story" }).click();
  await expect(preview).toHaveJSProperty("naturalWidth", 1080);
  await expect(preview).toHaveJSProperty("naturalHeight", 1920);
  const storyDownloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  const storyDownload = await storyDownloadEvent;
  await storyDownload.saveAs("output/playwright/share-quick-story.png");
});

test("setup sections and number controls keep deliberate spacing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await openSetup(page, false);
  const add = page.getByRole("button", { name: "Add another player" });
  const drawLegend = page.locator(".setup-draw-style legend");
  const number = drawLegend.locator(".setup-section-number");
  const title = drawLegend.locator(".setup-section-title");
  const [addBox, drawBox, numberBox, titleBox] = await Promise.all([
    add.boundingBox(),
    drawLegend.boundingBox(),
    number.boundingBox(),
    title.boundingBox(),
  ]);
  expect(
    (drawBox?.y ?? 0) - ((addBox?.y ?? 0) + (addBox?.height ?? 0)),
  ).toBeGreaterThanOrEqual(40);
  expect(
    (titleBox?.x ?? 0) - ((numberBox?.x ?? 0) + (numberBox?.width ?? 0)),
  ).toBeGreaterThanOrEqual(10);

  const numericInput = page.locator(".setup-number-input input").first();
  const suffix = page.locator(".setup-number-suffix").first();
  const plus = page
    .getByRole("button", { name: "Increase court booking" })
    .first();
  const [inputBox, suffixBox, plusBox] = await Promise.all([
    numericInput.boundingBox(),
    suffix.boundingBox(),
    plus.boundingBox(),
  ]);
  expect(inputBox?.width).toBeGreaterThanOrEqual(56);
  expect(
    (suffixBox?.x ?? 0) - ((inputBox?.x ?? 0) + (inputBox?.width ?? 0)),
  ).toBeGreaterThanOrEqual(8);
  expect(
    (plusBox?.x ?? 0) - ((suffixBox?.x ?? 0) + (suffixBox?.width ?? 0)),
  ).toBeGreaterThanOrEqual(8);
});

test("tournament results lead with the champion and preview every export", async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await finishTournament(page);
  const results = page.locator("[data-qa='results']");
  await expect(results).toContainText("Tournament champion");
  await expect(results).not.toContainText("Seedings, settled");
  await expect(results).not.toContainText("not just");
  await expect(results).not.toContainText("not a new skill rating");

  await page.getByRole("button", { name: "Share tournament" }).click();
  const dialog = page.getByRole("dialog", { name: "Share tournament" });
  const preview = dialog.locator("[data-qa='share-preview']");
  await expect(preview).toBeVisible();
  await expect(preview).toHaveJSProperty("naturalWidth", 1080);
  await expect(preview).toHaveJSProperty("naturalHeight", 1350);
  await expect(dialog.getByText(/Building image/)).toHaveCount(0);

  const share = dialog.getByRole("button", { name: "Share image" });
  const download = dialog.getByRole("button", { name: "Download image" });
  await expect(share).toHaveText("Share");
  await expect(download).toHaveText("Download");
  const recapDownloadEvent = page.waitForEvent("download");
  await download.click();
  const recapDownload = await recapDownloadEvent;
  await recapDownload.saveAs("output/playwright/share-recap-feed.png");
  await expect(download).toHaveText("Saved");
  await dialog.getByRole("button", { name: "Story" }).click();
  await expect(preview).toHaveJSProperty("naturalWidth", 1080);
  await expect(preview).toHaveJSProperty("naturalHeight", 1920);
  const storyDownloadEvent = page.waitForEvent("download");
  await download.click();
  const storyDownload = await storyDownloadEvent;
  await storyDownload.saveAs("output/playwright/share-recap-story.png");
  await dialog.getByRole("button", { name: "Feed" }).click();
  await expect(preview).toHaveJSProperty("naturalHeight", 1350);
  await dialog.getByRole("tab", { name: "Player stats" }).click();
  await expect(preview).toHaveJSProperty("naturalHeight", 1350);
  const statsDownloadEvent = page.waitForEvent("download");
  await download.click();
  const statsDownload = await statsDownloadEvent;
  await statsDownload.saveAs("output/playwright/share-stats-feed.png");
  await dialog.getByRole("tab", { name: "Full bracket" }).click();
  await expect(preview).toHaveJSProperty("naturalWidth", 1600);
  await expect(preview).toHaveJSProperty("naturalHeight", 1200);

  const bracketDownloadEvent = page.waitForEvent("download");
  await download.click();
  const bracketDownload = await bracketDownloadEvent;
  await bracketDownload.saveAs("output/playwright/share-bracket-feed.png");
  await expect(dialog.getByText("Download started")).toHaveCount(0);
});

test("share previews and results never overflow target screens", async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 820, height: 1180 },
    { width: 1180, height: 820 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await finishTournament(page);
    await page.getByRole("button", { name: "Share tournament" }).click();
    const figure = page.locator(".tournament-share-preview");
    const image = figure.locator("img");
    await expect(image).toBeVisible();
    const [figureBox, imageBox] = await Promise.all([
      figure.boundingBox(),
      image.boundingBox(),
    ]);
    expect(imageBox?.x).toBeGreaterThanOrEqual(figureBox?.x ?? 0);
    expect(imageBox?.y).toBeGreaterThanOrEqual(figureBox?.y ?? 0);
    expect((imageBox?.x ?? 0) + (imageBox?.width ?? 0)).toBeLessThanOrEqual(
      (figureBox?.x ?? 0) + (figureBox?.width ?? 0) + 1,
    );
    expect((imageBox?.y ?? 0) + (imageBox?.height ?? 0)).toBeLessThanOrEqual(
      (figureBox?.y ?? 0) + (figureBox?.height ?? 0) + 1,
    );
    expect(
      await page.evaluate(() => {
        const offenders = [...document.querySelectorAll<HTMLElement>("body *")]
          .filter((node) => node.offsetParent !== null)
          .filter((node) => node.scrollWidth > node.clientWidth + 1);
        return offenders.map((node) => node.className).slice(0, 5);
      }),
    ).toEqual([]);
  }
});

test("completed tournament results reopen without replacing the active draw", async ({
  page,
}) => {
  await finishTournament(page);
  const activeTournament = await page.evaluate(() => {
    const raw = window.localStorage.getItem("pickle-king:snapshot");
    return raw ? JSON.parse(raw).tournament : null;
  });
  await page.locator("[data-qa='brand-home']").click();
  await page.getByRole("button", { name: "Match history" }).click();
  await page.getByRole("button", { name: "View results" }).click();
  await expect(page.locator("[data-qa='results']")).toBeVisible();
  await expect(page.getByText("Tournament champion")).toBeVisible();
  await page.getByRole("button", { name: "Back to History" }).click();
  await expect(page.locator("[data-qa='history-screen']")).toBeVisible();
  const restoredTournament = await page.evaluate(() => {
    const raw = window.localStorage.getItem("pickle-king:snapshot");
    return raw ? JSON.parse(raw).tournament : null;
  });
  expect(restoredTournament).toEqual(activeTournament);
});

test("an eight-player completed bracket keeps its header and footer inside the PNG", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await openSetup(page);
  for (let index = 4; index < 8; index += 1) {
    await page.getByRole("button", { name: "Add another player" }).click();
  }
  for (let index = 0; index < 8; index += 1) {
    await page
      .getByLabel("Player name")
      .nth(index)
      .fill(`Player ${index + 1}`);
    await page.getByLabel("Rating").nth(index).click();
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
  await page.getByRole("button", { name: "Share tournament" }).click();
  const dialog = page.getByRole("dialog", { name: "Share tournament" });
  await dialog.getByRole("tab", { name: "Full bracket" }).click();
  await expect(dialog.locator("[data-qa='share-preview']")).toHaveJSProperty(
    "naturalHeight",
    1200,
  );
  const downloadEvent = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download image" }).click();
  const download = await downloadEvent;
  const path = await download.path();
  if (!path) throw new Error("Bracket PNG path was unavailable.");
  const png = PNG.sync.read(await readFile(path));
  expect({ width: png.width, height: png.height }).toEqual({
    width: 1600,
    height: 1200,
  });
  expect(brightPixels(png, 0, 100)).toBeGreaterThan(1_000);
  expect(brightPixels(png, 1100, 1200)).toBeGreaterThan(1_000);
  await download.saveAs("output/playwright/adversarial-bracket-8-ci.png");
});

function brightPixels(png: PNG, startY: number, endY: number) {
  let count = 0;
  for (let y = startY; y < endY; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const offset = (y * png.width + x) * 4;
      if (
        png.data[offset] + png.data[offset + 1] + png.data[offset + 2] >
        420
      ) {
        count += 1;
      }
    }
  }
  return count;
}
