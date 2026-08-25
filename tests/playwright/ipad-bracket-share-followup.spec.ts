import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

async function openSetup(page: Page) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Start tournament" }).click();
}

async function fillFourPlayers(page: Page) {
  for (const [index, name] of ["Jaden", "Samantha", "Jon", "Robby"].entries()) {
    await page.getByLabel("Player name").nth(index).fill(name);
    await page.getByLabel("Rating").nth(index).click();
    await page.getByRole("option", { name: "3.5", exact: true }).click();
  }
}

async function buildFourPlayerDraw(page: Page, complete = false) {
  await openSetup(page);
  await page.getByRole("button", { name: "No time limit" }).click();
  await fillFourPlayers(page);
  await page.getByLabel("Every match plays to", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Build bracket" }).click();
  if (!complete) return;
  for (let match = 0; match < 4; match += 1) {
    await page.locator("[data-qa='start-next']").click();
    await page
      .getByRole("button", { name: "Start match", exact: true })
      .click();
    await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
    await page.locator("[data-qa='confirm-result']").click();
  }
  await page.locator("[data-qa='view-final-bracket']").click();
}

test("setup can reset the entire form without clearing remembered history", async ({
  page,
}) => {
  await openSetup(page);
  const reset = page.getByRole("button", { name: "Reset all fields" });
  const fieldHeading = page.getByText("The field", { exact: true });
  const [resetBox, fieldHeadingBox] = await Promise.all([
    reset.boundingBox(),
    fieldHeading.boundingBox(),
  ]);
  expect((resetBox?.y ?? 0) + (resetBox?.height ?? 0)).toBeLessThan(
    fieldHeadingBox?.y ?? 0,
  );
  expect(
    (fieldHeadingBox?.y ?? 0) - ((resetBox?.y ?? 0) + (resetBox?.height ?? 0)),
  ).toBeLessThanOrEqual(40);
  await page.screenshot({
    fullPage: true,
    path: "output/playwright/setup-reset-position.png",
  });
  await fillFourPlayers(page);
  await page.getByRole("button", { name: "No time limit" }).click();
  await page.getByLabel("Every match plays to", { exact: true }).fill("7");
  await reset.click();

  await expect(page.getByLabel("Player name")).toHaveCount(4);
  for (const input of await page.getByLabel("Player name").all()) {
    await expect(input).toHaveValue("");
    await expect(input).toHaveAttribute("maxlength", "16");
  }
  await expect(page.getByLabel("Rating")).toHaveText([
    "Choose level",
    "Choose level",
    "Choose level",
    "Choose level",
  ]);
  await expect(
    page.getByRole("button", { name: "Timed booking" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByLabel("Every match plays to", { exact: true }),
  ).toHaveValue("11");
});

test("iPad run of show stacks both players around versus", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await buildFourPlayerDraw(page);
  const [first, versus, second] = await page
    .locator(".run-of-show__faceoff > *")
    .evaluateAll((items) =>
      items.map((item) => item.getBoundingClientRect().toJSON()),
    );
  expect(first.bottom).toBeLessThanOrEqual(versus.top + 1);
  expect(versus.bottom).toBeLessThanOrEqual(second.top + 1);
  expect(Math.abs(first.x - second.x)).toBeLessThanOrEqual(2);
});

test("completed iPad bracket centers the final and keeps bronze directly below", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await buildFourPlayerDraw(page, true);
  const final = page.locator("[data-qa='final-match']");
  const bronze = page.locator("[data-qa='bronze-match']");
  await expect(bronze).toBeVisible();
  await expect(page.locator(".bracket-screen__bronze")).toHaveCount(0);
  const [finalBox, bronzeBox] = await Promise.all([
    final.boundingBox(),
    bronze.boundingBox(),
  ]);
  expect(
    (bronzeBox?.y ?? 0) - ((finalBox?.y ?? 0) + (finalBox?.height ?? 0)),
  ).toBeLessThanOrEqual(48);
  expect(
    Math.abs(
      (finalBox?.x ?? 0) +
        (finalBox?.width ?? 0) / 2 -
        ((bronzeBox?.x ?? 0) + (bronzeBox?.width ?? 0) / 2),
    ),
  ).toBeLessThanOrEqual(1);
  expect(
    await final
      .locator(".final-match-side.is-right > strong")
      .evaluate((score) => getComputedStyle(score).textAlign),
  ).toBe("left");
  for (const card of await page.locator(".tree-match-card").all()) {
    await expect(
      card.locator("header [data-qa='edit-bracket-match']"),
    ).toBeVisible();
  }
  await page.screenshot({
    fullPage: true,
    path: "output/playwright/ipad-completed-bracket-followup.png",
  });
});

test("share format choices stay concise and side by side", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await buildFourPlayerDraw(page, true);
  await page.getByRole("button", { name: "View results" }).click();
  await page.getByRole("button", { name: "Share tournament" }).click();
  const dialog = page.getByRole("dialog", { name: "Share tournament" });
  await expect(
    dialog.getByRole("button", { name: "Post", exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Story / Reel", exact: true }),
  ).toBeVisible();
  await expect(dialog.getByText(/4:5|9:16/)).toHaveCount(0);
  const boxes = await dialog
    .locator(".share-format-choice button")
    .evaluateAll((buttons) =>
      buttons.map((button) => button.getBoundingClientRect().toJSON()),
    );
  expect(new Set(boxes.map(({ y }) => Math.round(y))).size).toBe(1);
});

test("results use player names instead of internal ranking terminology", async ({
  page,
}) => {
  await buildFourPlayerDraw(page, true);
  await page.getByRole("button", { name: "View results" }).click();
  await expect(page.locator("[data-qa='results']")).not.toContainText(
    /Upset watch|seed/i,
  );
});
