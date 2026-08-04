import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

async function openFresh(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "networkidle" });
}

async function openQuickMatch(page: Page, target = 11) {
  await openFresh(page);
  await page.getByRole("button", { name: "Quick match" }).click();
  await page.getByLabel("Side A").fill("Alex");
  await page.getByLabel("Side B").fill("Blair");
  await page.getByLabel("Play to").fill(String(target));
  await page.getByRole("button", { name: "Open scorer" }).click();
  await expect(page.getByText("Untimed", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Start match", exact: true }).click();
}

test("quick setup points to each invalid field and animates the timed rule", async ({
  page,
}) => {
  await openFresh(page);
  await page.getByRole("button", { name: "Quick match" }).click();
  await page.getByRole("button", { name: "Open scorer" }).click();
  await expect(page.getByLabel("Side A")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("Side B")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByText("Enter a player name.")).toHaveCount(2);
  await page.getByLabel("Side A").fill("Alex");
  await expect(page.getByLabel("Side A")).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  await expect(page.getByText("Enter a player name.")).toHaveCount(1);

  await page.getByRole("button", { name: "Timed" }).click();
  await expect(page.getByLabel("Time cap · minutes")).toBeVisible();
  await expect(
    page.getByLabel("Time cap · minutes").locator(".."),
  ).toHaveAttribute("data-motion-state", "open");
});

test("tournament setup focuses and marks the first invalid player row", async ({
  page,
}) => {
  await openFresh(page);
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "Build bracket" }).click();
  await expect(page.getByLabel("Player name").first()).toBeFocused();
  await expect(page.getByLabel("Player name").first()).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator(".setup-player-row").first()).toHaveAttribute(
    "data-invalid",
    "true",
  );
  await expect(page.getByText("Enter a player name.")).toHaveCount(4);
});

test("play-to-seven continues through a tie and one-point lead", async ({
  page,
}) => {
  await openQuickMatch(page, 7);
  const addA = page.locator("[data-qa='score-a-add']");
  const addB = page.locator("[data-qa='score-b-add']");
  for (let point = 0; point < 7; point += 1) {
    await addA.click();
    await addB.click();
  }
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await addA.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await addA.click();
  await expect(page.getByRole("heading", { name: "Alex wins" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm result" }),
  ).toBeFocused();

  await page.getByRole("button", { name: "Edit score" }).click();
  await expect(addA).toBeFocused();
  for (let point = 0; point < 4; point += 1) await addB.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Review corrected result" }).click();
  await expect(page.getByRole("heading", { name: "Blair wins" })).toBeVisible();
});

test("a burst of score taps locks at the winning point", async ({ page }) => {
  await openQuickMatch(page, 7);
  const addA = page.locator("[data-qa='score-a-add']");

  await addA.evaluate((button) => {
    for (let tap = 0; tap < 12; tap += 1) {
      (button as HTMLButtonElement).click();
    }
  });

  await expect(page.getByRole("heading", { name: "Alex wins" })).toBeVisible();
  await expect(page.locator("[data-qa='result-preview']")).toHaveAttribute(
    "alt",
    "Alex wins 7 to 0. Share image preview.",
  );
  await expect(
    page.locator("section[aria-label='Alex, 7 points']"),
  ).toBeVisible();
});

test("double-digit scores stay legible at tablet size", async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await openQuickMatch(page, 11);
  const addA = page.locator("[data-qa='score-a-add']");
  const addB = page.locator("[data-qa='score-b-add']");
  for (let point = 0; point < 10; point += 1) {
    await addA.click();
    await addB.click();
  }
  await expect(
    page.locator("section[aria-label='Alex, 10 points']"),
  ).toBeVisible();
  await expect(
    page.locator("section[aria-label='Blair, 10 points']"),
  ).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: "output/playwright/double-digit-score.png",
  });
});

