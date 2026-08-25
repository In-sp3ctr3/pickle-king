import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

async function openIdleScorer(page: Page, target = 2) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Quick match" }).click();
  await page.getByLabel("Side A").fill("Robbie");
  await page.getByLabel("Side B").fill("Maya");
  await page.getByLabel("Play to").fill(String(target));
  await page.getByRole("button", { name: "Open scorer" }).click();
}

async function startScoring(page: Page) {
  await page
    .getByRole("button", { name: "Start match", exact: true })
    .first()
    .click();
  await page.locator("[data-qa='confirm-serve-setup']").click();
}

for (const viewport of [
  { name: "ipad-portrait", width: 820, height: 1180 },
  { name: "ipad-landscape", width: 1180, height: 820 },
  { name: "phone-portrait", width: 390, height: 844 },
  { name: "phone-landscape", width: 844, height: 390 },
] as const) {
  test(`${viewport.name} scorer starts clearly and never clips`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openIdleScorer(page);
    const start = page.getByRole("button", {
      name: "Start match",
      exact: true,
    });
    await expect(start).toBeVisible();
    await expect(start).toBeFocused();
    await expect(page.locator("[data-qa='score-a-add']")).toBeDisabled();
    await expect(page.getByText("Untimed", { exact: true })).toHaveCount(0);
    const startBox = await start.boundingBox();
    expect(startBox?.width).toBeLessThanOrEqual(300);
    expect(startBox?.height).toBeLessThanOrEqual(112);
    expect(
      Math.abs(
        (startBox?.x ?? 0) + (startBox?.width ?? 0) / 2 - viewport.width / 2,
      ),
    ).toBeLessThanOrEqual(2);
    expect(
      Math.abs(
        (startBox?.y ?? 0) + (startBox?.height ?? 0) / 2 - viewport.height / 2,
      ),
    ).toBeLessThanOrEqual(40);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollHeight <= window.innerHeight &&
          document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await startScoring(page);
    await expect(start).toHaveCount(0);
    const controls = page.locator(".match-controls");
    await expect(controls).toBeVisible();
    const box = await controls.boundingBox();
    expect(box && box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  });
}

test("the result review is a branded, single-crown celebration", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await openIdleScorer(page);
  await startScoring(page);
  await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
  const dialog = page.getByRole("dialog", { name: "Robbie wins" });
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Robbie wins" }),
  ).toBeVisible();
  await expect(dialog.getByText("Won by 2")).toHaveCount(0);
  await expect(dialog.getByText(/Confirm to finish/)).toHaveCount(0);
  const preview = dialog.locator("[data-qa='result-preview']");
  await expect(preview).toBeVisible();
  await expect(preview).toHaveJSProperty("naturalWidth", 1080);
  await expect(preview).toHaveJSProperty("naturalHeight", 1350);
  await expect(
    dialog.getByRole("button", { name: "Share result", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm result" }),
  ).toBeFocused();
  await expect(dialog.getByText(/Building image/)).toHaveCount(0);
  for (const box of await dialog
    .locator(".share-format-choice button")
    .evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().toJSON()),
    )) {
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(48);
  }
  await expect(
    dialog.locator("[data-qa='victory-confetti'] canvas"),
  ).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box?.width).toBeGreaterThan(700);
  await page.screenshot({
    animations: "disabled",
    path: "output/playwright/victory-dialog-ipad.png",
  });
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Post", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Confirm result" }),
  ).toBeFocused();
  const downloadPromise = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "Download result", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^pickle-king-score-.*\.png$/);
  await download.saveAs("output/playwright/result-share-preview.png");
  await page.getByRole("button", { name: "Edit score" }).click();
  await page.getByRole("button", { name: "Review corrected result" }).click();
  await expect(page.getByRole("dialog", { name: "Robbie wins" })).toBeVisible();
  await expect(page.locator("[data-qa='victory-confetti']")).toHaveAttribute(
    "data-motion-state",
    "burst",
  );
  await page.getByRole("button", { name: "Confirm result" }).click();
  await expect(page.locator("[data-qa='quick-match-setup']")).toBeVisible();
});

test("reduced motion swaps the burst for static celebration", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openIdleScorer(page);
  await startScoring(page);
  await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .locator(".victory-confetti__static")
      .evaluate((element) => getComputedStyle(element).display),
  ).toBe("block");
  expect(
    await page
      .locator("[data-qa='victory-confetti'] canvas")
      .evaluate((element) => getComputedStyle(element).display),
  ).toBe("none");
});

test("a 4 to 11 result keeps double-digit scores in separate lanes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await openIdleScorer(page, 11);
  await startScoring(page);
  await page.locator("[data-qa='score-a-add']").click({ clickCount: 4 });
  await page.locator("[data-qa='score-b-add']").click({ clickCount: 12 });
  const preview = page.locator("[data-qa='result-preview']");
  await expect(preview).toHaveAttribute(
    "alt",
    "Maya wins 4 to 11. Share image preview.",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  const download = await downloadPromise;
  await download.saveAs("output/playwright/result-share-4-11.png");
});

test("a persisted 40-character winner remains shareable from history", async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function delayedToBlob(
      callback,
      type,
      quality,
    ) {
      window.setTimeout(
        () => original.call(this, callback, type, quality),
        1_200,
      );
    };
  });
  await page.addInitScript(() => {
    window.localStorage.clear();
    const winner = "Samantha Elizabeth Richardson-Montgomery";
    const loser = "Christopher Nathaniel Thompson-Alexander";
    window.localStorage.setItem(
      "pickle-king:history",
      JSON.stringify({
        version: 2,
        quickMatches: [
          {
            completedAt: Date.UTC(2026, 7, 22, 18),
            finishReason: "target",
            format: "singles",
            id: "legacy-40-character-result",
            labels: { sideA: winner, sideB: loser },
            participants: { sideA: [winner], sideB: [loser] },
            score: { sideA: 11, sideB: 7 },
            targetScore: 11,
            winner: "A",
          },
        ],
        tournaments: [],
      }),
    );
  });
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Match history" }).click();
  await expect(
    page.getByText("Samantha Elizabeth Richardson-Montgomery"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Share" }).click();
  const preview = page.locator("[data-qa='share-preview']");
  await expect(preview).toBeVisible();
  await expect(preview).toHaveJSProperty("naturalWidth", 1080);
  await expect(preview).toHaveJSProperty("naturalHeight", 1350);
});

test("draw utilities live with the bracket they affect", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "No time limit" }).click();
  for (const [index, name] of ["Maya", "Rae", "Kai", "Noah"].entries()) {
    await page.getByLabel("Player name").nth(index).fill(name);
    await page.getByLabel("Rating").nth(index).click();
    await page.getByRole("option", { name: "3.5" }).click();
  }
  await page.getByRole("button", { name: "Build bracket" }).click();
  const draw = page.locator(".bracket-screen__draw");
  await expect(draw.locator("[data-qa='edit-draw']")).toBeVisible();
  await expect(draw.locator("[data-qa='share-bracket']")).toBeVisible();
  await expect(
    page.locator(".bracket-screen__header [data-qa='edit-draw']"),
  ).toHaveCount(0);
});
