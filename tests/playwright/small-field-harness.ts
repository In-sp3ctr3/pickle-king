import { expect, type Page } from "@playwright/test";

const NAMES = ["Maya", "Rae", "Kai", "Noah", "Ivy", "Zane"];
const RATINGS = ["5.5+", "4.5", "4.0", "3.5", "3.0", "2.5"];
export async function chooseRating(page: Page, index: number, value: string) {
  const rating = page.getByLabel("Rating").nth(index);
  await rating.focus();
  await expect
    .poll(async () => {
      if ((await rating.getAttribute("data-state")) !== "open") {
        await rating.press("Enter");
      }
      return rating.getAttribute("data-state");
    })
    .toBe("open");
  const activeListbox = page.locator("[role='listbox'][data-state='open']");
  await expect(activeListbox).toBeVisible();
  await activeListbox.getByRole("option", { name: value, exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(rating).toContainText(value);
  await expect(rating).toHaveAttribute("data-state", "closed");
}

export async function confirmServeSetup(page: Page) {
  await expect(page.locator("[data-qa='serve-setup-dialog']")).toBeVisible();
  await page.locator("[data-qa='confirm-serve-setup']").click();
}

export async function fillRoundRobinSetup(
  page: Page,
  options: {
    build?: boolean;
    playerCount?: number;
    target?: number;
    timed?: boolean;
  } = {},
) {
  const { build = true, playerCount = 4, target = 1, timed = false } = options;
  await page.locator("[data-qa='start-tournament']").click();
  if (!timed) await page.getByRole("button", { name: "No time limit" }).click();
  for (let index = 4; index < playerCount; index += 1) {
    await page.getByRole("button", { name: "Add another player" }).click();
  }
  for (let index = 0; index < playerCount; index += 1) {
    await page.getByLabel("Player name").nth(index).fill(NAMES[index]);
    await chooseRating(page, index, RATINGS[index]);
  }
  await page.getByRole("button", { name: /Round robin \+ finals/i }).click();
  await page
    .getByRole("spinbutton", { name: "Every match plays to", exact: true })
    .fill(String(target));
  if (!build) return;
  await page.locator("[data-qa='build-bracket']").click();
  await expect(page.locator("[data-qa='round-robin-screen']")).toBeVisible();
}

export async function completeScheduledMatches(page: Page, count: number) {
  for (let match = 0; match < count; match += 1) {
    await page.locator("[data-qa='start-next']").click();
    await page
      .getByRole("button", { name: "Start match", exact: true })
      .click();
    await confirmServeSetup(page);
    await page.locator("[data-qa='score-a-add']").click();
    await page.locator("[data-qa='score-a-add']").click();
    await page.locator("[data-qa='confirm-result']").click();
  }
}