test("restart, tied early finish, and operator-selected winner are explicit", async ({
  page,
}) => {
  await openQuickMatch(page);
  const addA = page.locator("[data-qa='score-a-add']");
  const addB = page.locator("[data-qa='score-b-add']");
  await addA.click();
  await page.getByRole("button", { name: "Restart" }).click();
  await expect(
    page.getByRole("heading", { name: "Start this match over?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Restart match" }).click();
  await expect(
    page.locator("section[aria-label='Alex, 0 points']"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Start match", exact: true }).click();
  await addA.click();
  await addB.click();
  await page.getByRole("button", { name: "End match" }).click();
  await expect(
    page.getByRole("heading", { name: "This match needs a winner." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Award Alex" }).click();
  await expect(
    page.getByText("Winner selected by the operator."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm result" }).click();
  await expect(page.locator("[data-qa='quick-match-setup']")).toBeVisible();
});

test("discarding an early finish returns without a result", async ({
  page,
}) => {
  await openQuickMatch(page);
  await page.getByRole("button", { name: "End match" }).click();
  await page.getByRole("button", { name: "Discard this match" }).click();
  await expect(page.locator("[data-qa='quick-match-setup']")).toBeVisible();
});

test("setup explains the four-player minimum and builds an untimed centered draw", async ({
  page,
}) => {
  await openFresh(page);
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "Remove player 1" }).click();
  await expect(
    page.getByRole("heading", { name: "Keep four in the field." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep editing" }).click();
  await page.getByRole("button", { name: "No time limit" }).click();
  await expect(page.getByLabel("Court booking")).toHaveCount(0);

  for (let index = 0; index < 4; index += 1) {
    await page
      .getByLabel("Player name")
      .nth(index)
      .fill(["Maya", "Rae", "Kai", "Noah"][index]);
    await page.getByLabel("Rating").nth(index).click();
    await page.getByRole("option", { name: "3.5" }).click();
  }
  await page.getByRole("button", { name: "Build bracket" }).click();
  await expect(
    page.getByRole("heading", { name: "Road to the crown." }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator("[data-qa='final-match']")).toBeVisible();
  await expect(page.locator(".bracket-match-node")).toHaveCount(4);
  await expect(page.locator("[data-match-queue-state='next']")).toHaveCount(1);
  await expect(
    page.locator("[data-match-queue-state='available']"),
  ).toHaveCount(1);
  await expect(
    page.locator(".bracket-match-node").first().locator(".tree-match-side"),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "Back to setup" }).click();
  await expect(page.locator("[data-qa='tournament-setup']")).toBeVisible();
  await expect(page.getByLabel("Player name").first()).toHaveValue("Maya");
});

test("a six-player draw stays connected and exposes the ready opening courts", async ({
  page,
}) => {
  await openFresh(page);
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "No time limit" }).click();
  await page.getByRole("button", { name: "Add another player" }).click();
  await page.getByRole("button", { name: "Add another player" }).click();
  const names = ["Maya", "Rae", "Kai", "Noah", "Luis", "Trent"];
  for (let index = 0; index < names.length; index += 1) {
    await page.getByLabel("Player name").nth(index).fill(names[index]);
    await page.getByLabel("Rating").nth(index).click();
    await page.getByRole("option", { name: "3.5" }).click();
  }
  await page.getByRole("button", { name: "Build bracket" }).click();
  await expect(page.locator(".bracket-match-node")).toHaveCount(8);
  await expect(page.locator("[data-match-queue-state='next']")).toHaveCount(1);
  await expect(
    page.locator("[data-match-queue-state='available']"),
  ).toHaveCount(1);
  const viewport = page.locator(".bracket-tree-viewport");
  await page.getByRole("button", { name: "Show left draw" }).click();
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollLeft))
    .toBe(0);
  await page.getByRole("button", { name: "Show right draw" }).click();
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Show championship match" }).click();
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: "output/playwright/six-player-bracket.png",
  });
});

test("the installed shell reopens offline", async ({ context, page }) => {
  await openFresh(page);
  const registrationReady = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;
    await navigator.serviceWorker.ready;
    return true;
  });
  expect(registrationReady).toBe(true);

  await page.reload({ waitUntil: "networkidle" });
  expect(
    await page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
  ).toBe(true);

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("button", { name: "Start tournament" }),
  ).toBeVisible();
});
