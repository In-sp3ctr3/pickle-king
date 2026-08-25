import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";
const completedAt = Date.UTC(2026, 7, 22, 18);
const history = {
  version: 2,
  tournaments: [],
  quickMatches: [
    {
      id: "long-name",
      completedAt,
      finishReason: "target",
      format: "singles",
      labels: { sideA: "Jean-Baptiste M.", sideB: "Alexandra" },
      participants: { sideA: ["Jean-Baptiste M."], sideB: ["Alexandra"] },
      score: { sideA: 11, sideB: 7 },
      targetScore: 11,
      winner: "A",
    },
    {
      id: "two-digit",
      completedAt: completedAt + 1_000,
      finishReason: "target",
      format: "singles",
      labels: { sideA: "Darien", sideB: "Jean-Paul" },
      participants: { sideA: ["Darien"], sideB: ["Jean-Paul"] },
      score: { sideA: 12, sideB: 10 },
      targetScore: 12,
      winner: "A",
    },
    {
      id: "jean-paul-winner",
      completedAt: completedAt + 2_000,
      finishReason: "target",
      format: "singles",
      labels: { sideA: "Jean-Paul", sideB: "Darien" },
      participants: { sideA: ["Jean-Paul"], sideB: ["Darien"] },
      score: { sideA: 11, sideB: 5 },
      targetScore: 11,
      winner: "A",
    },
    {
      id: "maya-control",
      completedAt: completedAt + 3_000,
      finishReason: "target",
      format: "singles",
      labels: { sideA: "Maya", sideB: "Darien" },
      participants: { sideA: ["Maya"], sideB: ["Darien"] },
      score: { sideA: 11, sideB: 5 },
      targetScore: 11,
      winner: "A",
    },
  ],
};

const styles = ["Poster", "Frame", "Receipt"] as const;

async function previewPng(page: Page, height: 1350 | 1920) {
  const preview = page.locator("[data-qa='share-preview']");
  await expect(preview).toHaveJSProperty("naturalWidth", 1080);
  await expect(preview).toHaveJSProperty("naturalHeight", height);
  return Buffer.from(
    await preview.evaluate(async (image: HTMLImageElement) =>
      Array.from(new Uint8Array(await (await fetch(image.src)).arrayBuffer())),
    ),
  );
}

async function expectStyleSnapshots(
  page: Page,
  fixture: string,
  height: 1350 | 1920,
) {
  for (const style of styles) {
    await page.getByRole("button", { name: style, exact: true }).click();
    expect(await previewPng(page, height)).toMatchSnapshot(
      `${fixture}-${style.toLowerCase()}-${height}.png`,
      { maxDiffPixels: 100 },
    );
  }
}

async function winnerDifference(first: Buffer, second: Buffer) {
  const [a, b] = await Promise.all(
    [first, second].map((png) =>
      sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
    ),
  );
  let left = a.info.width;
  let right = -1;
  let top = a.info.height;
  let bottom = -1;
  for (let y = 0; y < a.info.height; y += 1) {
    for (let x = 0; x < a.info.width; x += 1) {
      const index = (y * a.info.width + x) * a.info.channels;
      const delta =
        Math.abs(a.data[index] - b.data[index]) +
        Math.abs(a.data[index + 1] - b.data[index + 1]) +
        Math.abs(a.data[index + 2] - b.data[index + 2]);
      if (delta < 60) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return { bottom, left, right, top };
}

async function sharePng(
  page: Page,
  matchText: string,
  style: string,
  story: boolean,
) {
  const match = page.locator("article", { hasText: matchText });
  await match.getByRole("button", { name: "Share" }).click();
  await page.getByRole("button", { name: style, exact: true }).click();
  await page
    .getByRole("button", { name: story ? "Story / Reel" : "Post", exact: true })
    .click();
  const png = await previewPng(page, story ? 1920 : 1350);
  await page.getByRole("button", { name: "Close preview" }).click();
  return png;
}

test("locks Quick share PNGs for two-digit scores and the name boundary", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.addInitScript((fixture) => {
    localStorage.clear();
    localStorage.setItem("pickle-king:history", JSON.stringify(fixture));
    const original = CanvasRenderingContext2D.prototype.fillText;
    const drawn: string[] = [];
    Object.assign(window, { __shareDrawnText: drawn });
    CanvasRenderingContext2D.prototype.fillText = function (
      value,
      x,
      y,
      maxWidth,
    ) {
      drawn.push(String(value));
      return maxWidth === undefined
        ? original.call(this, value, x, y)
        : original.call(this, value, x, y, maxWidth);
    };
  }, history);
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

  const twoDigit = page.locator("article", {
    hasText: "Darien 12–10 Jean-Paul",
  });
  await twoDigit.getByRole("button", { name: "Share" }).click();
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expectStyleSnapshots(page, "two-digit", 1350);
  await page.getByRole("button", { name: "Story / Reel" }).click();
  await expectStyleSnapshots(page, "two-digit", 1920);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __shareDrawnText: string[] }).__shareDrawnText,
    ),
  ).not.toContain("12–…");
  await page.getByRole("button", { name: "Close preview" }).click();

  const longName = page.locator("article", {
    hasText: "Jean-Baptiste M. 11–7 Alexandra",
  });
  await longName.getByRole("button", { name: "Share" }).click();
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expectStyleSnapshots(page, "long-name", 1350);
  await page.getByRole("button", { name: "Story / Reel" }).click();
  await expectStyleSnapshots(page, "long-name", 1920);
  await page.getByRole("button", { name: "Close preview" }).click();

  const safeZones = {
    frame: { post: [80, 540, 560, 930], story: [80, 950, 560, 1410] },
    poster: { post: [50, 120, 510, 470], story: [50, 195, 510, 650] },
    receipt: { post: [600, 680, 1040, 930], story: [540, 1110, 1040, 1400] },
  } as const;
  for (const style of styles) {
    for (const story of [false, true]) {
      const control = await sharePng(page, "Maya 11–5 Darien", style, story);
      const subject = await sharePng(
        page,
        "Jean-Paul 11–5 Darien",
        style,
        story,
      );
      expect(subject).toMatchSnapshot(
        `jean-paul-${style.toLowerCase()}-${story ? 1920 : 1350}.png`,
        { maxDiffPixels: 100 },
      );
      const bounds = await winnerDifference(control, subject);
      const [left, top, right, bottom] =
        safeZones[style.toLowerCase() as keyof typeof safeZones][
          story ? "story" : "post"
        ];
      expect(
        bounds.left,
        `${style} ${story ? "Story" : "Post"} left`,
      ).toBeGreaterThanOrEqual(left);
      expect(
        bounds.top,
        `${style} ${story ? "Story" : "Post"} top`,
      ).toBeGreaterThanOrEqual(top);
      expect(
        bounds.right,
        `${style} ${story ? "Story" : "Post"} right`,
      ).toBeLessThanOrEqual(right);
      expect(
        bounds.bottom,
        `${style} ${story ? "Story" : "Post"} bottom`,
      ).toBeLessThanOrEqual(bottom);
    }
  }
});
