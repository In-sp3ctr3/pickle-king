import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { confirmServeSetup } from "./small-field-harness";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

async function openQuickComposer(page: Page) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Quick match" }).click();
  await page.getByLabel("Side A").fill("Jean-Baptiste M.");
  await page.getByLabel("Side B").fill("Alexandra");
  await page.getByLabel("Play to").fill("1");
  await page.getByRole("button", { name: "Open scorer" }).click();
  await page.getByRole("button", { name: "Start match", exact: true }).click();
  await confirmServeSetup(page);
  await page.locator("[data-qa='score-a-add']").click({ clickCount: 2 });
  await page.getByRole("button", { name: "Confirm result" }).click();
  await page.getByRole("button", { name: "Share result" }).click();
  await expect(page.locator("[data-qa='share-preview']")).toBeVisible();
}

test("Share Composer defaults to Story and keeps its design across ratios", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await openQuickComposer(page);

  await expect(
    page.getByRole("button", { name: "Story (9:16)" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("radio", { name: "Poster" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect
    .poll(() => page.locator(".quick-share-design img").count())
    .toBe(3);

  const rail = page.locator(".quick-share-design-rail");
  expect(
    await rail.evaluate((element) => element.scrollWidth > element.clientWidth),
  ).toBe(true);
  await page.getByRole("radio", { name: "Receipt" }).focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Post (4:5)" }).click();
  await expect(page.getByRole("radio", { name: "Receipt" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.locator("[data-qa='share-preview']")).toHaveJSProperty(
    "naturalHeight",
    1350,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(page.locator("[data-qa='result-saved']")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Share result" }),
  ).toBeFocused();
});

for (const viewport of [
  { name: "phone", width: 390, height: 844 },
  { name: "phone-landscape", width: 844, height: 390 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "tablet-landscape", width: 1180, height: 820 },
  { name: "desktop", width: 1440, height: 1000 },
] as const) {
  test(`captures the composer at ${viewport.name}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    await openQuickComposer(page);
    await page.screenshot({
      path: `output/playwright/share-composer-${viewport.name}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      ),
    ).toBe(false);
  });
}
