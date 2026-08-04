import { expect, test, type Locator, type Page } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

async function buildDraw(page: Page) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Start tournament" }).click();
  await page.getByRole("button", { name: "No time limit" }).click();
  for (const [index, name] of [
    "Greg",
    "Shemar",
    "Jadan",
    "Samantha",
  ].entries()) {
    await page.getByLabel("Player name").nth(index).fill(name);
    await page.getByLabel("Rating").nth(index).click();
    await page.getByRole("option", { name: "3.5", exact: true }).click();
  }
  await page.getByLabel("Every match plays to", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Build bracket" }).click();
}

async function expectContained(parent: Locator, child: Locator) {
  const [parentBox, childBox] = await Promise.all([
    parent.boundingBox(),
    child.boundingBox(),
  ]);
  expect(parentBox).not.toBeNull();
  expect(childBox).not.toBeNull();
  expect(childBox!.x).toBeGreaterThanOrEqual(parentBox!.x - 1);
  expect(childBox!.y).toBeGreaterThanOrEqual(parentBox!.y - 1);
  expect(childBox!.x + childBox!.width).toBeLessThanOrEqual(
    parentBox!.x + parentBox!.width + 1,
  );
  expect(childBox!.y + childBox!.height).toBeLessThanOrEqual(
    parentBox!.y + parentBox!.height + 1,
  );
}

async function finishNextMatch(page: Page) {
  await page.locator("[data-qa='start-next']").click();
  await page.getByRole("button", { name: "Start match", exact: true }).click();
  await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
  await page.locator("[data-qa='confirm-result']").click();
}

test("iPad next cards contain both players and use a dark edit pencil", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await buildDraw(page);
  const card = page.locator(".tree-match-card--next").first();
  await expect(card).toBeVisible();
  await expectContained(card, card.locator("header"));
  await expectContained(card, card.locator(".tree-match-card__sides"));
  for (const row of await card.locator(".tree-match-side").all()) {
    await expectContained(card, row);
  }
  await expect(card.locator("[data-qa='edit-bracket-match']")).toHaveCSS(
    "color",
    "rgb(9, 11, 8)",
  );
  await expect(card).toContainText("Next");
  const [cardBox, headerBox, roundBox, statusBox, editBox, sidesBox, startBox] =
    await Promise.all([
      card.boundingBox(),
      card.locator("header").boundingBox(),
      card.locator("header > p").boundingBox(),
      card.locator(".tree-match-card__status").boundingBox(),
      card.locator("[data-qa='edit-bracket-match']").boundingBox(),
      card.locator(".tree-match-card__sides").boundingBox(),
      card.locator("[data-qa='bracket-node-start']").boundingBox(),
    ]);
  expect(roundBox!.x).toBeLessThan(statusBox!.x);
  expect(editBox!.x).toBeGreaterThan(statusBox!.x + statusBox!.width);
  expect(
    Math.abs(
      statusBox!.x +
        statusBox!.width / 2 -
        (headerBox!.x + headerBox!.width / 2),
    ),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(
      startBox!.y + startBox!.height / 2 - (sidesBox!.y + sidesBox!.height / 2),
    ),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(
      headerBox!.y -
        cardBox!.y -
        (cardBox!.y + cardBox!.height - (sidesBox!.y + sidesBox!.height)),
    ),
  ).toBeLessThanOrEqual(1);
  const available = page.locator(".tree-match-card--available").first();
  await expect(available).toContainText("Available");
  await expect(available).not.toContainText("Next");
  expect(
    await available
      .locator("header > p")
      .evaluate((label) => label.scrollWidth <= label.clientWidth),
  ).toBe(true);
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: "output/playwright/match-card-next-balanced.png",
  });
});

test("the current final uses balanced warm-metal geometry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await buildDraw(page);
  for (let match = 0; match < 3; match += 1) await finishNextMatch(page);

  const final = page.locator("[data-qa='final-match'] .final-match-card");
  await expect(final).toHaveClass(/tree-match-card--next/);
  await expect(final).toHaveCSS("background-color", "rgb(226, 189, 100)");
  await expect(final.locator("[data-qa='final-title']")).toHaveCSS(
    "color",
    "rgb(9, 11, 8)",
  );
  await expect(final.locator("[data-qa='edit-bracket-match']")).toHaveCSS(
    "color",
    "rgb(9, 11, 8)",
  );
  const [cardBox, trophyBox, leftBox, rightBox] = await Promise.all([
    final.boundingBox(),
    final.locator(".final-match-card__faceoff > svg").boundingBox(),
    final.locator(".final-match-side.is-left").boundingBox(),
    final.locator(".final-match-side.is-right").boundingBox(),
  ]);
  expect(Math.abs(leftBox!.width - rightBox!.width)).toBeLessThanOrEqual(1);
  expect(
    Math.abs(
      trophyBox!.x + trophyBox!.width / 2 - (cardBox!.x + cardBox!.width / 2),
    ),
  ).toBeLessThanOrEqual(1);
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: "output/playwright/final-card-current-balanced.png",
  });
});
