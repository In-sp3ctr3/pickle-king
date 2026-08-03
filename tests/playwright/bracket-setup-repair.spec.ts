import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000/";
const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "phone-landscape", width: 844, height: 390 },
  { name: "ipad-mini", width: 768, height: 1024 },
  { name: "ipad-air", width: 820, height: 1180 },
  { name: "ipad-landscape", width: 1024, height: 768 },
  { name: "large-landscape", width: 1180, height: 820 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

async function openSetup(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Start tournament" }).click();
}

async function fillPlayers(page: Page, names: string[]) {
  const ratings = ["5.0", "4.0", "3.0", "2.5"];
  for (const [index, name] of names.entries()) {
    await page.getByLabel("Player name").nth(index).fill(name);
    await page.getByLabel("Rating").nth(index).click();
    await page
      .getByRole("option", { name: ratings[index], exact: true })
      .click();
  }
}

async function elementsStayInside(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((elements) =>
    elements.every((element) => {
      const parent = element.getBoundingClientRect();
      return [...element.children].every((child) => {
        const box = child.getBoundingClientRect();
        return (
          box.left >= parent.left - 1 &&
          box.right <= parent.right + 1 &&
          box.top >= parent.top - 1 &&
          box.bottom <= parent.bottom + 1
        );
      });
    }),
  );
}

for (const viewport of viewports) {
  test(`court controls stay contained at ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openSetup(page);
    await expect(
      page.locator(".setup-time-fields .setup-number-input"),
    ).toHaveCount(3);
    for (const box of await page
      .locator(".setup-number-input button, .floating-app-nav button")
      .evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().toJSON()),
      )) {
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeGreaterThanOrEqual(48);
    }
    expect(await elementsStayInside(page, ".setup-number-input")).toBe(true);
    expect(
      await page.locator(".setup-number-input").evaluateAll((controls) =>
        controls.every((control) => {
          const row = control.getBoundingClientRect();
          return [...control.querySelectorAll("button")].every((button) => {
            const box = button.getBoundingClientRect();
            return (
              Math.abs(box.y + box.height / 2 - (row.y + row.height / 2)) <= 1
            );
          });
        }),
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".setup-time-fields .setup-number-field")
        .evaluateAll((elements) =>
          elements.every((element, index) =>
            elements.slice(index + 1).every((other) => {
              const left = element.getBoundingClientRect();
              const right = other.getBoundingClientRect();
              return (
                left.right <= right.left + 1 ||
                right.right <= left.left + 1 ||
                left.bottom <= right.top + 1 ||
                right.bottom <= left.top + 1
              );
            }),
          ),
        ),
    ).toBe(true);
    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: `test-results/bracket-setup-repair/setup-${viewport.name}.png`,
    });
  });
}

test("long tournament names remain bounded in the run of show and nodes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await openSetup(page);
  await page.getByRole("button", { name: "No time limit" }).click();
  await fillPlayers(page, [
    "Shemar Alexander Montgomery-Williamson",
    "Samantha Elizabeth Richardson-Montgomery",
    "Christopher Nathaniel Thompson-Alexander",
    "Alexandria Catherine Robinson-Montgomery",
  ]);
  await page.getByRole("button", { name: "Build bracket" }).click();
  await expect(page.locator("[data-qa='bracket-screen']")).toBeVisible();
  for (const box of await page
    .locator(".tree-match-card__action")
    .evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().toJSON()),
    )) {
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(48);
  }
  expect(await elementsStayInside(page, ".run-of-show__faceoff")).toBe(true);
  expect(await elementsStayInside(page, ".tree-match-side")).toBe(true);
  expect(
    (await page.locator(".tree-match-card").allTextContents()).join(" "),
  ).not.toContain("undefined");
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: "test-results/bracket-setup-repair/bracket-long-names-820.png",
  });
});

test("the iPad final stays compact with bounded finalist names", async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await openSetup(page);
  await page.getByRole("button", { name: "No time limit" }).click();
  await fillPlayers(page, [
    "Shemar Alexander Montgomery-Williamson",
    "Samantha Elizabeth Richardson-Montgomery",
    "Christopher Nathaniel Thompson-Alexander",
    "Alexandria Catherine Robinson-Montgomery",
  ]);
  await page.getByLabel("Every match plays to", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Build bracket" }).click();
  for (let match = 0; match < 2; match += 1) {
    await page.locator("[data-qa='start-next']").click();
    await page
      .getByRole("button", { name: "Start match", exact: true })
      .click();
    await page.locator("[data-qa='score-a-add']").click();
    await page.locator("[data-qa='score-a-add']").click();
    await page.locator("[data-qa='confirm-result']").click();
  }
  const final = page.locator("[data-qa='final-match']");
  await expect(final).toContainText("Shemar Alexander Montgomery-Williamson");
  await expect(final).toContainText("Samantha Elizabeth Richardson-Montgomery");
  expect(await elementsStayInside(page, ".final-match-card__faceoff")).toBe(
    true,
  );
  expect((await final.boundingBox())?.height).toBeLessThanOrEqual(126);
  await expect(final.locator(".lucide-pencil")).toBeVisible();
  await expect(
    page.locator("[data-match-status='complete']").first(),
  ).toContainText("Complete");
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: "test-results/bracket-setup-repair/final-long-names-820.png",
  });
});

test("a random draw can reroll only before the first match", async ({
  page,
}) => {
  await openSetup(page);
  await page.getByRole("button", { name: "No time limit" }).click();
  await page.getByRole("button", { name: "Random draw" }).click();
  await fillPlayers(page, ["Maya", "Rae", "Kai", "Noah"]);
  await page.getByRole("button", { name: "Build bracket" }).click();
  const reroll = page.locator("[data-qa='reroll-random-draw']");
  await expect(reroll).toBeVisible();
  const before = await page
    .locator(".bracket-tree-node .tree-match-card")
    .evaluateAll((cards) =>
      cards.map((card) => card.getAttribute("aria-label")),
    );
  await reroll.click();
  await expect
    .poll(() =>
      page
        .locator(".bracket-tree-node .tree-match-card")
        .evaluateAll((cards) =>
          cards.map((card) => card.getAttribute("aria-label")),
        ),
    )
    .not.toEqual(before);
  await page.locator("[data-qa='start-next']").click();
  await expect(reroll).toHaveCount(0);
});
