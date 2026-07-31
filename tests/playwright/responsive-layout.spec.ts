import { expect, test } from "@playwright/test";
import { openRoute, routeMap } from "./frontend-harness-support";

const responsiveViewports = [
  { name: "ipad-landscape", width: 1180, height: 820 },
  { name: "ipad-portrait", width: 820, height: 1180 },
  { name: "phone-landscape", width: 844, height: 390 },
] as const;

const routes = ["home", "setup", "bracket"] as const;

for (const viewport of responsiveViewports) {
  test.describe(viewport.name, () => {
    test.use({ viewport });

    for (const routeName of routes) {
      test(`${routeName} stays usable without page-level overflow`, async ({
        page,
      }) => {
        await page.addInitScript(() => window.localStorage.clear());
        const route = routeMap.routes.find(({ name }) => name === routeName);
        if (!route) throw new Error(`Missing ${routeName} route contract.`);

        await openRoute(page, route);
        await expect(page.locator("main")).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);

        if (routeName === "setup") {
          const controls = page.locator(
            ".setup-time-fields .setup-number-input",
          );
          const tops = await controls.evaluateAll((elements) =>
            elements.map((element) =>
              Math.round(element.getBoundingClientRect().top),
            ),
          );
          expect(new Set(tops).size).toBe(1);
        }

        if (routeName === "bracket") {
          await expect
            .poll(async () => {
              const viewportBox = await page
                .locator(".bracket-tree-viewport")
                .boundingBox();
              const finalBox = await page
                .locator("[data-qa='final-match']")
                .boundingBox();
              if (!viewportBox || !finalBox) return Number.POSITIVE_INFINITY;
              const viewportCenter = viewportBox.x + viewportBox.width / 2;
              const finalCenter = finalBox.x + finalBox.width / 2;
              return Math.abs(viewportCenter - finalCenter);
            })
            .toBeLessThan(6);
        }

        await page.screenshot({
          animations: "disabled",
          fullPage: true,
          path: `test-results/responsive/${viewport.name}-${routeName}.png`,
        });
      });
    }
  });
}
