import { expect, test } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

test("shows the legal server, side-out, and undo state", async ({ page }) => {
  await page.setViewportSize({ width: 319, height: 768 });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("[data-qa='app-version']")).toHaveText(
    "v1.9.0-alpha.2",
  );
  await page.getByRole("button", { name: "Quick match" }).click();
  await page.getByLabel("Side A").fill("Alex");
  await page.getByLabel("Side B").fill("Blair");
  await page.getByRole("button", { name: "Open scorer" }).click();
  await page.getByRole("button", { name: "Start match", exact: true }).click();
  await expect(page.locator("[data-qa='serve-setup-dialog']")).toBeVisible();
  await page.locator("[data-qa='confirm-serve-setup']").click();

  const guide = page.locator("[data-qa='serve-guide']");
  const court = guide.getByRole("img");
  await expect(guide).toContainText("Alex");
  await expect(guide).toContainText("Opening serve · Server 2");
  await expect(court).toHaveAttribute(
    "aria-label",
    /right service box on the left end/,
  );
  await expect(court).toHaveClass(/serve-court--far-right/);
  expect(
    await court.evaluate((element) => {
      const courtBounds = element.getBoundingClientRect();
      const marker = element
        .querySelector<HTMLElement>(".serve-court__player-marker")!
        .getBoundingClientRect();
      return (
        marker.left + marker.width / 2 <
        courtBounds.left + courtBounds.width / 2
      );
    }),
  ).toBe(true);
  await expect(guide.locator(".serve-court__service-box")).toHaveCount(4);
  await expect(guide.locator(".serve-court__nvz")).toHaveCount(2);
  await expect(guide.locator(".serve-court__player-head")).toHaveCount(1);
  await expect(guide.locator(".serve-court__player-torso")).toHaveCount(1);
  await expect(
    guide.locator(".serve-court__service-box.is-active"),
  ).toHaveCount(1);
  expect(
    await guide
      .locator(".serve-court__service-box:not(.is-active)")
      .evaluateAll((boxes) =>
        boxes.every(
          (box) => getComputedStyle(box).backgroundColor === "rgba(0, 0, 0, 0)",
        ),
      ),
  ).toBe(true);
  const courtSize = await court.boundingBox();
  expect(courtSize).not.toBeNull();
  expect(courtSize!.width).toBeGreaterThan(courtSize!.height);
  const fixServe = page.getByRole("button", { name: "Fix serve" });
  await fixServe.click();
  const fixDialog = page.locator("[data-qa='serve-fix-dialog']");
  await expect(fixDialog).toBeVisible();
  await expect(
    fixDialog.getByRole("button", { name: "Keep current serve" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(fixDialog).toBeHidden();
  await expect(fixServe).toBeFocused();
  await page.evaluate(() => {
    const target = window as typeof window & {
      __serveLongTaskObserver?: PerformanceObserver;
      __serveLongTasks?: number[];
    };
    target.__serveLongTasks = [];
    target.__serveLongTaskObserver = new PerformanceObserver((list) => {
      target.__serveLongTasks?.push(
        ...list.getEntries().map((entry) => entry.duration),
      );
    });
    target.__serveLongTaskObserver.observe({ type: "longtask" });
  });
  await page.locator("[data-qa='score-a-add']").click();
  await page.waitForTimeout(300);
  const longestServeTask = await page.evaluate(() => {
    const target = window as typeof window & {
      __serveLongTaskObserver?: PerformanceObserver;
      __serveLongTasks?: number[];
    };
    target.__serveLongTaskObserver?.disconnect();
    return Math.max(0, ...(target.__serveLongTasks ?? []));
  });
  expect(longestServeTask).toBeLessThanOrEqual(50);
  await expect(guide).toContainText("Server 2");
  await expect(guide).not.toContainText("Opening serve");
  await expect(court).toHaveAttribute(
    "aria-label",
    /left service box on the left end/,
  );
  await expect(court).toHaveClass(/serve-court--far-left/);
  await page.locator("[data-qa='score-b-add']").click();
  await expect(guide).toContainText("Blair");
  await expect(guide).toContainText("Server 1");
  await expect(court).toHaveAttribute(
    "aria-label",
    /right service box on the right end/,
  );
  await expect(court).toHaveClass(/serve-court--near-right/);
  expect(
    await court.evaluate((element) => {
      const surface = element
        .querySelector<HTMLElement>(".serve-court__surface")!
        .getBoundingClientRect();
      const marker = element
        .querySelector<HTMLElement>(".serve-court__player-marker")!
        .getBoundingClientRect();
      return marker.left - surface.right;
    }),
  ).toBeGreaterThanOrEqual(1);
  await page.getByRole("button", { name: "Undo last rally" }).first().click();
  await expect(guide).toContainText("Alex");
  await expect(court).toHaveAttribute(
    "aria-label",
    /left service box on the left end/,
  );
  await expect(court).toHaveClass(/serve-court--far-left/);
  expect(
    await court.evaluate((element) => {
      const surface = element
        .querySelector<HTMLElement>(".serve-court__surface")!
        .getBoundingClientRect();
      const marker = element
        .querySelector<HTMLElement>(".serve-court__player-marker")!
        .getBoundingClientRect();
      return surface.left - marker.right;
    }),
  ).toBeGreaterThanOrEqual(1);
  await expect(
    page.getByText("Undo rally", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Won rally", { exact: true }).first(),
  ).toBeVisible();
  expect(
    await page
      .locator(".serve-court__player-marker")
      .evaluate((element) => getComputedStyle(element).transitionDuration),
  ).toContain("0.22s");
  expect(
    await page.locator(".serve-court__player-marker").evaluate((element) => {
      const marker = getComputedStyle(element);
      const head = getComputedStyle(
        element.querySelector<HTMLElement>(".serve-court__player-head")!,
      );
      const torso = getComputedStyle(
        element.querySelector<HTMLElement>(".serve-court__player-torso")!,
      );
      return {
        background: marker.backgroundColor,
        boxShadow: marker.boxShadow,
        head: head.backgroundColor,
        torso: torso.backgroundColor,
      };
    }),
  ).toEqual({
    background: "rgba(0, 0, 0, 0)",
    boxShadow: "none",
    head: "rgb(200, 255, 61)",
    torso: "rgb(200, 255, 61)",
  });
  expect(
    await guide
      .locator(".serve-court__service-box.is-active")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("serve-box-pulse");

  const scoreLayout = await page.locator(".score-side-a").evaluate((side) => {
    const bounds = side.getBoundingClientRect();
    const box = (selector: string) =>
      side.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
    const name = box(".score-player");
    const hint = box(".score-hint");
    const score = box(".score-number");
    const controls = box(".score-stepper");
    return {
      centerDelta: Math.abs(
        score.left + score.width / 2 - (bounds.left + bounds.width / 2),
      ),
      controlsTop: controls.top,
      fontSize: Number.parseFloat(
        getComputedStyle(side.querySelector(".score-number")!).fontSize,
      ),
      hintBottom: hint.bottom,
      nameBottom: name.bottom,
      nameTop: name.top,
      scoreBottom: score.bottom,
      scoreTop: score.top,
      sideTop: bounds.top,
    };
  });
  expect(scoreLayout.centerDelta).toBeLessThanOrEqual(2);
  expect(scoreLayout.fontSize).toBeGreaterThanOrEqual(90);
  expect(scoreLayout.nameTop - scoreLayout.sideTop).toBeGreaterThanOrEqual(8);
  expect(scoreLayout.nameBottom).toBeLessThanOrEqual(scoreLayout.scoreTop);
  expect(scoreLayout.hintBottom).toBeLessThanOrEqual(scoreLayout.scoreTop);
  expect(scoreLayout.scoreBottom).toBeLessThanOrEqual(scoreLayout.controlsTop);
  const buttonHeights = await page
    .locator(".score-stepper button, .match-controls .control-button")
    .evaluateAll((buttons) =>
      buttons.map((button) => button.getBoundingClientRect().height),
    );
  expect(buttonHeights.every((height) => height >= 44 && height <= 48)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Swap sides" }).click();
  await expect(page.locator(".score-side").first()).toContainText("Blair");
  await expect(page.locator(".score-side").first()).toContainText("0");
  await expect(page.locator(".score-side").last()).toContainText("Alex");
  await expect(page.locator(".score-side").last()).toContainText("1");
  await expect(court).toHaveAttribute(
    "aria-label",
    /left service box on the right end/,
  );
  await expect(court).toHaveClass(/serve-court--near-left/);
  await page.waitForTimeout(100);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".score-side").first()).toContainText("Blair");
  await expect(court).toHaveClass(/serve-court--near-left/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    Number.parseFloat(
      await page
        .locator(".serve-court__player-marker")
        .evaluate((element) => getComputedStyle(element).transitionDuration),
    ),
  ).toBeLessThan(0.001);
  expect(
    await guide
      .locator(".serve-court__service-box.is-active")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.waitForTimeout(400);
  await page.screenshot({
    path: "test-results/frontend-captures/quick-live-swapped-mobile.png",
  });
});
