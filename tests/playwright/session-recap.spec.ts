import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

function record(
  id: string,
  completedAt: number,
  format: "singles" | "doubles",
  sideA: string[],
  sideB: string[],
) {
  return {
    id,
    completedAt,
    finishReason: "target",
    format,
    labels: { sideA: sideA.join(" + "), sideB: sideB.join(" + ") },
    participants: { sideA, sideB },
    score: { sideA: 11, sideB: 7 },
    targetScore: 11,
    winner: "A",
  };
}

function historyFixture(doublesCount = 4) {
  const day = new Date(2026, 7, 22, 18).getTime();
  const doubles = [
    record(
      "d4",
      day + 6_000,
      "doubles",
      ["Player 01", "Player 02"],
      ["Player 03", "Player 05"],
    ),
    record(
      "d3",
      day + 5_000,
      "doubles",
      ["Player 09", "Player 10"],
      ["Player 11", "Player 12"],
    ),
    record(
      "d2",
      day + 4_000,
      "doubles",
      ["Player 05", "Player 06"],
      ["Player 07", "Player 08"],
    ),
    record(
      "d1",
      day + 3_000,
      "doubles",
      ["Jean-Baptiste M.", "Player 02"],
      ["Player 03", "Player 04"],
    ),
  ];
  return {
    version: 2,
    quickMatches: [
      ...doubles.slice(doubles.length - doublesCount),
      record("s2", day + 2_000, "singles", ["Jean-Baptiste M."], ["Maya"]),
      record("s1", day + 1_000, "singles", ["Maya"], ["Steven"]),
      record(
        "old",
        new Date(2026, 7, 21, 18).getTime(),
        "singles",
        ["Old A"],
        ["Old B"],
      ),
    ],
    tournaments: [],
  };
}

async function openSeededHistory(
  page: Page,
  shareMode: "supported" | "unsupported" | "cancelled" = "supported",
  doublesCount = 4,
) {
  const history = historyFixture(doublesCount);
  await page.addInitScript(
    ({ history, shareMode }) => {
      localStorage.clear();
      localStorage.setItem("pickle-king:history", JSON.stringify(history));
      Object.defineProperty(navigator, "canShare", {
        configurable: true,
        value: () => shareMode !== "unsupported",
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data: ShareData) => {
          if (shareMode === "cancelled") {
            throw new DOMException("Closed", "AbortError");
          }
          (window as Window & { __sharedFiles?: string[] }).__sharedFiles =
            data.files?.map(({ name }) => name) ?? [];
        },
      });
      const click = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        const state = window as Window & { __downloads?: string[] };
        state.__downloads ??= [];
        state.__downloads.push(this.download);
        if (!this.download) click.call(this);
      };
    },
    { history, shareMode },
  );
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Match history" }).click();
  await expect(page.locator("[data-qa='history-screen']")).toBeVisible();
}

async function openDoublesRecap(page: Page) {
  await page.getByRole("button", { name: "Create recap" }).click();
  await expect(page.getByText("6 selected")).toBeVisible();
  await page.getByRole("button", { name: "Preview recap" }).click();
  await page.getByRole("button", { name: "Doubles" }).click();
  await expect(page.getByText("Page 1 of 2")).toBeVisible();
  await expect(page.locator("[data-qa='share-preview']")).toBeVisible();
}

async function savePreview(page: Page, path: string) {
  const bytes = await page
    .locator("[data-qa='share-preview']")
    .evaluate(async (image: HTMLImageElement) =>
      Array.from(new Uint8Array(await (await fetch(image.src)).arrayBuffer())),
    );
  await writeFile(path, Uint8Array.from(bytes));
}

