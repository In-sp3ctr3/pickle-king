import { expect, test, type Locator, type Page } from "@playwright/test";

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
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Start match", exact: true })
      .click();
    await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
    await page.getByRole("button", { name: "Confirm result" }).click();
  }
}

async function downloadAs(page: Page, button: Locator, path: string) {
  const event = page.waitForEvent("download");
  await button.click();
  const download = await event;
  await download.saveAs(path);
  return download;
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
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Start match", exact: true })
    .click();
  await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
  const preview = page.locator("[data-qa='result-preview']");
  const poster = page.getByRole("button", { name: "Poster" });
  const frame = page.getByRole("button", { name: "Frame" });
  const receipt = page.getByRole("button", { name: "Receipt" });
  await expect(poster).toHaveAttribute("aria-pressed", "true");
  await expect(frame).toHaveAttribute("aria-pressed", "false");
  await expect(receipt).toHaveAttribute("aria-pressed", "false");
  await expect(preview).toHaveJSProperty("naturalWidth", 1080);
  await expect(preview).toHaveJSProperty("naturalHeight", 1350);
  const downloadButton = page.getByRole("button", { name: "Download result" });
  const download = await downloadAs(
    page,
    downloadButton,
    "output/playwright/share-quick-feed.png",
  );
  expect(download.suggestedFilename()).toBe(
    "pickle-king-score-result-poster-feed.png",
  );
  await expect(downloadButton).toHaveText("Saved");
  await page.getByRole("button", { name: "Story / Reel" }).click();
  await downloadAs(
    page,
    downloadButton,
    "output/playwright/share-quick-poster-story.png",
  );
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await frame.click();
  await expect(frame).toHaveAttribute("aria-pressed", "true");
  await expect(preview).toHaveJSProperty("naturalHeight", 1350);
  const frameDownload = await downloadAs(
    page,
    downloadButton,
    "output/playwright/share-quick-frame-feed.png",
  );
  expect(frameDownload.suggestedFilename()).toBe(
    "pickle-king-score-result-frame-feed.png",
  );
  await page.getByRole("button", { name: "Story / Reel" }).click();
  await downloadAs(
    page,
    downloadButton,
    "output/playwright/share-quick-frame-story.png",
  );
  await receipt.click();
  await expect(receipt).toHaveAttribute("aria-pressed", "true");
  await expect(preview).toHaveJSProperty("naturalWidth", 1080);
  await expect(preview).toHaveJSProperty("naturalHeight", 1920);
  const storyDownload = await downloadAs(
    page,
    downloadButton,
    "output/playwright/share-quick-story.png",
  );
  expect(storyDownload.suggestedFilename()).toBe(
    "pickle-king-score-result-receipt-story.png",
  );
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
  test.setTimeout(120_000);
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
  await downloadAs(page, download, "output/playwright/share-recap-feed.png");
  await expect(download).toHaveText("Saved");
  await dialog.getByRole("button", { name: "Story / Reel" }).click();
  await expect(preview).toHaveJSProperty("naturalWidth", 1080);
  await expect(preview).toHaveJSProperty("naturalHeight", 1920);
  await downloadAs(page, download, "output/playwright/share-recap-story.png");
  await dialog.getByRole("button", { name: "Post" }).click();
  await expect(preview).toHaveJSProperty("naturalHeight", 1350);
  await dialog.getByRole("tab", { name: "Player stats" }).click();
  await expect(preview).toHaveJSProperty("naturalHeight", 1350);
  await downloadAs(page, download, "output/playwright/share-stats-feed.png");
  await dialog.getByRole("button", { name: "Story / Reel" }).click();
  await downloadAs(page, download, "output/playwright/share-stats-story.png");
  await dialog.getByRole("tab", { name: "Full bracket" }).click();
  await dialog.getByRole("button", { name: "Full draw" }).click();
  await expect(preview).toHaveJSProperty("naturalWidth", 1600);
  await expect(preview).toHaveJSProperty("naturalHeight", 1200);

  await downloadAs(page, download, "output/playwright/share-bracket-feed.png");
  await expect(dialog.getByText("Download started")).toHaveCount(0);

  await dialog.getByRole("button", { name: "Expand bracket preview" }).click();
  await expect(
    dialog.getByRole("button", { name: "Fit bracket preview" }),
  ).toBeVisible();
  expect(
    await dialog
      .locator(".tournament-share-preview")
      .evaluate(
        (element) =>
          element.scrollWidth > element.clientWidth ||
          element.scrollHeight > element.clientHeight,
      ),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Fit bracket preview" }).click();

  await dialog.getByRole("button", { name: "Post" }).click();
  await expect(preview).toHaveJSProperty("naturalWidth", 1080);
  await expect(preview).toHaveJSProperty("naturalHeight", 1350);
  await downloadAs(page, download, "output/playwright/share-bracket-post.png");
  await dialog.getByRole("button", { name: "Story / Reel" }).click();
  await expect(preview).toHaveJSProperty("naturalHeight", 1920);
  await downloadAs(page, download, "output/playwright/share-bracket-story.png");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Share tournament" }),
  ).toBeFocused();
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
    await expect
      .poll(() =>
        figure.evaluate((node) => {
          const image = node.querySelector("img");
          if (!image) return false;
          const parent = node.getBoundingClientRect();
          const child = image.getBoundingClientRect();
          return (
            child.x >= parent.x &&
            child.y >= parent.y &&
            child.right <= parent.right + 1 &&
            child.bottom <= parent.bottom + 1
          );
        }),
      )
      .toBe(true);
    expect(
      await page.evaluate(() => {
        const offenders = [...document.querySelectorAll<HTMLElement>("body *")]
          .filter((node) => node.offsetParent !== null)
          .filter((node) => !node.closest("[data-share-font-preload]"))
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
