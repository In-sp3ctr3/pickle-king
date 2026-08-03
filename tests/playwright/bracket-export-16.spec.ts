import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { PNG } from "pngjs";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

test("a completed 16-player bracket remains legible inside 1600 by 1200", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "No time limit" }).click();
  for (let index = 4; index < 16; index += 1) {
    await page.getByRole("button", { name: "Add another player" }).click();
  }
  for (let index = 0; index < 16; index += 1) {
    await page
      .getByLabel("Player name")
      .nth(index)
      .fill(`Player ${index + 1} Alexander Montgomery`);
    await page.getByLabel("Rating").nth(index).click();
    await page.getByRole("option", { name: "3.5", exact: true }).click();
  }
  await page.getByLabel("Every match plays to", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Build bracket" }).click();
  for (let index = 0; index < 16; index += 1) {
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
  await download.saveAs("output/playwright/share-bracket-16.png");
  expect(brightPixels(png, 0, 340)).toBeGreaterThan(8_000);
  expect(brightPixels(png, 340, 920)).toBeGreaterThan(17_000);
  expect(brightPixels(png, 920, 1200)).toBeGreaterThan(5_000);
  expect(
    regionPixels(png, 650, 950, 480, 650, ([red, green, blue]) =>
      Boolean(red > 150 && green > 110 && blue < 115),
    ),
  ).toBeGreaterThan(600);
  expect(
    regionPixels(png, 650, 950, 770, 930, ([red, green, blue]) =>
      Boolean(red + green + blue > 410),
    ),
  ).toBeGreaterThan(1_300);
  for (const [startX, endX] of [
    [250, 650],
    [950, 1350],
  ] as const) {
    expect(
      regionPixels(png, startX, endX, 340, 800, ([red, green, blue]) =>
        Boolean(green > 90 && green > red * 1.05 && blue < 130),
      ),
    ).toBeGreaterThan(1_000);
  }
  for (const [label, width, height, file] of [
    ["Post · 4:5", 1080, 1350, "post"],
    ["Story / Reel · 9:16", 1080, 1920, "story"],
  ] as const) {
    await dialog.getByRole("button", { name: label }).click();
    const preview = dialog.locator("[data-qa='share-preview']");
    await expect(preview).toHaveJSProperty("naturalHeight", height);
    const event = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download image" }).click();
    const portraitDownload = await event;
    const portraitPath = await portraitDownload.path();
    if (!portraitPath) throw new Error("Portrait bracket PNG was unavailable.");
    const portrait = PNG.sync.read(await readFile(portraitPath));
    expect({ width: portrait.width, height: portrait.height }).toEqual({
      width,
      height,
    });
    await portraitDownload.saveAs(
      `output/playwright/share-bracket-16-${file}.png`,
    );
  }
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

function regionPixels(
  png: PNG,
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  predicate: (rgb: [number, number, number]) => boolean,
) {
  let count = 0;
  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const offset = (y * png.width + x) * 4;
      if (
        predicate([
          png.data[offset],
          png.data[offset + 1],
          png.data[offset + 2],
        ])
      ) {
        count += 1;
      }
    }
  }
  return count;
}
