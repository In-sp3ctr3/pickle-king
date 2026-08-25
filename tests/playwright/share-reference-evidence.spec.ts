import { expect, test, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

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
