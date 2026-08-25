import { expect, test, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";
let completedAt = new Date(2026, 7, 22, 18).getTime();

function record(
  id: string,
  format: "singles" | "doubles",
  winner: string[],
  loser: string[],
  winnerScore: number,
  loserScore: number,
  targetScore = winnerScore,
) {
  completedAt += 1_000;
  return {
    id,
    completedAt,
    finishReason: "target",
    format,
    labels: { sideA: winner.join(" + "), sideB: loser.join(" + ") },
    participants: { sideA: winner, sideB: loser },
    score: { sideA: winnerScore, sideB: loserScore },
    targetScore,
    winner: "A",
  };
}

function exactReferenceHistory() {
  const doubles = [
    record("d1", "doubles", ["Shevar", "Kaodi"], ["Jadan", "Khamoi"], 11, 8),
    record("d2", "doubles", ["Shevar", "Kaodi"], ["Shemar", "Teandra"], 11, 6),
    record("d3", "doubles", ["Shevar", "Kaodi"], ["Jadan", "Shemar"], 11, 6),
    record("d4", "doubles", ["Shevar", "Teandra"], ["Kaodi", "Jadan"], 11, 9),
    record("d5", "doubles", ["Teandra", "Jadan"], ["Shemar", "Khamoi"], 11, 6),
    record("d6", "doubles", ["Teandra", "Shemar"], ["Shevar", "Khamoi"], 11, 7),
    record("d7", "doubles", ["Jadan", "Shemar"], ["Kaodi", "Khamoi"], 11, 8),
  ];
  const singles = [
    record("s1", "singles", ["Jadan"], ["Shevar"], 3, 1, 3),
    record("s2", "singles", ["Jadan"], ["Teandra"], 4, 0, 3),
    record("s3", "singles", ["Jadan"], ["Shemar"], 3, 0, 3),
    record("s4", "singles", ["Jadan"], ["Kaodi"], 3, 1, 3),
    record("s5", "singles", ["Shemar"], ["Teandra"], 3, 1, 3),
    record("s6", "singles", ["Kaodi"], ["Shevar"], 3, 1, 3),
  ];
  const quick = [
    record("poster", "singles", ["Jadan"], ["Shevar"], 4, 2),
    record("alternate", "singles", ["Maya"], ["Steven"], 11, 7),
    record("long", "singles", ["Jean-Baptiste M."], ["Alexandra"], 11, 7),
    record("production", "singles", ["Darien"], ["Jean-Paul"], 12, 10),
  ];
  return {
    quickMatches: [...doubles, ...singles, ...quick],
    tournaments: [],
    version: 2,
  };
}

async function savePreview(page: Page, path: string, height = 1920) {
  const preview = page.locator("[data-qa='share-preview']");
  await expect(preview).toHaveJSProperty("naturalWidth", 1080);
  await expect(preview).toHaveJSProperty("naturalHeight", height);
  const bytes = await preview.evaluate(async (image: HTMLImageElement) =>
    Array.from(new Uint8Array(await (await fetch(image.src)).arrayBuffer())),
  );
  await writeFile(path, Uint8Array.from(bytes));
}

async function pixelCount(
  path: string,
  region: { height: number; left: number; top: number; width: number },
  matches: (red: number, green: number, blue: number) => boolean,
) {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let count = 0;
  for (let y = region.top; y < region.top + region.height; y += 1) {
    for (let x = region.left; x < region.left + region.width; x += 1) {
      const index = (y * info.width + x) * 4;
      if (matches(data[index], data[index + 1], data[index + 2])) count += 1;
    }
  }
  return count;
}

test("renders matched-data poster reference evidence", async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript((history) => {
    localStorage.clear();
    localStorage.setItem("pickle-king:history", JSON.stringify(history));
  }, exactReferenceHistory());
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await expect
    .poll(() =>
      page.evaluate(() =>
        [
          '400 32px "Anton"',
          '400 32px "Alfa Slab One"',
          '900 32px "Roboto Condensed"',
          '900 32px "Roboto Slab"',
          '800 32px "Manrope"',
        ].every((font) => document.fonts.check(font)),
      ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Match history" }).click();

  const poster = page.locator("article", { hasText: "Jadan 4–2 Shevar" });
  await poster.getByRole("button", { name: "Share" }).click();
  await page.getByRole("button", { name: "Story / Reel" }).click();
  await savePreview(page, "output/playwright/reference-quick-poster-story.png");
  await page.getByRole("button", { name: "Close preview" }).click();

  const production = page.locator("article", {
    hasText: "Darien 12–10 Jean-Paul",
  });
  await production.getByRole("button", { name: "Share" }).click();
  await savePreview(
    page,
    "output/playwright/production-quick-poster-feed.png",
    1350,
  );
  await page.getByRole("button", { name: "Frame" }).click();
  await savePreview(
    page,
    "output/playwright/production-quick-frame-feed.png",
    1350,
  );
  await page.getByRole("button", { name: "Receipt" }).click();
  await savePreview(
    page,
    "output/playwright/production-quick-receipt-feed.png",
    1350,
  );
  for (const style of ["poster", "frame"]) {
    await expect(
      pixelCount(
        `output/playwright/production-quick-${style}-feed.png`,
        { height: 80, left: 460, top: 1250, width: 260 },
        (red, green, blue) => red > 180 && green > 180 && blue > 180,
      ),
    ).resolves.toBeGreaterThan(2_000);
  }
  await expect(
    pixelCount(
      "output/playwright/production-quick-poster-feed.png",
      { height: 24, left: 190, top: 850, width: 105 },
      (red, green, blue) => red < 30 && green < 30 && blue < 30,
    ),
  ).resolves.toBeGreaterThan(500);
  await expect(
    pixelCount(
      "output/playwright/production-quick-frame-feed.png",
      { height: 70, left: 90, top: 90, width: 150 },
      (red, green, blue) => red > 120 && green > 150 && blue < 80,
    ),
  ).resolves.toBeGreaterThan(500);
  await page.getByRole("button", { name: "Story / Reel" }).click();
  await savePreview(
    page,
    "output/playwright/production-quick-receipt-story.png",
  );
  await page.getByRole("button", { name: "Poster" }).click();
  await savePreview(
    page,
    "output/playwright/production-quick-poster-story.png",
  );
  await page.getByRole("button", { name: "Frame" }).click();
  await savePreview(page, "output/playwright/production-quick-frame-story.png");
  for (const style of ["poster", "frame"]) {
    await expect(
      pixelCount(
        `output/playwright/production-quick-${style}-story.png`,
        { height: 100, left: 430, top: 1760, width: 330 },
        (red, green, blue) => red > 180 && green > 180 && blue > 180,
      ),
    ).resolves.toBeGreaterThan(3_000);
  }
  await page.getByRole("button", { name: "Close preview" }).click();

  const alternate = page.locator("article", { hasText: "Maya 11–7 Steven" });
  await alternate.getByRole("button", { name: "Share" }).click();
  await page.getByRole("button", { name: "Frame" }).click();
  await page.getByRole("button", { name: "Story / Reel" }).click();
  await savePreview(page, "output/playwright/reference-quick-frame-story.png");
  await page.getByRole("button", { name: "Receipt" }).click();
  await savePreview(
    page,
    "output/playwright/reference-quick-receipt-story.png",
  );
  await page.getByRole("button", { name: "Close preview" }).click();

  const longName = page.locator("article", {
    hasText: "Jean-Baptiste M. 11–7 Alexandra",
  });
  await longName.getByRole("button", { name: "Share" }).click();
  await page.getByRole("button", { name: "Story / Reel" }).click();
  await savePreview(page, "output/playwright/long-name-quick-poster-story.png");
  await page.getByRole("button", { name: "Frame" }).click();
  await savePreview(page, "output/playwright/long-name-quick-frame-story.png");
  await page.getByRole("button", { name: "Receipt" }).click();
  await savePreview(
    page,
    "output/playwright/long-name-quick-receipt-story.png",
  );
  await page.getByRole("button", { name: "Close preview" }).click();

  await page.getByRole("button", { name: "Create recap" }).click();
  await poster.getByRole("checkbox").uncheck();
  await alternate.getByRole("checkbox").uncheck();
  await longName.getByRole("checkbox").uncheck();
  await production.getByRole("checkbox").uncheck();
  await page.getByRole("button", { name: "Preview recap" }).click();
  await page.getByRole("button", { name: "Story / Reel" }).click();
  await page.getByRole("button", { name: "Singles" }).click();
  await savePreview(
    page,
    "output/playwright/reference-recap-singles-story.png",
  );
  await page.getByRole("button", { name: "Post" }).click();
  await savePreview(
    page,
    "output/playwright/reference-recap-singles-post.png",
    1350,
  );
  await page.getByRole("button", { name: "Story / Reel" }).click();
  await page.getByRole("button", { name: "Doubles" }).click();
  await savePreview(
    page,
    "output/playwright/reference-recap-doubles-story.png",
  );
  await page.getByRole("button", { name: "Post" }).click();
  await savePreview(
    page,
    "output/playwright/reference-recap-doubles-post.png",
    1350,
  );
});
