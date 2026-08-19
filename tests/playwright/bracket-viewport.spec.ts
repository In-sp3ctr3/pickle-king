import { expect, test } from "@playwright/test";
import { openRoute, routeMap } from "./frontend-harness-support";

const bracketRoute = routeMap.routes.find(({ name }) => name === "bracket")!;

test.use({ viewport: { height: 844, width: 390 } });

test("bracket viewport interactions avoid long main-thread tasks", async ({
  page,
}) => {
  await page.addInitScript(() => window.localStorage.clear());
  await openRoute(page, bracketRoute);
  await page.evaluate(() => {
    const target = window as typeof window & {
      __bracketLongTasks?: number[];
      __bracketObserver?: PerformanceObserver;
    };
    target.__bracketLongTasks = [];
    target.__bracketObserver = new PerformanceObserver((list) => {
      target.__bracketLongTasks!.push(
        ...list.getEntries().map(({ duration }) => duration),
      );
    });
    target.__bracketObserver.observe({ type: "longtask" });
  });

  await page.getByRole("button", { name: "Fit", exact: true }).click();
  await page.getByRole("button", { name: "Reset zoom to 100%" }).click();
  await page.getByRole("button", { name: "Zoom in" }).click();
  await page.locator(".bracket-tree-viewport").press("f");
  await page.waitForTimeout(100);

  const longestTask = await page.evaluate(() =>
    Math.max(
      0,
      ...((window as typeof window & { __bracketLongTasks?: number[] })
        .__bracketLongTasks ?? []),
    ),
  );
  expect(longestTask).toBeLessThanOrEqual(50);
});