test("selects the latest day and exports paginated Singles and Doubles receipts", async ({
  page,
}) => {
  await openSeededHistory(page);
  await page.getByRole("button", { name: "Create recap" }).click();
  expect(await page.getByRole("checkbox", { checked: true }).count()).toBe(6);
  expect(await page.getByRole("checkbox", { checked: false }).count()).toBe(1);
  await expect(page.getByRole("button", { name: "Share" })).toHaveCount(0);

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(
    page.getByRole("button", { name: "Share" }).first(),
  ).toBeVisible();
  await openDoublesRecap(page);

  await page.screenshot({
    animations: "disabled",
    path: "output/playwright/session-recap-doubles-multipage.png",
  });

  const preview = page.locator("[data-qa='share-preview']");
  expect(
    await preview.evaluate((image: HTMLImageElement) => [
      image.naturalWidth,
      image.naturalHeight,
    ]),
  ).toEqual([1080, 1920]);
  await page.getByRole("button", { name: "Singles" }).click();
  await expect
    .poll(() =>
      preview.evaluate((image: HTMLImageElement) => image.naturalHeight),
    )
    .toBe(1920);
  expect(
    await preview.evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBe(1080);
  await savePreview(
    page,
    "output/playwright/session-recap-singles-story-card.png",
  );
  await page.getByRole("button", { name: "Doubles" }).click();
  await expect(page.getByText("Page 1 of 2")).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: "output/playwright/session-recap-story.png",
  });
  await savePreview(page, "output/playwright/session-recap-story-card.png");

  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await savePreview(
    page,
    "output/playwright/session-recap-story-card-page-2.png",
  );
  await page.screenshot({
    animations: "disabled",
    path: "output/playwright/session-recap-doubles-page-2.png",
  });
  await page.getByRole("button", { name: "Share all pages" }).click();
  await expect(page.getByText("All pages shared.")).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as Window & { __sharedFiles?: string[] }).__sharedFiles,
    ),
  ).toEqual([
    "pickle-king-aug-22-doubles-receipts-1-of-2.png",
    "pickle-king-aug-22-doubles-receipts-2-of-2.png",
  ]);
  expect(
    (await new AxeBuilder({ page }).include("dialog").analyze()).violations,
  ).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(page.locator("[data-qa='session-recap-dialog']")).toHaveCount(0);
  await expect(page.getByText("6 selected")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Preview recap" }),
  ).toBeFocused();
});

test("keeps twelve Doubles players on one recap page", async ({ page }) => {
  await openSeededHistory(page, "supported", 3);
  await page.getByRole("button", { name: "Create recap" }).click();
  await expect(page.getByText("5 selected")).toBeVisible();
  await page.getByRole("button", { name: "Preview recap" }).click();
  await page.getByRole("button", { name: "Doubles" }).click();
  await expect(page.getByText(/Page \d+ of \d+/)).toHaveCount(0);
  await expect(page.locator("[data-qa='share-preview']")).toBeVisible();
  await page.getByRole("button", { name: "Post (4:5)" }).click();
  await savePreview(page, "output/playwright/session-recap-12-post.png");
  await page.getByRole("button", { name: "Story (9:16)" }).click();
  await savePreview(page, "output/playwright/session-recap-12-story.png");
});

test("keeps eight Doubles players on the dense composition", async ({
  page,
}) => {
  await openSeededHistory(page, "supported", 2);
  await page.getByRole("button", { name: "Create recap" }).click();
  await expect(page.getByText("4 selected")).toBeVisible();
  await page.getByRole("button", { name: "Preview recap" }).click();
  await page.getByRole("button", { name: "Doubles" }).click();
  await page.getByRole("button", { name: "Post (4:5)" }).click();
  await savePreview(page, "output/playwright/session-recap-8-post.png");
  await page.getByRole("button", { name: "Story (9:16)" }).click();
  await savePreview(page, "output/playwright/session-recap-8-story.png");
});

test("falls back to per-page export when multi-file sharing is unsupported", async ({
  page,
}) => {
  await openSeededHistory(page, "unsupported");
  await openDoublesRecap(page);
  await page.getByRole("button", { name: "Share all pages" }).click();
  await expect(
    page.getByText(/cannot share multiple images together/i),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save image" }).click();
  expect(
    await page.evaluate(
      () => (window as Window & { __downloads?: string[] }).__downloads,
    ),
  ).toEqual(["pickle-king-aug-22-doubles-receipts-1-of-2.png"]);
});

test("keeps the visible page when an additional page cannot encode", async ({
  page,
}) => {
  await openSeededHistory(page);
  await openDoublesRecap(page);
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      callback(null);
    };
  });
  await page.getByRole("button", { name: "Share all pages" }).click();
  await expect(
    page.getByText(/visible page is still available/i),
  ).toBeVisible();
  await expect(page.locator("[data-qa='share-preview']")).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as Window & { __sharedFiles?: string[] }).__sharedFiles,
    ),
  ).toBeUndefined();
});

for (const viewport of [
  { name: "phone", width: 390, height: 844 },
  { name: "phone-landscape", width: 844, height: 390 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "tablet-landscape", width: 1180, height: 820 },
  { name: "desktop", width: 1440, height: 1000 },
]) {
  test(`captures recap selection and preview at ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openSeededHistory(page);
    await page.getByRole("button", { name: "Create recap" }).click();
    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: `output/playwright/session-recap-selection-${viewport.width}x${viewport.height}.png`,
    });
    await page.getByRole("button", { name: "Preview recap" }).click();
    await expect(page.locator("[data-qa='share-preview']")).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    ).toBe(false);
    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: `output/playwright/session-recap-preview-${viewport.width}x${viewport.height}.png`,
    });
  });
}
